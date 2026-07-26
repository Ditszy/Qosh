import { Controller, Get, Param } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { StatisticsService } from './statistics.service';

@ApiTags('profiles')
@Controller('profiles')
export class ProfilesController {
    constructor(private readonly statisticsService: StatisticsService) { }

    @Get(':userId')
    findByUserId(@Param('userId') userId: string) {
        return this.statisticsService.findPlayerProfile(userId);
    }
}
