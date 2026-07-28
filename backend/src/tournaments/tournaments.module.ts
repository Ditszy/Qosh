import { Module } from '@nestjs/common';
import { NotificationsModule } from '../notifications/notifications.module';
import { TournamentLiveService } from './tournament-live.service';
import { TournamentsController } from './tournaments.controller';
import { TournamentsService } from './tournaments.service';

@Module({
    imports: [NotificationsModule],
    controllers: [TournamentsController],
    providers: [TournamentLiveService, TournamentsService],
    exports: [TournamentLiveService, TournamentsService],
})
export class TournamentsModule { }
