import { Body, Controller, Get, Param, Patch, Post, Query, Request, Sse, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Roles } from '../common/roles.decorator';
import { RolesGuard } from '../common/guards/roles.guard';
import { UserRole } from '../common/user-role.enum';
import { CreateTournamentDto } from './dto/create-tournament.dto';
import { FindManagedCommandCenterDto } from './dto/find-managed-command-center.dto';
import { FindManagedTournamentsDto } from './dto/find-managed-tournaments.dto';
import { FindTournamentsDto } from './dto/find-tournaments.dto';
import { TournamentLiveService } from './tournament-live.service';
import { UpdateTournamentDto } from './dto/update-tournament.dto';
import { TournamentsService } from './tournaments.service';

type AuthenticatedRequest = {
    user: {
        id: string;
        email: string;
        role: UserRole;
    };
};

@ApiTags('tournaments')
@Controller('tournaments')
export class TournamentsController {
    constructor(
        private readonly tournamentsService: TournamentsService,
        private readonly tournamentLiveService: TournamentLiveService,
    ) { }

    @Get()
    findAll(@Query() query: FindTournamentsDto) {
        return this.tournamentsService.findAll(query);
    }

    @Get('managed/command-center')
    @ApiBearerAuth()
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(UserRole.ORGANIZER, UserRole.ADMIN)
    findManagedCommandCenter(
        @Query() query: FindManagedCommandCenterDto,
        @Request() req: AuthenticatedRequest,
    ) {
        return this.tournamentsService.findManagedCommandCenter(query, {
            id: req.user.id,
            role: req.user.role,
        });
    }

    @Get('managed')
    @ApiBearerAuth()
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(UserRole.ORGANIZER, UserRole.ADMIN)
    findManaged(
        @Query() query: FindManagedTournamentsDto,
        @Request() req: AuthenticatedRequest,
    ) {
        return this.tournamentsService.findManaged(query, {
            id: req.user.id,
            role: req.user.role,
        });
    }

    @Get(':id')
    findById(@Param('id') id: string) {
        return this.tournamentsService.findById(id);
    }

    @Sse(':id/live')
    watchLiveTournament(@Param('id') id: string) {
        return this.tournamentLiveService.watchTournament(id);
    }

    @Post()
    @ApiBearerAuth()
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(UserRole.ORGANIZER, UserRole.ADMIN)
    create(@Body() createTournamentDto: CreateTournamentDto, @Request() req: AuthenticatedRequest) {
        return this.tournamentsService.create(createTournamentDto, req.user.id);
    }

    @Patch(':id')
    @ApiBearerAuth()
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(UserRole.ORGANIZER, UserRole.ADMIN)
    update(
        @Param('id') id: string,
        @Body() updateTournamentDto: UpdateTournamentDto,
        @Request() req: AuthenticatedRequest,
    ) {
        return this.tournamentsService.update(id, updateTournamentDto, {
            id: req.user.id,
            role: req.user.role,
        });
    }

    @Post(':id/open-signups')
    @ApiBearerAuth()
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(UserRole.ORGANIZER, UserRole.ADMIN)
    openSignups(@Param('id') id: string, @Request() req: AuthenticatedRequest) {
        return this.tournamentsService.openSignups(id, {
            id: req.user.id,
            role: req.user.role,
        });
    }

    @Post(':id/lock-signups')
    @ApiBearerAuth()
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(UserRole.ORGANIZER, UserRole.ADMIN)
    lockSignups(@Param('id') id: string, @Request() req: AuthenticatedRequest) {
        return this.tournamentsService.lockSignups(id, {
            id: req.user.id,
            role: req.user.role,
        });
    }

    @Post(':id/start')
    @ApiBearerAuth()
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(UserRole.ORGANIZER, UserRole.ADMIN)
    start(@Param('id') id: string, @Request() req: AuthenticatedRequest) {
        return this.tournamentsService.start(id, {
            id: req.user.id,
            role: req.user.role,
        });
    }

    @Post(':id/cancel')
    @ApiBearerAuth()
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(UserRole.ORGANIZER, UserRole.ADMIN)
    cancel(@Param('id') id: string, @Request() req: AuthenticatedRequest) {
        return this.tournamentsService.cancel(id, {
            id: req.user.id,
            role: req.user.role,
        });
    }
}
