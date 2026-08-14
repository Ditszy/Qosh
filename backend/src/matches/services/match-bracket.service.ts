import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { TournamentLiveEvent } from '../../tournaments/types/tournament-live.types';
import { TournamentLiveService } from '../../tournaments/tournament-live.service';
import { TournamentStatus } from '../../tournaments/tournament-status.enum';
import { MatchAccessService } from './match-access.service';
import { MatchSlot } from '../enums/match-slot.enum';
import { MatchesReadService } from './matches-read.service';
import { MatchActor, MatchWithRelations } from '../types/match.types';

type MatchCreateInput = {
    tournamentId: string;
    round: number;
    bracketPosition: number;
    teamAId?: string;
    teamBId?: string;
    scheduledAt?: Date;
    nextRound?: number;
    nextBracketPosition?: number;
    nextMatchSlot?: MatchSlot;
};

const MATCH_SCHEDULE_INTERVAL_MINUTES = 15;

type SecondRoundSlot = {
    teamId?: string;
    sourceMatchPosition?: number;
};

@Injectable()
export class MatchBracketService {
    constructor(
        private readonly prisma: PrismaService,
        private readonly matchAccessService: MatchAccessService,
        private readonly matchesReadService: MatchesReadService,
        private readonly tournamentLiveService: TournamentLiveService,
    ) { }

    async generateBracket(tournamentId: string, actor: MatchActor): Promise<MatchWithRelations[]> {
        const tournament = await this.prisma.tournament.findUnique({
            where: { id: tournamentId },
            include: {
                teams: {
                    orderBy: {
                        createdAt: 'asc',
                    },
                },
            },
        });

        if (!tournament) {
            throw new NotFoundException('Tournament not found');
        }

        this.matchAccessService.ensureCanManageTournament(tournament, actor);

        if (tournament.status !== TournamentStatus.SIGNUPS_LOCKED) {
            throw new BadRequestException('Bracket can only be generated after signups are locked');
        }

        const existingMatchCount = await this.prisma.match.count({
            where: { tournamentId },
        });

        if (existingMatchCount > 0) {
            throw new BadRequestException('Bracket has already been generated for this tournament');
        }

        if (tournament.teams.length < 2) {
            throw new BadRequestException('At least two teams are required to generate a bracket');
        }

        const matchesToCreate: MatchCreateInput[] = [];
        const shuffledTeams = this.shuffle(tournament.teams);
        const bracketSize = this.nextPowerOfTwo(tournament.teams.length);
        const byeCount = bracketSize - tournament.teams.length;
        const firstRoundTeamCount = tournament.teams.length - byeCount;
        const firstRoundMatchCount = firstRoundTeamCount / 2;
        const totalRounds = Math.log2(bracketSize);

        for (let position = 1; position <= firstRoundMatchCount; position += 1) {
            const firstTeamIndex = (position - 1) * 2;

            const match: MatchCreateInput = {
                tournamentId,
                round: 1,
                bracketPosition: position,
                teamAId: shuffledTeams[firstTeamIndex].id,
                teamBId: shuffledTeams[firstTeamIndex + 1].id,
            };

            matchesToCreate.push(match);
        }

        if (totalRounds > 1) {
            const firstRoundMatches = new Map(
                matchesToCreate
                    .filter((match) => match.round === 1)
                    .map((match) => [match.bracketPosition, match]),
            );
            const secondRoundSlots: SecondRoundSlot[] = [
                ...Array.from(
                    { length: firstRoundMatchCount },
                    (_, index) => ({ sourceMatchPosition: index + 1 }),
                ),
                ...shuffledTeams.slice(firstRoundTeamCount).map((team) => ({ teamId: team.id })),
            ];
            const shuffledSecondRoundSlots = this.shuffle(secondRoundSlots);

            for (let position = 1; position <= shuffledSecondRoundSlots.length / 2; position += 1) {
                const firstSlot = shuffledSecondRoundSlots[(position - 1) * 2];
                const secondSlot = shuffledSecondRoundSlots[(position - 1) * 2 + 1];
                const match: MatchCreateInput = {
                    tournamentId,
                    round: 2,
                    bracketPosition: position,
                };

                if (totalRounds > 2) {
                    Object.assign(match, this.getNextMatchData(2, position));
                }

                if (firstSlot.teamId) {
                    match.teamAId = firstSlot.teamId;
                }

                if (firstSlot.sourceMatchPosition) {
                    const sourceMatch = firstRoundMatches.get(firstSlot.sourceMatchPosition);

                    if (sourceMatch) {
                        sourceMatch.nextRound = 2;
                        sourceMatch.nextBracketPosition = position;
                        sourceMatch.nextMatchSlot = MatchSlot.TEAM_A;
                    }
                }

                if (secondSlot.teamId) {
                    match.teamBId = secondSlot.teamId;
                }

                if (secondSlot.sourceMatchPosition) {
                    const sourceMatch = firstRoundMatches.get(secondSlot.sourceMatchPosition);

                    if (sourceMatch) {
                        sourceMatch.nextRound = 2;
                        sourceMatch.nextBracketPosition = position;
                        sourceMatch.nextMatchSlot = MatchSlot.TEAM_B;
                    }
                }

                matchesToCreate.push(match);
            }

            for (let round = 3; round <= totalRounds; round += 1) {
                const matchesInRound = bracketSize / 2 ** round;

                for (let position = 1; position <= matchesInRound; position += 1) {
                    const match: MatchCreateInput = {
                        tournamentId,
                        round,
                        bracketPosition: position,
                    };

                    if (round < totalRounds) {
                        Object.assign(match, this.getNextMatchData(round, position));
                    }

                    matchesToCreate.push(match);
                }
            }
        }

        this.assignGeneratedSchedule(matchesToCreate, tournament.startsAt);

        const matches = await this.prisma.$transaction(async (tx) => {
            await tx.match.createMany({
                data: matchesToCreate,
            });

            return tx.match.findMany({
                where: { tournamentId },
                include: this.matchesReadService.matchInclude(),
                orderBy: [
                    { round: 'asc' },
                    { bracketPosition: 'asc' },
                ],
            });
        });

        this.tournamentLiveService.publish(tournamentId, TournamentLiveEvent.BRACKET_GENERATED, {
            matches,
        });

        return matches;
    }

    private nextPowerOfTwo(value: number): number {
        return 2 ** Math.ceil(Math.log2(value));
    }

    private getNextMatchData(round: number, bracketPosition: number) {
        return {
            nextRound: round + 1,
            nextBracketPosition: Math.ceil(bracketPosition / 2),
            nextMatchSlot: bracketPosition % 2 === 1 ? MatchSlot.TEAM_A : MatchSlot.TEAM_B,
        };
    }

    private assignGeneratedSchedule(matches: MatchCreateInput[], startsAt: Date): void {
        matches.forEach((match, index) => {
            match.scheduledAt = new Date(
                startsAt.getTime() + index * MATCH_SCHEDULE_INTERVAL_MINUTES * 60 * 1000,
            );
        });
    }

    private shuffle<T>(items: T[]): T[] {
        const shuffled = [...items];

        for (let index = shuffled.length - 1; index > 0; index -= 1) {
            const swapIndex = Math.floor(Math.random() * (index + 1));
            [shuffled[index], shuffled[swapIndex]] = [shuffled[swapIndex], shuffled[index]];
        }

        return shuffled;
    }
}
