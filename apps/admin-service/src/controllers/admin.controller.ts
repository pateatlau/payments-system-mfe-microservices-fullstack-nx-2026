/**
 * Admin Controller - HTTP Request Handlers
 */

import type { Request, Response, NextFunction } from 'express';
import { adminService } from '../services/admin.service';
import {
  listUsersSchema,
  updateUserSchema,
  updateUserRoleSchema,
  updateUserStatusSchema,
} from '../validators/admin.validators';
import type { UserRole } from 'shared-types';

// Extend Express Request to include user
interface AuthenticatedRequest extends Request {
  user?: {
    userId: string;
    email: string;
    name: string;
    role: UserRole;
  };
}

/**
 * List users with pagination, filtering, and sorting
 * GET /api/admin/users
 */
export async function listUsers(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const query = listUsersSchema.parse(req.query);
    const result = await adminService.listUsers(query);

    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Get user by ID
 * GET /api/admin/users/:id
 */
export async function getUserById(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { id } = req.params;

    if (!id) {
      res.status(400).json({
        success: false,
        error: {
          code: 'BAD_REQUEST',
          message: 'User ID is required',
        },
      });
      return;
    }

    const user = await adminService.getUserById(id);

    res.json({
      success: true,
      data: user,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Update user details
 * PUT /api/admin/users/:id
 */
export async function updateUser(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { id } = req.params;

    if (!id) {
      res.status(400).json({
        success: false,
        error: {
          code: 'BAD_REQUEST',
          message: 'User ID is required',
        },
      });
      return;
    }

    const data = updateUserSchema.parse(req.body);
    const user = await adminService.updateUser(id, data);

    res.json({
      success: true,
      data: user,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Update user role
 * PATCH /api/admin/users/:id/role
 */
export async function updateUserRole(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { id } = req.params;

    if (!id) {
      res.status(400).json({
        success: false,
        error: {
          code: 'BAD_REQUEST',
          message: 'User ID is required',
        },
      });
      return;
    }

    const data = updateUserRoleSchema.parse(req.body);
    const user = await adminService.updateUserRole(id, data);

    res.json({
      success: true,
      data: user,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Update user status (activate/deactivate)
 * PATCH /api/admin/users/:id/status
 */
export async function updateUserStatus(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { id } = req.params;

    if (!id) {
      res.status(400).json({
        success: false,
        error: {
          code: 'BAD_REQUEST',
          message: 'User ID is required',
        },
      });
      return;
    }

    const data = updateUserStatusSchema.parse(req.body);
    const user = await adminService.updateUserStatus(id, data);

    res.json({
      success: true,
      data: user,
    });
  } catch (error) {
    next(error);
  }
}
