/**
 * Authentication Middleware for Admin Service
 * Validates JWT tokens and enforces ADMIN role
 */

import type { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import type { UserRole } from 'shared-types';
import { ApiError } from './errorHandler';

// JWT Secret (must match API Gateway and Auth Service)
const JWT_SECRET =
  process.env['JWT_SECRET'] ||
  'your-super-secret-jwt-key-minimum-32-characters-long-for-development-only';

interface JwtPayload {
  userId: string;
  email: string;
  name: string;
  role: UserRole;
}

export interface AuthenticatedRequest extends Request {
  user?: JwtPayload;
}

/**
 * Authenticate JWT token from Authorization header
 */
export function authenticate(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): void {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'No token provided',
        },
      });
      return;
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix

    // Verify token
    const decoded = jwt.verify(token, JWT_SECRET) as JwtPayload;

    // Attach user to request
    req.user = {
      userId: decoded.userId,
      email: decoded.email,
      name: decoded.name,
      role: decoded.role,
    };

    next();
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      res.status(401).json({
        success: false,
        error: {
          code: 'TOKEN_EXPIRED',
          message: 'Token has expired',
        },
      });
      return;
    }

    if (error instanceof jwt.JsonWebTokenError) {
      res.status(401).json({
        success: false,
        error: {
          code: 'INVALID_TOKEN',
          message: 'Invalid token',
        },
      });
      return;
    }

    next(error);
  }
}

/**
 * Require ADMIN role for access
 */
export function requireAdmin(
  req: AuthenticatedRequest,
  _res: Response,
  next: NextFunction
): void {
  if (!req.user) {
    next(new ApiError(401, 'UNAUTHORIZED', 'Authentication required'));
    return;
  }

  if (req.user.role !== 'ADMIN') {
    next(
      new ApiError(
        403,
        'FORBIDDEN',
        'Admin access required. Only administrators can access this resource.'
      )
    );
    return;
  }

  next();
}
