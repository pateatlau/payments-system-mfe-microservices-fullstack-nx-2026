/**
 * Token Utilities
 *
 * JWT token generation and validation with key versioning support.
 *
 * POC-3 Phase 3.1: JWT Secret Rotation
 * - Tokens include 'kid' (key ID) in header for identifying which secret was used
 * - Supports verifying tokens signed with old secrets during rotation
 * - Falls back to legacy behavior for backwards compatibility
 */

import jwt from 'jsonwebtoken';
import { config, getSecretManager } from '../config';
import { UserRole } from 'shared-types';

/**
 * JWT payload structure
 */
export interface JwtPayload {
  userId: string;
  email: string;
  name: string;
  role: UserRole;
}

/**
 * Token pair (access + refresh)
 */
export interface TokenPair {
  accessToken: string;
  refreshToken: string;
  expiresIn: string;
}

/**
 * Generate access token with key versioning
 *
 * POC-3 Phase 3.1: Now includes 'kid' in JWT header for secret rotation support
 *
 * @param payload - User data to encode in token
 * @returns JWT access token with kid header
 */
export const generateAccessToken = (payload: JwtPayload): string => {
  const tokenPayload = {
    userId: payload.userId,
    email: payload.email,
    name: payload.name,
    role: payload.role,
  };

  const secretManager = getSecretManager();
  return secretManager.signAccessToken(tokenPayload, {
    expiresIn: config.jwtExpiresIn,
  });
};

/**
 * Generate refresh token with key versioning
 *
 * POC-3 Phase 3.1: Now includes 'kid' in JWT header for secret rotation support
 *
 * @param payload - User data to encode in token
 * @returns JWT refresh token with kid header
 */
export const generateRefreshToken = (payload: JwtPayload): string => {
  const tokenPayload = {
    userId: payload.userId,
    email: payload.email,
    name: payload.name,
    role: payload.role,
  };

  const secretManager = getSecretManager();
  return secretManager.signRefreshToken(tokenPayload, {
    expiresIn: config.jwtRefreshExpiresIn,
  });
};

/**
 * Generate token pair (access + refresh)
 *
 * @param payload - User data to encode in tokens
 * @returns Token pair with access and refresh tokens
 */
export const generateTokenPair = (payload: JwtPayload): TokenPair => {
  return {
    accessToken: generateAccessToken(payload),
    refreshToken: generateRefreshToken(payload),
    expiresIn: config.jwtExpiresIn,
  };
};

/**
 * Verify access token with multi-secret support
 *
 * POC-3 Phase 3.1: Supports verifying tokens signed with any active/verifiable secret.
 * Uses 'kid' header to identify the correct secret, falls back to trying all secrets.
 *
 * @param token - JWT access token
 * @returns Decoded payload
 * @throws Error if token is invalid or expired
 */
export const verifyAccessToken = (token: string): JwtPayload => {
  const secretManager = getSecretManager();
  const result = secretManager.verifyAccessToken<JwtPayload>(token);

  if (!result.success) {
    // Throw appropriate JWT error for backwards compatibility
    const error = new jwt.JsonWebTokenError(result.error || 'Token verification failed');
    throw error;
  }

  return result.payload as JwtPayload;
};

/**
 * Verify refresh token with multi-secret support
 *
 * POC-3 Phase 3.1: Supports verifying tokens signed with any active/verifiable secret.
 *
 * @param token - JWT refresh token
 * @returns Decoded payload
 * @throws Error if token is invalid or expired
 */
export const verifyRefreshToken = (token: string): JwtPayload => {
  const secretManager = getSecretManager();
  const result = secretManager.verifyRefreshToken<JwtPayload>(token);

  if (!result.success) {
    // Throw appropriate JWT error for backwards compatibility
    const error = new jwt.JsonWebTokenError(result.error || 'Token verification failed');
    throw error;
  }

  return result.payload as JwtPayload;
};

/**
 * Decode token without verification (for debugging/logging)
 *
 * @param token - JWT token
 * @returns Decoded payload or null
 */
export const decodeToken = (token: string): JwtPayload | null => {
  try {
    const decoded = jwt.decode(token) as JwtPayload | null;
    return decoded;
  } catch {
    return null;
  }
};

/**
 * Get the key ID (kid) from a token
 *
 * @param token - JWT token
 * @returns Key ID or null if not present
 */
export const getTokenKid = (token: string): string | null => {
  try {
    const decoded = jwt.decode(token, { complete: true });
    if (decoded && typeof decoded === 'object' && decoded.header) {
      return (decoded.header as { kid?: string }).kid || null;
    }
    return null;
  } catch {
    return null;
  }
};
