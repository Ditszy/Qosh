import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { TournamentStatus } from '../tournaments/tournament-status.enum';
import { PrismaService } from '../prisma/prisma.service';
import { PublicUser, publicUserSelect } from '../users/users.service';
import { CreateTeamDto } from './dto/create-team.dto';
import { TeamMemberRole } from './team-member-role.enum';

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

@Injectable()
export class TeamsService {
    constructor(private readonly prisma: PrismaService) { }

    async create(createTeamDto: CreateTeamDto, captainId: string): Promise<TeamRecord> {
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

        return this.prisma.$transaction(async (tx) => {
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
}
