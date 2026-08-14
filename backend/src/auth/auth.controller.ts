import { Body, Controller, Post, Request, Res, UseGuards } from "@nestjs/common";
import type { Response } from "express";
import { AuthService } from "./auth.service";
import { RegisterDto } from "./dto/register.dto";
import { LocalAuthGuard } from "./local-auth.guard";
import { LoginDto } from "./dto/login.dto";
import { ApiTags } from "@nestjs/swagger";
import { setRefreshTokenCookie } from "./auth-cookie";

@ApiTags('auth')
@Controller('auth')
export class AuthController {
    constructor(private authService: AuthService) { }

    @Post('register')
    register(@Body() registerDto: RegisterDto) {
        return this.authService.register(registerDto);
    }

    @UseGuards(LocalAuthGuard)
    @Post('login')
    async login(
        @Request() req,
        @Body() loginDto: LoginDto,
        @Res({ passthrough: true }) response: Response,
    ) {
        const { refreshToken, expiresAt } = await this.authService.createRefreshSession(req.user.id);
        setRefreshTokenCookie(response, refreshToken, expiresAt);

        return this.authService.login(req.user);
    }
}
