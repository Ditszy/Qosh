import { IsEmail, IsIn, IsNotEmpty, IsString, MinLength } from 'class-validator';
import { UserRole } from '../../common/user-role.enum';
import { ApiProperty } from '@nestjs/swagger';

export class CreateUserDto {
    @ApiProperty()
    @IsNotEmpty()
    @IsString()
    firstName!: string;

    @ApiProperty()
    @IsNotEmpty()
    @IsString()
    lastName!: string;

    @ApiProperty()
    @IsNotEmpty()
    @IsString()
    @MinLength(3)
    username!: string;

    @ApiProperty()
    @IsEmail()
    email!: string;

    @ApiProperty()
    @IsNotEmpty()
    @MinLength(6)
    password!: string;

    @ApiProperty({ enum: [UserRole.ORGANIZER, UserRole.REFEREE, UserRole.SCORER] })
    @IsIn([UserRole.ORGANIZER, UserRole.REFEREE, UserRole.SCORER])
    role!: UserRole;
}
