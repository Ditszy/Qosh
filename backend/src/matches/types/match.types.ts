import { UserRole } from '../../common/user-role.enum';
import { PublicUser } from '../../users/users.service';
import { MatchClockStatus } from '../match-clock-status.enum';
import { MatchSlot } from '../match-slot.enum';
import { MatchStatus } from '../match-status.enum';

export type MatchActor = {
    id: string;
    role: UserRole;
};

export type TournamentSummary = {
    id: string;
    name: string;
    description: string | null;
    location: string;
    startsAt: Date;
    maxTeams: number;
    status: string;
    organizerId: string;
    createdAt: Date;
    updatedAt: Date;
};

export type TeamSummary = {
    id: string;
    name: string;
    tournamentId: string;
    createdAt: Date;
    updatedAt: Date;
};

export type MatchRecord = {
    id: string;
    tournamentId: string;
    round: number;
    bracketPosition: number;
    teamAId: string | null;
    teamBId: string | null;
    winnerTeamId: string | null;
    scorerId: string | null;
    refereeId: string | null;
    scheduledAt: Date | null;
    location: string | null;
    status: MatchStatus;
    teamAScore: number;
    teamBScore: number;
    clockStatus: MatchClockStatus;
    clockDurationSeconds: number;
    clockRemainingSeconds: number;
    clockLastStartedAt: Date | null;
    nextRound: number | null;
    nextBracketPosition: number | null;
    nextMatchSlot: MatchSlot | null;
    createdAt: Date;
    updatedAt: Date;
};

export type MatchWithRelations = MatchRecord & {
    tournament: TournamentSummary;
    teamA: TeamSummary | null;
    teamB: TeamSummary | null;
    winnerTeam: TeamSummary | null;
    scorer: PublicUser | null;
    referee: PublicUser | null;
};

export type MatchClockUpdateData = {
    status?: MatchStatus;
    clockStatus?: MatchClockStatus;
    clockRemainingSeconds?: number;
    clockLastStartedAt?: Date | null;
};
