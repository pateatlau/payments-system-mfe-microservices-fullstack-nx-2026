/**
 * Auth Controller
 *
 * HTTP handlers for authentication endpoints
 */

import { Request, Response, NextFunction } from 'express';
import * as authService from '../services/auth.service';
import {
  registerSchema,
  loginSchema,
  refreshTokenSchema,
  changePasswordSchema,
} from '../validators/auth.validators';

/**
 * POST /auth/register
 * Register a new user
 */
export const register = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    // Validate request body
    const data = registerSchema.parse(req.body);

    // Register user
    const result = await authService.register(data);

    // Return response
    res.status(201).json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /auth/login
 * Login a user
 */
export const login = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    // Validate request body
    const data = loginSchema.parse(req.body);

    // Login user
    const result = await authService.login(data);

    // Return response
    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /auth/refresh
 * Refresh access token
 */
export const refresh = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    // Validate request body
    const data = refreshTokenSchema.parse(req.body);

    // Refresh token
    const result = await authService.refreshAccessToken(data.refreshToken);

    // Return response
    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /auth/logout
 * Logout a user (requires authentication)
 */
export const logout = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    // Get user ID from request (set by auth middleware)
    const userId = req.user?.userId;

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'Authentication required',
        },
      });
    }

    // Get refresh token from body
    const refreshToken = req.body.refreshToken;

    // Logout user
    await authService.logout(userId, refreshToken);

    // Return response
    res.status(200).json({
      success: true,
      data: {
        message: 'Logged out successfully',
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /auth/me
 * Get current user (requires authentication)
 */
export const getMe = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    // Get user ID from request (set by auth middleware)
    const userId = req.user?.userId;

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'Authentication required',
        },
      });
    }

    // Get user
    const user = await authService.getUserById(userId);

    // Return response
    res.status(200).json({
      success: true,
      data: user,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /auth/password
 * Change user password (requires authentication)
 */
export const changePassword = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    // Get user ID from request (set by auth middleware)
    const userId = req.user?.userId;

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'Authentication required',
        },
      });
    }

    // Validate request body
    const data = changePasswordSchema.parse(req.body);

    // Change password
    await authService.changePassword(
      userId,
      data.currentPassword,
      data.newPassword
    );

    // Return response
    res.status(200).json({
      success: true,
      data: {
        message: 'Password changed successfully',
      },
    });
  } catch (error) {
    next(error);
  }
};
