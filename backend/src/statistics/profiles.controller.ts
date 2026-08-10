import { Controller, Get, Param, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { StatisticsService } from './statistics.service';

@ApiTags('profiles')
@Controller('profiles')
export class ProfilesController {
    constructor(private readonly statisticsService: StatisticsService) { }

    @Get('search')
    searchPlayers(@Query('q') query = '') {
        return this.statisticsService.searchPlayerProfiles(query);
    }

    @Get(':userId')
    findByUserId(@Param('userId') userId: string) {
        return this.statisticsService.findPlayerProfile(userId);
    }
}
