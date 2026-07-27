import { NotificationType } from '../enums/notification-type.enum';

export type NotificationRecord = {
    id: string;
    recipientId: string;
    type: NotificationType;
    title: string;
    body: string;
    tournamentId: string | null;
    matchId: string | null;
    teamId: string | null;
    inviteId: string | null;
    readAt: Date | null;
    createdAt: Date;
};

export type CreateNotificationInput = {
    recipientId: string;
    type: NotificationType;
    title: string;
    body: string;
    tournamentId?: string | null;
    matchId?: string | null;
    teamId?: string | null;
    inviteId?: string | null;
};

export type NotificationClient = {
    notification: {
        create(args: { data: CreateNotificationInput }): Promise<NotificationRecord>;
    };
};

export type NotificationLiveMessage = {
    notification: NotificationRecord;
};
