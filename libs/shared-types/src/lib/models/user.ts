/**
 * User Model
 *
 * User model types matching the Prisma schema
 */

import type { UserRole } from '../enums';

/**
 * User model
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
 * User profile model
 */
export interface UserProfile {
  id: string;
  userId: string;
  phone?: string;
  address?: string;
  bio?: string;
  preferences?: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}
