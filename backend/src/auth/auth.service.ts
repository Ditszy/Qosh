import { BadRequestException, ConflictException, Injectable, UnauthorizedException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { UsersService } from "../users/users.service";
import { JwtService } from "@nestjs/jwt";
import { RegisterDto } from "./dto/register.dto";
import { ResetPasswordDto } from "./dto/reset-password.dto";
import * as bcrypt from "bcryptjs";
import { UserRole } from "../common/user-role.enum";
import { PrismaService } from "../prisma/prisma.service";
import { createHash, randomBytes, randomUUID } from "crypto";
import { MailService } from "../mail/mail.service";

const REFRESH_TOKEN_BYTES = 64;
const PASSWORD_RESET_TOKEN_BYTES = 32;
const DEFAULT_REFRESH_TOKEN_EXPIRATION_DAYS = 30;
const DEFAULT_PASSWORD_RESET_EXPIRATION_MINUTES = 60;

@Injectable()
export class AuthService {
    constructor(
        private usersService: UsersService,
        private jwtService: JwtService,
        private prisma: PrismaService,
        private configService: ConfigService,
        private mailService: MailService,
    ) { }

    async register(registerDto: RegisterDto) {
        const existing = await this.usersService.findByEmail(registerDto.email);
        if (existing) {
            throw new ConflictException("Email already exists");
        }

        const existingUsername = await this.usersService.findByUsername(registerDto.username);
        if (existingUsername) {
            throw new ConflictException("Username already exists");
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
        if (!user.isActive) return null;

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) return null;

        return user;
    }

    async login(user: any) {
        return {
            access_token: this.createAccessToken(user),
            user: {
                id: user.id,
                email: user.email,
                username: user.username,
                firstName: user.firstName,
                lastName: user.lastName,
                role: user.role,
            }
        };
    }

    async forgotPassword(email: string): Promise<{ success: true }> {
        const user = await this.prisma.user.findFirst({
            where: {
                email: { equals: email.trim(), mode: 'insensitive' },
                isActive: true,
            },
            select: {
                id: true,
                email: true,
                firstName: true,
            },
        });

        if (!user) {
            return { success: true };
        }

        const now = new Date();
        const resetToken = this.generatePasswordResetToken();
        const expiresInMinutes = this.getPasswordResetExpiryMinutes();
        const expiresAt = new Date(now.getTime() + expiresInMinutes * 60 * 1000);

        await this.prisma.$transaction(async (tx) => {
            await tx.passwordResetToken.updateMany({
                where: {
                    userId: user.id,
                    usedAt: null,
                },
                data: { usedAt: now },
            });

            await tx.passwordResetToken.create({
                data: {
                    userId: user.id,
                    tokenHash: this.hashPasswordResetToken(resetToken),
                    expiresAt,
                },
            });
        });

        await this.mailService.sendPasswordResetMail({
            to: user.email,
            firstName: user.firstName,
            resetUrl: this.buildPasswordResetUrl(resetToken),
            expiresInMinutes,
        });

        return { success: true };
    }

    async resetPassword(resetPasswordDto: ResetPasswordDto): Promise<{ success: true }> {
        const now = new Date();
        const tokenHash = this.hashPasswordResetToken(resetPasswordDto.token);
        const resetToken = await this.prisma.passwordResetToken.findUnique({
            where: { tokenHash },
            include: { user: true },
        });

        if (!resetToken || resetToken.usedAt || resetToken.expiresAt <= now || !resetToken.user.isActive) {
            throw new BadRequestException('Password reset token is invalid or expired');
        }

        const hashedPassword = await bcrypt.hash(resetPasswordDto.newPassword, 10);

        await this.prisma.$transaction(async (tx) => {
            await tx.user.update({
                where: { id: resetToken.userId },
                data: { password: hashedPassword },
            });

            await tx.passwordResetToken.update({
                where: { id: resetToken.id },
                data: { usedAt: now },
            });

            await tx.passwordResetToken.updateMany({
                where: {
                    userId: resetToken.userId,
                    usedAt: null,
                },
                data: { usedAt: now },
            });

            await tx.refreshSession.updateMany({
                where: {
                    userId: resetToken.userId,
                    revokedAt: null,
                },
                data: { revokedAt: now },
            });
        });

        return { success: true };
    }

    async createRefreshSession(userId: string) {
        const refreshToken = this.generateRefreshToken();
        const expiresAt = this.getRefreshTokenExpiry();

        await this.prisma.refreshSession.create({
            data: {
                userId,
                tokenHash: this.hashRefreshToken(refreshToken),
                tokenFamilyId: randomUUID(),
                expiresAt,
            },
        });

        return { refreshToken, expiresAt };
    }

    async refreshSession(refreshToken: string) {
        const now = new Date();
        const currentSession = await this.prisma.refreshSession.findUnique({
            where: { tokenHash: this.hashRefreshToken(refreshToken) },
        });

        if (!currentSession) {
            throw new UnauthorizedException('Invalid refresh token');
        }

        if (currentSession.revokedAt || currentSession.expiresAt <= now) {
            if (currentSession.revokedAt && currentSession.replacedById) {
                await this.revokeRefreshTokenFamily(currentSession.tokenFamilyId, now);
            }

            throw new UnauthorizedException('Invalid refresh token');
        }

        const user = await this.usersService.findSessionUserById(currentSession.userId);
        if (!user) {
            throw new UnauthorizedException('Invalid refresh token');
        }
        if (!user.isActive) {
            await this.prisma.refreshSession.updateMany({
                where: { userId: currentSession.userId, revokedAt: null },
                data: { revokedAt: now },
            });

            throw new UnauthorizedException('Invalid refresh token');
        }

        const sessionUser = {
            id: user.id,
            email: user.email,
            username: user.username,
            firstName: user.firstName,
            lastName: user.lastName,
            role: user.role,
        };

        const nextRefreshToken = this.generateRefreshToken();
        const expiresAt = this.getRefreshTokenExpiry();

        await this.prisma.$transaction(async (tx) => {
            const replacement = await tx.refreshSession.create({
                data: {
                    userId: currentSession.userId,
                    tokenHash: this.hashRefreshToken(nextRefreshToken),
                    tokenFamilyId: currentSession.tokenFamilyId,
                    expiresAt,
                },
            });

            await tx.refreshSession.update({
                where: { id: currentSession.id },
                data: { revokedAt: now, replacedById: replacement.id },
            });
        });

        return {
            refreshToken: nextRefreshToken,
            expiresAt,
            session: {
                access_token: this.createAccessToken(sessionUser),
                user: sessionUser,
            },
        };
    }

    async revokeRefreshSession(refreshToken?: string): Promise<void> {
        if (!refreshToken) {
            return;
        }

        await this.prisma.refreshSession.updateMany({
            where: {
                tokenHash: this.hashRefreshToken(refreshToken),
                revokedAt: null,
            },
            data: { revokedAt: new Date() },
        });
    }

    createAccessToken(user: { id: string; email: string; role: UserRole }) {
        return this.jwtService.sign({ sub: user.id, email: user.email, role: user.role });
    }

    hashRefreshToken(refreshToken: string): string {
        return createHash('sha256').update(refreshToken).digest('hex');
    }

    hashPasswordResetToken(token: string): string {
        return createHash('sha256').update(token).digest('hex');
    }

    private generateRefreshToken(): string {
        return randomBytes(REFRESH_TOKEN_BYTES).toString('base64url');
    }

    private generatePasswordResetToken(): string {
        return randomBytes(PASSWORD_RESET_TOKEN_BYTES).toString('base64url');
    }

    private getRefreshTokenExpiry(): Date {
        const configuredDays = this.configService.get<string>(
            'REFRESH_TOKEN_EXPIRATION_DAYS',
            String(DEFAULT_REFRESH_TOKEN_EXPIRATION_DAYS),
        );
        const days = Number(configuredDays) || DEFAULT_REFRESH_TOKEN_EXPIRATION_DAYS;

        return new Date(Date.now() + days * 24 * 60 * 60 * 1000);
    }

    private getPasswordResetExpiryMinutes(): number {
        const configuredMinutes = this.configService.get<string>(
            'PASSWORD_RESET_EXPIRATION_MINUTES',
            String(DEFAULT_PASSWORD_RESET_EXPIRATION_MINUTES),
        );

        return Number(configuredMinutes) || DEFAULT_PASSWORD_RESET_EXPIRATION_MINUTES;
    }

    private buildPasswordResetUrl(token: string): string {
        const frontendUrl = this.configService.get<string>('APP_FRONTEND_URL', 'http://localhost:4200');
        const normalizedFrontendUrl = frontendUrl.endsWith('/') ? frontendUrl.slice(0, -1) : frontendUrl;

        return `${normalizedFrontendUrl}/reset-password?token=${encodeURIComponent(token)}`;
    }

    private async revokeRefreshTokenFamily(tokenFamilyId: string, revokedAt: Date): Promise<void> {
        await this.prisma.refreshSession.updateMany({
            where: { tokenFamilyId, revokedAt: null },
            data: { revokedAt },
        });
    }
}
