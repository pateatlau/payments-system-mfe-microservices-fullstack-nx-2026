/**
 * Admin Service Request Validators
 */

import { z } from 'zod';

// List users query parameters
export const listUsersSchema = z.object({
  page: z.coerce.number().int().positive().optional().default(1),
  limit: z.coerce.number().int().positive().max(100).optional().default(10),
  sort: z
    .enum(['createdAt', 'email', 'name', 'role'])
    .optional()
    .default('createdAt'),
  order: z.enum(['asc', 'desc']).optional().default('desc'),
  role: z.string().optional(), // ADMIN, CUSTOMER, VENDOR
  search: z.string().optional(), // Search by email or name
  // Note: isActive not yet in schema - will be added in future
});

export type ListUsersQuery = z.infer<typeof listUsersSchema>;

// Update user request body
export const updateUserSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  email: z.string().email().optional(),
});

export type UpdateUserRequest = z.infer<typeof updateUserSchema>;

// Update user role request body
export const updateUserRoleSchema = z.object({
  role: z.enum(['ADMIN', 'CUSTOMER', 'VENDOR']),
});

export type UpdateUserRoleRequest = z.infer<typeof updateUserRoleSchema>;

// Activate/Deactivate user request body
export const updateUserStatusSchema = z.object({
  isActive: z.boolean(),
  reason: z.string().max(500).optional(),
});

export type UpdateUserStatusRequest = z.infer<typeof updateUserStatusSchema>;
