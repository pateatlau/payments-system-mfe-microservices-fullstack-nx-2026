/**
 * Authentication Middleware
 *
 * Validates JWT tokens and extracts user information
 *
 * POC-3 Phase 3.1: JWT Secret Rotation Support
 * - Uses SecretManager for multi-secret verification
 * - Supports tokens signed with any verifiable secret
 * - Uses 'kid' header to identify the correct secret
 */

import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { getSecretManager } from '../config';
import { ApiError } from './errorHandler';
import { UserRole } from 'shared-types';

/**
 * JWT payload structure
 */
export interface JwtPayload {
  userId: string;
  email: string;
  name: string;
  role: UserRole;
  iat?: number;
  exp?: number;
}

/**
 * Extend Express Request to include user
 */
declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      user?: JwtPayload;
    }
  }
}

/**
 * Authentication middleware
 * Validates JWT token and attaches user to request
 *
 * POC-3 Phase 3.1: Now uses SecretManager for multi-secret support
 */
export const authenticate = (
  req: Request,
  _res: Response,
  next: NextFunction
) => {
  try {
    // Get token from Authorization header
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new ApiError(401, 'UNAUTHORIZED', 'Authentication required');
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix

    // Verify token using SecretManager (supports multiple secrets)
    const secretManager = getSecretManager();
    const result = secretManager.verifyAccessToken<JwtPayload>(token);

    if (!result.success) {
      // Check for specific error types
      if (result.error?.includes('expired')) {
        return next(new ApiError(401, 'TOKEN_EXPIRED', 'Access token expired'));
      }
      return next(new ApiError(401, 'TOKEN_INVALID', 'Invalid access token'));
    }

    // Attach user to request
    req.user = result.payload;

    next();
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      return next(new ApiError(401, 'TOKEN_EXPIRED', 'Access token expired'));
    }

    if (error instanceof jwt.JsonWebTokenError) {
      return next(new ApiError(401, 'TOKEN_INVALID', 'Invalid access token'));
    }

    next(error);
  }
};

/**
 * Optional authentication middleware
 * Attaches user if token is present, but doesn't require it
 *
 * POC-3 Phase 3.1: Now uses SecretManager for multi-secret support
 */
export const optionalAuth = (
  req: Request,
  _res: Response,
  next: NextFunction
) => {
  try {
    const authHeader = req.headers.authorization;

    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      const secretManager = getSecretManager();
      const result = secretManager.verifyAccessToken<JwtPayload>(token);

      if (result.success && result.payload) {
        req.user = result.payload;
      }
    }

    next();
  } catch (_error) {
    // Silently fail for optional auth
    next();
  }
};
