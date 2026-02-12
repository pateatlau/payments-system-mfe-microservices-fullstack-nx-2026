/**
 * OAuth API Client
 *
 * Client for interacting with the Auth Service OAuth endpoints via API Gateway.
 * Handles fetching and managing linked OAuth accounts.
 *
 * @module oauth-api
 */

import { ApiClient } from '@mfe/shared-api-client';
import { useAuthStore } from 'shared-auth-store';

// Access environment variable (replaced by DefinePlugin at build time)
declare const process: { env: { NX_API_BASE_URL?: string } };
const envBaseURL: string | undefined = process.env.NX_API_BASE_URL;

/**
 * OAuth Account type (matches backend response)
 */
export interface OAuthAccount {
  id: string;
  provider: string;
  email: string | null;
  name: string | null;
  linkedAt: Date | string; // Backend returns Date, serialized as ISO string
}

/**
 * OAuth API Client instance
 * Routes through API Gateway to Auth Service
 */
const oauthApiClient = new ApiClient({
  baseURL: envBaseURL || 'https://localhost/api',
  timeout: 30000,
  // POC-3 Phase 7.2: Updated for HttpOnly cookie-based refresh tokens
  tokenProvider: {
    getAccessToken: () => useAuthStore.getState().accessToken,
    getRefreshToken: () => null, // Refresh token is in HttpOnly cookie
    setAccessToken: (accessToken: string) => {
      useAuthStore.getState().setAccessToken(accessToken);
    },
    clearTokens: () => {
      useAuthStore.getState().logout();
    },
  },
  onUnauthorized: () => {
    useAuthStore.getState().logout();
  },
});

/**
 * Get list of linked OAuth accounts for current user
 *
 * @returns Promise resolving to array of linked OAuth accounts
 */
export async function getLinkedAccounts(): Promise<OAuthAccount[]> {
  const response = await oauthApiClient.get<{ accounts: OAuthAccount[] }>(
    '/auth/oauth/accounts'
  );

  if (!response?.data?.accounts) {
    throw new Error('Invalid response structure from OAuth accounts API');
  }

  return response.data.accounts;
}

/**
 * Get list of supported OAuth providers
 *
 * @returns Promise resolving to array of provider names
 */
export async function getSupportedProviders(): Promise<string[]> {
  const response = await oauthApiClient.get<{ providers: string[] }>(
    '/auth/oauth/providers'
  );

  if (!response?.data?.providers) {
    throw new Error('Invalid response structure from OAuth providers API');
  }

  return response.data.providers;
}

/**
 * Unlink OAuth account from current user
 *
 * @param provider - The provider to unlink (google, github, etc.)
 * @returns Promise resolving to success message
 */
export async function unlinkAccount(
  provider: string
): Promise<{ message: string }> {
  const response = await oauthApiClient.delete<{ message: string }>(
    `/auth/oauth/${provider}`
  );

  if (!response?.data) {
    throw new Error('Invalid response structure from OAuth unlink API');
  }

  return response.data;
}

/**
 * Get the URL to initiate OAuth linking for a provider
 * This redirects to the backend which handles the OAuth flow
 *
 * @param provider - The provider to link (google, github, etc.)
 * @returns The URL to redirect to for OAuth linking
 */
export function getLinkAccountUrl(provider: string): string {
  const apiBaseUrl = envBaseURL || 'https://localhost/api';
  // For linking, we go directly to the OAuth initiate endpoint
  // The backend will handle the OAuth flow and redirect back
  return `${apiBaseUrl}/auth/oauth/link/${provider}`;
}
