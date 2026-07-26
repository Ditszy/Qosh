import { Injectable, MessageEvent, NotFoundException } from '@nestjs/common';
import { Observable, Subject, concat, defer, from, merge, timer } from 'rxjs';
import { filter, map, switchMap } from 'rxjs/operators';
import { PrismaService } from '../../prisma/prisma.service';
import { publicUserSelect } from '../../users/users.service';
import { MatchClockStatus } from '../enums/match-clock-status.enum';
import { MatchStatus } from '../enums/match-status.enum';
import { MatchesReadService } from './matches-read.service';
import { MatchWithRelations } from '../types/match.types';

type MatchLiveSnapshot = {
    match: MatchWithRelations;
    events: unknown[];
};

type MatchClockPayload = {
    id: string;
    status: MatchStatus;
    clockStatus: MatchClockStatus;
    clockDurationSeconds: number;
    clockRemainingSeconds: number;
    clockLastStartedAt: Date | null;
    updatedAt: Date;
};

type MatchScorePayload = {
    id: string;
    teamAScore: number;
    teamBScore: number;
    updatedAt: Date;
};

type MatchFinalizedPayload = MatchScorePayload & {
    status: MatchStatus;
    winnerTeamId: string | null;
    clockStatus: MatchClockStatus;
    clockRemainingSeconds: number;
    clockLastStartedAt: Date | null;
};

type MatchLiveUpdate = {
    matchId: string;
    message: MessageEvent;
};

@Injectable()
export class MatchLiveService {
    private readonly matchUpdates$ = new Subject<MatchLiveUpdate>();

    constructor(
        private readonly prisma: PrismaService,
        private readonly matchesReadService: MatchesReadService,
    ) { }

    watchMatch(matchId: string): Observable<MessageEvent> {
        const initialSnapshot$ = defer(() => from(this.createSnapshotMessage(matchId)));
        const clockTicks$ = timer(1000, 1000).pipe(
            switchMap(() => from(this.createClockMessage(matchId))),
        );
        const updateMessages$ = this.matchUpdates$.pipe(
            filter((update) => update.matchId === matchId),
            map((update) => update.message),
        );

        return concat(initialSnapshot$, merge(clockTicks$, updateMessages$));
    }

    publishClockChange(match: MatchClockPayload): void {
        this.publish(match.id, 'match.clock', this.toClockPayload(match));
    }

    publishEventCreated(matchId: string, event: object): void {
        this.publish(matchId, 'match.event.created', { event });
    }

    publishScoreChange(score: MatchScorePayload): void {
        this.publish(score.id, 'match.score', score);
    }

    publishFinalized(match: MatchFinalizedPayload): void {
        this.publish(match.id, 'match.finalized', match);
    }

    private publish(matchId: string, type: string, data: string | object): void {
        this.matchUpdates$.next({
            matchId,
            message: {
                type,
                data,
            },
        });
    }

    private async createSnapshotMessage(matchId: string): Promise<MessageEvent> {
        return {
            type: 'match.snapshot',
            data: await this.createSnapshot(matchId),
        };
    }

    private async createClockMessage(matchId: string): Promise<MessageEvent> {
        const match = await this.prisma.match.findUnique({
            where: { id: matchId },
        });

        if (!match) {
            throw new NotFoundException('Match not found');
        }

        return {
            type: 'match.clock',
            data: this.toClockPayload(this.matchesReadService.withCurrentClock(match)),
        };
    }

    private async createSnapshot(matchId: string): Promise<MatchLiveSnapshot> {
        const match = await this.prisma.match.findUnique({
            where: { id: matchId },
            include: this.matchesReadService.matchInclude(),
        });

        if (!match) {
            throw new NotFoundException('Match not found');
        }

        const events = await this.prisma.matchEvent.findMany({
            where: { matchId },
            include: {
                team: true,
                player: {
                    select: publicUserSelect,
                },
                scorer: {
                    select: publicUserSelect,
                },
            },
            orderBy: [
                { occurredAt: 'asc' },
                { createdAt: 'asc' },
            ],
        });

        return {
            match: this.matchesReadService.withCurrentClock(match),
            events,
        };
    }

    private toClockPayload(match: MatchClockPayload): MatchClockPayload {
        return {
            id: match.id,
            status: match.status,
            clockStatus: match.clockStatus,
            clockDurationSeconds: match.clockDurationSeconds,
            clockRemainingSeconds: match.clockRemainingSeconds,
            clockLastStartedAt: match.clockLastStartedAt,
            updatedAt: match.updatedAt,
        };
    }
}
