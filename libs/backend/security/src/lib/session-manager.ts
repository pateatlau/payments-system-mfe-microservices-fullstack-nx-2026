/**
 * Session Manager Service
 *
 * Manages user sessions with:
 * - Concurrent session limits
 * - Session activity tracking
 * - Force logout capabilities
 * - Device fingerprint validation
 * - Session eviction policies
 *
 * Uses Redis for session storage with TTL-based expiration.
 */

import * as crypto from 'crypto';
import type Redis from 'ioredis';
import type {
  Session,
  SessionConfig,
  SessionActivity,
  SessionActivityType,
  SessionValidationResult,
  ForceLogoutOptions,
  ForceLogoutResult,
  SessionListResponse,
  SessionInfo,
  SessionRequestContext,
  CreateSessionResult,
  DeviceFingerprint,
} from './session-types';
import { DEFAULT_SESSION_CONFIG } from './session-types';
import {
  DeviceFingerprintService,
  getDeviceFingerprintService,
} from './device-fingerprint';
import { GeoIPService } from './geoip';

/**
 * Redis key patterns for session data
 */
const REDIS_KEYS = {
  /** Session data: session:{sessionId} */
  session: (prefix: string, sessionId: string) => `${prefix}${sessionId}`,
  /** User's session list: session:user:{userId}:sessions */
  userSessions: (prefix: string, userId: string) =>
    `${prefix}user:${userId}:sessions`,
  /** Session activity: session:activity:{sessionId} */
  activity: (prefix: string, sessionId: string) =>
    `${prefix}activity:${sessionId}`,
  /** Last activity timestamp: session:last_activity:{sessionId} */
  lastActivity: (prefix: string, sessionId: string) =>
    `${prefix}last_activity:${sessionId}`,
  /** User's forced logout flag: session:force_logout:{userId} */
  forceLogout: (prefix: string, userId: string) =>
    `${prefix}force_logout:${userId}`,
};

/**
 * Session Manager Service
 *
 * Central service for all session management operations.
 */
export class SessionManager {
  private redis: Redis | null;
  private config: SessionConfig;
  private fingerprintService: DeviceFingerprintService;
  private geoIPService: GeoIPService;

  constructor(redis: Redis | null, config?: Partial<SessionConfig>) {
    this.redis = redis;
    this.config = { ...DEFAULT_SESSION_CONFIG, ...config };
    this.fingerprintService = getDeviceFingerprintService();
    this.geoIPService = new GeoIPService();

    console.log('[SessionManager] Initialized with config:', {
      maxConcurrentSessions: this.config.maxConcurrentSessions,
      sessionTimeoutSeconds: this.config.sessionTimeoutSeconds,
      enableFingerprinting: this.config.enableFingerprinting,
      enableActivityTracking: this.config.enableActivityTracking,
      evictionStrategy: this.config.evictionStrategy,
    });
  }

  /**
   * Create a new session for a user
   *
   * @param userId - User ID
   * @param refreshTokenHash - Hashed refresh token
   * @param context - Request context for fingerprinting
   * @returns Created session and any evicted session
   */
  async createSession(
    userId: string,
    refreshTokenHash: string,
    context: SessionRequestContext
  ): Promise<CreateSessionResult> {
    const sessionId = crypto.randomUUID();
    const fingerprint = this.config.enableFingerprinting
      ? this.fingerprintService.createFingerprint(context)
      : this.createEmptyFingerprint(context);

    const location = this.geoIPService.lookup(context.ip);

    const now = new Date();
    const session: Session = {
      sessionId,
      userId,
      fingerprint,
      createdAt: now,
      lastActivityAt: now,
      refreshTokenHash,
      createdFromIp: context.ip,
      lastIp: context.ip,
      createdLocation: {
        country: location?.country ?? null,
        city: location?.city ?? null,
      },
      lastLocation: {
        country: location?.country ?? null,
        city: location?.city ?? null,
      },
      isActive: true,
      forcedLogout: false,
      forcedLogoutReason: null,
      forcedLogoutBy: null,
    };

    // Check session limit and evict if necessary
    let evictedSession: Session | null = null;
    let warning: string | null = null;

    if (this.redis && this.config.maxConcurrentSessions > 0) {
      const currentSessions = await this.getUserSessions(userId);
      const activeSessions = currentSessions.filter((s) => s.isActive);

      if (activeSessions.length >= this.config.maxConcurrentSessions) {
        // Need to evict a session
        if (this.config.evictionStrategy === 'none') {
          throw new Error(
            `Maximum concurrent sessions (${this.config.maxConcurrentSessions}) reached`
          );
        }

        const sessionToEvict = this.selectSessionToEvict(activeSessions);
        if (sessionToEvict) {
          await this.terminateSession(sessionToEvict.sessionId, {
            reason: 'Session limit exceeded - new session created',
            initiatedBy: 'system',
          });
          evictedSession = sessionToEvict;
        }
      } else if (
        activeSessions.length === this.config.maxConcurrentSessions - 1
      ) {
        warning = `You have ${activeSessions.length + 1} active sessions. Maximum allowed: ${this.config.maxConcurrentSessions}`;
      }
    }

    // Store session in Redis
    await this.storeSession(session);

    // Track session creation activity
    if (this.config.enableActivityTracking) {
      await this.trackActivity(session, 'SESSION_CREATED', context.ip, null, null, {
        fingerprint: fingerprint.fingerprintHash,
        location: session.createdLocation,
      });
    }

    console.log(`[SessionManager] Session created: ${sessionId} for user: ${userId}`);

    return { session, evictedSession, warning };
  }

  /**
   * Validate a session
   *
   * @param sessionId - Session ID to validate
   * @param context - Current request context
   * @returns Validation result
   */
  async validateSession(
    sessionId: string,
    context: SessionRequestContext
  ): Promise<SessionValidationResult> {
    const warnings: string[] = [];

    // Get session from Redis
    const session = await this.getSession(sessionId);

    if (!session) {
      return {
        isValid: false,
        session: null,
        reason: 'SESSION_NOT_FOUND',
        fingerprintMatch: null,
        fingerprintSimilarity: null,
        warnings,
      };
    }

    // Check if session was force logged out (check before isActive)
    if (session.forcedLogout) {
      return {
        isValid: false,
        session,
        reason: 'SESSION_FORCE_LOGOUT',
        fingerprintMatch: null,
        fingerprintSimilarity: null,
        warnings,
      };
    }

    // Check if session is active
    if (!session.isActive) {
      return {
        isValid: false,
        session,
        reason: 'SESSION_INACTIVE',
        fingerprintMatch: null,
        fingerprintSimilarity: null,
        warnings,
      };
    }

    // Check session timeout (inactivity)
    const inactiveTime =
      Date.now() - new Date(session.lastActivityAt).getTime();
    if (inactiveTime > this.config.sessionTimeoutSeconds * 1000) {
      await this.terminateSession(sessionId, {
        reason: 'Session timeout due to inactivity',
        initiatedBy: 'system',
      });
      return {
        isValid: false,
        session,
        reason: 'SESSION_EXPIRED',
        fingerprintMatch: null,
        fingerprintSimilarity: null,
        warnings,
      };
    }

    // Check absolute session lifetime
    const sessionAge = Date.now() - new Date(session.createdAt).getTime();
    if (sessionAge > this.config.absoluteSessionLifetimeSeconds * 1000) {
      await this.terminateSession(sessionId, {
        reason: 'Session exceeded maximum lifetime',
        initiatedBy: 'system',
      });
      return {
        isValid: false,
        session,
        reason: 'SESSION_EXPIRED',
        fingerprintMatch: null,
        fingerprintSimilarity: null,
        warnings,
      };
    }

    // Validate fingerprint if enabled
    let fingerprintMatch: boolean | null = null;
    let fingerprintSimilarity: number | null = null;

    if (this.config.enableFingerprinting && this.config.validateFingerprintOnRequest) {
      const currentFingerprint = this.fingerprintService.createFingerprint(context);
      fingerprintSimilarity = this.fingerprintService.compareFingerprints(
        session.fingerprint,
        currentFingerprint
      );
      fingerprintMatch = fingerprintSimilarity >= (1 - this.config.fingerprintMismatchTolerance);

      if (!fingerprintMatch) {
        // Log fingerprint mismatch for security monitoring
        if (this.config.enableActivityTracking) {
          await this.trackActivity(
            session,
            'FINGERPRINT_MISMATCH',
            context.ip,
            null,
            null,
            {
              expectedFingerprint: session.fingerprint.fingerprintHash,
              actualFingerprint: currentFingerprint.fingerprintHash,
              similarity: fingerprintSimilarity,
            }
          );
        }

        // Terminate session due to fingerprint mismatch
        await this.terminateSession(sessionId, {
          reason: 'Fingerprint mismatch detected',
          initiatedBy: 'system',
        });

        return {
          isValid: false,
          session,
          reason: 'FINGERPRINT_MISMATCH',
          fingerprintMatch,
          fingerprintSimilarity,
          warnings,
        };
      }
    }

    // Check for location change
    const currentLocation = this.geoIPService.lookup(context.ip);
    if (
      currentLocation?.country &&
      session.lastLocation.country &&
      currentLocation.country !== session.lastLocation.country
    ) {
      warnings.push(
        `Location changed from ${session.lastLocation.country} to ${currentLocation.country}`
      );

      if (this.config.enableActivityTracking) {
        await this.trackActivity(session, 'LOCATION_CHANGE', context.ip, null, null, {
          previousLocation: session.lastLocation,
          newLocation: {
            country: currentLocation.country,
            city: currentLocation.city ?? null,
          },
        });
      }
    }

    // Update last activity
    await this.updateLastActivity(session, context);

    return {
      isValid: true,
      session,
      reason: null,
      fingerprintMatch,
      fingerprintSimilarity,
      warnings,
    };
  }

  /**
   * Refresh a session (on token refresh)
   *
   * @param sessionId - Session ID
   * @param newRefreshTokenHash - New hashed refresh token
   * @param context - Request context
   * @returns Updated session
   */
  async refreshSession(
    sessionId: string,
    newRefreshTokenHash: string,
    context: SessionRequestContext
  ): Promise<Session | null> {
    const session = await this.getSession(sessionId);

    if (!session || !session.isActive) {
      return null;
    }

    const location = this.geoIPService.lookup(context.ip);

    // Update session
    session.refreshTokenHash = newRefreshTokenHash;
    session.lastActivityAt = new Date();
    session.lastIp = context.ip;
    session.lastLocation = {
      country: location?.country ?? null,
      city: location?.city ?? null,
    };

    // Update fingerprint if significantly different but still acceptable
    if (this.config.enableFingerprinting) {
      const currentFingerprint = this.fingerprintService.createFingerprint(context);
      const similarity = this.fingerprintService.compareFingerprints(
        session.fingerprint,
        currentFingerprint
      );

      // If fingerprint is slightly different but within tolerance, update it
      if (similarity < 1 && similarity >= (1 - this.config.fingerprintMismatchTolerance)) {
        session.fingerprint = currentFingerprint;
      }
    }

    await this.storeSession(session);

    if (this.config.enableActivityTracking) {
      await this.trackActivity(session, 'SESSION_REFRESHED', context.ip, null, null, {
        newRefreshTokenHash: newRefreshTokenHash.substring(0, 8) + '...',
      });
    }

    return session;
  }

  /**
   * Get a session by ID
   *
   * @param sessionId - Session ID
   * @returns Session or null
   */
  async getSession(sessionId: string): Promise<Session | null> {
    if (!this.redis) {
      return null;
    }

    try {
      const key = REDIS_KEYS.session(this.config.redisKeyPrefix, sessionId);
      const data = await this.redis.get(key);

      if (!data) {
        return null;
      }

      const session = JSON.parse(data) as Session;

      // Convert date strings back to Date objects
      session.createdAt = new Date(session.createdAt);
      session.lastActivityAt = new Date(session.lastActivityAt);

      return session;
    } catch (error) {
      console.error(`[SessionManager] Error getting session ${sessionId}:`, error);
      return null;
    }
  }

  /**
   * Get all sessions for a user
   *
   * @param userId - User ID
   * @returns Array of sessions
   */
  async getUserSessions(userId: string): Promise<Session[]> {
    if (!this.redis) {
      return [];
    }

    try {
      const userSessionsKey = REDIS_KEYS.userSessions(
        this.config.redisKeyPrefix,
        userId
      );
      const sessionIds = await this.redis.smembers(userSessionsKey);

      if (sessionIds.length === 0) {
        return [];
      }

      const sessions: Session[] = [];

      for (const sessionId of sessionIds) {
        const session = await this.getSession(sessionId);
        if (session) {
          sessions.push(session);
        } else {
          // Clean up orphaned session ID
          await this.redis.srem(userSessionsKey, sessionId);
        }
      }

      // Sort by last activity (most recent first)
      sessions.sort(
        (a, b) =>
          new Date(b.lastActivityAt).getTime() -
          new Date(a.lastActivityAt).getTime()
      );

      return sessions;
    } catch (error) {
      console.error(`[SessionManager] Error getting user sessions:`, error);
      return [];
    }
  }

  /**
   * Get session list formatted for user display
   *
   * @param userId - User ID
   * @param currentSessionId - Current session to mark
   * @returns Session list response
   */
  async getSessionList(
    userId: string,
    currentSessionId?: string
  ): Promise<SessionListResponse> {
    const sessions = await this.getUserSessions(userId);
    const activeSessions = sessions.filter((s) => s.isActive);

    const sessionInfos: SessionInfo[] = activeSessions.map((session) => ({
      sessionId: session.sessionId,
      deviceType: session.fingerprint.deviceType,
      browser: `${session.fingerprint.browser.name} ${session.fingerprint.browser.version}`,
      os: `${session.fingerprint.os.name} ${session.fingerprint.os.version}`,
      lastIp: session.lastIp,
      lastLocation: session.lastLocation.city && session.lastLocation.country
        ? `${session.lastLocation.city}, ${session.lastLocation.country}`
        : session.lastLocation.country || 'Unknown',
      createdAt: session.createdAt,
      lastActivityAt: session.lastActivityAt,
      isCurrent: session.sessionId === currentSessionId,
    }));

    return {
      sessions: sessionInfos,
      totalCount: activeSessions.length,
      maxSessions: this.config.maxConcurrentSessions,
    };
  }

  /**
   * Terminate a single session
   *
   * @param sessionId - Session ID to terminate
   * @param options - Termination options
   */
  async terminateSession(
    sessionId: string,
    options: { reason: string; initiatedBy: string }
  ): Promise<boolean> {
    const session = await this.getSession(sessionId);

    if (!session) {
      return false;
    }

    // Mark session as terminated
    session.isActive = false;
    session.forcedLogout = true;
    session.forcedLogoutReason = options.reason;
    session.forcedLogoutBy = options.initiatedBy;

    await this.storeSession(session);

    if (this.config.enableActivityTracking) {
      await this.trackActivity(session, 'SESSION_FORCE_LOGOUT', session.lastIp, null, null, {
        reason: options.reason,
        initiatedBy: options.initiatedBy,
      });
    }

    console.log(
      `[SessionManager] Session terminated: ${sessionId}, reason: ${options.reason}`
    );

    return true;
  }

  /**
   * Force logout user sessions
   *
   * @param options - Force logout options
   * @returns Force logout result
   */
  async forceLogout(options: ForceLogoutOptions): Promise<ForceLogoutResult> {
    const terminatedSessionIds: string[] = [];
    const sessions = await this.getUserSessions(options.userId);

    for (const session of sessions) {
      // Skip excluded session
      if (options.excludeSessionId && session.sessionId === options.excludeSessionId) {
        continue;
      }

      // Skip if specific sessions requested and not in list
      if (options.sessionIds && !options.sessionIds.includes(session.sessionId)) {
        continue;
      }

      // Skip already inactive sessions
      if (!session.isActive) {
        continue;
      }

      await this.terminateSession(session.sessionId, {
        reason: options.reason,
        initiatedBy: options.initiatedBy,
      });

      terminatedSessionIds.push(session.sessionId);
    }

    // Set force logout flag for user (for immediate token rejection)
    if (this.redis && terminatedSessionIds.length > 0) {
      const forceLogoutKey = REDIS_KEYS.forceLogout(
        this.config.redisKeyPrefix,
        options.userId
      );
      await this.redis.set(forceLogoutKey, Date.now().toString(), 'EX', 300); // 5 min flag
    }

    console.log(
      `[SessionManager] Force logout for user ${options.userId}: ${terminatedSessionIds.length} sessions terminated`
    );

    return {
      terminatedCount: terminatedSessionIds.length,
      terminatedSessionIds,
      notified: options.notify && this.config.notifyOnForceLogout,
    };
  }

  /**
   * Logout current session (user-initiated)
   *
   * @param sessionId - Session ID
   * @param context - Request context
   */
  async logout(sessionId: string, context: SessionRequestContext): Promise<boolean> {
    const session = await this.getSession(sessionId);

    if (!session) {
      return false;
    }

    session.isActive = false;

    await this.storeSession(session);

    if (this.config.enableActivityTracking) {
      await this.trackActivity(session, 'SESSION_LOGOUT', context.ip, null, null, {
        userInitiated: true,
      });
    }

    console.log(`[SessionManager] User logout: session ${sessionId}`);

    return true;
  }

  /**
   * Logout all sessions for a user except current
   *
   * @param userId - User ID
   * @param currentSessionId - Session to keep
   * @returns Number of sessions logged out
   */
  async logoutOtherSessions(
    userId: string,
    currentSessionId: string
  ): Promise<number> {
    const result = await this.forceLogout({
      userId,
      excludeSessionId: currentSessionId,
      reason: 'User requested logout of other sessions',
      initiatedBy: 'user',
      notify: false,
    });

    return result.terminatedCount;
  }

  /**
   * Track session activity
   *
   * @param session - Session
   * @param activityType - Type of activity
   * @param ip - Current IP
   * @param endpoint - API endpoint (optional)
   * @param method - HTTP method (optional)
   * @param metadata - Additional metadata
   */
  async trackActivity(
    session: Session,
    activityType: SessionActivityType,
    ip: string,
    endpoint: string | null,
    method: string | null,
    metadata: Record<string, unknown> = {}
  ): Promise<void> {
    if (!this.redis || !this.config.enableActivityTracking) {
      return;
    }

    // Check minimum interval between activity logs
    const lastActivityKey = REDIS_KEYS.lastActivity(
      this.config.redisKeyPrefix,
      session.sessionId
    );

    if (activityType === 'SESSION_ACTIVITY') {
      const lastActivity = await this.redis.get(lastActivityKey);
      if (lastActivity) {
        const timeSinceLastActivity = Date.now() - parseInt(lastActivity, 10);
        if (timeSinceLastActivity < this.config.activityTrackingIntervalSeconds * 1000) {
          return; // Skip - too soon since last activity
        }
      }
    }

    const activity: SessionActivity = {
      sessionId: session.sessionId,
      userId: session.userId,
      activityType,
      timestamp: new Date(),
      ip,
      endpoint,
      method,
      metadata,
    };

    // Store activity in a list (keep last 100 activities per session)
    const activityKey = REDIS_KEYS.activity(
      this.config.redisKeyPrefix,
      session.sessionId
    );

    try {
      await this.redis.lpush(activityKey, JSON.stringify(activity));
      await this.redis.ltrim(activityKey, 0, 99); // Keep last 100
      await this.redis.expire(activityKey, this.config.absoluteSessionLifetimeSeconds);

      // Update last activity timestamp
      await this.redis.set(
        lastActivityKey,
        Date.now().toString(),
        'EX',
        this.config.absoluteSessionLifetimeSeconds
      );
    } catch (error) {
      console.error('[SessionManager] Error tracking activity:', error);
    }
  }

  /**
   * Get session activity history
   *
   * @param sessionId - Session ID
   * @param limit - Maximum number of activities to return
   * @returns Activity history
   */
  async getSessionActivity(
    sessionId: string,
    limit: number = 50
  ): Promise<SessionActivity[]> {
    if (!this.redis) {
      return [];
    }

    try {
      const activityKey = REDIS_KEYS.activity(
        this.config.redisKeyPrefix,
        sessionId
      );
      const activities = await this.redis.lrange(activityKey, 0, limit - 1);

      return activities.map((data) => {
        const activity = JSON.parse(data) as SessionActivity;
        activity.timestamp = new Date(activity.timestamp);
        return activity;
      });
    } catch (error) {
      console.error('[SessionManager] Error getting session activity:', error);
      return [];
    }
  }

  /**
   * Check if user has been force logged out
   *
   * @param userId - User ID
   * @returns Whether user was force logged out recently
   */
  async isForceLoggedOut(userId: string): Promise<boolean> {
    if (!this.redis) {
      return false;
    }

    const forceLogoutKey = REDIS_KEYS.forceLogout(
      this.config.redisKeyPrefix,
      userId
    );
    const value = await this.redis.get(forceLogoutKey);
    return value !== null;
  }

  /**
   * Clean up expired sessions
   *
   * Should be called periodically (e.g., by a cron job)
   */
  async cleanupExpiredSessions(): Promise<number> {
    // This would typically scan all sessions and remove expired ones
    // For now, Redis TTL handles this automatically
    console.log('[SessionManager] Session cleanup triggered');
    return 0;
  }

  // Private helper methods

  /**
   * Store a session in Redis
   */
  private async storeSession(session: Session): Promise<void> {
    if (!this.redis) {
      return;
    }

    const sessionKey = REDIS_KEYS.session(
      this.config.redisKeyPrefix,
      session.sessionId
    );
    const userSessionsKey = REDIS_KEYS.userSessions(
      this.config.redisKeyPrefix,
      session.userId
    );

    const ttl = session.isActive
      ? this.config.absoluteSessionLifetimeSeconds
      : 86400; // Keep inactive sessions for 24h for audit

    await this.redis.set(sessionKey, JSON.stringify(session), 'EX', ttl);
    await this.redis.sadd(userSessionsKey, session.sessionId);
    await this.redis.expire(userSessionsKey, this.config.absoluteSessionLifetimeSeconds);
  }

  /**
   * Update session last activity
   */
  private async updateLastActivity(
    session: Session,
    context: SessionRequestContext
  ): Promise<void> {
    const location = this.geoIPService.lookup(context.ip);

    session.lastActivityAt = new Date();
    session.lastIp = context.ip;
    session.lastLocation = {
      country: location?.country ?? null,
      city: location?.city ?? null,
    };

    await this.storeSession(session);

    if (this.config.enableActivityTracking) {
      await this.trackActivity(session, 'SESSION_ACTIVITY', context.ip, null, null, {});
    }
  }

  /**
   * Select which session to evict based on strategy
   */
  private selectSessionToEvict(sessions: Session[]): Session | null {
    if (sessions.length === 0) {
      return null;
    }

    switch (this.config.evictionStrategy) {
      case 'oldest':
        // Evict the oldest session by creation time
        return sessions.reduce((oldest, current) =>
          new Date(current.createdAt).getTime() <
          new Date(oldest.createdAt).getTime()
            ? current
            : oldest
        );

      case 'least_active':
        // Evict the session with oldest last activity
        return sessions.reduce((leastActive, current) =>
          new Date(current.lastActivityAt).getTime() <
          new Date(leastActive.lastActivityAt).getTime()
            ? current
            : leastActive
        );

      case 'none':
      default:
        return null;
    }
  }

  /**
   * Create an empty fingerprint when fingerprinting is disabled
   */
  private createEmptyFingerprint(context: SessionRequestContext): DeviceFingerprint {
    return {
      fingerprintHash: crypto.randomUUID(),
      userAgent: context.userAgent,
      browser: { name: 'unknown', version: 'unknown' },
      os: { name: 'unknown', version: 'unknown' },
      deviceType: 'unknown',
      ip: context.ip,
      acceptLanguage: context.acceptLanguage || null,
      screenResolution: null,
      timezone: null,
      clientFingerprint: null,
    };
  }
}

/**
 * Factory function to create a session manager with environment configuration
 */
export function createSessionManager(
  redis: Redis | null,
  config?: Partial<SessionConfig>
): SessionManager {
  const envConfig: Partial<SessionConfig> = {
    maxConcurrentSessions: process.env.SESSION_MAX_CONCURRENT
      ? parseInt(process.env.SESSION_MAX_CONCURRENT, 10)
      : undefined,
    sessionTimeoutSeconds: process.env.SESSION_TIMEOUT_SECONDS
      ? parseInt(process.env.SESSION_TIMEOUT_SECONDS, 10)
      : undefined,
    absoluteSessionLifetimeSeconds: process.env.SESSION_LIFETIME_SECONDS
      ? parseInt(process.env.SESSION_LIFETIME_SECONDS, 10)
      : undefined,
    enableFingerprinting: process.env.SESSION_FINGERPRINTING !== 'false',
    enableActivityTracking: process.env.SESSION_ACTIVITY_TRACKING !== 'false',
    evictionStrategy: (process.env.SESSION_EVICTION_STRATEGY as 'oldest' | 'least_active' | 'none') || undefined,
  };

  return new SessionManager(redis, { ...envConfig, ...config });
}
