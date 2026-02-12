/**
 * Cookie Utilities for Secure Token Management
 *
 * Implements HttpOnly cookie-based token storage for enhanced security:
 * - Refresh tokens stored in HttpOnly cookies (not accessible to JavaScript)
 * - Prevents XSS attacks from stealing tokens
 * - SameSite=Strict prevents CSRF attacks
 * - Secure flag ensures HTTPS-only transmission
 *
 * POC-3 Phase 7.1: Migrate Tokens to HttpOnly Cookies
 */

import { Response } from 'express';
import { config } from '../config';

/**
 * Cookie names for auth tokens
 */
export const COOKIE_NAMES = {
  /** Refresh token cookie - HttpOnly, not accessible to JavaScript */
  REFRESH_TOKEN: 'mfe_refresh_token',
  /** Session ID for fingerprint validation */
  SESSION_ID: 'mfe_session_id',
} as const;

/**
 * Cookie configuration based on environment
 *
 * Note: In development with HTTPS (via nginx), we still need Secure=true
 * because modern browsers require Secure flag for cookies over HTTPS.
 * We use Secure=true whenever NODE_ENV is not 'test' to support:
 * - Production (HTTPS, Secure=true)
 * - Development with nginx HTTPS proxy (Secure=true)
 * - Tests (Secure=false for simpler testing)
 */
const useSecureCookies = config.nodeEnv !== 'test'; // Secure for both prod and dev (HTTPS via nginx)

/**
 * Parse the JWT refresh expiration duration to milliseconds
 * Default: 7 days
 */
function parseRefreshExpiryMs(): number {
  const expiresIn = config.jwtRefreshExpiresIn || '7d';
  const match = expiresIn.match(/^(\d+)(d|h|m|s)?$/);

  if (!match || !match[1]) {
    return 7 * 24 * 60 * 60 * 1000; // Default 7 days
  }

  const value = parseInt(match[1], 10);
  const unit = match[2] || 'd';

  switch (unit) {
    case 'd':
      return value * 24 * 60 * 60 * 1000;
    case 'h':
      return value * 60 * 60 * 1000;
    case 'm':
      return value * 60 * 1000;
    case 's':
      return value * 1000;
    default:
      return 7 * 24 * 60 * 60 * 1000;
  }
}

/**
 * Cookie options for refresh token
 *
 * Security settings:
 * - httpOnly: true - Prevents JavaScript access (XSS protection)
 * - secure: true in production - HTTPS only
 * - sameSite: 'strict' - Prevents CSRF attacks
 * - path: '/auth' - Cookie only sent to auth endpoints
 */
export const REFRESH_TOKEN_COOKIE_OPTIONS = {
  httpOnly: true,
  secure: useSecureCookies, // Secure=true for HTTPS (prod & dev via nginx), false for tests
  sameSite: 'strict' as const,
  path: '/', // Must be root for cross-path requests via API Gateway
  maxAge: parseRefreshExpiryMs(),
  // Domain is not set - defaults to current domain (more secure)
};

/**
 * Cookie options for session ID (used for fingerprint validation)
 */
export const SESSION_COOKIE_OPTIONS = {
  httpOnly: true,
  secure: useSecureCookies, // Secure=true for HTTPS (prod & dev via nginx), false for tests
  sameSite: 'strict' as const,
  path: '/',
  maxAge: parseRefreshExpiryMs(),
};

/**
 * Set refresh token as HttpOnly cookie
 *
 * @param res - Express response object
 * @param refreshToken - The refresh token to store
 * @param sessionId - Optional session ID for fingerprint validation
 */
export function setRefreshTokenCookie(
  res: Response,
  refreshToken: string,
  sessionId?: string
): void {
  // Set refresh token cookie
  res.cookie(
    COOKIE_NAMES.REFRESH_TOKEN,
    refreshToken,
    REFRESH_TOKEN_COOKIE_OPTIONS
  );

  // Set session ID cookie if provided
  if (sessionId) {
    res.cookie(COOKIE_NAMES.SESSION_ID, sessionId, SESSION_COOKIE_OPTIONS);
  }
}

/**
 * Clear refresh token cookie (on logout)
 *
 * @param res - Express response object
 */
export function clearRefreshTokenCookie(res: Response): void {
  // Clear refresh token cookie
  res.clearCookie(COOKIE_NAMES.REFRESH_TOKEN, {
    httpOnly: true,
    secure: useSecureCookies,
    sameSite: 'strict',
    path: '/',
  });

  // Clear session ID cookie
  res.clearCookie(COOKIE_NAMES.SESSION_ID, {
    httpOnly: true,
    secure: useSecureCookies,
    sameSite: 'strict',
    path: '/',
  });
}

/**
 * Get refresh token from request cookies
 *
 * @param cookies - Express request cookies object
 * @returns The refresh token or null if not present
 */
export function getRefreshTokenFromCookie(
  cookies: Record<string, string> | undefined
): string | null {
  return cookies?.[COOKIE_NAMES.REFRESH_TOKEN] ?? null;
}

/**
 * Get session ID from request cookies
 *
 * @param cookies - Express request cookies object
 * @returns The session ID or null if not present
 */
export function getSessionIdFromCookie(
  cookies: Record<string, string> | undefined
): string | null {
  return cookies?.[COOKIE_NAMES.SESSION_ID] ?? null;
}
