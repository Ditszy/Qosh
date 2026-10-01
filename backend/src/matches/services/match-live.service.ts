import { Injectable, Logger, MessageEvent } from '@nestjs/common';
import { Observable, concat, defer, from, merge, timer } from 'rxjs';
import { debounceTime, switchMap } from 'rxjs/operators';
import { LiveEventBus, LiveEventTopic } from '../../live-events/live-event-bus';
import { MatchClockStatus } from '../enums/match-clock-status.enum';
import { MatchStatus } from '../enums/match-status.enum';
import { MatchesReadService } from './matches-read.service';

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

const LIVE_CENTER_CACHE_KEY = 'matches:public-live-center';
const LIVE_CENTER_CACHE_TTL_MS = 15_000;

@Injectable()
export class MatchLiveService {
    private readonly logger = new Logger(MatchLiveService.name);

    constructor(
        private readonly matchesReadService: MatchesReadService,
        private readonly liveEventBus: LiveEventBus,
    ) { }

    watchMatch(matchId: string): Observable<MessageEvent> {
        return defer(() => from(this.matchesReadService.findById(matchId))).pipe(
            switchMap(() => this.liveEventBus.watch(LiveEventTopic.match(matchId))),
        );
    }

    watchLiveCenter(): Observable<MessageEvent> {
        const initialSnapshot$ = defer(() => from(this.createLiveCenterMessage()));
        const updateMessages$ = merge(
            timer(LIVE_CENTER_CACHE_TTL_MS, LIVE_CENTER_CACHE_TTL_MS),
            this.liveEventBus.watch(LiveEventTopic.liveCenter),
        ).pipe(
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
        this.liveEventBus.publish(LiveEventTopic.match(matchId), { type, data });
        void this.liveEventBus.invalidateCache(LIVE_CENTER_CACHE_KEY).catch((error: Error) => {
            this.logger.error(`Could not invalidate the live-center snapshot: ${error.message}`);
        }).then(() => {
            this.liveEventBus.publish(LiveEventTopic.liveCenter, {
                type: 'matches.live.invalidated',
                data: {},
            });
        });
    }

    private async createLiveCenterMessage(): Promise<MessageEvent> {
        return {
            type: 'matches.live.snapshot',
            data: await this.liveEventBus.getOrCompute(
                LIVE_CENTER_CACHE_KEY,
                LIVE_CENTER_CACHE_TTL_MS,
                () => this.matchesReadService.findPublicLiveCenter(),
            ),
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

}
