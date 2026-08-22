import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { publicUserSelect } from '../users/users.service';
import { UserRole } from '../common/user-role.enum';
import { FindPlayerStatisticsDto } from './dto/find-player-statistics.dto';
import {
    addPersistedStatLine,
    assignPersistedStatLine,
    buildTournamentAwards,
    buildPlayerStatisticsWhere,
    compareStatistics,
    createMutableStatistic,
    findLeader,
    getMatchSortTime,
    getMatchTeams,
    getOrCreateStatistic,
    leaderCategories,
    matchSummarySelect,
    statCounterSelect,
    sumStatisticLines,
    teamSummarySelect,
    teamWithMembersSelect,
    toMatchSummary,
    toPlayerMatchStatistic,
    toPlayerStatistic,
    toStatisticLine,
    toTeamSummary,
} from './helpers/statistics.helpers';
import {
    MatchStatistics,
    MutablePlayerStatistic,
    PlayerProfile,
    PlayerStatistic,
    PlayerStatisticLeader,
    RecentMatchStatisticState,
    TeamSummary,
    TournamentAward,
} from './types/statistics.types';

@Injectable()
export class StatisticsService {
    constructor(private readonly prisma: PrismaService) { }

    async searchPlayerProfiles(query: string) {
        const search = query.trim();

        if (search.length < 2) {
            return [];
        }

        return this.prisma.user.findMany({
            where: {
                role: UserRole.PLAYER,
                OR: [
                    { username: { contains: search, mode: 'insensitive' } },
                    { firstName: { contains: search, mode: 'insensitive' } },
                    { lastName: { contains: search, mode: 'insensitive' } },
                ],
            },
            select: publicUserSelect,
            orderBy: { username: 'asc' },
            take: 8,
        });
    }

    async findPlayerStatistics(filters: FindPlayerStatisticsDto): Promise<PlayerStatistic[]> {
        await this.ensureTournamentExists(filters.tournamentId);

        const playerStats = await this.prisma.matchPlayerStat.findMany({
            where: buildPlayerStatisticsWhere(filters),
            select: {
                matchId: true,
                ...statCounterSelect(),
                team: {
                    select: teamSummarySelect(),
                },
                player: {
                    select: publicUserSelect,
                },
            },
            orderBy: {
                updatedAt: 'desc',
            },
        });

        const statisticsByPlayerId = new Map<string, MutablePlayerStatistic>();

        for (const playerStat of playerStats) {
            const statistic = getOrCreateStatistic(statisticsByPlayerId, playerStat.player);
            statistic.teamsById.set(playerStat.team.id, playerStat.team);
            statistic.matchIds.add(playerStat.matchId);
            addPersistedStatLine(statistic, playerStat);
        }

        const minGamesPlayed = filters.minGamesPlayed ?? 0;

        return Array.from(statisticsByPlayerId.values())
            .map((statistic) => toPlayerStatistic(statistic))
            .filter((statistic) => statistic.gamesPlayed >= minGamesPlayed)
            .sort((first, second) => compareStatistics(first, second, filters));
    }

    async findPlayerStatisticLeaders(filters: FindPlayerStatisticsDto): Promise<PlayerStatisticLeader[]> {
        const statistics = await this.findPlayerStatistics({
            ...filters,
            sortBy: undefined,
            sortDirection: undefined,
        });

        return leaderCategories.map((category) => ({
            category,
            leader: findLeader(statistics, category),
        }));
    }

    async findTournamentAwards(tournamentId: string): Promise<TournamentAward[]> {
        const statistics = await this.findPlayerStatistics({
            tournamentId,
            minGamesPlayed: 1,
            sortBy: undefined,
            sortDirection: undefined,
        });

        return buildTournamentAwards(statistics);
    }

    async findMatchPlayerStatistics(matchId: string): Promise<MatchStatistics> {
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
                    select: teamWithMembersSelect(),
                },
                teamB: {
                    select: teamWithMembersSelect(),
                },
            },
        });

        if (!match) {
            throw new NotFoundException('Match not found');
        }

        const teams = getMatchTeams(match);
        const teamSummariesById = new Map<string, TeamSummary>();
        const statisticsByTeamId = new Map<string, Map<string, MutablePlayerStatistic>>();

        for (const team of teams) {
            const teamSummary = toTeamSummary(team);
            const playerStatistics = new Map<string, MutablePlayerStatistic>();
            teamSummariesById.set(team.id, teamSummary);

            for (const member of team.members) {
                const statistic = createMutableStatistic(member.user);
                statistic.teamsById.set(team.id, teamSummary);
                playerStatistics.set(member.user.id, statistic);
            }

            statisticsByTeamId.set(team.id, playerStatistics);
        }

        const playerStats = await this.prisma.matchPlayerStat.findMany({
            where: {
                matchId,
            },
            select: {
                matchId: true,
                ...statCounterSelect(),
                team: {
                    select: teamSummarySelect(),
                },
                player: {
                    select: publicUserSelect,
                },
            },
            orderBy: {
                updatedAt: 'asc',
            },
        });

        for (const playerStat of playerStats) {
            teamSummariesById.set(playerStat.team.id, playerStat.team);
            let teamStatistics = statisticsByTeamId.get(playerStat.team.id);

            if (!teamStatistics) {
                teamStatistics = new Map();
                statisticsByTeamId.set(playerStat.team.id, teamStatistics);
            }

            let statistic = teamStatistics.get(playerStat.player.id);

            if (!statistic) {
                statistic = createMutableStatistic(playerStat.player);
                statistic.teamsById.set(playerStat.team.id, playerStat.team);
                teamStatistics.set(playerStat.player.id, statistic);
            }

            statistic.matchIds.add(playerStat.matchId);
            assignPersistedStatLine(statistic, playerStat);
        }

        return {
            match: toMatchSummary(match),
            teams: Array.from(statisticsByTeamId.entries()).map(([teamId, playerStatistics]) => {
                const team = teamSummariesById.get(teamId)!;
                const players = Array.from(playerStatistics.values())
                    .map((statistic) => toPlayerMatchStatistic(statistic, team))
                    .sort((first, second) => second.points - first.points || first.player.username.localeCompare(second.player.username));

                return {
                    team,
                    players,
                    totals: sumStatisticLines(players),
                };
            }),
        };
    }

    async findPlayerProfile(userId: string): Promise<PlayerProfile> {
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
            select: publicUserSelect,
        });

        if (!user) {
            throw new NotFoundException('User not found');
        }

        const playerStats = await this.prisma.matchPlayerStat.findMany({
            where: { playerId: userId },
            select: {
                matchId: true,
                updatedAt: true,
                ...statCounterSelect(),
                team: {
                    select: teamSummarySelect(),
                },
                match: {
                    select: {
                        ...matchSummarySelect(),
                        teamA: {
                            select: teamSummarySelect(),
                        },
                        teamB: {
                            select: teamSummarySelect(),
                        },
                    },
                },
            },
            orderBy: {
                updatedAt: 'desc',
            },
        });

        const totals = createMutableStatistic(user);
        const recentMatchStatistics: RecentMatchStatisticState[] = [];

        for (const playerStat of playerStats) {
            totals.teamsById.set(playerStat.team.id, playerStat.team);
            totals.matchIds.add(playerStat.matchId);
            addPersistedStatLine(totals, playerStat);
            recentMatchStatistics.push({
                match: toMatchSummary(playerStat.match),
                team: playerStat.team,
                opponentTeam: this.getOpponentTeam(playerStat.match, playerStat.team.id),
                statistic: toStatisticLine(playerStat),
                updatedAt: playerStat.updatedAt,
            });
        }

        const previousMatches = recentMatchStatistics
            .sort((first, second) => getMatchSortTime(second) - getMatchSortTime(first))
            .slice(0, 10)
            .map((matchStatistic) => ({
                match: matchStatistic.match,
                team: matchStatistic.team,
                opponentTeam: matchStatistic.opponentTeam,
                ...matchStatistic.statistic,
            }));

        return {
            user,
            totals: toPlayerStatistic(totals),
            previousMatches,
        };
    }

    private async ensureTournamentExists(tournamentId?: string): Promise<void> {
        if (!tournamentId) {
            return;
        }

        const tournament = await this.prisma.tournament.findUnique({
            where: { id: tournamentId },
            select: { id: true },
        });

        if (!tournament) {
            throw new NotFoundException('Tournament not found');
        }
    }

    private getOpponentTeam(
        match: { teamA: TeamSummary | null; teamB: TeamSummary | null },
        playerTeamId: string,
    ): TeamSummary | null {
        if (match.teamA?.id === playerTeamId) {
            return match.teamB;
        }

        if (match.teamB?.id === playerTeamId) {
            return match.teamA;
        }

        return null;
    }
}
