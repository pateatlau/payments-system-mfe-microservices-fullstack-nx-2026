/**
 * API Gateway Configuration
 *
 * Centralized configuration for the API Gateway service
 */

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

  // Rate Limiting
  // TODO: RESTORE ORIGINAL RATE LIMIT - Currently set to very high value temporarily
  rateLimit: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    // Original: max: 100, // Limit each IP to 100 requests per windowMs
    max: 100000, // Temporary high value (to be restored to 100)
  },

  // JWT
  jwtSecret:
    process.env['JWT_SECRET'] ?? 'your-secret-key-change-in-production',
  jwtRefreshSecret:
    process.env['JWT_REFRESH_SECRET'] ??
    'your-refresh-secret-change-in-production',

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
