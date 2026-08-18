import {
    BadRequestException,
    ConflictException,
    ForbiddenException,
    Injectable,
    NotFoundException,
} from '@nestjs/common';
import { UserRole } from '../common/user-role.enum';
import { MatchStatus } from '../matches/enums/match-status.enum';
import { MatchLiveService } from '../matches/services/match-live.service';
import { PrismaService } from '../prisma/prisma.service';
import { publicUserSelect } from '../users/users.service';
import { CreateRefereeReportDto } from './dto/create-referee-report.dto';
import { RefereeReportWithRelations } from './types/report.types';

type ReportActor = {
    id: string;
    role: UserRole;
};

@Injectable()
export class ReportsService {
    constructor(
        private readonly prisma: PrismaService,
        private readonly matchLiveService: MatchLiveService,
    ) { }

    async findByMatchId(matchId: string): Promise<RefereeReportWithRelations> {
        const report = await this.prisma.refereeReport.findUnique({
            where: { matchId },
            include: this.reportInclude(),
        });

        if (!report) {
            throw new NotFoundException('Referee report not found');
        }

        return report;
    }

    async createForMatch(
        matchId: string,
        createRefereeReportDto: CreateRefereeReportDto,
        actor: ReportActor,
    ): Promise<RefereeReportWithRelations> {
        const match = await this.prisma.match.findUnique({
            where: { id: matchId },
        });

        if (!match) {
            throw new NotFoundException('Match not found');
        }

        if (match.status !== MatchStatus.FINAL) {
            throw new BadRequestException('Referee reports can only be submitted after a match is final');
        }

        if (actor.role !== UserRole.ADMIN && match.refereeId !== actor.id) {
            throw new ForbiddenException('You can only submit reports for matches assigned to you');
        }

        const existingReport = await this.prisma.refereeReport.findUnique({
            where: { matchId },
        });

        if (existingReport) {
            throw new ConflictException('Referee report already exists for this match');
        }

        await this.prisma.refereeReport.create({
            data: {
                matchId,
                refereeId: actor.id,
                notes: createRefereeReportDto.notes,
            },
        });

        const report = await this.findByMatchId(matchId);
        this.matchLiveService.publishReportCreated(matchId, report);

        return report;
    }

    private reportInclude() {
        return {
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
        };
    }
}
