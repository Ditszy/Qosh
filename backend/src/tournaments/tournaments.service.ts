import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { UserRole } from '../common/user-role.enum';
import { PrismaService } from '../prisma/prisma.service';
import { CreateTournamentDto } from './dto/create-tournament.dto';
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
};

@Injectable()
export class TournamentsService {
    constructor(private readonly prisma: PrismaService) { }

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
            orderBy: [
                { startsAt: 'asc' },
                { createdAt: 'desc' },
            ],
        });
    }

    async findById(id: string): Promise<TournamentRecord> {
        const tournament = await this.prisma.tournament.findUnique({ where: { id } });

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

        return this.prisma.tournament.update({
            where: { id },
            data: { status: TournamentStatus.SIGNUPS_OPEN },
        });
    }

    async lockSignups(id: string, actor: TournamentActor): Promise<TournamentRecord> {
        const tournament = await this.findById(id);

        this.ensureCanManageTournament(tournament, actor);

        if (tournament.status !== TournamentStatus.SIGNUPS_OPEN) {
            throw new BadRequestException('Only tournaments with open signups can lock signups');
        }

        return this.prisma.tournament.update({
            where: { id },
            data: { status: TournamentStatus.SIGNUPS_LOCKED },
        });
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
