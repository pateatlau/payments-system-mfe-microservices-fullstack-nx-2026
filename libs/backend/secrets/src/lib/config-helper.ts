/**
 * Configuration Helper for Secrets
 *
 * Parses JWT secrets from environment variables with support for:
 * - Single secret (backwards compatible)
 * - Multiple secrets with versioning (JSON format)
 */

import type { JwtSecret } from './types';
import { SecretManager } from './secret-manager';

/**
 * Environment variable format for multiple secrets:
 *
 * JWT_SECRETS='[
 *   {"kid":"v2","secret":"new-secret","isActive":true},
 *   {"kid":"v1","secret":"old-secret","isActive":false}
 * ]'
 *
 * Or for single secret (backwards compatible):
 * JWT_SECRET='your-single-secret'
 */

/**
 * Parse JWT secrets from environment variable
 *
 * Supports both:
 * - Legacy single secret: JWT_SECRET
 * - Versioned secrets array: JWT_SECRETS (JSON array)
 *
 * @param envVarName - Name of the env var for versioned secrets (e.g., 'JWT_SECRETS')
 * @param legacyEnvVarName - Name of the legacy single secret env var (e.g., 'JWT_SECRET')
 * @param defaultSecret - Default secret for development (NEVER use in production). Pass undefined to require secret.
 * @returns Array of JwtSecret objects
 */
export function parseJwtSecrets(
  envVarName: string,
  legacyEnvVarName: string,
  defaultSecret?: string
): JwtSecret[] {
  const nodeEnv = process.env['NODE_ENV'] || 'development';

  // Try to parse versioned secrets first
  const secretsJson = process.env[envVarName];
  if (secretsJson) {
    try {
      const parsed = JSON.parse(secretsJson);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed.map((s, index) => ({
          kid: s.kid || `key-${index}`,
          secret: s.secret,
          createdAt: s.createdAt ? new Date(s.createdAt) : new Date(),
          expiresAt: s.expiresAt ? new Date(s.expiresAt) : null,
          isActive: s.isActive !== undefined ? s.isActive : index === 0,
          canVerify: s.canVerify !== undefined ? s.canVerify : true,
        }));
      }
    } catch (error) {
      console.error(
        `[ConfigHelper] Failed to parse ${envVarName}:`,
        error instanceof Error ? error.message : error
      );
    }
  }

  // Fall back to legacy single secret
  const legacySecret = process.env[legacyEnvVarName];
  if (legacySecret) {
    // In production, ensure it's not the default
    if (nodeEnv === 'production' && legacySecret === defaultSecret) {
      throw new Error(
        `CRITICAL: Default ${legacyEnvVarName} detected in production. ` +
          'Please set a secure, unique secret.'
      );
    }

    return [
      {
        kid: 'legacy-v1',
        secret: legacySecret,
        createdAt: new Date(),
        expiresAt: null,
        isActive: true,
        canVerify: true,
      },
    ];
  }

  // Use default only in development (if provided)
  if (nodeEnv === 'production' || !defaultSecret) {
    throw new Error(
      `CRITICAL: No ${legacyEnvVarName} or ${envVarName} configured in production`
    );
  }

  console.warn(
    `[ConfigHelper] Using default secret for ${legacyEnvVarName} in ${nodeEnv} mode. ` +
      'Do NOT use this in production!'
  );

  return [
    {
      kid: 'default-dev',
      secret: defaultSecret,
      createdAt: new Date(),
      expiresAt: null,
      isActive: true,
      canVerify: true,
    },
  ];
}

/**
 * Create a SecretManager from environment variables
 *
 * Expected env vars:
 * - JWT_SECRETS or JWT_SECRET
 * - JWT_REFRESH_SECRETS or JWT_REFRESH_SECRET
 * - REDIS_URL (optional, for storing rotation metadata)
 */
export function createSecretManagerFromEnv(): SecretManager {
  const jwtSecrets = parseJwtSecrets(
    'JWT_SECRETS',
    'JWT_SECRET',
    'your-secret-key-change-in-production'
  );

  const jwtRefreshSecrets = parseJwtSecrets(
    'JWT_REFRESH_SECRETS',
    'JWT_REFRESH_SECRET',
    'your-refresh-secret-change-in-production'
  );

  return new SecretManager({
    jwtSecrets,
    jwtRefreshSecrets,
    redisUrl: process.env['REDIS_URL'],
    onSecretExpiring: (secret, days) => {
      console.warn(
        `[SecretManager] WARNING: Secret ${secret.kid} expires in ${days} days`
      );
      // In production, you might want to send an alert here
    },
  });
}

/**
 * Generate environment variable value for secrets (for admin tooling)
 */
export function generateSecretsEnvValue(secrets: JwtSecret[]): string {
  const sanitized = secrets.map((s) => ({
    kid: s.kid,
    secret: s.secret,
    createdAt: s.createdAt?.toISOString() ?? null,
    expiresAt: s.expiresAt?.toISOString() ?? null,
    isActive: s.isActive,
    canVerify: s.canVerify,
  }));

  return JSON.stringify(sanitized);
}
