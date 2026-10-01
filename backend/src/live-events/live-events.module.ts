import { Global, Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InMemoryLiveEventBus } from './in-memory-live-event-bus';
import { LiveEventBus } from './live-event-bus';
import { RedisLiveEventBus } from './redis-live-event-bus';

@Global()
@Module({
    providers: [
        {
            provide: LiveEventBus,
            inject: [ConfigService],
            useFactory: (config: ConfigService): LiveEventBus => {
                const driver = config.get<string>('LIVE_EVENT_BUS_DRIVER', 'memory');
                if (driver === 'memory') {
                    return new InMemoryLiveEventBus();
                }
                if (driver === 'redis') {
                    return new RedisLiveEventBus(
                        config.getOrThrow<string>('REDIS_URL'),
                        config.get<string>('LIVE_EVENT_BUS_NAMESPACE', 'qosh'),
                    );
                }
                throw new Error(`Unsupported LIVE_EVENT_BUS_DRIVER "${driver}"`);
            },
        },
    ],
    exports: [LiveEventBus],
})
export class LiveEventsModule { }
