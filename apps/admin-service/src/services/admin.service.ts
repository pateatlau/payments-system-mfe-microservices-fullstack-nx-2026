/**
 * Admin Service - Business Logic
 */

import { prisma as db } from 'db';
import type { UserRole } from 'shared-types';
import { ApiError } from '../middleware/errorHandler';
import type {
  ListUsersQuery,
  UpdateUserRequest,
  UpdateUserRoleRequest,
  UpdateUserStatusRequest,
  CreateUserRequest,
} from '../validators/admin.validators';
import bcrypt from 'bcrypt';

export const adminService = {
  /**
   * List users with pagination, filtering, and sorting
   */
  async listUsers(query: ListUsersQuery) {
    const { page, limit, sort, order, role, search } = query;

    const skip = (page - 1) * limit;

    // Build where clause
    const where: Record<string, unknown> = {};

    // Filter by role
    if (role) {
      where.role = role as UserRole;
    }

    // Note: isActive field not yet in schema - will be added in future migration
    // if (isActive !== undefined) {
    //   where.isActive = isActive;
    // }

    // Search by email or name
    if (search) {
      where.OR = [
        { email: { contains: search, mode: 'insensitive' } },
        { name: { contains: search, mode: 'insensitive' } },
      ];
    }

    // Get total count
    const total = await db.user.count({ where });

    // Get users
    const users = await db.user.findMany({
      where,
      skip,
      take: limit,
      orderBy: { [sort]: order },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        createdAt: true,
        updatedAt: true,
        // Note: isActive field not yet in schema
        // Exclude password hash
      },
    });

    return {
      users,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  },

  /**
   * Get user by ID
   */
  async getUserById(userId: string) {
    const user = await db.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        createdAt: true,
        updatedAt: true,
        // Note: isActive field not yet in schema
        // Include payment statistics
        _count: {
          select: {
            sentPayments: true,
            receivedPayments: true,
          },
        },
      },
    });

    if (!user) {
      throw new ApiError(404, 'USER_NOT_FOUND', 'User not found');
    }

    return user;
  },

  /**
   * Update user details (name, email)
   */
  async updateUser(userId: string, data: UpdateUserRequest) {
    // Check if user exists
    const existingUser = await db.user.findUnique({
      where: { id: userId },
    });

    if (!existingUser) {
      throw new ApiError(404, 'USER_NOT_FOUND', 'User not found');
    }

    // Check if email is already taken
    if (data.email && data.email !== existingUser.email) {
      const emailExists = await db.user.findUnique({
        where: { email: data.email },
      });

      if (emailExists) {
        throw new ApiError(
          409,
          'EMAIL_ALREADY_EXISTS',
          'Email is already in use'
        );
      }
    }

    // Update user
    const updatedUser = await db.user.update({
      where: { id: userId },
      data: {
        name: data.name,
        email: data.email,
        updatedAt: new Date(),
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return updatedUser;
  },

  /**
   * Update user role
   */
  async updateUserRole(userId: string, data: UpdateUserRoleRequest) {
    // Check if user exists
    const existingUser = await db.user.findUnique({
      where: { id: userId },
    });

    if (!existingUser) {
      throw new ApiError(404, 'USER_NOT_FOUND', 'User not found');
    }

    // Update role
    const updatedUser = await db.user.update({
      where: { id: userId },
      data: {
        role: data.role,
        updatedAt: new Date(),
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return updatedUser;
  },

  /**
   * Activate or deactivate user
   * Note: isActive field not yet in schema - this is a placeholder for future implementation
   */
  async updateUserStatus(userId: string, _data: UpdateUserStatusRequest) {
    // Check if user exists
    const existingUser = await db.user.findUnique({
      where: { id: userId },
    });

    if (!existingUser) {
      throw new ApiError(404, 'USER_NOT_FOUND', 'User not found');
    }

    // TODO: Once isActive field is added to schema, implement this:
    // - Prevent deactivating last admin
    // - Update user isActive status
    // - Create audit log entry

    throw new ApiError(
      501,
      'NOT_IMPLEMENTED',
      'User activation/deactivation will be available in a future update. The isActive field needs to be added to the User model schema first.'
    );
  },

  /**
   * Create new user
   */
  async createUser(data: CreateUserRequest) {
    // Check if email already exists
    const existingUser = await db.user.findUnique({
      where: { email: data.email },
    });

    if (existingUser) {
      throw new ApiError(
        409,
        'EMAIL_ALREADY_EXISTS',
        'Email is already in use'
      );
    }

    // Hash password
    const passwordHash = await bcrypt.hash(data.password, 10);

    // Create user
    const user = await db.user.create({
      data: {
        email: data.email,
        passwordHash,
        name: data.name,
        role: data.role,
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return user;
  },

  /**
   * Delete user
   */
  async deleteUser(userId: string) {
    // Check if user exists
    const existingUser = await db.user.findUnique({
      where: { id: userId },
    });

    if (!existingUser) {
      throw new ApiError(404, 'USER_NOT_FOUND', 'User not found');
    }

    // Prevent deleting the last admin
    if (existingUser.role === 'ADMIN') {
      const adminCount = await db.user.count({
        where: { role: 'ADMIN' },
      });

      if (adminCount <= 1) {
        throw new ApiError(
          403,
          'CANNOT_DELETE_LAST_ADMIN',
          'Cannot delete the last admin user'
        );
      }
    }

    // Delete user
    await db.user.delete({
      where: { id: userId },
    });
  },
};
