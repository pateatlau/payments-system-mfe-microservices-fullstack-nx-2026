/**
 * Authentication Middleware
 *
 * Validates JWT tokens for protected routes
 */

import { Request, Response, NextFunction } from 'express';
import { verifyAccessToken, JwtPayload } from '../utils/token';
import { ApiError } from './errorHandler';

/**
 * Extend Express Request to include user
 */
declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      user?: JwtPayload;
      userId?: string;
    }
  }
}

/**
 * Authentication middleware
 * Validates JWT token and attaches user to request
 * Skips OPTIONS requests (handled by CORS middleware)
 */
export const authenticate = (
  req: Request,
  _res: Response,
  next: NextFunction
) => {
  // Skip authentication for OPTIONS requests (CORS preflight)
  if (req.method === 'OPTIONS') {
    next();
    return;
  }

  try {
    // Get token from Authorization header
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new ApiError(401, 'UNAUTHORIZED', 'Authentication required');
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix

    // Verify token
    const decoded = verifyAccessToken(token);

    // Attach user to request
    req.user = decoded;
    req.userId = decoded.userId; // Convenience property

    next();
  } catch (error) {
    if (error instanceof Error && error.name === 'TokenExpiredError') {
      return next(new ApiError(401, 'TOKEN_EXPIRED', 'Access token expired'));
    }

    if (error instanceof Error && error.name === 'JsonWebTokenError') {
      return next(new ApiError(401, 'TOKEN_INVALID', 'Invalid access token'));
    }

    next(error);
  }
};

/**
 * Role-based authorization middleware
 * Requires a specific role for access
 *
 * @param role - Required role
 */
export const requireRole = (role: string) => {
  return (req: Request, _res: Response, next: NextFunction) => {
    if (!req.user) {
      return next(new ApiError(401, 'UNAUTHORIZED', 'Authentication required'));
    }

    if (req.user.role !== role) {
      return next(
        new ApiError(403, 'FORBIDDEN', `This action requires ${role} role`)
      );
    }

    next();
  };
};

/**
 * Admin authorization middleware
 * Shortcut for requireRole('ADMIN')
 */
export const requireAdmin = requireRole('ADMIN');
