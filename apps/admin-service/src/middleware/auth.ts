/**
 * Authentication Middleware for Admin Service
 * Validates JWT tokens and enforces ADMIN role
 */

import type { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import type { UserRole } from 'shared-types';
import { ApiError } from './errorHandler';

// JWT Secret (must match Auth Service)
const JWT_SECRET =
  process.env['JWT_SECRET'] || 'your-secret-key-change-in-production';

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
 * Skips OPTIONS requests (handled by CORS middleware)
 */
export function authenticate(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): void {
  // Skip authentication for OPTIONS requests (CORS preflight)
  if (req.method === 'OPTIONS') {
    next();
    return;
  }

  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.log('[Auth Middleware] No token provided');
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
    console.log(
      '[Auth Middleware] Token received:',
      token.substring(0, 50) + '...'
    );
    console.log('[Auth Middleware] Using JWT_SECRET:', JWT_SECRET);

    // Verify token
    const decoded = jwt.verify(token, JWT_SECRET) as JwtPayload;
    console.log('[Auth Middleware] Token verified successfully:', decoded);

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
      console.log('[Auth Middleware] Token expired:', error.message);
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
      console.log('[Auth Middleware] Invalid token:', error.message);
      res.status(401).json({
        success: false,
        error: {
          code: 'INVALID_TOKEN',
          message: 'Invalid token',
        },
      });
      return;
    }

    console.log('[Auth Middleware] Unexpected error:', error);
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
