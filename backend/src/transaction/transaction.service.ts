import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { DataSource, In } from 'typeorm';
import { Item } from '../items/item.entity';
import { Shift } from '../shift/shift.entity';
import { TransactionItem } from './transaction-item.entity';
import { Transaction } from './transaction.entity';
import { SalesSummary } from './sales-summary.entity';

export type CreateTransactionInput = {
  payment: 'Cash' | 'QR';
  amount_received: number;
  userId: number;
  items: Array<{ item_id: number; quantity: number }>;
};

@Injectable()
export class TransactionService {
  constructor(
    private readonly dataSource: DataSource,
  ) {}

  async getCurrentShiftSales(userId: number) {
    const shiftRepository = this.dataSource.getRepository(Shift);
    const shift = await shiftRepository.findOne({
      where: { user: { user_id: userId }, shift_status: 'OPEN' },
      order: { shift_id: 'DESC' },
    });

    if (!shift) {
      return {
        hasActiveShift: false,
        starting_cash: 0,
        summary: {
          total_sales: 0,
          transaction_count: 0,
          cash_total: 0,
          qr_total: 0,
          expected_cash: 0,
        },
        transactions: [],
      };
    }

    const transactions = await this.dataSource.getRepository(Transaction).find({
      where: { shift: { shift_id: shift.shift_id } },
      relations: { items: true },
      order: { created_at: 'DESC' },
    });

    const cashTotal = transactions
      .filter((transaction) => transaction.payment === 'Cash')
      .reduce((sum, transaction) => sum + Number(transaction.amount), 0);
    const qrTotal = transactions
      .filter((transaction) => transaction.payment === 'QR')
      .reduce((sum, transaction) => sum + Number(transaction.amount), 0);

    return {
      hasActiveShift: true,
      shift_id: shift.shift_id,
      starting_cash: Number(shift.starting_cash),
      summary: {
        total_sales: cashTotal + qrTotal,
        transaction_count: transactions.length,
        cash_total: cashTotal,
        qr_total: qrTotal,
        expected_cash: Number(shift.starting_cash) + cashTotal,
      },
      transactions: transactions.map((transaction) => ({
        transaction_id: transaction.transaction_id,
        transaction_code: transaction.transaction_code,
        payment: transaction.payment,
        amount: Number(transaction.amount),
        created_at: transaction.created_at,
        items: transaction.items.map((item) => ({
          name: item.item_name,
          quantity: item.quantity,
        })),
      })),
    };
  }

  async getTransactionHistory(
    userId: number,
    period: 'today' | 'week' | 'month',
    search = '',
  ) {
    const now = new Date();
    const from = new Date(now);
    from.setHours(0, 0, 0, 0);

    if (period === 'week') {
      const daysSinceMonday = (from.getDay() + 6) % 7;
      from.setDate(from.getDate() - daysSinceMonday);
    } else if (period === 'month') {
      from.setDate(1);
    }

    const query = this.dataSource
      .getRepository(Transaction)
      .createQueryBuilder('transaction')
      .innerJoinAndSelect('transaction.shift', 'shift')
      .innerJoin('shift.user', 'user')
      .leftJoinAndSelect('transaction.items', 'transactionItem')
      .where('user.user_id = :userId', { userId })
      .andWhere('transaction.created_at >= :from AND transaction.created_at <= :to', { from, to: now })
      .orderBy('transaction.created_at', 'DESC');

    const trimmedSearch = search.trim();
    if (trimmedSearch) {
      query.andWhere(
        '(CAST(transaction.transaction_id AS CHAR) LIKE :search OR transaction.transaction_code LIKE :search)',
        { search: `%${trimmedSearch}%` },
      );
    }

    const transactions = await query.getMany();
    const shiftIds = [...new Set(transactions.map((transaction) => transaction.shift.shift_id))];
    const summaries = shiftIds.length
      ? await this.dataSource.getRepository(SalesSummary)
        .createQueryBuilder('sales')
        .innerJoinAndSelect('sales.shift', 'salesShift')
        .where('salesShift.shift_id IN (:...shiftIds)', { shiftIds })
        .getMany()
      : [];
    const summaryByShiftId = new Map(summaries.map((summary) => [summary.shift.shift_id, summary]));

    return transactions.map((transaction) => {
      const shift = transaction.shift;
      const sales = summaryByShiftId.get(shift.shift_id);
      return {
        transaction_id: transaction.transaction_id,
        transaction_code: transaction.transaction_code,
        payment: transaction.payment,
        amount: Number(transaction.amount),
        amount_received: Number(transaction.amount_received),
        change_amount: Number(transaction.change_amount),
        created_at: transaction.created_at,
        items: (transaction.items ?? []).map((item) => ({
          name: item.item_name,
          quantity: item.quantity,
          unit_price: Number(item.unit_price),
          line_total: Number(item.line_total),
        })),
        shift: {
          shift_id: shift.shift_id,
          date: shift.date,
          start_shift: shift.start_shift,
          end_shift: shift.end_shift,
          closed_at: shift.closed_at,
          shift_status: shift.shift_status,
        },
        sales_summary: sales ? {
          starting_cash: sales.starting_cash,
          cash_sales: sales.cash_sales,
          qr_sales: sales.qr_sales,
          total_sales: sales.total_sales,
          expected_cash: sales.expected_cash,
          closing_cash: sales.closing_cash,
          discrepancy: sales.discrepancy,
          transaction_count: sales.transaction_count,
        } : null,
      };
    });
  }

  async create(data: CreateTransactionInput) {
    if (!Array.isArray(data.items) || data.items.length === 0) {
      throw new BadRequestException('At least one item is required');
    }

    const quantities = new Map<number, number>();
    for (const line of data.items) {
      if (!Number.isInteger(line.item_id) || line.item_id <= 0) {
        throw new BadRequestException('Each item_id must be a positive integer');
      }
      if (!Number.isInteger(line.quantity) || line.quantity <= 0) {
        throw new BadRequestException('Each quantity must be a positive integer');
      }
      quantities.set(line.item_id, (quantities.get(line.item_id) ?? 0) + line.quantity);
    }

    const receivedCents = Math.round(Number(data.amount_received) * 100);
    if (!Number.isFinite(receivedCents) || receivedCents <= 0) {
      throw new BadRequestException('Amount received must be greater than zero');
    }

    return this.dataSource.transaction(async (manager) => {
      const shift = await manager.getRepository(Shift).findOne({
        where: { user: { user_id: data.userId }, shift_status: 'OPEN' },
        order: { shift_id: 'DESC' },
      });
      if (!shift) {
        throw new BadRequestException('Open a shift before recording a sale');
      }

      const itemIds = [...quantities.keys()];
      const products = await manager.getRepository(Item).find({
        where: { item_id: In(itemIds), is_active: true },
        lock: { mode: 'pessimistic_write' },
      });
      if (products.length !== itemIds.length) {
        throw new NotFoundException('One or more items are unavailable');
      }

      let totalCents = 0;
      const lines = products.map((product) => {
        const quantity = quantities.get(product.item_id)!;
        if (product.stock < quantity) {
          throw new BadRequestException(`Not enough stock for ${product.name}`);
        }
        const unitPriceCents = Math.round(Number(product.price) * 100);
        const lineTotalCents = unitPriceCents * quantity;
        totalCents += lineTotalCents;
        return { product, quantity, unitPriceCents, lineTotalCents };
      });

      if (receivedCents < totalCents) {
        throw new BadRequestException('Amount received is less than the sale total');
      }
      if (data.payment === 'QR' && receivedCents !== totalCents) {
        throw new BadRequestException('QR payment amount must match the sale total');
      }

      const totalAmount = totalCents / 100;
      const amountReceived = receivedCents / 100;
      const transaction = manager.getRepository(Transaction).create({
        transaction_code: `KPM-${Date.now()}-${randomUUID().slice(0, 8).toUpperCase()}`,
        shift,
        payment: data.payment,
        amount: totalAmount,
        amount_received: amountReceived,
        change_amount: data.payment === 'Cash' ? (receivedCents - totalCents) / 100 : 0,
      });
      const savedTransaction = await manager.getRepository(Transaction).save(transaction);

      for (const line of lines) line.product.stock -= line.quantity;
      await manager.getRepository(Item).save(lines.map((line) => line.product));

      const transactionLines = lines.map((line) => manager.getRepository(TransactionItem).create({
        transaction: savedTransaction,
        item: line.product,
        item_name: line.product.name,
        quantity: line.quantity,
        unit_price: line.unitPriceCents / 100,
        line_total: line.lineTotalCents / 100,
      }));
      const savedLines = await manager.getRepository(TransactionItem).save(transactionLines);

      return {
        transaction_id: savedTransaction.transaction_id,
        transaction_code: savedTransaction.transaction_code,
        payment: savedTransaction.payment,
        amount: savedTransaction.amount,
        amount_received: savedTransaction.amount_received,
        change_amount: savedTransaction.change_amount,
        created_at: savedTransaction.created_at,
        items: savedLines.map((line) => ({
          item_id: line.item.item_id,
          name: line.item_name,
          quantity: line.quantity,
          unit_price: line.unit_price,
          line_total: line.line_total,
        })),
      };
    });
  }
}
