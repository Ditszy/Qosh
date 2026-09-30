import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { UserRole } from '../common/user-role.enum';
import { publicUserSelect } from '../users/users.service';
import { MatchStatus } from '../matches/enums/match-status.enum';
import { NotificationType } from '../notifications/enums/notification-type.enum';
import { NotificationsService } from '../notifications/notifications.service';
import { NotificationRecord } from '../notifications/types/notification.types';
import { PrismaService } from '../prisma/prisma.service';
import { TeamInviteStatus } from '../teams/team-invite-status.enum';
import { CreateTournamentDto } from './dto/create-tournament.dto';
import { FindManagedCommandCenterDto } from './dto/find-managed-command-center.dto';
import { FindManagedTournamentsDto, ManagedTournamentView } from './dto/find-managed-tournaments.dto';
import { FindTournamentsDto } from './dto/find-tournaments.dto';
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
    entryFee: number;
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

export type PaginatedTournaments = {
    items: TournamentRecord[];
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
};

export type ManagedTournamentSummary = TournamentRecord & {
    teamCount: number;
    matchCount: number;
    scheduledMatchCount: number;
    liveMatchCount: number;
    finalMatchCount: number;
    unscheduledActiveMatchCount: number;
    missingOfficialsActiveMatchCount: number;
};

export type ManagedTournamentPage = {
    items: ManagedTournamentSummary[];
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
};

type ManagedTournamentQueryRecord = TournamentRecord & {
    organizer: NonNullable<TournamentRecord['organizer']>;
};

type ManagedCommandMatchRecord = {
    tournament: TournamentRecord;
    [key: string]: unknown;
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

    async findAll(query: FindTournamentsDto = {}): Promise<PaginatedTournaments> {
        const page = query.page ?? 1;
        const pageSize = query.pageSize ?? 12;
        const sortBy = query.sortBy ?? 'startsAt';
        const sortDirection = query.sortDirection ?? 'asc';
        const where = query.status ? { status: query.status } : {};

        const [items, total] = await this.prisma.$transaction([
            this.prisma.tournament.findMany({
                where,
                include: { organizer: { select: this.organizerSelect } },
                orderBy: [
                    { [sortBy]: sortDirection },
                    { createdAt: 'desc' },
                ],
                skip: (page - 1) * pageSize,
                take: pageSize,
            }),
            this.prisma.tournament.count({ where }),
        ]);

        return {
            items,
            total,
            page,
            pageSize,
            totalPages: Math.max(1, Math.ceil(total / pageSize)),
        };
    }

    async findManaged(
        query: FindManagedTournamentsDto = {},
        actor: TournamentActor,
    ): Promise<ManagedTournamentPage> {
        const page = query.page ?? 1;
        const pageSize = query.pageSize ?? 12;
        const view = query.view ?? ManagedTournamentView.ACTIVE;
        const where = this.managedTournamentWhere(actor, view);

        const [items, total] = await this.prisma.$transaction([
            this.prisma.tournament.findMany({
                where,
                select: {
                    ...this.tournamentSelect,
                    organizer: { select: this.organizerSelect },
                    _count: { select: { teams: true } },
                },
                orderBy: [
                    { startsAt: 'asc' },
                    { createdAt: 'desc' },
                    { id: 'asc' },
                ],
                skip: (page - 1) * pageSize,
                take: pageSize,
            }),
            this.prisma.tournament.count({ where }),
        ]);

        const tournamentIds = items.map((item) => item.id);
        const matchRows = tournamentIds.length === 0
            ? []
            : await this.prisma.match.findMany({
                where: { tournamentId: { in: tournamentIds } },
                select: {
                    tournamentId: true,
                    status: true,
                    scheduledAt: true,
                    scorerId: true,
                    refereeId: true,
                },
            });

        const summaries = items.map(({ _count, ...tournament }) =>
            this.toManagedTournamentSummary(tournament as ManagedTournamentQueryRecord, _count.teams, matchRows.filter((match) => match.tournamentId === tournament.id)),
        );

        return {
            items: summaries,
            total,
            page,
            pageSize,
            totalPages: Math.max(1, Math.ceil(total / pageSize)),
        };
    }

    async findManagedCommandCenter(
        query: FindManagedCommandCenterDto = {},
        actor: TournamentActor,
    ) {
        const limit = query.limit ?? 4;
        const ownership = this.managedMatchOwnershipWhere(actor);
        const matchSelect = this.managedMatchSelect;

        const [liveMatches, nextMatches, unscheduledMatches, missingOfficialMatches, recentFinals, readyForBracket, readyToStart] =
            await Promise.all([
                this.prisma.match.findMany({
                    where: { ...ownership, status: MatchStatus.LIVE },
                    select: matchSelect,
                    orderBy: [{ updatedAt: 'desc' }, { id: 'asc' }],
                    take: limit,
                }),
                this.prisma.match.findMany({
                    where: {
                        ...ownership,
                        status: MatchStatus.SCHEDULED,
                        scheduledAt: { not: null },
                        teamAId: { not: null },
                        teamBId: { not: null },
                    },
                    select: matchSelect,
                    orderBy: [{ scheduledAt: 'asc' }, { round: 'asc' }, { bracketPosition: 'asc' }, { id: 'asc' }],
                    take: limit,
                }),
                this.prisma.match.findMany({
                    where: {
                        ...ownership,
                        status: MatchStatus.SCHEDULED,
                        scheduledAt: null,
                    },
                    select: matchSelect,
                    orderBy: [{ round: 'asc' }, { bracketPosition: 'asc' }, { id: 'asc' }],
                    take: limit,
                }),
                this.prisma.match.findMany({
                    where: {
                        ...ownership,
                        status: { not: MatchStatus.FINAL },
                        OR: [{ scorerId: null }, { refereeId: null }],
                    },
                    select: matchSelect,
                    orderBy: [{ scheduledAt: 'asc' }, { round: 'asc' }, { bracketPosition: 'asc' }, { id: 'asc' }],
                    take: limit,
                }),
                this.prisma.match.findMany({
                    where: { ...ownership, status: MatchStatus.FINAL },
                    select: matchSelect,
                    orderBy: [{ updatedAt: 'desc' }, { id: 'asc' }],
                    take: limit,
                }),
                this.findManagedReadyTournaments(actor, TournamentStatus.SIGNUPS_LOCKED, 'none', limit),
                this.findManagedReadyTournaments(actor, TournamentStatus.SIGNUPS_LOCKED, 'some', limit),
            ]);

        const commandMatches = [
            ...liveMatches,
            ...nextMatches,
            ...unscheduledMatches,
            ...missingOfficialMatches,
            ...recentFinals,
        ];
        const summaryByTournamentId = await this.findManagedSummaryMap(
            actor,
            [...new Set(commandMatches.map((match) => match.tournamentId))],
        );

        return {
            liveMatches: liveMatches.map((match) => this.toCommandMatch(match, summaryByTournamentId.get(match.tournamentId))),
            nextMatches: nextMatches.map((match) => this.toCommandMatch(match, summaryByTournamentId.get(match.tournamentId))),
            unscheduledMatches: unscheduledMatches.map((match) => this.toCommandMatch(match, summaryByTournamentId.get(match.tournamentId))),
            missingOfficialMatches: missingOfficialMatches.map((match) => this.toCommandMatch(match, summaryByTournamentId.get(match.tournamentId))),
            recentFinals: recentFinals.map((match) => this.toCommandMatch(match, summaryByTournamentId.get(match.tournamentId))),
            readyForBracket,
            readyToStart,
        };
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
            entryFee?: number;
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

        if (updateTournamentDto.entryFee !== undefined) {
            data.entryFee = updateTournamentDto.entryFee;
        }

        const updatedTournament = await this.prisma.tournament.update({
            where: { id },
            data,
        });

        this.publishStatusChanged(updatedTournament);

        return updatedTournament;
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
                        title: 'Turnir je počeo',
                        body: `Turnir ${updatedTournament.name} je počeo.`,
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

    async cancel(id: string, actor: TournamentActor): Promise<TournamentRecord> {
        const tournament = await this.findById(id);

        this.ensureCanManageTournament(tournament, actor);

        if (tournament.status === TournamentStatus.CANCELLED) {
            throw new BadRequestException('Tournament is already cancelled');
        }

        if (tournament.status === TournamentStatus.COMPLETED) {
            throw new BadRequestException('Completed tournaments cannot be cancelled');
        }

        if (tournament.status === TournamentStatus.IN_PROGRESS) {
            throw new BadRequestException('Tournament cannot be cancelled after it has started');
        }

        const result = await this.prisma.$transaction(async (tx) => {
            const [members, pendingInvites] = await Promise.all([
                tx.teamMember.findMany({
                    where: {
                        team: {
                            tournamentId: id,
                        },
                    },
                    select: {
                        userId: true,
                    },
                }),
                tx.teamInvite.findMany({
                    where: {
                        status: TeamInviteStatus.PENDING,
                        team: {
                            tournamentId: id,
                        },
                    },
                    select: {
                        invitedUserId: true,
                    },
                }),
            ]);

            await tx.teamInvite.updateMany({
                where: {
                    status: TeamInviteStatus.PENDING,
                    team: {
                        tournamentId: id,
                    },
                },
                data: {
                    status: TeamInviteStatus.CANCELLED,
                    respondedAt: new Date(),
                },
            });

            const updatedTournament = await tx.tournament.update({
                where: { id },
                data: { status: TournamentStatus.CANCELLED },
            });

            const recipientIds = [
                ...new Set([
                    ...members.map((member) => member.userId),
                    ...pendingInvites.map((invite) => invite.invitedUserId),
                ]),
            ];
            const notifications: NotificationRecord[] = [];

            for (const recipientId of recipientIds) {
                notifications.push(await this.notificationsService.create(
                    {
                        recipientId,
                        type: NotificationType.TOURNAMENT_CANCELLED,
                        title: 'Turnir je otkazan',
                        body: `Turnir ${updatedTournament.name} je otkazan.`,
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

    private readonly tournamentSelect = {
        id: true,
        name: true,
        description: true,
        location: true,
        startsAt: true,
        maxTeams: true,
        entryFee: true,
        status: true,
        organizerId: true,
        createdAt: true,
        updatedAt: true,
    } as const;

    private readonly teamSummarySelect = {
        id: true,
        name: true,
        tournamentId: true,
        createdAt: true,
        updatedAt: true,
    } as const;

    private readonly managedMatchSelect = {
        id: true,
        tournamentId: true,
        round: true,
        bracketPosition: true,
        teamAId: true,
        teamBId: true,
        winnerTeamId: true,
        scorerId: true,
        refereeId: true,
        scheduledAt: true,
        location: true,
        status: true,
        teamAScore: true,
        teamBScore: true,
        clockStatus: true,
        clockDurationSeconds: true,
        clockRemainingSeconds: true,
        clockLastStartedAt: true,
        nextRound: true,
        nextBracketPosition: true,
        nextMatchSlot: true,
        createdAt: true,
        updatedAt: true,
        tournament: { select: this.tournamentSelect },
        teamA: { select: this.teamSummarySelect },
        teamB: { select: this.teamSummarySelect },
        winnerTeam: { select: this.teamSummarySelect },
        scorer: { select: publicUserSelect },
        referee: { select: publicUserSelect },
    } as const;

    private managedTournamentWhere(
        actor: TournamentActor,
        view: ManagedTournamentView,
    ): Prisma.TournamentWhereInput {
        return {
            ...(actor.role === UserRole.ADMIN ? {} : { organizerId: actor.id }),
            status: view === ManagedTournamentView.ACTIVE
                ? { in: [
                    TournamentStatus.DRAFT,
                    TournamentStatus.SIGNUPS_OPEN,
                    TournamentStatus.SIGNUPS_LOCKED,
                    TournamentStatus.IN_PROGRESS,
                ] }
                : { in: [TournamentStatus.COMPLETED, TournamentStatus.CANCELLED] },
        };
    }

    private managedMatchOwnershipWhere(actor: TournamentActor): Prisma.MatchWhereInput {
        return actor.role === UserRole.ADMIN ? {} : { tournament: { organizerId: actor.id } };
    }

    private async findManagedReadyTournaments(
        actor: TournamentActor,
        status: TournamentStatus,
        matchRequirement: 'none' | 'some',
        limit: number,
    ): Promise<ManagedTournamentSummary[]> {
        const tournaments = await this.prisma.tournament.findMany({
            where: {
                ...(actor.role === UserRole.ADMIN ? {} : { organizerId: actor.id }),
                status,
                matches: matchRequirement === 'none' ? { none: {} } : { some: {} },
            },
            select: {
                ...this.tournamentSelect,
                organizer: { select: this.organizerSelect },
                _count: { select: { teams: true, matches: true } },
            },
            orderBy: [{ startsAt: 'asc' }, { createdAt: 'desc' }, { id: 'asc' }],
            take: limit,
        });

        return tournaments.map(({ _count, ...tournament }) =>
            this.toManagedTournamentSummary(tournament as ManagedTournamentQueryRecord, _count.teams, [], _count.matches));
    }

    private async findManagedSummaryMap(
        actor: TournamentActor,
        tournamentIds: string[],
    ): Promise<Map<string, ManagedTournamentSummary>> {
        if (tournamentIds.length === 0) {
            return new Map();
        }

        const [tournaments, matches] = await Promise.all([
            this.prisma.tournament.findMany({
                where: {
                    id: { in: tournamentIds },
                    ...(actor.role === UserRole.ADMIN ? {} : { organizerId: actor.id }),
                },
                select: {
                    ...this.tournamentSelect,
                    organizer: { select: this.organizerSelect },
                    _count: { select: { teams: true } },
                },
            }),
            this.prisma.match.findMany({
                where: { tournamentId: { in: tournamentIds } },
                select: {
                    tournamentId: true,
                    status: true,
                    scheduledAt: true,
                    scorerId: true,
                    refereeId: true,
                },
            }),
        ]);

        return new Map(tournaments.map(({ _count, ...tournament }) => [
            tournament.id,
            this.toManagedTournamentSummary(
                tournament as ManagedTournamentQueryRecord,
                _count.teams,
                matches.filter((match) => match.tournamentId === tournament.id),
            ),
        ]));
    }

    private toManagedTournamentSummary(
        tournament: ManagedTournamentQueryRecord,
        teamCount: number,
        matches: Array<{
            status: MatchStatus;
            scheduledAt: Date | null;
            scorerId: string | null;
            refereeId: string | null;
        }>,
        matchCountOverride?: number,
    ): ManagedTournamentSummary {
        const activeMatches = matches.filter((match) => match.status !== MatchStatus.FINAL);

        return {
            ...tournament,
            teamCount,
            matchCount: matchCountOverride ?? matches.length,
            scheduledMatchCount: matches.filter((match) => match.status === MatchStatus.SCHEDULED && !!match.scheduledAt).length,
            liveMatchCount: matches.filter((match) => match.status === MatchStatus.LIVE).length,
            finalMatchCount: matches.filter((match) => match.status === MatchStatus.FINAL).length,
            unscheduledActiveMatchCount: activeMatches.filter((match) => !match.scheduledAt).length,
            missingOfficialsActiveMatchCount: activeMatches.filter((match) => !match.scorerId || !match.refereeId).length,
        };
    }

    private toCommandMatch(match: ManagedCommandMatchRecord, tournament?: ManagedTournamentSummary) {
        return {
            tournament: tournament ?? match.tournament,
            match,
        };
    }

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
