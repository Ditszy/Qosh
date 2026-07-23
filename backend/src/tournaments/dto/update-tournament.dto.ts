import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsDateString, IsInt, IsNotEmpty, IsOptional, IsString, Max, Min } from 'class-validator';

export class UpdateTournamentDto {
    @ApiPropertyOptional({ example: 'Summer 3x3 Open' })
    @IsOptional()
    @IsString()
    @IsNotEmpty()
    name?: string;

    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    description?: string;

    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    @IsNotEmpty()
    location?: string;

    @ApiPropertyOptional({ example: '2026-08-15T18:00:00.000Z' })
    @IsOptional()
    @IsDateString()
    startsAt?: string;

    @ApiPropertyOptional({ example: 8, minimum: 2, maximum: 32 })
    @IsOptional()
    @Type(() => Number)
    @IsInt()
    @Min(2)
    @Max(32)
    maxTeams?: number;
}
