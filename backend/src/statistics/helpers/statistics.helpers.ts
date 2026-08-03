import { Prisma } from '@prisma/client';
import { publicUserSelect, PublicUser } from '../../users/users.service';
import { FindPlayerStatisticsDto } from '../dto/find-player-statistics.dto';
import { PlayerStatisticSort } from '../enums/player-statistic-sort.enum';
import { SortDirection } from '../enums/sort-direction.enum';
import {
    LeaderCategory,
    MatchSummary,
    MutablePlayerStatistic,
    PlayerMatchStatistic,
    PlayerStatistic,
    StatisticLine,
    StatisticTotals,
    TeamSummary,
    TeamWithMembers,
} from '../types/statistics.types';

export const leaderCategories: LeaderCategory[] = [
    PlayerStatisticSort.GAMES_PLAYED,
    PlayerStatisticSort.POINTS,
    PlayerStatisticSort.ONE_POINT_MADE,
    PlayerStatisticSort.ONE_POINT_PERCENTAGE,
    PlayerStatisticSort.TWO_POINT_MADE,
    PlayerStatisticSort.TWO_POINT_PERCENTAGE,
    PlayerStatisticSort.FREE_THROW_MADE,
    PlayerStatisticSort.FREE_THROW_PERCENTAGE,
    PlayerStatisticSort.REBOUNDS,
    PlayerStatisticSort.ASSISTS,
    PlayerStatisticSort.STEALS,
    PlayerStatisticSort.BLOCKS,
    PlayerStatisticSort.TURNOVERS,
    PlayerStatisticSort.FOULS,
];

export function buildPlayerStatisticsWhere(filters: FindPlayerStatisticsDto): Prisma.MatchPlayerStatWhereInput {
    const where: Prisma.MatchPlayerStatWhereInput = {};

    if (filters.tournamentId) {
        where.match = {
            tournamentId: filters.tournamentId,
        };
    }

    if (filters.teamId) {
        where.teamId = filters.teamId;
    }

    const search = filters.search?.trim();
    if (search) {
        where.player = {
            is: {
                OR: [
                    { username: { contains: search, mode: 'insensitive' } },
                    { firstName: { contains: search, mode: 'insensitive' } },
                    { lastName: { contains: search, mode: 'insensitive' } },
                    { email: { contains: search, mode: 'insensitive' } },
                ],
            },
        };
    }

    return where;
}

export function statCounterSelect() {
    return {
        points: true,
        onePointMade: true,
        onePointAttempted: true,
        twoPointMade: true,
        twoPointAttempted: true,
        freeThrowMade: true,
        freeThrowAttempted: true,
        rebounds: true,
        assists: true,
        steals: true,
        blocks: true,
        turnovers: true,
        fouls: true,
    };
}

export function teamSummarySelect() {
    return {
        id: true,
        name: true,
        tournamentId: true,
    };
}

export function matchSummarySelect() {
    return {
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
    };
}

export function teamWithMembersSelect() {
    return {
        ...teamSummarySelect(),
        members: {
            select: {
                user: {
                    select: publicUserSelect,
                },
            },
            orderBy: {
                joinedAt: 'asc' as const,
            },
        },
    };
}

export function getOrCreateStatistic(
    statisticsByPlayerId: Map<string, MutablePlayerStatistic>,
    player: PublicUser,
): MutablePlayerStatistic {
    const existing = statisticsByPlayerId.get(player.id);

    if (existing) {
        return existing;
    }

    const statistic = createMutableStatistic(player);

    statisticsByPlayerId.set(player.id, statistic);
    return statistic;
}

export function createMutableStatistic(player: PublicUser): MutablePlayerStatistic {
    return {
        player,
        teamsById: new Map(),
        matchIds: new Set(),
        ...createEmptyTotals(),
    };
}

export function addPersistedStatLine(statistic: StatisticTotals, statLine: StatisticTotals): void {
    statistic.points += statLine.points;
    statistic.onePointMade += statLine.onePointMade;
    statistic.onePointAttempted += statLine.onePointAttempted;
    statistic.twoPointMade += statLine.twoPointMade;
    statistic.twoPointAttempted += statLine.twoPointAttempted;
    statistic.freeThrowMade += statLine.freeThrowMade;
    statistic.freeThrowAttempted += statLine.freeThrowAttempted;
    statistic.rebounds += statLine.rebounds;
    statistic.assists += statLine.assists;
    statistic.steals += statLine.steals;
    statistic.blocks += statLine.blocks;
    statistic.turnovers += statLine.turnovers;
    statistic.fouls += statLine.fouls;
}

export function assignPersistedStatLine(statistic: MutablePlayerStatistic, statLine: StatisticTotals): void {
    Object.assign(statistic, {
        points: statLine.points,
        onePointMade: statLine.onePointMade,
        onePointAttempted: statLine.onePointAttempted,
        twoPointMade: statLine.twoPointMade,
        twoPointAttempted: statLine.twoPointAttempted,
        freeThrowMade: statLine.freeThrowMade,
        freeThrowAttempted: statLine.freeThrowAttempted,
        rebounds: statLine.rebounds,
        assists: statLine.assists,
        steals: statLine.steals,
        blocks: statLine.blocks,
        turnovers: statLine.turnovers,
        fouls: statLine.fouls,
    });
}

export function toPlayerStatistic(statistic: MutablePlayerStatistic): PlayerStatistic {
    const gamesPlayed = statistic.matchIds.size;

    return {
        player: statistic.player,
        teams: Array.from(statistic.teamsById.values()).sort((first, second) => first.name.localeCompare(second.name)),
        gamesPlayed,
        ...toStatisticLine(statistic),
        pointsPerGame: average(statistic.points, gamesPlayed),
        reboundsPerGame: average(statistic.rebounds, gamesPlayed),
        assistsPerGame: average(statistic.assists, gamesPlayed),
        stealsPerGame: average(statistic.steals, gamesPlayed),
        blocksPerGame: average(statistic.blocks, gamesPlayed),
        turnoversPerGame: average(statistic.turnovers, gamesPlayed),
        foulsPerGame: average(statistic.fouls, gamesPlayed),
    };
}

export function toPlayerMatchStatistic(
    statistic: MutablePlayerStatistic,
    team: TeamSummary,
): PlayerMatchStatistic {
    return {
        player: statistic.player,
        team,
        ...toStatisticLine(statistic),
    };
}

export function toStatisticLine(statistic: StatisticTotals): StatisticLine {
    return {
        points: statistic.points,
        onePointMade: statistic.onePointMade,
        onePointAttempted: statistic.onePointAttempted,
        onePointPercentage: percentage(statistic.onePointMade, statistic.onePointAttempted),
        twoPointMade: statistic.twoPointMade,
        twoPointAttempted: statistic.twoPointAttempted,
        twoPointPercentage: percentage(statistic.twoPointMade, statistic.twoPointAttempted),
        freeThrowMade: statistic.freeThrowMade,
        freeThrowAttempted: statistic.freeThrowAttempted,
        freeThrowPercentage: percentage(statistic.freeThrowMade, statistic.freeThrowAttempted),
        rebounds: statistic.rebounds,
        assists: statistic.assists,
        steals: statistic.steals,
        blocks: statistic.blocks,
        turnovers: statistic.turnovers,
        fouls: statistic.fouls,
    };
}

export function compareStatistics(
    first: PlayerStatistic,
    second: PlayerStatistic,
    filters: FindPlayerStatisticsDto,
): number {
    const sortBy = filters.sortBy ?? PlayerStatisticSort.POINTS;
    const direction = filters.sortDirection ?? SortDirection.DESC;
    const directionMultiplier = direction === SortDirection.ASC ? 1 : -1;
    const firstValue = getSortValue(first, sortBy);
    const secondValue = getSortValue(second, sortBy);

    if (typeof firstValue === 'string' && typeof secondValue === 'string') {
        return firstValue.localeCompare(secondValue) * directionMultiplier;
    }

    const numericDifference = (Number(firstValue) - Number(secondValue)) * directionMultiplier;

    if (numericDifference !== 0) {
        return numericDifference;
    }

    return first.player.username.localeCompare(second.player.username);
}

export function findLeader(statistics: PlayerStatistic[], category: LeaderCategory): PlayerStatistic | null {
    return statistics
        .filter((statistic) => getNumericStatValue(statistic, category) > 0)
        .sort((first, second) => {
            const categoryDifference = getNumericStatValue(second, category) - getNumericStatValue(first, category);

            if (categoryDifference !== 0) {
                return categoryDifference;
            }

            return first.player.username.localeCompare(second.player.username);
        })[0] ?? null;
}

function getNumericStatValue(statistic: PlayerStatistic, category: LeaderCategory): number {
    return statistic[category] ?? 0;
}

export function sumStatisticLines(statistics: StatisticTotals[]): StatisticLine {
    const totals = createEmptyTotals();

    for (const statistic of statistics) {
        addPersistedStatLine(totals, statistic);
    }

    return toStatisticLine(totals);
}

export function createEmptyTotals(): StatisticTotals {
    return {
        points: 0,
        onePointMade: 0,
        onePointAttempted: 0,
        twoPointMade: 0,
        twoPointAttempted: 0,
        freeThrowMade: 0,
        freeThrowAttempted: 0,
        rebounds: 0,
        assists: 0,
        steals: 0,
        blocks: 0,
        turnovers: 0,
        fouls: 0,
    };
}

export function getMatchTeams(match: { teamA: TeamWithMembers | null; teamB: TeamWithMembers | null }): TeamWithMembers[] {
    return [match.teamA, match.teamB].filter((team): team is TeamWithMembers => team !== null);
}

export function toTeamSummary(team: TeamSummary): TeamSummary {
    return {
        id: team.id,
        name: team.name,
        tournamentId: team.tournamentId,
    };
}

export function toMatchSummary(match: MatchSummary): MatchSummary {
    return {
        id: match.id,
        tournamentId: match.tournamentId,
        round: match.round,
        bracketPosition: match.bracketPosition,
        status: match.status,
        teamAScore: match.teamAScore,
        teamBScore: match.teamBScore,
        scheduledAt: match.scheduledAt,
        location: match.location,
        tournament: match.tournament,
    };
}

export function getMatchSortTime(matchStatistic: { match: MatchSummary; updatedAt: Date }): number {
    return (matchStatistic.match.scheduledAt ?? matchStatistic.updatedAt).getTime();
}

function getSortValue(statistic: PlayerStatistic, sortBy: PlayerStatisticSort) {
    if (sortBy === PlayerStatisticSort.PLAYER_NAME) {
        return `${statistic.player.firstName} ${statistic.player.lastName}`;
    }

    return statistic[sortBy];
}

function average(total: number, gamesPlayed: number): number {
    if (gamesPlayed === 0) {
        return 0;
    }

    return Number((total / gamesPlayed).toFixed(2));
}

function percentage(made: number, attempted: number): number | null {
    if (attempted === 0) {
        return null;
    }

    return Number(((made / attempted) * 100).toFixed(1));
}
