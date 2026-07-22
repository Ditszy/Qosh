import { Body, Controller, Post, Request, UseGuards } from "@nestjs/common";
import { AuthService } from "./auth.service";
import { CreateUserDto } from "../users/dto/create-user.dto";
import { LocalAuthGuard } from "./local-auth.guard";
import { LoginDto } from "./dto/login.dto";

@Controller('auth')
export class AuthController {
    constructor(private authService: AuthService) { }

    @Post('register')
    register(@Body() createUserDto: CreateUserDto) {
        return this.authService.register(createUserDto);
    }

    @UseGuards(LocalAuthGuard)
    @Post('login')
    login(@Request() req, @Body() loginDto: LoginDto) {
        return this.authService.login(req.user);
    }
}