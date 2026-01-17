/**
 * API Gateway Configuration
 *
 * Centralized configuration for the API Gateway service
 *
 * POC-3 Phase 3.1: JWT Secret Rotation Support
 * - Supports versioned secrets via JWT_SECRETS env var (JSON array)
 * - Falls back to legacy JWT_SECRET for backwards compatibility
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
  redisUrlSchema,
  urlSchema,
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
 * API Gateway Configuration Schema
 *
 * Note: Defaults are for development/test environments.
 * In production, validateNoInsecureDefaults() blocks insecure values.
 */
const apiGatewayConfigSchema = z.object({
  // Server
  port: portSchema.default(3000),
  nodeEnv: NodeEnvSchema.default('development'),

  // CORS
  corsOrigins: z.array(z.string()).min(1, 'At least one CORS origin required'),

  // Rate Limiting
  rateLimit: z.object({
    windowMs: z.number().int().positive().default(15 * 60 * 1000), // 15 minutes
    max: z.number().int().positive().default(100),
  }),

  // Redis
  redis: z.object({
    url: redisUrlSchema.default('redis://localhost:6379'),
  }),

  // JWT - Legacy single secret (for backwards compatibility)
  jwtSecret: z.string().min(1, 'JWT secret is required'),
  jwtRefreshSecret: z.string().min(1, 'JWT refresh secret is required'),

  // Backend Services
  services: z.object({
    auth: urlSchema.default('http://localhost:3001'),
    payments: urlSchema.default('http://localhost:3002'),
    admin: urlSchema.default('http://localhost:3003'),
    profile: urlSchema.default('http://localhost:3004'),
  }),

  // Logging
  logLevel: LogLevelSchema.default('info'),
});

// Parse CORS origins from comma-separated string
const corsOriginsStr = process.env['CORS_ORIGINS'] ??
  'http://localhost:4200,http://localhost:4201,http://localhost:4202,http://localhost:4203,https://localhost';

// Validate and parse configuration
const rawConfig = {
  port: process.env['API_GATEWAY_PORT'],
  nodeEnv: process.env['NODE_ENV'],
  corsOrigins: corsOriginsStr.split(',').map(s => s.trim()).filter(s => s.length > 0),
  rateLimit: {
    windowMs: 15 * 60 * 1000,
    max: 100,
  },
  redis: {
    url: process.env['REDIS_URL'],
  },
  jwtSecret: jwtSecrets[0]?.secret ?? '',
  jwtRefreshSecret: jwtRefreshSecrets[0]?.secret ?? '',
  services: {
    auth: process.env['AUTH_SERVICE_URL'],
    payments: process.env['PAYMENTS_SERVICE_URL'],
    admin: process.env['ADMIN_SERVICE_URL'],
    profile: process.env['PROFILE_SERVICE_URL'],
  },
  logLevel: process.env['LOG_LEVEL'],
};

const validatedConfig = validateConfig(apiGatewayConfigSchema, rawConfig, 'API Gateway');

// Type for the validated config (ensures non-optional types from defaults)
type ValidatedApiGatewayConfig = z.infer<typeof apiGatewayConfigSchema>;

// Merge with JWT secrets
export const config = Object.assign(validatedConfig, {
  jwtSecrets,
  jwtRefreshSecrets,
}) as ValidatedApiGatewayConfig & {
  jwtSecrets: typeof jwtSecrets;
  jwtRefreshSecrets: typeof jwtRefreshSecrets;
};

// Export typed config type for consumers
export type ApiGatewayConfig = typeof config;

/**
 * Secret Manager singleton for API Gateway
 */
let secretManagerInstance: SecretManager | null = null;

export function getSecretManager(): SecretManager {
  if (!secretManagerInstance) {
    secretManagerInstance = new SecretManager({
      jwtSecrets: config.jwtSecrets,
      jwtRefreshSecrets: config.jwtRefreshSecrets,
      redisUrl: config.redis.url,
      onSecretExpiring: (secret, daysUntilExpiry) => {
        console.warn(
          `[API Gateway] WARNING: JWT secret ${secret.kid} expires in ${daysUntilExpiry} days`
        );
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
