export const MatchStatus = {
    SCHEDULED: 'SCHEDULED',
    LIVE: 'LIVE',
    FINAL: 'FINAL',
} as const;

export type MatchStatus = (typeof MatchStatus)[keyof typeof MatchStatus];
