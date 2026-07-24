import { Controller, Get, Param, Post, Request, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles } from '../common/roles.decorator';
import { RolesGuard } from '../common/roles.guard';
import { UserRole } from '../common/user-role.enum';
import { MatchesService } from './matches.service';

type AuthenticatedRequest = {
    user: {
        id: string;
        email: string;
        role: UserRole;
    };
};

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

    @Post('tournaments/:tournamentId/bracket/generate')
    @ApiBearerAuth()
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(UserRole.ORGANIZER, UserRole.ADMIN)
    generateBracket(@Param('tournamentId') tournamentId: string, @Request() req: AuthenticatedRequest) {
        return this.matchesService.generateBracket(tournamentId, {
            id: req.user.id,
            role: req.user.role,
        });
    }
}
