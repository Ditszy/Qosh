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
import { CreateRefereeReportDto } from './dto/create-referee-report.dto';
import { RefereeReportRecord } from './types/report.types';

type ReportActor = {
    id: string;
    role: UserRole;
};

@Injectable()
export class ReportsService {
    constructor(private readonly prisma: PrismaService) { }

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
}