import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { publicUserSelect } from '../users/users.service';
import { CreateMatchEventDto } from './dto/create-match-event.dto';
import { MatchAccessService } from './match-access.service';
import { MatchEventType } from './match-event-type.enum';
import { MatchLiveService } from './match-live.service';
import { MatchStatus } from './match-status.enum';
import { MatchActor } from './types/match.types';

@Injectable()
export class MatchEventsService {
    constructor(
        private readonly prisma: PrismaService,
        private readonly matchAccessService: MatchAccessService,
        private readonly matchLiveService: MatchLiveService,
    ) { }

    async create(matchId: string, createMatchEventDto: CreateMatchEventDto, actor: MatchActor) {
        const match = await this.prisma.match.findUnique({
            where: { id: matchId },
            select: {
                id: true,
                status: true,
                teamAId: true,
                teamBId: true,
                teamAScore: true,
                teamBScore: true,
                scorerId: true,
            },
        });

        if (!match) {
            throw new NotFoundException('Match not found');
        }

        this.matchAccessService.ensureCanRecordMatchEvent(match, actor);

        if (match.status !== MatchStatus.LIVE) {
            throw new BadRequestException('Match events can only be recorded for live matches');
        }

        if (![match.teamAId, match.teamBId].includes(createMatchEventDto.teamId)) {
            throw new BadRequestException('Event team must be one of the teams in the match');
        }

        if (createMatchEventDto.playerId !== undefined) {
            const rosterMember = await this.prisma.teamMember.findUnique({
                where: {
                    teamId_userId: {
                        teamId: createMatchEventDto.teamId,
                        userId: createMatchEventDto.playerId,
                    },
                },
                select: {
                    id: true,
                },
            });

            if (!rosterMember) {
                throw new BadRequestException('Event player must be on the selected team roster');
            }
        }

        const pointValue = this.getPointValue(createMatchEventDto.type);

        const { event, score } = await this.prisma.$transaction(async (tx) => {
            const event = await tx.matchEvent.create({
                data: {
                    matchId,
                    teamId: createMatchEventDto.teamId,
                    playerId: createMatchEventDto.playerId,
                    scorerId: actor.id,
                    type: createMatchEventDto.type,
                    occurredAt: createMatchEventDto.occurredAt
                        ? new Date(createMatchEventDto.occurredAt)
                        : new Date(),
                },
                include: this.matchEventInclude(),
            });

            let score: { id: string; teamAScore: number; teamBScore: number; updatedAt: Date } | null = null;

            if (pointValue > 0) {
                score = await tx.match.update({
                    where: { id: matchId },
                    data: this.getScoreIncrementData(match, createMatchEventDto.teamId, pointValue),
                    select: {
                        id: true,
                        teamAScore: true,
                        teamBScore: true,
                        updatedAt: true,
                    },
                });
            }

            return { event, score };
        });
        this.matchLiveService.publishEventCreated(matchId, event);

        if (score) {
            this.matchLiveService.publishScoreChange(score);
        }

        return event;
    }

    async findByMatchId(matchId: string) {
        const match = await this.prisma.match.findUnique({
            where: { id: matchId },
            select: {
                id: true,
            },
        });

        if (!match) {
            throw new NotFoundException('Match not found');
        }

        return this.prisma.matchEvent.findMany({
            where: { matchId },
            include: this.matchEventInclude(),
            orderBy: [
                { occurredAt: 'asc' },
                { createdAt: 'asc' },
            ],
        });
    }

    private matchEventInclude() {
        return {
            team: true,
            player: {
                select: publicUserSelect,
            },
            scorer: {
                select: publicUserSelect,
            },
        };
    }

    private getPointValue(type: MatchEventType): number {
        if (type === MatchEventType.ONE_POINT_MADE || type === MatchEventType.FREE_THROW_MADE) {
            return 1;
        }

        if (type === MatchEventType.TWO_POINT_MADE) {
            return 2;
        }

        return 0;
    }

    private getScoreIncrementData(
        match: { teamAId: string | null; teamBId: string | null },
        teamId: string,
        pointValue: number) {
        if (teamId === match.teamAId) {
            return {
                teamAScore: {
                    increment: pointValue,
                },
            };
        }

        if (teamId === match.teamBId) {
            return {
                teamBScore: {
                    increment: pointValue,
                },
            };
        }

        throw new BadRequestException('Event team must be one of the teams in the match');
    }
}
