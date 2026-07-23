import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService
    extends PrismaClient
    implements OnModuleInit, OnModuleDestroy {
    constructor(configService: ConfigService) {
        const adapter = new PrismaPg(buildDatabaseUrl(configService));
        super({ adapter });
    }

    async onModuleInit() {
        await this.$connect();
    }

    async onModuleDestroy() {
        await this.$disconnect();
    }
}

const buildDatabaseUrl = (configService: ConfigService) => {
    const databaseUrl = configService.get<string>('DATABASE_URL');

    if (databaseUrl) {
        return databaseUrl;
    }

    const host = configService.getOrThrow<string>('DB_HOST');
    const port = configService.getOrThrow<string>('DB_PORT');
    const username = configService.getOrThrow<string>('DB_USERNAME');
    const password = configService.getOrThrow<string>('DB_PASSWORD');
    const database = configService.getOrThrow<string>('DB_NAME');

    return `postgresql://${encodeURIComponent(username)}:${encodeURIComponent(password)}@${host}:${port}/${database}?schema=public`;
};
