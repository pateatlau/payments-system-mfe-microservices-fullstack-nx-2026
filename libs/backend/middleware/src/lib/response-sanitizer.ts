/**
 * Response Sanitizer Middleware
 *
 * Sanitizes API responses to prevent information leakage:
 * - Removes stack traces in production
 * - Sanitizes error messages
 * - Removes internal IDs/paths
 * - Detects and redacts PII (Personally Identifiable Information)
 */

import { Request, Response, NextFunction } from 'express';

/**
 * Configuration options for response sanitization
 */
export interface ResponseSanitizerConfig {
  /** Enable stack trace removal (default: true in production) */
  removeStackTraces?: boolean;
  /** Enable PII redaction (default: true) */
  redactPii?: boolean;
  /** Enable internal path sanitization (default: true) */
  sanitizePaths?: boolean;
  /** Custom PII patterns to detect */
  customPiiPatterns?: RegExp[];
  /** Fields to always redact */
  redactFields?: string[];
  /** Environment (defaults to NODE_ENV) */
  environment?: string;
  /** Callback for logging sanitization events */
  onSanitize?: (event: SanitizationEvent) => void;
}

/**
 * Event emitted when sanitization occurs
 */
export interface SanitizationEvent {
  type: 'stack_trace' | 'pii' | 'path' | 'field';
  field?: string;
  originalLength?: number;
  redactedLength?: number;
  timestamp: Date;
}

/**
 * Common PII patterns
 */
export const PII_PATTERNS = {
  // Email addresses
  email: /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g,

  // Phone numbers (various formats)
  phone:
    /(?:\+?1[-.\s]?)?\(?[0-9]{3}\)?[-.\s]?[0-9]{3}[-.\s]?[0-9]{4}(?:\s*(?:ext|x|extension)\s*\d+)?/gi,

  // Social Security Numbers (US)
  ssn: /\b\d{3}[-.\s]?\d{2}[-.\s]?\d{4}\b/g,

  // Credit card numbers (basic pattern)
  creditCard: /\b(?:\d{4}[-.\s]?){3}\d{4}\b/g,

  // IP addresses (IPv4)
  ipv4: /\b(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\b/g,

  // JWT tokens (basic pattern - starts with eyJ)
  jwt: /eyJ[a-zA-Z0-9_-]*\.eyJ[a-zA-Z0-9_-]*\.[a-zA-Z0-9_-]*/g,

  // API keys (common patterns)
  apiKey:
    /(?:api[_-]?key|apikey|access[_-]?token|auth[_-]?token|bearer)["\s:=]+["']?[a-zA-Z0-9_-]{20,}["']?/gi,

  // Passwords in URLs or query strings
  passwordInUrl: /(?:password|passwd|pwd|secret)[=:][^&\s]+/gi,

  // Bank account numbers (basic)
  bankAccount: /\b[0-9]{8,17}\b/g,

  // Date of birth patterns
  dob: /\b(?:0[1-9]|1[0-2])[-/](?:0[1-9]|[12][0-9]|3[01])[-/](?:19|20)\d{2}\b/g,
};

/**
 * Fields commonly containing sensitive data
 * NOTE: accessToken and refreshToken are intentionally NOT included here
 * because they are returned in successful login/refresh responses.
 * They should only be redacted in error responses, not in auth responses.
 */
export const SENSITIVE_FIELDS = [
  'password',
  'passwordHash',
  'apiKey',
  'secret',
  'secretKey',
  'privateKey',
  'authorization',
  'cookie',
  'session',
  'creditCard',
  'cardNumber',
  'cvv',
  'ssn',
  'socialSecurityNumber',
  'bankAccount',
  'routingNumber',
  'pin',
];

/**
 * Fields that should only be redacted in error responses
 * These are sensitive but are legitimately returned in successful auth responses
 */
export const AUTH_TOKEN_FIELDS = ['token', 'accessToken', 'refreshToken'];

/**
 * Internal path patterns to sanitize
 */
const INTERNAL_PATH_PATTERNS = [
  // Absolute file paths
  /(?:\/(?:Users|home|var|opt|etc|usr)\/[^\s"']+)/g,
  // Windows paths
  /(?:[A-Za-z]:\\[^\s"']+)/g,
  // Node modules paths
  /node_modules\/[^\s"']+/g,
  // Common project structure paths
  /(?:apps|libs|src|dist)\/[^\s"']+\.(?:ts|js|tsx|jsx)/g,
];

/**
 * Redaction placeholder
 */
const REDACTED = '[REDACTED]';

/**
 * Default configuration
 */
const DEFAULT_CONFIG: Required<ResponseSanitizerConfig> = {
  removeStackTraces: true,
  redactPii: true,
  sanitizePaths: true,
  customPiiPatterns: [],
  redactFields: [],
  environment: process.env['NODE_ENV'] || 'development',
  onSanitize: () => {
    /* noop */
  },
};

/**
 * Check if we're in production environment
 */
function isProduction(config: Required<ResponseSanitizerConfig>): boolean {
  return config.environment === 'production';
}

/**
 * Redact PII from a string value
 */
export function redactPiiFromString(
  value: string,
  config: Required<ResponseSanitizerConfig>
): string {
  let result = value;

  // Apply built-in PII patterns
  // Use replace() directly to avoid lastIndex issues with global regexes
  for (const [, pattern] of Object.entries(PII_PATTERNS)) {
    // Reset lastIndex before replacement to ensure consistent behavior
    pattern.lastIndex = 0;
    const newResult = result.replace(pattern, REDACTED);
    if (newResult !== result) {
      config.onSanitize({
        type: 'pii',
        originalLength: result.length,
        timestamp: new Date(),
      });
      result = newResult;
    }
    // Reset lastIndex after replacement for safety
    pattern.lastIndex = 0;
  }

  // Apply custom PII patterns
  for (const pattern of config.customPiiPatterns) {
    // Reset lastIndex before replacement
    if (pattern.global) {
      pattern.lastIndex = 0;
    }
    const newResult = result.replace(pattern, REDACTED);
    if (newResult !== result) {
      config.onSanitize({
        type: 'pii',
        originalLength: result.length,
        timestamp: new Date(),
      });
      result = newResult;
    }
    // Reset lastIndex after replacement for safety
    if (pattern.global) {
      pattern.lastIndex = 0;
    }
  }

  return result;
}

/**
 * Sanitize internal paths from a string
 */
export function sanitizePathsFromString(
  value: string,
  config: Required<ResponseSanitizerConfig>
): string {
  let result = value;

  for (const pattern of INTERNAL_PATH_PATTERNS) {
    if (pattern.test(result)) {
      config.onSanitize({
        type: 'path',
        originalLength: result.length,
        timestamp: new Date(),
      });
      result = result.replace(pattern, '[internal-path]');
    }
    // Reset lastIndex for global patterns
    pattern.lastIndex = 0;
  }

  return result;
}

/**
 * Check if a field name is sensitive
 * @param fieldName - The field name to check
 * @param config - Sanitizer configuration
 * @param isErrorResponse - Whether this is an error response (4xx/5xx)
 */
function isSensitiveField(
  fieldName: string,
  config: Required<ResponseSanitizerConfig>,
  isErrorResponse = false
): boolean {
  const lowerField = fieldName.toLowerCase();

  // Build list of sensitive fields
  // Auth token fields are only considered sensitive in error responses
  const sensitiveFields = isErrorResponse
    ? [...SENSITIVE_FIELDS, ...AUTH_TOKEN_FIELDS, ...config.redactFields]
    : [...SENSITIVE_FIELDS, ...config.redactFields];

  const allSensitiveFields = sensitiveFields.map((f) => f.toLowerCase());

  // Match criteria:
  // 1. Exact match: "password" === "password"
  // 2. Field contains sensitive word: "userPassword" includes "password"
  // Note: We removed sensitive.includes(lowerField) to avoid false positives
  // like 'api' matching 'apikey' when 'api' is not in the sensitive list
  return allSensitiveFields.some(
    (sensitive) =>
      lowerField === sensitive ||
      lowerField.includes(sensitive)
  );
}

/**
 * Recursively sanitize an object
 * @param obj - The object to sanitize
 * @param config - Sanitizer configuration
 * @param depth - Current recursion depth (for infinite recursion prevention)
 * @param isErrorResponse - Whether this is an error response (affects which fields are redacted)
 */
export function sanitizeObject(
  obj: unknown,
  config: Required<ResponseSanitizerConfig>,
  depth = 0,
  isErrorResponse = false
): unknown {
  // Prevent infinite recursion
  if (depth > 20) {
    return obj;
  }

  if (obj === null || obj === undefined) {
    return obj;
  }

  if (typeof obj === 'string') {
    let result = obj;

    // Redact PII (but NOT for auth token values in successful responses)
    // We only apply PII patterns to string values in error responses or
    // when they're not direct token field values
    if (config.redactPii && isErrorResponse) {
      result = redactPiiFromString(result, config);
    }

    // Sanitize paths (only in production)
    if (config.sanitizePaths && isProduction(config)) {
      result = sanitizePathsFromString(result, config);
    }

    return result;
  }

  if (Array.isArray(obj)) {
    return obj.map((item) =>
      sanitizeObject(item, config, depth + 1, isErrorResponse)
    );
  }

  if (typeof obj === 'object') {
    const sanitized: Record<string, unknown> = {};

    for (const [key, value] of Object.entries(obj)) {
      // Check for sensitive field names
      if (isSensitiveField(key, config, isErrorResponse)) {
        config.onSanitize({
          type: 'field',
          field: key,
          timestamp: new Date(),
        });
        sanitized[key] = REDACTED;
        continue;
      }

      // Handle stack traces in production
      if (
        isProduction(config) &&
        config.removeStackTraces &&
        key === 'stack'
      ) {
        config.onSanitize({
          type: 'stack_trace',
          field: key,
          timestamp: new Date(),
        });
        // Don't include stack trace at all in production
        continue;
      }

      // Recursively sanitize nested objects
      sanitized[key] = sanitizeObject(value, config, depth + 1, isErrorResponse);
    }

    return sanitized;
  }

  return obj;
}

/**
 * Sanitize error response body
 */
export function sanitizeErrorResponse(
  body: unknown,
  config: Required<ResponseSanitizerConfig>
): unknown {
  if (!body || typeof body !== 'object') {
    return body;
  }

  // Pass isErrorResponse=true to redact auth tokens in error responses
  const sanitized = sanitizeObject(body, config, 0, true);

  // Additional error-specific sanitization
  if (
    typeof sanitized === 'object' &&
    sanitized !== null &&
    'error' in sanitized
  ) {
    const errorObj = sanitized as { error: Record<string, unknown> };

    // In production, sanitize detailed error messages that might reveal internals
    if (isProduction(config) && errorObj.error) {
      // Remove details field if it contains sensitive info
      if (
        errorObj.error['details'] &&
        typeof errorObj.error['details'] === 'string'
      ) {
        const details = errorObj.error['details'] as string;
        // Check for common internal error patterns
        if (
          details.includes('ECONNREFUSED') ||
          details.includes('ETIMEDOUT') ||
          details.includes('Cannot find module') ||
          details.includes('prisma') ||
          details.includes('database')
        ) {
          errorObj.error['details'] = 'An internal error occurred';
        }
      }
    }
  }

  return sanitized;
}

/**
 * Create response sanitizer middleware
 *
 * This middleware intercepts response JSON and sanitizes it before sending.
 * It wraps res.json() to sanitize all JSON responses.
 */
export function createResponseSanitizer(
  options: ResponseSanitizerConfig = {}
): (req: Request, res: Response, next: NextFunction) => void {
  const config: Required<ResponseSanitizerConfig> = {
    ...DEFAULT_CONFIG,
    ...options,
  };

  return (_req: Request, res: Response, next: NextFunction) => {
    // Store original json method
    const originalJson = res.json.bind(res);

    // Override json method to sanitize responses
    res.json = function (body: unknown): Response {
      // Determine if this is an error response
      const statusCode = res.statusCode;
      const isError = statusCode >= 400;

      // Sanitize the response body
      let sanitizedBody: unknown;

      if (isError) {
        sanitizedBody = sanitizeErrorResponse(body, config);
      } else {
        sanitizedBody = sanitizeObject(body, config);
      }

      // Call original json with sanitized body
      return originalJson(sanitizedBody);
    };

    next();
  };
}

/**
 * Utility to get sanitizer config from environment
 */
export function getResponseSanitizerConfigFromEnv(): ResponseSanitizerConfig {
  return {
    removeStackTraces:
      process.env['RESPONSE_SANITIZER_REMOVE_STACK_TRACES'] !== 'false',
    redactPii: process.env['RESPONSE_SANITIZER_REDACT_PII'] !== 'false',
    sanitizePaths:
      process.env['RESPONSE_SANITIZER_SANITIZE_PATHS'] !== 'false',
    redactFields: process.env['RESPONSE_SANITIZER_REDACT_FIELDS']
      ? process.env['RESPONSE_SANITIZER_REDACT_FIELDS'].split(',')
      : [],
    environment: process.env['NODE_ENV'] || 'development',
  };
}

/**
 * Statistics tracking for sanitization events
 */
interface SanitizationStats {
  stackTracesRemoved: number;
  piiRedacted: number;
  pathsSanitized: number;
  fieldsRedacted: number;
  lastUpdated: Date;
}

const stats: Record<string, SanitizationStats> = {};

/**
 * Track sanitization event
 */
export function trackSanitizationEvent(
  serviceName: string,
  event: SanitizationEvent
): void {
  if (!stats[serviceName]) {
    stats[serviceName] = {
      stackTracesRemoved: 0,
      piiRedacted: 0,
      pathsSanitized: 0,
      fieldsRedacted: 0,
      lastUpdated: new Date(),
    };
  }

  const serviceStats = stats[serviceName];
  serviceStats.lastUpdated = event.timestamp;

  switch (event.type) {
    case 'stack_trace':
      serviceStats.stackTracesRemoved++;
      break;
    case 'pii':
      serviceStats.piiRedacted++;
      break;
    case 'path':
      serviceStats.pathsSanitized++;
      break;
    case 'field':
      serviceStats.fieldsRedacted++;
      break;
  }
}

/**
 * Get sanitization stats for a service
 */
export function getSanitizationStats(
  serviceName: string
): SanitizationStats | undefined {
  return stats[serviceName];
}

/**
 * Reset sanitization stats for a service
 */
export function resetSanitizationStats(serviceName: string): void {
  delete stats[serviceName];
}
