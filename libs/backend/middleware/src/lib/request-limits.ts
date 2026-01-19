/**
 * Request Size Limits Middleware
 *
 * Provides protection against oversized requests that could cause:
 * - Memory exhaustion (OOM)
 * - Denial of Service (DoS)
 * - Slow request processing
 *
 * Features:
 * - JSON body size limits
 * - URL-encoded body size limits
 * - URL length limits
 * - Header size limits
 * - Configurable limits per endpoint
 * - Proper error messages with status codes
 */

import type { Request, Response, NextFunction, RequestHandler } from 'express';

/**
 * Default size limits
 */
export const DEFAULT_LIMITS = {
  /** Maximum JSON body size (default: 1MB) */
  jsonLimit: '1mb',
  /** Maximum URL-encoded body size (default: 1mb) */
  urlEncodedLimit: '1mb',
  /** Maximum URL length in characters (default: 2048) */
  maxUrlLength: 2048,
  /** Maximum header size in bytes (default: 8KB) */
  maxHeaderSize: 8 * 1024,
  /** Maximum number of headers (default: 100) */
  maxHeaderCount: 100,
  /** Maximum parameter pollution count (default: 100) */
  maxParameterCount: 100,
} as const;

/**
 * Request limits configuration
 */
export interface RequestLimitsConfig {
  /** Maximum JSON body size (e.g., '1mb', '10kb', '5mb') */
  jsonLimit?: string;
  /** Maximum URL-encoded body size */
  urlEncodedLimit?: string;
  /** Maximum URL length in characters */
  maxUrlLength?: number;
  /** Maximum header size in bytes */
  maxHeaderSize?: number;
  /** Maximum number of headers */
  maxHeaderCount?: number;
  /** Maximum number of query/body parameters (prevents parameter pollution) */
  maxParameterCount?: number;
  /** Skip limits check for these paths (e.g., ['/health', '/metrics']) */
  skipPaths?: string[];
  /** Custom error handler */
  onError?: (error: RequestLimitError, req: Request, res: Response) => void;
}

/**
 * Error types for request limit violations
 */
export type RequestLimitErrorType =
  | 'BODY_TOO_LARGE'
  | 'URL_TOO_LONG'
  | 'HEADERS_TOO_LARGE'
  | 'TOO_MANY_HEADERS'
  | 'TOO_MANY_PARAMETERS'
  | 'INVALID_CONTENT_TYPE';

/**
 * Request limit error details
 */
export interface RequestLimitError {
  type: RequestLimitErrorType;
  message: string;
  limit: number | string;
  actual?: number | string;
  statusCode: number;
}

/**
 * Parse size string to bytes
 * Supports: '1kb', '1mb', '1gb', or raw number of bytes
 */
export function parseSize(size: string | number): number {
  if (typeof size === 'number') {
    return size;
  }

  const match = size.toLowerCase().match(/^(\d+(?:\.\d+)?)\s*(kb|mb|gb|b)?$/);
  if (!match || !match[1]) {
    throw new Error(`Invalid size format: ${size}`);
  }

  const value = parseFloat(match[1]);
  const unit = match[2] ?? 'b';

  switch (unit) {
    case 'kb':
      return Math.floor(value * 1024);
    case 'mb':
      return Math.floor(value * 1024 * 1024);
    case 'gb':
      return Math.floor(value * 1024 * 1024 * 1024);
    case 'b':
    default:
      return Math.floor(value);
  }
}

/**
 * Format bytes to human-readable string
 */
export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes}B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)}KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)}MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)}GB`;
}

/**
 * Create request limit error
 */
function createLimitError(
  type: RequestLimitErrorType,
  limit: number | string,
  actual?: number | string
): RequestLimitError {
  const messages: Record<RequestLimitErrorType, string> = {
    BODY_TOO_LARGE: `Request body too large. Maximum size is ${typeof limit === 'number' ? formatBytes(limit) : limit}`,
    URL_TOO_LONG: `URL too long. Maximum length is ${limit} characters`,
    HEADERS_TOO_LARGE: `Request headers too large. Maximum size is ${typeof limit === 'number' ? formatBytes(limit) : limit}`,
    TOO_MANY_HEADERS: `Too many headers. Maximum is ${limit}`,
    TOO_MANY_PARAMETERS: `Too many parameters. Maximum is ${limit}`,
    INVALID_CONTENT_TYPE: 'Invalid or unsupported content type',
  };

  const statusCodes: Record<RequestLimitErrorType, number> = {
    BODY_TOO_LARGE: 413, // Payload Too Large
    URL_TOO_LONG: 414, // URI Too Long
    HEADERS_TOO_LARGE: 431, // Request Header Fields Too Large
    TOO_MANY_HEADERS: 431,
    TOO_MANY_PARAMETERS: 400, // Bad Request
    INVALID_CONTENT_TYPE: 415, // Unsupported Media Type
  };

  return {
    type,
    message: messages[type],
    limit,
    actual,
    statusCode: statusCodes[type],
  };
}

/**
 * Default error handler
 */
function defaultErrorHandler(
  error: RequestLimitError,
  _req: Request,
  res: Response
): void {
  res.status(error.statusCode).json({
    success: false,
    error: {
      code: error.type,
      message: error.message,
    },
  });
}

/**
 * Create URL length check middleware
 */
export function createUrlLengthMiddleware(
  config: Pick<RequestLimitsConfig, 'maxUrlLength' | 'skipPaths' | 'onError'>
): RequestHandler {
  const maxLength = config.maxUrlLength ?? DEFAULT_LIMITS.maxUrlLength;
  const skipPaths = config.skipPaths ?? [];
  const errorHandler = config.onError ?? defaultErrorHandler;

  return (req: Request, res: Response, next: NextFunction): void => {
    // Skip if path is in skipPaths
    if (skipPaths.some(path => req.path.startsWith(path))) {
      next();
      return;
    }

    const urlLength = req.originalUrl.length;
    if (urlLength > maxLength) {
      const error = createLimitError('URL_TOO_LONG', maxLength, urlLength);
      errorHandler(error, req, res);
      return;
    }

    next();
  };
}

/**
 * Create header size check middleware
 */
export function createHeaderSizeMiddleware(
  config: Pick<
    RequestLimitsConfig,
    'maxHeaderSize' | 'maxHeaderCount' | 'skipPaths' | 'onError'
  >
): RequestHandler {
  const maxSize = config.maxHeaderSize ?? DEFAULT_LIMITS.maxHeaderSize;
  const maxCount = config.maxHeaderCount ?? DEFAULT_LIMITS.maxHeaderCount;
  const skipPaths = config.skipPaths ?? [];
  const errorHandler = config.onError ?? defaultErrorHandler;

  return (req: Request, res: Response, next: NextFunction): void => {
    // Skip if path is in skipPaths
    if (skipPaths.some(path => req.path.startsWith(path))) {
      next();
      return;
    }

    // Check header count
    const headerNames = Object.keys(req.headers);
    if (headerNames.length > maxCount) {
      const error = createLimitError('TOO_MANY_HEADERS', maxCount, headerNames.length);
      errorHandler(error, req, res);
      return;
    }

    // Calculate approximate header size
    let headerSize = 0;
    for (const [key, value] of Object.entries(req.headers)) {
      headerSize += key.length;
      if (Array.isArray(value)) {
        headerSize += value.join(', ').length;
      } else if (value) {
        headerSize += value.length;
      }
      headerSize += 4; // ': ' + '\r\n'
    }

    if (headerSize > maxSize) {
      const error = createLimitError('HEADERS_TOO_LARGE', maxSize, headerSize);
      errorHandler(error, req, res);
      return;
    }

    next();
  };
}

/**
 * Create parameter count check middleware
 * Prevents parameter pollution attacks
 */
export function createParameterCountMiddleware(
  config: Pick<RequestLimitsConfig, 'maxParameterCount' | 'skipPaths' | 'onError'>
): RequestHandler {
  const maxCount = config.maxParameterCount ?? DEFAULT_LIMITS.maxParameterCount;
  const skipPaths = config.skipPaths ?? [];
  const errorHandler = config.onError ?? defaultErrorHandler;

  return (req: Request, res: Response, next: NextFunction): void => {
    // Skip if path is in skipPaths
    if (skipPaths.some(path => req.path.startsWith(path))) {
      next();
      return;
    }

    // Check query parameters
    const queryParams = Object.keys(req.query).length;
    if (queryParams > maxCount) {
      const error = createLimitError('TOO_MANY_PARAMETERS', maxCount, queryParams);
      errorHandler(error, req, res);
      return;
    }

    // Check body parameters (if parsed)
    if (req.body && typeof req.body === 'object') {
      const bodyParams = Object.keys(req.body).length;
      if (bodyParams > maxCount) {
        const error = createLimitError('TOO_MANY_PARAMETERS', maxCount, bodyParams);
        errorHandler(error, req, res);
        return;
      }
    }

    next();
  };
}

/**
 * Statistics tracking
 */
interface RequestLimitsStats {
  totalChecks: number;
  urlTooLong: number;
  headersTooLarge: number;
  tooManyHeaders: number;
  tooManyParameters: number;
  bodyTooLarge: number;
  lastViolation?: {
    type: RequestLimitErrorType;
    timestamp: Date;
    path: string;
  };
}

const statsPerService: Map<string, RequestLimitsStats> = new Map();

/**
 * Get or create stats for a service
 */
function getStats(serviceName: string): RequestLimitsStats {
  if (!statsPerService.has(serviceName)) {
    statsPerService.set(serviceName, {
      totalChecks: 0,
      urlTooLong: 0,
      headersTooLarge: 0,
      tooManyHeaders: 0,
      tooManyParameters: 0,
      bodyTooLarge: 0,
    });
  }
  return statsPerService.get(serviceName)!;
}

/**
 * Track a limit violation
 */
export function trackLimitViolation(
  serviceName: string,
  type: RequestLimitErrorType,
  path: string
): void {
  const stats = getStats(serviceName);
  stats.totalChecks++;
  stats.lastViolation = { type, timestamp: new Date(), path };

  switch (type) {
    case 'URL_TOO_LONG':
      stats.urlTooLong++;
      break;
    case 'HEADERS_TOO_LARGE':
      stats.headersTooLarge++;
      break;
    case 'TOO_MANY_HEADERS':
      stats.tooManyHeaders++;
      break;
    case 'TOO_MANY_PARAMETERS':
      stats.tooManyParameters++;
      break;
    case 'BODY_TOO_LARGE':
      stats.bodyTooLarge++;
      break;
  }
}

/**
 * Get stats for a service
 */
export function getRequestLimitsStats(
  serviceName: string
): RequestLimitsStats | undefined {
  return statsPerService.get(serviceName);
}

/**
 * Reset stats for a service
 */
export function resetRequestLimitsStats(serviceName: string): void {
  statsPerService.delete(serviceName);
}

/**
 * Combined request limits configuration for createRequestLimitsMiddleware
 */
export interface CombinedRequestLimitsConfig extends RequestLimitsConfig {
  /** Service name for statistics tracking */
  serviceName?: string;
  /** Enable statistics tracking (default: true) */
  trackStats?: boolean;
}

/**
 * Create combined request limits middleware
 *
 * Returns an array of middleware to be applied in order:
 * 1. URL length check
 * 2. Header size check
 * 3. Parameter count check
 *
 * Note: Body size limits should be configured via express.json({ limit: '...' })
 * and express.urlencoded({ limit: '...' }) as Express handles these natively.
 *
 * @example
 * ```typescript
 * const limits = createRequestLimitsMiddleware({
 *   serviceName: 'auth-service',
 *   maxUrlLength: 2048,
 *   maxHeaderSize: 8192,
 *   maxParameterCount: 50,
 *   skipPaths: ['/health', '/metrics'],
 * });
 * app.use(limits);
 * ```
 */
export function createRequestLimitsMiddleware(
  config: CombinedRequestLimitsConfig = {}
): RequestHandler[] {
  const {
    serviceName = 'unknown',
    trackStats = true,
    onError,
    ...restConfig
  } = config;

  // Create wrapped error handler that tracks stats
  // Always ensure wrappedErrorHandler is a function, never undefined
  const wrappedErrorHandler: RequestLimitsConfig['onError'] = trackStats
    ? (error, req, res) => {
        trackLimitViolation(serviceName, error.type, req.path);
        if (onError) {
          onError(error, req, res);
        } else {
          defaultErrorHandler(error, req, res);
        }
      }
    : onError || defaultErrorHandler;

  const configWithHandler: RequestLimitsConfig = {
    ...restConfig,
    onError: wrappedErrorHandler,
  };

  return [
    createUrlLengthMiddleware(configWithHandler),
    createHeaderSizeMiddleware(configWithHandler),
    createParameterCountMiddleware(configWithHandler),
  ];
}

/**
 * Get Express body parser options with size limits
 *
 * Use this with express.json() and express.urlencoded()
 *
 * @example
 * ```typescript
 * const { jsonOptions, urlEncodedOptions } = getBodyParserOptions({
 *   jsonLimit: '1mb',
 *   urlEncodedLimit: '1mb',
 * });
 * app.use(express.json(jsonOptions));
 * app.use(express.urlencoded(urlEncodedOptions));
 * ```
 */
export function getBodyParserOptions(
  config: Pick<RequestLimitsConfig, 'jsonLimit' | 'urlEncodedLimit'> = {}
): {
  jsonOptions: { limit: string };
  urlEncodedOptions: { limit: string; extended: boolean; parameterLimit: number };
} {
  return {
    jsonOptions: {
      limit: config.jsonLimit ?? DEFAULT_LIMITS.jsonLimit,
    },
    urlEncodedOptions: {
      limit: config.urlEncodedLimit ?? DEFAULT_LIMITS.urlEncodedLimit,
      extended: true,
      parameterLimit: DEFAULT_LIMITS.maxParameterCount,
    },
  };
}

/**
 * Express error handler for body parser errors
 *
 * Converts Express body parser errors to consistent format
 *
 * @example
 * ```typescript
 * app.use(express.json({ limit: '1mb' }));
 * app.use(bodyParserErrorHandler('my-service'));
 * ```
 */
export function bodyParserErrorHandler(
  serviceName: string = 'unknown'
): (
  err: Error & { type?: string; status?: number },
  req: Request,
  res: Response,
  next: NextFunction
) => void {
  return (
    err: Error & { type?: string; status?: number },
    req: Request,
    res: Response,
    next: NextFunction
  ): void => {
    // Handle body-parser errors
    if (err.type === 'entity.too.large') {
      trackLimitViolation(serviceName, 'BODY_TOO_LARGE', req.path);
      res.status(413).json({
        success: false,
        error: {
          code: 'BODY_TOO_LARGE',
          message: 'Request body too large',
        },
      });
      return;
    }

    if (err.type === 'charset.unsupported') {
      res.status(415).json({
        success: false,
        error: {
          code: 'INVALID_CONTENT_TYPE',
          message: 'Unsupported charset',
        },
      });
      return;
    }

    if (err.type === 'encoding.unsupported') {
      res.status(415).json({
        success: false,
        error: {
          code: 'INVALID_CONTENT_TYPE',
          message: 'Unsupported content encoding',
        },
      });
      return;
    }

    // Pass to next error handler if not a body parser error
    next(err);
  };
}
