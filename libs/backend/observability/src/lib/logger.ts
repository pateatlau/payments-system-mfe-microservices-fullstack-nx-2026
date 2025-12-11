/**
 * Enhanced Logger with Sentry Integration
 *
 * Provides structured logging with automatic error reporting to Sentry.
 */

import * as Sentry from '@sentry/node';

export enum LogLevel {
  DEBUG = 'debug',
  INFO = 'info',
  WARN = 'warn',
  ERROR = 'error',
}

export interface LogContext {
  [key: string]: unknown;
}

/**
 * Logger class with Sentry integration
 */
export class Logger {
  private serviceName: string;

  constructor(serviceName: string) {
    this.serviceName = serviceName;
  }

  /**
   * Log debug message
   */
  debug(message: string, context?: LogContext): void {
    this.log(LogLevel.DEBUG, message, context);
  }

  /**
   * Log info message
   */
  info(message: string, context?: LogContext): void {
    this.log(LogLevel.INFO, message, context);
  }

  /**
   * Log warning message
   */
  warn(message: string, context?: LogContext): void {
    this.log(LogLevel.WARN, message, context);
    // Add breadcrumb for warnings
    Sentry.addBreadcrumb({
      message,
      level: 'warning',
      data: context,
      category: 'log',
    });
  }

  /**
   * Log error message and report to Sentry
   */
  error(message: string, error?: Error | unknown, context?: LogContext): void {
    this.log(LogLevel.ERROR, message, { ...context, error });

    // Report to Sentry if error is provided
    if (error instanceof Error) {
      Sentry.captureException(error, {
        extra: {
          message,
          ...context,
        },
        tags: {
          service: this.serviceName,
        },
      });
    } else if (error) {
      Sentry.captureMessage(message, {
        level: 'error',
        extra: {
          error,
          ...context,
        },
        tags: {
          service: this.serviceName,
        },
      });
    }
  }

  /**
   * Internal log method
   */
  private log(level: LogLevel, message: string, context?: LogContext): void {
    const timestamp = new Date().toISOString();
    const logEntry = {
      timestamp,
      level,
      service: this.serviceName,
      message,
      ...context,
    };

    // Format log output
    const logString = JSON.stringify(logEntry);

    // Output to console with appropriate method
    switch (level) {
      case LogLevel.DEBUG:
        console.debug(logString);
        break;
      case LogLevel.INFO:
        console.info(logString);
        break;
      case LogLevel.WARN:
        console.warn(logString);
        break;
      case LogLevel.ERROR:
        console.error(logString);
        break;
    }
  }
}

/**
 * Create a logger instance for a service
 *
 * @param serviceName - Name of the service
 * @returns Logger instance
 */
export function createLogger(serviceName: string): Logger {
  return new Logger(serviceName);
}
