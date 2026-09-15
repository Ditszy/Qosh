import {
    BadRequestException,
    ConflictException,
    ForbiddenException,
    Injectable,
    MessageEvent,
    NotFoundException,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { UserRole } from '../common/user-role.enum';
import { NotificationType } from '../notifications/enums/notification-type.enum';
import { NotificationsService } from '../notifications/notifications.service';
import { TournamentLiveEvent } from '../tournaments/types/tournament-live.types';
import { TournamentLiveService } from '../tournaments/tournament-live.service';
import { TournamentStatus } from '../tournaments/tournament-status.enum';
import { PrismaService } from '../prisma/prisma.service';
import { publicUserSelect } from '../users/users.service';
import { CreateTeamDto } from './dto/create-team.dto';
import { SendTeamInviteDto } from './dto/send-team-invite.dto';
import { TeamInviteStatus } from './team-invite-status.enum';
import { TeamMemberRole } from './team-member-role.enum';
import { TeamAccessService } from './support/team-access.service';
import { teamInviteInclude } from './support/team-invite-include.helper';
import { MAX_ROSTER_SIZE } from './support/teams.constants';
import { TeamsLiveService } from './support/teams-live.service';
import { TeamsReadService } from './support/teams-read.service';
import type {
    DisbandTeamResult,
    TeamActor,
    TeamInviteRecord,
    TeamInviteWithTeam,
    TeamInviteWithUsers,
    TeamWithMembers,
    TeamWithMembersAndTournament,
} from './support/team.types';

@Injectable()
export class TeamsService {
    constructor(
        private readonly prisma: PrismaService,
        private readonly notificationsService: NotificationsService,
        private readonly tournamentLiveService: TournamentLiveService,
        private readonly teamsLiveService: TeamsLiveService,
        private readonly teamsReadService: TeamsReadService,
        private readonly teamAccessService: TeamAccessService,
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
        this.teamsLiveService.publishTeamUpdated(liveTeam);

        return liveTeam;
    }

    watchMyTeams(userId: string): Observable<MessageEvent> {
        return this.teamsLiveService.watchMyTeams(userId);
    }

    async findByTournamentId(tournamentId: string): Promise<TeamWithMembers[]> {
        return this.teamsReadService.findByTournamentId(tournamentId);
    }

    async findById(id: string): Promise<TeamWithMembers> {
        return this.teamsReadService.findById(id);
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

        this.teamAccessService.ensureSignupsOpen(team.tournament.status);
        this.teamAccessService.ensureCanManageTeam(team, actor);

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
                include: teamInviteInclude(),
            });

            const notification = await this.notificationsService.create(
                {
                    recipientId: invite.invitedUserId,
                    type: NotificationType.TEAM_INVITE,
                    title: 'Poziv za tim',
                    body: `Stigao ti je poziv za tim ${team.name} na turniru ${team.tournament.name}.`,
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

    async acceptInvite(inviteId: string, actor: TeamActor): Promise<TeamWithMembers> {
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

            this.teamAccessService.ensureSignupsOpen(freshInvite.team.tournament.status);

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
                include: teamInviteInclude(),
            });
        });

        const liveTeam = await this.findById(acceptedInvite.teamId);
        this.tournamentLiveService.publish(liveTeam.tournamentId, TournamentLiveEvent.ROSTER_UPDATED, {
            team: liveTeam,
        });
        this.teamsLiveService.publishTeamUpdated(liveTeam);

        return liveTeam;
    }

    async declineInvite(inviteId: string, actor: TeamActor): Promise<TeamInviteWithUsers> {
        const invite = await this.findPendingInviteForResponse(inviteId, actor.id);

        return this.prisma.teamInvite.update({
            where: { id: invite.id },
            data: {
                status: TeamInviteStatus.DECLINED,
                respondedAt: new Date(),
            },
            include: teamInviteInclude(),
        });
    }

    async findMyPendingInvites(userId: string): Promise<TeamInviteWithTeam[]> {
        return this.teamsReadService.findMyPendingInvites(userId);
    }

    async findMyTeams(userId: string): Promise<TeamWithMembersAndTournament[]> {
        return this.teamsReadService.findMyTeams(userId);
    }

    async disband(teamId: string, actor: TeamActor): Promise<DisbandTeamResult> {
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

        this.teamAccessService.ensureCanDisbandTeam(team, actor);

        const generatedMatchCount = await this.prisma.match.count({
            where: { tournamentId: team.tournamentId },
        });

        if (generatedMatchCount > 0) {
            throw new BadRequestException('Teams cannot be removed after bracket generation');
        }

        await this.prisma.$transaction(async (tx) => {
            await tx.teamInvite.deleteMany({ where: { teamId } });
            await tx.teamMember.deleteMany({ where: { teamId } });
            await tx.team.delete({ where: { id: teamId } });
        });

        this.tournamentLiveService.publish(team.tournamentId, TournamentLiveEvent.TEAM_REMOVED, {
            teamId,
        });
        this.teamsLiveService.publishTeamRemoved(team.members.map((member) => member.userId), teamId);

        return { success: true, teamId, tournamentId: team.tournamentId };
    }

    async leave(teamId: string, actor: TeamActor): Promise<TeamWithMembers> {
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

        this.teamAccessService.ensureSignupsOpen(team.tournament.status);

        const membership = team.members.find((member) => member.userId === actor.id);

        if (!membership) {
            throw new ForbiddenException('You are not a member of this team');
        }

        if (membership.role === TeamMemberRole.CAPTAIN) {
            throw new BadRequestException('Team captain must transfer captaincy or disband the team');
        }

        await this.prisma.teamMember.delete({
            where: { id: membership.id },
        });

        const liveTeam = await this.findById(teamId);
        this.tournamentLiveService.publish(liveTeam.tournamentId, TournamentLiveEvent.ROSTER_UPDATED, {
            team: liveTeam,
        });
        this.teamsLiveService.publishTeamUpdated(liveTeam);
        this.teamsLiveService.publishTeamRemoved([actor.id], teamId);

        return liveTeam;
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

        this.teamAccessService.ensureCanManageTeam(team, actor);

        return this.prisma.teamInvite.findMany({
            where: {
                teamId,
                status: TeamInviteStatus.PENDING,
            },
            include: teamInviteInclude(),
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

        this.teamAccessService.ensureSignupsOpen(team.tournament.status);
        this.teamAccessService.ensureCanManageTeam(team, actor);

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
        this.teamsLiveService.publishTeamUpdated(liveTeam);
        this.teamsLiveService.publishTeamRemoved([member.userId], teamId);

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

        this.teamAccessService.ensureSignupsOpen(team.tournament.status);
        this.teamAccessService.ensureCanManageTeam(team, actor);

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
        this.teamsLiveService.publishTeamUpdated(liveTeam);

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

}
