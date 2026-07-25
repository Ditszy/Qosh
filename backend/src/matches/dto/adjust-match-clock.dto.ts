import { IsInt } from 'class-validator';

export class AdjustMatchClockDto {
    @IsInt()
    secondsDelta!: number;
}
