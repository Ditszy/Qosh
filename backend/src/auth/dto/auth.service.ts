import { ConflictException, Injectable } from "@nestjs/common";
import { UsersService } from "../../users/users.service";
import { JwtService } from "@nestjs/jwt";
import { CreateUserDto } from "../../users/dto/create-user.dto";
import * as bcrypt from "bcryptjs";

@Injectable()
export class AuthService {
    constructor(
        private usersService: UsersService,
        private jwtService: JwtService
    ) { }

    async register(createUserDto: CreateUserDto) {
        const existing = await this.usersService.findByEmail(createUserDto.email);
        if (existing) {
            throw new ConflictException("Email already exists");
        }

        const hashedPassword = await bcrypt.hash(createUserDto.password, 10);
        const user = await this.usersService.create({
            ...createUserDto,
            password: hashedPassword,
        });

        const { password, ...result } = user;
        return result;
    }
}