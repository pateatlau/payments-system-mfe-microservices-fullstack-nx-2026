/**
 * Auth Service Configuration
 *
 * Centralized configuration for the Auth Service
 */

export const config = {
  // Server
  port: parseInt(process.env['AUTH_SERVICE_PORT'] ?? '3001', 10),
  nodeEnv: process.env['NODE_ENV'] ?? 'development',

  // JWT
  jwtSecret:
    process.env['JWT_SECRET'] ?? 'your-secret-key-change-in-production',
  jwtRefreshSecret:
    process.env['JWT_REFRESH_SECRET'] ??
    'your-refresh-secret-change-in-production',
  jwtExpiresIn: (process.env['JWT_EXPIRES_IN'] ?? '15m') as string, // 15 minutes
  jwtRefreshExpiresIn: (process.env['JWT_REFRESH_EXPIRES_IN'] ??
    '7d') as string, // 7 days

  // Password Hashing
  bcryptRounds: parseInt(process.env['BCRYPT_ROUNDS'] ?? '10', 10),

  // Event Hub
  eventHubUrl: process.env['EVENT_HUB_URL'] ?? 'http://localhost:3005',

  // Logging
  logLevel: process.env['LOG_LEVEL'] ?? 'info',
} as const;
