/**
 * User Management API
 *
 * API functions for managing users (ADMIN only)
 */

import { adminApiClient } from './adminApiClient';
import type { UserRole } from 'shared-types';

/**
 * User interface from API
 */
export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  emailVerified: boolean;
  createdAt: string;
  updatedAt: string;
}

/**
 * User with profile details
 */
export interface UserWithProfile extends User {
  profile?: {
    id: string;
    avatarUrl: string | null;
    phone: string | null;
    address: string | null;
    bio: string | null;
  };
}

/**
 * Pagination info
 */
export interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

/**
 * Users list response
 */
export interface UsersListResponse {
  users: User[];
  pagination: PaginationInfo;
}

/**
 * User filters
 */
export interface UserFilters {
  page?: number;
  limit?: number;
  role?: UserRole;
  search?: string;
}

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
 * Update user request
 */
export interface UpdateUserRequest {
  name?: string;
  email?: string;
}

/**
 * Update role request
 */
export interface UpdateRoleRequest {
  role: UserRole;
}

/**
 * Get list of users
 *
 * @param filters - Optional filters (page, limit, role, search)
 * @returns Promise with users list and pagination
 */
export async function getUsers(
  filters?: UserFilters
): Promise<UsersListResponse> {
  const params = new URLSearchParams();

  if (filters?.page) params.append('page', filters.page.toString());
  if (filters?.limit) params.append('limit', filters.limit.toString());
  if (filters?.role) params.append('role', filters.role);
  if (filters?.search) params.append('search', filters.search);

  const response = await adminApiClient.get<UsersListResponse>(
    `/admin/users?${params.toString()}`
  );

  return response.data;
}

/**
 * Get user by ID
 *
 * @param userId - User ID
 * @returns Promise with user details including profile
 */
export async function getUserById(userId: string): Promise<UserWithProfile> {
  const response = await adminApiClient.get<UserWithProfile>(
    `/admin/users/${userId}`
  );

  return response.data;
}

/**
 * Create new user
 *
 * @param userData - User data (email, password, name, role)
 * @returns Promise with created user
 */
export async function createUser(userData: CreateUserRequest): Promise<User> {
  const response = await adminApiClient.post<User>('/admin/users', userData);

  return response.data;
}

/**
 * Update user
 *
 * @param userId - User ID
 * @param userData - User data to update (name, email)
 * @returns Promise with updated user
 */
export async function updateUser(
  userId: string,
  userData: UpdateUserRequest
): Promise<User> {
  const response = await adminApiClient.put<User>(
    `/admin/users/${userId}`,
    userData
  );

  return response.data;
}

/**
 * Update user role
 *
 * @param userId - User ID
 * @param role - New role
 * @returns Promise with updated user role info
 */
export async function updateUserRole(
  userId: string,
  role: UserRole
): Promise<{ id: string; role: UserRole; updatedAt: string }> {
  const response = await adminApiClient.put<{
    id: string;
    role: UserRole;
    updatedAt: string;
  }>(`/admin/users/${userId}/role`, { role });

  return response.data;
}

/**
 * Delete user
 *
 * @param userId - User ID
 * @returns Promise that resolves when user is deleted
 */
export async function deleteUser(userId: string): Promise<void> {
  await adminApiClient.delete(`/admin/users/${userId}`);
}
