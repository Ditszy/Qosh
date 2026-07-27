import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationRecord } from './types/notification.types';

@Injectable()
export class NotificationsService {
    constructor(private readonly prisma: PrismaService) { }

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
