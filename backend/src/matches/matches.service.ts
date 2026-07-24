import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { PublicUser, publicUserSelect } from '../users/users.service';
import { MatchClockStatus } from './match-clock-status.enum';
import { MatchStatus } from './match-status.enum';

type TournamentSummary = {
    id: string;
    name: string;
    description: string | null;
    location: string;
    startsAt: Date;
    maxTeams: number;
    status: string;
    organizerId: string;
    createdAt: Date;
    updatedAt: Date;
};

type TeamSummary = {
    id: string;
    name: string;
    tournamentId: string;
    createdAt: Date;
    updatedAt: Date;
};

type MatchRecord = {
    id: string;
    tournamentId: string;
    round: number;
    bracketPosition: number;
    teamAId: string | null;
    teamBId: string | null;
    winnerTeamId: string | null;
    scorerId: string | null;
    refereeId: string | null;
    scheduledAt: Date | null;
    location: string | null;
    status: MatchStatus;
    teamAScore: number;
    teamBScore: number;
    clockStatus: MatchClockStatus;
    clockDurationSeconds: number;
    clockRemainingSeconds: number;
    clockLastStartedAt: Date | null;
    createdAt: Date;
    updatedAt: Date;
};

type MatchWithRelations = MatchRecord & {
    tournament: TournamentSummary;
    teamA: TeamSummary | null;
    teamB: TeamSummary | null;
    winnerTeam: TeamSummary | null;
    scorer: PublicUser | null;
    referee: PublicUser | null;
};

@Injectable()
export class MatchesService {
    constructor(private readonly prisma: PrismaService) { }

    async findByTournamentId(tournamentId: string): Promise<MatchWithRelations[]> {
        const tournament = await this.prisma.tournament.findUnique({
            where: { id: tournamentId },
        });

        if (!tournament) {
            throw new NotFoundException('Tournament not found');
        }
        return this.prisma.match.findMany({
            where: { tournamentId },
            include: this.matchInclude(),
            orderBy: [
                { round: 'asc' },
                { bracketPosition: 'asc' },
            ],
        });
    }

    async findById(id: string): Promise<MatchWithRelations> {
        const match = await this.prisma.match.findUnique({
            where: { id },
            include: this.matchInclude(),
        });

        if (!match) {
            throw new NotFoundException('Match not found');
        }

        return match;
    }

    private matchInclude() {
        return {
            tournament: true,
            teamA: true,
            teamB: true,
            winnerTeam: true,
            scorer: {
                select: publicUserSelect,
            },
            referee: {
                select: publicUserSelect,
            },
        };
    }
}
