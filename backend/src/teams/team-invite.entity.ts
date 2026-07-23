import { Column, CreateDateColumn, Entity, Index, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { User } from '../users/user.entity';
import { TeamInviteStatus } from './team-invite-status.enum';
import { Team } from './team.entity';

@Entity('team_invites')
@Index('IDX_team_invite_pending_user', ['teamId', 'invitedUserId'], {
    unique: true,
    where: '"status" = \'PENDING\'',
})
export class TeamInvite {
    @PrimaryGeneratedColumn('uuid')
    id!: string;

    @Column({ type: 'uuid' })
    teamId!: string;

    @ManyToOne(() => Team, { nullable: false })
    @JoinColumn({ name: 'teamId' })
    team!: Team;

    @Column({ type: 'uuid' })
    invitedUserId!: string;

    @ManyToOne(() => User, { nullable: false })
    @JoinColumn({ name: 'invitedUserId' })
    invitedUser!: User;

    @Column({ type: 'uuid' })
    inviterId!: string;

    @ManyToOne(() => User, { nullable: false })
    @JoinColumn({ name: 'inviterId' })
    inviter!: User;

    @Column({ type: 'enum', enum: TeamInviteStatus, default: TeamInviteStatus.PENDING })
    status!: TeamInviteStatus;

    @CreateDateColumn({ type: 'timestamptz' })
    createdAt!: Date;

    @Column({ type: 'timestamptz', nullable: true })
    respondedAt!: Date | null;
}
