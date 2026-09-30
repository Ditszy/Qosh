import { Transform } from 'class-transformer';
import { IsIn, IsInt, IsOptional, Max, Min } from 'class-validator';

export const ManagedTournamentView = {
    ACTIVE: 'active',
    HISTORY: 'history',
} as const;

export type ManagedTournamentView = (typeof ManagedTournamentView)[keyof typeof ManagedTournamentView];

export class FindManagedTournamentsDto {
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
    @IsIn(Object.values(ManagedTournamentView))
    view?: ManagedTournamentView;
}
