export const MatchClockStatus = {
    NOT_STARTED: 'NOT_STARTED',
    RUNNING: 'RUNNING',
    PAUSED: 'PAUSED',
    ENDED: 'ENDED',
} as const;

export type MatchClockStatus = (typeof MatchClockStatus)[keyof typeof MatchClockStatus];
