import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { publicUserSelect } from '../../users/users.service';
import { CreateMatchEventDto } from '../dto/create-match-event.dto';
import { MatchAccessService } from './match-access.service';
import { MatchLiveService } from './match-live.service';
import { MatchClockStatus } from '../enums/match-clock-status.enum';
import { MatchStatus } from '../enums/match-status.enum';
import { MatchActor } from '../types/match.types';
import {
    getMatchEventPointValue,
    getMatchPlayerStatCreateData,
    getMatchPlayerStatUpdateData,
} from '../helpers/match-event-stat.helpers';

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
                clockStatus: true,
                clockRemainingSeconds: true,
                clockLastStartedAt: true,
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

        const pointValue = getMatchEventPointValue(createMatchEventDto.type);
        const occurredAt = createMatchEventDto.occurredAt
            ? new Date(createMatchEventDto.occurredAt)
            : new Date();
        const clockRemainingSeconds = this.getEventClockRemainingSeconds(match, occurredAt);

        const { event, score } = await this.prisma.$transaction(async (tx) => {
            const event = await tx.matchEvent.create({
                data: {
                    matchId,
                    teamId: createMatchEventDto.teamId,
                    playerId: createMatchEventDto.playerId,
                    scorerId: actor.id,
                    type: createMatchEventDto.type,
                    clockRemainingSeconds,
                    occurredAt,
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

            if (createMatchEventDto.playerId) {
                await tx.matchPlayerStat.upsert({
                    where: {
                        matchId_playerId: {
                            matchId,
                            playerId: createMatchEventDto.playerId,
                        },
                    },
                    create: getMatchPlayerStatCreateData(
                        matchId,
                        createMatchEventDto.teamId,
                        createMatchEventDto.playerId,
                        createMatchEventDto.type,
                    ),
                    update: getMatchPlayerStatUpdateData(createMatchEventDto.type),
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

    private getEventClockRemainingSeconds(
        match: {
            clockStatus: string;
            clockRemainingSeconds: number;
            clockLastStartedAt: Date | null;
        },
        occurredAt: Date,
    ): number {
        if (match.clockStatus !== MatchClockStatus.RUNNING || !match.clockLastStartedAt) {
            return Math.max(0, match.clockRemainingSeconds);
        }

        const elapsedSeconds = Math.floor((occurredAt.getTime() - match.clockLastStartedAt.getTime()) / 1000);

        return Math.max(0, match.clockRemainingSeconds - elapsedSeconds);
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
