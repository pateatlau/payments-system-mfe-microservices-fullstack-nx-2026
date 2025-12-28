/**
 * Auth Service
 *
 * Business logic for authentication operations
 *
 * POC-3 Phase 5.2: Redis Caching Integration
 * - Cache user lookups (by ID and email)
 * - Invalidate cache on user updates
 * - 5 minute TTL for user data
 */

import bcrypt from 'bcrypt';
import { prisma } from '../lib/prisma';
import type { User } from '@prisma/client';
import { config } from '../config';
import {
  generateTokenPair,
  JwtPayload,
  verifyRefreshToken,
} from '../utils/token';
import { ApiError } from '../middleware/errorHandler';
import { RegisterInput, LoginInput } from '../validators/auth.validators';
import { UserRole } from 'shared-types';
import { cache, CacheKeys, CacheTags, AuthCacheTTL } from '../lib/cache';
import { publishUserCreated } from '../events/publisher';

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
  // Check if user already exists (try cache first)
  const emailCacheKey = CacheKeys.userByEmail(data.email);
  let existingUser = await cache.get<unknown>(emailCacheKey);

  if (!existingUser) {
    existingUser = await prisma.user.findUnique({
      where: { email: data.email },
    });
  }

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

  // Don't cache after registration - userResponse lacks passwordHash
  // Login will fetch from DB and cache properly with passwordHash included

  // Publish user.created event for other services (Profile, Payments, Admin)
  try {
    await publishUserCreated({
      userId: user.id,
      email: user.email,
      name: user.name,
      role: user.role as string,
      emailVerified: false,
      createdAt: user.createdAt.toISOString(),
    });
  } catch (error) {
    // Log error but don't fail registration - event publishing is non-critical
    // eslint-disable-next-line no-console
    console.error('Failed to publish user.created event:', error);
  }

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
  // Try cache first (by email)
  const cacheKey = CacheKeys.userByEmail(data.email);
  let user = await cache.get<User>(cacheKey);

  if (!user) {
    // Cache miss - fetch from database
    user = await prisma.user.findUnique({
      where: { email: data.email },
    });

    if (user) {
      // Cache the user (by email and by ID)
      await Promise.all([
        cache.set(cacheKey, user, {
          ttl: AuthCacheTTL.USER_BY_EMAIL,
          tags: [CacheTags.users, CacheTags.user(user.id)],
        }),
        cache.set(CacheKeys.user(user.id), user, {
          ttl: AuthCacheTTL.USER_BY_ID,
          tags: [CacheTags.users, CacheTags.user(user.id)],
        }),
      ]);
    }
  }

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
  // Try cache first
  const cacheKey = CacheKeys.user(userId);
  const cached = await cache.get<UserResponse>(cacheKey);

  if (cached) {
    return cached;
  }

  // Cache miss - fetch from database
  const user = await prisma.user.findUnique({
    where: { id: userId },
  });

  if (!user) {
    throw new ApiError(404, 'USER_NOT_FOUND', 'User not found');
  }

  const userResponse: UserResponse = {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role as UserRole,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };

  // Cache the user
  await cache.set(cacheKey, userResponse, {
    ttl: AuthCacheTTL.USER_BY_ID,
    tags: [CacheTags.users, CacheTags.user(userId)],
  });

  return userResponse;
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

  // Invalidate user cache (all caches for this user)
  await cache.invalidateByTag(CacheTags.user(userId));

  // Invalidate all refresh tokens
  await prisma.refreshToken.deleteMany({
    where: { userId },
  });
};
