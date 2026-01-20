/**
 * Session Management Types
 *
 * Type definitions for session management, device fingerprinting,
 * and concurrent session handling.
 */

/**
 * Device fingerprint components extracted from request
 */
export interface DeviceFingerprint {
  /** Hash of the full fingerprint for comparison */
  fingerprintHash: string;
  /** User agent string */
  userAgent: string;
  /** Parsed browser name and version */
  browser: {
    name: string;
    version: string;
  };
  /** Parsed operating system */
  os: {
    name: string;
    version: string;
  };
  /** Device type classification */
  deviceType: 'desktop' | 'mobile' | 'tablet' | 'bot' | 'unknown';
  /** IP address */
  ip: string;
  /** Accept-Language header */
  acceptLanguage: string | null;
  /** Screen resolution (if provided by client) */
  screenResolution: string | null;
  /** Timezone (if provided by client) */
  timezone: string | null;
  /** Client-provided fingerprint hash (optional, for enhanced accuracy) */
  clientFingerprint: string | null;
}

/**
 * Session information stored in Redis
 */
export interface Session {
  /** Unique session ID (UUID) */
  sessionId: string;
  /** User ID this session belongs to */
  userId: string;
  /** Device fingerprint for this session */
  fingerprint: DeviceFingerprint;
  /** When the session was created */
  createdAt: Date;
  /** Last activity timestamp */
  lastActivityAt: Date;
  /** Associated refresh token (hashed) */
  refreshTokenHash: string;
  /** IP address at session creation */
  createdFromIp: string;
  /** Last known IP address */
  lastIp: string;
  /** GeoIP location at creation */
  createdLocation: {
    country: string | null;
    city: string | null;
  };
  /** Last known GeoIP location */
  lastLocation: {
    country: string | null;
    city: string | null;
  };
  /** Whether the session is currently active */
  isActive: boolean;
  /** Whether this session was forced logout */
  forcedLogout: boolean;
  /** Reason for forced logout (if applicable) */
  forcedLogoutReason: string | null;
  /** Who initiated the forced logout (if applicable) */
  forcedLogoutBy: string | null;
}

/**
 * Session activity event for tracking
 */
export interface SessionActivity {
  /** Session ID */
  sessionId: string;
  /** User ID */
  userId: string;
  /** Type of activity */
  activityType: SessionActivityType;
  /** Timestamp of the activity */
  timestamp: Date;
  /** IP address at time of activity */
  ip: string;
  /** Endpoint accessed (for API calls) */
  endpoint: string | null;
  /** HTTP method */
  method: string | null;
  /** Additional metadata */
  metadata: Record<string, unknown>;
}

/**
 * Types of session activities that can be tracked
 */
export type SessionActivityType =
  | 'SESSION_CREATED'
  | 'SESSION_REFRESHED'
  | 'SESSION_ACTIVITY'
  | 'SESSION_LOGOUT'
  | 'SESSION_FORCE_LOGOUT'
  | 'SESSION_EXPIRED'
  | 'SESSION_LIMIT_EXCEEDED'
  | 'SUSPICIOUS_ACTIVITY'
  | 'FINGERPRINT_MISMATCH'
  | 'LOCATION_CHANGE';

/**
 * Configuration for session management
 */
export interface SessionConfig {
  /** Maximum concurrent sessions per user (0 = unlimited) */
  maxConcurrentSessions: number;
  /** Session timeout in seconds (inactivity) */
  sessionTimeoutSeconds: number;
  /** Absolute session lifetime in seconds */
  absoluteSessionLifetimeSeconds: number;
  /** Whether to enable device fingerprinting */
  enableFingerprinting: boolean;
  /** Whether to track session activity */
  enableActivityTracking: boolean;
  /** Minimum activity tracking interval (prevent excessive writes) */
  activityTrackingIntervalSeconds: number;
  /** Whether to validate fingerprints on each request */
  validateFingerprintOnRequest: boolean;
  /** Fingerprint mismatch tolerance (0-1, how different is acceptable) */
  fingerprintMismatchTolerance: number;
  /** Whether to notify user on new session */
  notifyOnNewSession: boolean;
  /** Whether to notify user on force logout */
  notifyOnForceLogout: boolean;
  /** Session eviction strategy when limit reached */
  evictionStrategy: 'oldest' | 'least_active' | 'none';
  /** Redis key prefix for sessions */
  redisKeyPrefix: string;
}

/**
 * Default session configuration
 */
export const DEFAULT_SESSION_CONFIG: SessionConfig = {
  maxConcurrentSessions: 5,
  sessionTimeoutSeconds: 30 * 60, // 30 minutes
  absoluteSessionLifetimeSeconds: 7 * 24 * 60 * 60, // 7 days
  enableFingerprinting: true,
  enableActivityTracking: true,
  activityTrackingIntervalSeconds: 60, // 1 minute minimum between activity logs
  validateFingerprintOnRequest: true,
  fingerprintMismatchTolerance: 0.3, // 30% difference allowed
  notifyOnNewSession: true,
  notifyOnForceLogout: true,
  evictionStrategy: 'oldest',
  redisKeyPrefix: 'session:',
};

/**
 * Result of session validation
 */
export interface SessionValidationResult {
  /** Whether the session is valid */
  isValid: boolean;
  /** The session if valid */
  session: Session | null;
  /** Reason for invalidity */
  reason: SessionInvalidReason | null;
  /** Whether fingerprint matches (if fingerprinting enabled) */
  fingerprintMatch: boolean | null;
  /** Fingerprint similarity score (0-1) */
  fingerprintSimilarity: number | null;
  /** Warnings (non-blocking issues) */
  warnings: string[];
}

/**
 * Reasons a session may be invalid
 */
export type SessionInvalidReason =
  | 'SESSION_NOT_FOUND'
  | 'SESSION_EXPIRED'
  | 'SESSION_INACTIVE'
  | 'SESSION_FORCE_LOGOUT'
  | 'FINGERPRINT_MISMATCH'
  | 'USER_TOKENS_REVOKED'
  | 'SESSION_LIMIT_EXCEEDED';

/**
 * Force logout options
 */
export interface ForceLogoutOptions {
  /** User ID whose sessions to terminate */
  userId: string;
  /** Specific session IDs to terminate (if not provided, all sessions) */
  sessionIds?: string[];
  /** Exclude this session from termination (keep current) */
  excludeSessionId?: string;
  /** Reason for the force logout */
  reason: string;
  /** Who initiated the logout (admin user ID, 'system', or 'user') */
  initiatedBy: string;
  /** Whether to notify the user */
  notify: boolean;
}

/**
 * Result of force logout operation
 */
export interface ForceLogoutResult {
  /** Number of sessions terminated */
  terminatedCount: number;
  /** Session IDs that were terminated */
  terminatedSessionIds: string[];
  /** Whether the user was notified */
  notified: boolean;
}

/**
 * Session list response for user
 */
export interface SessionListResponse {
  /** List of active sessions */
  sessions: SessionInfo[];
  /** Total count of sessions */
  totalCount: number;
  /** Maximum allowed sessions */
  maxSessions: number;
}

/**
 * Session info exposed to users (sanitized)
 */
export interface SessionInfo {
  /** Session ID */
  sessionId: string;
  /** Device type */
  deviceType: string;
  /** Browser name and version */
  browser: string;
  /** Operating system */
  os: string;
  /** Last IP address */
  lastIp: string;
  /** Last location (city, country) */
  lastLocation: string;
  /** When the session was created */
  createdAt: Date;
  /** Last activity */
  lastActivityAt: Date;
  /** Whether this is the current session */
  isCurrent: boolean;
}

/**
 * Request context for session operations
 */
export interface SessionRequestContext {
  /** IP address from request */
  ip: string;
  /** User agent string */
  userAgent: string;
  /** Accept-Language header */
  acceptLanguage?: string;
  /** Client-provided fingerprint (optional) */
  clientFingerprint?: string;
  /** Screen resolution (from client) */
  screenResolution?: string;
  /** Timezone (from client) */
  timezone?: string;
}

/**
 * New session creation result
 */
export interface CreateSessionResult {
  /** The created session */
  session: Session;
  /** Whether an old session was evicted */
  evictedSession: Session | null;
  /** Warning if approaching session limit */
  warning: string | null;
}
