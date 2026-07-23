export const UserRole = {
    PLAYER: 'PLAYER',
    ORGANIZER: 'ORGANIZER',
    REFEREE: 'REFEREE',
    SCORER: 'SCORER',
    ADMIN: 'ADMIN',
} as const;

export type UserRole = (typeof UserRole)[keyof typeof UserRole];
