/**
 * Profile API Client (via API Gateway - POC-3)
 *
 * Development: Direct to API Gateway (http://localhost:3000)
 * Production: Through nginx proxy (https://localhost)
 *
 * URL Structure:
 * Development:
 * - Frontend → API Gateway: http://localhost:3000/api/profile/*
 * - API Gateway → Profile Service: http://localhost:3004/api/profile/*
 *
 * Production:
 * - Frontend: https://localhost/api/profile/*
 * - nginx → API Gateway: http://localhost:3000/api/profile/*
 * - API Gateway → Profile Service: http://localhost:3004/api/profile/*
 *
 * Note: This client does NOT handle token refresh itself.
 * Token refresh is handled by the auth store's API client.
 * This client just reads the current token from the store.
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
  // Development: http://localhost:3000/api
  // Production: https://localhost/api
  baseURL: envBaseURL || 'http://localhost:3000/api',
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
 * @returns Promise resolving to the user's profile
 * @throws Error if request fails or user is not authenticated
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
 * @param data - Profile update data (phoneNumber, address, avatarUrl, bio)
 * @returns Promise resolving to the updated profile
 * @throws Error if request fails or user is not authenticated
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
