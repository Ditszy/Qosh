import { Body, Controller, Get, Param, Post, Request, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles } from '../common/roles.decorator';
import { RolesGuard } from '../common/roles.guard';
import { UserRole } from '../common/user-role.enum';
import { CreateTournamentDto } from './dto/create-tournament.dto';
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
}
