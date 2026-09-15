import { Transform } from 'class-transformer';
import { IsIn, IsInt, IsOptional, IsString, IsUUID, Max, Min } from 'class-validator';
import { PlayerStatisticSort } from '../enums/player-statistic-sort.enum';
import { SortDirection } from '../enums/sort-direction.enum';

export class FindPlayerStatisticsDto {
    @IsOptional()
    @IsUUID()
    tournamentId?: string;

    @IsOptional()
    @IsUUID()
    teamId?: string;

    @IsOptional()
    @IsString()
    search?: string;

    @IsOptional()
    @Transform(({ value }) => value === undefined || value === '' ? undefined : Number(value))
    @IsInt()
    @Min(0)
    minGamesPlayed?: number;

    @IsOptional()
    @Transform(({ value }) => value === undefined || value === '' ? undefined : Number(value))
    @IsInt()
    @Min(1)
    @Max(100)
    limit?: number;

    @IsOptional()
    @IsIn(Object.values(PlayerStatisticSort))
    sortBy?: PlayerStatisticSort;

    @IsOptional()
    @IsIn(Object.values(SortDirection))
    sortDirection?: SortDirection;
}
