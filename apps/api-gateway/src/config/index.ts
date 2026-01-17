/**
 * API Gateway Configuration
 *
 * Centralized configuration for the API Gateway service
 *
 * POC-3 Phase 3.1: JWT Secret Rotation Support
 * - Supports versioned secrets via JWT_SECRETS env var (JSON array)
 * - Falls back to legacy JWT_SECRET for backwards compatibility
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
  port: parseInt(process.env['API_GATEWAY_PORT'] ?? '3000', 10),
  nodeEnv: process.env['NODE_ENV'] ?? 'development',

  // CORS
  corsOrigins: (
    process.env['CORS_ORIGINS'] ??
    // Support both direct MFE access (HTTP) and nginx proxy (HTTPS)
    'http://localhost:4200,http://localhost:4201,http://localhost:4202,http://localhost:4203,https://localhost'
  ).split(','),

  // Rate Limiting - RESTORED to production-ready values
  rateLimit: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // RESTORED: Limit each IP to 100 requests per 15 minutes
  },

  // Redis
  redis: {
    url: process.env['REDIS_URL'] ?? 'redis://localhost:6379',
  },

  // JWT - Legacy single secret (for backwards compatibility)
  jwtSecret: jwtSecrets[0]?.secret ?? '',
  jwtRefreshSecret: jwtRefreshSecrets[0]?.secret ?? '',

  // JWT Secrets with key versioning (POC-3 Phase 3.1)
  jwtSecrets,
  jwtRefreshSecrets,

  // Backend Services
  services: {
    auth: process.env['AUTH_SERVICE_URL'] ?? 'http://localhost:3001',
    payments: process.env['PAYMENTS_SERVICE_URL'] ?? 'http://localhost:3002',
    admin: process.env['ADMIN_SERVICE_URL'] ?? 'http://localhost:3003',
    profile: process.env['PROFILE_SERVICE_URL'] ?? 'http://localhost:3004',
  },

  // Logging
  logLevel: process.env['LOG_LEVEL'] ?? 'info',
} as const;

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
