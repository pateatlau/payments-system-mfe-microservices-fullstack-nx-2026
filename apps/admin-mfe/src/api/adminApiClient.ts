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
// IMPORTANT: DefinePlugin replaces the EXACT expression `process.env.NX_API_BASE_URL`
// Do NOT check if process/process.env exists - that would prevent the replacement
declare const process: { env: { NX_API_BASE_URL?: string } };
const envBaseURL: string | undefined = process.env.NX_API_BASE_URL;

/**
 * Admin Service API Client instance
 *
 * Routes through API Gateway (via nginx)
 * Reads tokens from auth store (no automatic refresh to avoid conflicts)
 */
export const adminApiClient = new ApiClient({
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
