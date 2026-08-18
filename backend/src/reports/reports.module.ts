import { Module } from '@nestjs/common';
import { MatchesModule } from '../matches/matches.module';
import { ReportsController } from './reports.controller';
import { ReportsService } from './reports.service';

@Module({
    imports: [MatchesModule],
    controllers: [ReportsController],
    providers: [ReportsService],
})
export class ReportsModule { }