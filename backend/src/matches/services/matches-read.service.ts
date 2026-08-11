import { Injectable, NotFoundException } from '@nestjs/common';
import { UserRole } from '../../common/user-role.enum';
import { PrismaService } from '../../prisma/prisma.service';
import { publicUserSelect } from '../../users/users.service';
import { MatchClockStatus } from '../enums/match-clock-status.enum';
import { MatchStatus } from '../enums/match-status.enum';
import { MatchActor, MatchRecord, MatchWithRelations, RefereeAssignedMatch, ScorerAssignedMatch } from '../types/match.types';

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

    async findByReferee(actor: MatchActor): Promise<RefereeAssignedMatch[]> {
        const matches = await this.prisma.match.findMany({
            where: actor.role === UserRole.ADMIN ? { refereeId: { not: null } } : { refereeId: actor.id },
            include: {
                ...this.matchInclude(),
                refereeReport: { select: { id: true } },
            },
            orderBy: [
                { scheduledAt: 'asc' },
                { round: 'asc' },
                { bracketPosition: 'asc' },
            ],
        });

        return matches.map(({ refereeReport, ...match }) => ({
            ...this.withCurrentClock(match),
            hasReport: Boolean(refereeReport),
        })).sort((a, b) => this.refereeMatchPriority(a) - this.refereeMatchPriority(b));
    }

    async findByScorer(actor: MatchActor): Promise<ScorerAssignedMatch[]> {
        const matches = await this.prisma.match.findMany({
            where: {
                ...(actor.role === UserRole.ADMIN ? { scorerId: { not: null } } : { scorerId: actor.id }),
                status: { not: MatchStatus.FINAL },
            },
            include: this.matchInclude(),
            orderBy: [
                { scheduledAt: 'asc' },
                { round: 'asc' },
                { bracketPosition: 'asc' },
            ],
        });

        return matches
            .map((match) => this.withCurrentClock(match))
            .sort((a, b) => this.scorerMatchPriority(a) - this.scorerMatchPriority(b));
    }

    private refereeMatchPriority(match: RefereeAssignedMatch): number {
        if (match.status === MatchStatus.FINAL && !match.hasReport) {
            return 0;
        }

        if (match.status === MatchStatus.LIVE) {
            return 1;
        }

        if (match.status === MatchStatus.SCHEDULED) {
            return 2;
        }

        return 3;
    }

    private scorerMatchPriority(match: ScorerAssignedMatch): number {
        return match.status === MatchStatus.LIVE ? 0 : 1;
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
