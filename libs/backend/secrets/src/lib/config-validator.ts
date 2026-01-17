/**
 * Configuration Validator
 *
 * POC-3 Phase 3.2: Environment Variable Validation
 * - Zod-based validation for service configuration
 * - Fail-fast on invalid/missing required config
 * - Production-safe defaults (no insecure defaults in production)
 */

import { z } from 'zod';

/**
 * Environment type enum
 */
export const NodeEnvSchema = z.enum(['development', 'production', 'test']);
export type NodeEnv = z.infer<typeof NodeEnvSchema>;

/**
 * Log level enum
 */
export const LogLevelSchema = z.enum(['error', 'warn', 'info', 'debug', 'trace']);
export type LogLevel = z.infer<typeof LogLevelSchema>;

/**
 * URL validation helper that accepts both http:// and other protocols
 */
export const urlSchema = z.string().refine(
  (val) => {
    try {
      new URL(val);
      return true;
    } catch {
      return false;
    }
  },
  { message: 'Invalid URL format' }
);

/**
 * Port validation schema
 */
export const portSchema = z.coerce
  .number()
  .int()
  .min(1)
  .max(65535);

/**
 * Database URL schema (PostgreSQL)
 */
export const postgresUrlSchema = z.string().refine(
  (val) => val.startsWith('postgresql://') || val.startsWith('postgres://'),
  { message: 'Database URL must start with postgresql:// or postgres://' }
);

/**
 * Redis URL schema
 */
export const redisUrlSchema = z.string().refine(
  (val) => val.startsWith('redis://') || val.startsWith('rediss://'),
  { message: 'Redis URL must start with redis:// or rediss://' }
);

/**
 * RabbitMQ URL schema
 */
export const rabbitmqUrlSchema = z.string().refine(
  (val) => val.startsWith('amqp://') || val.startsWith('amqps://'),
  { message: 'RabbitMQ URL must start with amqp:// or amqps://' }
);

/**
 * JWT duration schema (e.g., '15m', '7d', '1h')
 */
export const jwtDurationSchema = z.string().regex(
  /^\d+[smhdwMy]$/,
  'JWT duration must be in format like 15m, 7d, 1h'
);

/**
 * Check if we're in production environment
 */
export function isProduction(): boolean {
  return process.env['NODE_ENV'] === 'production';
}

/**
 * Create a schema that requires a value in production but allows default in development
 */
export function productionRequired<T extends z.ZodTypeAny>(
  schema: T,
  devDefault: z.infer<T>,
  description: string
): z.ZodType<z.infer<T>> {
  if (isProduction()) {
    return schema.describe(`${description} (REQUIRED in production)`);
  }
  return schema.default(devDefault).describe(description);
}

/**
 * Insecure patterns that indicate development-only values
 * These patterns are checked against secret/password fields to ensure
 * production systems don't use placeholder secrets.
 * Note: localhost is NOT included as it's valid for service URLs in many deployments.
 */
const INSECURE_PATTERNS = [
  'change-in-production',
  'change-me',
  'your-secret',
  'default-secret',
  'test-secret',
  'development-only',
  '123456',
];

export function validateNoInsecureDefaults(
  config: Record<string, unknown>,
  path = ''
): string[] {
  const errors: string[] = [];

  if (!isProduction()) {
    return errors; // Only check in production
  }

  for (const [key, value] of Object.entries(config)) {
    const fullPath = path ? `${path}.${key}` : key;

    if (typeof value === 'string') {
      const lowerValue = value.toLowerCase();
      for (const pattern of INSECURE_PATTERNS) {
        if (lowerValue.includes(pattern)) {
          errors.push(
            `Insecure default detected at ${fullPath}: contains '${pattern}'`
          );
          break;
        }
      }
    } else if (typeof value === 'object' && value !== null) {
      errors.push(
        ...validateNoInsecureDefaults(value as Record<string, unknown>, fullPath)
      );
    }
  }

  return errors;
}

/**
 * Configuration validation result
 */
export interface ConfigValidationResult<T> {
  success: boolean;
  config?: T;
  errors?: string[];
}

/**
 * Validate configuration with fail-fast behavior
 *
 * Always parses and applies defaults via Zod. In development mode,
 * validation errors are logged as warnings but the config is still returned.
 * In production, any validation error causes the process to fail.
 */
export function validateConfig<T>(
  schema: z.ZodSchema<T>,
  data: unknown,
  serviceName: string
): T {
  // First, parse with Zod (this applies defaults)
  const result = schema.safeParse(data);

  if (!result.success) {
    const errors = result.error.errors.map(
      (err) => `${err.path.join('.')}: ${err.message}`
    );
    console.error(`[${serviceName}] Configuration validation failed:`);
    errors.forEach((err) => console.error(`  - ${err}`));

    // Always throw in production
    if (isProduction()) {
      throw new Error(
        `[${serviceName}] Invalid configuration in production. Fix the following issues:\n${errors.join('\n')}`
      );
    }

    // In development, we still throw to ensure types are correct
    // The error messages above provide guidance on what to fix
    throw new Error(
      `[${serviceName}] Invalid configuration. Fix the following issues:\n${errors.join('\n')}`
    );
  }

  const config = result.data;

  // Check for insecure defaults in production
  if (isProduction() && typeof config === 'object' && config !== null) {
    const insecureErrors = validateNoInsecureDefaults(
      config as Record<string, unknown>
    );
    if (insecureErrors.length > 0) {
      console.error(`[${serviceName}] Insecure configuration detected:`);
      insecureErrors.forEach((err) => console.error(`  - ${err}`));
      throw new Error(
        `[${serviceName}] Insecure configuration in production. Fix the following issues:\n${insecureErrors.join('\n')}`
      );
    }
  }

  return config;
}

/**
 * Helper to get environment variable with optional transform
 */
export function getEnv(
  key: string,
  defaultValue?: string
): string | undefined {
  return process.env[key] ?? defaultValue;
}

/**
 * Helper to get numeric environment variable
 */
export function getEnvNumber(
  key: string,
  defaultValue?: number
): number | undefined {
  const value = process.env[key];
  if (value === undefined) return defaultValue;
  const parsed = parseInt(value, 10);
  return isNaN(parsed) ? defaultValue : parsed;
}

/**
 * Helper to get boolean environment variable
 */
export function getEnvBoolean(
  key: string,
  defaultValue?: boolean
): boolean | undefined {
  const value = process.env[key];
  if (value === undefined) return defaultValue;
  return value === 'true' || value === '1';
}

/**
 * Common service configuration schemas
 */
export const commonSchemas = {
  nodeEnv: NodeEnvSchema,
  logLevel: LogLevelSchema,
  port: portSchema,
  postgresUrl: postgresUrlSchema,
  redisUrl: redisUrlSchema,
  rabbitmqUrl: rabbitmqUrlSchema,
  url: urlSchema,
  jwtDuration: jwtDurationSchema,
};

export default {
  validateConfig,
  validateNoInsecureDefaults,
  isProduction,
  productionRequired,
  getEnv,
  getEnvNumber,
  getEnvBoolean,
  commonSchemas,
};
