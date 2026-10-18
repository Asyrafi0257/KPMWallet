
import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Shift } from '../shift/shift.entity';
import { TransactionItem } from './transaction-item.entity';

const decimalNumberTransformer = {
  to: (value: number) => value,
  from: (value: string | number) => Number(value),
};

@Entity('transaction')
export class Transaction {
  @PrimaryGeneratedColumn()
  transaction_id: number;

  @Column({ type: 'varchar', unique: true, length: 48, nullable: true })
  transaction_code: string | null;

  @ManyToOne(() => Shift, { nullable: false })
  @JoinColumn({ name: 'shift_id' })
  shift: Shift;

  @Column({
    type: 'enum',
    enum: ['Cash', 'QR'],
  })
  payment: 'Cash' | 'QR';

  @Column({
    type: 'decimal',
    precision: 10,
    scale: 2,
    transformer: decimalNumberTransformer,
  })
  // Total amount charged for this transaction.
  amount: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, transformer: decimalNumberTransformer, default: 0 })
  amount_received: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, transformer: decimalNumberTransformer, default: 0 })
  change_amount: number;

  @CreateDateColumn()
  created_at: Date;

  @OneToMany(() => TransactionItem, (item) => item.transaction, { cascade: true })
  items: TransactionItem[];
}
