export const MatchSlot = {
    TEAM_A: 'TEAM_A',
    TEAM_B: 'TEAM_B',
} as const;

export type MatchSlot = (typeof MatchSlot)[keyof typeof MatchSlot];
