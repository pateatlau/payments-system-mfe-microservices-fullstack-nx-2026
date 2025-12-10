/**
 * Admin API Client
 *
 * Dedicated API client for Admin Service (port 3003)
 * Configured to use the Admin Service base URL
 *
 * Note: This client does NOT handle token refresh itself.
 * Token refresh is handled by the auth store's API client.
 * This client just reads the current token from the store.
 */

import { ApiClient } from '@mfe/shared-api-client';
import { useAuthStore } from 'shared-auth-store';

/**
 * Admin Service API Client instance
 *
 * Points to Admin Service on port 3003
 * Reads tokens from auth store (no automatic refresh to avoid conflicts)
 */
export const adminApiClient = new ApiClient({
  baseURL: 'http://localhost:3003/api',
  refreshURL: 'http://localhost:3001', // Auth Service handles token refresh
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
