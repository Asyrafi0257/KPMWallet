import { Column, Entity, JoinColumn, OneToOne, PrimaryGeneratedColumn } from 'typeorm';
import { User } from './user.entity';

@Entity('parents')
export class Parent {
  @PrimaryGeneratedColumn()
  parent_id: number;

  @OneToOne(() => User, (user) => user.parent, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ nullable: true })
  mother_full_name: string;

  @Column({ nullable: true })
  mother_identification_number: string;

  @Column({ nullable: true })
  mother_phone_number: string;

  @Column({ nullable: true })
  mother_email: string;

  @Column({ nullable: true })
  mother_occupation: string;

  @Column({ nullable: true })
  father_full_name: string;

  @Column({ nullable: true })
  father_identification_number: string;

  @Column({ nullable: true })
  father_phone_number: string;

  @Column({ nullable: true })
  father_email: string;

  @Column({ nullable: true })
  father_occupation: string;

  @Column({ nullable: true })
  guardian_full_name: string;

  @Column({ nullable: true })
  guardian_relationship: string;

  @Column({ nullable: true })
  guardian_phone_number: string;

  @Column({ nullable: true })
  guardian_email: string;
}
