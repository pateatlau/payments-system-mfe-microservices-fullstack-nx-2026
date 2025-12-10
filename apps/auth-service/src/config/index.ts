/**
 * Auth Service Configuration
 *
 * Centralized configuration for the Auth Service
 */

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

  // Event Hub (Legacy - will be removed)
  eventHubUrl: process.env['EVENT_HUB_URL'] ?? 'http://localhost:3005',

  // RabbitMQ (POC-3: Event-driven architecture)
  rabbitmq: {
    url: process.env['RABBITMQ_URL'] ?? 'amqp://guest:guest@localhost:5672',
    exchange: process.env['RABBITMQ_EXCHANGE'] ?? 'payments_events',
  },

  // Logging
  logLevel: process.env['LOG_LEVEL'] ?? 'info',
} as const;
