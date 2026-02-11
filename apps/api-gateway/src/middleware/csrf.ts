/**
 * CSRF Protection Middleware
 *
 * Implements the Double Submit Cookie pattern for CSRF protection:
 * 1. Generate a cryptographically secure random token
 * 2. Set token in a cookie (readable by JS, but with SameSite=Strict)
 * 3. Frontend reads cookie and sends token in X-CSRF-Token header
 * 4. Backend validates header token matches cookie token
 *
 * Benefits:
 * - Stateless (no Redis/DB needed)
 * - Works with single-page applications
 * - Compatible with Module Federation architecture
 *
 * Security measures:
 * - SameSite=Strict prevents cross-origin cookie sending
 * - Secure flag in production (HTTPS only)
 * - Token tied to session via cookie
 */

import { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';
import { ApiError } from './errorHandler';

// Constants
const CSRF_COOKIE_NAME = 'XSRF-TOKEN';
const CSRF_HEADER_NAME = 'x-csrf-token';
const TOKEN_LENGTH = 32; // 256 bits of entropy

// Safe HTTP methods that don't require CSRF validation
const SAFE_METHODS = ['GET', 'HEAD', 'OPTIONS'];

/**
 * Configuration options for CSRF middleware
 */
export interface CsrfOptions {
  /** Cookie name for CSRF token */
  cookieName?: string;
  /** Header name for CSRF token */
  headerName?: string;
  /** Paths to skip CSRF validation */
  skipPaths?: string[];
  /** Whether to use secure cookies (auto-detected from NODE_ENV if not set) */
  secure?: boolean;
  /** SameSite attribute for cookie */
  sameSite?: 'strict' | 'lax' | 'none';
}

/**
 * Generate a cryptographically secure CSRF token
 */
export function generateCsrfToken(): string {
  return crypto.randomBytes(TOKEN_LENGTH).toString('hex');
}

/**
 * Create CSRF protection middleware
 *
 * @param options - Configuration options
 * @returns Express middleware function
 */
export function createCsrfMiddleware(options: CsrfOptions = {}) {
  const {
    cookieName = CSRF_COOKIE_NAME,
    headerName = CSRF_HEADER_NAME,
    skipPaths = [],
    // Note: secure and sameSite are only used by setCsrfTokenCookie
  } = options;

  return (req: Request, _res: Response, next: NextFunction): void => {
    // Skip CSRF for safe methods (GET, HEAD, OPTIONS)
    if (SAFE_METHODS.includes(req.method)) {
      return next();
    }

    // Skip specific paths (e.g., health checks, CSP reports)
    if (skipPaths.some(path => req.path.startsWith(path))) {
      return next();
    }

    // Get token from cookie
    const cookieToken = req.cookies?.[cookieName];

    // Get token from header
    const headerToken = req.get(headerName);

    // Validate both tokens exist
    if (!cookieToken) {
      return next(
        new ApiError(403, 'CSRF_TOKEN_MISSING', 'CSRF token cookie not found')
      );
    }

    if (!headerToken) {
      return next(
        new ApiError(403, 'CSRF_TOKEN_MISSING', 'CSRF token header not found')
      );
    }

    // Validate tokens match (timing-safe comparison)
    if (!timingSafeEqual(cookieToken, headerToken)) {
      return next(
        new ApiError(403, 'CSRF_TOKEN_INVALID', 'CSRF token validation failed')
      );
    }

    next();
  };
}

/**
 * Middleware to set CSRF token cookie on response
 *
 * This should be applied to routes that need CSRF protection.
 * The token is:
 * - Set in a cookie (readable by JS to send in header)
 * - Optionally returned in response body for initial fetch
 */
export function setCsrfTokenCookie(options: CsrfOptions = {}) {
  const {
    cookieName = CSRF_COOKIE_NAME,
    secure = process.env.NODE_ENV === 'production',
    sameSite = 'strict',
  } = options;

  return (req: Request, res: Response, next: NextFunction): void => {
    // Check if token already exists in cookie
    let token = req.cookies?.[cookieName];

    // Generate new token if not present
    if (!token) {
      token = generateCsrfToken();
    }

    // Set cookie with appropriate security settings
    res.cookie(cookieName, token, {
      httpOnly: false, // MUST be false so JS can read it
      secure,
      sameSite,
      path: '/',
      // No maxAge = session cookie (expires when browser closes)
      // For persistent sessions, set maxAge to match session duration
    });

    // Attach token to request for use in response
    (req as Request & { csrfToken: string }).csrfToken = token;

    next();
  };
}

/**
 * Timing-safe string comparison to prevent timing attacks
 *
 * @param a - First string
 * @param b - Second string
 * @returns True if strings are equal
 */
function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) {
    return false;
  }

  try {
    return crypto.timingSafeEqual(Buffer.from(a), Buffer.from(b));
  } catch {
    return false;
  }
}

/**
 * Default CSRF middleware with standard configuration
 *
 * Skips:
 * - Health check endpoints
 * - CSP violation reports
 * - Metrics endpoint
 */
export const csrfProtection = createCsrfMiddleware({
  skipPaths: ['/health', '/api/csp-violations', '/metrics'],
});

/**
 * Default CSRF token setter
 */
export const csrfTokenSetter = setCsrfTokenCookie();
