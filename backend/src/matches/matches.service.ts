import { Injectable } from '@nestjs/common';
import { AdjustMatchClockDto } from './dto/adjust-match-clock.dto';
import { ScheduleMatchDto } from './dto/schedule-match.dto';
import { MatchBracketService } from './match-bracket.service';
import { MatchClockService } from './match-clock.service';
import { MatchSchedulingService } from './match-scheduling.service';
import { MatchesReadService } from './matches-read.service';
import { MatchActor, MatchWithRelations } from './types/match.types';

@Injectable()
export class MatchesService {
    constructor(
        private readonly matchBracketService: MatchBracketService,
        private readonly matchClockService: MatchClockService,
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
}
