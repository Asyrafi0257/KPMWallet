import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Item } from '../items/item.entity';
import { Transaction } from './transaction.entity';

const decimalNumberTransformer = {
  to: (value: number) => value,
  from: (value: string | number) => Number(value),
};

@Entity('transaction_items')
export class TransactionItem {
  @PrimaryGeneratedColumn()
  transaction_item_id: number;

  @ManyToOne(() => Transaction, (transaction) => transaction.items, {
    nullable: false,
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'transaction_id' })
  transaction: Transaction;

  @ManyToOne(() => Item, { nullable: false, onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'item_id' })
  item: Item;

  // Snapshot values keep old receipts accurate if the item is renamed or repriced.
  @Column({ length: 120 })
  item_name: string;

  @Column({ type: 'int', unsigned: true })
  quantity: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, transformer: decimalNumberTransformer })
  unit_price: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, transformer: decimalNumberTransformer })
  line_total: number;
}
