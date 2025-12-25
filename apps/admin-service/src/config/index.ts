/**
 * Admin Service Configuration
 */

import { z } from 'zod';

const configSchema = z.object({
  port: z.coerce.number().default(3003),
  nodeEnv: z.string().default('development'),
  // Database (POC-3: Separate database per service)
  database: z.object({
    url: z
      .string()
      .default('postgresql://postgres:postgres@localhost:5434/admin_db'),
  }),
  // Auth Service (for user validation)
  authService: z.object({
    url: z.string().default('http://localhost:3001'),
  }),
  apiGatewayUrl: z.string().default('http://localhost:3000'),
  eventHubUrl: z.string().default('http://localhost:3004'),
  // RabbitMQ (POC-3: Event-driven architecture)
  rabbitmq: z.object({
    url: z.string().default('amqp://guest:guest@localhost:5672'),
    exchange: z.string().default('payments_events'),
  }),
  logLevel: z.string().default('info'),
  // Admin service specific config
  defaultPageSize: z.coerce.number().default(10),
  maxPageSize: z.coerce.number().default(100),
});

const config = configSchema.parse({
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
});

export default config;
