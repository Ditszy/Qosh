import { TournamentStatus } from '../../tournaments/tournament-status.enum';

export const MAX_ROSTER_SIZE = 4;

export const inactiveTournamentStatuses = [TournamentStatus.COMPLETED, TournamentStatus.CANCELLED];

export const preStartTournamentStatuses: TournamentStatus[] = [
    TournamentStatus.DRAFT,
    TournamentStatus.SIGNUPS_OPEN,
    TournamentStatus.SIGNUPS_LOCKED,
];
