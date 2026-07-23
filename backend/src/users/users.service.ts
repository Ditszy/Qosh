import { ConflictException, Injectable } from "@nestjs/common";
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
