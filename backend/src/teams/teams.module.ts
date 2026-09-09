import { Module } from '@nestjs/common';
import { NotificationsModule } from '../notifications/notifications.module';
import { TournamentsModule } from '../tournaments/tournaments.module';
import { TeamAccessService } from './support/team-access.service';
import { TeamsLiveService } from './support/teams-live.service';
import { TeamsReadService } from './support/teams-read.service';
import { TeamsController } from './teams.controller';
import { TeamsService } from './teams.service';

@Module({
    imports: [NotificationsModule, TournamentsModule],
    controllers: [TeamsController],
    providers: [TeamsService, TeamsLiveService, TeamsReadService, TeamAccessService],
    exports: [TeamsService],
})
export class TeamsModule { }
