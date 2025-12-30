/**
 * Profile Request Validators
 */

import { z } from 'zod';

/**
 * Update profile schema
 * Maps to UserProfile model fields: phone, address, avatarUrl, bio
 */
export const updateProfileSchema = z.object({
  phoneNumber: z.string().min(10).max(20).optional(), // maps to 'phone'
  address: z.string().min(1).max(500).optional(),
  // TODO: Replace base64 data URL validation with proper URL validation
  // once file upload to cloud storage (S3) is implemented
  avatarUrl: z
    .union([
      z.string().url(),
      z.string().startsWith('data:'), // Allow base64 data URLs temporarily
      z.literal(''), // Allow empty string to clear avatar
    ])
    .optional(),
  bio: z.string().max(1000).optional(),
});

/**
 * Get preferences schema (query params)
 */
export const getPreferencesSchema = z.object({
  category: z.string().optional(),
});

/**
 * Update preferences schema
 */
export const updatePreferencesSchema = z.object({
  theme: z.enum(['light', 'dark', 'system']).optional(),
  language: z.string().min(2).max(5).optional(), // e.g., 'en', 'es', 'en-US'
  currency: z.string().length(3).optional(), // ISO 4217 currency code
  notifications: z
    .object({
      email: z.boolean().optional(),
      push: z.boolean().optional(),
      sms: z.boolean().optional(),
    })
    .optional(),
  timezone: z.string().optional(), // e.g., 'America/New_York'
});
