import { PublicUser } from '../../users/users.service';
import { MatchSummary, StatisticLine, TeamSummary } from '../../statistics/types/statistics.types';

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
    match: MatchSummary;
    isFinal: boolean;
    winnerTeam: TeamSummary | null;
    teams: MatchRecapTeamSummary[];
    highlights: MatchRecapPlayerHighlight[];
};
