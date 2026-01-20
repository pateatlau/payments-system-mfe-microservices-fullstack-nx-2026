/**
 * MFA API Client
 *
 * Client for interacting with the Auth Service MFA endpoints via API Gateway.
 * Handles MFA setup, verification, and management.
 *
 * @module mfa-api
 */

import { ApiClient } from '@mfe/shared-api-client';
import { useAuthStore } from 'shared-auth-store';
import type {
  MfaSetupResponseData,
  MfaStatusResponseData,
  MfaRegenerateBackupCodesResponseData,
} from 'shared-types';

// Access environment variable (replaced by DefinePlugin at build time)
declare const process: { env: { NX_API_BASE_URL?: string } };
const envBaseURL: string | undefined = process.env.NX_API_BASE_URL;

/**
 * MFA API Client instance
 * Routes through API Gateway to Auth Service
 */
const mfaApiClient = new ApiClient({
  baseURL: envBaseURL || 'https://localhost/api',
  timeout: 30000,
  tokenProvider: {
    getAccessToken: () => useAuthStore.getState().accessToken,
    getRefreshToken: () => useAuthStore.getState().refreshToken,
    setTokens: (accessToken: string, refreshToken: string) => {
      useAuthStore.getState().setAccessToken(accessToken, refreshToken);
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
 * Get MFA status for current user
 *
 * @returns Promise resolving to MFA status (enabled, verified, backup codes remaining)
 */
export async function getMfaStatus(): Promise<MfaStatusResponseData> {
  const response =
    await mfaApiClient.get<MfaStatusResponseData>('/auth/mfa/status');

  if (!response?.data) {
    throw new Error('Invalid response structure from MFA status API');
  }

  return response.data;
}

/**
 * Generate MFA setup data (QR code, secret, backup codes)
 *
 * @returns Promise resolving to MFA setup data including QR code
 */
export async function setupMfa(): Promise<MfaSetupResponseData> {
  const response =
    await mfaApiClient.post<MfaSetupResponseData>('/auth/mfa/setup');

  if (!response?.data) {
    throw new Error('Invalid response structure from MFA setup API');
  }

  return response.data;
}

/**
 * Verify MFA setup with TOTP code from authenticator app
 *
 * @param totpCode - 6-digit TOTP code from authenticator app
 * @returns Promise resolving to success status
 */
export async function verifyMfaSetup(
  totpCode: string
): Promise<{ success: boolean; message: string }> {
  const response = await mfaApiClient.post<{ success: boolean; message: string }>(
    '/auth/mfa/verify-setup',
    { totpCode }
  );

  if (!response?.data) {
    throw new Error('Invalid response structure from MFA verify-setup API');
  }

  return response.data;
}

/**
 * Disable MFA for current user
 *
 * @param password - Current password for verification
 * @param totpCode - Current TOTP code for verification
 * @returns Promise resolving to success status
 */
export async function disableMfa(
  password: string,
  totpCode: string
): Promise<{ success: boolean; message: string }> {
  const response = await mfaApiClient.post<{ success: boolean; message: string }>(
    '/auth/mfa/disable',
    { password, totpCode }
  );

  if (!response?.data) {
    throw new Error('Invalid response structure from MFA disable API');
  }

  return response.data;
}

/**
 * Regenerate backup codes
 *
 * @param totpCode - Current TOTP code for verification
 * @returns Promise resolving to new backup codes
 */
export async function regenerateBackupCodes(
  totpCode: string
): Promise<MfaRegenerateBackupCodesResponseData> {
  const response =
    await mfaApiClient.post<MfaRegenerateBackupCodesResponseData>(
      '/auth/mfa/backup-codes/regenerate',
      { totpCode }
    );

  if (!response?.data) {
    throw new Error('Invalid response structure from backup codes API');
  }

  return response.data;
}
