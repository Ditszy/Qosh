import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { UsersModule } from './users/users.module';
import { AuthModule } from './auth/auth.module';
import { TournamentsModule } from './tournaments/tournaments.module';
import { TeamsModule } from './teams/teams.module';
import { PrismaModule } from './prisma/prisma.module';
import { MatchesModule } from './matches/matches.module';
import { StatisticsModule } from './statistics/statistics.module';
import { NotificationsModule } from './notifications/notifications.module';
import { ReportsModule } from './reports/reports.module';
import { LiveEventsModule } from './live-events/live-events.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    LiveEventsModule,
    PrismaModule,
    UsersModule,
    AuthModule,
    TournamentsModule,
    TeamsModule,
    MatchesModule,
    StatisticsModule,
    NotificationsModule,
    ReportsModule,
  ],
})
export class AppModule { }
