import { Injectable } from '@nestjs/common';
import { AdjustMatchClockDto } from './dto/adjust-match-clock.dto';
import { CreateMatchEventDto } from './dto/create-match-event.dto';
import { ScheduleMatchDto } from './dto/schedule-match.dto';
import { MatchBracketService } from './services/match-bracket.service';
import { MatchClockService } from './services/match-clock.service';
import { MatchEventsService } from './services/match-events.service';
import { MatchFinalizationService } from './services/match-finalization.service';
import { MatchLiveService } from './services/match-live.service';
import { MatchSchedulingService } from './services/match-scheduling.service';
import { MatchesReadService } from './services/matches-read.service';
import { MatchActor, MatchWithRelations } from './types/match.types';

@Injectable()
export class MatchesService {
    constructor(
        private readonly matchBracketService: MatchBracketService,
        private readonly matchClockService: MatchClockService,
        private readonly matchEventsService: MatchEventsService,
        private readonly matchFinalizationService: MatchFinalizationService,
        private readonly matchLiveService: MatchLiveService,
        private readonly matchSchedulingService: MatchSchedulingService,
        private readonly matchesReadService: MatchesReadService,
    ) { }

    async generateBracket(tournamentId: string, actor: MatchActor): Promise<MatchWithRelations[]> {
        return this.matchBracketService.generateBracket(tournamentId, actor);
    }

    async findByTournamentId(tournamentId: string): Promise<MatchWithRelations[]> {
        return this.matchesReadService.findByTournamentId(tournamentId);
    }

    async findById(id: string): Promise<MatchWithRelations> {
        return this.matchesReadService.findById(id);
    }

    async schedule(id: string, scheduleMatchDto: ScheduleMatchDto, actor: MatchActor): Promise<MatchWithRelations> {
        return this.matchSchedulingService.schedule(id, scheduleMatchDto, actor);
    }

    async startClock(id: string, actor: MatchActor): Promise<MatchWithRelations> {
        return this.matchClockService.startClock(id, actor);
    }

    async pauseClock(id: string, actor: MatchActor): Promise<MatchWithRelations> {
        return this.matchClockService.pauseClock(id, actor);
    }

    async resumeClock(id: string, actor: MatchActor): Promise<MatchWithRelations> {
        return this.matchClockService.resumeClock(id, actor);
    }

    async adjustClock(
        id: string,
        adjustMatchClockDto: AdjustMatchClockDto,
        actor: MatchActor,
    ): Promise<MatchWithRelations> {
        return this.matchClockService.adjustClock(id, adjustMatchClockDto, actor);
    }

    async endClock(id: string, actor: MatchActor): Promise<MatchWithRelations> {
        return this.matchClockService.endClock(id, actor);
    }

    async createEvent(matchId: string, createMatchEventDto: CreateMatchEventDto, actor: MatchActor) {
        return this.matchEventsService.create(matchId, createMatchEventDto, actor);
    }

    async findEventsByMatchId(matchId: string) {
        return this.matchEventsService.findByMatchId(matchId);
    }

    watchLiveMatch(matchId: string) {
        return this.matchLiveService.watchMatch(matchId);
    }

    async finalize(id: string, actor: MatchActor): Promise<MatchWithRelations> {
        return this.matchFinalizationService.finalize(id, actor);
    }
}
