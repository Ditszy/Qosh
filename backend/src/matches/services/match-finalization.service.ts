import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { MatchAccessService } from './match-access.service';
import { MatchClockStatus } from '../enums/match-clock-status.enum';
import { MatchLiveService } from './match-live.service';
import { MatchSlot } from '../enums/match-slot.enum';
import { MatchStatus } from '../enums/match-status.enum';
import { MatchesReadService } from './matches-read.service';
import { MatchActor, MatchWithRelations } from '../types/match.types';
import { TournamentStatus } from '../../tournaments/tournament-status.enum';
import { TournamentLiveService } from '../../tournaments/tournament-live.service';
import { TournamentLiveEvent } from '../../tournaments/types/tournament-live.types';

@Injectable()
export class MatchFinalizationService {
    constructor(
        private readonly prisma: PrismaService,
        private readonly matchAccessService: MatchAccessService,
        private readonly matchLiveService: MatchLiveService,
        private readonly matchesReadService: MatchesReadService,
        private readonly tournamentLiveService: TournamentLiveService,
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

            const nextRound = match.nextRound;
            const nextBracketPosition = match.nextBracketPosition;
            const nextMatchSlot = match.nextMatchSlot;
            const hasNextBracketMatch = nextRound !== null
                && nextBracketPosition !== null
                && nextMatchSlot !== null;

            if (hasNextBracketMatch) {
                const nextMatch = await tx.match.findUnique({
                    where: {
                        tournamentId_round_bracketPosition: {
                            tournamentId: match.tournamentId,
                            round: nextRound,
                            bracketPosition: nextBracketPosition,
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

                const nextSlotField = nextMatchSlot === MatchSlot.TEAM_A ? 'teamAId' : 'teamBId';
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

            if (!hasNextBracketMatch) {
                const completedTournament = await tx.tournament.update({
                    where: { id: match.tournamentId },
                    data: { status: TournamentStatus.COMPLETED },
                });

                return {
                    ...updatedMatch,
                    tournament: completedTournament,
                };
            }

            return updatedMatch;
        });

        this.matchLiveService.publishFinalized(finalizedMatch);

        if (finalizedMatch.tournament.status === TournamentStatus.COMPLETED) {
            this.tournamentLiveService.publish(finalizedMatch.tournamentId, TournamentLiveEvent.STATUS_CHANGED, {
                tournament: finalizedMatch.tournament,
            });
        }

        return this.matchesReadService.withCurrentClock(finalizedMatch);
    }
}
