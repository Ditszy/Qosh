import { BadRequestException, ForbiddenException, Injectable } from '@nestjs/common';
import { UserRole } from '../common/user-role.enum';
import { MatchStatus } from './match-status.enum';
import { MatchActor } from './types/match.types';

@Injectable()
export class MatchAccessService {
    ensureCanManageTournament(
        tournament: { organizerId: string },
        actor: MatchActor,
    ): void {
        if (actor.role === UserRole.ADMIN) {
            return;
        }

        if (tournament.organizerId !== actor.id) {
            throw new ForbiddenException('You can only manage tournaments you own');
        }
    }

    ensureCanOperateMatchClock(match: { scorerId: string | null }, actor: MatchActor): void {
        if (actor.role === UserRole.ADMIN) {
            return;
        }

        if (match.scorerId !== actor.id) {
            throw new ForbiddenException('You can only operate matches assigned to you');
        }
    }

    ensureMatchCanUseClock(match: { status: MatchStatus }): void {
        if (match.status === MatchStatus.FINAL) {
            throw new BadRequestException('Final matches cannot use clock controls');
        }
    }
}
