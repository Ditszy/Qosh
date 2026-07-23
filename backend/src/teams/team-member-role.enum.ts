export const TeamMemberRole = {
    CAPTAIN: 'CAPTAIN',
    MEMBER: 'MEMBER',
} as const;

export type TeamMemberRole = (typeof TeamMemberRole)[keyof typeof TeamMemberRole];
