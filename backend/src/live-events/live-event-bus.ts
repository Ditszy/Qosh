import type { MessageEvent } from '@nestjs/common';
import { Observable } from 'rxjs';

export const LiveEventTopic = {
    match: (matchId: string) => `match:${matchId}`,
    liveCenter: 'match:live-center',
    tournament: (tournamentId: string) => `tournament:${tournamentId}`,
    teamUser: (userId: string) => `team:user:${userId}`,
    notificationUser: (userId: string) => `notification:user:${userId}`,
} as const;

export abstract class LiveEventBus {
    abstract publish(topic: string, event: MessageEvent): void;
    abstract watch(topic: string): Observable<MessageEvent>;
    abstract invalidateCache(key: string): Promise<void>;
    abstract getOrCompute<T>(key: string, ttlMs: number, load: () => Promise<T>): Promise<T>;
}
