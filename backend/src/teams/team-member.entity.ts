import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn, Unique } from 'typeorm';
import { User } from '../users/user.entity';
import { TeamMemberRole } from './team-member-role.enum';
import { Team } from './team.entity';

@Entity('team_members')
@Unique(['teamId', 'userId'])
export class TeamMember {
    @PrimaryGeneratedColumn('uuid')
    id!: string;

    @Column({ type: 'uuid' })
    teamId!: string;

    @ManyToOne(() => Team, { nullable: false })
    @JoinColumn({ name: 'teamId' })
    team!: Team;

    @Column({ type: 'uuid' })
    userId!: string;

    @ManyToOne(() => User, { nullable: false })
    @JoinColumn({ name: 'userId' })
    user!: User;

    @Column({ type: 'enum', enum: TeamMemberRole, default: TeamMemberRole.MEMBER })
    role!: TeamMemberRole;

    @CreateDateColumn({ type: 'timestamptz' })
    joinedAt!: Date;
}
