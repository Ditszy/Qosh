import { Body, Controller, Get, Param, Post, Request, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles } from '../common/roles.decorator';
import { RolesGuard } from '../common/roles.guard';
import { UserRole } from '../common/user-role.enum';
import { CreateTeamDto } from './dto/create-team.dto';
import { TeamsService } from './teams.service';

type AuthenticatedRequest = {
    user: {
        id: string;
        email: string;
        role: UserRole;
    };
};

@ApiTags('teams')
@Controller('teams')
export class TeamsController {
    constructor(private readonly teamsService: TeamsService) { }

    @Post()
    @ApiBearerAuth()
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(UserRole.PLAYER, UserRole.ADMIN)
    create(@Body() createTeamDto: CreateTeamDto, @Request() req: AuthenticatedRequest) {
        return this.teamsService.create(createTeamDto, req.user.id);
    }

    @Get('tournament/:tournamentId')
    findByTournamentId(@Param('tournamentId') tournamentId: string) {
        return this.teamsService.findByTournamentId(tournamentId);
    }

    @Get(':id')
    findById(@Param('id') id: string) {
        return this.teamsService.findById(id);
    }
}
