/**
 * Auth Service Configuration
 *
 * Centralized configuration for the Auth Service
 *
 * POC-3 Phase 3.1: JWT Secret Rotation Support
 * - Supports versioned secrets via JWT_SECRETS env var (JSON array)
 * - Falls back to legacy JWT_SECRET for backwards compatibility
 * - Validates secrets on startup (fail fast in production)
 *
 * POC-3 Phase 3.2: Environment Variable Validation
 * - Zod-based validation for all config values
 * - Fail-fast on missing/invalid config in production
 * - No insecure defaults allowed in production
 */

import { z } from 'zod';
import {
  parseJwtSecrets,
  SecretManager,
  validateConfig,
  isProduction,
  NodeEnvSchema,
  LogLevelSchema,
  portSchema,
  postgresUrlSchema,
  redisUrlSchema,
  rabbitmqUrlSchema,
  urlSchema,
  jwtDurationSchema,
} from '@payments-system/secrets';

// Parse JWT secrets from environment (before validation to include in schema)
const jwtSecrets = parseJwtSecrets(
  'JWT_SECRETS',
  'JWT_SECRET',
  isProduction() ? undefined : 'your-secret-key-change-in-production'
);

const jwtRefreshSecrets = parseJwtSecrets(
  'JWT_REFRESH_SECRETS',
  'JWT_REFRESH_SECRET',
  isProduction() ? undefined : 'your-refresh-secret-change-in-production'
);

/**
 * Auth Service Configuration Schema
 *
 * Note: In production, the validateNoInsecureDefaults() check in validateConfig()
 * blocks localhost and other insecure default values.
 * Defaults here are for development/test environments.
 */
const authConfigSchema = z.object({
  // Server
  port: portSchema.default(3001),
  nodeEnv: NodeEnvSchema.default('development'),

  // Database (POC-3: Separate database per service)
  database: z.object({
    url: postgresUrlSchema.default('postgresql://postgres:postgres@localhost:5432/auth_db'),
  }),

  // JWT - Legacy single secret (for backwards compatibility)
  jwtSecret: z.string().min(1, 'JWT secret is required'),
  jwtRefreshSecret: z.string().min(1, 'JWT refresh secret is required'),
  jwtExpiresIn: jwtDurationSchema.default('15m'),
  jwtRefreshExpiresIn: jwtDurationSchema.default('7d'),

  // Password Hashing
  bcryptRounds: z.coerce.number().int().min(4).max(31).default(10),

  // Event Hub (Legacy - will be removed)
  eventHubUrl: urlSchema.default('http://localhost:3005'),

  // RabbitMQ (POC-3: Event-driven architecture)
  rabbitmq: z.object({
    url: rabbitmqUrlSchema.default('amqp://admin:admin@localhost:5672'),
    exchange: z.string().min(1).default('payments_events'),
  }),

  // Redis (POC-3 Phase 5.2: Caching)
  redisUrl: redisUrlSchema.default('redis://localhost:6379'),

  // Logging
  logLevel: LogLevelSchema.default('info'),
});

// Validate and parse configuration
const rawConfig = {
  port: process.env['AUTH_SERVICE_PORT'],
  nodeEnv: process.env['NODE_ENV'],
  database: {
    url: process.env['AUTH_DATABASE_URL'],
  },
  jwtSecret: jwtSecrets[0]?.secret ?? '',
  jwtRefreshSecret: jwtRefreshSecrets[0]?.secret ?? '',
  jwtExpiresIn: process.env['JWT_EXPIRES_IN'],
  jwtRefreshExpiresIn: process.env['JWT_REFRESH_EXPIRES_IN'],
  bcryptRounds: process.env['BCRYPT_ROUNDS'],
  eventHubUrl: process.env['EVENT_HUB_URL'],
  rabbitmq: {
    url: process.env['RABBITMQ_URL'],
    exchange: process.env['RABBITMQ_EXCHANGE'],
  },
  redisUrl: process.env['REDIS_URL'],
  logLevel: process.env['LOG_LEVEL'],
};

const validatedConfig = validateConfig(authConfigSchema, rawConfig, 'Auth Service');

// Type for the validated config (ensures non-optional types from defaults)
type ValidatedAuthConfig = z.infer<typeof authConfigSchema>;

// Merge with JWT secrets
export const config = Object.assign(validatedConfig, {
  jwtSecrets,
  jwtRefreshSecrets,
}) as ValidatedAuthConfig & {
  jwtSecrets: typeof jwtSecrets;
  jwtRefreshSecrets: typeof jwtRefreshSecrets;
};

// Export typed config type for consumers
export type AuthServiceConfig = typeof config;

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
