import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  OneToOne,
} from 'typeorm';
import { Parent } from './parent.entity';
import { School } from './school.entity';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn()
  user_id: number;

  @Column({unique:true})
  nric: string

  @Column({ unique: true })
  email: string;

  @Column()
  role: string;

  @Column()
  password: string;

  @Column({ nullable: true })
  username: string;

  @Column({ nullable: true })
  address: string;

  @Column({ type: 'date', nullable: true })
  date_of_birth: string | null;

  @Column({ nullable: true })
  gender: string;

  @Column({ nullable: true })
  nationality: string;

  @Column({ nullable: true })
  class_name: string;

  @OneToOne(() => Parent, (parent) => parent.user)
  parent: Parent;

  @OneToOne(() => School, (school) => school.user)
  school: School;

  @CreateDateColumn()
  created_at: Date;
}
