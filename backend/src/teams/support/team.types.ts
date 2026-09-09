import type { UserRole } from '../../common/user-role.enum';
import type { TournamentStatus } from '../../tournaments/tournament-status.enum';
import type { PublicUser } from '../../users/users.service';
import type { TeamInviteStatus } from '../team-invite-status.enum';
import type { TeamMemberRole } from '../team-member-role.enum';

export type TeamActor = {
    id: string;
    role: UserRole;
};

export type TeamRecord = {
    id: string;
    name: string;
    tournamentId: string;
    createdAt: Date;
    updatedAt: Date;
};

export type TeamMemberRecord = {
    id: string;
    teamId: string;
    userId: string;
    role: TeamMemberRole;
    joinedAt: Date;
};

export type TeamWithMembers = TeamRecord & {
    members: Array<TeamMemberRecord & { user: PublicUser }>;
};

export type TournamentSummary = {
    id: string;
    name: string;
    description: string | null;
    location: string;
    startsAt: Date;
    maxTeams: number;
    status: TournamentStatus;
    organizerId: string;
    createdAt: Date;
    updatedAt: Date;
};

export type TeamWithMembersAndTournament = TeamWithMembers & {
    tournament: TournamentSummary;
};

export type DisbandTeamResult = {
    success: true;
    teamId: string;
    tournamentId: string;
};

export type MyTeamLiveEvent =
    | { type: 'team.updated'; data: { team: TeamWithMembers } }
    | { type: 'team.removed'; data: { teamId: string } };

export type MyTeamLiveUpdate = {
    userId: string;
    event: MyTeamLiveEvent;
};

export type TeamInviteRecord = {
    id: string;
    teamId: string;
    invitedUserId: string;
    inviterId: string;
    status: TeamInviteStatus;
    createdAt: Date;
    respondedAt: Date | null;
};

export type TeamInviteWithUsers = TeamInviteRecord & {
    invitedUser: PublicUser;
    inviter: PublicUser;
};

export type TeamInviteWithTeam = TeamInviteWithUsers & {
    team: TeamRecord & {
        tournament: TournamentSummary;
    };
};
