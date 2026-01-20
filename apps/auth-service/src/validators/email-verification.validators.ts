/**
 * Email Verification Validators
 *
 * Zod schemas for email verification request validation
 *
 * POC-3: Email Verification Implementation (Priority 1.2)
 */

import { z } from 'zod';

// ============================================================================
// SCHEMAS: Email Verification
// ============================================================================

/**
 * Verify email request schema (POST /auth/verify-email)
 * Accepts JWT token in request body
 */
export const verifyEmailSchema = z.object({
  token: z
    .string()
    .min(1, 'Verification token is required')
    .max(2048, 'Invalid verification token'),
});

export type VerifyEmailInput = z.infer<typeof verifyEmailSchema>;

/**
 * Verify email path parameter schema (GET /auth/verify-email/:token)
 * Accepts JWT token as URL parameter
 */
export const verifyEmailParamSchema = z.object({
  token: z
    .string()
    .min(1, 'Verification token is required')
    .max(2048, 'Invalid verification token'),
});

export type VerifyEmailParam = z.infer<typeof verifyEmailParamSchema>;

/**
 * Resend verification request schema (POST /auth/resend-verification)
 * Only requires email address
 */
export const resendVerificationSchema = z.object({
  email: z.string().email('Invalid email format').max(255),
});

export type ResendVerificationInput = z.infer<typeof resendVerificationSchema>;
