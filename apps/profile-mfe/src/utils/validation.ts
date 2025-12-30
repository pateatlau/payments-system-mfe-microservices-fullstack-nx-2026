/**
 * Profile Validation Schemas
 *
 * Zod schemas for form validation in Profile MFE.
 * These schemas match the backend validators for consistency.
 *
 * @see apps/profile-service/src/validators/profile.validators.ts - Backend validators
 */

import { z } from 'zod';

/**
 * Update profile schema
 *
 * Matches backend updateProfileSchema validator.
 * All fields are optional - only provided fields will be validated and updated.
 *
 * Validation rules:
 * - phoneNumber: 10-20 characters (if provided and not empty)
 * - address: 1-500 characters (if provided and not empty)
 * - avatarUrl: Valid URL (if provided and not empty)
 * - bio: Max 1000 characters (if provided)
 *
 * Note: Empty strings are allowed for UX (to clear fields). Form components
 * should convert empty strings to undefined before submitting to API.
 *
 * @see apps/profile-service/src/validators/profile.validators.ts - updateProfileSchema
 */
export const updateProfileSchema = z.object({
  phoneNumber: z
    .union([
      z
        .string()
        .min(10, 'Phone number must be at least 10 characters')
        .max(20, 'Phone number must be at most 20 characters'),
      z.literal(''), // Allow empty string to clear phone number
    ])
    .optional(),
  address: z
    .union([
      z
        .string()
        .min(1, 'Address cannot be empty')
        .max(500, 'Address must be at most 500 characters'),
      z.literal(''), // Allow empty string to clear address
    ])
    .optional(),
  // TODO: Replace base64 data URL validation with proper URL validation
  // once file upload to cloud storage (S3) is implemented
  avatarUrl: z
    .union([
      z.string().url('Avatar URL must be a valid URL'),
      z.string().startsWith('data:', 'Avatar must be a valid image'), // Allow base64 data URLs
      z.literal(''), // Allow empty string to clear avatar
    ])
    .optional(),
  bio: z
    .union([
      z.string().max(1000, 'Bio must be at most 1000 characters'),
      z.literal(''), // Allow empty string to clear bio
    ])
    .optional(),
});

/**
 * Update preferences schema
 *
 * Matches backend updatePreferencesSchema validator.
 * All fields are optional - preferences are merged with existing values.
 *
 * Validation rules:
 * - theme: Must be 'light', 'dark', or 'system' (if provided)
 * - language: 2-5 characters, e.g., 'en', 'es', 'en-US' (if provided)
 * - currency: Exactly 3 characters (ISO 4217 currency code) (if provided)
 * - timezone: IANA timezone string, e.g., 'America/New_York' (if provided)
 * - notifications: Object with email, push, sms booleans (if provided)
 *
 * @see apps/profile-service/src/validators/profile.validators.ts - updatePreferencesSchema
 */
export const updatePreferencesSchema = z.object({
  theme: z.enum(['light', 'dark', 'system']).optional(),
  language: z
    .string()
    .min(2, 'Language code must be at least 2 characters')
    .max(5, 'Language code must be at most 5 characters')
    .optional(),
  currency: z
    .string()
    .length(3, 'Currency code must be exactly 3 characters (ISO 4217)')
    .optional(),
  timezone: z.string().optional(), // IANA timezone, e.g., 'America/New_York'
  notifications: z
    .object({
      email: z.boolean().optional(),
      push: z.boolean().optional(),
      sms: z.boolean().optional(),
    })
    .optional(),
});

/**
 * Inferred TypeScript types from Zod schemas
 *
 * Use these types for form data in React Hook Form:
 * ```typescript
 * import { updateProfileSchema, type UpdateProfileFormData } from '../utils/validation';
 * import { useForm } from 'react-hook-form';
 * import { zodResolver } from '@hookform/resolvers/zod';
 *
 * const form = useForm<UpdateProfileFormData>({
 *   resolver: zodResolver(updateProfileSchema),
 * });
 * ```
 */
export type UpdateProfileFormData = z.infer<typeof updateProfileSchema>;
export type UpdatePreferencesFormData = z.infer<typeof updatePreferencesSchema>;
