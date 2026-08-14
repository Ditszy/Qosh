import type { Request, Response } from 'express';

export const REFRESH_TOKEN_COOKIE_NAME = 'qosh_refresh';

export function setRefreshTokenCookie(
    response: Response,
    refreshToken: string,
    expiresAt: Date,
): void {
    response.cookie(REFRESH_TOKEN_COOKIE_NAME, refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/auth',
        expires: expiresAt,
    });
}

export function clearRefreshTokenCookie(response: Response): void {
    response.clearCookie(REFRESH_TOKEN_COOKIE_NAME, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/auth',
    });
}

export function getRefreshTokenFromCookie(request: Request): string | undefined {
    return request.cookies?.[REFRESH_TOKEN_COOKIE_NAME];
}
