
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { Transaction } from './transaction.entity';
import { Shift } from '../shift/shift.entity';

@Injectable()
export class TransactionService {
  constructor(
    @InjectRepository(Transaction)
    private readonly transactionRepository: Repository<Transaction>,

    @InjectRepository(Shift)
    private readonly shiftRepository: Repository<Shift>,
  ) {}

  async create(data: {
    shift_id: number;
    payment: 'Cash' | 'QR';
    amount: number;
  }) {
    const shift = await this.shiftRepository.findOne({
      where: {
        shift_id: data.shift_id,
      },
    });

    if (!shift) {
      throw new Error('Shift not found');
    }

    const transaction = this.transactionRepository.create({
      shift,
      payment: data.payment,
      amount: data.amount,
    });

    return this.transactionRepository.save(transaction);
  }
}