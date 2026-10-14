
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';

import { User } from '../users/user.entity';

@Entity('otp_verifications')
export class OtpVerification {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id', referencedColumnName: 'user_id' })
  user: User;

  @Column({ length: 255 })
  otp_hash: string;

  @Column({ length: 30 })
  purpose: string;

  @Column({ type: 'datetime' })
  expires_at: Date;

  @Column({ default: false })
  verified: boolean;

  @Column({ default: false })
  used: boolean;

  @CreateDateColumn()
  created_at: Date;
}
