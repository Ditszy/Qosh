export const TournamentLiveEvent = {
    TEAM_CREATED: 'tournament.team.created',
    ROSTER_UPDATED: 'tournament.roster.updated',
    STATUS_CHANGED: 'tournament.status.changed',
    BRACKET_GENERATED: 'tournament.bracket.generated',
    MATCH_SCHEDULED: 'tournament.match.scheduled',
} as const;

export type TournamentLiveEvent = (typeof TournamentLiveEvent)[keyof typeof TournamentLiveEvent];

export type TournamentLivePayload = object;
