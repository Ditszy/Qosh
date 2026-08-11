import { Body, Controller, Get, Param, Post, Request, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles } from '../common/roles.decorator';
import { RolesGuard } from '../common/roles.guard';
import { UserRole } from '../common/user-role.enum';
import { CreateRefereeReportDto } from './dto/create-referee-report.dto';
import { ReportsService } from './reports.service';

type AuthenticatedRequest = {
    user: {
        id: string;
        email: string;
        role: UserRole;
    };
};

@ApiTags('reports')
@Controller('matches/:matchId/report')
export class ReportsController {
    constructor(private readonly reportsService: ReportsService) { }

    @Get()
    findByMatchId(@Param('matchId') matchId: string) {
        return this.reportsService.findByMatchId(matchId);
    }

    @Post()
    @ApiBearerAuth()
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(UserRole.REFEREE, UserRole.ADMIN)
    create(
        @Param('matchId') matchId: string,
        @Body() createRefereeReportDto: CreateRefereeReportDto,
        @Request() req: AuthenticatedRequest,
    ) {
        return this.reportsService.createForMatch(matchId, createRefereeReportDto, {
            id: req.user.id,
            role: req.user.role,
        });
    }
}
