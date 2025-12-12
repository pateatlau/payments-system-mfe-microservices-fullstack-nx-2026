/**
 * Sentry Error Tracking and Performance Monitoring for Frontend
 *
 * Provides centralized Sentry initialization for all frontend applications (Shell and MFEs).
 * Supports error tracking, performance monitoring, and React error boundaries.
 */

import * as Sentry from '@sentry/react';

export interface SentryConfig {
  dsn?: string;
  environment?: string;
  release?: string;
  appName: string;
  tracesSampleRate?: number;
  enableProfiling?: boolean;
}

/**
 * Initialize Sentry for a frontend application
 *
 * @param config - Sentry configuration
 */
export function initSentry(config: SentryConfig): void {
  const {
    dsn = process.env['NX_SENTRY_DSN'] || process.env['VITE_SENTRY_DSN'],
    environment = process.env['NODE_ENV'] ||
      process.env['VITE_SENTRY_ENVIRONMENT'] ||
      'development',
    release = process.env['NX_SENTRY_RELEASE'] ||
      process.env['VITE_SENTRY_RELEASE'] ||
      `${config.appName}@${process.env['VITE_APP_VERSION'] || '0.0.1'}`,
    appName,
    tracesSampleRate = process.env['NODE_ENV'] === 'production' ? 0.1 : 1.0,
    enableProfiling = false,
  } = config;

  // Skip initialization if DSN is not provided
  if (!dsn) {
    console.warn(
      `[Sentry] DSN not provided for ${appName}, skipping initialization`
    );
    return;
  }

  Sentry.init({
    dsn,
    environment,
    release,
    integrations: [
      // Browser tracing integration for performance monitoring
      // This captures page loads and navigation automatically
      Sentry.browserTracingIntegration(),
    ],
    // Performance monitoring
    tracesSampleRate,
    // Profiling (optional, can be enabled for performance analysis)
    ...(enableProfiling && {
      profilesSampleRate: tracesSampleRate,
    }),
    // Additional options
    beforeSend(event, _hint) {
      // Filter out sensitive data
      if (event.request) {
        // Remove sensitive headers
        if (event.request.headers) {
          delete event.request.headers['authorization'];
          delete event.request.headers['cookie'];
        }
        // Remove sensitive query parameters
        if (event.request.query_string) {
          const queryParams = new URLSearchParams(event.request.query_string);
          queryParams.delete('token');
          queryParams.delete('password');
          event.request.query_string = queryParams.toString();
        }
      }
      return event;
    },
    // Capture unhandled promise rejections (default: true in v10)
  });
}

/**
 * Set user context for error tracking
 *
 * @param user - User information
 */
export function setUser(user: {
  id?: string;
  email?: string;
  username?: string;
  [key: string]: unknown;
}): void {
  Sentry.setUser(user);
}

/**
 * Clear user context
 */
export function clearUser(): void {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  Sentry.setUser(null as any);
}

/**
 * Add breadcrumb for debugging
 *
 * @param breadcrumb - Breadcrumb data
 */
export function addBreadcrumb(breadcrumb: Sentry.Breadcrumb): void {
  Sentry.addBreadcrumb(breadcrumb);
}

/**
 * Set additional context
 *
 * @param key - Context key
 * @param value - Context value
 */
export function setContext(key: string, value: Record<string, unknown>): void {
  Sentry.setContext(key, value);
}

/**
 * Set tag for filtering in Sentry dashboard
 *
 * @param key - Tag key
 * @param value - Tag value
 */
export function setTag(key: string, value: string): void {
  Sentry.setTag(key, value);
}

/**
 * Capture an exception with optional context
 *
 * @param error - Error to capture
 * @param context - Additional context data
 */
export function captureException(
  error: Error,
  context?: Record<string, unknown>
): string {
  return Sentry.captureException(error, {
    extra: context,
    tags: {
      app: 'frontend',
    },
  });
}

/**
 * Capture a message with optional level
 *
 * @param message - Message to capture
 * @param level - Severity level (default: 'info')
 * @param context - Additional context data
 */
export function captureMessage(
  message: string,
  level: Sentry.SeverityLevel = 'info',
  context?: Record<string, unknown>
): string {
  return Sentry.captureMessage(message, {
    level,
    extra: context,
    tags: {
      app: 'frontend',
    },
  });
}

/**
 * Start a span for performance monitoring
 *
 * @param name - Span name
 * @param op - Operation type
 * @param callback - Callback function to execute within the span
 * @returns Result of callback execution
 */
export function startSpan<T>(
  name: string,
  op: string,
  callback: (span: Sentry.Span) => T
): T {
  return Sentry.startSpan(
    {
      name,
      op,
    },
    callback
  );
}
