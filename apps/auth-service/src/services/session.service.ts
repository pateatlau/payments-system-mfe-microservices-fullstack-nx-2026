/**
 * Session Service
 *
 * Integration layer for session management in the auth service.
 * Wraps the @payments-system/security SessionManager with auth-specific logic.
 *
 * Features:
 * - Device fingerprinting
 * - Concurrent session limits
 * - Session activity tracking
 * - Force logout capabilities
 */

import * as crypto from 'crypto';
import Redis from 'ioredis';
import {
  SessionManager,
  createSessionManager,
  type Session,
  type SessionValidationResult,
  type SessionListResponse,
  type ForceLogoutResult,
  type SessionRequestContext,
  type CreateSessionResult,
} from '@payments-system/security';

/**
 * Singleton session manager instance
 */
let sessionManager: SessionManager | null = null;

/**
 * Redis client for session storage
 */
let redisClient: Redis | null = null;

/**
 * Initialize the session manager
 *
 * Should be called during service startup
 */
export async function initializeSessionManager(): Promise<void> {
  if (sessionManager) {
    console.log('[Session Service] Session manager already initialized');
    return;
  }

  try {
    // Connect to Redis
    const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
    redisClient = new Redis(redisUrl, {
      lazyConnect: true,
      maxRetriesPerRequest: 3,
      enableOfflineQueue: true,
    });

    await redisClient.connect();
    console.log('[Session Service] Connected to Redis');

    // Create session manager with configuration
    sessionManager = createSessionManager(redisClient, {
      maxConcurrentSessions: parseInt(
        process.env.SESSION_MAX_CONCURRENT || '5',
        10
      ),
      sessionTimeoutSeconds: parseInt(
        process.env.SESSION_TIMEOUT_SECONDS || '1800',
        10
      ),
      absoluteSessionLifetimeSeconds: parseInt(
        process.env.SESSION_LIFETIME_SECONDS || '604800', // 7 days
        10
      ),
      enableFingerprinting: process.env.SESSION_FINGERPRINTING !== 'false',
      enableActivityTracking: process.env.SESSION_ACTIVITY_TRACKING !== 'false',
      validateFingerprintOnRequest:
        process.env.SESSION_VALIDATE_FINGERPRINT !== 'false',
      fingerprintMismatchTolerance: parseFloat(
        process.env.SESSION_FINGERPRINT_TOLERANCE || '0.3'
      ),
      evictionStrategy:
        (process.env.SESSION_EVICTION_STRATEGY as
          | 'oldest'
          | 'least_active'
          | 'none') || 'oldest',
      notifyOnNewSession: process.env.SESSION_NOTIFY_NEW !== 'false',
      notifyOnForceLogout: process.env.SESSION_NOTIFY_LOGOUT !== 'false',
    });

    console.log('[Session Service] Session manager initialized');
  } catch (error) {
    console.error('[Session Service] Failed to initialize session manager:', error);
    // Fall back to null Redis (graceful degradation)
    sessionManager = createSessionManager(null);
    console.log('[Session Service] Running in degraded mode without Redis');
  }
}

/**
 * Get the session manager instance
 *
 * @returns Session manager or throws if not initialized
 */
export function getSessionManager(): SessionManager {
  if (!sessionManager) {
    // Auto-initialize with null Redis if not initialized
    sessionManager = createSessionManager(null);
    console.warn(
      '[Session Service] Session manager was not initialized, running in degraded mode'
    );
  }
  return sessionManager;
}

/**
 * Create a request context from Express request
 *
 * @param req - Express request object
 * @returns Session request context
 */
export function createRequestContext(req: {
  ip?: string;
  headers: {
    'user-agent'?: string;
    'accept-language'?: string;
    'x-forwarded-for'?: string;
    'x-client-fingerprint'?: string;
    'x-screen-resolution'?: string;
    'x-timezone'?: string;
  };
}): SessionRequestContext {
  // Get IP address (handle proxies)
  const forwardedFor = req.headers['x-forwarded-for'];
  const ip =
    (typeof forwardedFor === 'string'
      ? forwardedFor.split(',')[0]?.trim()
      : req.ip) || '0.0.0.0';

  return {
    ip,
    userAgent: req.headers['user-agent'] || '',
    acceptLanguage: req.headers['accept-language'],
    clientFingerprint: req.headers['x-client-fingerprint'] as string | undefined,
    screenResolution: req.headers['x-screen-resolution'] as string | undefined,
    timezone: req.headers['x-timezone'] as string | undefined,
  };
}

/**
 * Hash a refresh token for storage
 *
 * @param token - Refresh token to hash
 * @returns Hashed token
 */
export function hashToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex');
}

/**
 * Create a new session
 *
 * @param userId - User ID
 * @param refreshToken - Refresh token (will be hashed)
 * @param context - Request context
 * @returns Created session result
 */
export async function createSession(
  userId: string,
  refreshToken: string,
  context: SessionRequestContext
): Promise<CreateSessionResult> {
  const manager = getSessionManager();
  const tokenHash = hashToken(refreshToken);
  return manager.createSession(userId, tokenHash, context);
}

/**
 * Validate a session
 *
 * @param sessionId - Session ID to validate
 * @param context - Current request context
 * @returns Validation result
 */
export async function validateSession(
  sessionId: string,
  context: SessionRequestContext
): Promise<SessionValidationResult> {
  const manager = getSessionManager();
  return manager.validateSession(sessionId, context);
}

/**
 * Refresh a session (on token refresh)
 *
 * @param sessionId - Session ID
 * @param newRefreshToken - New refresh token (will be hashed)
 * @param context - Request context
 * @returns Updated session or null
 */
export async function refreshSession(
  sessionId: string,
  newRefreshToken: string,
  context: SessionRequestContext
): Promise<Session | null> {
  const manager = getSessionManager();
  const tokenHash = hashToken(newRefreshToken);
  return manager.refreshSession(sessionId, tokenHash, context);
}

/**
 * Get a session by ID
 *
 * @param sessionId - Session ID
 * @returns Session or null
 */
export async function getSession(sessionId: string): Promise<Session | null> {
  const manager = getSessionManager();
  return manager.getSession(sessionId);
}

/**
 * Get all sessions for a user
 *
 * @param userId - User ID
 * @returns Array of sessions
 */
export async function getUserSessions(userId: string): Promise<Session[]> {
  const manager = getSessionManager();
  return manager.getUserSessions(userId);
}

/**
 * Get formatted session list for user display
 *
 * @param userId - User ID
 * @param currentSessionId - Current session to mark
 * @returns Session list response
 */
export async function getSessionList(
  userId: string,
  currentSessionId?: string
): Promise<SessionListResponse> {
  const manager = getSessionManager();
  return manager.getSessionList(userId, currentSessionId);
}

/**
 * Logout a session (user-initiated)
 *
 * @param sessionId - Session ID to logout
 * @param context - Request context
 * @returns Success boolean
 */
export async function logout(
  sessionId: string,
  context: SessionRequestContext
): Promise<boolean> {
  const manager = getSessionManager();
  return manager.logout(sessionId, context);
}

/**
 * Logout all other sessions (keep current)
 *
 * @param userId - User ID
 * @param currentSessionId - Session to keep
 * @returns Number of sessions logged out
 */
export async function logoutOtherSessions(
  userId: string,
  currentSessionId: string
): Promise<number> {
  const manager = getSessionManager();
  return manager.logoutOtherSessions(userId, currentSessionId);
}

/**
 * Terminate a specific session
 *
 * @param sessionId - Session ID to terminate
 * @param reason - Reason for termination
 * @param initiatedBy - Who initiated (userId or 'system' or 'admin')
 * @returns Success boolean
 */
export async function terminateSession(
  sessionId: string,
  reason: string,
  initiatedBy: string
): Promise<boolean> {
  const manager = getSessionManager();
  return manager.terminateSession(sessionId, { reason, initiatedBy });
}

/**
 * Force logout user sessions
 *
 * @param userId - User ID
 * @param options - Force logout options
 * @returns Force logout result
 */
export async function forceLogoutUser(
  userId: string,
  options: {
    sessionIds?: string[];
    excludeSessionId?: string;
    reason: string;
    initiatedBy: string;
    notify?: boolean;
  }
): Promise<ForceLogoutResult> {
  const manager = getSessionManager();
  return manager.forceLogout({
    userId,
    sessionIds: options.sessionIds,
    excludeSessionId: options.excludeSessionId,
    reason: options.reason,
    initiatedBy: options.initiatedBy,
    notify: options.notify ?? true,
  });
}

/**
 * Check if user has been force logged out
 *
 * @param userId - User ID
 * @returns Whether user was force logged out recently
 */
export async function isUserForceLoggedOut(userId: string): Promise<boolean> {
  const manager = getSessionManager();
  return manager.isForceLoggedOut(userId);
}

/**
 * Get session activity history
 *
 * @param sessionId - Session ID
 * @param limit - Maximum activities to return
 * @returns Activity history
 */
export async function getSessionActivity(
  sessionId: string,
  limit: number = 50
) {
  const manager = getSessionManager();
  return manager.getSessionActivity(sessionId, limit);
}

/**
 * Shutdown the session service
 *
 * Should be called during graceful shutdown
 */
export async function shutdownSessionService(): Promise<void> {
  if (redisClient) {
    await redisClient.quit();
    redisClient = null;
    console.log('[Session Service] Redis connection closed');
  }
  sessionManager = null;
}
