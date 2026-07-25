import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AdjustMatchClockDto } from './dto/adjust-match-clock.dto';
import { MatchAccessService } from './match-access.service';
import { MatchClockStatus } from './match-clock-status.enum';
import { MatchLiveService } from './match-live.service';
import { MatchStatus } from './match-status.enum';
import { MatchesReadService } from './matches-read.service';
import {
    MatchActor,
    MatchClockUpdateData,
    MatchRecord,
    MatchWithRelations,
} from './types/match.types';

@Injectable()
export class MatchClockService {
    constructor(
        private readonly prisma: PrismaService,
        private readonly matchAccessService: MatchAccessService,
        private readonly matchLiveService: MatchLiveService,
        private readonly matchesReadService: MatchesReadService,
    ) { }

    async startClock(id: string, actor: MatchActor): Promise<MatchWithRelations> {
        const match = await this.findClockActionMatch(id);
        this.matchAccessService.ensureCanOperateMatchClock(match, actor);
        this.matchAccessService.ensureMatchCanUseClock(match);

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
        this.matchAccessService.ensureCanOperateMatchClock(match, actor);
        this.matchAccessService.ensureMatchCanUseClock(match);

        if (match.clockStatus !== MatchClockStatus.RUNNING) {
            throw new BadRequestException('Only a running match clock can be paused');
        }

        const remainingSeconds = this.matchesReadService.getCurrentRemainingSeconds(match);

        return this.updateMatchClock(id, {
            clockStatus: remainingSeconds === 0 ? MatchClockStatus.ENDED : MatchClockStatus.PAUSED,
            clockRemainingSeconds: remainingSeconds,
            clockLastStartedAt: null,
        });
    }

    async resumeClock(id: string, actor: MatchActor): Promise<MatchWithRelations> {
        const match = await this.findClockActionMatch(id);
        this.matchAccessService.ensureCanOperateMatchClock(match, actor);
        this.matchAccessService.ensureMatchCanUseClock(match);

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
        this.matchAccessService.ensureCanOperateMatchClock(match, actor);
        this.matchAccessService.ensureMatchCanUseClock(match);

        const remainingSeconds = Math.max(
            0,
            this.matchesReadService.getCurrentRemainingSeconds(match) + adjustMatchClockDto.secondsDelta,
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
        this.matchAccessService.ensureCanOperateMatchClock(match, actor);
        this.matchAccessService.ensureMatchCanUseClock(match);

        if (match.clockStatus === MatchClockStatus.ENDED) {
            throw new BadRequestException('Match clock has already ended');
        }

        return this.updateMatchClock(id, {
            clockStatus: MatchClockStatus.ENDED,
            clockRemainingSeconds: 0,
            clockLastStartedAt: null,
        });
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
        data: MatchClockUpdateData,
    ): Promise<MatchWithRelations> {
        const updatedMatch = await this.prisma.match.update({
            where: { id },
            data,
            include: this.matchesReadService.matchInclude(),
        });
        const projectedMatch = this.matchesReadService.withCurrentClock(updatedMatch);
        this.matchLiveService.publishClockChange(projectedMatch);

        return projectedMatch;
    }
}
