export const NotificationType = {
    TEAM_INVITE: 'TEAM_INVITE',
    MATCH_ASSIGNMENT: 'MATCH_ASSIGNMENT',
    TOURNAMENT_STARTED: 'TOURNAMENT_STARTED',
    MATCH_SCHEDULE_CHANGED: 'MATCH_SCHEDULE_CHANGED',
} as const;

export type NotificationType = (typeof NotificationType)[keyof typeof NotificationType];
