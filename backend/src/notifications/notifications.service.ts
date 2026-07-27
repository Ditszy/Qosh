import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
    CreateNotificationInput,
    NotificationClient,
    NotificationRecord,
} from './types/notification.types';

@Injectable()
export class NotificationsService {
    constructor(private readonly prisma: PrismaService) { }

    create(
        createNotificationInput: CreateNotificationInput,
        client: NotificationClient = this.prisma,
    ): Promise<NotificationRecord> {
        return client.notification.create({
            data: {
                recipientId: createNotificationInput.recipientId,
                type: createNotificationInput.type,
                title: createNotificationInput.title,
                body: createNotificationInput.body,
                tournamentId: createNotificationInput.tournamentId,
                matchId: createNotificationInput.matchId,
                teamId: createNotificationInput.teamId,
                inviteId: createNotificationInput.inviteId,
            },
        });
    }

    findForUser(userId: string): Promise<NotificationRecord[]> {
        return this.prisma.notification.findMany({
            where: {
                recipientId: userId,
            },
            orderBy: {
                createdAt: 'desc',
            },
        });
    }

    async markAsRead(id: string, userId: string): Promise<NotificationRecord> {
        const notification = await this.prisma.notification.findFirst({
            where: {
                id,
                recipientId: userId,
            },
        });

        if (!notification) {
            throw new NotFoundException('Notification not found');
        }

        if (notification.readAt) {
            return notification;
        }

        return this.prisma.notification.update({
            where: { id },
            data: {
                readAt: new Date(),
            },
        });
    }
}
