import type { UserRole } from '../../../core/auth/auth';

export type TournamentStatus = 'DRAFT' | 'SIGNUPS_OPEN' | 'SIGNUPS_LOCKED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';

export type MatchStatus = 'SCHEDULED' | 'LIVE' | 'FINAL';

export type MatchClockStatus = 'NOT_STARTED' | 'RUNNING' | 'PAUSED' | 'ENDED';

export type MatchSlot = 'TEAM_A' | 'TEAM_B';

export type PublicUser = {
  id: string;
  email: string;
  username: string;
  firstName: string;
  lastName: string;
  role: UserRole;
};

export type Tournament = {
  id: string;
  name: string;
  description: string | null;
  location: string;
  startsAt: string;
  maxTeams: number;
  status: TournamentStatus;
  organizerId: string;
  createdAt: string;
  updatedAt: string;
};

export type TeamSummary = {
  id: string;
  name: string;
  tournamentId: string;
  createdAt: string;
  updatedAt: string;
};

export type TournamentTeamMember = {
  id: string;
  teamId: string;
  userId: string;
  role: 'CAPTAIN' | 'MEMBER';
  joinedAt: string;
  user: PublicUser;
};

export type TournamentTeamDetail = TeamSummary & {
  members: TournamentTeamMember[];
};

export type TournamentMatch = {
  id: string;
  tournamentId: string;
  round: number;
  bracketPosition: number;
  teamAId: string | null;
  teamBId: string | null;
  winnerTeamId: string | null;
  scorerId: string | null;
  refereeId: string | null;
  scheduledAt: string | null;
  location: string | null;
  status: MatchStatus;
  teamAScore: number;
  teamBScore: number;
  clockStatus: MatchClockStatus;
  clockDurationSeconds: number;
  clockRemainingSeconds: number;
  clockLastStartedAt: string | null;
  nextRound: number | null;
  nextBracketPosition: number | null;
  nextMatchSlot: MatchSlot | null;
  createdAt: string;
  updatedAt: string;
  tournament: Tournament;
  teamA: TeamSummary | null;
  teamB: TeamSummary | null;
  winnerTeam: TeamSummary | null;
  scorer: PublicUser | null;
  referee: PublicUser | null;
};

export type TournamentLiveMessage =
  | { type: 'tournament.team.created'; data: { team: TournamentTeamDetail } }
  | { type: 'tournament.roster.updated'; data: { team: TournamentTeamDetail } }
  | { type: 'tournament.status.changed'; data: { tournament: Tournament } }
  | { type: 'tournament.bracket.generated'; data: { matches: TournamentMatch[] } }
  | { type: 'tournament.match.scheduled'; data: { match: TournamentMatch } };
