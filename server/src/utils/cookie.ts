import { Response } from 'express';
import { env } from '@/config/env';
import { REFRESH_COOKIE_NAME } from '@/config/constants';

/**
 * Sets the refresh token HTTP-only cookie.
 */
export function setRefreshCookie(res: Response, token: string, rememberMe = false): void {
  const maxAge = rememberMe
    ? 30 * 24 * 60 * 60 * 1000 // 30 days
    : 7 * 24 * 60 * 60 * 1000;  // 7 days

  res.cookie(REFRESH_COOKIE_NAME, token, {
    httpOnly: true,
    secure: env.COOKIE_SECURE,
    sameSite: env.isProduction ? 'none' : 'lax', // Use 'none' for cross-domain production CORS
    domain: env.COOKIE_DOMAIN || undefined,
    maxAge,
  });
}

/**
 * Clears the refresh token cookie.
 */
export function clearRefreshCookie(res: Response): void {
  res.clearCookie(REFRESH_COOKIE_NAME, {
    httpOnly: true,
    secure: env.COOKIE_SECURE,
    sameSite: env.isProduction ? 'none' : 'lax',
    domain: env.COOKIE_DOMAIN || undefined,
  });
}
