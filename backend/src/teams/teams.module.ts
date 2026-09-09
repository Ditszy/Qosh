import { Module } from '@nestjs/common';
import { NotificationsModule } from '../notifications/notifications.module';
import { TournamentsModule } from '../tournaments/tournaments.module';
import { TeamsController } from './teams.controller';
import { TeamsLiveService } from './teams-live.service';
import { TeamsService } from './teams.service';

@Module({
    imports: [NotificationsModule, TournamentsModule],
    controllers: [TeamsController],
    providers: [TeamsService, TeamsLiveService],
    exports: [TeamsService],
})
export class TeamsModule { }
