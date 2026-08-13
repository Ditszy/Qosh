import { IsISO8601, IsOptional, IsString, IsUUID } from 'class-validator';

export class ScheduleMatchDto {
    @IsOptional()
    @IsISO8601()
    scheduledAt?: string;

    @IsOptional()
    @IsString()
    location?: string;

    @IsOptional()
    @IsUUID()
    scorerId?: string | null;

    @IsOptional()
    @IsUUID()
    refereeId?: string | null;
}
