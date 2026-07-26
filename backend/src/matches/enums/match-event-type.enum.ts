export const MatchEventType = {
    ONE_POINT_MADE: 'ONE_POINT_MADE',
    ONE_POINT_MISSED: 'ONE_POINT_MISSED',
    TWO_POINT_MADE: 'TWO_POINT_MADE',
    TWO_POINT_MISSED: 'TWO_POINT_MISSED',
    FREE_THROW_MADE: 'FREE_THROW_MADE',
    FREE_THROW_MISSED: 'FREE_THROW_MISSED',
    REBOUND: 'REBOUND',
    ASSIST: 'ASSIST',
    STEAL: 'STEAL',
    BLOCK: 'BLOCK',
    TURNOVER: 'TURNOVER',
    FOUL: 'FOUL',
} as const;

export type MatchEventType = (typeof MatchEventType)[keyof typeof MatchEventType];
