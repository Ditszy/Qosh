import type { UserRole } from '../../core/auth/auth';

export type StatisticMatchStatus = 'SCHEDULED' | 'LIVE' | 'FINAL';

export type PlayerStatisticSort =
  | 'playerName'
  | 'gamesPlayed'
  | 'points'
  | 'onePointMade'
  | 'onePointAttempted'
  | 'twoPointMade'
  | 'twoPointAttempted'
  | 'freeThrowMade'
  | 'freeThrowAttempted'
  | 'rebounds'
  | 'assists'
  | 'steals'
  | 'blocks'
  | 'turnovers'
  | 'fouls';

export type SortDirection = 'asc' | 'desc';

export type PublicUser = {
  id: string;
  email: string;
  username: string;
  firstName: string;
  lastName: string;
  role: UserRole;
};

export type StatisticsTeamSummary = {
  id: string;
  name: string;
  tournamentId: string;
};

export type StatisticsTournamentSummary = {
  id: string;
  name: string;
};

export type StatisticsMatchSummary = {
  id: string;
  tournamentId: string;
  round: number;
  bracketPosition: number;
  status: StatisticMatchStatus;
  teamAScore: number;
  teamBScore: number;
  scheduledAt: string | null;
  location: string | null;
  tournament: StatisticsTournamentSummary;
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

export type StatisticLine = StatisticTotals & {
  onePointPercentage: number | null;
  twoPointPercentage: number | null;
  freeThrowPercentage: number | null;
};

export type PlayerStatistic = StatisticLine & {
  player: PublicUser;
  teams: StatisticsTeamSummary[];
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

export type PlayerMatchStatistic = StatisticLine & {
  player: PublicUser;
  team: StatisticsTeamSummary;
};

export type MatchTeamStatistics = {
  team: StatisticsTeamSummary;
  players: PlayerMatchStatistic[];
  totals: StatisticLine;
};

export type MatchStatistics = {
  match: StatisticsMatchSummary;
  teams: MatchTeamStatistics[];
};

