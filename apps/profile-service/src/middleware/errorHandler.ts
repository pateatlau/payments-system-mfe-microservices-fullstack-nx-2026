/**
 * Profile Service Error Handling Middleware
 */

import type { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import logger from '../utils/logger';

export class ApiError extends Error {
  constructor(
    public statusCode: number,
    public code: string,
    message: string,
    public details?: unknown
  ) {
    super(message);
    this.name = 'ApiError';
    Error.captureStackTrace(this, this.constructor);
  }
}

export function errorHandler(
  err: Error,
  req: Request,
  res: Response,
  _next: NextFunction
): void {
  // Log error (with fallback if logger fails)
  try {
    if (logger && logger.error) {
      logger.error('Request error', {
        error: err?.message || String(err),
        stack: err?.stack,
        url: req.url,
        method: req.method,
      });
    } else {
      console.error('Request error (logger unavailable):', err);
    }
  } catch (logError) {
    console.error('Failed to log error:', logError);
    console.error('Original error:', err);
  }

  // Handle ApiError
  if (err instanceof ApiError) {
    const errorResponse: {
      success: false;
      error: {
        code: string;
        message: string;
        details?: unknown;
      };
    } = {
      success: false,
      error: {
        code: err.code,
        message: err.message,
      },
    };

    if (err.details) {
      errorResponse.error.details = err.details;
    }

    res.status(err.statusCode).json(errorResponse);
    return;
  }

  // Handle Zod validation errors
  if (err instanceof ZodError) {
    res.status(400).json({
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Invalid request data',
        details: err.errors,
      },
    });
    return;
  }

  // Handle generic errors
  res.status(500).json({
    success: false,
    error: {
      code: 'INTERNAL_SERVER_ERROR',
      message: 'An unexpected error occurred',
    },
  });
}

export function notFoundHandler(
  _req: Request,
  _res: Response,
  next: NextFunction
): void {
  next(new ApiError(404, 'NOT_FOUND', 'Resource not found'));
}
