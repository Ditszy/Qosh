import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { publicUserSelect } from '../../users/users.service';
import { CreateMatchEventDto } from '../dto/create-match-event.dto';
import { MatchAccessService } from './match-access.service';
import { MatchLiveService } from './match-live.service';
import { MatchClockStatus } from '../enums/match-clock-status.enum';
import { MatchEventType } from '../enums/match-event-type.enum';
import { MatchStatus } from '../enums/match-status.enum';
import { MatchActor } from '../types/match.types';
import {
    getMatchEventPointValue,
    getMatchPlayerStatCounterValuesForEvent,
    getMatchPlayerStatCreateData,
    getMatchPlayerStatRevertData,
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

    async delete(matchId: string, eventId: string, actor: MatchActor) {
        const event = await this.prisma.matchEvent.findUnique({
            where: { id: eventId },
            include: {
                match: {
                    select: {
                        id: true,
                        status: true,
                        teamAId: true,
                        teamBId: true,
                        teamAScore: true,
                        teamBScore: true,
                        scorerId: true,
                    },
                },
                ...this.matchEventInclude(),
            },
        });

        if (!event || event.matchId !== matchId) {
            throw new NotFoundException('Match event not found');
        }

        this.matchAccessService.ensureCanRecordMatchEvent(event.match, actor);

        if (event.match.status !== MatchStatus.LIVE) {
            throw new BadRequestException('Match events can only be undone for live matches');
        }

        const pointValue = getMatchEventPointValue(event.type);
        const { deletedEvent, score } = await this.prisma.$transaction(async (tx) => {
            if (event.playerId) {
                const playerStat = await tx.matchPlayerStat.findUnique({
                    where: {
                        matchId_playerId: {
                            matchId,
                            playerId: event.playerId,
                        },
                    },
                    select: this.matchPlayerStatCounterSelect(),
                });

                if (!playerStat || !this.canRevertPlayerStat(playerStat, event.type)) {
                    throw new BadRequestException('Match player statistics cannot be reversed for this event');
                }

                const remainingCounters = this.getRemainingPlayerStatCounters(playerStat, event.type);

                if (this.hasAnyPlayerStatCounter(remainingCounters)) {
                    await tx.matchPlayerStat.update({
                        where: {
                            matchId_playerId: {
                                matchId,
                                playerId: event.playerId,
                            },
                        },
                        data: getMatchPlayerStatRevertData(event.type),
                    });
                } else {
                    await tx.matchPlayerStat.delete({
                        where: {
                            matchId_playerId: {
                                matchId,
                                playerId: event.playerId,
                            },
                        },
                    });
                }
            }

            if (pointValue > 0 && !this.canRevertScore(event.match, event.teamId, pointValue)) {
                throw new BadRequestException('Match score cannot be reversed for this event');
            }

            const deletedEvent = await tx.matchEvent.delete({
                where: { id: eventId },
                include: this.matchEventInclude(),
            });

            const score = pointValue > 0
                ? await tx.match.update({
                    where: { id: matchId },
                    data: this.getScoreDecrementData(event.match, event.teamId, pointValue),
                    select: {
                        id: true,
                        teamAScore: true,
                        teamBScore: true,
                        updatedAt: true,
                    },
                })
                : await tx.match.findUniqueOrThrow({
                    where: { id: matchId },
                    select: {
                        id: true,
                        teamAScore: true,
                        teamBScore: true,
                        updatedAt: true,
                    },
                });

            return { deletedEvent, score };
        });

        this.matchLiveService.publishEventDeleted(matchId, deletedEvent);

        if (pointValue > 0) {
            this.matchLiveService.publishScoreChange(score);
        }

        return { event: deletedEvent, score };
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

    private getScoreDecrementData(
        match: { teamAId: string | null; teamBId: string | null },
        teamId: string,
        pointValue: number) {
        if (teamId === match.teamAId) {
            return {
                teamAScore: {
                    decrement: pointValue,
                },
            };
        }

        if (teamId === match.teamBId) {
            return {
                teamBScore: {
                    decrement: pointValue,
                },
            };
        }

        throw new BadRequestException('Event team must be one of the teams in the match');
    }

    private canRevertScore(
        match: { teamAId: string | null; teamBId: string | null; teamAScore: number; teamBScore: number },
        teamId: string,
        pointValue: number,
    ): boolean {
        if (teamId === match.teamAId) {
            return match.teamAScore >= pointValue;
        }

        if (teamId === match.teamBId) {
            return match.teamBScore >= pointValue;
        }

        return false;
    }

    private canRevertPlayerStat(stat: MatchPlayerStatCounters, type: MatchEventType): boolean {
        const counters = getMatchPlayerStatCounterValuesForEvent(type);

        return Object.entries(counters).every(([field, value]) => stat[field as keyof MatchPlayerStatCounters] >= value);
    }

    private getRemainingPlayerStatCounters(stat: MatchPlayerStatCounters, type: MatchEventType): MatchPlayerStatCounters {
        const counters = getMatchPlayerStatCounterValuesForEvent(type);

        return Object.fromEntries(
            Object.entries(stat).map(([field, value]) => [
                field,
                value - counters[field as keyof MatchPlayerStatCounters],
            ]),
        ) as MatchPlayerStatCounters;
    }

    private hasAnyPlayerStatCounter(stat: MatchPlayerStatCounters): boolean {
        return Object.values(stat).some((value) => value > 0);
    }

    private matchPlayerStatCounterSelect() {
        return {
            points: true,
            onePointMade: true,
            onePointAttempted: true,
            twoPointMade: true,
            twoPointAttempted: true,
            freeThrowMade: true,
            freeThrowAttempted: true,
            rebounds: true,
            assists: true,
            steals: true,
            blocks: true,
            turnovers: true,
            fouls: true,
        };
    }
}

type MatchPlayerStatCounters = {
    points: number;
    onePointMade: number;
    onePointAttempted: number;
    twoPointMade: number;
    twoPointAttempted: number;
    freeThrowMade: number;
    freeThrowAttempted: number;
    rebounds: number;
    assists: number;
    steals: number;
    blocks: number;
    turnovers: number;
    fouls: number;
};
