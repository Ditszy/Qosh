import { BadRequestException, ConflictException, Injectable } from "@nestjs/common";
import { CreateUserDto } from "./dto/create-user.dto";
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

export type UserStats = Record<
    'totalUsers' | 'players' | 'organizers' | 'referees' | 'scorers' | 'admins',
    number
>;

type UserWithPassword = PublicUser & {
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

@Injectable()
export class UsersService {
    constructor(private readonly prisma: PrismaService) { }

    async findAll(): Promise<PublicUser[]> {
        return this.prisma.user.findMany({
            select: publicUserSelect,
        });
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

    async createByAdmin(createUserDto: CreateUserDto): Promise<PublicUser> {
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
            select: publicUserSelect,
        });
    }
}
