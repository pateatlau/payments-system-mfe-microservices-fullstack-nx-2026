/**
 * Admin Service Request Validators
 *
 * Enhanced with:
 * - Text sanitization (XSS prevention)
 * - UUID validation for path parameters
 * - Strict enum validation for roles and audit actions
 * - Length limits on all text fields
 */

import { z } from 'zod';

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
 * Sanitizes input then validates length
 */
const sanitizedString = (minLength = 0, maxLength?: number) => {
  // Base: transform to sanitize the string
  const baseSchema = z.string().transform(sanitizeString);

  // Build validation chain based on constraints
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
// SECURITY: UUID Validation for IDs
// ============================================================================

/**
 * Schema for validating UUID path parameters
 */
export const uuidParamSchema = z.object({
  id: z.string().uuid('Invalid ID format'),
});

export type UuidParam = z.infer<typeof uuidParamSchema>;

// ============================================================================
// CONSTANTS: Role Enum
// ============================================================================

/**
 * Valid user roles (whitelist)
 */
export const USER_ROLES = ['ADMIN', 'CUSTOMER', 'VENDOR'] as const;

export type UserRoleType = (typeof USER_ROLES)[number];

// ============================================================================
// CONSTANTS: Audit Log Actions and Resource Types
// ============================================================================

/**
 * Valid audit log actions (strict enum for filtering)
 */
export const AUDIT_ACTIONS = [
  // User management actions
  'USER_CREATED',
  'USER_UPDATED',
  'USER_DELETED',
  'USER_ROLE_CHANGED',
  'USER_STATUS_CHANGED',
  // Authentication events
  'USER_REGISTERED',
  'USER_LOGIN',
  'USER_LOGOUT',
  'USER_PASSWORD_CHANGED',
  // Payment events
  'PAYMENT_CREATED',
  'PAYMENT_UPDATED',
  'PAYMENT_COMPLETED',
  'PAYMENT_FAILED',
  'PAYMENT_CANCELLED',
  // System events
  'SYSTEM_CONFIG_CHANGED',
] as const;

export type AuditActionType = (typeof AUDIT_ACTIONS)[number];

/**
 * Valid resource types (strict enum for filtering)
 */
export const RESOURCE_TYPES = [
  'user',
  'payment',
  'system_config',
  'session',
] as const;

export type ResourceTypeValue = (typeof RESOURCE_TYPES)[number];

// ============================================================================
// SCHEMAS: List Users Query
// ============================================================================

/**
 * List users query parameters
 * - Strict enum validation for role filter
 * - Sanitized search term
 * - Pagination with limits
 */
export const listUsersSchema = z.object({
  page: z.coerce.number().int().positive().optional().default(1),
  limit: z.coerce.number().int().positive().max(100).optional().default(10),
  sort: z
    .enum(['createdAt', 'email', 'name', 'role'])
    .optional()
    .default('createdAt'),
  order: z.enum(['asc', 'desc']).optional().default('desc'),
  // Enhanced: Strict enum validation instead of any string
  role: z.enum(USER_ROLES).optional(),
  // Enhanced: Sanitized search term with max length
  search: sanitizedString(0, 255).optional(),
  // Note: isActive not yet in schema - will be added in future
});

export type ListUsersQuery = z.infer<typeof listUsersSchema>;

// ============================================================================
// SCHEMAS: Audit Logs Query
// ============================================================================

/**
 * Audit logs query parameters
 * - Strict enum validation for action and resourceType filters
 * - UUID validation for userId filter
 * - Date range validation
 * - Pagination with limits
 */
export const auditLogsQuerySchema = z.object({
  page: z.coerce.number().int().positive().optional().default(1),
  limit: z.coerce.number().int().positive().max(100).optional().default(20),
  // Enhanced: Strict enum validation for action
  action: z.enum(AUDIT_ACTIONS).optional(),
  // Enhanced: UUID validation for userId
  userId: z.string().uuid('Invalid user ID format').optional(),
  // Enhanced: Strict enum validation for resourceType
  resourceType: z.enum(RESOURCE_TYPES).optional(),
  // Date range filters with coercion
  startDate: z.coerce.date().optional(),
  endDate: z.coerce.date().optional(),
});

export type AuditLogsQuery = z.infer<typeof auditLogsQuerySchema>;

// ============================================================================
// SCHEMAS: Update User
// ============================================================================

/**
 * Update user request body
 * Enhanced with:
 * - Sanitized name (XSS prevention)
 * - Email validation
 */
export const updateUserSchema = z.object({
  // Enhanced: Sanitized name with length limits
  name: sanitizedString(1, 255).optional(),
  email: z.string().email().max(255).optional(),
});

export type UpdateUserRequest = z.infer<typeof updateUserSchema>;

// ============================================================================
// SCHEMAS: Update User Role
// ============================================================================

/**
 * Update user role request body
 * - Strict enum validation for role
 */
export const updateUserRoleSchema = z.object({
  role: z.enum(USER_ROLES),
});

export type UpdateUserRoleRequest = z.infer<typeof updateUserRoleSchema>;

// ============================================================================
// SCHEMAS: Update User Status
// ============================================================================

/**
 * Activate/Deactivate user request body
 * Enhanced with:
 * - Sanitized reason text (XSS prevention)
 */
export const updateUserStatusSchema = z.object({
  isActive: z.boolean(),
  // Enhanced: Sanitized reason with length limit
  reason: sanitizedString(0, 500).optional(),
});

export type UpdateUserStatusRequest = z.infer<typeof updateUserStatusSchema>;

// ============================================================================
// SCHEMAS: Create User
// ============================================================================

/**
 * Password validation requirements (banking-grade)
 * - At least 12 characters
 * - Contains uppercase letter
 * - Contains lowercase letter
 * - Contains number
 * - Contains special character
 */
const passwordSchema = z
  .string()
  .min(12, 'Password must be at least 12 characters')
  .max(255, 'Password must be at most 255 characters')
  .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
  .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
  .regex(/[0-9]/, 'Password must contain at least one number')
  .regex(
    /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/,
    'Password must contain at least one special character'
  );

/**
 * Create user request body
 * Enhanced with:
 * - Sanitized name (XSS prevention)
 * - Email validation with max length
 * - Strong password validation
 * - Strict role enum validation
 */
export const createUserSchema = z.object({
  email: z.string().email().max(255),
  password: passwordSchema,
  // Enhanced: Sanitized name with length limits
  name: sanitizedString(1, 255),
  role: z.enum(USER_ROLES),
});

export type CreateUserRequest = z.infer<typeof createUserSchema>;

// ============================================================================
// EXPORT: Constants for reuse across services
// ============================================================================

export { sanitizeString, sanitizedString };
