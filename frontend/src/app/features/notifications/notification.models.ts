export type NotificationType =
  | 'TEAM_INVITE'
  | 'MATCH_ASSIGNMENT'
  | 'TOURNAMENT_STARTED'
  | 'MATCH_SCHEDULE_CHANGED';

export type NotificationItem = {
  id: string;
  recipientId: string;
  type: NotificationType;
  title: string;
  body: string;
  tournamentId: string | null;
  matchId: string | null;
  teamId: string | null;
  inviteId: string | null;
  readAt: string | null;
  createdAt: string;
};

export type NotificationLivePayload = {
  notification: NotificationItem;
};

export type NotificationLiveStreamMessage = {
  type: 'notification.created';
  data: NotificationLivePayload;
};
