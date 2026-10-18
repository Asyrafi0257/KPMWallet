import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { Request } from 'express';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { TransactionService } from './transaction.service';

type CreateTransactionBody = {
  payment: 'Cash' | 'QR';
  amount_received: number;
  items: Array<{ item_id: number; quantity: number }>;
};

@Controller('transaction')
@UseGuards(JwtAuthGuard)
export class TransactionController {
  constructor(private readonly transactionService: TransactionService) {}

  @Get('current-shift')
  getCurrentShiftSales(
    @Req() req: Request & { user: { userId: number } },
  ) {
    return this.transactionService.getCurrentShiftSales(req.user.userId);
  }

  @Get('history')
  getHistory(
    @Req() req: Request & { user: { userId: number } },
    @Query('period') period = 'today',
    @Query('search') search = '',
  ) {
    if (period !== 'today' && period !== 'week' && period !== 'month') {
      throw new BadRequestException('Period must be today, week, or month');
    }
    return this.transactionService.getTransactionHistory(
      req.user.userId,
      period,
      search,
    );
  }

  @Post()
  create(
    @Body() body: CreateTransactionBody,
    @Req() req: Request & { user: { userId: number } },
  ) {
    if (body.payment !== 'Cash' && body.payment !== 'QR') {
      throw new BadRequestException('Payment must be Cash or QR');
    }
    if (!Number.isFinite(Number(body.amount_received))) {
      throw new BadRequestException('Amount received must be a valid number');
    }

    return this.transactionService.create({
      ...body,
      amount_received: Number(body.amount_received),
      userId: req.user.userId,
    });
  }
}
