import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn, Unique, UpdateDateColumn } from 'typeorm';
import { Tournament } from '../tournaments/tournament.entity';

@Entity('teams')
@Unique(['tournamentId', 'name'])
export class Team {
    @PrimaryGeneratedColumn('uuid')
    id!: string;

    @Column()
    name!: string;

    @Column({ type: 'uuid' })
    tournamentId!: string;

    @ManyToOne(() => Tournament, { nullable: false })
    @JoinColumn({ name: 'tournamentId' })
    tournament!: Tournament;

    @CreateDateColumn({ type: 'timestamptz' })
    createdAt!: Date;

    @UpdateDateColumn({ type: 'timestamptz' })
    updatedAt!: Date;
}
