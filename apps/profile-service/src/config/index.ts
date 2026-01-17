/**
 * Profile Service Configuration
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
  urlSchema,
} from '@payments-system/secrets';

/**
 * Profile Service Configuration Schema
 *
 * Note: Defaults are for development/test environments.
 */
const profileConfigSchema = z.object({
  // Server
  port: portSchema.default(3004),
  nodeEnv: NodeEnvSchema.default('development'),

  // Database (POC-3: Separate database per service)
  database: z.object({
    url: postgresUrlSchema.default('postgresql://postgres:postgres@localhost:5435/profile_db'),
  }),

  // Auth Service (for user validation)
  authService: z.object({
    url: urlSchema.default('http://localhost:3001'),
  }),

  // API Gateway
  apiGatewayUrl: urlSchema.default('http://localhost:3000'),

  // Event Hub (Legacy - will be removed)
  eventHubUrl: urlSchema.default('http://localhost:3005'),

  // Redis (POC-3 Phase 5.2: Caching)
  redisUrl: redisUrlSchema.default('redis://localhost:6379'),

  // Logging
  logLevel: LogLevelSchema.default('info'),

  // JWT Secret - has dev default, insecure patterns blocked in production by validateConfig
  jwtSecret: z.string().min(1).default('your-secret-key-change-in-production'),

  // Pagination
  defaultPageSize: z.coerce.number().int().positive().default(10),
  maxPageSize: z.coerce.number().int().positive().default(100),
});

// Validate and parse configuration
const rawConfig = {
  port: process.env['PORT'],
  nodeEnv: process.env['NODE_ENV'],
  database: {
    url: process.env['PROFILE_DATABASE_URL'],
  },
  authService: {
    url: process.env['AUTH_SERVICE_URL'],
  },
  apiGatewayUrl: process.env['NX_API_GATEWAY_URL'] ?? process.env['API_GATEWAY_URL'],
  eventHubUrl: process.env['NX_EVENT_HUB_URL'] ?? process.env['EVENT_HUB_URL'],
  redisUrl: process.env['REDIS_URL'],
  logLevel: process.env['LOG_LEVEL'],
  jwtSecret: process.env['JWT_SECRET'] ?? process.env['NX_JWT_SECRET'],
  defaultPageSize: process.env['DEFAULT_PAGE_SIZE'],
  maxPageSize: process.env['MAX_PAGE_SIZE'],
};

// Type for the validated config (ensures non-optional types from defaults)
type ValidatedProfileConfig = z.infer<typeof profileConfigSchema>;

const config = validateConfig(profileConfigSchema, rawConfig, 'Profile Service') as ValidatedProfileConfig;

export default config;
