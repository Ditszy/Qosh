import { IsNotEmpty, IsString } from 'class-validator';

export class CreateRefereeReportDto {
    @IsString()
    @IsNotEmpty()
    notes!: string;
}