import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserRole } from '../common/user-role.enum';
import { CreateTournamentDto } from './dto/create-tournament.dto';
import { UpdateTournamentDto } from './dto/update-tournament.dto';
import { Tournament } from './tournament.entity';
import { TournamentStatus } from './tournament-status.enum';

export type TournamentActor = {
    id: string;
    role: UserRole;
};

@Injectable()
export class TournamentsService {
    constructor(
        @InjectRepository(Tournament)
        private readonly tournamentRepository: Repository<Tournament>,
    ) { }

    async create(createTournamentDto: CreateTournamentDto, organizerId: string): Promise<Tournament> {
        const tournament = this.tournamentRepository.create({
            ...createTournamentDto,
            description: createTournamentDto.description ?? null,
            startsAt: new Date(createTournamentDto.startsAt),
            organizerId,
        });

        return this.tournamentRepository.save(tournament);
    }

    async findAll(): Promise<Tournament[]> {
        return this.tournamentRepository.find({
            order: {
                startsAt: 'ASC',
                createdAt: 'DESC',
            },
        });
    }

    async findById(id: string): Promise<Tournament> {
        const tournament = await this.tournamentRepository.findOne({ where: { id } });

        if (!tournament) {
            throw new NotFoundException('Tournament not found');
        }

        return tournament;
    }

    async update(id: string, updateTournamentDto: UpdateTournamentDto, actor: TournamentActor): Promise<Tournament> {
        const tournament = await this.findById(id);

        this.ensureCanManageTournament(tournament, actor);
        this.ensureTournamentCanBeEdited(tournament);

        if (updateTournamentDto.name !== undefined) {
            tournament.name = updateTournamentDto.name;
        }

        if (updateTournamentDto.description !== undefined) {
            tournament.description = updateTournamentDto.description;
        }

        if (updateTournamentDto.location !== undefined) {
            tournament.location = updateTournamentDto.location;
        }

        if (updateTournamentDto.startsAt !== undefined) {
            tournament.startsAt = new Date(updateTournamentDto.startsAt);
        }

        if (updateTournamentDto.maxTeams !== undefined) {
            tournament.maxTeams = updateTournamentDto.maxTeams;
        }

        return this.tournamentRepository.save(tournament);
    }

    private ensureCanManageTournament(tournament: Tournament, actor: TournamentActor): void {
        if (actor.role === UserRole.ADMIN) {
            return;
        }

        if (tournament.organizerId !== actor.id) {
            throw new ForbiddenException('You can only manage tournaments you own');
        }
    }

    private ensureTournamentCanBeEdited(tournament: Tournament): void {
        const editableStatuses = [TournamentStatus.DRAFT, TournamentStatus.SIGNUPS_OPEN];

        if (!editableStatuses.includes(tournament.status)) {
            throw new BadRequestException('Tournament cannot be edited after signups are locked');
        }
    }
}
