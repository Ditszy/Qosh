import { Controller, Get, Param } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { MatchesService } from './matches.service';

@ApiTags('matches')
@Controller()
export class MatchesController {
    constructor(private readonly matchesService: MatchesService) { }

    @Get('matches/:id')
    findById(@Param('id') id: string) {
        return this.matchesService.findById(id);
    }

    @Get('tournaments/:tournamentId/matches')
    findByTournamentId(@Param('tournamentId') tournamentId: string) {
        return this.matchesService.findByTournamentId(tournamentId);
    }
}
