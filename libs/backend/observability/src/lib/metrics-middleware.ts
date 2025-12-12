/**
 * Prometheus Metrics Middleware
 *
 * Express middleware to automatically collect HTTP request metrics.
 * Tracks request count, duration, and error rates.
 */

import type { Request, Response, NextFunction } from 'express';
import type { Counter, Histogram, Gauge } from 'prom-client';

export interface MetricsMiddlewareOptions {
  httpRequestsTotal: Counter<string>;
  httpRequestDuration: Histogram<string>;
  httpActiveConnections: Gauge<string>;
  httpErrorsTotal: Counter<string>;
  /**
   * Function to normalize request paths (e.g., remove IDs)
   * Example: /api/users/123 -> /api/users/:id
   */
  normalizePath?: (path: string) => string;
  /**
   * Whether to track active connections
   * Default: true
   */
  trackActiveConnections?: boolean;
}

/**
 * Create metrics middleware for Express
 *
 * @param options - Metrics options
 * @returns Express middleware function
 */
export function createMetricsMiddleware(options: MetricsMiddlewareOptions) {
  const {
    httpRequestsTotal,
    httpRequestDuration,
    httpActiveConnections,
    httpErrorsTotal,
    normalizePath = (path: string) => path,
    trackActiveConnections = true,
  } = options;

  return (req: Request, res: Response, next: NextFunction): void => {
    // Track active connections
    if (trackActiveConnections) {
      httpActiveConnections.inc();
    }

    const startTime = Date.now();

    // Normalize path (remove IDs, etc.)
    const path = normalizePath(req.route?.path || req.path);

    // Track when response finishes
    res.on('finish', () => {
      const duration = (Date.now() - startTime) / 1000;
      const status = res.statusCode.toString();

      // Decrement active connections
      if (trackActiveConnections) {
        httpActiveConnections.dec();
      }

      // Record request count
      httpRequestsTotal.inc({
        method: req.method,
        path,
        status,
      });

      // Record request duration
      httpRequestDuration.observe(
        {
          method: req.method,
          path,
          status,
        },
        duration
      );

      // Record errors (4xx, 5xx)
      if (res.statusCode >= 400) {
        httpErrorsTotal.inc({
          method: req.method,
          path,
          status,
        });
      }
    });

    // Handle connection close (client disconnected)
    res.on('close', () => {
      if (trackActiveConnections && !res.writableEnded) {
        httpActiveConnections.dec();
      }
    });

    next();
  };
}

/**
 * Default path normalizer
 * Replaces UUIDs and numeric IDs with placeholders
 *
 * @param path - Request path
 * @returns Normalized path
 */
export function defaultPathNormalizer(path: string): string {
  // Replace UUIDs (8-4-4-4-12 format)
  let normalized = path.replace(
    /\/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/gi,
    '/:id'
  );

  // Replace numeric IDs
  normalized = normalized.replace(/\/\d+/g, '/:id');

  return normalized;
}
