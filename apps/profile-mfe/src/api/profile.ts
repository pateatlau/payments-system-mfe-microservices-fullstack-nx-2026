/**
 * Profile API Client
 *
 * Client for interacting with the Profile Service via API Gateway.
 * Handles all profile-related CRUD operations with proper authentication
 * and error handling.
 *
 * @module profile-api
 *
 * Routing Architecture:
 * - **Development**: Direct to API Gateway (http://localhost:3000/api/profile/*)
 * - **Production**: Through nginx proxy (https://localhost/api/profile/*)
 *
 * Service Flow:
 * Frontend → API Gateway → Profile Service (port 3004)
 *
 * @note This client does NOT handle token refresh itself.
 * Token refresh is managed by the auth store's API client.
 * This client reads the current access token from the auth store.
 *
 * @example
 * ```typescript
 * import { getProfile, updateProfile } from './api/profile';
 *
 * // Fetch user profile
 * const profile = await getProfile();
 *
 * // Update profile
 * const updated = await updateProfile({
 *   phoneNumber: '+1234567890',
 *   address: '123 Main St'
 * });
 * ```
 */

import { ApiClient } from '@mfe/shared-api-client';
import { useAuthStore } from 'shared-auth-store';
import type {
  Profile,
  UpdateProfileData,
  UserPreferences,
  UpdatePreferencesData,
} from '../types/profile';

// Access environment variable (replaced by DefinePlugin at build time)
const envBaseURL =
  typeof process !== 'undefined' && process.env
    ? (process.env as { NX_API_BASE_URL?: string }).NX_API_BASE_URL
    : undefined;

/**
 * Profile Service API Client instance
 *
 * Routes through API Gateway (via nginx)
 * Reads tokens from auth store (no automatic refresh to avoid conflicts)
 */
const profileApiClient = new ApiClient({
  // Use API Gateway URL
  // Always use HTTPS through nginx proxy (required for Safari compatibility)
  // Direct API Gateway access (http://localhost:3000/api) can be set via NX_API_BASE_URL
  baseURL: envBaseURL || 'https://localhost/api',
  timeout: 30000,
  tokenProvider: {
    getAccessToken: () => {
      return useAuthStore.getState().accessToken;
    },
    getRefreshToken: () => useAuthStore.getState().refreshToken,
    setTokens: (accessToken: string, refreshToken: string) => {
      // Update the auth store with new tokens
      useAuthStore.getState().setAccessToken(accessToken, refreshToken);
    },
    clearTokens: () => {
      useAuthStore.getState().logout();
    },
  },
  // When we get unauthorized, just logout (don't try to refresh)
  onUnauthorized: () => {
    useAuthStore.getState().logout();
  },
});

/**
 * Get current user's profile
 *
 * Fetches the authenticated user's complete profile information
 * including contact details, bio, avatar, and preferences.
 *
 * @async
 * @function getProfile
 * @returns {Promise<Profile>} Promise resolving to the user's profile object
 * @throws {Error} If request fails, user is not authenticated, or API returns an error
 *
 * @example
 * ```typescript
 * try {
 *   const profile = await getProfile();
 *   console.log('User name:', profile.name);
 *   console.log('Phone:', profile.phone);
 * } catch (error) {
 *   console.error('Failed to load profile:', error);
 * }
 * ```
 */
export async function getProfile(): Promise<Profile> {
  const response = await profileApiClient.get<Profile>('/profile');

  // ApiClient returns ApiResponse<T> which has { success, data }
  // Backend returns { success: true, data: Profile }
  // So response.data is the Profile object
  if (!response?.data) {
    throw new Error('Invalid response structure from profile API');
  }

  return response.data;
}

/**
 * Update current user's profile
 *
 * Updates the authenticated user's profile information. Only provided
 * fields will be updated - fields not included in the request remain unchanged.
 *
 * @async
 * @function updateProfile
 * @param {UpdateProfileData} data - Profile update data object
 * @param {string} [data.phoneNumber] - New phone number (10-20 characters)
 * @param {string} [data.address] - New address (max 500 characters)
 * @param {string} [data.avatarUrl] - New avatar URL (must be valid URL)
 * @param {string} [data.bio] - New bio text (max 1000 characters)
 * @returns {Promise<Profile>} Promise resolving to the updated profile object
 * @throws {Error} If request fails, user is not authenticated, or validation fails
 *
 * @example
 * ```typescript
 * try {
 *   const updatedProfile = await updateProfile({
 *     phoneNumber: '+1234567890',
 *     address: '123 Updated Street',
 *     bio: 'Updated bio information'
 *   });
 *   console.log('Profile updated:', updatedProfile);
 * } catch (error) {
 *   console.error('Failed to update profile:', error);
 * }
 * ```
 */
export async function updateProfile(data: UpdateProfileData): Promise<Profile> {
  const response = await profileApiClient.put<Profile>('/profile', data);

  if (!response?.data) {
    throw new Error('Invalid response structure from profile API');
  }

  return response.data;
}

/**
 * Get current user's preferences
 *
 * @returns Promise resolving to the user's preferences
 * @throws Error if request fails or user is not authenticated
 */
export async function getPreferences(): Promise<UserPreferences> {
  const response = await profileApiClient.get<UserPreferences>(
    '/profile/preferences'
  );

  if (!response?.data) {
    throw new Error('Invalid response structure from profile API');
  }

  return response.data;
}

/**
 * Update current user's preferences
 *
 * @param data - Preferences update data (theme, language, currency, timezone, notifications)
 * @returns Promise resolving to the updated preferences
 * @throws Error if request fails or user is not authenticated
 */
export async function updatePreferences(
  data: UpdatePreferencesData
): Promise<UserPreferences> {
  const response = await profileApiClient.put<UserPreferences>(
    '/profile/preferences',
    data
  );

  if (!response?.data) {
    throw new Error('Invalid response structure from profile API');
  }

  return response.data;
}
