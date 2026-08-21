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
    TournamentAward,
    TournamentAwardKey,
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

export function buildTournamentAwards(statistics: PlayerStatistic[]): TournamentAward[] {
    return tournamentAwardDefinitions.map((definition) => {
        const winner = findAwardWinner(statistics, definition.value);
        const value = winner ? roundAwardValue(definition.value(winner)) : null;

        return {
            key: definition.key,
            label: definition.label,
            description: definition.description,
            winner: winner?.player ?? null,
            teams: winner?.teams ?? [],
            value,
            valueLabel: winner && value !== null ? definition.valueLabel(winner, value) : null,
            statLine: winner ? toStatisticLine(winner) : null,
        };
    });
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

type AwardDefinition = {
    key: TournamentAwardKey;
    label: string;
    description: string;
    value: (statistic: PlayerStatistic) => number;
    valueLabel: (statistic: PlayerStatistic, value: number) => string;
};

const minimumShooterAttempts = 5;

const tournamentAwardDefinitions: AwardDefinition[] = [
    {
        key: 'MVP',
        label: 'MVP',
        description: 'Najkorisniji igrač turnira po ukupnom učinku.',
        value: mvpScore,
        valueLabel: (_statistic, value) => `${value} MVP bodova`,
    },
    {
        key: 'TOP_SCORER',
        label: 'Najbolji strelac',
        description: 'Igrač sa najviše postignutih poena.',
        value: (statistic) => statistic.points,
        valueLabel: (statistic) => `${statistic.points} PTS`,
    },
    {
        key: 'BEST_PLAYMAKER',
        label: 'Najbolji asistent',
        description: 'Igrač koji je najviše kreirao poene za saigrače.',
        value: (statistic) => statistic.assists,
        valueLabel: (statistic) => `${statistic.assists} AST`,
    },
    {
        key: 'BEST_DEFENDER',
        label: 'Najbolji defanzivac',
        description: 'Najbolji učinak u ukradenim loptama i blokadama.',
        value: (statistic) => (statistic.steals * 2) + (statistic.blocks * 2) + (statistic.rebounds * 0.25),
        valueLabel: (statistic, value) => `${value} DEF · ${statistic.steals} STL · ${statistic.blocks} BLK`,
    },
    {
        key: 'BEST_SHOOTER',
        label: 'Najbolji šuter',
        description: 'Najefikasniji šuter sa dovoljnim brojem pokušaja.',
        value: shooterScore,
        valueLabel: (statistic, value) => `${value}% šut · ${totalShotAttempts(statistic)} pokušaja`,
    },
    {
        key: 'HUSTLE_PLAYER',
        label: 'Hustle igrač',
        description: 'Igrač koji najviše doprinosi skokovima, pritiskom i energijom.',
        value: hustleScore,
        valueLabel: (_statistic, value) => `${value} hustle bodova`,
    },
];

function findAwardWinner(
    statistics: PlayerStatistic[],
    getValue: (statistic: PlayerStatistic) => number,
): PlayerStatistic | null {
    return statistics
        .filter((statistic) => statistic.gamesPlayed > 0 && getValue(statistic) > 0)
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

function mvpScore(statistic: PlayerStatistic): number {
    return statistic.points
        + (statistic.rebounds * 1.2)
        + (statistic.assists * 1.5)
        + (statistic.steals * 2)
        + (statistic.blocks * 2)
        - statistic.turnovers
        - (statistic.fouls * 0.5)
        + shootingEfficiencyBonus(statistic);
}

function hustleScore(statistic: PlayerStatistic): number {
    return statistic.rebounds
        + (statistic.steals * 1.5)
        + (statistic.blocks * 1.5)
        - (statistic.turnovers * 0.5)
        - (statistic.fouls * 0.25);
}

function shooterScore(statistic: PlayerStatistic): number {
    const attempts = totalShotAttempts(statistic);

    if (attempts < minimumShooterAttempts) {
        return 0;
    }

    return totalShootingPercentage(statistic);
}

function shootingEfficiencyBonus(statistic: PlayerStatistic): number {
    const attempts = totalShotAttempts(statistic);

    if (attempts < minimumShooterAttempts) {
        return 0;
    }

    return Math.max(0, (totalShootingPercentage(statistic) - 50) / 10);
}

function totalShotAttempts(statistic: StatisticTotals): number {
    return statistic.onePointAttempted + statistic.twoPointAttempted + statistic.freeThrowAttempted;
}

function totalShootingPercentage(statistic: StatisticTotals): number {
    const attempts = totalShotAttempts(statistic);

    if (attempts === 0) {
        return 0;
    }

    const made = statistic.onePointMade + statistic.twoPointMade + statistic.freeThrowMade;

    return Number(((made / attempts) * 100).toFixed(1));
}

function roundAwardValue(value: number): number {
    return Number(value.toFixed(1));
}
