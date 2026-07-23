import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TournamentStatus } from '../tournaments/tournament-status.enum';
import { Tournament } from '../tournaments/tournament.entity';
import { CreateTeamDto } from './dto/create-team.dto';
import { TeamMemberRole } from './team-member-role.enum';
import { TeamMember } from './team-member.entity';
import { Team } from './team.entity';

@Injectable()
export class TeamsService {
    constructor(
        @InjectRepository(Team)
        private readonly teamRepository: Repository<Team>,
        @InjectRepository(TeamMember)
        private readonly teamMemberRepository: Repository<TeamMember>,
        @InjectRepository(Tournament)
        private readonly tournamentRepository: Repository<Tournament>,
    ) { }

    async create(createTeamDto: CreateTeamDto, captainId: string): Promise<Team> {
        const tournament = await this.tournamentRepository.findOne({
            where: { id: createTeamDto.tournamentId },
        });

        if (!tournament) {
            throw new NotFoundException('Tournament not found');
        }

        if (tournament.status !== TournamentStatus.SIGNUPS_OPEN) {
            throw new BadRequestException('Team registration is only available while signups are open');
        }

        const existingTeam = await this.teamRepository.findOne({
            where: {
                tournamentId: createTeamDto.tournamentId,
                name: createTeamDto.name,
            },
        });

        if (existingTeam) {
            throw new ConflictException('Team name already exists in this tournament');
        }

        const registeredTeamCount = await this.teamRepository.count({
            where: { tournamentId: createTeamDto.tournamentId },
        });

        if (registeredTeamCount >= tournament.maxTeams) {
            throw new BadRequestException('Tournament has reached the maximum number of teams');
        }

        const existingMembership = await this.teamMemberRepository
            .createQueryBuilder('teamMember')
            .innerJoin('teamMember.team', 'team')
            .where('teamMember.userId = :captainId', { captainId })
            .andWhere('team.tournamentId = :tournamentId', { tournamentId: createTeamDto.tournamentId })
            .getOne();

        if (existingMembership) {
            throw new ConflictException('Player is already registered in this tournament');
        }

        return this.teamRepository.manager.transaction(async (entityManager) => {
            const team = entityManager.create(Team, {
                name: createTeamDto.name,
                tournamentId: createTeamDto.tournamentId,
            });
            const savedTeam = await entityManager.save(team);

            const captainMembership = entityManager.create(TeamMember, {
                teamId: savedTeam.id,
                userId: captainId,
                role: TeamMemberRole.CAPTAIN,
            });

            await entityManager.save(captainMembership);

            return savedTeam;
        });
    }
}
