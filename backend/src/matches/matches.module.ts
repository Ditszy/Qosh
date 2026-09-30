import { Module } from '@nestjs/common';
import { NotificationsModule } from '../notifications/notifications.module';
import { StatisticsModule } from '../statistics/statistics.module';
import { TournamentsModule } from '../tournaments/tournaments.module';
import { MatchAccessService } from './services/match-access.service';
import { MatchBracketService } from './services/match-bracket.service';
import { MatchClockService } from './services/match-clock.service';
import { MatchEventsService } from './services/match-events.service';
import { MatchFinalizationService } from './services/match-finalization.service';
import { MatchLiveService } from './services/match-live.service';
import { MatchRecapService } from './services/match-recap.service';
import { MatchReadBundleService } from './services/match-read-bundle.service';
import { MatchSchedulingService } from './services/match-scheduling.service';
import { MatchesController } from './matches.controller';
import { MatchesReadService } from './services/matches-read.service';
import { MatchesService } from './matches.service';

@Module({
    imports: [NotificationsModule, StatisticsModule, TournamentsModule],
    controllers: [MatchesController],
    providers: [
        MatchAccessService,
        MatchBracketService,
        MatchClockService,
        MatchEventsService,
        MatchFinalizationService,
        MatchLiveService,
        MatchRecapService,
        MatchReadBundleService,
        MatchSchedulingService,
        MatchesReadService,
        MatchesService,
    ],
    exports: [MatchLiveService, MatchesService],
})
export class MatchesModule { }
