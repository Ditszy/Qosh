import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { MatchAccessService } from './match-access.service';
import { MatchClockStatus } from './match-clock-status.enum';
import { MatchSlot } from './match-slot.enum';
import { MatchStatus } from './match-status.enum';
import { MatchesReadService } from './matches-read.service';
import { MatchActor, MatchWithRelations } from './types/match.types';

@Injectable()
export class MatchFinalizationService {
    constructor(
        private readonly prisma: PrismaService,
        private readonly matchAccessService: MatchAccessService,
        private readonly matchesReadService: MatchesReadService,
    ) { }

    async finalize(id: string, actor: MatchActor): Promise<MatchWithRelations> {
        const match = await this.prisma.match.findUnique({
            where: { id },
        });

        if (!match) {
            throw new NotFoundException('Match not found');
        }

        this.matchAccessService.ensureCanFinalizeMatch(match, actor);

        if (match.status === MatchStatus.FINAL) {
            throw new BadRequestException('Match is already final');
        }

        if (match.status !== MatchStatus.LIVE) {
            throw new BadRequestException('Only live matches can be finalized');
        }

        if (!match.teamAId || !match.teamBId) {
            throw new BadRequestException('Both team slots must be filled before finalizing a match');
        }

        if (match.teamAScore === match.teamBScore) {
            throw new BadRequestException('Tied matches cannot be finalized');
        }

        const winnerTeamId = match.teamAScore > match.teamBScore ? match.teamAId : match.teamBId;

        const finalizedMatch = await this.prisma.$transaction(async (tx) => {
            const updatedMatch = await tx.match.update({
                where: { id },
                data: {
                    status: MatchStatus.FINAL,
                    winnerTeamId,
                    clockStatus: MatchClockStatus.ENDED,
                    clockRemainingSeconds: 0,
                    clockLastStartedAt: null,
                },
                include: this.matchesReadService.matchInclude(),
            });

            if (match.nextRound && match.nextBracketPosition && match.nextMatchSlot) {
                const nextMatch = await tx.match.findUnique({
                    where: {
                        tournamentId_round_bracketPosition: {
                            tournamentId: match.tournamentId,
                            round: match.nextRound,
                            bracketPosition: match.nextBracketPosition,
                        },
                    },
                    select: {
                        id: true,
                        teamAId: true,
                        teamBId: true,
                    },
                });

                if (!nextMatch) {
                    throw new BadRequestException('Next bracket match not found');
                }

                const nextSlotField = match.nextMatchSlot === MatchSlot.TEAM_A ? 'teamAId' : 'teamBId';
                const existingTeamId = nextSlotField === 'teamAId' ? nextMatch.teamAId : nextMatch.teamBId;

                if (existingTeamId && existingTeamId !== winnerTeamId) {
                    throw new BadRequestException('Next bracket slot is already occupied');
                }

                await tx.match.update({
                    where: { id: nextMatch.id },
                    data: {
                        [nextSlotField]: winnerTeamId,
                    },
                });
            }

            return updatedMatch;
        });

        return this.matchesReadService.withCurrentClock(finalizedMatch);
    }
}
