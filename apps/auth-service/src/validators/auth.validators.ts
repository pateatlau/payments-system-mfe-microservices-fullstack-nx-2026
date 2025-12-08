/**
 * Auth Validators
 *
 * Zod schemas for request validation
 */

import { z } from 'zod';
import { UserRole } from 'shared-types';

/**
 * Password validation schema
 * Banking-grade requirements: 12+ chars, uppercase, lowercase, number, symbol
 */
const passwordSchema = z
  .string()
  .min(12, 'Password must be at least 12 characters')
  .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
  .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
  .regex(/[0-9]/, 'Password must contain at least one number')
  .regex(
    /[^A-Za-z0-9]/,
    'Password must contain at least one special character'
  );

/**
 * Registration request schema
 */
export const registerSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: passwordSchema,
  name: z.string().min(1, 'Name is required'),
  role: z.nativeEnum(UserRole).optional().default(UserRole.CUSTOMER),
});

export type RegisterInput = z.infer<typeof registerSchema>;

/**
 * Login request schema
 */
export const loginSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(1, 'Password is required'),
});

export type LoginInput = z.infer<typeof loginSchema>;

/**
 * Refresh token request schema
 */
export const refreshTokenSchema = z.object({
  refreshToken: z.string().min(1, 'Refresh token is required'),
});

export type RefreshTokenInput = z.infer<typeof refreshTokenSchema>;

/**
 * Change password request schema
 */
export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: passwordSchema,
});

export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;
