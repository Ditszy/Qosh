import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { UserRole } from '../common/user-role.enum';
import { PrismaService } from '../prisma/prisma.service';
import { ScheduleMatchDto } from './dto/schedule-match.dto';
import { MatchAccessService } from './match-access.service';
import { MatchStatus } from './match-status.enum';
import { MatchesReadService } from './matches-read.service';
import { MatchActor, MatchWithRelations } from './types/match.types';

@Injectable()
export class MatchSchedulingService {
    constructor(
        private readonly prisma: PrismaService,
        private readonly matchAccessService: MatchAccessService,
        private readonly matchesReadService: MatchesReadService,
    ) { }

    async schedule(id: string, scheduleMatchDto: ScheduleMatchDto, actor: MatchActor): Promise<MatchWithRelations> {
        const match = await this.prisma.match.findUnique({
            where: { id },
            include: {
                tournament: true,
            },
        });

        if (!match) {
            throw new NotFoundException('Match not found');
        }

        this.matchAccessService.ensureCanManageTournament(match.tournament, actor);

        if (match.status === MatchStatus.FINAL) {
            throw new BadRequestException('Final matches cannot be scheduled');
        }

        if (scheduleMatchDto.scorerId !== undefined) {
            await this.ensureUserHasRole(scheduleMatchDto.scorerId, UserRole.SCORER, 'Scorer not found');
        }

        if (scheduleMatchDto.refereeId !== undefined) {
            await this.ensureUserHasRole(scheduleMatchDto.refereeId, UserRole.REFEREE, 'Referee not found');
        }

        const data: {
            scheduledAt?: Date;
            location?: string;
            scorerId?: string;
            refereeId?: string;
        } = {};

        if (scheduleMatchDto.scheduledAt !== undefined) {
            data.scheduledAt = new Date(scheduleMatchDto.scheduledAt);
        }

        if (scheduleMatchDto.location !== undefined) {
            data.location = scheduleMatchDto.location;
        }

        if (scheduleMatchDto.scorerId !== undefined) {
            data.scorerId = scheduleMatchDto.scorerId;
        }

        if (scheduleMatchDto.refereeId !== undefined) {
            data.refereeId = scheduleMatchDto.refereeId;
        }

        const updatedMatch = await this.prisma.match.update({
            where: { id },
            data,
            include: this.matchesReadService.matchInclude(),
        });

        return this.matchesReadService.withCurrentClock(updatedMatch);
    }

    private async ensureUserHasRole(userId: string, role: UserRole, notFoundMessage: string): Promise<void> {
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
            select: {
                role: true,
            },
        });

        if (!user) {
            throw new NotFoundException(notFoundMessage);
        }

        if (user.role !== role) {
            throw new BadRequestException(`User must have ${role} role`);
        }
    }
}
