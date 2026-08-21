import { BadRequestException, ConflictException, ForbiddenException, Injectable, NotFoundException } from "@nestjs/common";
import { ChangeMyPasswordDto } from "./dto/change-my-password.dto";
import { CreateUserDto } from "./dto/create-user.dto";
import { UpdateMyProfileDto } from "./dto/update-my-profile.dto";
import * as bcrypt from "bcryptjs";
import { PrismaService } from "../prisma/prisma.service";
import { UserRole } from "../common/user-role.enum";

export type PublicUser = {
    id: string;
    email: string;
    username: string;
    firstName: string;
    lastName: string;
    role: UserRole;
};

export type AdminUser = PublicUser & {
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
};

export type SessionUser = PublicUser & {
    isActive: boolean;
};

export type UserStats = Record<
    'totalUsers' | 'players' | 'organizers' | 'referees' | 'scorers' | 'admins',
    number
>;

type UserWithPassword = SessionUser & {
    password: string;
};

export const publicUserSelect = {
    id: true,
    email: true,
    username: true,
    firstName: true,
    lastName: true,
    role: true,
};

const adminUserSelect = {
    ...publicUserSelect,
    isActive: true,
    createdAt: true,
    updatedAt: true,
};

const sessionUserSelect = {
    ...publicUserSelect,
    isActive: true,
};

@Injectable()
export class UsersService {
    constructor(private readonly prisma: PrismaService) { }

    async findAll(query = '', role?: UserRole): Promise<AdminUser[]> {
        const search = query.trim();
        const take = 8;

        if (role && !Object.values(UserRole).includes(role)) {
            throw new BadRequestException('Invalid user role');
        }

        if (search.length < 2) {
            return [];
        }

        const roleFilter = role ? { role } : {};
        const startsWithMatches = await this.prisma.user.findMany({
            where: {
                ...roleFilter,
                OR: [
                    { username: { startsWith: search, mode: 'insensitive' } },
                    { firstName: { startsWith: search, mode: 'insensitive' } },
                    { lastName: { startsWith: search, mode: 'insensitive' } },
                    { email: { startsWith: search, mode: 'insensitive' } },
                ],
            },
            select: adminUserSelect,
            orderBy: [{ role: 'asc' }, { username: 'asc' }],
            take,
        });

        if (startsWithMatches.length >= take) {
            return startsWithMatches;
        }

        const remainingMatches = await this.prisma.user.findMany({
            where: {
                ...roleFilter,
                id: { notIn: startsWithMatches.map((user) => user.id) },
                OR: [
                    { username: { contains: search, mode: 'insensitive' } },
                    { firstName: { contains: search, mode: 'insensitive' } },
                    { lastName: { contains: search, mode: 'insensitive' } },
                    { email: { contains: search, mode: 'insensitive' } },
                ],
            },
            select: adminUserSelect,
            orderBy: [{ role: 'asc' }, { username: 'asc' }],
            take: take - startsWithMatches.length,
        });

        return [...startsWithMatches, ...remainingMatches];
    }

    async getStats(): Promise<UserStats> {
        const [totalUsers, roleCounts] = await Promise.all([
            this.prisma.user.count(),
            this.prisma.user.groupBy({
                by: ['role'],
                _count: { _all: true },
            }),
        ]);

        const count = (role: UserRole) =>
            roleCounts.find((item) => item.role === role)?._count._all ?? 0;

        return {
            totalUsers,
            players: count(UserRole.PLAYER),
            organizers: count(UserRole.ORGANIZER),
            referees: count(UserRole.REFEREE),
            scorers: count(UserRole.SCORER),
            admins: count(UserRole.ADMIN),
        };
    }

    async findOfficials(query: string, role?: UserRole): Promise<PublicUser[]> {
        const allowedRoles: UserRole[] = [UserRole.SCORER, UserRole.REFEREE];
        const search = query.trim();

        if (role && !allowedRoles.includes(role)) {
            throw new BadRequestException('Official role must be SCORER or REFEREE');
        }

        if (search.length < 2) {
            return [];
        }

        return this.prisma.user.findMany({
            where: {
                role: role ?? { in: allowedRoles },
                OR: [
                    { username: { contains: search, mode: 'insensitive' } },
                    { firstName: { contains: search, mode: 'insensitive' } },
                    { lastName: { contains: search, mode: 'insensitive' } },
                    { email: { contains: search, mode: 'insensitive' } },
                ],
            },
            select: publicUserSelect,
            orderBy: [{ role: 'asc' }, { username: 'asc' }],
            take: 8,
        });
    }

    async findByEmail(email: string): Promise<PublicUser | null> {
        return this.prisma.user.findUnique({
            where: { email },
            select: publicUserSelect,
        });
    }

    async findByUsername(username: string): Promise<PublicUser | null> {
        return this.prisma.user.findUnique({
            where: { username },
            select: publicUserSelect,
        });
    }

    async searchPlayers(query: string): Promise<PublicUser[]> {
        const search = query.trim();

        if (search.length < 2) {
            return [];
        }

        return this.prisma.user.findMany({
            where: {
                role: UserRole.PLAYER,
                OR: [
                    { username: { contains: search, mode: 'insensitive' } },
                    { firstName: { contains: search, mode: 'insensitive' } },
                    { lastName: { contains: search, mode: 'insensitive' } },
                    { email: { contains: search, mode: 'insensitive' } },
                ],
            },
            select: publicUserSelect,
            orderBy: { username: 'asc' },
            take: 8,
        });
    }

    async findByEmailWithPassword(email: string): Promise<UserWithPassword | null> {
        return this.prisma.user.findUnique({
            where: { email },
        });
    }

    async createWithHashedPassword(createUserDto: CreateUserDto): Promise<UserWithPassword> {
        return this.prisma.user.create({
            data: createUserDto,
        });
    }

    async findById(id: string): Promise<PublicUser | null> {
        return this.prisma.user.findUnique({
            where: { id },
            select: publicUserSelect,
        });
    }

    async findSessionUserById(id: string): Promise<SessionUser | null> {
        return this.prisma.user.findUnique({
            where: { id },
            select: sessionUserSelect,
        });
    }

    async findAdminById(id: string): Promise<AdminUser | null> {
        return this.prisma.user.findUnique({
            where: { id },
            select: adminUserSelect,
        });
    }

    async setActiveStatus(id: string, isActive: boolean): Promise<AdminUser> {
        const user = await this.findAdminById(id);
        if (!user) {
            throw new NotFoundException('User not found');
        }

        return this.prisma.$transaction(async (tx) => {
            const updatedUser = await tx.user.update({
                where: { id },
                data: { isActive },
                select: adminUserSelect,
            });

            if (!isActive) {
                await tx.refreshSession.updateMany({
                    where: { userId: id, revokedAt: null },
                    data: { revokedAt: new Date() },
                });
            }

            return updatedUser;
        });
    }

    async updateMyProfile(id: string, updateMyProfileDto: UpdateMyProfileDto): Promise<PublicUser> {
        const user = await this.findSessionUserById(id);
        if (!user) {
            throw new NotFoundException('User not found');
        }
        this.assertPlayerSelfService(user);

        return this.prisma.user.update({
            where: { id },
            data: {
                firstName: updateMyProfileDto.firstName,
                lastName: updateMyProfileDto.lastName,
            },
            select: publicUserSelect,
        });
    }

    async changeMyPassword(id: string, changeMyPasswordDto: ChangeMyPasswordDto): Promise<void> {
        const user = await this.prisma.user.findUnique({ where: { id } });
        if (!user) {
            throw new NotFoundException('User not found');
        }
        this.assertPlayerSelfService(user);

        const isMatch = await bcrypt.compare(changeMyPasswordDto.oldPassword, user.password);
        if (!isMatch) {
            throw new BadRequestException('Old password is not correct');
        }

        const hashedPassword = await bcrypt.hash(changeMyPasswordDto.newPassword, 10);
        await this.prisma.user.update({
            where: { id },
            data: { password: hashedPassword },
        });
    }

    async deleteByAdmin(id: string, actorId: string): Promise<AdminUser> {
        if (id === actorId) {
            throw new BadRequestException('Admins cannot delete their own account');
        }

        const user = await this.findAdminById(id);
        if (!user) {
            throw new NotFoundException('User not found');
        }

        await this.assertUserHasNoDomainRecords(id);

        return this.prisma.$transaction(async (tx) => {
            await tx.refreshSession.deleteMany({ where: { userId: id } });

            return tx.user.delete({
                where: { id },
                select: adminUserSelect,
            });
        });
    }

    async createByAdmin(createUserDto: CreateUserDto): Promise<AdminUser> {
        const existing = await this.findByEmail(createUserDto.email);
        if (existing) {
            throw new ConflictException('User already exists');
        }

        const existingUsername = await this.findByUsername(createUserDto.username);
        if (existingUsername) {
            throw new ConflictException('Username already exists');
        }

        const hashedPassword = await bcrypt.hash(createUserDto.password, 10);
        return this.prisma.user.create({
            data: {
                ...createUserDto,
                password: hashedPassword,
            },
            select: adminUserSelect,
        });
    }

    private async assertUserHasNoDomainRecords(id: string): Promise<void> {
        const relationCounts = await Promise.all([
            this.prisma.tournament.count({ where: { organizerId: id } }),
            this.prisma.teamMember.count({ where: { userId: id } }),
            this.prisma.teamInvite.count({ where: { OR: [{ invitedUserId: id }, { inviterId: id }] } }),
            this.prisma.match.count({ where: { OR: [{ scorerId: id }, { refereeId: id }] } }),
            this.prisma.matchEvent.count({ where: { OR: [{ playerId: id }, { scorerId: id }] } }),
            this.prisma.matchPlayerStat.count({ where: { playerId: id } }),
            this.prisma.notification.count({ where: { recipientId: id } }),
            this.prisma.refereeReport.count({ where: { refereeId: id } }),
        ]);

        if (relationCounts.some((count) => count > 0)) {
            throw new BadRequestException('User has project records and cannot be deleted. Deactivate the account instead.');
        }
    }

    private assertPlayerSelfService(user: Pick<SessionUser, 'role' | 'isActive'>): void {
        if (!user.isActive || user.role !== UserRole.PLAYER) {
            throw new ForbiddenException('Only active player accounts can update player profile settings');
        }
    }
}
