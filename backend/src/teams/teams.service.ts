import {
    BadRequestException,
    ConflictException,
    ForbiddenException,
    Injectable,
    NotFoundException,
} from '@nestjs/common';
import { UserRole } from '../common/user-role.enum';
import { NotificationType } from '../notifications/enums/notification-type.enum';
import { NotificationsService } from '../notifications/notifications.service';
import { TournamentLiveEvent } from '../tournaments/types/tournament-live.types';
import { TournamentLiveService } from '../tournaments/tournament-live.service';
import { TournamentStatus } from '../tournaments/tournament-status.enum';
import { PrismaService } from '../prisma/prisma.service';
import { PublicUser, publicUserSelect } from '../users/users.service';
import { CreateTeamDto } from './dto/create-team.dto';
import { SendTeamInviteDto } from './dto/send-team-invite.dto';
import { TeamInviteStatus } from './team-invite-status.enum';
import { TeamMemberRole } from './team-member-role.enum';

const MAX_ROSTER_SIZE = 4;

type TeamActor = {
    id: string;
    role: UserRole;
};

type TeamRecord = {
    id: string;
    name: string;
    tournamentId: string;
    createdAt: Date;
    updatedAt: Date;
};

type TeamMemberRecord = {
    id: string;
    teamId: string;
    userId: string;
    role: TeamMemberRole;
    joinedAt: Date;
};

type TeamWithMembers = TeamRecord & {
    members: Array<TeamMemberRecord & { user: PublicUser }>;
};

type TeamInviteRecord = {
    id: string;
    teamId: string;
    invitedUserId: string;
    inviterId: string;
    status: TeamInviteStatus;
    createdAt: Date;
    respondedAt: Date | null;
};

type TeamInviteWithUsers = TeamInviteRecord & {
    invitedUser: PublicUser;
    inviter: PublicUser;
};

type TournamentSummary = {
    id: string;
    name: string;
    description: string | null;
    location: string;
    startsAt: Date;
    maxTeams: number;
    status: TournamentStatus;
    organizerId: string;
    createdAt: Date;
    updatedAt: Date;
};

type TeamInviteWithTeam = TeamInviteWithUsers & {
    team: TeamRecord & {
        tournament: TournamentSummary;
    };
};

@Injectable()
export class TeamsService {
    constructor(
        private readonly prisma: PrismaService,
        private readonly notificationsService: NotificationsService,
        private readonly tournamentLiveService: TournamentLiveService,
    ) { }

    async create(createTeamDto: CreateTeamDto, captainId: string): Promise<TeamWithMembers> {
        const tournament = await this.prisma.tournament.findUnique({
            where: { id: createTeamDto.tournamentId },
        });

        if (!tournament) {
            throw new NotFoundException('Tournament not found');
        }

        if (tournament.status !== TournamentStatus.SIGNUPS_OPEN) {
            throw new BadRequestException('Team registration is only available while signups are open');
        }

        const existingTeam = await this.prisma.team.findFirst({
            where: {
                tournamentId: createTeamDto.tournamentId,
                name: createTeamDto.name,
            },
        });

        if (existingTeam) {
            throw new ConflictException('Team name already exists in this tournament');
        }

        const registeredTeamCount = await this.prisma.team.count({
            where: { tournamentId: createTeamDto.tournamentId },
        });

        if (registeredTeamCount >= tournament.maxTeams) {
            throw new BadRequestException('Tournament has reached the maximum number of teams');
        }

        const existingMembership = await this.prisma.teamMember.findFirst({
            where: {
                userId: captainId,
                team: {
                    tournamentId: createTeamDto.tournamentId,
                },
            },
        });

        if (existingMembership) {
            throw new ConflictException('Player is already registered in this tournament');
        }

        const createdTeam = await this.prisma.$transaction(async (tx) => {
            return tx.team.create({
                data: {
                    name: createTeamDto.name,
                    tournamentId: createTeamDto.tournamentId,
                    members: {
                        create: {
                            userId: captainId,
                            role: TeamMemberRole.CAPTAIN,
                        },
                    },
                },
            });
        });

        const liveTeam = await this.findById(createdTeam.id);
        this.tournamentLiveService.publish(createdTeam.tournamentId, TournamentLiveEvent.TEAM_CREATED, {
            team: liveTeam,
        });

        return liveTeam;
    }

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

    async sendInvite(
        teamId: string,
        sendTeamInviteDto: SendTeamInviteDto,
        actor: TeamActor,
    ): Promise<TeamInviteWithUsers> {
        const team = await this.prisma.team.findUnique({
            where: { id: teamId },
            include: {
                tournament: true,
                members: true,
            },
        });

        if (!team) {
            throw new NotFoundException('Team not found');
        }

        this.ensureSignupsOpen(team.tournament.status);
        this.ensureCanManageTeam(team, actor);

        if (team.members.length >= MAX_ROSTER_SIZE) {
            throw new BadRequestException('Team roster is already full');
        }

        const invitedUser = await this.prisma.user.findUnique({
            where: { id: sendTeamInviteDto.invitedUserId },
            select: publicUserSelect,
        });

        if (!invitedUser) {
            throw new NotFoundException('Invited user not found');
        }

        if (invitedUser.role !== UserRole.PLAYER) {
            throw new BadRequestException('Only players can be invited to teams');
        }

        const existingMembership = await this.prisma.teamMember.findFirst({
            where: {
                userId: sendTeamInviteDto.invitedUserId,
                team: {
                    tournamentId: team.tournamentId,
                },
            },
        });

        if (existingMembership) {
            throw new ConflictException('Player is already registered in this tournament');
        }

        const existingPendingInvite = await this.prisma.teamInvite.findFirst({
            where: {
                teamId,
                invitedUserId: sendTeamInviteDto.invitedUserId,
                status: TeamInviteStatus.PENDING,
            },
        });

        if (existingPendingInvite) {
            throw new ConflictException('Player already has a pending invite to this team');
        }

        const result = await this.prisma.$transaction(async (tx) => {
            const invite = await tx.teamInvite.create({
                data: {
                    teamId,
                    invitedUserId: sendTeamInviteDto.invitedUserId,
                    inviterId: actor.id,
                },
                include: this.teamInviteInclude(),
            });

            const notification = await this.notificationsService.create(
                {
                    recipientId: invite.invitedUserId,
                    type: NotificationType.TEAM_INVITE,
                    title: 'Team invite received',
                    body: `${invite.inviter.firstName} ${invite.inviter.lastName} invited you to join ${team.name} in ${team.tournament.name}.`,
                    tournamentId: team.tournamentId,
                    teamId: team.id,
                    inviteId: invite.id,
                },
                tx,
                false,
            );

            return { invite, notification };
        });

        this.notificationsService.publishCreated(result.notification);

        return result.invite;
    }

    async acceptInvite(inviteId: string, actor: TeamActor): Promise<TeamInviteWithUsers> {
        const invite = await this.findPendingInviteForResponse(inviteId, actor.id);

        const acceptedInvite = await this.prisma.$transaction(async (tx) => {
            const freshInvite = await tx.teamInvite.findUnique({
                where: { id: invite.id },
                include: {
                    team: {
                        include: {
                            tournament: true,
                        },
                    },
                },
            });

            if (!freshInvite || freshInvite.status !== TeamInviteStatus.PENDING) {
                throw new BadRequestException('Invite is no longer pending');
            }

            this.ensureSignupsOpen(freshInvite.team.tournament.status);

            const rosterCount = await tx.teamMember.count({
                where: { teamId: freshInvite.teamId },
            });

            if (rosterCount >= MAX_ROSTER_SIZE) {
                throw new BadRequestException('Team roster is already full');
            }

            const existingMembership = await tx.teamMember.findFirst({
                where: {
                    userId: actor.id,
                    team: {
                        tournamentId: freshInvite.team.tournamentId,
                    },
                },
            });

            if (existingMembership) {
                throw new ConflictException('Player is already registered in this tournament');
            }

            await tx.teamMember.create({
                data: {
                    teamId: freshInvite.teamId,
                    userId: actor.id,
                    role: TeamMemberRole.MEMBER,
                },
            });

            return tx.teamInvite.update({
                where: { id: freshInvite.id },
                data: {
                    status: TeamInviteStatus.ACCEPTED,
                    respondedAt: new Date(),
                },
                include: this.teamInviteInclude(),
            });
        });

        const liveTeam = await this.findById(acceptedInvite.teamId);
        this.tournamentLiveService.publish(liveTeam.tournamentId, TournamentLiveEvent.ROSTER_UPDATED, {
            team: liveTeam,
        });

        return acceptedInvite;
    }

    async declineInvite(inviteId: string, actor: TeamActor): Promise<TeamInviteWithUsers> {
        const invite = await this.findPendingInviteForResponse(inviteId, actor.id);

        return this.prisma.teamInvite.update({
            where: { id: invite.id },
            data: {
                status: TeamInviteStatus.DECLINED,
                respondedAt: new Date(),
            },
            include: this.teamInviteInclude(),
        });
    }

    async cancelInvite(inviteId: string, actor: TeamActor): Promise<TeamInviteWithUsers> {
        const invite = await this.prisma.teamInvite.findUnique({
            where: { id: inviteId },
            include: {
                team: {
                    include: {
                        members: true,
                    },
                },
            },
        });

        if (!invite) {
            throw new NotFoundException('Invite not found');
        }

        if (invite.status !== TeamInviteStatus.PENDING) {
            throw new BadRequestException('Only pending invites can be cancelled');
        }

        this.ensureCanManageTeam(invite.team, actor);

        return this.prisma.teamInvite.update({
            where: { id: invite.id },
            data: {
                status: TeamInviteStatus.CANCELLED,
                respondedAt: new Date(),
            },
            include: this.teamInviteInclude(),
        });
    }

    async findMyPendingInvites(userId: string): Promise<TeamInviteWithTeam[]> {
        return this.prisma.teamInvite.findMany({
            where: {
                invitedUserId: userId,
                status: TeamInviteStatus.PENDING,
            },
            include: this.teamInviteWithTeamInclude(),
            orderBy: {
                createdAt: 'desc',
            },
        });
    }

    async findMyTeams(userId: string): Promise<TeamWithMembers[]> {
        return this.prisma.team.findMany({
            where: {
                members: {
                    some: { userId },
                },
            },
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
                createdAt: 'desc',
            },
        });
    }

    async findPendingInvitesByTeam(teamId: string, actor: TeamActor): Promise<TeamInviteWithUsers[]> {
        const team = await this.prisma.team.findUnique({
            where: { id: teamId },
            include: {
                members: true,
            },
        });

        if (!team) {
            throw new NotFoundException('Team not found');
        }

        this.ensureCanManageTeam(team, actor);

        return this.prisma.teamInvite.findMany({
            where: {
                teamId,
                status: TeamInviteStatus.PENDING,
            },
            include: this.teamInviteInclude(),
            orderBy: {
                createdAt: 'desc',
            },
        });
    }

    async removeMember(teamId: string, memberId: string, actor: TeamActor): Promise<TeamWithMembers> {
        const team = await this.prisma.team.findUnique({
            where: { id: teamId },
            include: {
                tournament: true,
                members: true,
            },
        });

        if (!team) {
            throw new NotFoundException('Team not found');
        }

        this.ensureSignupsOpen(team.tournament.status);
        this.ensureCanManageTeam(team, actor);

        const member = team.members.find((teamMember) => teamMember.id === memberId);

        if (!member) {
            throw new NotFoundException('Team member not found');
        }

        if (member.role === TeamMemberRole.CAPTAIN) {
            throw new BadRequestException('Team captain cannot be removed');
        }

        await this.prisma.teamMember.delete({
            where: { id: memberId },
        });

        const liveTeam = await this.findById(teamId);
        this.tournamentLiveService.publish(liveTeam.tournamentId, TournamentLiveEvent.ROSTER_UPDATED, {
            team: liveTeam,
        });

        return liveTeam;
    }

    async transferCaptain(teamId: string, memberId: string, actor: TeamActor): Promise<TeamWithMembers> {
        const team = await this.prisma.team.findUnique({
            where: { id: teamId },
            include: {
                tournament: true,
                members: true,
            },
        });

        if (!team) {
            throw new NotFoundException('Team not found');
        }

        this.ensureSignupsOpen(team.tournament.status);
        this.ensureCanManageTeam(team, actor);

        const newCaptain = team.members.find((teamMember) => teamMember.id === memberId);

        if (!newCaptain) {
            throw new NotFoundException('Team member not found');
        }

        if (newCaptain.role === TeamMemberRole.CAPTAIN) {
            throw new BadRequestException('Selected member is already the team captain');
        }

        await this.prisma.$transaction(async (tx) => {
            await tx.teamMember.updateMany({
                where: {
                    teamId,
                    role: TeamMemberRole.CAPTAIN,
                },
                data: {
                    role: TeamMemberRole.MEMBER,
                },
            });

            await tx.teamMember.update({
                where: { id: memberId },
                data: {
                    role: TeamMemberRole.CAPTAIN,
                },
            });
        });

        const liveTeam = await this.findById(teamId);
        this.tournamentLiveService.publish(liveTeam.tournamentId, TournamentLiveEvent.ROSTER_UPDATED, {
            team: liveTeam,
        });

        return liveTeam;
    }

    private async findPendingInviteForResponse(inviteId: string, userId: string): Promise<TeamInviteRecord> {
        const invite = await this.prisma.teamInvite.findUnique({
            where: { id: inviteId },
        });

        if (!invite) {
            throw new NotFoundException('Invite not found');
        }

        if (invite.invitedUserId !== userId) {
            throw new ForbiddenException('You can only respond to your own team invites');
        }

        if (invite.status !== TeamInviteStatus.PENDING) {
            throw new BadRequestException('Only pending invites can be responded to');
        }

        return invite;
    }

    private ensureSignupsOpen(status: TournamentStatus): void {
        if (status !== TournamentStatus.SIGNUPS_OPEN) {
            throw new BadRequestException('Team roster changes are only available while signups are open');
        }
    }

    private ensureCanManageTeam(
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

    private teamInviteInclude() {
        return {
            invitedUser: {
                select: publicUserSelect,
            },
            inviter: {
                select: publicUserSelect,
            },
        };
    }

    private teamInviteWithTeamInclude() {
        return {
            ...this.teamInviteInclude(),
            team: {
                include: {
                    tournament: true,
                },
            },
        };
    }
}
