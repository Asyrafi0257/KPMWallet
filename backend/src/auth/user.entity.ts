import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
} from 'typeorm';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({unique:true})
  nric: string

  @Column({ unique: true })
  email: string;

  @Column()
  role: string;

  @Column()
  password: string;

  @CreateDateColumn()
  created_at: Date;
}