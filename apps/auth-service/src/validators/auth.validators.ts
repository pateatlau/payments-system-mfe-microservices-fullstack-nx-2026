/**
 * Auth Validators
 *
 * Zod schemas for request validation
 *
 * Enhanced with:
 * - Text sanitization (XSS prevention)
 * - UUID validation for path parameters
 * - Email validation for path parameters
 * - Length limits on all text fields
 */

import { z } from 'zod';
import { UserRole } from 'shared-types';

// ============================================================================
// SECURITY: Text Sanitization
// ============================================================================

/**
 * Sanitize string input to prevent XSS attacks
 * - Removes HTML tags
 * - Trims whitespace
 * - Normalizes unicode
 */
function sanitizeString(value: string): string {
  return value
    .trim()
    .normalize('NFC')
    // Remove HTML tags
    .replace(/<[^>]*>/g, '')
    // Remove script-like patterns
    .replace(/javascript:/gi, '')
    .replace(/on\w+\s*=/gi, '')
    // Remove null bytes
    .replace(/\0/g, '');
}

/**
 * Create a sanitized string schema with optional length constraints
 */
const sanitizedString = (minLength = 0, maxLength?: number) => {
  const baseSchema = z.string().transform(sanitizeString);

  if (minLength > 0 && maxLength !== undefined) {
    return baseSchema.pipe(
      z
        .string()
        .min(minLength, `Must be at least ${minLength} characters`)
        .max(maxLength, `Must be at most ${maxLength} characters`)
    );
  } else if (minLength > 0) {
    return baseSchema.pipe(
      z.string().min(minLength, `Must be at least ${minLength} characters`)
    );
  } else if (maxLength !== undefined) {
    return baseSchema.pipe(
      z.string().max(maxLength, `Must be at most ${maxLength} characters`)
    );
  }

  return baseSchema;
};

// ============================================================================
// SECURITY: UUID Validation for Path Parameters
// ============================================================================

/**
 * Schema for validating UUID path parameters
 */
export const uuidParamSchema = z.object({
  id: z.string().uuid('Invalid ID format'),
});

export type UuidParam = z.infer<typeof uuidParamSchema>;

/**
 * Schema for validating email path parameters
 */
export const emailParamSchema = z.object({
  email: z.string().email('Invalid email format'),
});

export type EmailParam = z.infer<typeof emailParamSchema>;

// ============================================================================
// SCHEMAS: Password Validation
// ============================================================================

/**
 * Password validation schema
 * Banking-grade requirements: 12+ chars, uppercase, lowercase, number, symbol
 */
const passwordSchema = z
  .string()
  .min(12, 'Password must be at least 12 characters')
  .max(255, 'Password must be at most 255 characters')
  .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
  .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
  .regex(/[0-9]/, 'Password must contain at least one number')
  .regex(
    /[^A-Za-z0-9]/,
    'Password must contain at least one special character'
  );

// ============================================================================
// SCHEMAS: Registration
// ============================================================================

/**
 * Registration request schema
 * Enhanced with:
 * - Sanitized name (XSS prevention)
 * - Email max length
 */
export const registerSchema = z.object({
  email: z.string().email('Invalid email format').max(255),
  password: passwordSchema,
  // Enhanced: Sanitized name with length limits
  name: sanitizedString(1, 255),
  role: z.nativeEnum(UserRole).optional().default(UserRole.CUSTOMER),
});

export type RegisterInput = z.infer<typeof registerSchema>;

// ============================================================================
// SCHEMAS: Login
// ============================================================================

/**
 * Login request schema
 */
export const loginSchema = z.object({
  email: z.string().email('Invalid email format').max(255),
  password: z.string().min(1, 'Password is required').max(255),
});

export type LoginInput = z.infer<typeof loginSchema>;

// ============================================================================
// SCHEMAS: Token Management
// ============================================================================

/**
 * Refresh token request schema
 */
export const refreshTokenSchema = z.object({
  refreshToken: z.string().min(1, 'Refresh token is required').max(2048),
});

export type RefreshTokenInput = z.infer<typeof refreshTokenSchema>;

// ============================================================================
// SCHEMAS: Password Change
// ============================================================================

/**
 * Change password request schema
 */
export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required').max(255),
  newPassword: passwordSchema,
});

export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;

// ============================================================================
// EXPORT: Utilities for reuse
// ============================================================================

export { sanitizeString, sanitizedString };
