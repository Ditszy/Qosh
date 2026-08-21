import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, MinLength } from 'class-validator';

export class ChangeMyPasswordDto {
    @ApiProperty()
    @IsNotEmpty()
    oldPassword!: string;

    @ApiProperty()
    @IsNotEmpty()
    @MinLength(6)
    newPassword!: string;
}
