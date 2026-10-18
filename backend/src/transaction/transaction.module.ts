import { Module } from '@nestjs/common';
import { TransactionController } from './transaction.controller';
import { TransactionService } from './transaction.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Transaction } from './transaction.entity';
import { Shift } from '../shift/shift.entity';
import { Item } from '../items/item.entity';
import { TransactionItem } from './transaction-item.entity';
import { SalesSummary } from './sales-summary.entity';

@Module({
  imports: [TypeOrmModule.forFeature([
    Transaction,
    TransactionItem,
    SalesSummary,
    Shift,
    Item,
  ])],
  controllers: [TransactionController],
  providers: [TransactionService],
  exports:[TransactionService]
})
export class TransactionModule {}
