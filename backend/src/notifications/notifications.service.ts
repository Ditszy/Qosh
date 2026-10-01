import { BadRequestException, Injectable, MessageEvent, NotFoundException } from '@nestjs/common';
import { Observable } from 'rxjs';
import { LiveEventBus, LiveEventTopic } from '../live-events/live-event-bus';
import { PrismaService } from '../prisma/prisma.service';
import {
    CreateNotificationInput,
    NotificationClient,
    NotificationLiveMessage,
    NotificationPage,
    NotificationRecord,
} from './types/notification.types';
import { FindNotificationsDto } from './dto/find-notifications.dto';

@Injectable()
export class NotificationsService {
    constructor(
        private readonly prisma: PrismaService,
        private readonly liveEventBus: LiveEventBus,
    ) { }

    async create(
        createNotificationInput: CreateNotificationInput,
        client: NotificationClient = this.prisma,
        publishAfterCreate = true,
    ): Promise<NotificationRecord> {
        const notification = await client.notification.create({
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

        if (publishAfterCreate) {
            this.publishCreated(notification);
        }

        return notification;
    }

    watchForUser(userId: string): Observable<MessageEvent> {
        return this.liveEventBus.watch(LiveEventTopic.notificationUser(userId));
    }

    publishCreated(notification: NotificationRecord): void {
        this.liveEventBus.publish(LiveEventTopic.notificationUser(notification.recipientId), {
            type: 'notification.created',
            data: this.toLiveMessage(notification),
        });
    }

    async findForUser(userId: string, query: FindNotificationsDto = {}): Promise<NotificationPage> {
        const limit = Math.min(50, Math.max(1, query.limit ?? 30));
        const cursorNotification = query.cursor
            ? await this.prisma.notification.findFirst({
                where: { id: query.cursor, recipientId: userId },
                select: { id: true, createdAt: true },
            })
            : null;

        if (query.cursor && !cursorNotification) {
            throw new BadRequestException('Invalid notification cursor');
        }

        const cursorFilter = cursorNotification
            ? {
                OR: [
                    { createdAt: { lt: cursorNotification.createdAt } },
                    { createdAt: cursorNotification.createdAt, id: { lt: cursorNotification.id } },
                ],
            }
            : {};

        const [notifications, unreadCount] = await Promise.all([
            this.prisma.notification.findMany({
                where: {
                    recipientId: userId,
                    ...cursorFilter,
                },
                orderBy: [
                    { createdAt: 'desc' },
                    { id: 'desc' },
                ],
                take: limit + 1,
            }),
            this.prisma.notification.count({
                where: { recipientId: userId, readAt: null },
            }),
        ]);

        const hasMore = notifications.length > limit;
        const items = hasMore ? notifications.slice(0, limit) : notifications;

        return {
            items,
            nextCursor: hasMore ? items.at(-1)?.id ?? null : null,
            unreadCount,
        };
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

    async remove(id: string, userId: string): Promise<NotificationRecord> {
        const notification = await this.prisma.notification.findFirst({
            where: {
                id,
                recipientId: userId,
            },
        });

        if (!notification) {
            throw new NotFoundException('Notification not found');
        }

        return this.prisma.notification.delete({
            where: { id },
        });
    }

    private toLiveMessage(notification: NotificationRecord): NotificationLiveMessage {
        return { notification };
    }
}
