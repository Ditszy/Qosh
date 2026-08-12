import { Transform } from 'class-transformer';
import { IsIn, IsInt, IsOptional, Max, Min } from 'class-validator';
import { TournamentStatus } from '../tournament-status.enum';

export const TournamentSortBy = {
    STARTS_AT: 'startsAt',
    NAME: 'name',
    CREATED_AT: 'createdAt',
} as const;

export type TournamentSortBy = (typeof TournamentSortBy)[keyof typeof TournamentSortBy];

export const TournamentSortDirection = {
    ASC: 'asc',
    DESC: 'desc',
} as const;

export type TournamentSortDirection = (typeof TournamentSortDirection)[keyof typeof TournamentSortDirection];

export class FindTournamentsDto {
    @IsOptional()
    @Transform(({ value }) => value === undefined || value === '' ? undefined : Number(value))
    @IsInt()
    @Min(1)
    page?: number;

    @IsOptional()
    @Transform(({ value }) => value === undefined || value === '' ? undefined : Number(value))
    @IsInt()
    @Min(1)
    @Max(50)
    pageSize?: number;

    @IsOptional()
    @IsIn(Object.values(TournamentStatus))
    status?: TournamentStatus;

    @IsOptional()
    @IsIn(Object.values(TournamentSortBy))
    sortBy?: TournamentSortBy;

    @IsOptional()
    @IsIn(Object.values(TournamentSortDirection))
    sortDirection?: TournamentSortDirection;
}
