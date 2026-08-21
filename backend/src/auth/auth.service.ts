import { ConflictException, Injectable, UnauthorizedException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { UsersService } from "../users/users.service";
import { JwtService } from "@nestjs/jwt";
import { RegisterDto } from "./dto/register.dto";
import * as bcrypt from "bcryptjs";
import { UserRole } from "../common/user-role.enum";
import { PrismaService } from "../prisma/prisma.service";
import { createHash, randomBytes, randomUUID } from "crypto";

const REFRESH_TOKEN_BYTES = 64;
const DEFAULT_REFRESH_TOKEN_EXPIRATION_DAYS = 30;

@Injectable()
export class AuthService {
    constructor(
        private usersService: UsersService,
        private jwtService: JwtService,
        private prisma: PrismaService,
        private configService: ConfigService,
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

    private generateRefreshToken(): string {
        return randomBytes(REFRESH_TOKEN_BYTES).toString('base64url');
    }

    private getRefreshTokenExpiry(): Date {
        const configuredDays = this.configService.get<string>(
            'REFRESH_TOKEN_EXPIRATION_DAYS',
            String(DEFAULT_REFRESH_TOKEN_EXPIRATION_DAYS),
        );
        const days = Number(configuredDays) || DEFAULT_REFRESH_TOKEN_EXPIRATION_DAYS;

        return new Date(Date.now() + days * 24 * 60 * 60 * 1000);
    }

    private async revokeRefreshTokenFamily(tokenFamilyId: string, revokedAt: Date): Promise<void> {
        await this.prisma.refreshSession.updateMany({
            where: { tokenFamilyId, revokedAt: null },
            data: { revokedAt },
        });
    }
}
