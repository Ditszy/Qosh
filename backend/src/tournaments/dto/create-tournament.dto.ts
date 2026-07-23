import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsDateString, IsInt, IsNotEmpty, IsOptional, IsString, Max, Min } from 'class-validator';

export class CreateTournamentDto {
    @ApiProperty({ example: 'Summer 3x3 Open' })
    @IsString()
    @IsNotEmpty()
    name!: string;

    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    description?: string;

    @ApiProperty()
    @IsString()
    @IsNotEmpty()
    location!: string;

    @ApiProperty({ example: '2026-08-15T18:00:00.000Z' })
    @IsDateString()
    startsAt!: string;

    @ApiPropertyOptional({ example: 8, minimum: 2, maximum: 32 })
    @IsOptional()
    @Type(() => Number)
    @IsInt()
    @Min(2)
    @Max(32)
    maxTeams?: number;
}
