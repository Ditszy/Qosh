import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';
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

    @Column({ type: 'timestamptz', default: () => 'CURRENT_TIMESTAMP' })
    createdAt!: Date;

    @Column({ type: 'timestamptz', default: () => 'CURRENT_TIMESTAMP' })
    updatedAt!: Date;
}
