import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { UserRole } from '../common/user-role.enum';
import { NotificationType } from '../notifications/enums/notification-type.enum';
import { NotificationsService } from '../notifications/notifications.service';
import { NotificationRecord } from '../notifications/types/notification.types';
import { PrismaService } from '../prisma/prisma.service';
import { CreateTournamentDto } from './dto/create-tournament.dto';
import { TournamentLiveEvent } from './types/tournament-live.types';
import { TournamentLiveService } from './tournament-live.service';
import { UpdateTournamentDto } from './dto/update-tournament.dto';
import { TournamentStatus } from './tournament-status.enum';

export type TournamentActor = {
    id: string;
    role: UserRole;
};

type TournamentRecord = {
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
    organizer?: {
        id: string;
        username: string;
        firstName: string;
        lastName: string;
    };
};

@Injectable()
export class TournamentsService {
    constructor(
        private readonly prisma: PrismaService,
        private readonly notificationsService: NotificationsService,
        private readonly tournamentLiveService: TournamentLiveService,
    ) { }

    async create(createTournamentDto: CreateTournamentDto, organizerId: string): Promise<TournamentRecord> {
        return this.prisma.tournament.create({
            data: {
                ...createTournamentDto,
                description: createTournamentDto.description ?? null,
                startsAt: new Date(createTournamentDto.startsAt),
                organizerId,
            },
        });
    }

    async findAll(): Promise<TournamentRecord[]> {
        return this.prisma.tournament.findMany({
            include: { organizer: { select: this.organizerSelect } },
            orderBy: [
                { startsAt: 'asc' },
                { createdAt: 'desc' },
            ],
        });
    }

    async findById(id: string): Promise<TournamentRecord> {
        const tournament = await this.prisma.tournament.findUnique({
            where: { id },
            include: { organizer: { select: this.organizerSelect } },
        });

        if (!tournament) {
            throw new NotFoundException('Tournament not found');
        }

        return tournament;
    }

    async update(id: string, updateTournamentDto: UpdateTournamentDto, actor: TournamentActor): Promise<TournamentRecord> {
        const tournament = await this.findById(id);

        this.ensureCanManageTournament(tournament, actor);
        this.ensureTournamentCanBeEdited(tournament);

        const data: {
            name?: string;
            description?: string | null;
            location?: string;
            startsAt?: Date;
            maxTeams?: number;
        } = {};

        if (updateTournamentDto.name !== undefined) {
            data.name = updateTournamentDto.name;
        }

        if (updateTournamentDto.description !== undefined) {
            data.description = updateTournamentDto.description;
        }

        if (updateTournamentDto.location !== undefined) {
            data.location = updateTournamentDto.location;
        }

        if (updateTournamentDto.startsAt !== undefined) {
            data.startsAt = new Date(updateTournamentDto.startsAt);
        }

        if (updateTournamentDto.maxTeams !== undefined) {
            data.maxTeams = updateTournamentDto.maxTeams;
        }

        return this.prisma.tournament.update({
            where: { id },
            data,
        });
    }

    async openSignups(id: string, actor: TournamentActor): Promise<TournamentRecord> {
        const tournament = await this.findById(id);

        this.ensureCanManageTournament(tournament, actor);

        if (tournament.status !== TournamentStatus.DRAFT) {
            throw new BadRequestException('Only draft tournaments can open signups');
        }

        const updatedTournament = await this.prisma.tournament.update({
            where: { id },
            data: { status: TournamentStatus.SIGNUPS_OPEN },
        });

        this.publishStatusChanged(updatedTournament);

        return updatedTournament;
    }

    async lockSignups(id: string, actor: TournamentActor): Promise<TournamentRecord> {
        const tournament = await this.findById(id);

        this.ensureCanManageTournament(tournament, actor);

        if (tournament.status !== TournamentStatus.SIGNUPS_OPEN) {
            throw new BadRequestException('Only tournaments with open signups can lock signups');
        }

        const updatedTournament = await this.prisma.tournament.update({
            where: { id },
            data: { status: TournamentStatus.SIGNUPS_LOCKED },
        });

        this.publishStatusChanged(updatedTournament);

        return updatedTournament;
    }

    async start(id: string, actor: TournamentActor): Promise<TournamentRecord> {
        const tournament = await this.findById(id);

        this.ensureCanManageTournament(tournament, actor);

        if (tournament.status !== TournamentStatus.SIGNUPS_LOCKED) {
            throw new BadRequestException('Only tournaments with locked signups can start');
        }

        const matchCount = await this.prisma.match.count({
            where: { tournamentId: id },
        });

        if (matchCount === 0) {
            throw new BadRequestException('Tournament bracket must be generated before starting');
        }

        const result = await this.prisma.$transaction(async (tx) => {
            const updatedTournament = await tx.tournament.update({
                where: { id },
                data: { status: TournamentStatus.IN_PROGRESS },
            });

            const members = await tx.teamMember.findMany({
                where: {
                    team: {
                        tournamentId: id,
                    },
                },
                select: {
                    userId: true,
                },
            });

            const recipientIds = [...new Set(members.map((member) => member.userId))];
            const notifications: NotificationRecord[] = [];

            for (const recipientId of recipientIds) {
                notifications.push(await this.notificationsService.create(
                    {
                        recipientId,
                        type: NotificationType.TOURNAMENT_STARTED,
                        title: 'Tournament started',
                        body: `${updatedTournament.name} has started.`,
                        tournamentId: updatedTournament.id,
                    },
                    tx,
                    false,
                ));
            }

            return { updatedTournament, notifications };
        });

        result.notifications.forEach((notification) => {
            this.notificationsService.publishCreated(notification);
        });

        this.publishStatusChanged(result.updatedTournament);

        return result.updatedTournament;
    }

    private publishStatusChanged(tournament: TournamentRecord): void {
        this.tournamentLiveService.publish(tournament.id, TournamentLiveEvent.STATUS_CHANGED, {
            tournament,
        });
    }

    private readonly organizerSelect = {
        id: true,
        username: true,
        firstName: true,
        lastName: true,
    };

    private ensureCanManageTournament(tournament: TournamentRecord, actor: TournamentActor): void {
        if (actor.role === UserRole.ADMIN) {
            return;
        }

        if (tournament.organizerId !== actor.id) {
            throw new ForbiddenException('You can only manage tournaments you own');
        }
    }

    private ensureTournamentCanBeEdited(tournament: TournamentRecord): void {
        const editableStatuses: TournamentStatus[] = [TournamentStatus.DRAFT, TournamentStatus.SIGNUPS_OPEN];

        if (!editableStatuses.includes(tournament.status)) {
            throw new BadRequestException('Tournament cannot be edited after signups are locked');
        }
    }
}
