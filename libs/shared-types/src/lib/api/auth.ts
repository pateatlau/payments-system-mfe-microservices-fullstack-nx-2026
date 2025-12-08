/**
 * Auth API Types
 *
 * Request and response types for Auth Service endpoints
 */

import { User, UserProfile } from '../models/user';
import { UserRole } from '../enums';
import { ApiResponse } from './common';

/**
 * Register request
 */
export interface RegisterRequest {
  email: string;
  password: string;
  name: string;
  role?: UserRole;
}

/**
 * Register response data
 */
export interface RegisterResponseData {
  user: User;
  accessToken: string;
  refreshToken: string;
}

/**
 * Register response
 */
export type RegisterResponse = ApiResponse<RegisterResponseData>;

/**
 * Login request
 */
export interface LoginRequest {
  email: string;
  password: string;
}

/**
 * Login response data
 */
export interface LoginResponseData {
  user: User;
  accessToken: string;
  refreshToken: string;
}

/**
 * Login response
 */
export type LoginResponse = ApiResponse<LoginResponseData>;

/**
 * Refresh token request
 */
export interface RefreshTokenRequest {
  refreshToken: string;
}

/**
 * Refresh token response data
 */
export interface RefreshTokenResponseData {
  accessToken: string;
  refreshToken: string;
}

/**
 * Refresh token response
 */
export type RefreshTokenResponse = ApiResponse<RefreshTokenResponseData>;

/**
 * Change password request
 */
export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
}

/**
 * Change password response
 */
export type ChangePasswordResponse = ApiResponse<null>;

/**
 * Get current user response
 */
export type GetCurrentUserResponse = ApiResponse<User>;
