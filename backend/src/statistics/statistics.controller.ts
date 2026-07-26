import { Controller, Get, Param, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { FindPlayerStatisticsDto } from './dto/find-player-statistics.dto';
import { StatisticsService } from './statistics.service';

@ApiTags('statistics')
@Controller()
export class StatisticsController {
    constructor(private readonly statisticsService: StatisticsService) { }

    @Get('statistics/players')
    findPlayerStatistics(@Query() query: FindPlayerStatisticsDto) {
        return this.statisticsService.findPlayerStatistics(query);
    }

    @Get('statistics/players/leaders')
    findPlayerStatisticLeaders(@Query() query: FindPlayerStatisticsDto) {
        return this.statisticsService.findPlayerStatisticLeaders(query);
    }

    @Get('matches/:matchId/statistics')
    findMatchPlayerStatistics(@Param('matchId') matchId: string) {
        return this.statisticsService.findMatchPlayerStatistics(matchId);
    }

    @Get('tournaments/:tournamentId/statistics/players')
    findTournamentPlayerStatistics(
        @Param('tournamentId') tournamentId: string,
        @Query() query: FindPlayerStatisticsDto,
    ) {
        return this.statisticsService.findPlayerStatistics({
            ...query,
            tournamentId,
        });
    }

    @Get('tournaments/:tournamentId/statistics/players/leaders')
    findTournamentPlayerStatisticLeaders(
        @Param('tournamentId') tournamentId: string,
        @Query() query: FindPlayerStatisticsDto,
    ) {
        return this.statisticsService.findPlayerStatisticLeaders({
            ...query,
            tournamentId,
        });
    }
}
