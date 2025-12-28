/**
 * Token Utilities
 *
 * JWT token generation and validation
 */

import jwt from 'jsonwebtoken';
import { config } from '../config';
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
 * Generate access token
 *
 * @param payload - User data to encode in token
 * @returns JWT access token
 */
export const generateAccessToken = (payload: JwtPayload): string => {
  const tokenPayload = {
    userId: payload.userId,
    email: payload.email,
    name: payload.name,
    role: payload.role,
  };

   
  return jwt.sign(tokenPayload, config.jwtSecret, {
    expiresIn: config.jwtExpiresIn,
  } as any);
};

/**
 * Generate refresh token
 *
 * @param payload - User data to encode in token
 * @returns JWT refresh token
 */
export const generateRefreshToken = (payload: JwtPayload): string => {
  const tokenPayload = {
    userId: payload.userId,
    email: payload.email,
    name: payload.name,
    role: payload.role,
  };

   
  return jwt.sign(tokenPayload, config.jwtRefreshSecret, {
    expiresIn: config.jwtRefreshExpiresIn,
  } as any);
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
 * Verify access token
 *
 * @param token - JWT access token
 * @returns Decoded payload
 * @throws Error if token is invalid or expired
 */
export const verifyAccessToken = (token: string): JwtPayload => {
  return jwt.verify(token, config.jwtSecret) as JwtPayload;
};

/**
 * Verify refresh token
 *
 * @param token - JWT refresh token
 * @returns Decoded payload
 * @throws Error if token is invalid or expired
 */
export const verifyRefreshToken = (token: string): JwtPayload => {
  return jwt.verify(token, config.jwtRefreshSecret) as JwtPayload;
};
