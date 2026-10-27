import { Column, Entity, JoinColumn, OneToOne, PrimaryGeneratedColumn } from 'typeorm';
import { User } from './user.entity';

@Entity('schools')
export class School {
  @PrimaryGeneratedColumn()
  school_id: number;

  @OneToOne(() => User, (user) => user.school, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ nullable: true })
  school_name: string;

  @Column({ type: 'text', nullable: true })
  school_address: string;
}
