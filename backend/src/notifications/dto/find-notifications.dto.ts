import { Transform } from 'class-transformer';
import { IsInt, IsOptional, IsUUID, Max, Min } from 'class-validator';

export class FindNotificationsDto {
    @IsOptional()
    @Transform(({ value }) => value === undefined || value === '' ? undefined : Number(value))
    @IsInt()
    @Min(1)
    @Max(50)
    limit?: number;

    @IsOptional()
    @IsUUID()
    cursor?: string;
}
