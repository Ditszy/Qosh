import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { UserRole } from '../../common/user-role.enum';
import { NotificationType } from '../../notifications/enums/notification-type.enum';
import { NotificationsService } from '../../notifications/notifications.service';
import { NotificationRecord } from '../../notifications/types/notification.types';
import { PrismaService } from '../../prisma/prisma.service';
import { ScheduleMatchDto } from '../dto/schedule-match.dto';
import { MatchAccessService } from './match-access.service';
import { MatchStatus } from '../enums/match-status.enum';
import { MatchesReadService } from './matches-read.service';
import { MatchActor, MatchWithRelations } from '../types/match.types';

@Injectable()
export class MatchSchedulingService {
    constructor(
        private readonly prisma: PrismaService,
        private readonly matchAccessService: MatchAccessService,
        private readonly matchesReadService: MatchesReadService,
        private readonly notificationsService: NotificationsService,
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

        const shouldNotifyScorer = scheduleMatchDto.scorerId !== undefined && scheduleMatchDto.scorerId !== match.scorerId;
        const shouldNotifyReferee = scheduleMatchDto.refereeId !== undefined && scheduleMatchDto.refereeId !== match.refereeId;
        const scheduledAt = scheduleMatchDto.scheduledAt !== undefined
            ? new Date(scheduleMatchDto.scheduledAt)
            : undefined;
        const scheduledAtChanged = scheduledAt !== undefined
            && scheduledAt.getTime() !== match.scheduledAt?.getTime();
        const locationChanged = scheduleMatchDto.location !== undefined && scheduleMatchDto.location !== match.location;
        const shouldNotifyScheduleChange = scheduledAtChanged || locationChanged;

        const data: {
            scheduledAt?: Date;
            location?: string;
            scorerId?: string;
            refereeId?: string;
        } = {};

        if (scheduledAt !== undefined) {
            data.scheduledAt = scheduledAt;
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

        const result = await this.prisma.$transaction(async (tx) => {
            const updatedMatch = await tx.match.update({
                where: { id },
                data,
                include: this.matchesReadService.matchInclude(),
            });

            const notifications: NotificationRecord[] = [];

            if (shouldNotifyScorer && updatedMatch.scorerId) {
                notifications.push(await this.notificationsService.create(
                    {
                        recipientId: updatedMatch.scorerId,
                        type: NotificationType.MATCH_ASSIGNMENT,
                        title: 'Scorer assignment received',
                        body: `You were assigned as scorer for ${updatedMatch.tournament.name}.`,
                        tournamentId: updatedMatch.tournamentId,
                        matchId: updatedMatch.id,
                    },
                    tx,
                    false,
                ));
            }

            if (shouldNotifyReferee && updatedMatch.refereeId) {
                notifications.push(await this.notificationsService.create(
                    {
                        recipientId: updatedMatch.refereeId,
                        type: NotificationType.MATCH_ASSIGNMENT,
                        title: 'Referee assignment received',
                        body: `You were assigned as referee for ${updatedMatch.tournament.name}.`,
                        tournamentId: updatedMatch.tournamentId,
                        matchId: updatedMatch.id,
                    },
                    tx,
                    false,
                ));
            }

            if (shouldNotifyScheduleChange) {
                const recipientIds = new Set<string>();

                if (updatedMatch.scorerId) {
                    recipientIds.add(updatedMatch.scorerId);
                }

                if (updatedMatch.refereeId) {
                    recipientIds.add(updatedMatch.refereeId);
                }

                const teamIds = [updatedMatch.teamAId, updatedMatch.teamBId].filter((teamId): teamId is string => {
                    return Boolean(teamId);
                });

                const teamMembers = await tx.teamMember.findMany({
                    where: {
                        teamId: {
                            in: teamIds,
                        },
                    },
                    select: {
                        userId: true,
                    },
                });

                teamMembers.forEach((member) => {
                    recipientIds.add(member.userId);
                });

                for (const recipientId of recipientIds) {
                    notifications.push(await this.notificationsService.create(
                        {
                            recipientId,
                            type: NotificationType.MATCH_SCHEDULE_CHANGED,
                            title: 'Match schedule changed',
                            body: `The schedule for ${updatedMatch.tournament.name} was updated.`,
                            tournamentId: updatedMatch.tournamentId,
                            matchId: updatedMatch.id,
                        },
                        tx,
                        false,
                    ));
                }
            }

            return { updatedMatch, notifications };
        });

        result.notifications.forEach((notification) => {
            this.notificationsService.publishCreated(notification);
        });

        return this.matchesReadService.withCurrentClock(result.updatedMatch);
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
