/**
 * Auth API Types
 *
 * Request and response types for Auth Service endpoints
 */

import type { User } from '../models/user';
import type { UserRole } from '../enums';
import type { ApiResponse } from './common';

/**
 * Register request
 */
export interface RegisterRequest {
  email: string;
  password: string;
  name: string;
  role?: UserRole;
}

/**
 * Register response data
 */
export interface RegisterResponseData {
  user: User;
  accessToken: string;
  refreshToken: string;
}

/**
 * Register response
 */
export type RegisterResponse = ApiResponse<RegisterResponseData>;

/**
 * Login request
 */
export interface LoginRequest {
  email: string;
  password: string;
}

/**
 * Login response data (standard login without MFA)
 */
export interface LoginResponseData {
  user: User;
  accessToken: string;
  refreshToken: string;
  expiresIn?: string;
}

/**
 * Login response data when MFA is required
 */
export interface MfaRequiredResponseData {
  user: User;
  accessToken: ''; // Empty when MFA required
  refreshToken: ''; // Empty when MFA required
  expiresIn: '';
  mfaRequired: true;
  mfaToken: string; // Temporary token for MFA verification
}

/**
 * Combined login response data (may or may not require MFA)
 */
export type LoginResponseDataWithMfa = LoginResponseData | MfaRequiredResponseData;

/**
 * Login response
 */
export type LoginResponse = ApiResponse<LoginResponseDataWithMfa>;

/**
 * MFA complete login request (step 2 of MFA flow)
 */
export interface MfaCompleteRequest {
  mfaToken: string;
  code: string; // 6-digit TOTP or 8-char backup code
}

/**
 * MFA complete login response
 */
export type MfaCompleteResponse = ApiResponse<LoginResponseData>;

/**
 * MFA setup response data
 */
export interface MfaSetupResponseData {
  secret: string; // Base32 encoded secret (show once)
  qrCodeDataUrl: string; // Data URL for QR code image
  backupCodes: string[]; // Plain text backup codes (show once)
  manualEntryKey: string; // For manual entry in authenticator app
}

/**
 * MFA setup response
 */
export type MfaSetupResponse = ApiResponse<MfaSetupResponseData>;

/**
 * MFA verify setup request
 */
export interface MfaVerifySetupRequest {
  totpCode: string;
}

/**
 * MFA status response data
 */
export interface MfaStatusResponseData {
  enabled: boolean;
  verified: boolean;
  backupCodesRemaining: number;
}

/**
 * MFA status response
 */
export type MfaStatusResponse = ApiResponse<MfaStatusResponseData>;

/**
 * MFA disable request
 */
export interface MfaDisableRequest {
  password: string;
  totpCode: string;
}

/**
 * MFA regenerate backup codes request
 */
export interface MfaRegenerateBackupCodesRequest {
  totpCode: string;
}

/**
 * MFA regenerate backup codes response data
 */
export interface MfaRegenerateBackupCodesResponseData {
  backupCodes: string[];
}

/**
 * Type guard to check if login response requires MFA
 */
export function isMfaRequired(
  data: LoginResponseDataWithMfa
): data is MfaRequiredResponseData {
  return 'mfaRequired' in data && data.mfaRequired === true;
}

/**
 * Refresh token request
 */
export interface RefreshTokenRequest {
  refreshToken: string;
}

/**
 * Refresh token response data
 */
export interface RefreshTokenResponseData {
  accessToken: string;
  refreshToken: string;
}

/**
 * Refresh token response
 */
export type RefreshTokenResponse = ApiResponse<RefreshTokenResponseData>;

/**
 * Change password request
 */
export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
}

/**
 * Change password response
 */
export type ChangePasswordResponse = ApiResponse<null>;

/**
 * Get current user response
 */
export type GetCurrentUserResponse = ApiResponse<User>;
