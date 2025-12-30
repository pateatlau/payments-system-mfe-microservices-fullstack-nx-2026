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

// Import Prisma via dynamic require to avoid dist path issues
// eslint-disable-next-line @typescript-eslint/no-require-imports
const getPrisma = () => require('../lib/prisma').prisma;

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

/**
 * GET /auth/internal/users/by-email
 * Internal: Get minimal user info by email (id, email)
 */
export const getUserByEmailInternal = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const email = (req.query.email as string) || '';
    if (!email) {
      return res.status(400).json({
        success: false,
        error: { code: 'INVALID_REQUEST', message: 'email is required' },
      });
    }

    const prisma = getPrisma();
    const user = await prisma.user.findUnique({
      where: { email },
      select: { id: true, email: true },
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        error: { code: 'USER_NOT_FOUND', message: 'User not found' },
      });
    }

    return res.status(200).json({ success: true, data: user });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /auth/internal/users/:id
 * Internal: Get minimal user info by id (id, email)
 */
export const getUserByIdInternal = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = req.params.id;
    if (!userId) {
      return res.status(400).json({
        success: false,
        error: { code: 'INVALID_REQUEST', message: 'id is required' },
      });
    }

    const prisma = getPrisma();
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, email: true },
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        error: { code: 'USER_NOT_FOUND', message: 'User not found' },
      });
    }

    return res.status(200).json({ success: true, data: user });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /auth/internal/users
 * Internal: Get all users (id, email, name) for recipient selection
 */
export const listUsersInternal = async (
  _req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const prisma = getPrisma();
    const users = await prisma.user.findMany({
      select: { id: true, email: true, name: true },
      orderBy: { name: 'asc' },
    });

    return res.status(200).json({ success: true, data: users });
  } catch (error) {
    next(error);
  }
};
