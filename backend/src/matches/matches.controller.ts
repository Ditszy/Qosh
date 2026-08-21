import { Body, Controller, Get, Param, Patch, Post, Request, Sse, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles } from '../common/roles.decorator';
import { RolesGuard } from '../common/roles.guard';
import { UserRole } from '../common/user-role.enum';
import { AdjustMatchClockDto } from './dto/adjust-match-clock.dto';
import { CreateMatchEventDto } from './dto/create-match-event.dto';
import { ScheduleMatchDto } from './dto/schedule-match.dto';
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

    @Get('matches/live')
    findPublicLiveCenter() {
        return this.matchesService.findPublicLiveCenter();
    }

    @Get('matches/:id/recap')
    findRecapById(@Param('id') id: string) {
        return this.matchesService.findRecapById(id);
    }

    @Get('matches/:id')
    findById(@Param('id') id: string) {
        return this.matchesService.findById(id);
    }

    @Get('tournaments/:tournamentId/matches')
    findByTournamentId(@Param('tournamentId') tournamentId: string) {
        return this.matchesService.findByTournamentId(tournamentId);
    }

    @Get('matches/referee/me')
    @ApiBearerAuth()
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(UserRole.REFEREE, UserRole.ADMIN)
    findMyRefereeMatches(@Request() req: AuthenticatedRequest) {
        return this.matchesService.findByReferee({
            id: req.user.id,
            role: req.user.role,
        });
    }

    @Get('matches/scorer/me')
    @ApiBearerAuth()
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(UserRole.SCORER, UserRole.ADMIN)
    findMyScorerMatches(@Request() req: AuthenticatedRequest) {
        return this.matchesService.findByScorer({
            id: req.user.id,
            role: req.user.role,
        });
    }

    @Get('matches/:id/events')
    findEventsByMatchId(@Param('id') id: string) {
        return this.matchesService.findEventsByMatchId(id);
    }

    @Sse('matches/:id/live')
    watchLiveMatch(@Param('id') id: string) {
        return this.matchesService.watchLiveMatch(id);
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

    @Patch('matches/:id/schedule')
    @ApiBearerAuth()
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(UserRole.ORGANIZER, UserRole.ADMIN)
    schedule(
        @Param('id') id: string,
        @Body() scheduleMatchDto: ScheduleMatchDto,
        @Request() req: AuthenticatedRequest,
    ) {
        return this.matchesService.schedule(id, scheduleMatchDto, {
            id: req.user.id,
            role: req.user.role,
        });
    }

    @Post('matches/:id/clock/start')
    @ApiBearerAuth()
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(UserRole.SCORER, UserRole.ADMIN)
    startClock(@Param('id') id: string, @Request() req: AuthenticatedRequest) {
        return this.matchesService.startClock(id, {
            id: req.user.id,
            role: req.user.role,
        });
    }

    @Post('matches/:id/clock/pause')
    @ApiBearerAuth()
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(UserRole.SCORER, UserRole.ADMIN)
    pauseClock(@Param('id') id: string, @Request() req: AuthenticatedRequest) {
        return this.matchesService.pauseClock(id, {
            id: req.user.id,
            role: req.user.role,
        });
    }

    @Post('matches/:id/clock/resume')
    @ApiBearerAuth()
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(UserRole.SCORER, UserRole.ADMIN)
    resumeClock(@Param('id') id: string, @Request() req: AuthenticatedRequest) {
        return this.matchesService.resumeClock(id, {
            id: req.user.id,
            role: req.user.role,
        });
    }

    @Post('matches/:id/clock/adjust')
    @ApiBearerAuth()
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(UserRole.SCORER, UserRole.ADMIN)
    adjustClock(
        @Param('id') id: string,
        @Body() adjustMatchClockDto: AdjustMatchClockDto,
        @Request() req: AuthenticatedRequest,
    ) {
        return this.matchesService.adjustClock(id, adjustMatchClockDto, {
            id: req.user.id,
            role: req.user.role,
        });
    }

    @Post('matches/:id/clock/end')
    @ApiBearerAuth()
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(UserRole.SCORER, UserRole.ADMIN)
    endClock(@Param('id') id: string, @Request() req: AuthenticatedRequest) {
        return this.matchesService.endClock(id, {
            id: req.user.id,
            role: req.user.role,
        });
    }

    @Post('matches/:id/events')
    @ApiBearerAuth()
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(UserRole.SCORER, UserRole.ADMIN)
    createEvent(
        @Param('id') id: string,
        @Body() createMatchEventDto: CreateMatchEventDto,
        @Request() req: AuthenticatedRequest,
    ) {
        return this.matchesService.createEvent(id, createMatchEventDto, {
            id: req.user.id,
            role: req.user.role,
        });
    }

    @Post('matches/:id/finalize')
    @ApiBearerAuth()
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(UserRole.SCORER, UserRole.ADMIN)
    finalize(@Param('id') id: string, @Request() req: AuthenticatedRequest) {
        return this.matchesService.finalize(id, {
            id: req.user.id,
            role: req.user.role,
        });
    }
}
