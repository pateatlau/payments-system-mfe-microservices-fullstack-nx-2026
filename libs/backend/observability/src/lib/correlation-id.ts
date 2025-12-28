/**
 * Correlation ID Middleware
 *
 * Express middleware to generate and propagate correlation IDs across services.
 * Correlation IDs are used for distributed tracing and request tracking.
 */

import type { Request, Response, NextFunction } from 'express';
import { trace, context } from '@opentelemetry/api';
import { v4 as uuidv4 } from 'uuid';

/**
 * Extend Express Request type to include correlationId
 */
declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      correlationId?: string;
    }
  }
}

/**
 * Correlation ID middleware
 *
 * Generates or extracts correlation ID from request headers and:
 * 1. Adds it to the request object
 * 2. Sets it in response headers
 * 3. Adds it to OpenTelemetry span attributes
 *
 * @param req - Express request object
 * @param res - Express response object
 * @param next - Express next function
 */
export function correlationIdMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  // Extract correlation ID from header or generate new one
  const correlationId =
    (req.headers['x-correlation-id'] as string) ||
    (req.headers['x-request-id'] as string) ||
    uuidv4();

  // Add to request object for use in handlers
  req.correlationId = correlationId;

  // Set in response headers for client and downstream services
  res.setHeader('x-correlation-id', correlationId);

  // Add to OpenTelemetry span attributes for tracing
  const activeSpan = trace.getSpan(context.active());
  if (activeSpan) {
    activeSpan.setAttribute('correlation_id', correlationId);
    activeSpan.setAttribute('http.request_id', correlationId);
  }

  next();
}

/**
 * Get correlation ID from request
 *
 * Helper function to extract correlation ID from request object
 *
 * @param req - Express request object
 * @returns Correlation ID string
 */
export function getCorrelationId(req: Request): string {
  return req.correlationId || 'unknown';
}
