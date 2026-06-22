import { Response } from 'express';

export const REFRESH_COOKIE = 'refreshToken';

interface CookieOpts {
  secure: boolean;
  maxAgeSec: number;
}

/**
 * Refresh tokenni httpOnly cookie'ga yozadi (XSS himoyasi).
 * `path` faqat auth endpointlariga — har so'rovda yuborilmaydi.
 */
export function setRefreshCookie(
  res: Response,
  token: string,
  opts: CookieOpts,
): void {
  res.cookie(REFRESH_COOKIE, token, {
    httpOnly: true,
    secure: opts.secure,
    sameSite: opts.secure ? 'none' : 'lax',
    path: '/api/v1/auth',
    maxAge: opts.maxAgeSec * 1000,
  });
}

export function clearRefreshCookie(res: Response, secure: boolean): void {
  res.clearCookie(REFRESH_COOKIE, {
    httpOnly: true,
    secure,
    sameSite: secure ? 'none' : 'lax',
    path: '/api/v1/auth',
  });
}
