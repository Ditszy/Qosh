import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Tournament } from './tournament.entity';
import { TournamentsService } from './tournaments.service';

@Module({
    imports: [TypeOrmModule.forFeature([Tournament])],
    providers: [TournamentsService],
    exports: [TournamentsService],
})
export class TournamentsModule { }
