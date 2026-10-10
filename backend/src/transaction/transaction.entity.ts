
import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { Shift } from '../shift/shift.entity';

@Entity('transaction')
export class Transaction {
  @PrimaryGeneratedColumn()
  transaction_id: number;

  @ManyToOne(() => Shift, { nullable: false })
  @JoinColumn({ name: 'shift_id' })
  shift: Shift;

  @Column({
    type: 'enum',
    enum: ['Cash', 'QR'],
  })
  payment: string;

  @Column({
    type: 'decimal',
    precision: 10,
    scale: 2,
  })
  amount: number;
}