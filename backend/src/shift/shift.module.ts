import { Module } from '@nestjs/common';
import { ShiftController } from './shift.controller';
import { ShiftService } from './shift.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Shift } from './shift.entity';
import { SalesSummary } from '../transaction/sales-summary.entity';
import { Transaction } from '../transaction/transaction.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Shift, Transaction, SalesSummary])],
  controllers: [ShiftController],
  providers: [ShiftService]
})
export class ShiftModule {}
