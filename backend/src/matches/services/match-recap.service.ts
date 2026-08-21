import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { publicUserSelect, PublicUser } from '../../users/users.service';
import {
    statCounterSelect,
    sumStatisticLines,
    teamSummarySelect,
    toMatchSummary,
    toStatisticLine,
    toTeamSummary,
} from '../../statistics/helpers/statistics.helpers';
import { StatisticLine, StatisticTotals, TeamSummary } from '../../statistics/types/statistics.types';
import { MatchStatus } from '../enums/match-status.enum';
import {
    MatchRecap,
    MatchRecapEvent,
    MatchRecapHighlightKey,
    MatchRecapPlayerHighlight,
    MatchRecapRefereeReport,
    MatchRecapTeamSummary,
} from '../types/match-recap.types';

type RecapPlayerStatistic = StatisticLine & {
    player: PublicUser;
    team: TeamSummary;
};

@Injectable()
export class MatchRecapService {
    constructor(private readonly prisma: PrismaService) { }

    async findByMatchId(matchId: string): Promise<MatchRecap> {
        const match = await this.prisma.match.findUnique({
            where: { id: matchId },
            select: {
                id: true,
                tournamentId: true,
                round: true,
                bracketPosition: true,
                status: true,
                teamAScore: true,
                teamBScore: true,
                scheduledAt: true,
                location: true,
                tournament: {
                    select: {
                        id: true,
                        name: true,
                    },
                },
                teamA: {
                    select: teamSummarySelect(),
                },
                teamB: {
                    select: teamSummarySelect(),
                },
                winnerTeam: {
                    select: teamSummarySelect(),
                },
                refereeReport: {
                    select: {
                        id: true,
                        notes: true,
                        createdAt: true,
                        referee: {
                            select: publicUserSelect,
                        },
                    },
                },
            },
        });

        if (!match) {
            throw new NotFoundException('Match not found');
        }

        const [statistics, recentEvents] = await this.prisma.$transaction([
            this.prisma.matchPlayerStat.findMany({
                where: { matchId },
                select: {
                    ...statCounterSelect(),
                    team: {
                        select: teamSummarySelect(),
                    },
                    player: {
                        select: publicUserSelect,
                    },
                },
            }),
            this.prisma.matchEvent.findMany({
                where: { matchId },
                select: {
                    id: true,
                    type: true,
                    clockRemainingSeconds: true,
                    occurredAt: true,
                    createdAt: true,
                    team: {
                        select: teamSummarySelect(),
                    },
                    player: {
                        select: publicUserSelect,
                    },
                },
                orderBy: [
                    { occurredAt: 'desc' },
                    { createdAt: 'desc' },
                ],
                take: 8,
            }),
        ]);

        const playerStatistics = statistics.map((statistic): RecapPlayerStatistic => ({
            player: statistic.player,
            team: toTeamSummary(statistic.team),
            ...toStatisticLine(statistic),
        }));
        const isFinal = match.status === MatchStatus.FINAL;

        return {
            match: toMatchSummary(match),
            isFinal,
            winnerTeam: isFinal && match.winnerTeam ? toTeamSummary(match.winnerTeam) : null,
            teams: this.buildTeamSummaries(match, statistics),
            highlights: this.buildHighlights(playerStatistics),
            keyEvents: recentEvents.reverse().map((event): MatchRecapEvent => ({
                id: event.id,
                type: event.type,
                clockRemainingSeconds: event.clockRemainingSeconds,
                occurredAt: event.occurredAt,
                createdAt: event.createdAt,
                team: toTeamSummary(event.team),
                player: event.player,
            })),
            refereeReport: this.toRefereeReport(match.refereeReport),
        };
    }

    private buildTeamSummaries(
        match: {
            teamA: TeamSummary | null;
            teamB: TeamSummary | null;
            teamAScore: number;
            teamBScore: number;
        },
        statistics: (StatisticTotals & { team: TeamSummary })[],
    ): MatchRecapTeamSummary[] {
        const summaries: MatchRecapTeamSummary[] = [];

        if (match.teamA) {
            summaries.push(this.buildTeamSummary(match.teamA, match.teamAScore, statistics));
        }

        if (match.teamB) {
            summaries.push(this.buildTeamSummary(match.teamB, match.teamBScore, statistics));
        }

        return summaries;
    }

    private buildTeamSummary(
        team: TeamSummary,
        score: number,
        statistics: (StatisticTotals & { team: TeamSummary })[],
    ): MatchRecapTeamSummary {
        return {
            team: toTeamSummary(team),
            score,
            totals: sumStatisticLines(statistics.filter((statistic) => statistic.team.id === team.id)),
        };
    }

    private buildHighlights(statistics: RecapPlayerStatistic[]): MatchRecapPlayerHighlight[] {
        const topScorer = this.findBestStatistic(statistics, (statistic) => statistic.points);
        const playerOfMatch = this.findBestStatistic(statistics, (statistic) => this.playerOfMatchScore(statistic));

        return [
            this.toHighlight('TOP_SCORER', topScorer, topScorer?.points ?? null, topScorer ? `${topScorer.points} PTS` : null),
            this.toHighlight(
                'PLAYER_OF_MATCH',
                playerOfMatch,
                playerOfMatch ? this.playerOfMatchScore(playerOfMatch) : null,
                playerOfMatch ? `${this.playerOfMatchScore(playerOfMatch)} INDEX` : null,
            ),
        ];
    }

    private findBestStatistic(
        statistics: RecapPlayerStatistic[],
        getValue: (statistic: RecapPlayerStatistic) => number,
    ): RecapPlayerStatistic | null {
        return [...statistics]
            .filter((statistic) => getValue(statistic) > 0)
            .sort((first, second) => {
                const valueDifference = getValue(second) - getValue(first);

                if (valueDifference !== 0) {
                    return valueDifference;
                }

                if (second.points !== first.points) {
                    return second.points - first.points;
                }

                return first.player.username.localeCompare(second.player.username);
            })[0] ?? null;
    }

    private toHighlight(
        key: MatchRecapHighlightKey,
        statistic: RecapPlayerStatistic | null,
        value: number | null,
        valueLabel: string | null,
    ): MatchRecapPlayerHighlight {
        return {
            key,
            player: statistic?.player ?? null,
            team: statistic?.team ?? null,
            value,
            valueLabel,
            statLine: statistic ? toStatisticLine(statistic) : null,
        };
    }

    private playerOfMatchScore(statistic: StatisticTotals): number {
        return Number((
            statistic.points
            + (statistic.rebounds * 1.2)
            + (statistic.assists * 1.5)
            + (statistic.steals * 2)
            + (statistic.blocks * 2)
            - statistic.turnovers
            - (statistic.fouls * 0.5)
        ).toFixed(1));
    }

    private toRefereeReport(report: MatchRecapRefereeReport | null): MatchRecapRefereeReport | null {
        if (!report) {
            return null;
        }

        return {
            id: report.id,
            notes: report.notes,
            createdAt: report.createdAt,
            referee: report.referee,
        };
    }
}
