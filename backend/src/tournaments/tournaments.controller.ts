import { Body, Controller, Get, Param, Patch, Post, Request, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles } from '../common/roles.decorator';
import { RolesGuard } from '../common/roles.guard';
import { UserRole } from '../common/user-role.enum';
import { CreateTournamentDto } from './dto/create-tournament.dto';
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
    constructor(private readonly tournamentsService: TournamentsService) { }

    @Get()
    findAll() {
        return this.tournamentsService.findAll();
    }

    @Get(':id')
    findById(@Param('id') id: string) {
        return this.tournamentsService.findById(id);
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
}
