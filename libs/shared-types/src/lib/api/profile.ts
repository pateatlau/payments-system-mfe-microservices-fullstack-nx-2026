/**
 * Profile API Types
 *
 * Request and response types for Profile Service endpoints
 */

import type { UserProfile } from '../models/user';
import type { ApiResponse } from './common';

/**
 * Get profile response
 */
export type GetProfileResponse = ApiResponse<UserProfile>;

/**
 * Update profile request
 */
export interface UpdateProfileRequest {
  phone?: string;
  address?: string;
  bio?: string;
  preferences?: Record<string, unknown>;
}

/**
 * Update profile response
 */
export type UpdateProfileResponse = ApiResponse<UserProfile>;
