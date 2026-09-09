import { BadRequestException, ForbiddenException, Injectable } from '@nestjs/common';
import { UserRole } from '../../common/user-role.enum';
import { TournamentStatus } from '../../tournaments/tournament-status.enum';
import { TeamMemberRole } from '../team-member-role.enum';
import { preStartTournamentStatuses } from './teams.constants';
import type { TeamActor } from './team.types';

@Injectable()
export class TeamAccessService {
    ensureSignupsOpen(status: TournamentStatus): void {
        if (status !== TournamentStatus.SIGNUPS_OPEN) {
            throw new BadRequestException('Team roster changes are only available while signups are open');
        }
    }

    ensureTournamentBeforeStart(status: TournamentStatus): void {
        if (!preStartTournamentStatuses.includes(status)) {
            throw new BadRequestException('Teams can only be removed before tournament start');
        }
    }

    ensureCanDisbandTeam(
        team: {
            tournament: { organizerId: string; status: TournamentStatus };
            members: Array<{ userId: string; role: TeamMemberRole }>;
        },
        actor: TeamActor,
    ): void {
        this.ensureTournamentBeforeStart(team.tournament.status);

        if (actor.role === UserRole.ADMIN) {
            return;
        }

        if (actor.role === UserRole.ORGANIZER && team.tournament.organizerId === actor.id) {
            return;
        }

        if (team.tournament.status !== TournamentStatus.SIGNUPS_OPEN) {
            throw new BadRequestException('Team captains can only disband teams while signups are open');
        }

        this.ensureCanManageTeam(team, actor);
    }

    ensureCanManageTeam(
        team: { members: Array<{ userId: string; role: TeamMemberRole }> },
        actor: TeamActor,
    ): void {
        if (actor.role === UserRole.ADMIN) {
            return;
        }

        const captainMembership = team.members.find((member) => {
            return member.userId === actor.id && member.role === TeamMemberRole.CAPTAIN;
        });

        if (!captainMembership) {
            throw new ForbiddenException('Only team captains can manage this team');
        }
    }
}
