import { IsEnum, IsISO8601, IsOptional, IsUUID } from 'class-validator';
import { MatchEventType } from '../enums/match-event-type.enum';

export class CreateMatchEventDto {
    @IsEnum(MatchEventType)
    type!: MatchEventType;

    @IsUUID()
    teamId!: string;

    @IsOptional()
    @IsUUID()
    playerId?: string;

    @IsOptional()
    @IsISO8601()
    occurredAt?: string;
}
