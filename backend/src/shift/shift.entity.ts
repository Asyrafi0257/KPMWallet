import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    ManyToOne,
    JoinColumn,
} from 'typeorm';

import { User } from '../users/user.entity';

@Entity('shift')
export class Shift {
    @PrimaryGeneratedColumn()
    shift_id: number;

    @ManyToOne(() => User)
    @JoinColumn({ 
        name: 'user_id',
        referencedColumnName: 'user_id'
     })
    user: User;

    @Column({ type: 'date' })
    date: Date;

    @Column({ type: 'time', nullable: true })
    start_shift: string | null;

    @Column({ type: 'time', nullable: true })
    end_shift: string | null;

    @Column({ type: 'decimal', precision: 10, scale: 2 })
    starting_cash: number;

    @Column({
        type: 'enum',
        enum: ['OPEN', 'CLOSED'],
        default: 'OPEN',
    })
    shift_status: 'OPEN' | 'CLOSED';
}