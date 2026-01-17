/**
 * Secrets Management Types
 *
 * Type definitions for JWT secret rotation and key versioning
 */

/**
 * A versioned JWT secret
 */
export interface JwtSecret {
  /** Unique identifier for this key version (e.g., 'v1', 'v2', 'key-2026-01') */
  kid: string;
  /** The actual secret value */
  secret: string;
  /** When this key was created */
  createdAt: Date;
  /** When this key expires (optional - null means no expiry) */
  expiresAt: Date | null;
  /** Whether this key is active for signing new tokens */
  isActive: boolean;
  /** Whether this key can still verify existing tokens */
  canVerify: boolean;
}

/**
 * Configuration for the secret manager
 */
export interface SecretManagerConfig {
  /** List of JWT secrets for access tokens (ordered by preference for signing) */
  jwtSecrets: JwtSecret[];
  /** List of JWT secrets for refresh tokens (ordered by preference for signing) */
  jwtRefreshSecrets: JwtSecret[];
  /** Redis URL for storing secret metadata */
  redisUrl?: string;
  /** Callback when a secret is about to expire */
  onSecretExpiring?: (secret: JwtSecret, daysUntilExpiry: number) => void;
}

/**
 * Result of a token verification attempt
 */
export interface TokenVerificationResult<T> {
  /** Whether verification succeeded */
  success: boolean;
  /** The decoded payload if successful */
  payload?: T;
  /** The key ID used to verify the token */
  kid?: string;
  /** Error message if verification failed */
  error?: string;
}

/**
 * Metadata stored about secret rotations
 */
export interface SecretRotationMetadata {
  /** When the rotation occurred */
  rotatedAt: Date;
  /** The old key ID that was retired */
  oldKid: string;
  /** The new key ID that was activated */
  newKid: string;
  /** Who/what triggered the rotation */
  triggeredBy: string;
  /** Reason for rotation */
  reason: string;
}

/**
 * Options for generating a new secret
 */
export interface GenerateSecretOptions {
  /** Length of the secret in bytes (default: 64) */
  length?: number;
  /** Custom key ID (default: auto-generated with timestamp) */
  kid?: string;
  /** Days until expiry (default: null - no expiry) */
  expiresInDays?: number;
}

/**
 * Secret rotation policy configuration
 */
export interface RotationPolicy {
  /** Auto-rotate secrets after this many days (0 = disabled) */
  autoRotateDays: number;
  /** Warn about expiring secrets this many days in advance */
  warningDays: number;
  /** Keep this many old secrets for verification (grace period) */
  keepOldSecrets: number;
}
