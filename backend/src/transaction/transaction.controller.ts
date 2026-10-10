
import {
  Body,
  Controller,
  Post,
  BadRequestException,
  ParseIntPipe,
} from '@nestjs/common';

import { TransactionService } from './transaction.service';

@Controller('transaction')
export class TransactionController {
  constructor(
    private readonly transactionService: TransactionService,
  ) {}

  @Post()
  async create(
    @Body('shift_id', ParseIntPipe) shift_id: number,
    @Body('payment') payment: 'Cash' | 'QR',
    @Body('amount') amount: number,
  ) {
    if (payment !== 'Cash' && payment !== 'QR') {
      throw new BadRequestException(
        'Payment must be Cash or QR',
      );
    }

    if (
      amount === undefined ||
      amount === null ||
      !Number.isFinite(Number(amount)) ||
      Number(amount) <= 0
    ) {
      throw new BadRequestException(
        'Amount must be greater than zero',
      );
    }

    return this.transactionService.create({
      shift_id,
      payment,
      amount: Number(amount),
    });
  }
}