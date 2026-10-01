import { Injectable, Logger, MessageEvent, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { createClient, RedisClientType } from 'redis';
import { randomUUID } from 'crypto';
import { Observable, Subject } from 'rxjs';
import { filter, map } from 'rxjs/operators';
import { LiveEventBus } from './live-event-bus';

type LiveEventEnvelope = {
    topic: string;
    event: MessageEvent;
};

const BUS_CHANNEL_SUFFIX = ':live-events:v1';
const CACHE_PREFIX_SUFFIX = ':live-cache:v1:';
const CACHE_LOCK_PREFIX_SUFFIX = ':live-cache-lock:v1:';
const CACHE_VERSION_PREFIX_SUFFIX = ':live-cache-version:v1:';
const CACHE_LOCK_TTL_MS = 10_000;
const CACHE_WAIT_LIMIT_MS = 12_000;
const REDIS_STARTUP_TIMEOUT_MS = 8_000;

@Injectable()
export class RedisLiveEventBus extends LiveEventBus implements OnModuleInit, OnModuleDestroy {
    private readonly logger = new Logger(RedisLiveEventBus.name);
    private readonly events$ = new Subject<LiveEventEnvelope>();
    private readonly pendingLoads = new Map<string, Promise<unknown>>();
    private readonly publisher: RedisClientType;
    private readonly subscriber: RedisClientType;
    private readonly busChannel: string;
    private readonly cachePrefix: string;
    private readonly cacheLockPrefix: string;
    private readonly cacheVersionPrefix: string;

    constructor(redisUrl: string, namespace = 'qosh') {
        super();
        if (!/^[a-z0-9][a-z0-9:_-]*$/i.test(namespace)) {
            throw new Error('LIVE_EVENT_BUS_NAMESPACE may contain only letters, numbers, colon, underscore, and hyphen');
        }
        this.busChannel = `${namespace}${BUS_CHANNEL_SUFFIX}`;
        this.cachePrefix = `${namespace}${CACHE_PREFIX_SUFFIX}`;
        this.cacheLockPrefix = `${namespace}${CACHE_LOCK_PREFIX_SUFFIX}`;
        this.cacheVersionPrefix = `${namespace}${CACHE_VERSION_PREFIX_SUFFIX}`;
        this.publisher = createClient({ url: redisUrl });
        this.subscriber = this.publisher.duplicate();
        this.publisher.on('error', (error) => this.logger.error(`Redis publisher error: ${error.message}`));
        this.subscriber.on('error', (error) => this.logger.error(`Redis subscriber error: ${error.message}`));
    }

    async onModuleInit(): Promise<void> {
        let startupTimeout: NodeJS.Timeout | undefined;
        try {
            await Promise.race([
                Promise.all([this.publisher.connect(), this.subscriber.connect()]),
                new Promise<never>((_, reject) => {
                    startupTimeout = setTimeout(
                        () => reject(new Error(`Redis did not become available within ${REDIS_STARTUP_TIMEOUT_MS}ms`)),
                        REDIS_STARTUP_TIMEOUT_MS,
                    );
                }),
            ]);
        } catch (error) {
            this.publisher.destroy();
            this.subscriber.destroy();
            throw error;
        } finally {
            if (startupTimeout) {
                clearTimeout(startupTimeout);
            }
        }
        await this.subscriber.subscribe(this.busChannel, (message) => this.receive(message));
        this.logger.log('Redis live event bus connected');
    }

    async onModuleDestroy(): Promise<void> {
        await Promise.all([
            this.publisher.isOpen ? this.publisher.quit() : Promise.resolve(),
            this.subscriber.isOpen ? this.subscriber.quit() : Promise.resolve(),
        ]);
    }

    publish(topic: string, event: MessageEvent): void {
        const envelope: LiveEventEnvelope = { topic, event };
        void this.publisher.publish(this.busChannel, JSON.stringify(envelope)).catch((error: Error) => {
            this.logger.error(`Could not publish live event for ${topic}: ${error.message}`);
        });
    }

    watch(topic: string): Observable<MessageEvent> {
        return this.events$.pipe(
            filter((envelope) => envelope.topic === topic),
            map((envelope) => envelope.event),
        );
    }

    async invalidateCache(key: string): Promise<void> {
        await this.publisher.multi()
            .incr(`${this.cacheVersionPrefix}${key}`)
            .del(`${this.cachePrefix}${key}`)
            .exec();
    }

    async getOrCompute<T>(key: string, ttlMs: number, load: () => Promise<T>): Promise<T> {
        const pending = this.pendingLoads.get(key);
        if (pending) {
            return pending as Promise<T>;
        }

        const loading = this.getSharedOrLoad<T>(key, ttlMs, load)
            .finally(() => this.pendingLoads.delete(key));
        this.pendingLoads.set(key, loading);
        return loading;
    }

    private async getSharedOrLoad<T>(key: string, ttlMs: number, load: () => Promise<T>): Promise<T> {
        const cacheKey = `${this.cachePrefix}${key}`;
        const lockKey = `${this.cacheLockPrefix}${key}`;
        const versionKey = `${this.cacheVersionPrefix}${key}`;

        const startedAt = Date.now();
        while (Date.now() - startedAt < CACHE_WAIT_LIMIT_MS) {
            const version = await this.readVersion(versionKey);
            const initial = await this.readCache<T>(cacheKey, version);
            if (initial !== null) {
                return initial;
            }

            const lockToken = randomUUID();
            const lockAcquired = await this.publisher.set(lockKey, lockToken, {
                NX: true,
                PX: CACHE_LOCK_TTL_MS,
            });

            if (lockAcquired === 'OK') {
                try {
                    const latestVersion = await this.readVersion(versionKey);
                    if (latestVersion !== version) {
                        continue;
                    }

                    const cached = await this.readCache<T>(cacheKey, version);
                    if (cached !== null) {
                        return cached;
                    }

                    const value = await load();
                    if (await this.readVersion(versionKey) !== version) {
                        continue;
                    }
                    await this.publisher.set(cacheKey, JSON.stringify({ version, value }), { PX: ttlMs });
                    return value;
                } finally {
                    await this.publisher.eval(
                        "if redis.call('get', KEYS[1]) == ARGV[1] then return redis.call('del', KEYS[1]) else return 0 end",
                        { keys: [lockKey], arguments: [lockToken] },
                    );
                }
            }

            await wait(50);
            const currentVersion = await this.readVersion(versionKey);
            const cached = await this.readCache<T>(cacheKey, currentVersion);
            if (cached !== null) {
                return cached;
            }
        }

        throw new Error(`Timed out waiting for the shared Redis cache entry "${key}"`);
    }

    private async readCache<T>(key: string, version: string): Promise<T | null> {
        const value = await this.publisher.get(key);
        if (value === null) {
            return null;
        }
        const cached = JSON.parse(value) as { version: string; value: T };
        return cached.version === version ? cached.value : null;
    }

    private async readVersion(key: string): Promise<string> {
        return await this.publisher.get(key) ?? '0';
    }

    private receive(message: string): void {
        try {
            const envelope = JSON.parse(message) as LiveEventEnvelope;
            if (typeof envelope.topic === 'string' && envelope.event && typeof envelope.event.type === 'string') {
                this.events$.next(envelope);
            }
        } catch (error) {
            this.logger.warn(`Ignoring malformed live event message: ${(error as Error).message}`);
        }
    }
}

const wait = (milliseconds: number): Promise<void> =>
    new Promise((resolve) => setTimeout(resolve, milliseconds));
