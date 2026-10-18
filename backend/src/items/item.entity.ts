import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

const decimalNumberTransformer = {
  to: (value: number) => value,
  from: (value: string | number) => Number(value),
};

@Entity('items')
export class Item {
  @PrimaryGeneratedColumn()
  item_id: number;

  @Column({ length: 120 })
  name: string;

  @Column({ type: 'varchar', length: 160, nullable: true })
  description: string | null;

  @Column({
    type: 'enum',
    enum: ['Food & Drink', 'Snacks', 'Stationery'],
  })
  category: 'Food & Drink' | 'Snacks' | 'Stationery';

  @Column({ type: 'decimal', precision: 10, scale: 2, transformer: decimalNumberTransformer })
  price: number;

  @Column({ type: 'int', unsigned: true, default: 0 })
  stock: number;

  @Column({ default: true })
  is_active: boolean;
}
