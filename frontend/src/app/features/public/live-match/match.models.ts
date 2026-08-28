import type { LiveStreamMessage } from '../../../core/live';
import type { MatchStatistics, StatisticsMatchSummary, StatisticLine } from '../../statistics';
import type {
  MatchClockStatus,
  MatchStatus,
  PublicUser,
  TeamSummary,
  TournamentMatch,
} from '../tournaments/tournament.models';

export type MatchDetail = TournamentMatch;

export type MatchEventType =
  | 'ONE_POINT_MADE'
  | 'ONE_POINT_MISSED'
  | 'TWO_POINT_MADE'
  | 'TWO_POINT_MISSED'
  | 'FREE_THROW_MADE'
  | 'FREE_THROW_MISSED'
  | 'REBOUND'
  | 'ASSIST'
  | 'STEAL'
  | 'BLOCK'
  | 'TURNOVER'
  | 'FOUL';

export type MatchEvent = {
  id: string;
  matchId: string;
  teamId: string;
  playerId: string | null;
  scorerId: string;
  type: MatchEventType;
  clockRemainingSeconds: number | null;
  occurredAt: string;
  createdAt: string;
  team: TeamSummary;
  player: PublicUser | null;
  scorer: PublicUser;
};

export type MatchRefereeReport = {
  id: string;
  matchId: string;
  refereeId: string;
  notes: string;
  createdAt: string;
  updatedAt: string;
  referee: PublicUser;
};

export type MatchRecapHighlightKey = 'TOP_SCORER' | 'PLAYER_OF_MATCH';

export type MatchRecapTeamSummary = {
  team: TeamSummary;
  score: number;
  totals: StatisticLine;
};

export type MatchRecapPlayerHighlight = {
  key: MatchRecapHighlightKey;
  player: PublicUser | null;
  team: TeamSummary | null;
  value: number | null;
  valueLabel: string | null;
  statLine: StatisticLine | null;
};

export type MatchRecap = {
  match: StatisticsMatchSummary;
  isFinal: boolean;
  winnerTeam: TeamSummary | null;
  teams: MatchRecapTeamSummary[];
  highlights: MatchRecapPlayerHighlight[];
};

export type MatchRecapsByMatchId = Record<string, MatchRecap>;

export type MatchLiveSnapshot = {
  match: MatchDetail;
  events: MatchEvent[];
  serverTime: string;
};

export type MatchClockPayload = {
  id: string;
  status: MatchStatus;
  clockStatus: MatchClockStatus;
  clockDurationSeconds: number;
  clockRemainingSeconds: number;
  clockLastStartedAt: string | null;
  updatedAt: string;
  serverTime: string;
};

export type MatchScorePayload = {
  id: string;
  teamAScore: number;
  teamBScore: number;
  updatedAt: string;
};

export type MatchEventCreatedPayload = {
  event: MatchEvent;
};

export type MatchEventDeletedPayload = {
  event: MatchEvent;
};

export type MatchEventUndoResult = {
  event: MatchEvent;
  score: MatchScorePayload;
};

export type MatchReportCreatedPayload = {
  report: MatchRefereeReport;
};

export type MatchFinalizedPayload = MatchScorePayload & {
  status: MatchStatus;
  winnerTeamId: string | null;
  clockStatus: MatchClockStatus;
  clockRemainingSeconds: number;
  clockLastStartedAt: string | null;
  serverTime: string;
};

export type MatchLivePayload =
  | MatchLiveSnapshot
  | MatchClockPayload
  | MatchEventCreatedPayload
  | MatchEventDeletedPayload
  | MatchReportCreatedPayload
  | MatchScorePayload
  | MatchFinalizedPayload;

export type MatchLiveStreamMessage =
  | (LiveStreamMessage<MatchLiveSnapshot> & { type: 'match.snapshot' })
  | (LiveStreamMessage<MatchClockPayload> & { type: 'match.clock' })
  | (LiveStreamMessage<MatchEventCreatedPayload> & { type: 'match.event.created' })
  | (LiveStreamMessage<MatchEventDeletedPayload> & { type: 'match.event.deleted' })
  | (LiveStreamMessage<MatchReportCreatedPayload> & { type: 'match.report.created' })
  | (LiveStreamMessage<MatchScorePayload> & { type: 'match.score' })
  | (LiveStreamMessage<MatchFinalizedPayload> & { type: 'match.finalized' });

export type MatchReadBundle = {
  match: MatchDetail;
  events: MatchEvent[];
  statistics: MatchStatistics;
  refereeReport: MatchRefereeReport | null;
  serverTime: string | null;
  serverOffsetMs: number;
};

export type MatchLiveCenter = {
  live: MatchDetail[];
  recent: MatchDetail[];
  upcoming: MatchDetail[];
};

export type MatchLiveCenterStreamMessage = LiveStreamMessage<MatchLiveCenter> & {
  type: 'matches.live.snapshot';
};
