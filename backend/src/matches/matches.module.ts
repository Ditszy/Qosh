import { Module } from '@nestjs/common';
import { MatchAccessService } from './match-access.service';
import { MatchBracketService } from './match-bracket.service';
import { MatchClockService } from './match-clock.service';
import { MatchEventsService } from './match-events.service';
import { MatchFinalizationService } from './match-finalization.service';
import { MatchSchedulingService } from './match-scheduling.service';
import { MatchesController } from './matches.controller';
import { MatchesReadService } from './matches-read.service';
import { MatchesService } from './matches.service';

@Module({
    controllers: [MatchesController],
    providers: [
        MatchAccessService,
        MatchBracketService,
        MatchClockService,
        MatchEventsService,
        MatchFinalizationService,
        MatchSchedulingService,
        MatchesReadService,
        MatchesService,
    ],
    exports: [MatchesService],
})
export class MatchesModule { }
