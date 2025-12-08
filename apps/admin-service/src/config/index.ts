/**
 * Admin Service Configuration
 */

import { z } from 'zod';

const configSchema = z.object({
  port: z.coerce.number().default(3003),
  nodeEnv: z.string().default('development'),
  apiGatewayUrl: z.string().default('http://localhost:3000'),
  eventHubUrl: z.string().default('http://localhost:3004'),
  logLevel: z.string().default('info'),
  // Admin service specific config
  defaultPageSize: z.coerce.number().default(10),
  maxPageSize: z.coerce.number().default(100),
});

const config = configSchema.parse({
  port: process.env['ADMIN_SERVICE_PORT'],
  nodeEnv: process.env['NODE_ENV'],
  apiGatewayUrl: process.env['API_GATEWAY_URL'],
  eventHubUrl: process.env['EVENT_HUB_URL'],
  logLevel: process.env['LOG_LEVEL'],
  defaultPageSize: process.env['DEFAULT_PAGE_SIZE'],
  maxPageSize: process.env['MAX_PAGE_SIZE'],
});

export default config;
