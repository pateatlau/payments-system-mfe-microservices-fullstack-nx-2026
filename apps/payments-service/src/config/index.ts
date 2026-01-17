/**
 * Payments Service Configuration
 *
 * POC-3 Phase 3.2: Environment Variable Validation
 * - Zod-based validation for all config values
 * - Fail-fast on missing/invalid config in production
 * - No insecure defaults allowed in production
 */

import { z } from 'zod';
import {
  validateConfig,
  NodeEnvSchema,
  LogLevelSchema,
  portSchema,
  postgresUrlSchema,
  redisUrlSchema,
  rabbitmqUrlSchema,
  urlSchema,
} from '@payments-system/secrets';

/**
 * Payments Service Configuration Schema
 *
 * Note: Defaults are for development/test environments.
 */
const paymentsConfigSchema = z.object({
  // Server
  port: portSchema.default(3002),
  nodeEnv: NodeEnvSchema.default('development'),

  // Database (POC-3: Separate database per service)
  database: z.object({
    url: postgresUrlSchema.default('postgresql://postgres:postgres@localhost:5433/payments_db'),
  }),

  // Auth Service (for user validation)
  authService: z.object({
    url: urlSchema.default('http://localhost:3001'),
  }),

  // API Gateway
  apiGatewayUrl: urlSchema.default('http://localhost:3000'),

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

  // Pagination
  defaultPageSize: z.coerce.number().int().positive().default(10),
  maxPageSize: z.coerce.number().int().positive().default(100),
});

// Validate and parse configuration
const rawConfig = {
  port: process.env['PORT'],
  nodeEnv: process.env['NODE_ENV'],
  database: {
    url: process.env['PAYMENTS_DATABASE_URL'],
  },
  authService: {
    url: process.env['AUTH_SERVICE_URL'],
  },
  apiGatewayUrl: process.env['API_GATEWAY_URL'],
  eventHubUrl: process.env['EVENT_HUB_URL'],
  rabbitmq: {
    url: process.env['RABBITMQ_URL'],
    exchange: process.env['RABBITMQ_EXCHANGE'],
  },
  redisUrl: process.env['REDIS_URL'],
  logLevel: process.env['LOG_LEVEL'],
  defaultPageSize: process.env['DEFAULT_PAGE_SIZE'],
  maxPageSize: process.env['MAX_PAGE_SIZE'],
};

// Type for the validated config (ensures non-optional types from defaults)
type ValidatedPaymentsConfig = z.infer<typeof paymentsConfigSchema>;

export const config = validateConfig(paymentsConfigSchema, rawConfig, 'Payments Service') as ValidatedPaymentsConfig;
