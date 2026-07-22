import { ConflictException, Injectable } from "@nestjs/common";
import { UsersService } from "../users/users.service";
import { JwtService } from "@nestjs/jwt";
import { RegisterDto } from "./dto/register.dto";
import * as bcrypt from "bcryptjs";
import { UserRole } from "../common/user-role.enum";

@Injectable()
export class AuthService {
    constructor(
        private usersService: UsersService,
        private jwtService: JwtService
    ) { }

    async register(registerDto: RegisterDto) {
        const existing = await this.usersService.findByEmail(registerDto.email);
        if (existing) {
            throw new ConflictException("Email already exists");
        }

        const hashedPassword = await bcrypt.hash(registerDto.password, 10);
        const user = await this.usersService.createWithHashedPassword({
            ...registerDto,
            password: hashedPassword,
            role: UserRole.PLAYER,
        });

        const { password, ...result } = user;
        return result;
    }

    async validateUser(email: string, password: string) {
        const user = await this.usersService.findByEmailWithPassword(email);
        if (!user) return null;

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) return null;

        return user;
    }

    async login(user: any) {
        const payload = { sub: user.id, email: user.email, role: user.role };
        return {
            access_token: this.jwtService.sign(payload),
            user: { id: user.id, email: user.email, name: user.name, role: user.role }
        };
    }
}