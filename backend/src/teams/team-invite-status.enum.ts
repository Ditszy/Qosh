export const TeamInviteStatus = {
    PENDING: 'PENDING',
    ACCEPTED: 'ACCEPTED',
    DECLINED: 'DECLINED',
    CANCELLED: 'CANCELLED',
} as const;

export type TeamInviteStatus = (typeof TeamInviteStatus)[keyof typeof TeamInviteStatus];
