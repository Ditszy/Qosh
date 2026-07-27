import { Injectable, MessageEvent, NotFoundException } from '@nestjs/common';
import { Observable, Subject } from 'rxjs';
import { filter, map } from 'rxjs/operators';
import { PrismaService } from '../prisma/prisma.service';
import {
    CreateNotificationInput,
    NotificationClient,
    NotificationLiveMessage,
    NotificationRecord,
} from './types/notification.types';

@Injectable()
export class NotificationsService {
    private readonly notificationUpdates$ = new Subject<NotificationRecord>();

    constructor(private readonly prisma: PrismaService) { }

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
        return this.notificationUpdates$.pipe(
            filter((notification) => notification.recipientId === userId),
            map((notification) => ({
                type: 'notification.created',
                data: this.toLiveMessage(notification),
            })),
        );
    }

    publishCreated(notification: NotificationRecord): void {
        this.notificationUpdates$.next(notification);
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

    private toLiveMessage(notification: NotificationRecord): NotificationLiveMessage {
        return { notification };
    }
}
