/**
 * Secret Manager
 *
 * Manages JWT secrets with support for:
 * - Key versioning (kid in JWT header)
 * - Multiple active secrets for graceful rotation
 * - Secret expiry tracking
 * - Rotation without downtime
 */

import * as crypto from 'crypto';
import * as jwt from 'jsonwebtoken';
import type { SignOptions, Algorithm } from 'jsonwebtoken';
import type {
  JwtSecret,
  SecretManagerConfig,
  TokenVerificationResult,
  GenerateSecretOptions,
  SecretRotationMetadata,
  RotationPolicy,
} from './types';

/**
 * Default rotation policy
 */
const DEFAULT_ROTATION_POLICY: RotationPolicy = {
  autoRotateDays: 90, // Rotate every 90 days
  warningDays: 14, // Warn 14 days before expiry
  keepOldSecrets: 2, // Keep 2 old secrets for verification
};

/**
 * Sign options with string expiresIn support
 * Compatible with jwt.SignOptions but allows string for expiresIn
 */
export interface SignTokenOptions {
  expiresIn?: string | number;
  audience?: string | string[];
  issuer?: string;
  subject?: string;
  jwtid?: string;
  notBefore?: string | number;
}

/**
 * Secret Manager class
 *
 * Handles JWT secret management with key versioning and rotation support.
 */
export class SecretManager {
  private jwtSecrets: JwtSecret[];
  private jwtRefreshSecrets: JwtSecret[];
  private rotationPolicy: RotationPolicy;
  private rotationHistory: SecretRotationMetadata[] = [];
  private onSecretExpiring?: (
    secret: JwtSecret,
    daysUntilExpiry: number
  ) => void;

  constructor(
    config: SecretManagerConfig,
    rotationPolicy: RotationPolicy = DEFAULT_ROTATION_POLICY
  ) {
    this.jwtSecrets = config.jwtSecrets;
    this.jwtRefreshSecrets = config.jwtRefreshSecrets;
    this.rotationPolicy = rotationPolicy;
    this.onSecretExpiring = config.onSecretExpiring;

    // Validate that we have at least one active secret
    this.validateSecrets();
  }

  /**
   * Validate that secrets are properly configured
   */
  private validateSecrets(): void {
    const activeJwtSecrets = this.jwtSecrets.filter(
      (s) => s.isActive && s.canVerify
    );
    const activeRefreshSecrets = this.jwtRefreshSecrets.filter(
      (s) => s.isActive && s.canVerify
    );

    if (activeJwtSecrets.length === 0) {
      throw new Error(
        'SecretManager: At least one active JWT secret is required'
      );
    }

    if (activeRefreshSecrets.length === 0) {
      throw new Error(
        'SecretManager: At least one active refresh token secret is required'
      );
    }
  }

  /**
   * Get the current active JWT secret for signing new tokens
   */
  getActiveJwtSecret(): JwtSecret {
    const active = this.jwtSecrets.find((s) => s.isActive && s.canVerify);
    if (!active) {
      throw new Error('No active JWT secret available');
    }
    return active;
  }

  /**
   * Get the current active refresh token secret for signing
   */
  getActiveRefreshSecret(): JwtSecret {
    const active = this.jwtRefreshSecrets.find((s) => s.isActive && s.canVerify);
    if (!active) {
      throw new Error('No active refresh token secret available');
    }
    return active;
  }

  /**
   * Get all secrets that can verify tokens (active + recent retired)
   */
  getVerifiableJwtSecrets(): JwtSecret[] {
    return this.jwtSecrets.filter((s) => s.canVerify);
  }

  /**
   * Get all refresh secrets that can verify tokens
   */
  getVerifiableRefreshSecrets(): JwtSecret[] {
    return this.jwtRefreshSecrets.filter((s) => s.canVerify);
  }

  /**
   * Sign a JWT with the active secret, including kid in header
   */
  signAccessToken<T extends object>(
    payload: T,
    options: SignTokenOptions = {}
  ): string {
    const activeSecret = this.getActiveJwtSecret();

    // Build sign options with kid in header
    // Note: Cast to SignOptions to avoid strict type checking on expiresIn
    // (jwt.sign actually accepts string like '15m' at runtime)
    const signOptions = {
      ...options,
      algorithm: 'HS256' as Algorithm,
      header: {
        alg: 'HS256' as Algorithm,
        typ: 'JWT',
        kid: activeSecret.kid,
      },
    } as SignOptions;

    return jwt.sign(payload, activeSecret.secret, signOptions);
  }

  /**
   * Sign a refresh token with the active refresh secret
   */
  signRefreshToken<T extends object>(
    payload: T,
    options: SignTokenOptions = {}
  ): string {
    const activeSecret = this.getActiveRefreshSecret();

    // Build sign options with kid in header
    const signOptions = {
      ...options,
      algorithm: 'HS256' as Algorithm,
      header: {
        alg: 'HS256' as Algorithm,
        typ: 'JWT',
        kid: activeSecret.kid,
      },
    } as SignOptions;

    return jwt.sign(payload, activeSecret.secret, signOptions);
  }

  /**
   * Verify an access token, trying multiple secrets if needed
   */
  verifyAccessToken<T extends object>(
    token: string
  ): TokenVerificationResult<T> {
    return this.verifyToken<T>(token, this.getVerifiableJwtSecrets());
  }

  /**
   * Verify a refresh token, trying multiple secrets if needed
   */
  verifyRefreshToken<T extends object>(
    token: string
  ): TokenVerificationResult<T> {
    return this.verifyToken<T>(token, this.getVerifiableRefreshSecrets());
  }

  /**
   * Internal method to verify a token against a list of secrets
   */
  private verifyToken<T extends object>(
    token: string,
    secrets: JwtSecret[]
  ): TokenVerificationResult<T> {
    // Try to decode the header to get the kid
    let decodedHeader: { kid?: string } | null = null;
    try {
      const decoded = jwt.decode(token, { complete: true });
      if (decoded && typeof decoded === 'object') {
        decodedHeader = decoded.header as { kid?: string };
      }
    } catch {
      // Header decode failed, will try all secrets
    }

    // If we have a kid, try that secret first
    if (decodedHeader?.kid) {
      const targetSecret = secrets.find((s) => s.kid === decodedHeader?.kid);
      if (targetSecret) {
        try {
          const payload = jwt.verify(token, targetSecret.secret) as T;
          return {
            success: true,
            payload,
            kid: targetSecret.kid,
          };
        } catch (error) {
          // If the specific kid failed, don't try others (likely expired or tampered)
          return {
            success: false,
            error:
              error instanceof Error ? error.message : 'Token verification failed',
          };
        }
      }
    }

    // No kid or kid not found - try all verifiable secrets (for backwards compatibility)
    for (const secret of secrets) {
      try {
        const payload = jwt.verify(token, secret.secret) as T;
        return {
          success: true,
          payload,
          kid: secret.kid,
        };
      } catch {
        // Try next secret
        continue;
      }
    }

    return {
      success: false,
      error: 'Token verification failed with all available secrets',
    };
  }

  /**
   * Generate a new cryptographically secure secret
   */
  static generateSecret(options: GenerateSecretOptions = {}): JwtSecret {
    const length = options.length || 64;
    const secret = crypto.randomBytes(length).toString('base64');
    const now = new Date();
    const kid =
      options.kid ||
      `key-${now.toISOString().slice(0, 10)}-${crypto.randomBytes(4).toString('hex')}`;

    let expiresAt: Date | null = null;
    if (options.expiresInDays && options.expiresInDays > 0) {
      expiresAt = new Date(
        now.getTime() + options.expiresInDays * 24 * 60 * 60 * 1000
      );
    }

    return {
      kid,
      secret,
      createdAt: now,
      expiresAt,
      isActive: true,
      canVerify: true,
    };
  }

  /**
   * Add a new JWT secret and optionally retire the old one
   */
  rotateJwtSecret(
    newSecret: JwtSecret,
    triggeredBy: string,
    reason: string
  ): void {
    const oldActive = this.getActiveJwtSecret();

    // Mark old secret as inactive (can't sign) but still verifiable
    oldActive.isActive = false;

    // Add new secret at the beginning (most preferred)
    this.jwtSecrets.unshift(newSecret);

    // Clean up old secrets beyond the keep limit
    this.cleanupOldSecrets(this.jwtSecrets, 'jwt');

    // Record rotation
    this.rotationHistory.push({
      rotatedAt: new Date(),
      oldKid: oldActive.kid,
      newKid: newSecret.kid,
      triggeredBy,
      reason,
    });

    console.log(
      `[SecretManager] JWT secret rotated: ${oldActive.kid} -> ${newSecret.kid}`
    );
  }

  /**
   * Add a new refresh token secret and optionally retire the old one
   */
  rotateRefreshSecret(
    newSecret: JwtSecret,
    triggeredBy: string,
    reason: string
  ): void {
    const oldActive = this.getActiveRefreshSecret();

    // Mark old secret as inactive (can't sign) but still verifiable
    oldActive.isActive = false;

    // Add new secret at the beginning
    this.jwtRefreshSecrets.unshift(newSecret);

    // Clean up old secrets
    this.cleanupOldSecrets(this.jwtRefreshSecrets, 'refresh');

    // Record rotation
    this.rotationHistory.push({
      rotatedAt: new Date(),
      oldKid: oldActive.kid,
      newKid: newSecret.kid,
      triggeredBy,
      reason,
    });

    console.log(
      `[SecretManager] Refresh secret rotated: ${oldActive.kid} -> ${newSecret.kid}`
    );
  }

  /**
   * Clean up old secrets, keeping only the configured number
   */
  private cleanupOldSecrets(secrets: JwtSecret[], type: string): void {
    // Count inactive secrets that can still verify
    const inactiveVerifiable = secrets.filter((s) => !s.isActive && s.canVerify);

    // If we have more than the limit, disable verification on oldest
    if (inactiveVerifiable.length > this.rotationPolicy.keepOldSecrets) {
      const toDisable = inactiveVerifiable.slice(
        this.rotationPolicy.keepOldSecrets
      );
      for (const secret of toDisable) {
        secret.canVerify = false;
        console.log(
          `[SecretManager] Disabled verification for old ${type} secret: ${secret.kid}`
        );
      }
    }
  }

  /**
   * Check for expiring secrets and trigger warnings
   */
  checkExpiringSecrets(): void {
    const now = new Date();
    const warningThreshold = new Date(
      now.getTime() + this.rotationPolicy.warningDays * 24 * 60 * 60 * 1000
    );

    const allSecrets = [...this.jwtSecrets, ...this.jwtRefreshSecrets];

    for (const secret of allSecrets) {
      if (secret.expiresAt && secret.canVerify) {
        if (secret.expiresAt <= now) {
          // Secret has expired - disable verification
          secret.canVerify = false;
          secret.isActive = false;
          console.warn(`[SecretManager] Secret ${secret.kid} has expired`);
        } else if (secret.expiresAt <= warningThreshold && this.onSecretExpiring) {
          const daysUntilExpiry = Math.ceil(
            (secret.expiresAt.getTime() - now.getTime()) / (24 * 60 * 60 * 1000)
          );
          this.onSecretExpiring(secret, daysUntilExpiry);
        }
      }
    }
  }

  /**
   * Get rotation history
   */
  getRotationHistory(): SecretRotationMetadata[] {
    return [...this.rotationHistory];
  }

  /**
   * Get status of all secrets (for admin dashboard)
   */
  getSecretsStatus(): {
    jwtSecrets: Array<Omit<JwtSecret, 'secret'>>;
    refreshSecrets: Array<Omit<JwtSecret, 'secret'>>;
  } {
    // Return status without exposing actual secret values
    const sanitize = (secrets: JwtSecret[]): Array<Omit<JwtSecret, 'secret'>> =>
      secrets.map(({ secret: _, ...rest }) => rest);

    return {
      jwtSecrets: sanitize(this.jwtSecrets),
      refreshSecrets: sanitize(this.jwtRefreshSecrets),
    };
  }
}
