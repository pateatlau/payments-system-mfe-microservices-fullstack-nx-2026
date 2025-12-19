/**
 * Profile Types
 *
 * TypeScript types for Profile Service API
 * These types match the backend UserProfile model and API responses
 *
 * All types are strict (no `any`) and match the backend Prisma schema and API contracts.
 */

/**
 * User profile interface
 *
 * Matches UserProfile model from Profile Service Prisma schema.
 * Dates (createdAt, updatedAt) are serialized as ISO strings in JSON responses.
 * Preferences can be null if not set, or a UserPreferences object.
 *
 * @see apps/profile-service/prisma/schema.prisma - UserProfile model
 * @see apps/profile-service/src/controllers/profile.controller.ts - getProfile()
 */
export interface Profile {
  /** Unique profile ID (UUID) */
  id: string;
  /** User ID reference (no foreign key, validated via Auth Service) */
  userId: string;
  /** Phone number (optional, nullable) */
  phone: string | null;
  /** Address (optional, nullable) */
  address: string | null;
  /** Avatar image URL (optional, nullable) */
  avatarUrl: string | null;
  /** Bio/description (optional, nullable) */
  bio: string | null;
  /** User preferences (optional, nullable - can be null if not set) */
  preferences: UserPreferences | null;
  /** Profile creation timestamp (ISO string) */
  createdAt: string;
  /** Profile last update timestamp (ISO string) */
  updatedAt: string;
}

/**
 * User preferences interface
 *
 * Matches the preferences JSON field structure from UserProfile model.
 * All fields are optional - preferences are merged with existing values on update.
 *
 * @see apps/profile-service/src/validators/profile.validators.ts - updatePreferencesSchema
 * @see apps/profile-service/src/services/profile.service.ts - updatePreferences()
 */
export interface UserPreferences {
  /** UI theme preference */
  theme?: 'light' | 'dark' | 'system';
  /** Language code (ISO 639-1, e.g., 'en', 'es', 'en-US') */
  language?: string;
  /** Currency code (ISO 4217, e.g., 'USD', 'EUR') */
  currency?: string;
  /** Timezone (IANA timezone, e.g., 'America/New_York') */
  timezone?: string;
  /** Notification preferences */
  notifications?: {
    /** Email notifications enabled */
    email?: boolean;
    /** Push notifications enabled */
    push?: boolean;
    /** SMS notifications enabled */
    sms?: boolean;
  };
}

/**
 * Update profile data
 *
 * Request payload for updating user profile.
 * Maps to UpdateProfileData in Profile Service.
 * All fields are optional - only provided fields will be updated.
 *
 * Note: Field name is `phoneNumber` (not `phone`) to match backend validator.
 *
 * @see apps/profile-service/src/validators/profile.validators.ts - updateProfileSchema
 * @see apps/profile-service/src/services/profile.service.ts - updateProfile()
 */
export interface UpdateProfileData {
  /** Phone number (10-20 characters) */
  phoneNumber?: string;
  /** Address (1-500 characters) */
  address?: string;
  /** Avatar image URL (valid URL) */
  avatarUrl?: string;
  /** Bio/description (max 1000 characters) */
  bio?: string;
}

/**
 * Update preferences data
 *
 * Request payload for updating user preferences.
 * Maps to UpdatePreferencesData in Profile Service.
 * All fields are optional - preferences are merged with existing values.
 *
 * @see apps/profile-service/src/validators/profile.validators.ts - updatePreferencesSchema
 * @see apps/profile-service/src/services/profile.service.ts - updatePreferences()
 */
export interface UpdatePreferencesData {
  /** UI theme preference */
  theme?: 'light' | 'dark' | 'system';
  /** Language code (2-5 characters, e.g., 'en', 'es', 'en-US') */
  language?: string;
  /** Currency code (3 characters, ISO 4217) */
  currency?: string;
  /** Timezone (IANA timezone, e.g., 'America/New_York') */
  timezone?: string;
  /** Notification preferences */
  notifications?: {
    /** Email notifications enabled */
    email?: boolean;
    /** Push notifications enabled */
    push?: boolean;
    /** SMS notifications enabled */
    sms?: boolean;
  };
}
