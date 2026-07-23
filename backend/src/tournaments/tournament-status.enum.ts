export const TournamentStatus = {
    DRAFT: 'DRAFT',
    SIGNUPS_OPEN: 'SIGNUPS_OPEN',
    SIGNUPS_LOCKED: 'SIGNUPS_LOCKED',
    IN_PROGRESS: 'IN_PROGRESS',
    COMPLETED: 'COMPLETED',
    CANCELLED: 'CANCELLED',
} as const;

export type TournamentStatus = (typeof TournamentStatus)[keyof typeof TournamentStatus];
