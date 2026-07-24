import { Body, Controller, Delete, Get, Param, Post, Request, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles } from '../common/roles.decorator';
import { RolesGuard } from '../common/roles.guard';
import { UserRole } from '../common/user-role.enum';
import { CreateTeamDto } from './dto/create-team.dto';
import { SendTeamInviteDto } from './dto/send-team-invite.dto';
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

    @Post(':teamId/invites')
    @ApiBearerAuth()
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(UserRole.PLAYER, UserRole.ADMIN)
    sendInvite(
        @Param('teamId') teamId: string,
        @Body() sendTeamInviteDto: SendTeamInviteDto,
        @Request() req: AuthenticatedRequest,
    ) {
        return this.teamsService.sendInvite(teamId, sendTeamInviteDto, {
            id: req.user.id,
            role: req.user.role,
        });
    }

    @Post('invites/:inviteId/accept')
    @ApiBearerAuth()
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(UserRole.PLAYER)
    acceptInvite(@Param('inviteId') inviteId: string, @Request() req: AuthenticatedRequest) {
        return this.teamsService.acceptInvite(inviteId, {
            id: req.user.id,
            role: req.user.role,
        });
    }

    @Post('invites/:inviteId/decline')
    @ApiBearerAuth()
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(UserRole.PLAYER)
    declineInvite(@Param('inviteId') inviteId: string, @Request() req: AuthenticatedRequest) {
        return this.teamsService.declineInvite(inviteId, {
            id: req.user.id,
            role: req.user.role,
        });
    }

    @Post('invites/:inviteId/cancel')
    @ApiBearerAuth()
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(UserRole.PLAYER, UserRole.ADMIN)
    cancelInvite(@Param('inviteId') inviteId: string, @Request() req: AuthenticatedRequest) {
        return this.teamsService.cancelInvite(inviteId, {
            id: req.user.id,
            role: req.user.role,
        });
    }

    @Get('invites/me')
    @ApiBearerAuth()
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(UserRole.PLAYER)
    findMyPendingInvites(@Request() req: AuthenticatedRequest) {
        return this.teamsService.findMyPendingInvites(req.user.id);
    }

    @Get(':teamId/invites')
    @ApiBearerAuth()
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(UserRole.PLAYER, UserRole.ADMIN)
    findPendingInvitesByTeam(@Param('teamId') teamId: string, @Request() req: AuthenticatedRequest) {
        return this.teamsService.findPendingInvitesByTeam(teamId, {
            id: req.user.id,
            role: req.user.role,
        });
    }

    @Delete(':teamId/members/:memberId')
    @ApiBearerAuth()
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(UserRole.PLAYER, UserRole.ADMIN)
    removeMember(
        @Param('teamId') teamId: string,
        @Param('memberId') memberId: string,
        @Request() req: AuthenticatedRequest,
    ) {
        return this.teamsService.removeMember(teamId, memberId, {
            id: req.user.id,
            role: req.user.role,
        });
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
