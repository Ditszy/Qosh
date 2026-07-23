import { IsNotEmpty, IsString, IsUUID } from 'class-validator';

export class CreateTeamDto {
    @IsString()
    @IsNotEmpty()
    name!: string;

    @IsUUID()
    tournamentId!: string;
}
