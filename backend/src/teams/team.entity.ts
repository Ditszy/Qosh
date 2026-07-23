import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, OneToMany, PrimaryGeneratedColumn, Unique, UpdateDateColumn } from 'typeorm';
import { Tournament } from '../tournaments/tournament.entity';
import { TeamInvite } from './team-invite.entity';
import { TeamMember } from './team-member.entity';

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

    @OneToMany(() => TeamMember, (member) => member.team)
    members!: TeamMember[];

    @OneToMany(() => TeamInvite, (invite) => invite.team)
    invites!: TeamInvite[];

    @CreateDateColumn({ type: 'timestamptz' })
    createdAt!: Date;

    @UpdateDateColumn({ type: 'timestamptz' })
    updatedAt!: Date;
}
