/**
 * Backend Secrets Management Library
 *
 * Provides JWT secret rotation with key versioning for graceful secret rotation
 * without downtime.
 *
 * Features:
 * - Key versioning (kid in JWT header)
 * - Multiple active secrets for graceful rotation
 * - Secret expiry tracking and warnings
 * - Backwards compatible with legacy single secrets
 *
 * @example
 * ```typescript
 * import { createSecretManagerFromEnv, SecretManager } from '@payments-system/secrets';
 *
 * // Create from environment variables
 * const secretManager = createSecretManagerFromEnv();
 *
 * // Sign a token (uses active secret with kid in header)
 * const token = secretManager.signAccessToken({ userId: '123' }, { expiresIn: '15m' });
 *
 * // Verify a token (tries all verifiable secrets)
 * const result = secretManager.verifyAccessToken(token);
 * if (result.success) {
 *   console.log('Verified with key:', result.kid);
 * }
 *
 * // Rotate secrets
 * const newSecret = SecretManager.generateSecret({ expiresInDays: 90 });
 * secretManager.rotateJwtSecret(newSecret, 'admin', 'scheduled rotation');
 * ```
 */

export { SecretManager } from './lib/secret-manager';
export type { SignTokenOptions } from './lib/secret-manager';
export {
  parseJwtSecrets,
  createSecretManagerFromEnv,
  generateSecretsEnvValue,
} from './lib/config-helper';
export type {
  JwtSecret,
  SecretManagerConfig,
  TokenVerificationResult,
  GenerateSecretOptions,
  SecretRotationMetadata,
  RotationPolicy,
} from './lib/types';

// Configuration validation (POC-3 Phase 3.2)
export {
  validateConfig,
  validateNoInsecureDefaults,
  isProduction,
  productionRequired,
  getEnv,
  getEnvNumber,
  getEnvBoolean,
  commonSchemas,
  NodeEnvSchema,
  LogLevelSchema,
  urlSchema,
  portSchema,
  postgresUrlSchema,
  redisUrlSchema,
  rabbitmqUrlSchema,
  jwtDurationSchema,
} from './lib/config-validator';
export type { NodeEnv, LogLevel, ConfigValidationResult } from './lib/config-validator';
