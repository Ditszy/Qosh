import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { StatisticsService } from '../../statistics/statistics.service';
import { publicUserSelect } from '../../users/users.service';
import { MatchReadBundle } from '../types/match.types';
import { MatchesReadService } from './matches-read.service';

@Injectable()
export class MatchReadBundleService {
    constructor(
        private readonly prisma: PrismaService,
        private readonly matchesReadService: MatchesReadService,
        private readonly statisticsService: StatisticsService,
    ) { }

    async findById(matchId: string): Promise<MatchReadBundle> {
        const [match, events, statistics, refereeReport] = await Promise.all([
            this.matchesReadService.findById(matchId),
            this.prisma.matchEvent.findMany({
                where: { matchId },
                include: {
                    team: true,
                    player: {
                        select: publicUserSelect,
                    },
                    scorer: {
                        select: publicUserSelect,
                    },
                },
                orderBy: [
                    { occurredAt: 'asc' },
                    { createdAt: 'asc' },
                ],
            }),
            this.statisticsService.findMatchPlayerStatistics(matchId),
            this.prisma.refereeReport.findUnique({
                where: { matchId },
                include: {
                    referee: {
                        select: publicUserSelect,
                    },
                    match: {
                        select: {
                            id: true,
                            tournamentId: true,
                            round: true,
                            bracketPosition: true,
                            tournament: {
                                select: {
                                    id: true,
                                    name: true,
                                    organizerId: true,
                                },
                            },
                        },
                    },
                },
            }),
        ]);

        return {
            match,
            events,
            statistics,
            refereeReport,
            serverTime: new Date(),
        };
    }
}
