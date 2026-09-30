import { Transform } from 'class-transformer';
import { IsInt, IsOptional, Max, Min } from 'class-validator';

export class FindManagedCommandCenterDto {
    @IsOptional()
    @Transform(({ value }) => value === undefined || value === '' ? undefined : Number(value))
    @IsInt()
    @Min(1)
    @Max(10)
    limit?: number;
}
