/**
 * Auth Service
 *
 * Business logic for authentication operations
 */

import bcrypt from 'bcrypt';
import { prisma } from '../lib/prisma';
import { config } from '../config';
import {
  generateTokenPair,
  JwtPayload,
  verifyRefreshToken,
} from '../utils/token';
import { ApiError } from '../middleware/errorHandler';
import { RegisterInput, LoginInput } from '../validators/auth.validators';
import { UserRole } from 'shared-types';

/**
 * User response (without password)
 */
export interface UserResponse {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Auth response (user + tokens)
 */
export interface AuthResponse {
  user: UserResponse;
  accessToken: string;
  refreshToken: string;
  expiresIn: string;
}

/**
 * Register a new user
 *
 * @param data - Registration data
 * @returns Auth response with user and tokens
 * @throws ApiError if email already exists
 */
export const register = async (data: RegisterInput): Promise<AuthResponse> => {
  // Check if user already exists
  const existingUser = await prisma.user.findUnique({
    where: { email: data.email },
  });

  if (existingUser) {
    throw new ApiError(409, 'EMAIL_EXISTS', 'Email address already in use');
  }

  // Hash password
  const passwordHash = await bcrypt.hash(data.password, config.bcryptRounds);

  // Create user
  const user = await prisma.user.create({
    data: {
      email: data.email,
      passwordHash,
      name: data.name as string,
      role: data.role ?? UserRole.CUSTOMER,
    },
  });

  // TODO (POC-3 Phase 4): User profile creation will be handled via RabbitMQ event
  // When auth.user.created event is published, profile service will create the profile
  // This maintains service isolation - auth service only manages users and tokens

  // Generate tokens
  const jwtPayload: JwtPayload = {
    userId: user.id,
    email: user.email,
    name: user.name,
    role: user.role as UserRole,
  };

  const tokens = generateTokenPair(jwtPayload);

  // Delete old refresh tokens for this user (prevent unique constraint violations)
  await prisma.refreshToken.deleteMany({
    where: { userId: user.id },
  });

  // Store new refresh token
  await prisma.refreshToken.create({
    data: {
      userId: user.id,
      token: tokens.refreshToken,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
    },
  });

  // Return user and tokens
  const userResponse: UserResponse = {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role as UserRole,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };

  return {
    user: userResponse,
    accessToken: tokens.accessToken,
    refreshToken: tokens.refreshToken,
    expiresIn: tokens.expiresIn,
  };
};

/**
 * Login a user
 *
 * @param data - Login data
 * @returns Auth response with user and tokens
 * @throws ApiError if credentials are invalid
 */
export const login = async (data: LoginInput): Promise<AuthResponse> => {
  // Find user by email
  const user = await prisma.user.findUnique({
    where: { email: data.email },
  });

  if (!user) {
    throw new ApiError(401, 'INVALID_CREDENTIALS', 'Invalid email or password');
  }

  // Verify password
  const passwordValid = await bcrypt.compare(data.password, user.passwordHash);

  if (!passwordValid) {
    throw new ApiError(401, 'INVALID_CREDENTIALS', 'Invalid email or password');
  }

  // Generate tokens
  const jwtPayload: JwtPayload = {
    userId: user.id,
    email: user.email,
    name: user.name,
    role: user.role as UserRole,
  };

  const tokens = generateTokenPair(jwtPayload);

  // Delete old refresh tokens for this user (prevent unique constraint violations)
  await prisma.refreshToken.deleteMany({
    where: { userId: user.id },
  });

  // Store new refresh token
  await prisma.refreshToken.create({
    data: {
      userId: user.id,
      token: tokens.refreshToken,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
    },
  });

  // Return user and tokens
  const userResponse: UserResponse = {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role as UserRole,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };

  return {
    user: userResponse,
    accessToken: tokens.accessToken,
    refreshToken: tokens.refreshToken,
    expiresIn: tokens.expiresIn,
  };
};

/**
 * Refresh access token
 *
 * @param refreshToken - Refresh token
 * @returns New access token
 * @throws ApiError if refresh token is invalid or expired
 */
export const refreshAccessToken = async (
  refreshToken: string
): Promise<{ accessToken: string; expiresIn: string }> => {
  // Verify refresh token
  let payload: JwtPayload;
  try {
    payload = verifyRefreshToken(refreshToken);
  } catch (error) {
    throw new ApiError(
      401,
      'INVALID_TOKEN',
      'Invalid or expired refresh token'
    );
  }

  // Check if refresh token exists in database
  const storedToken = await prisma.refreshToken.findFirst({
    where: {
      token: refreshToken,
      userId: payload.userId,
    },
  });

  if (!storedToken) {
    throw new ApiError(401, 'INVALID_TOKEN', 'Refresh token not found');
  }

  // Check if token is expired
  if (storedToken.expiresAt < new Date()) {
    // Delete expired token
    await prisma.refreshToken.delete({
      where: { id: storedToken.id },
    });

    throw new ApiError(401, 'TOKEN_EXPIRED', 'Refresh token expired');
  }

  // Generate new tokens
  const tokens = generateTokenPair(payload);

  return {
    accessToken: tokens.accessToken,
    expiresIn: tokens.expiresIn,
  };
};

/**
 * Logout a user
 *
 * @param userId - User ID
 * @param refreshToken - Refresh token to invalidate
 */
export const logout = async (
  userId: string,
  refreshToken?: string
): Promise<void> => {
  if (refreshToken) {
    // Delete specific refresh token
    await prisma.refreshToken.deleteMany({
      where: {
        userId,
        token: refreshToken,
      },
    });
  } else {
    // Delete all refresh tokens for user
    await prisma.refreshToken.deleteMany({
      where: { userId },
    });
  }
};

/**
 * Get user by ID
 *
 * @param userId - User ID
 * @returns User response
 * @throws ApiError if user not found
 */
export const getUserById = async (userId: string): Promise<UserResponse> => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
  });

  if (!user) {
    throw new ApiError(404, 'USER_NOT_FOUND', 'User not found');
  }

  return {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role as UserRole,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };
};

/**
 * Change user password
 *
 * @param userId - User ID
 * @param currentPassword - Current password
 * @param newPassword - New password
 * @throws ApiError if current password is incorrect
 */
export const changePassword = async (
  userId: string,
  currentPassword: string,
  newPassword: string
): Promise<void> => {
  // Get user
  const user = await prisma.user.findUnique({
    where: { id: userId },
  });

  if (!user) {
    throw new ApiError(404, 'USER_NOT_FOUND', 'User not found');
  }

  // Verify current password
  const passwordValid = await bcrypt.compare(
    currentPassword,
    user.passwordHash
  );

  if (!passwordValid) {
    throw new ApiError(
      401,
      'INVALID_PASSWORD',
      'Current password is incorrect'
    );
  }

  // Hash new password
  const newPasswordHash = await bcrypt.hash(newPassword, config.bcryptRounds);

  // Update password
  await prisma.user.update({
    where: { id: userId },
    data: { passwordHash: newPasswordHash },
  });

  // Invalidate all refresh tokens
  await prisma.refreshToken.deleteMany({
    where: { userId },
  });
};
