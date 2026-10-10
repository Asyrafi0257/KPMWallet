import { Module } from '@nestjs/common';
import { TransactionController } from './transaction.controller';
import { TransactionService } from './transaction.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Transaction } from './transaction.entity';
import { Shift } from '../shift/shift.entity';

@Module({
  imports: [TypeOrmModule.forFeature([
    Transaction,
    Shift
  ])],
  controllers: [TransactionController],
  providers: [TransactionService],
  exports:[TransactionService]
})
export class TransactionModule {}
