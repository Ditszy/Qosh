import { Module } from '@nestjs/common';
import { ProfilesController } from './profiles.controller';
import { StatisticsController } from './statistics.controller';
import { StatisticsService } from './statistics.service';

@Module({
    controllers: [ProfilesController, StatisticsController],
    providers: [StatisticsService],
})
export class StatisticsModule { }
