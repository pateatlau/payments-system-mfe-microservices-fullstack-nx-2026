/**
 * Admin API Types
 *
 * Request and response types for Admin Service endpoints
 */

import { User } from '../models/user';
import { AuditLog } from '../models/audit';
import { UserRole } from '../enums';
import { ApiResponse, PaginatedResponse } from './common';

/**
 * Get users query parameters
 */
export interface GetUsersParams {
  page?: number;
  limit?: number;
  sort?: string;
  order?: 'asc' | 'desc';
  role?: UserRole;
  search?: string;
}

/**
 * Get users response
 */
export type GetUsersResponse = PaginatedResponse<User>;

/**
 * Get user by ID response
 */
export type GetUserResponse = ApiResponse<User>;

/**
 * Create user request
 */
export interface CreateUserRequest {
  email: string;
  password: string;
  name: string;
  role: UserRole;
}

/**
 * Create user response
 */
export type CreateUserResponse = ApiResponse<User>;

/**
 * Update user request
 */
export interface UpdateUserRequest {
  name?: string;
  role?: UserRole;
  emailVerified?: boolean;
}

/**
 * Update user response
 */
export type UpdateUserResponse = ApiResponse<User>;

/**
 * Get audit logs query parameters
 */
export interface GetAuditLogsParams {
  page?: number;
  limit?: number;
  sort?: string;
  order?: 'asc' | 'desc';
  userId?: string;
  action?: string;
  resourceType?: string;
  startDate?: string;
  endDate?: string;
}

/**
 * Get audit logs response
 */
export type GetAuditLogsResponse = PaginatedResponse<AuditLog>;

/**
 * Update system config request
 */
export interface UpdateSystemConfigRequest {
  key: string;
  value: unknown;
}

/**
 * Update system config response
 */
export type UpdateSystemConfigResponse = ApiResponse<{
  key: string;
  value: unknown;
  updatedAt: string;
}>;
