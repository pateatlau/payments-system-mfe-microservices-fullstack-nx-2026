/**
 * Admin Service Configuration
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
  rabbitmqUrlSchema,
  urlSchema,
} from '@payments-system/secrets';

/**
 * Admin Service Configuration Schema
 *
 * Note: Defaults are for development/test environments.
 */
const adminConfigSchema = z.object({
  // Server
  port: portSchema.default(3003),
  nodeEnv: NodeEnvSchema.default('development'),

  // Database (POC-3: Separate database per service)
  database: z.object({
    url: postgresUrlSchema.default('postgresql://postgres:postgres@localhost:5434/admin_db'),
  }),

  // Auth Service (for user validation)
  authService: z.object({
    url: urlSchema.default('http://localhost:3001'),
  }),

  // API Gateway
  apiGatewayUrl: urlSchema.default('http://localhost:3000'),

  // Event Hub (Legacy - will be removed)
  eventHubUrl: urlSchema.default('http://localhost:3004'),

  // RabbitMQ (POC-3: Event-driven architecture)
  rabbitmq: z.object({
    url: rabbitmqUrlSchema.default('amqp://admin:admin@localhost:5672'),
    exchange: z.string().min(1).default('payments_events'),
  }),

  // Logging
  logLevel: LogLevelSchema.default('info'),

  // Admin service specific config
  defaultPageSize: z.coerce.number().int().positive().default(10),
  maxPageSize: z.coerce.number().int().positive().default(100),
});

// Validate and parse configuration
const rawConfig = {
  port: process.env['ADMIN_SERVICE_PORT'],
  nodeEnv: process.env['NODE_ENV'],
  database: {
    url: process.env['ADMIN_DATABASE_URL'],
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
  logLevel: process.env['LOG_LEVEL'],
  defaultPageSize: process.env['DEFAULT_PAGE_SIZE'],
  maxPageSize: process.env['MAX_PAGE_SIZE'],
};

// Type for the validated config (ensures non-optional types from defaults)
type ValidatedAdminConfig = z.infer<typeof adminConfigSchema>;

const config = validateConfig(adminConfigSchema, rawConfig, 'Admin Service') as ValidatedAdminConfig;

export default config;
