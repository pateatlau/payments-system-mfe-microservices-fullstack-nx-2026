/**
 * Authentication Middleware
 * Validates JWT tokens and attaches user payload to request
 */

import type { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import config from '../config';
import { ApiError } from './errorHandler';

export interface JwtPayload {
  userId: string;
  email: string;
  name: string;
  role: string;
}

// Extend Express Request type to include user
declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      user?: JwtPayload;
    }
  }
}

/**
 * Middleware to authenticate requests using JWT
 * Extracts token from Authorization header and verifies it
 */
export function authenticate(
  req: Request,
  _res: Response,
  next: NextFunction
): void {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      throw new ApiError(
        401,
        'UNAUTHORIZED',
        'Authorization header is required'
      );
    }

    const parts = authHeader.split(' ');
    if (parts.length !== 2 || parts[0] !== 'Bearer') {
      throw new ApiError(
        401,
        'UNAUTHORIZED',
        'Authorization header must be in format: Bearer <token>'
      );
    }

    const token = parts[1] as string; // parts[1] is guaranteed to exist after length check

    // Verify JWT token
    // Config is validated by zod, so jwtSecret is guaranteed to be a string
    const jwtSecret = config.jwtSecret as string;
    const verified = jwt.verify(token, jwtSecret);
    const payload = verified as unknown as JwtPayload;

    // Attach user payload to request
    req.user = payload;

    next();
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      next(new ApiError(401, 'UNAUTHORIZED', 'Invalid token'));
    } else if (error instanceof jwt.TokenExpiredError) {
      next(new ApiError(401, 'UNAUTHORIZED', 'Token has expired'));
    } else {
      next(error);
    }
  }
}
