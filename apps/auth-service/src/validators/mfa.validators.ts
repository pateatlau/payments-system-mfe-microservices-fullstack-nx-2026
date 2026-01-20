/**
 * MFA Validators
 *
 * Zod schemas for MFA request validation
 *
 * POC-3 Backend Hardening - Priority 7.1: Multi-Factor Authentication
 */

import { z } from 'zod';

// ============================================================================
// SCHEMAS: MFA Setup Verification
// ============================================================================

/**
 * Schema for verifying MFA setup with TOTP code
 */
export const mfaSetupVerifySchema = z.object({
  totpCode: z
    .string()
    .regex(/^\d{6}$/, 'TOTP code must be exactly 6 digits'),
});

export type MfaSetupVerifyInput = z.infer<typeof mfaSetupVerifySchema>;

// ============================================================================
// SCHEMAS: MFA Verification (Login)
// ============================================================================

/**
 * Schema for verifying MFA during login
 * Accepts either 6-digit TOTP code or 8-character backup code
 */
export const mfaVerifySchema = z.object({
  userId: z.string().uuid('Invalid user ID format'),
  code: z
    .string()
    .min(6, 'Code must be at least 6 characters')
    .max(8, 'Code must be at most 8 characters')
    .transform((val) => val.replace(/\s/g, '').toUpperCase()),
});

export type MfaVerifyInput = z.infer<typeof mfaVerifySchema>;

// ============================================================================
// SCHEMAS: MFA Disable
// ============================================================================

/**
 * Schema for disabling MFA
 * Requires password and TOTP code for security
 */
export const mfaDisableSchema = z.object({
  password: z.string().min(1, 'Password is required').max(255),
  totpCode: z
    .string()
    .regex(/^\d{6}$/, 'TOTP code must be exactly 6 digits'),
});

export type MfaDisableInput = z.infer<typeof mfaDisableSchema>;

// ============================================================================
// SCHEMAS: Backup Codes Regeneration
// ============================================================================

/**
 * Schema for regenerating backup codes
 * Requires current TOTP code for verification
 */
export const mfaRegenerateBackupCodesSchema = z.object({
  totpCode: z
    .string()
    .regex(/^\d{6}$/, 'TOTP code must be exactly 6 digits'),
});

export type MfaRegenerateBackupCodesInput = z.infer<
  typeof mfaRegenerateBackupCodesSchema
>;

// ============================================================================
// SCHEMAS: MFA Login (Step 2 of login with MFA)
// ============================================================================

/**
 * Schema for completing login with MFA
 * Used when user has MFA enabled and needs to provide code after password
 */
export const mfaLoginCompleteSchema = z.object({
  mfaToken: z.string().min(1, 'MFA token is required'), // Temporary token from step 1
  code: z
    .string()
    .min(6, 'Code must be at least 6 characters')
    .max(8, 'Code must be at most 8 characters')
    .transform((val) => val.replace(/\s/g, '').toUpperCase()),
});

export type MfaLoginCompleteInput = z.infer<typeof mfaLoginCompleteSchema>;
