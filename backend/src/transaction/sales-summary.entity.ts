import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  OneToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Shift } from '../shift/shift.entity';

const decimalNumberTransformer = {
  to: (value: number) => value,
  from: (value: string | number) => Number(value),
};

@Entity('sales')
export class SalesSummary {
  @PrimaryGeneratedColumn()
  sales_id: number;

  @OneToOne(() => Shift, { nullable: false })
  @JoinColumn({ name: 'shift_id' })
  shift: Shift;

  @Column({ type: 'decimal', precision: 10, scale: 2, transformer: decimalNumberTransformer })
  starting_cash: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, transformer: decimalNumberTransformer })
  cash_sales: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, transformer: decimalNumberTransformer })
  qr_sales: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, transformer: decimalNumberTransformer })
  total_sales: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, transformer: decimalNumberTransformer })
  expected_cash: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, transformer: decimalNumberTransformer })
  closing_cash: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, transformer: decimalNumberTransformer })
  discrepancy: number;

  @Column({ type: 'int', unsigned: true })
  transaction_count: number;

  @CreateDateColumn()
  created_at: Date;
}
