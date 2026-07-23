import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';
import { User } from '../users/user.entity';
import { TournamentStatus } from './tournament-status.enum';

@Entity('tournaments')
export class Tournament {
    @PrimaryGeneratedColumn('uuid')
    id!: string;

    @Column()
    name!: string;

    @Column({ type: 'text', nullable: true })
    description!: string | null;

    @Column()
    location!: string;

    @Column({ type: 'timestamptz' })
    startsAt!: Date;

    @Column({ type: 'int', default: 8 })
    maxTeams!: number;

    @Column({ type: 'enum', enum: TournamentStatus, default: TournamentStatus.DRAFT })
    status!: TournamentStatus;

    @Column({ type: 'uuid' })
    organizerId!: string;

    @ManyToOne(() => User, { nullable: false })
    @JoinColumn({ name: 'organizerId' })
    organizer!: User;

    @CreateDateColumn({ type: 'timestamptz' })
    createdAt!: Date;

    @UpdateDateColumn({ type: 'timestamptz' })
    updatedAt!: Date;
}
