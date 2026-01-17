/**
 * Auth Service Configuration
 *
 * Centralized configuration for the Auth Service
 *
 * POC-3 Phase 3.1: JWT Secret Rotation Support
 * - Supports versioned secrets via JWT_SECRETS env var (JSON array)
 * - Falls back to legacy JWT_SECRET for backwards compatibility
 * - Validates secrets on startup (fail fast in production)
 */

import {
  parseJwtSecrets,
  SecretManager,
} from '@payments-system/secrets';

// Parse JWT secrets from environment
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

export const config = {
  // Server
  port: parseInt(process.env['AUTH_SERVICE_PORT'] ?? '3001', 10),
  nodeEnv: process.env['NODE_ENV'] ?? 'development',

  // Database (POC-3: Separate database per service)
  database: {
    url:
      process.env['AUTH_DATABASE_URL'] ??
      'postgresql://postgres:postgres@localhost:5432/auth_db',
  },

  // JWT - Legacy single secret (for backwards compatibility with existing code)
  // New code should use secretManager instead
  jwtSecret: jwtSecrets[0]?.secret ?? '',
  jwtRefreshSecret: jwtRefreshSecrets[0]?.secret ?? '',
  jwtExpiresIn: (process.env['JWT_EXPIRES_IN'] ?? '15m') as string, // 15 minutes
  jwtRefreshExpiresIn: (process.env['JWT_REFRESH_EXPIRES_IN'] ??
    '7d') as string, // 7 days

  // JWT Secrets with key versioning (POC-3 Phase 3.1)
  jwtSecrets,
  jwtRefreshSecrets,

  // Password Hashing
  bcryptRounds: parseInt(process.env['BCRYPT_ROUNDS'] ?? '10', 10),

  // Event Hub (Legacy - will be removed)
  eventHubUrl: process.env['EVENT_HUB_URL'] ?? 'http://localhost:3005',

  // RabbitMQ (POC-3: Event-driven architecture)
  // Note: Using admin:admin credentials as per docker-compose.yml
  rabbitmq: {
    url: process.env['RABBITMQ_URL'] ?? 'amqp://admin:admin@localhost:5672',
    exchange: process.env['RABBITMQ_EXCHANGE'] ?? 'payments_events',
  },

  // Redis (POC-3 Phase 5.2: Caching)
  redisUrl: process.env['REDIS_URL'] ?? 'redis://localhost:6379',

  // Logging
  logLevel: process.env['LOG_LEVEL'] ?? 'info',
} as const;

/**
 * Secret Manager singleton
 *
 * Use this for JWT operations with key versioning support.
 * Provides:
 * - signAccessToken() / verifyAccessToken()
 * - signRefreshToken() / verifyRefreshToken()
 * - Secret rotation methods
 */
let secretManagerInstance: SecretManager | null = null;

export function getSecretManager(): SecretManager {
  if (!secretManagerInstance) {
    secretManagerInstance = new SecretManager({
      jwtSecrets: config.jwtSecrets,
      jwtRefreshSecrets: config.jwtRefreshSecrets,
      redisUrl: config.redisUrl,
      onSecretExpiring: (secret, daysUntilExpiry) => {
        console.warn(
          `[Auth Service] WARNING: JWT secret ${secret.kid} expires in ${daysUntilExpiry} days. ` +
            'Please rotate secrets before expiry.'
        );
        // TODO: In production, send alert to monitoring system
      },
    });
  }
  return secretManagerInstance;
}

/**
 * Reset secret manager (for testing)
 */
export function resetSecretManager(): void {
  secretManagerInstance = null;
}
