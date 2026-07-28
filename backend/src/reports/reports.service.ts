import {
    BadRequestException,
    ConflictException,
    ForbiddenException,
    Injectable,
    NotFoundException,
} from '@nestjs/common';
import { UserRole } from '../common/user-role.enum';
import { MatchStatus } from '../matches/enums/match-status.enum';
import { PrismaService } from '../prisma/prisma.service';
import { publicUserSelect } from '../users/users.service';
import { CreateRefereeReportDto } from './dto/create-referee-report.dto';
import { RefereeReportRecord, RefereeReportWithRelations } from './types/report.types';

type ReportActor = {
    id: string;
    role: UserRole;
};

@Injectable()
export class ReportsService {
    constructor(private readonly prisma: PrismaService) { }

    async findByMatchId(matchId: string, actor: ReportActor): Promise<RefereeReportWithRelations> {
        const report = await this.prisma.refereeReport.findUnique({
            where: { matchId },
            include: this.reportInclude(),
        });

        if (!report) {
            throw new NotFoundException('Referee report not found');
        }

        this.ensureCanReadReport(report, actor);

        return report;
    }

    async createForMatch(
        matchId: string,
        createRefereeReportDto: CreateRefereeReportDto,
        actor: ReportActor,
    ): Promise<RefereeReportRecord> {
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

        return this.prisma.refereeReport.create({
            data: {
                matchId,
                refereeId: actor.id,
                notes: createRefereeReportDto.notes,
            },
        });
    }

    private ensureCanReadReport(report: RefereeReportWithRelations, actor: ReportActor): void {
        if (actor.role === UserRole.ADMIN) {
            return;
        }

        if (actor.role === UserRole.ORGANIZER && report.match.tournament.organizerId === actor.id) {
            return;
        }

        if (actor.role === UserRole.REFEREE && report.refereeId === actor.id) {
            return;
        }

        throw new ForbiddenException('You cannot read this referee report');
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
