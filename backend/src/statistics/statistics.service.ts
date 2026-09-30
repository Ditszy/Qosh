import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { publicUserSelect } from '../users/users.service';
import { UserRole } from '../common/user-role.enum';
import { FindPlayerStatisticsDto } from './dto/find-player-statistics.dto';
import {
    addPersistedStatLine,
    assignPersistedStatLine,
    buildTournamentAwards,
    createMutableStatistic,
    getMatchSortTime,
    getMatchTeams,
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
    PlayerStatisticPage,
    RecentMatchStatisticState,
    TeamSummary,
    TournamentAward,
} from './types/statistics.types';
import { PlayerStatisticSort } from './enums/player-statistic-sort.enum';
import { SortDirection } from './enums/sort-direction.enum';

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

    async findPlayerStatistics(filters: FindPlayerStatisticsDto): Promise<PlayerStatisticPage> {
        await this.ensureTournamentExists(filters.tournamentId);

        const page = Math.max(1, filters.page ?? 1);
        const pageSize = Math.min(100, Math.max(1, filters.pageSize ?? 25));
        const offset = (page - 1) * pageSize;
        const sortExpression = this.statisticsSortExpression(filters.sortBy ?? PlayerStatisticSort.POINTS);
        const sortDirection = filters.sortDirection === SortDirection.ASC ? Prisma.sql`ASC` : Prisma.sql`DESC`;
        const aggregateCte = this.buildAggregateCte(filters);

        const [rows, totalRows] = await Promise.all([
            this.prisma.$queryRaw<RawPlayerStatisticRow[]>(Prisma.sql`
                ${aggregateCte},
                ranked AS (
                    SELECT
                        a.*,
                        u."email",
                        u."username",
                        u."firstName",
                        u."lastName",
                        u."role",
                        u."profileImageUrl"
                    FROM aggregated a
                    INNER JOIN "users" u ON u."id" = a."playerId"
                )
                SELECT r.*
                FROM ranked r
                ORDER BY ${sortExpression} ${sortDirection}, r."playerId" ASC
                LIMIT ${pageSize}
                OFFSET ${offset}
            `),
            this.prisma.$queryRaw<{ total: number }[]>(Prisma.sql`
                ${aggregateCte}
                SELECT COUNT(*)::int AS "total"
                FROM aggregated
            `),
        ]);

        const total = Number(totalRows[0]?.total ?? 0);
        const items = await this.attachTeams(rows, filters);

        return {
            items,
            total,
            page,
            pageSize,
            totalPages: total === 0 ? 0 : Math.ceil(total / pageSize),
        };
    }

    async findPlayerStatisticLeaders(filters: FindPlayerStatisticsDto): Promise<PlayerStatisticLeader[]> {
        await this.ensureTournamentExists(filters.tournamentId);

        const aggregateCte = this.buildAggregateCte(filters);
        const leaderRows = await this.prisma.$queryRaw<RawLeaderStatisticRow[]>(Prisma.sql`
            ${aggregateCte},
            expanded AS (
                SELECT
                    a.*,
                    u."email",
                    u."username",
                    u."firstName",
                    u."lastName",
                    u."role",
                    u."profileImageUrl",
                    categories."category",
                    categories."value",
                    ROW_NUMBER() OVER (
                        PARTITION BY categories."category"
                        ORDER BY categories."value" DESC NULLS LAST, a."playerId" ASC
                    ) AS "leaderRank"
                FROM aggregated a
                INNER JOIN "users" u ON u."id" = a."playerId"
                CROSS JOIN LATERAL (VALUES
                    ('gamesPlayed', a."gamesPlayed"::double precision),
                    ('points', a."points"::double precision),
                    ('onePointMade', a."onePointMade"::double precision),
                    ('onePointPercentage', COALESCE(a."onePointPercentage", 0)::double precision),
                    ('twoPointMade', a."twoPointMade"::double precision),
                    ('twoPointPercentage', COALESCE(a."twoPointPercentage", 0)::double precision),
                    ('freeThrowMade', a."freeThrowMade"::double precision),
                    ('freeThrowPercentage', COALESCE(a."freeThrowPercentage", 0)::double precision),
                    ('rebounds', a."rebounds"::double precision),
                    ('assists', a."assists"::double precision),
                    ('steals', a."steals"::double precision),
                    ('blocks', a."blocks"::double precision),
                    ('turnovers', a."turnovers"::double precision),
                    ('fouls', a."fouls"::double precision)
                ) AS categories("category", "value")
            )
            SELECT *
            FROM expanded
            WHERE "leaderRank" = 1 AND "value" > 0
        `);

        const leadersByCategory = new Map<string, PlayerStatistic>();
        const leaderStatistics = await this.attachTeams(leaderRows, filters);
        leaderStatistics.forEach((statistic, index) => {
            leadersByCategory.set(leaderRows[index].category, statistic);
        });

        return leaderCategories.map((category) => ({
            category,
            leader: leadersByCategory.get(category) ?? null,
        }));
    }

    async findTournamentAwards(tournamentId: string): Promise<TournamentAward[]> {
        const page = await this.findPlayerStatistics({
            tournamentId,
            minGamesPlayed: 1,
            page: 1,
            pageSize: 100,
        });

        return buildTournamentAwards(page.items);
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

    private buildAggregateCte(filters: FindPlayerStatisticsDto): Prisma.Sql {
        const conditions: Prisma.Sql[] = [];

        if (filters.tournamentId) {
            conditions.push(Prisma.sql`m."tournamentId" = ${filters.tournamentId}::uuid`);
        }

        if (filters.teamId) {
            conditions.push(Prisma.sql`s."teamId" = ${filters.teamId}::uuid`);
        }

        const search = filters.search?.trim();
        if (search) {
            const pattern = `%${search}%`;
            conditions.push(Prisma.sql`(
                u."username" ILIKE ${pattern}
                OR u."firstName" ILIKE ${pattern}
                OR u."lastName" ILIKE ${pattern}
                OR u."email" ILIKE ${pattern}
            )`);
        }

        const where = conditions.length > 0
            ? Prisma.join(conditions, ' AND ')
            : Prisma.sql`TRUE`;
        const minGamesPlayed = filters.minGamesPlayed ?? 0;

        return Prisma.sql`
            WITH totals AS (
                SELECT
                    s."playerId",
                    COUNT(DISTINCT s."matchId")::int AS "gamesPlayed",
                    COALESCE(SUM(s."points"), 0)::int AS "points",
                    COALESCE(SUM(s."onePointMade"), 0)::int AS "onePointMade",
                    COALESCE(SUM(s."onePointAttempted"), 0)::int AS "onePointAttempted",
                    COALESCE(SUM(s."twoPointMade"), 0)::int AS "twoPointMade",
                    COALESCE(SUM(s."twoPointAttempted"), 0)::int AS "twoPointAttempted",
                    COALESCE(SUM(s."freeThrowMade"), 0)::int AS "freeThrowMade",
                    COALESCE(SUM(s."freeThrowAttempted"), 0)::int AS "freeThrowAttempted",
                    COALESCE(SUM(s."rebounds"), 0)::int AS "rebounds",
                    COALESCE(SUM(s."assists"), 0)::int AS "assists",
                    COALESCE(SUM(s."steals"), 0)::int AS "steals",
                    COALESCE(SUM(s."blocks"), 0)::int AS "blocks",
                    COALESCE(SUM(s."turnovers"), 0)::int AS "turnovers",
                    COALESCE(SUM(s."fouls"), 0)::int AS "fouls"
                FROM "match_player_stats" s
                INNER JOIN "matches" m ON m."id" = s."matchId"
                INNER JOIN "users" u ON u."id" = s."playerId"
                WHERE ${where}
                GROUP BY s."playerId"
                HAVING COUNT(DISTINCT s."matchId") >= ${minGamesPlayed}
            ),
            aggregated AS (
                SELECT
                    t.*,
                    CASE WHEN t."onePointAttempted" = 0 THEN NULL ELSE ROUND((t."onePointMade"::numeric / t."onePointAttempted") * 100, 1)::double precision END AS "onePointPercentage",
                    CASE WHEN t."twoPointAttempted" = 0 THEN NULL ELSE ROUND((t."twoPointMade"::numeric / t."twoPointAttempted") * 100, 1)::double precision END AS "twoPointPercentage",
                    CASE WHEN t."freeThrowAttempted" = 0 THEN NULL ELSE ROUND((t."freeThrowMade"::numeric / t."freeThrowAttempted") * 100, 1)::double precision END AS "freeThrowPercentage",
                    ROUND(t."points"::numeric / NULLIF(t."gamesPlayed", 0), 2)::double precision AS "pointsPerGame",
                    ROUND(t."rebounds"::numeric / NULLIF(t."gamesPlayed", 0), 2)::double precision AS "reboundsPerGame",
                    ROUND(t."assists"::numeric / NULLIF(t."gamesPlayed", 0), 2)::double precision AS "assistsPerGame",
                    ROUND(t."steals"::numeric / NULLIF(t."gamesPlayed", 0), 2)::double precision AS "stealsPerGame",
                    ROUND(t."blocks"::numeric / NULLIF(t."gamesPlayed", 0), 2)::double precision AS "blocksPerGame",
                    ROUND(t."turnovers"::numeric / NULLIF(t."gamesPlayed", 0), 2)::double precision AS "turnoversPerGame",
                    ROUND(t."fouls"::numeric / NULLIF(t."gamesPlayed", 0), 2)::double precision AS "foulsPerGame"
                FROM totals t
            )
        `;
    }

    private statisticsSortExpression(sortBy: PlayerStatisticSort): Prisma.Sql {
        switch (sortBy) {
            case PlayerStatisticSort.PLAYER_NAME:
                return Prisma.sql`LOWER(r."firstName") || ' ' || LOWER(r."lastName")`;
            case PlayerStatisticSort.ONE_POINT_PERCENTAGE:
                return Prisma.sql`COALESCE(r."onePointPercentage", 0)`;
            case PlayerStatisticSort.TWO_POINT_PERCENTAGE:
                return Prisma.sql`COALESCE(r."twoPointPercentage", 0)`;
            case PlayerStatisticSort.FREE_THROW_PERCENTAGE:
                return Prisma.sql`COALESCE(r."freeThrowPercentage", 0)`;
            case PlayerStatisticSort.GAMES_PLAYED:
                return Prisma.sql`r."gamesPlayed"`;
            case PlayerStatisticSort.POINTS:
                return Prisma.sql`r."points"`;
            case PlayerStatisticSort.ONE_POINT_MADE:
                return Prisma.sql`r."onePointMade"`;
            case PlayerStatisticSort.ONE_POINT_ATTEMPTED:
                return Prisma.sql`r."onePointAttempted"`;
            case PlayerStatisticSort.TWO_POINT_MADE:
                return Prisma.sql`r."twoPointMade"`;
            case PlayerStatisticSort.TWO_POINT_ATTEMPTED:
                return Prisma.sql`r."twoPointAttempted"`;
            case PlayerStatisticSort.FREE_THROW_MADE:
                return Prisma.sql`r."freeThrowMade"`;
            case PlayerStatisticSort.FREE_THROW_ATTEMPTED:
                return Prisma.sql`r."freeThrowAttempted"`;
            case PlayerStatisticSort.REBOUNDS:
                return Prisma.sql`r."rebounds"`;
            case PlayerStatisticSort.ASSISTS:
                return Prisma.sql`r."assists"`;
            case PlayerStatisticSort.STEALS:
                return Prisma.sql`r."steals"`;
            case PlayerStatisticSort.BLOCKS:
                return Prisma.sql`r."blocks"`;
            case PlayerStatisticSort.TURNOVERS:
                return Prisma.sql`r."turnovers"`;
            case PlayerStatisticSort.FOULS:
                return Prisma.sql`r."fouls"`;
            default:
                return Prisma.sql`r."points"`;
        }
    }

    private async attachTeams(rows: RawPlayerStatisticRow[], filters: FindPlayerStatisticsDto): Promise<PlayerStatistic[]> {
        if (rows.length === 0) {
            return [];
        }

        const playerIds = [...new Set(rows.map((row) => row.playerId))];
        const conditions: Prisma.Sql[] = [Prisma.sql`s."playerId" IN (${Prisma.join(playerIds)})`];

        if (filters.tournamentId) {
            conditions.push(Prisma.sql`m."tournamentId" = ${filters.tournamentId}::uuid`);
        }

        if (filters.teamId) {
            conditions.push(Prisma.sql`s."teamId" = ${filters.teamId}::uuid`);
        }

        const teamRows = await this.prisma.$queryRaw<RawPlayerTeamRow[]>(Prisma.sql`
            SELECT DISTINCT
                s."playerId",
                t."id",
                t."name",
                t."tournamentId"
            FROM "match_player_stats" s
            INNER JOIN "matches" m ON m."id" = s."matchId"
            INNER JOIN "teams" t ON t."id" = s."teamId"
            WHERE ${Prisma.join(conditions, ' AND ')}
            ORDER BY s."playerId", t."name", t."id"
        `);

        const teamsByPlayerId = new Map<string, TeamSummary[]>();
        for (const team of teamRows) {
            const teams = teamsByPlayerId.get(team.playerId) ?? [];
            teams.push({ id: team.id, name: team.name, tournamentId: team.tournamentId });
            teamsByPlayerId.set(team.playerId, teams);
        }

        return rows.map((row) => this.toPlayerStatistic(row, teamsByPlayerId.get(row.playerId) ?? []));
    }

    private toPlayerStatistic(row: RawPlayerStatisticRow, teams: TeamSummary[]): PlayerStatistic {
        return {
            player: {
                id: row.playerId,
                email: row.email,
                username: row.username,
                firstName: row.firstName,
                lastName: row.lastName,
                role: row.role,
                profileImageUrl: row.profileImageUrl,
            },
            teams,
            gamesPlayed: Number(row.gamesPlayed),
            points: Number(row.points),
            onePointMade: Number(row.onePointMade),
            onePointAttempted: Number(row.onePointAttempted),
            onePointPercentage: this.numberOrNull(row.onePointPercentage),
            twoPointMade: Number(row.twoPointMade),
            twoPointAttempted: Number(row.twoPointAttempted),
            twoPointPercentage: this.numberOrNull(row.twoPointPercentage),
            freeThrowMade: Number(row.freeThrowMade),
            freeThrowAttempted: Number(row.freeThrowAttempted),
            freeThrowPercentage: this.numberOrNull(row.freeThrowPercentage),
            rebounds: Number(row.rebounds),
            assists: Number(row.assists),
            steals: Number(row.steals),
            blocks: Number(row.blocks),
            turnovers: Number(row.turnovers),
            fouls: Number(row.fouls),
            pointsPerGame: Number(row.pointsPerGame),
            reboundsPerGame: Number(row.reboundsPerGame),
            assistsPerGame: Number(row.assistsPerGame),
            stealsPerGame: Number(row.stealsPerGame),
            blocksPerGame: Number(row.blocksPerGame),
            turnoversPerGame: Number(row.turnoversPerGame),
            foulsPerGame: Number(row.foulsPerGame),
        };
    }

    private numberOrNull(value: number | string | null): number | null {
        return value === null ? null : Number(value);
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

type RawPlayerStatisticRow = {
    playerId: string;
    email: string;
    username: string;
    firstName: string;
    lastName: string;
    role: UserRole;
    profileImageUrl: string | null;
    gamesPlayed: number;
    points: number;
    onePointMade: number;
    onePointAttempted: number;
    onePointPercentage: number | string | null;
    twoPointMade: number;
    twoPointAttempted: number;
    twoPointPercentage: number | string | null;
    freeThrowMade: number;
    freeThrowAttempted: number;
    freeThrowPercentage: number | string | null;
    rebounds: number;
    assists: number;
    steals: number;
    blocks: number;
    turnovers: number;
    fouls: number;
    pointsPerGame: number;
    reboundsPerGame: number;
    assistsPerGame: number;
    stealsPerGame: number;
    blocksPerGame: number;
    turnoversPerGame: number;
    foulsPerGame: number;
};

type RawLeaderStatisticRow = RawPlayerStatisticRow & {
    category: string;
    value: number;
    leaderRank: number;
};

type RawPlayerTeamRow = {
    playerId: string;
    id: string;
    name: string;
    tournamentId: string;
};
