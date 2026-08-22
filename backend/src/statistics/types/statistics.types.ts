import { PlayerStatisticSort } from '../enums/player-statistic-sort.enum';
import { PublicUser } from '../../users/users.service';

export type TeamSummary = {
    id: string;
    name: string;
    tournamentId: string;
};

export type TeamWithMembers = TeamSummary & {
    members: {
        user: PublicUser;
    }[];
};

export type MatchSummary = {
    id: string;
    tournamentId: string;
    round: number;
    bracketPosition: number;
    status: string;
    teamAScore: number;
    teamBScore: number;
    scheduledAt: Date | null;
    location: string | null;
    tournament: {
        id: string;
        name: string;
    };
};

export type StatisticTotals = {
    points: number;
    onePointMade: number;
    onePointAttempted: number;
    twoPointMade: number;
    twoPointAttempted: number;
    freeThrowMade: number;
    freeThrowAttempted: number;
    rebounds: number;
    assists: number;
    steals: number;
    blocks: number;
    turnovers: number;
    fouls: number;
};

export type MutablePlayerStatistic = StatisticTotals & {
    player: PublicUser;
    teamsById: Map<string, TeamSummary>;
    matchIds: Set<string>;
};

export type StatisticLine = StatisticTotals & {
    onePointPercentage: number | null;
    twoPointPercentage: number | null;
    freeThrowPercentage: number | null;
};

export type PlayerStatistic = StatisticLine & {
    player: PublicUser;
    teams: TeamSummary[];
    gamesPlayed: number;
    pointsPerGame: number;
    reboundsPerGame: number;
    assistsPerGame: number;
    stealsPerGame: number;
    blocksPerGame: number;
    turnoversPerGame: number;
    foulsPerGame: number;
};

export type LeaderCategory = Exclude<PlayerStatisticSort, 'playerName'>;

export type PlayerStatisticLeader = {
    category: LeaderCategory;
    leader: PlayerStatistic | null;
};

export type TournamentAwardKey =
    | 'MVP'
    | 'TOP_SCORER'
    | 'BEST_PLAYMAKER'
    | 'BEST_DEFENDER'
    | 'BEST_SHOOTER'
    | 'HUSTLE_PLAYER';

export type TournamentAward = {
    key: TournamentAwardKey;
    label: string;
    description: string;
    winner: PublicUser | null;
    teams: TeamSummary[];
    value: number | null;
    valueLabel: string | null;
    statLine: StatisticLine | null;
};

export type PlayerMatchStatistic = StatisticLine & {
    player: PublicUser;
    team: TeamSummary;
};

export type MatchTeamStatistics = {
    team: TeamSummary;
    players: PlayerMatchStatistic[];
    totals: StatisticLine;
};

export type MatchStatistics = {
    match: MatchSummary;
    teams: MatchTeamStatistics[];
};

export type PlayerRecentMatchStatistic = StatisticLine & {
    match: MatchSummary;
    team: TeamSummary;
    opponentTeam: TeamSummary | null;
};

export type PlayerProfile = {
    user: PublicUser;
    totals: PlayerStatistic;
    previousMatches: PlayerRecentMatchStatistic[];
};

export type RecentMatchStatisticState = {
    match: MatchSummary;
    team: TeamSummary;
    opponentTeam: TeamSummary | null;
    statistic: StatisticLine;
    updatedAt: Date;
};
