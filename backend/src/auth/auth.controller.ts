import { Body, Controller, Post, Request, Res, UnauthorizedException, UseGuards } from "@nestjs/common";
import type { Request as ExpressRequest, Response } from "express";
import { AuthService } from "./auth.service";
import { RegisterDto } from "./dto/register.dto";
import { LocalAuthGuard } from "./local-auth.guard";
import { LoginDto } from "./dto/login.dto";
import { ApiTags } from "@nestjs/swagger";
import { clearRefreshTokenCookie, getRefreshTokenFromCookie, setRefreshTokenCookie } from "./auth-cookie";

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

    @Post('refresh')
    async refresh(
        @Request() request: ExpressRequest,
        @Res({ passthrough: true }) response: Response,
    ) {
        const currentRefreshToken = getRefreshTokenFromCookie(request);

        if (!currentRefreshToken) {
            throw new UnauthorizedException('Missing refresh token');
        }

        const { refreshToken, expiresAt, session } =
            await this.authService.refreshSession(currentRefreshToken);
        setRefreshTokenCookie(response, refreshToken, expiresAt);

        return session;
    }

    @Post('logout')
    async logout(
        @Request() request: ExpressRequest,
        @Res({ passthrough: true }) response: Response,
    ) {
        await this.authService.revokeRefreshSession(getRefreshTokenFromCookie(request));
        clearRefreshTokenCookie(response);

        return { success: true };
    }
}
