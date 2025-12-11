/**
 * Sentry Error Tracking and Performance Monitoring
 *
 * Provides centralized Sentry initialization for all backend services.
 * Supports error tracking, performance monitoring, and transaction tracing.
 */

import * as Sentry from '@sentry/node';
import { nodeProfilingIntegration } from '@sentry/profiling-node';
import type { Express } from 'express';

export interface SentryConfig {
  dsn?: string;
  environment?: string;
  release?: string;
  serviceName: string;
  tracesSampleRate?: number;
  profilesSampleRate?: number;
}

/**
 * Initialize Sentry for a backend service
 *
 * @param _app - Express application instance (kept for API consistency, not used in v10)
 * @param config - Sentry configuration
 */
export function initSentry(_app: Express, config: SentryConfig): void {
  const {
    dsn = process.env.SENTRY_DSN,
    environment = process.env.NODE_ENV ||
      process.env.SENTRY_ENVIRONMENT ||
      'development',
    release = process.env.SENTRY_RELEASE ||
      `${config.serviceName}@${process.env.npm_package_version || '0.0.1'}`,
    serviceName,
    tracesSampleRate = process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
    profilesSampleRate = process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
  } = config;

  // Skip initialization if DSN is not provided
  if (!dsn) {
    console.warn(
      `[Sentry] DSN not provided for ${serviceName}, skipping initialization`
    );
    return;
  }

  Sentry.init({
    dsn,
    environment,
    release,
    integrations: [
      // Express integration for Express.js apps (v10 API)
      Sentry.expressIntegration(),
      // Profiling integration for performance profiling
      nodeProfilingIntegration(),
    ],
    // Performance monitoring
    tracesSampleRate,
    // Profiling sample rate
    profilesSampleRate,
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
  });
}

/**
 * Initialize Sentry error handler
 * Must be added as the last middleware, after all routes
 *
 * @param app - Express application instance
 */
export function initSentryErrorHandler(app: Express): void {
  Sentry.setupExpressErrorHandler(app);
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
      service: 'backend',
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
      service: 'backend',
    },
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
  Sentry.setUser(null);
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
