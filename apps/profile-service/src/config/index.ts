/**
 * Profile Service Configuration
 */

import { z } from 'zod';

const configSchema = z.object({
  port: z.number().default(3004),
  nodeEnv: z.enum(['development', 'production', 'test']).default('development'),
  apiGatewayUrl: z.string().url().default('http://localhost:3000'),
  eventHubUrl: z.string().url().default('http://localhost:3005'),
  logLevel: z.enum(['error', 'warn', 'info', 'debug']).default('info'),
  jwtSecret: z.string().min(1),
  defaultPageSize: z.number().default(10),
  maxPageSize: z.number().default(100),
});

const config = configSchema.parse({
  port: Number(process.env['PORT']) || 3004,
  nodeEnv: process.env['NODE_ENV'] || 'development',
  apiGatewayUrl: process.env['NX_API_GATEWAY_URL'] || 'http://localhost:3000',
  eventHubUrl: process.env['NX_EVENT_HUB_URL'] || 'http://localhost:3005',
  logLevel: process.env['LOG_LEVEL'] || 'info',
  jwtSecret:
    process.env['JWT_SECRET'] || process.env['NX_JWT_SECRET'] || 'your-secret-key-change-in-production',
  defaultPageSize: Number(process.env['DEFAULT_PAGE_SIZE']) || 10,
  maxPageSize: Number(process.env['MAX_PAGE_SIZE']) || 100,
});

export default config;
