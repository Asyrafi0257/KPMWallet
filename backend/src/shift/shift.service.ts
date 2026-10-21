import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { Shift } from './shift.entity';
import { Transaction } from '../transaction/transaction.entity';
import { SalesSummary } from '../transaction/sales-summary.entity';


@Injectable()
export class ShiftService {
    constructor(
    @InjectRepository(Shift)
    private readonly shiftRepository: Repository<Shift>,
    private readonly dataSource: DataSource,
  ) {}

  async createShift(data: {
    user_id: number;
    date: Date;
    start_shift: string;
    end_shift: string;
    starting_cash: number;
  }) {
    const activeShift = await this.shiftRepository.findOne({
      where: { user: { user_id: data.user_id }, shift_status: 'OPEN' },
    });
    if (activeShift) {
      throw new ConflictException('You already have an active shift');
    }

    const shift = this.shiftRepository.create({
      user: { user_id: data.user_id },
      date: data.date,
      start_shift: data.start_shift,
      end_shift: data.end_shift,
      starting_cash: data.starting_cash,
      shift_status: 'OPEN',
      
    });
  
  //bila kita try console then nampak shift_id jadi undefined kerana shift id blm di save lagi dalam database
  //console.log("Shift:", Shift);

   const savedShift = await this.shiftRepository.save(shift);

   //so dekat sini bila dh save maklumat shift then shift id akan automatik create shift id
  // console.log('Saved shift:', savedShift);
  // console.log('Generated ID:', savedShift.shift_id);
  return savedShift;
  }

  async endCurrentShift(userId: number, closingCash: number) {
    if (!Number.isFinite(closingCash) || closingCash < 0) {
      throw new ConflictException('Closing cash must be a valid non-negative amount');
    }

    return this.dataSource.transaction(async (manager) => {
      const shiftRepository = manager.getRepository(Shift);
      const shift = await shiftRepository.findOne({
        where: { user: { user_id: userId }, shift_status: 'OPEN' },
        order: { shift_id: 'DESC' },
        lock: { mode: 'pessimistic_write' },
      });
      if (!shift) throw new NotFoundException('There is no active shift to end');

      const transactions = await manager.getRepository(Transaction).find({
        where: { shift: { shift_id: shift.shift_id } },
      });
      const cashSalesCents = transactions.reduce(
        (sum, transaction) => sum + (transaction.payment === 'Cash' ? Math.round(Number(transaction.amount) * 100) : 0),
        0,
      );
      const qrSalesCents = transactions.reduce(
        (sum, transaction) => sum + (transaction.payment === 'QR' ? Math.round(Number(transaction.amount) * 100) : 0),
        0,
      );
      const startingCashCents = Math.round(Number(shift.starting_cash) * 100);
      const totalSalesCents = cashSalesCents + qrSalesCents;
      const expectedCashCents = startingCashCents + cashSalesCents;
      const closingCashCents = Math.round(closingCash * 100);

      const sales = manager.getRepository(SalesSummary).create({
        shift,
        starting_cash: startingCashCents / 100,
        cash_sales: cashSalesCents / 100,
        qr_sales: qrSalesCents / 100,
        total_sales: totalSalesCents / 100,
        expected_cash: expectedCashCents / 100,
        closing_cash: closingCashCents / 100,
        discrepancy: (closingCashCents - expectedCashCents) / 100,
        transaction_count: transactions.length,
      });
      const savedSales = await manager.getRepository(SalesSummary).save(sales);

      shift.shift_status = 'CLOSED';
      shift.closing_cash = closingCashCents / 100;
      shift.closed_at = new Date();
      const closedShift = await shiftRepository.save(shift);

      return { ...closedShift, sales: savedSales };
    });
  }

  //kita nak ambil current shift
  

async getCurrentShift(userId: number) {
    return this.shiftRepository.findOne({
        where: {
            user: { user_id: userId },
            shift_status: 'OPEN',
        },
        order: {
            shift_id: 'DESC',
        },
    });
}

  async getShiftHistory(userId: number) {
    return this.shiftRepository.find({
      where: { user: { user_id: userId }, shift_status: 'CLOSED' },
      order: { shift_id: 'DESC' },
    });
  }

  async getSalesHistory(
    userId: number,
    period: 'today' | 'week' | 'month' | 'all',
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
      .getRepository(SalesSummary)
      .createQueryBuilder('sales')
      .innerJoinAndSelect('sales.shift', 'shift')
      .innerJoin('shift.user', 'user')
      .where('user.user_id = :userId', { userId })
      .orderBy('sales.sales_id', 'DESC')
      ;

    if (period !== 'all') {
      query.andWhere('sales.created_at >= :from AND sales.created_at <= :to', { from, to: now });
    }

    const trimmedSearch = search.trim();
    if (trimmedSearch) {
      const matchingShifts = await this.dataSource
        .getRepository(Transaction)
        .createQueryBuilder('transaction')
        .select('DISTINCT shift.shift_id', 'shift_id')
        .innerJoin('transaction.shift', 'shift')
        .innerJoin('shift.user', 'transactionUser')
        .where('transactionUser.user_id = :userId', { userId })
        .andWhere(
          '(CAST(transaction.transaction_id AS CHAR) LIKE :search OR transaction.transaction_code LIKE :search)',
          { search: `%${trimmedSearch}%` },
        )
        .getRawMany<{ shift_id: number }>();
      const shiftIds = matchingShifts.map((row) => Number(row.shift_id));
      if (shiftIds.length === 0) return [];
      query.andWhere('shift.shift_id IN (:...shiftIds)', { shiftIds });
    }

    const rows = await query.getMany();

    return rows.map((sales) => ({
      sales_id: sales.sales_id,
      shift_id: sales.shift.shift_id,
      date: sales.shift.date,
      start_shift: sales.shift.start_shift,
      end_shift: sales.shift.end_shift,
      closed_at: sales.shift.closed_at,
      starting_cash: sales.starting_cash,
      cash_sales: sales.cash_sales,
      qr_sales: sales.qr_sales,
      total_sales: sales.total_sales,
      expected_cash: sales.expected_cash,
      closing_cash: sales.closing_cash,
      discrepancy: sales.discrepancy,
      transaction_count: sales.transaction_count,
      created_at: sales.created_at,
    }));
  }

  async getClosedShiftHistory(
    userId: number,
    period: 'today' | 'week' | 'month' | 'all',
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

    const allClosedShifts = await this.shiftRepository.find({
      where: { user: { user_id: userId }, shift_status: 'CLOSED' },
      order: { shift_id: 'DESC' },
    });
    let shifts = allClosedShifts.filter((shift) => {
      // Filter by the shift date shown in the list, not the time it was closed.
      const activityDate = new Date(shift.date);
      activityDate.setHours(0, 0, 0, 0);
      return period === 'all' || (activityDate >= from && activityDate <= now);
    });

    const trimmedSearch = search.trim();
    if (trimmedSearch) {
      const matches = await this.dataSource
        .getRepository(Transaction)
        .createQueryBuilder('transaction')
        .select('DISTINCT shift.shift_id', 'shift_id')
        .innerJoin('transaction.shift', 'shift')
        .innerJoin('shift.user', 'user')
        .where('user.user_id = :userId', { userId })
        .andWhere('shift.shift_status = :closed', { closed: 'CLOSED' })
        .andWhere(
          '(CAST(transaction.transaction_id AS CHAR) LIKE :search OR transaction.transaction_code LIKE :search)',
          { search: `%${trimmedSearch}%` },
        )
        .getRawMany<{ shift_id: number }>();
      const matchingIds = new Set(matches.map((row) => Number(row.shift_id)));
      shifts = shifts.filter((shift) => matchingIds.has(shift.shift_id));
    }

    if (shifts.length === 0) return [];

    const shiftIds = shifts.map((shift) => shift.shift_id);
    const transactions = await this.dataSource
      .getRepository(Transaction)
      .createQueryBuilder('transaction')
      .innerJoinAndSelect('transaction.shift', 'shift')
      .leftJoinAndSelect('transaction.items', 'transactionItem')
      .where('shift.shift_id IN (:...shiftIds)', { shiftIds })
      .orderBy('transaction.created_at', 'DESC')
      .getMany();
    const summaries = await this.dataSource
      .getRepository(SalesSummary)
      .createQueryBuilder('sales')
      .innerJoinAndSelect('sales.shift', 'salesShift')
      .where('salesShift.shift_id IN (:...shiftIds)', { shiftIds })
      .getMany();
    const transactionsByShift = new Map<number, Transaction[]>();
    transactions.forEach((transaction) => {
      const shiftId = transaction.shift.shift_id;
      transactionsByShift.set(shiftId, [...(transactionsByShift.get(shiftId) ?? []), transaction]);
    });
    const summariesByShift = new Map(summaries.map((summary) => [summary.shift.shift_id, summary]));

    return shifts.map((shift) => {
      const summary = summariesByShift.get(shift.shift_id);
      return {
        shift_id: shift.shift_id,
        date: shift.date,
        start_shift: shift.start_shift,
        end_shift: shift.end_shift,
        closed_at: shift.closed_at,
        shift_status: shift.shift_status,
        sales_summary: summary ? {
          starting_cash: summary.starting_cash,
          cash_sales: summary.cash_sales,
          qr_sales: summary.qr_sales,
          total_sales: summary.total_sales,
          expected_cash: summary.expected_cash,
          closing_cash: summary.closing_cash,
          discrepancy: summary.discrepancy,
          transaction_count: summary.transaction_count,
        } : null,
        transactions: (transactionsByShift.get(shift.shift_id) ?? []).map((transaction) => ({
          transaction_id: transaction.transaction_id,
          transaction_code: transaction.transaction_code,
          payment: transaction.payment,
          amount: Number(transaction.amount),
          created_at: transaction.created_at,
          items: (transaction.items ?? []).map((item) => ({
            item_name: item.item_name,
            quantity: item.quantity,
          })),
        })),
      };
    });
  }


}
