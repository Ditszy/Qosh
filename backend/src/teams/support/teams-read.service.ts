import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { publicUserSelect } from '../../users/users.service';
import { TeamInviteStatus } from '../team-invite-status.enum';
import { teamInviteWithTeamInclude } from './team-invite-include.helper';
import { inactiveTournamentStatuses } from './teams.constants';
import type { TeamInviteWithTeam, TeamWithMembers, TeamWithMembersAndTournament } from './team.types';

@Injectable()
export class TeamsReadService {
    constructor(private readonly prisma: PrismaService) { }

    async findByTournamentId(tournamentId: string): Promise<TeamWithMembers[]> {
        const tournament = await this.prisma.tournament.findUnique({
            where: { id: tournamentId },
        });

        if (!tournament) {
            throw new NotFoundException('Tournament not found');
        }

        return this.prisma.team.findMany({
            where: { tournamentId },
            include: {
                members: {
                    include: {
                        user: {
                            select: publicUserSelect,
                        },
                    },
                    orderBy: {
                        joinedAt: 'asc',
                    },
                },
            },
            orderBy: {
                createdAt: 'asc',
            },
        });
    }

    async findById(id: string): Promise<TeamWithMembers> {
        const team = await this.prisma.team.findUnique({
            where: { id },
            include: {
                members: {
                    include: {
                        user: {
                            select: publicUserSelect,
                        },
                    },
                    orderBy: {
                        joinedAt: 'asc',
                    },
                },
            },
        });

        if (!team) {
            throw new NotFoundException('Team not found');
        }

        return team;
    }

    async findMyPendingInvites(userId: string): Promise<TeamInviteWithTeam[]> {
        return this.prisma.teamInvite.findMany({
            where: {
                invitedUserId: userId,
                status: TeamInviteStatus.PENDING,
                team: {
                    tournament: {
                        status: {
                            notIn: inactiveTournamentStatuses,
                        },
                    },
                },
            },
            include: teamInviteWithTeamInclude(),
            orderBy: {
                createdAt: 'desc',
            },
        });
    }

    async findMyTeams(userId: string): Promise<TeamWithMembersAndTournament[]> {
        return this.prisma.team.findMany({
            where: {
                members: {
                    some: { userId },
                },
                tournament: {
                    status: {
                        notIn: inactiveTournamentStatuses,
                    },
                },
            },
            include: {
                tournament: true,
                members: {
                    include: {
                        user: {
                            select: publicUserSelect,
                        },
                    },
                    orderBy: {
                        joinedAt: 'asc',
                    },
                },
            },
            orderBy: {
                createdAt: 'desc',
            },
        });
    }
}
