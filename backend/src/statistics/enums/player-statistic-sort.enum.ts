export const PlayerStatisticSort = {
    PLAYER_NAME: 'playerName',
    GAMES_PLAYED: 'gamesPlayed',
    POINTS: 'points',
    ONE_POINT_MADE: 'onePointMade',
    ONE_POINT_ATTEMPTED: 'onePointAttempted',
    TWO_POINT_MADE: 'twoPointMade',
    TWO_POINT_ATTEMPTED: 'twoPointAttempted',
    FREE_THROW_MADE: 'freeThrowMade',
    FREE_THROW_ATTEMPTED: 'freeThrowAttempted',
    REBOUNDS: 'rebounds',
    ASSISTS: 'assists',
    STEALS: 'steals',
    BLOCKS: 'blocks',
    TURNOVERS: 'turnovers',
    FOULS: 'fouls',
} as const;

export type PlayerStatisticSort = (typeof PlayerStatisticSort)[keyof typeof PlayerStatisticSort];
