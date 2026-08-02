import type { LiveStreamMessage } from '../../../core/live';
import type { MatchStatistics } from '../../statistics';
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
  occurredAt: string;
  createdAt: string;
  team: TeamSummary;
  player: PublicUser | null;
  scorer: PublicUser;
};

export type MatchLiveSnapshot = {
  match: MatchDetail;
  events: MatchEvent[];
};

export type MatchClockPayload = {
  id: string;
  status: MatchStatus;
  clockStatus: MatchClockStatus;
  clockDurationSeconds: number;
  clockRemainingSeconds: number;
  clockLastStartedAt: string | null;
  updatedAt: string;
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

export type MatchFinalizedPayload = MatchScorePayload & {
  status: MatchStatus;
  winnerTeamId: string | null;
  clockStatus: MatchClockStatus;
  clockRemainingSeconds: number;
  clockLastStartedAt: string | null;
};

export type MatchLivePayload =
  | MatchLiveSnapshot
  | MatchClockPayload
  | MatchEventCreatedPayload
  | MatchScorePayload
  | MatchFinalizedPayload;

export type MatchLiveStreamMessage =
  | (LiveStreamMessage<MatchLiveSnapshot> & { type: 'match.snapshot' })
  | (LiveStreamMessage<MatchClockPayload> & { type: 'match.clock' })
  | (LiveStreamMessage<MatchEventCreatedPayload> & { type: 'match.event.created' })
  | (LiveStreamMessage<MatchScorePayload> & { type: 'match.score' })
  | (LiveStreamMessage<MatchFinalizedPayload> & { type: 'match.finalized' });

export type MatchReadBundle = {
  match: MatchDetail;
  events: MatchEvent[];
  statistics: MatchStatistics;
};
