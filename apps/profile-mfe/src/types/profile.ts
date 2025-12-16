/**
 * Profile Types
 *
 * TypeScript types for Profile Service API
 * These types match the backend UserProfile model and API responses
 */

/**
 * User profile interface
 * Matches UserProfile model from Profile Service
 */
export interface Profile {
  id: string;
  userId: string;
  phone: string | null;
  address: string | null;
  avatarUrl: string | null;
  bio: string | null;
  preferences: UserPreferences | null;
  createdAt: string;
  updatedAt: string;
}

/**
 * User preferences interface
 * Matches the preferences JSON field structure
 */
export interface UserPreferences {
  theme?: 'light' | 'dark' | 'system';
  language?: string;
  currency?: string;
  timezone?: string;
  notifications?: {
    email?: boolean;
    push?: boolean;
    sms?: boolean;
  };
}

/**
 * Update profile data
 * Maps to UpdateProfileData in Profile Service
 */
export interface UpdateProfileData {
  phoneNumber?: string;
  address?: string;
  avatarUrl?: string;
  bio?: string;
}

/**
 * Update preferences data
 * Maps to UpdatePreferencesData in Profile Service
 */
export interface UpdatePreferencesData {
  theme?: 'light' | 'dark' | 'system';
  language?: string;
  currency?: string;
  timezone?: string;
  notifications?: {
    email?: boolean;
    push?: boolean;
    sms?: boolean;
  };
}
