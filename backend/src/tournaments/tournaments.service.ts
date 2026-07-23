import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateTournamentDto } from './dto/create-tournament.dto';
import { Tournament } from './tournament.entity';

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
}
