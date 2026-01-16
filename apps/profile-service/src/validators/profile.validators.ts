/**
 * Profile Request Validators
 *
 * Enhanced with:
 * - Text sanitization (XSS prevention)
 * - Length limits on all text fields
 * - Phone number format validation
 * - Timezone validation pattern
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
// CONSTANTS: Validation Patterns
// ============================================================================

/**
 * Phone number validation pattern
 * Allows: +1234567890, (123) 456-7890, 123-456-7890, +1 (555) 123-4567, etc.
 * Validates that string contains mostly digits with allowed separators
 */
const PHONE_PATTERN = /^[+]?[\d\s().\-/]+$/;

/**
 * Timezone validation pattern
 * Matches IANA timezone format including multi-part zones:
 * - America/New_York, Europe/London (two-part)
 * - America/Indiana/Indianapolis, America/Argentina/Buenos_Aires (multi-part)
 * - UTC (special case)
 */
const TIMEZONE_PATTERN = /^[A-Za-z_]+(?:\/[A-Za-z_]+)+$|^UTC$/;

/**
 * Language code pattern (ISO 639-1 / BCP 47)
 * Matches: en, es, en-US, zh-CN, etc.
 */
const LANGUAGE_PATTERN = /^[a-z]{2}(-[A-Z]{2})?$/;

/**
 * Currency code pattern (ISO 4217)
 * Must be 3 uppercase letters
 */
const CURRENCY_PATTERN = /^[A-Z]{3}$/;

// ============================================================================
// SCHEMAS: Update Profile
// ============================================================================

/**
 * Update profile schema
 * Maps to UserProfile model fields: phone, address, avatarUrl, bio
 *
 * Enhanced with:
 * - Phone number format validation
 * - Sanitized address (XSS prevention)
 * - Sanitized bio (XSS prevention)
 */
export const updateProfileSchema = z.object({
  // Enhanced: Phone number with format validation
  phoneNumber: z
    .string()
    .min(10, 'Phone number must be at least 10 characters')
    .max(20, 'Phone number must be at most 20 characters')
    .regex(PHONE_PATTERN, 'Invalid phone number format')
    .optional(),

  // Enhanced: Sanitized address
  address: sanitizedString(1, 500).optional(),

  // Avatar URL validation
  // TODO: Replace base64 data URL validation with proper URL validation
  // once file upload to cloud storage (S3) is implemented
  avatarUrl: z
    .union([
      z.string().url().max(2048), // Max URL length
      // Base64 encoding expands data by ~4/3, so 2MB decoded ≈ 2.67MB base64 string
      // Using Math.ceil(2 * 1024 * 1024 * 4 / 3) = 2796203 characters
      z.string().startsWith('data:').max(2796203),
      z.literal(''), // Allow empty string to clear avatar
    ])
    .optional(),

  // Enhanced: Sanitized bio
  bio: sanitizedString(0, 1000).optional(),
});

export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;

// ============================================================================
// SCHEMAS: Get Preferences
// ============================================================================

/**
 * Get preferences schema (query params)
 * Enhanced with sanitization
 */
export const getPreferencesSchema = z.object({
  category: sanitizedString(0, 100).optional(),
});

export type GetPreferencesInput = z.infer<typeof getPreferencesSchema>;

// ============================================================================
// SCHEMAS: Update Preferences
// ============================================================================

/**
 * Update preferences schema
 * Enhanced with:
 * - Strict enum for theme
 * - Language code validation
 * - Currency code validation (uppercase)
 * - Timezone validation
 */
export const updatePreferencesSchema = z.object({
  theme: z.enum(['light', 'dark', 'system']).optional(),

  // Enhanced: Language code validation
  language: z
    .string()
    .min(2)
    .max(5)
    .regex(LANGUAGE_PATTERN, 'Invalid language code format (e.g., en, en-US)')
    .optional(),

  // Enhanced: Currency code validation with uppercase transform
  currency: z
    .string()
    .length(3, 'Currency code must be exactly 3 characters')
    .transform((val) => val.toUpperCase())
    .pipe(
      z
        .string()
        .regex(CURRENCY_PATTERN, 'Invalid currency code format (e.g., USD)')
    )
    .optional(),

  notifications: z
    .object({
      email: z.boolean().optional(),
      push: z.boolean().optional(),
      sms: z.boolean().optional(),
    })
    .optional(),

  // Enhanced: Timezone validation
  timezone: z
    .string()
    .max(50)
    .regex(
      TIMEZONE_PATTERN,
      'Invalid timezone format (e.g., America/New_York, UTC)'
    )
    .optional(),
});

export type UpdatePreferencesInput = z.infer<typeof updatePreferencesSchema>;

// ============================================================================
// EXPORT: Utilities for reuse
// ============================================================================

export { sanitizeString, sanitizedString };
