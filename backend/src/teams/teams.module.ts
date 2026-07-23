import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Tournament } from '../tournaments/tournament.entity';
import { TeamMember } from './team-member.entity';
import { Team } from './team.entity';
import { TeamsService } from './teams.service';

@Module({
    imports: [TypeOrmModule.forFeature([Team, TeamMember, Tournament])],
    providers: [TeamsService],
    exports: [TeamsService],
})
export class TeamsModule { }
