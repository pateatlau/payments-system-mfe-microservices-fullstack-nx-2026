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
  createUserSchema,
  uuidParamSchema,
} from '../validators/admin.validators';
import type { UserRole } from 'shared-types';
import {
  createAuditLog,
  getRequestMetadata,
  AuditAction,
  ResourceType,
} from '../services/audit.service';

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
    // Validate UUID path parameter
    const { id } = uuidParamSchema.parse(req.params);

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
    // Validate UUID path parameter
    const { id } = uuidParamSchema.parse(req.params);

    const data = updateUserSchema.parse(req.body);
    const user = await adminService.updateUser(id, data);

    // Create audit log
    const { ipAddress, userAgent } = getRequestMetadata(req);
    await createAuditLog({
      action: AuditAction.USER_UPDATED,
      resourceType: ResourceType.USER,
      resourceId: id,
      userId: req.user?.userId,
      details: { updatedFields: Object.keys(data) },
      ipAddress,
      userAgent,
    });

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
    // Validate UUID path parameter
    const { id } = uuidParamSchema.parse(req.params);

    const data = updateUserRoleSchema.parse(req.body);
    const user = await adminService.updateUserRole(id, data);

    // Create audit log
    const { ipAddress, userAgent } = getRequestMetadata(req);
    await createAuditLog({
      action: AuditAction.USER_ROLE_CHANGED,
      resourceType: ResourceType.USER,
      resourceId: id,
      userId: req.user?.userId,
      details: { newRole: data.role },
      ipAddress,
      userAgent,
    });

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
    // Validate UUID path parameter
    const { id } = uuidParamSchema.parse(req.params);

    const data = updateUserStatusSchema.parse(req.body);
    const user = await adminService.updateUserStatus(id, data);

    // Create audit log
    const { ipAddress, userAgent } = getRequestMetadata(req);
    await createAuditLog({
      action: AuditAction.USER_STATUS_CHANGED,
      resourceType: ResourceType.USER,
      resourceId: id,
      userId: req.user?.userId,
      details: { isActive: data.isActive, reason: data.reason },
      ipAddress,
      userAgent,
    });

    res.json({
      success: true,
      data: user,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Create new user
 * POST /api/admin/users
 */
export async function createUser(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const data = createUserSchema.parse(req.body);
    const user = await adminService.createUser(data);

    // Create audit log
    const { ipAddress, userAgent } = getRequestMetadata(req);
    await createAuditLog({
      action: AuditAction.USER_CREATED,
      resourceType: ResourceType.USER,
      resourceId: user.id,
      userId: req.user?.userId,
      details: { email: data.email, role: data.role },
      ipAddress,
      userAgent,
    });

    res.status(201).json({
      success: true,
      data: user,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Delete user
 * DELETE /api/admin/users/:id
 */
export async function deleteUser(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    // Validate UUID path parameter
    const { id } = uuidParamSchema.parse(req.params);

    // Get user info before deleting for audit log
    const userToDelete = await adminService.getUserById(id);
    await adminService.deleteUser(id);

    // Create audit log
    const { ipAddress, userAgent } = getRequestMetadata(req);
    await createAuditLog({
      action: AuditAction.USER_DELETED,
      resourceType: ResourceType.USER,
      resourceId: id,
      userId: req.user?.userId,
      details: { deletedUserEmail: userToDelete?.email },
      ipAddress,
      userAgent,
    });

    res.status(204).send();
  } catch (error) {
    next(error);
  }
}
