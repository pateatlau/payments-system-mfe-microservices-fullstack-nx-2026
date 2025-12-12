/**
 * Admin API Client (via API Gateway - POC-3)
 *
 * Development: Direct to API Gateway (http://localhost:3000)
 * Production: Through nginx proxy (https://localhost)
 *
 * URL Structure:
 * Development:
 * - Frontend → API Gateway: http://localhost:3000/api/admin/*
 * - API Gateway → Admin Service: http://localhost:3003/api/admin/*
 *
 * Production:
 * - Frontend: https://localhost/api/admin/*
 * - nginx → API Gateway: http://localhost:3000/api/admin/*
 * - API Gateway → Admin Service: http://localhost:3003/api/admin/*
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
