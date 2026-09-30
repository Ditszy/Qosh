import { Injectable, NotFoundException } from '@nestjs/common';
import { UserRole } from '../../common/user-role.enum';
import { PrismaService } from '../../prisma/prisma.service';
import { publicUserSelect } from '../../users/users.service';
import { MatchClockStatus } from '../enums/match-clock-status.enum';
import { MatchStatus } from '../enums/match-status.enum';
import { FindAssignedMatchesDto } from '../dto/find-assigned-matches.dto';
import {
    AssignedMatchPage,
    MatchActor,
    MatchRecord,
    MatchWithRelations,
    PublicLiveCenterMatches,
    RefereeAssignedMatch,
    ScorerAssignedMatch,
} from '../types/match.types';

@Injectable()
export class MatchesReadService {
    constructor(private readonly prisma: PrismaService) { }

    async findByTournamentId(tournamentId: string): Promise<MatchWithRelations[]> {
        const tournament = await this.prisma.tournament.findUnique({
            where: { id: tournamentId },
        });

        if (!tournament) {
            throw new NotFoundException('Tournament not found');
        }

        const matches = await this.prisma.match.findMany({
            where: { tournamentId },
            include: this.matchInclude(),
            orderBy: [
                { round: 'asc' },
                { bracketPosition: 'asc' },
            ],
        });

        return matches.map((match) => this.withCurrentClock(match));
    }

    async findById(id: string): Promise<MatchWithRelations> {
        const match = await this.prisma.match.findUnique({
            where: { id },
            include: this.matchInclude(),
        });

        if (!match) {
            throw new NotFoundException('Match not found');
        }

        return this.withCurrentClock(match);
    }

    async findPublicLiveCenter(): Promise<PublicLiveCenterMatches> {
        const now = new Date();
        const [live, recent, upcoming] = await this.prisma.$transaction([
            this.prisma.match.findMany({
                where: { status: MatchStatus.LIVE },
                include: this.matchInclude(),
                orderBy: [
                    { updatedAt: 'desc' },
                    { scheduledAt: 'asc' },
                ],
                take: 12,
            }),
            this.prisma.match.findMany({
                where: {
                    status: MatchStatus.FINAL,
                    teamAId: { not: null },
                    teamBId: { not: null },
                },
                include: this.matchInclude(),
                orderBy: [
                    { updatedAt: 'desc' },
                    { scheduledAt: 'desc' },
                ],
                take: 6,
            }),
            this.prisma.match.findMany({
                where: {
                    status: MatchStatus.SCHEDULED,
                    scheduledAt: { gte: now },
                    teamAId: { not: null },
                    teamBId: { not: null },
                },
                include: this.matchInclude(),
                orderBy: [
                    { scheduledAt: 'asc' },
                    { round: 'asc' },
                    { bracketPosition: 'asc' },
                ],
                take: 12,
            }),
        ]);

        return {
            live: live.map((match) => this.withCurrentClock(match)),
            recent: recent.map((match) => this.withCurrentClock(match)),
            upcoming: upcoming.map((match) => this.withCurrentClock(match)),
        };
    }

    async findByReferee(
        actor: MatchActor,
        query: FindAssignedMatchesDto = {},
    ): Promise<AssignedMatchPage<RefereeAssignedMatch>> {
        const page = Math.max(1, query.page ?? 1);
        const pageSize = Math.min(50, Math.max(1, query.pageSize ?? 25));
        const where = {
            ...(actor.role === UserRole.ADMIN ? { refereeId: { not: null } } : { refereeId: actor.id }),
            OR: [
                { status: { in: [MatchStatus.SCHEDULED, MatchStatus.LIVE] } },
                { status: MatchStatus.FINAL, refereeReport: { is: null } },
            ],
        };
        const [matches, total] = await Promise.all([
            this.prisma.match.findMany({
                where,
                skip: (page - 1) * pageSize,
                take: pageSize,
                include: {
                    ...this.matchInclude(),
                    refereeReport: { select: { id: true } },
                },
                orderBy: [
                    { status: 'desc' },
                    { scheduledAt: 'asc' },
                    { round: 'asc' },
                    { bracketPosition: 'asc' },
                    { id: 'asc' },
                ],
            }),
            this.prisma.match.count({ where }),
        ]);

        const items = matches.map(({ refereeReport, ...match }) => ({
            ...this.withCurrentClock(match),
            hasReport: Boolean(refereeReport),
        }));

        return {
            items,
            total,
            page,
            pageSize,
            totalPages: total === 0 ? 0 : Math.ceil(total / pageSize),
        };
    }

    async findByScorer(
        actor: MatchActor,
        query: FindAssignedMatchesDto = {},
    ): Promise<AssignedMatchPage<ScorerAssignedMatch>> {
        const page = Math.max(1, query.page ?? 1);
        const pageSize = Math.min(50, Math.max(1, query.pageSize ?? 25));
        const where = {
            ...(actor.role === UserRole.ADMIN ? { scorerId: { not: null } } : { scorerId: actor.id }),
            status: { not: MatchStatus.FINAL },
        };
        const [matches, total] = await Promise.all([
            this.prisma.match.findMany({
                where,
                skip: (page - 1) * pageSize,
                take: pageSize,
                include: this.matchInclude(),
                orderBy: [
                    { status: 'desc' },
                    { scheduledAt: 'asc' },
                    { round: 'asc' },
                    { bracketPosition: 'asc' },
                    { id: 'asc' },
                ],
            }),
            this.prisma.match.count({ where }),
        ]);

        return {
            items: matches.map((match) => this.withCurrentClock(match)),
            total,
            page,
            pageSize,
            totalPages: total === 0 ? 0 : Math.ceil(total / pageSize),
        };
    }

    withCurrentClock<T extends MatchRecord>(match: T): T {
        if (match.clockStatus !== MatchClockStatus.RUNNING) {
            return match;
        }

        const remainingSeconds = this.getCurrentRemainingSeconds(match);

        if (remainingSeconds === 0) {
            return {
                ...match,
                clockStatus: MatchClockStatus.ENDED,
                clockRemainingSeconds: 0,
                clockLastStartedAt: null,
            };
        }

        return {
            ...match,
            clockRemainingSeconds: remainingSeconds,
        };
    }

    getCurrentRemainingSeconds(match: MatchRecord): number {
        if (match.clockStatus !== MatchClockStatus.RUNNING || !match.clockLastStartedAt) {
            return match.clockRemainingSeconds;
        }

        const elapsedSeconds = Math.floor((Date.now() - match.clockLastStartedAt.getTime()) / 1000);

        return Math.max(0, match.clockRemainingSeconds - elapsedSeconds);
    }

    matchInclude() {
        return {
            tournament: true,
            teamA: true,
            teamB: true,
            winnerTeam: true,
            scorer: {
                select: publicUserSelect,
            },
            referee: {
                select: publicUserSelect,
            },
        };
    }
}
