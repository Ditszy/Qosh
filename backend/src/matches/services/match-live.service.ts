import { Injectable, MessageEvent, NotFoundException } from '@nestjs/common';
import { Observable, Subject, concat, defer, from, merge, timer } from 'rxjs';
import { debounceTime, filter, map, switchMap } from 'rxjs/operators';
import { PrismaService } from '../../prisma/prisma.service';
import { publicUserSelect } from '../../users/users.service';
import { MatchClockStatus } from '../enums/match-clock-status.enum';
import { MatchStatus } from '../enums/match-status.enum';
import { MatchesReadService } from './matches-read.service';
import { MatchWithRelations } from '../types/match.types';

type MatchLiveSnapshot = {
    match: MatchWithRelations;
    events: unknown[];
    serverTime: Date;
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

type MatchClockMessagePayload = MatchClockPayload & {
    serverTime: Date;
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

type MatchFinalizedMessagePayload = MatchFinalizedPayload & {
    serverTime: Date;
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
        const updateMessages$ = this.matchUpdates$.pipe(
            filter((update) => update.matchId === matchId),
            map((update) => update.message),
        );

        return concat(initialSnapshot$, updateMessages$);
    }

    watchLiveCenter(): Observable<MessageEvent> {
        const initialSnapshot$ = defer(() => from(this.createLiveCenterMessage()));
        const updateMessages$ = merge(timer(15000, 15000), this.matchUpdates$).pipe(
            debounceTime(150),
            switchMap(() => from(this.createLiveCenterMessage())),
        );

        return concat(initialSnapshot$, updateMessages$);
    }

    publishClockChange(match: MatchClockPayload): void {
        this.publish(match.id, 'match.clock', this.toClockPayload(match));
    }

    publishEventCreated(matchId: string, event: object): void {
        this.publish(matchId, 'match.event.created', { event });
    }

    publishEventDeleted(matchId: string, event: object): void {
        this.publish(matchId, 'match.event.deleted', { event });
    }

    publishScoreChange(score: MatchScorePayload): void {
        this.publish(score.id, 'match.score', score);
    }

    publishFinalized(match: MatchFinalizedPayload): void {
        this.publish(match.id, 'match.finalized', this.toFinalizedPayload(match));
    }

    publishReportCreated(matchId: string, report: object): void {
        this.publish(matchId, 'match.report.created', { report });
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

    private async createLiveCenterMessage(): Promise<MessageEvent> {
        return {
            type: 'matches.live.snapshot',
            data: await this.matchesReadService.findPublicLiveCenter(),
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
            match: this.toLiveSnapshotMatch(match),
            events,
            serverTime: new Date(),
        };
    }

    private toClockPayload(match: MatchClockPayload): MatchClockMessagePayload {
        return {
            id: match.id,
            status: match.status,
            clockStatus: match.clockStatus,
            clockDurationSeconds: match.clockDurationSeconds,
            clockRemainingSeconds: match.clockRemainingSeconds,
            clockLastStartedAt: match.clockLastStartedAt,
            updatedAt: match.updatedAt,
            serverTime: new Date(),
        };
    }

    private toFinalizedPayload(match: MatchFinalizedPayload): MatchFinalizedMessagePayload {
        return {
            ...match,
            serverTime: new Date(),
        };
    }

    private toLiveSnapshotMatch(match: MatchWithRelations): MatchWithRelations {
        if (match.clockStatus !== MatchClockStatus.RUNNING || !match.clockLastStartedAt) {
            return match;
        }

        if (this.matchesReadService.getCurrentRemainingSeconds(match) > 0) {
            return match;
        }

        return {
            ...match,
            clockStatus: MatchClockStatus.ENDED,
            clockRemainingSeconds: 0,
            clockLastStartedAt: null,
        };
    }
}
