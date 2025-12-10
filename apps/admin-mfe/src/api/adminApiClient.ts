/**
 * Admin API Client (via API Gateway - POC-3)
 *
 * Routes through nginx (https://localhost) → API Gateway (http://localhost:3000)
 * API Gateway proxies /api/admin/* to Admin Service (http://localhost:3003)
 *
 * URL Structure:
 * - Frontend: https://localhost/api/admin/*
 * - nginx → API Gateway: http://localhost:3000/api/admin/*
 * - API Gateway → Admin Service: http://localhost:3003/* (path rewritten)
 *
 * Note: This client does NOT handle token refresh itself.
 * Token refresh is handled by the auth store's API client.
 * This client just reads the current token from the store.
 */

import { ApiClient } from '@mfe/shared-api-client';
import { useAuthStore } from 'shared-auth-store';

// Access environment variable (replaced by DefinePlugin at build time)
const envBaseURL =
  typeof process !== 'undefined' && process.env
    ? (process.env as { NX_API_BASE_URL?: string }).NX_API_BASE_URL
    : undefined;

/**
 * Admin Service API Client instance
 *
 * Routes through API Gateway (via nginx)
 * Reads tokens from auth store (no automatic refresh to avoid conflicts)
 */
export const adminApiClient = new ApiClient({
  // Use API Gateway URL via nginx (default: https://localhost/api/admin)
  baseURL: envBaseURL ? `${envBaseURL}/admin` : 'https://localhost/api/admin',
  // Token refresh handled by auth store via Auth Service through API Gateway
  refreshURL: envBaseURL ? `${envBaseURL}/auth` : 'https://localhost/api/auth',
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
