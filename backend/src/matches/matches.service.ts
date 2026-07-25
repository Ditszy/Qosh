import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { UserRole } from '../common/user-role.enum';
import { PrismaService } from '../prisma/prisma.service';
import { TournamentStatus } from '../tournaments/tournament-status.enum';
import { PublicUser, publicUserSelect } from '../users/users.service';
import { AdjustMatchClockDto } from './dto/adjust-match-clock.dto';
import { ScheduleMatchDto } from './dto/schedule-match.dto';
import { MatchClockStatus } from './match-clock-status.enum';
import { MatchStatus } from './match-status.enum';

type MatchActor = {
    id: string;
    role: UserRole;
};

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

        this.ensureCanManageTournament(tournament, actor);

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

        const matchesToCreate: Array<{
            tournamentId: string;
            round: number;
            bracketPosition: number;
            teamAId?: string;
            teamBId?: string;
        }> = [];
        const shuffledTeams = this.shuffle(tournament.teams);
        const bracketSize = this.nextPowerOfTwo(tournament.teams.length);
        const byeCount = bracketSize - tournament.teams.length;
        const firstRoundTeamCount = tournament.teams.length - byeCount;
        const firstRoundMatchCount = firstRoundTeamCount / 2;
        const totalRounds = Math.log2(bracketSize);

        for (let position = 1; position <= firstRoundMatchCount; position += 1) {
            const firstTeamIndex = (position - 1) * 2;

            matchesToCreate.push({
                tournamentId,
                round: 1,
                bracketPosition: position,
                teamAId: shuffledTeams[firstTeamIndex].id,
                teamBId: shuffledTeams[firstTeamIndex + 1].id,
            });
        }

        if (totalRounds > 1) {
            const secondRoundSlots: Array<{ teamId: string } | null> = [
                ...Array.from({ length: firstRoundMatchCount }, () => null),
                ...shuffledTeams.slice(firstRoundTeamCount).map((team) => ({ teamId: team.id })),
            ];
            const shuffledSecondRoundSlots = this.shuffle(secondRoundSlots);

            for (let position = 1; position <= shuffledSecondRoundSlots.length / 2; position += 1) {
                const firstSlot = shuffledSecondRoundSlots[(position - 1) * 2];
                const secondSlot = shuffledSecondRoundSlots[(position - 1) * 2 + 1];
                const match = {
                    tournamentId,
                    round: 2,
                    bracketPosition: position,
                };

                if (firstSlot) {
                    Object.assign(match, { teamAId: firstSlot.teamId });
                }

                if (secondSlot) {
                    Object.assign(match, { teamBId: secondSlot.teamId });
                }

                matchesToCreate.push(match);
            }

            for (let round = 3; round <= totalRounds; round += 1) {
                const matchesInRound = bracketSize / 2 ** round;

                for (let position = 1; position <= matchesInRound; position += 1) {
                    matchesToCreate.push({
                        tournamentId,
                        round,
                        bracketPosition: position,
                    });
                }
            }
        }

        return this.prisma.$transaction(async (tx) => {
            await tx.match.createMany({
                data: matchesToCreate,
            });

            return tx.match.findMany({
                where: { tournamentId },
                include: this.matchInclude(),
                orderBy: [
                    { round: 'asc' },
                    { bracketPosition: 'asc' },
                ],
            });
        });
    }

    async findByTournamentId(tournamentId: string): Promise<MatchWithRelations[]> {
        const tournament = await this.prisma.tournament.findUnique({
            where: { id: tournamentId },
        });

        if (!tournament) {
            throw new NotFoundException('Tournament not found');
        }
        const matches = await this.prisma.match.findMany({
            where: { tournamentId },
            include: this.matchInclude(),
            orderBy: [
                { round: 'asc' },
                { bracketPosition: 'asc' },
            ],
        });

        return matches.map((match) => this.withCurrentClock(match));
    }

    async findById(id: string): Promise<MatchWithRelations> {
        const match = await this.prisma.match.findUnique({
            where: { id },
            include: this.matchInclude(),
        });

        if (!match) {
            throw new NotFoundException('Match not found');
        }

        return this.withCurrentClock(match);
    }

    async schedule(id: string, scheduleMatchDto: ScheduleMatchDto, actor: MatchActor): Promise<MatchWithRelations> {
        const match = await this.prisma.match.findUnique({
            where: { id },
            include: {
                tournament: true,
            },
        });

        if (!match) {
            throw new NotFoundException('Match not found');
        }

        this.ensureCanManageTournament(match.tournament, actor);

        if (match.status === MatchStatus.FINAL) {
            throw new BadRequestException('Final matches cannot be scheduled');
        }

        if (scheduleMatchDto.scorerId !== undefined) {
            await this.ensureUserHasRole(scheduleMatchDto.scorerId, UserRole.SCORER, 'Scorer not found');
        }

        if (scheduleMatchDto.refereeId !== undefined) {
            await this.ensureUserHasRole(scheduleMatchDto.refereeId, UserRole.REFEREE, 'Referee not found');
        }

        const data: {
            scheduledAt?: Date;
            location?: string;
            scorerId?: string;
            refereeId?: string;
        } = {};

        if (scheduleMatchDto.scheduledAt !== undefined) {
            data.scheduledAt = new Date(scheduleMatchDto.scheduledAt);
        }

        if (scheduleMatchDto.location !== undefined) {
            data.location = scheduleMatchDto.location;
        }

        if (scheduleMatchDto.scorerId !== undefined) {
            data.scorerId = scheduleMatchDto.scorerId;
        }

        if (scheduleMatchDto.refereeId !== undefined) {
            data.refereeId = scheduleMatchDto.refereeId;
        }

        const updatedMatch = await this.prisma.match.update({
            where: { id },
            data,
            include: this.matchInclude(),
        });

        return this.withCurrentClock(updatedMatch);
    }

    async startClock(id: string, actor: MatchActor): Promise<MatchWithRelations> {
        const match = await this.findClockActionMatch(id);
        this.ensureCanOperateMatchClock(match, actor);
        this.ensureMatchCanUseClock(match);

        if (match.clockStatus === MatchClockStatus.RUNNING) {
            throw new BadRequestException('Match clock is already running');
        }

        if (match.clockStatus === MatchClockStatus.PAUSED) {
            throw new BadRequestException('Use resume to continue a paused match clock');
        }

        if (match.clockStatus === MatchClockStatus.ENDED) {
            throw new BadRequestException('Ended match clocks cannot be started');
        }

        if (match.clockRemainingSeconds <= 0) {
            throw new BadRequestException('Match clock has no remaining time');
        }

        return this.updateMatchClock(id, {
            status: MatchStatus.LIVE,
            clockStatus: MatchClockStatus.RUNNING,
            clockLastStartedAt: new Date(),
        });
    }

    async pauseClock(id: string, actor: MatchActor): Promise<MatchWithRelations> {
        const match = await this.findClockActionMatch(id);
        this.ensureCanOperateMatchClock(match, actor);
        this.ensureMatchCanUseClock(match);

        if (match.clockStatus !== MatchClockStatus.RUNNING) {
            throw new BadRequestException('Only a running match clock can be paused');
        }

        const remainingSeconds = this.getCurrentRemainingSeconds(match);

        return this.updateMatchClock(id, {
            clockStatus: remainingSeconds === 0 ? MatchClockStatus.ENDED : MatchClockStatus.PAUSED,
            clockRemainingSeconds: remainingSeconds,
            clockLastStartedAt: null,
        });
    }

    async resumeClock(id: string, actor: MatchActor): Promise<MatchWithRelations> {
        const match = await this.findClockActionMatch(id);
        this.ensureCanOperateMatchClock(match, actor);
        this.ensureMatchCanUseClock(match);

        if (match.clockStatus !== MatchClockStatus.PAUSED) {
            throw new BadRequestException('Only a paused match clock can be resumed');
        }

        if (match.clockRemainingSeconds <= 0) {
            throw new BadRequestException('Match clock has no remaining time');
        }

        return this.updateMatchClock(id, {
            status: MatchStatus.LIVE,
            clockStatus: MatchClockStatus.RUNNING,
            clockLastStartedAt: new Date(),
        });
    }

    async adjustClock(
        id: string,
        adjustMatchClockDto: AdjustMatchClockDto,
        actor: MatchActor,
    ): Promise<MatchWithRelations> {
        const match = await this.findClockActionMatch(id);
        this.ensureCanOperateMatchClock(match, actor);
        this.ensureMatchCanUseClock(match);

        const remainingSeconds = Math.max(
            0,
            this.getCurrentRemainingSeconds(match) + adjustMatchClockDto.secondsDelta,
        );
        const data: {
            clockStatus: MatchClockStatus;
            clockRemainingSeconds: number;
            clockLastStartedAt: Date | null;
        } = {
            clockStatus: match.clockStatus,
            clockRemainingSeconds: remainingSeconds,
            clockLastStartedAt: match.clockLastStartedAt,
        };

        if (remainingSeconds === 0) {
            data.clockStatus = MatchClockStatus.ENDED;
            data.clockLastStartedAt = null;
        } else if (match.clockStatus === MatchClockStatus.RUNNING) {
            data.clockStatus = MatchClockStatus.RUNNING;
            data.clockLastStartedAt = new Date();
        } else if (match.clockStatus === MatchClockStatus.ENDED) {
            data.clockStatus = MatchClockStatus.PAUSED;
            data.clockLastStartedAt = null;
        }

        return this.updateMatchClock(id, data);
    }

    async endClock(id: string, actor: MatchActor): Promise<MatchWithRelations> {
        const match = await this.findClockActionMatch(id);
        this.ensureCanOperateMatchClock(match, actor);
        this.ensureMatchCanUseClock(match);

        if (match.clockStatus === MatchClockStatus.ENDED) {
            throw new BadRequestException('Match clock has already ended');
        }

        return this.updateMatchClock(id, {
            clockStatus: MatchClockStatus.ENDED,
            clockRemainingSeconds: 0,
            clockLastStartedAt: null,
        });
    }

    private ensureCanManageTournament(
        tournament: { organizerId: string },
        actor: MatchActor,
    ): void {
        if (actor.role === UserRole.ADMIN) {
            return;
        }

        if (tournament.organizerId !== actor.id) {
            throw new ForbiddenException('You can only manage tournaments you own');
        }
    }

    private async ensureUserHasRole(userId: string, role: UserRole, notFoundMessage: string): Promise<void> {
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
            select: {
                role: true,
            },
        });

        if (!user) {
            throw new NotFoundException(notFoundMessage);
        }

        if (user.role !== role) {
            throw new BadRequestException(`User must have ${role} role`);
        }
    }

    private ensureCanOperateMatchClock(match: { scorerId: string | null }, actor: MatchActor): void {
        if (actor.role === UserRole.ADMIN) {
            return;
        }

        if (match.scorerId !== actor.id) {
            throw new ForbiddenException('You can only operate matches assigned to you');
        }
    }

    private ensureMatchCanUseClock(match: { status: MatchStatus }): void {
        if (match.status === MatchStatus.FINAL) {
            throw new BadRequestException('Final matches cannot use clock controls');
        }
    }

    private async findClockActionMatch(id: string): Promise<MatchRecord> {
        const match = await this.prisma.match.findUnique({
            where: { id },
        });

        if (!match) {
            throw new NotFoundException('Match not found');
        }

        return match;
    }

    private async updateMatchClock(
        id: string,
        data: {
            status?: MatchStatus;
            clockStatus?: MatchClockStatus;
            clockRemainingSeconds?: number;
            clockLastStartedAt?: Date | null;
        },
    ): Promise<MatchWithRelations> {
        const updatedMatch = await this.prisma.match.update({
            where: { id },
            data,
            include: this.matchInclude(),
        });

        return this.withCurrentClock(updatedMatch);
    }

    private withCurrentClock<T extends MatchRecord>(match: T): T {
        if (match.clockStatus !== MatchClockStatus.RUNNING) {
            return match;
        }

        const remainingSeconds = this.getCurrentRemainingSeconds(match);

        if (remainingSeconds === 0) {
            return {
                ...match,
                clockStatus: MatchClockStatus.ENDED,
                clockRemainingSeconds: 0,
                clockLastStartedAt: null,
            };
        }

        return {
            ...match,
            clockRemainingSeconds: remainingSeconds,
        };
    }

    private getCurrentRemainingSeconds(match: MatchRecord): number {
        if (match.clockStatus !== MatchClockStatus.RUNNING || !match.clockLastStartedAt) {
            return match.clockRemainingSeconds;
        }

        const elapsedSeconds = Math.floor((Date.now() - match.clockLastStartedAt.getTime()) / 1000);

        return Math.max(0, match.clockRemainingSeconds - elapsedSeconds);
    }

    private nextPowerOfTwo(value: number): number {
        return 2 ** Math.ceil(Math.log2(value));
    }

    private shuffle<T>(items: T[]): T[] {
        const shuffled = [...items];

        for (let index = shuffled.length - 1; index > 0; index -= 1) {
            const swapIndex = Math.floor(Math.random() * (index + 1));
            [shuffled[index], shuffled[swapIndex]] = [shuffled[swapIndex], shuffled[index]];
        }

        return shuffled;
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
