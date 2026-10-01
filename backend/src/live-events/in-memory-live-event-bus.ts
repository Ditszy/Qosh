import { Injectable, MessageEvent } from '@nestjs/common';
import { Observable, Subject } from 'rxjs';
import { filter, map } from 'rxjs/operators';
import { LiveEventBus } from './live-event-bus';

type LiveEventEnvelope = {
    topic: string;
    event: MessageEvent;
};

type CacheEntry = {
    expiresAt: number;
    version: number;
    value: unknown;
};

@Injectable()
export class InMemoryLiveEventBus extends LiveEventBus {
    private readonly events$ = new Subject<LiveEventEnvelope>();
    private readonly cache = new Map<string, CacheEntry>();
    private readonly pendingLoads = new Map<string, Promise<unknown>>();
    private readonly cacheVersions = new Map<string, number>();

    publish(topic: string, event: MessageEvent): void {
        this.events$.next({ topic, event });
    }

    watch(topic: string): Observable<MessageEvent> {
        return this.events$.pipe(
            filter((envelope) => envelope.topic === topic),
            map((envelope) => envelope.event),
        );
    }

    async invalidateCache(key: string): Promise<void> {
        this.cache.delete(key);
        this.cacheVersions.set(key, (this.cacheVersions.get(key) ?? 0) + 1);
    }

    async getOrCompute<T>(key: string, ttlMs: number, load: () => Promise<T>): Promise<T> {
        const version = this.cacheVersions.get(key) ?? 0;
        const cached = this.cache.get(key);
        if (cached && cached.expiresAt > Date.now() && cached.version === version) {
            return cached.value as T;
        }

        const pending = this.pendingLoads.get(key);
        if (pending) {
            return pending as Promise<T>;
        }

        const loading = this.compute(key, ttlMs, load, version)
            .finally(() => this.pendingLoads.delete(key));
        this.pendingLoads.set(key, loading);
        return loading;
    }

    private async compute<T>(key: string, ttlMs: number, load: () => Promise<T>, version: number): Promise<T> {
        const value = await load();
        const currentVersion = this.cacheVersions.get(key) ?? 0;
        if (currentVersion !== version) {
            return this.compute(key, ttlMs, load, currentVersion);
        }

        this.cache.set(key, { expiresAt: Date.now() + ttlMs, version, value });
        return value;
    }
}
