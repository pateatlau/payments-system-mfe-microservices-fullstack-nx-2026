/**
 * Auth Service
 *
 * Business logic for authentication operations
 *
 * POC-3 Phase 5.2: Redis Caching Integration
 * - Cache user lookups (by ID and email)
 * - Invalidate cache on user updates
 * - 5 minute TTL for user data
 *
 * POC-3 Backend Hardening - Priority 1.2: JWT Refresh Token Rotation
 * - Refresh tokens rotate on each use
 * - Token family tracking for reuse detection
 * - Token fingerprinting (IP + User-Agent)
 * - Token blacklisting via Redis
 *
 * POC-3 Phase 7.3: Session Fingerprinting
 * - Enhanced fingerprinting with client-side hash
 * - Mandatory fingerprint validation on token refresh
 * - Detailed logging for security incidents
 */

/**
 * POC-3 Phase 7.3: Request metadata for fingerprinting
 * Extracted from HTTP request headers by the controller
 */
export interface RequestMeta {
  /** Client IP address */
  ip: string;
  /** User-Agent header */
  userAgent: string;
  /** Client-side fingerprint hash (from X-Client-Fingerprint header) */
  clientFingerprint?: string;
}

import bcrypt from 'bcrypt';
import { prisma } from '../lib/prisma';
import type { User } from '.prisma/auth-client';
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
import {
  publishUserCreated,
  publishUserLogin,
  publishUserLogout,
} from '../events/publisher';
import {
  blacklistToken,
  blacklistTokenFamily,
  blacklistUserTokens,
  isTokenBlacklisted,
  isTokenFamilyBlacklisted,
  areUserTokensBlacklisted,
  generateFingerprint,
  validateFingerprint,
  generateTokenFamily,
} from './token-blacklist.service';
import {
  checkLoginAttempt,
  recordFailedAttempt,
  recordSuccessfulLogin,
} from './login-attempts.service';
import { isMfaRequired, verifyMfaCode } from './mfa.service';
import { generateVerificationToken } from './email-verification.service';

/**
 * Mask an email address for privacy-safe responses/logging
 * e.g., "john.doe@example.com" -> "j*****e@example.com"
 */
function maskEmailForLog(email: string): string {
  const [localPart, domain] = email.split('@');
  if (!localPart || !domain) return '***@***';
  if (localPart.length <= 2) return `${localPart[0]}*@${domain}`;
  return `${localPart[0]}${'*'.repeat(Math.min(localPart.length - 2, 5))}${localPart[localPart.length - 1]}@${domain}`;
}

/**
 * User response (without password)
 */
export interface UserResponse {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  emailVerified: boolean;
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
 * Registration response (POC-3 Priority 1.5)
 * Returns verification required info instead of auth tokens
 */
export interface RegistrationResponse {
  success: true;
  message: string;
  emailVerificationRequired: true;
  email: string;
  /** Development only: verification token for manual testing */
  _dev?: {
    verificationToken: string;
    userId: string;
    expiresAt: string;
    verifyUrl: string;
  };
}

/**
 * Register a new user
 *
 * POC-3 Priority 1.5: Registration now requires email verification
 * - Does NOT return auth tokens immediately
 * - Generates email verification token
 * - User must verify email before logging in
 *
 * @param data - Registration data
 * @param _requestMeta - Optional request metadata (unused now, kept for API compatibility)
 * @returns Registration response with verification info
 * @throws ApiError if email already exists
 */
export const register = async (
  data: RegisterInput,
  _requestMeta?: RequestMeta
): Promise<RegistrationResponse> => {
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

  // Create user (emailVerified defaults to false)
  const user = await prisma.user.create({
    data: {
      email: data.email,
      passwordHash,
      name: data.name as string,
      role: data.role ?? UserRole.CUSTOMER,
    },
  });

  // Generate email verification token
  const verificationResult = await generateVerificationToken(user.id, user.email);

  if (!verificationResult.success || !verificationResult.token) {
    // This shouldn't happen for a new user, but handle gracefully
    console.error(
      `[Auth] Failed to generate verification token for new user ${user.id}`
    );
  }

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
  } catch (_error) {
    // Log error but don't fail registration - event publishing is non-critical
    console.error('Failed to publish user.created event:', _error);
  }

  console.log(
    `[Auth] User registered: ${user.id} (${maskEmailForLog(user.email)}) - verification required`
  );

  // Build response
  const response: RegistrationResponse = {
    success: true,
    message:
      'Registration successful. Please check your email to verify your account.',
    emailVerificationRequired: true,
    email: user.email,
  };

  // In development mode, include verification token for manual testing
  const isDevelopment =
    process.env.NODE_ENV === 'development' ||
    process.env.NODE_ENV === 'local' ||
    process.env.ALLOW_DEV_TOKENS === 'true';

  if (isDevelopment && verificationResult.token) {
    response._dev = {
      verificationToken: verificationResult.token,
      userId: user.id,
      expiresAt: verificationResult.expiresAt || '',
      verifyUrl: `https://localhost/verify-email?token=${verificationResult.token}`,
    };
  }

  return response;
};

/**
 * Login response with optional lockout warning and MFA flag
 */
export interface LoginResponse extends AuthResponse {
  warning?: string;
  mfaRequired?: boolean;
  mfaToken?: string; // Temporary token for MFA verification step
}

/**
 * Login a user
 *
 * SECURITY: Implements brute force protection
 * - Tracks failed login attempts by email
 * - Locks account after 5 failed attempts
 * - Auto-unlocks after 15 minutes
 * - Exponential backoff between attempts
 *
 * @param data - Login data
 * @param requestMeta - Optional request metadata for fingerprinting
 * @returns Auth response with user and tokens
 * @throws ApiError if credentials are invalid or account is locked
 */
export const login = async (
  data: LoginInput,
  requestMeta?: RequestMeta
): Promise<LoginResponse> => {
  const ip = requestMeta?.ip || 'unknown';

  // SECURITY: Check if login attempts are allowed (brute force protection)
  const attemptCheck = await checkLoginAttempt(data.email, ip);

  if (!attemptCheck.allowed) {
    // Account is locked or rate limited
    throw new ApiError(
      429,
      'ACCOUNT_LOCKED',
      attemptCheck.message || 'Too many failed login attempts. Please try again later.',
      {
        lockedUntil: attemptCheck.lockedUntil?.toISOString(),
        waitSeconds: attemptCheck.waitSeconds,
      }
    );
  }

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
    // SECURITY: Record failed attempt even for non-existent users
    // (prevents enumeration attacks)
    const failedResult = await recordFailedAttempt(data.email, ip);

    throw new ApiError(
      401,
      'INVALID_CREDENTIALS',
      'Invalid email or password',
      failedResult.remainingAttempts <= 2
        ? { remainingAttempts: failedResult.remainingAttempts }
        : undefined
    );
  }

  // Check if user has a password (social-only users don't)
  // SECURITY: Return same generic error as invalid credentials to prevent account enumeration
  // An attacker should not be able to determine if an account exists and uses social login
  if (!user.passwordHash || !user.hasPassword) {
    // Record failed attempt for rate limiting (same as invalid password)
    const failedResult = await recordFailedAttempt(data.email, ip);

    throw new ApiError(
      401,
      'INVALID_CREDENTIALS',
      'Invalid email or password',
      failedResult.remainingAttempts <= 2
        ? { remainingAttempts: failedResult.remainingAttempts }
        : undefined
    );
  }

  // Verify password
  const passwordValid = await bcrypt.compare(data.password, user.passwordHash);

  if (!passwordValid) {
    // SECURITY: Record failed attempt
    const failedResult = await recordFailedAttempt(data.email, ip);

    // If account is now locked, throw appropriate error
    if (!failedResult.allowed && failedResult.lockedUntil) {
      throw new ApiError(
        429,
        'ACCOUNT_LOCKED',
        failedResult.message || 'Account locked due to too many failed attempts.',
        {
          lockedUntil: failedResult.lockedUntil.toISOString(),
          waitSeconds: failedResult.waitSeconds,
        }
      );
    }

    throw new ApiError(
      401,
      'INVALID_CREDENTIALS',
      'Invalid email or password',
      failedResult.remainingAttempts <= 2
        ? { remainingAttempts: failedResult.remainingAttempts }
        : undefined
    );
  }

  // SECURITY: Clear failed attempts on successful login
  await recordSuccessfulLogin(data.email);

  // SECURITY: Check if email is verified (POC-3 Priority 1.3)
  // Block login for unverified users to enforce email verification
  if (!user.emailVerified) {
    throw new ApiError(
      403,
      'EMAIL_NOT_VERIFIED',
      'Please verify your email address before logging in. Check your inbox for the verification link.',
      {
        canResend: true,
        email: maskEmailForLog(user.email),
      }
    );
  }

  // Check if MFA is required for this user
  const mfaEnabled = await isMfaRequired(user.id);

  if (mfaEnabled) {
    // MFA is required - return partial response with MFA token
    // The MFA token is a short-lived JWT that allows the user to complete MFA verification
    const mfaPayload: JwtPayload = {
      userId: user.id,
      email: user.email,
      name: user.name,
      role: user.role as UserRole,
    };

    // Generate a short-lived MFA token (5 minutes)
    const jwt = await import('jsonwebtoken');
    const mfaToken = jwt.default.sign(
      { ...mfaPayload, purpose: 'mfa_verification' },
      config.jwtSecret,
      { expiresIn: '5m' }
    );

    // Return partial response indicating MFA is required
    const userResponse: UserResponse = {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role as UserRole,
      emailVerified: user.emailVerified,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };

    console.log(`[Auth] MFA required for user ${user.id}`);

    return {
      user: userResponse,
      accessToken: '', // Empty - not provided until MFA is verified
      refreshToken: '', // Empty - not provided until MFA is verified
      expiresIn: '',
      mfaRequired: true,
      mfaToken, // Temporary token for MFA verification
    };
  }

  // Generate tokens
  const jwtPayload: JwtPayload = {
    userId: user.id,
    email: user.email,
    name: user.name,
    role: user.role as UserRole,
  };

  const tokens = generateTokenPair(jwtPayload);

  // Generate token family and fingerprint for rotation tracking
  // POC-3 Phase 7.3: Enhanced fingerprint includes client-side fingerprint
  const tokenFamily = generateTokenFamily();
  const fingerprint = requestMeta
    ? generateFingerprint(
        requestMeta.ip,
        requestMeta.userAgent,
        requestMeta.clientFingerprint
      )
    : null;

  // Delete old refresh tokens for this user (prevent unique constraint violations)
  // This also effectively logs out other sessions
  await prisma.refreshToken.deleteMany({
    where: { userId: user.id },
  });

  // Store new refresh token with family and fingerprint
  await prisma.refreshToken.create({
    data: {
      userId: user.id,
      token: tokens.refreshToken,
      tokenFamily,
      fingerprint,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
    },
  });

  // Return user and tokens
  const userResponse: UserResponse = {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role as UserRole,
    emailVerified: user.emailVerified,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };

  // Publish user.login event for audit logging
  try {
    await publishUserLogin({
      userId: user.id,
      email: user.email,
      loginAt: new Date().toISOString(),
      ipAddress: ip,
    });
  } catch (_error) {
    // Log but don't fail login - event publishing is non-critical
    console.error('Failed to publish user.login event:', _error);
  }

  return {
    user: userResponse,
    accessToken: tokens.accessToken,
    refreshToken: tokens.refreshToken,
    expiresIn: tokens.expiresIn,
  };
};

/**
 * Complete login after MFA verification
 *
 * This function is called after the user has successfully verified their MFA code.
 * It generates the final access and refresh tokens.
 *
 * @param mfaToken - The temporary MFA token from the initial login
 * @param mfaCode - The TOTP or backup code provided by the user
 * @param requestMeta - Request metadata for fingerprinting
 * @returns Full auth response with tokens
 * @throws ApiError if MFA token is invalid or MFA code verification fails
 */
export const completeMfaLogin = async (
  mfaToken: string,
  mfaCode: string,
  requestMeta?: RequestMeta
): Promise<AuthResponse> => {
  // Verify the MFA token
  const jwt = await import('jsonwebtoken');
  let payload: JwtPayload & { purpose?: string };

  try {
    payload = jwt.default.verify(mfaToken, config.jwtSecret) as JwtPayload & {
      purpose?: string;
    };
  } catch (_error) {
    throw new ApiError(
      401,
      'INVALID_MFA_TOKEN',
      'MFA session expired. Please login again.'
    );
  }

  // Verify the token purpose
  if (payload.purpose !== 'mfa_verification') {
    throw new ApiError(
      401,
      'INVALID_MFA_TOKEN',
      'Invalid MFA token. Please login again.'
    );
  }

  // Verify the MFA code
  let codeValid: boolean;

  try {
    codeValid = await verifyMfaCode(payload.userId, mfaCode);
  } catch (error) {
    // Log the error for debugging
    console.error('[Auth] MFA code verification error:', error);

    // If it's an ApiError, re-throw it (e.g., INVALID_CODE_FORMAT)
    if (error instanceof ApiError) {
      throw error;
    }

    // For other errors, throw a generic error
    throw new ApiError(
      500,
      'MFA_VERIFICATION_ERROR',
      'An error occurred during MFA verification. Please try again.'
    );
  }

  if (!codeValid) {
    throw new ApiError(
      401,
      'INVALID_MFA_CODE',
      'Invalid MFA code. Please try again.'
    );
  }

  // Get user from database for the response
  const user = await prisma.user.findUnique({
    where: { id: payload.userId },
  });

  if (!user) {
    throw new ApiError(404, 'USER_NOT_FOUND', 'User not found');
  }

  // Generate tokens
  const jwtPayload: JwtPayload = {
    userId: user.id,
    email: user.email,
    name: user.name,
    role: user.role as UserRole,
  };

  const tokens = generateTokenPair(jwtPayload);

  // Generate token family and fingerprint for rotation tracking
  // POC-3 Phase 7.3: Enhanced fingerprint includes client-side fingerprint
  const tokenFamily = generateTokenFamily();
  const fingerprint = requestMeta
    ? generateFingerprint(
        requestMeta.ip,
        requestMeta.userAgent,
        requestMeta.clientFingerprint
      )
    : null;

  // Delete old refresh tokens for this user
  await prisma.refreshToken.deleteMany({
    where: { userId: user.id },
  });

  // Store new refresh token
  await prisma.refreshToken.create({
    data: {
      userId: user.id,
      token: tokens.refreshToken,
      tokenFamily,
      fingerprint,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
    },
  });

  // Return user and tokens
  const userResponse: UserResponse = {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role as UserRole,
    emailVerified: user.emailVerified,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };

  // Publish user.login event for audit logging
  try {
    await publishUserLogin({
      userId: user.id,
      email: user.email,
      loginAt: new Date().toISOString(),
      ipAddress: requestMeta?.ip || 'unknown',
    });
  } catch (_error) {
    console.error('Failed to publish user.login event:', _error);
  }

  console.log(`[Auth] MFA login completed for user ${user.id}`);

  return {
    user: userResponse,
    accessToken: tokens.accessToken,
    refreshToken: tokens.refreshToken,
    expiresIn: tokens.expiresIn,
  };
};

/**
 * Refresh Response with new tokens
 */
export interface RefreshResponse {
  accessToken: string;
  refreshToken: string;
  expiresIn: string;
}

/**
 * Refresh access token with rotation
 *
 * SECURITY: Implements refresh token rotation
 * - Each refresh request generates a new refresh token
 * - The old refresh token is invalidated
 * - Token family tracking detects reuse attacks
 * - If a token is reused, the entire token family is revoked
 *
 * @param refreshToken - Refresh token
 * @param requestMeta - Optional request metadata for fingerprint validation
 * @returns New access token AND new refresh token
 * @throws ApiError if refresh token is invalid, expired, or reused
 */
export const refreshAccessToken = async (
  refreshToken: string,
  requestMeta?: RequestMeta
): Promise<RefreshResponse> => {
  // Verify refresh token JWT
  let payload: JwtPayload;
  try {
    payload = verifyRefreshToken(refreshToken);
  } catch (_error) {
    throw new ApiError(
      401,
      'INVALID_TOKEN',
      'Invalid or expired refresh token'
    );
  }

  // Check if this specific token is blacklisted
  if (await isTokenBlacklisted(refreshToken)) {
    throw new ApiError(401, 'TOKEN_REVOKED', 'Refresh token has been revoked');
  }

  // Check if all user tokens are blacklisted (e.g., password changed)
  if (await areUserTokensBlacklisted(payload.userId)) {
    throw new ApiError(
      401,
      'SESSION_INVALIDATED',
      'All sessions have been invalidated. Please log in again.'
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
    // Token not found - could be a reuse attack
    // Check if this token was previously valid but rotated
    // We don't have the old token anymore, but we can check if user has any tokens
    const userTokens = await prisma.refreshToken.findMany({
      where: { userId: payload.userId },
    });

    if (userTokens.length > 0) {
      // User has valid tokens, but this one is not valid
      // This could be a token reuse attack - revoke all tokens for this user
      console.warn(
        `[Security] Potential token reuse attack detected for user ${payload.userId}. Revoking all tokens.`
      );

      // Blacklist all tokens for this user
      await blacklistUserTokens(payload.userId);

      // Revoke all tokens in database
      await prisma.refreshToken.deleteMany({
        where: { userId: payload.userId },
      });

      throw new ApiError(
        401,
        'TOKEN_REUSE_DETECTED',
        'Suspicious activity detected. All sessions have been invalidated for security.'
      );
    }

    throw new ApiError(401, 'INVALID_TOKEN', 'Refresh token not found');
  }

  // Check if token is revoked
  if (storedToken.isRevoked) {
    // Token was revoked - possible reuse attack
    // Revoke entire token family
    console.warn(
      `[Security] Revoked token reuse detected for user ${payload.userId}. Revoking token family ${storedToken.tokenFamily}.`
    );

    await blacklistTokenFamily(storedToken.tokenFamily);

    // Delete all tokens in this family
    await prisma.refreshToken.deleteMany({
      where: { tokenFamily: storedToken.tokenFamily },
    });

    throw new ApiError(
      401,
      'TOKEN_REUSE_DETECTED',
      'This token has been revoked. All related sessions have been invalidated.'
    );
  }

  // Check if token family is blacklisted
  if (await isTokenFamilyBlacklisted(storedToken.tokenFamily)) {
    throw new ApiError(
      401,
      'TOKEN_FAMILY_REVOKED',
      'This session family has been revoked. Please log in again.'
    );
  }

  // Check if token is expired
  if (storedToken.expiresAt < new Date()) {
    // Delete expired token
    await prisma.refreshToken.delete({
      where: { id: storedToken.id },
    });

    throw new ApiError(401, 'TOKEN_EXPIRED', 'Refresh token expired');
  }

  // POC-3 Phase 7.3: Validate fingerprint (mandatory when stored)
  // Enhanced to include client-side fingerprint for better security
  if (requestMeta && storedToken.fingerprint) {
    const fingerprintValid = validateFingerprint(
      storedToken.fingerprint,
      requestMeta.ip,
      requestMeta.userAgent,
      requestMeta.clientFingerprint
    );

    if (!fingerprintValid) {
      // Fingerprint mismatch - possible token theft
      // POC-3 Phase 7.3: Enhanced logging with more details
      console.warn(
        `[Security] Fingerprint mismatch detected:`,
        JSON.stringify({
          userId: payload.userId,
          email: payload.email,
          ip: requestMeta.ip?.substring(0, 15) + '...',
          userAgent: requestMeta.userAgent?.substring(0, 50) + '...',
          hasClientFingerprint: !!requestMeta.clientFingerprint,
          timestamp: new Date().toISOString(),
          action: 'TOKEN_REVOKED',
        })
      );

      // Revoke this specific token (but not entire family for now)
      // This allows legitimate users to re-login while blocking the attacker
      await prisma.refreshToken.update({
        where: { id: storedToken.id },
        data: { isRevoked: true },
      });

      await blacklistToken(refreshToken);

      throw new ApiError(
        401,
        'FINGERPRINT_MISMATCH',
        'Session validation failed. Please log in again.'
      );
    }
  }

  // === TOKEN ROTATION ===
  // Generate new token pair
  const tokens = generateTokenPair(payload);

  // Generate new fingerprint for the rotated token
  // POC-3 Phase 7.3: Enhanced fingerprint includes client-side fingerprint
  const newFingerprint = requestMeta
    ? generateFingerprint(
        requestMeta.ip,
        requestMeta.userAgent,
        requestMeta.clientFingerprint
      )
    : storedToken.fingerprint;

  // Mark old token as revoked (not deleted, for reuse detection)
  await prisma.refreshToken.update({
    where: { id: storedToken.id },
    data: { isRevoked: true },
  });

  // Blacklist old token in Redis (faster check than DB)
  await blacklistToken(refreshToken);

  // Create new token in same family
  await prisma.refreshToken.create({
    data: {
      userId: payload.userId,
      token: tokens.refreshToken,
      tokenFamily: storedToken.tokenFamily, // Keep same family
      fingerprint: newFingerprint,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
    },
  });

  // Clean up old revoked tokens (keep last 5 for audit, delete older)
  const revokedTokens = await prisma.refreshToken.findMany({
    where: {
      tokenFamily: storedToken.tokenFamily,
      isRevoked: true,
    },
    orderBy: { createdAt: 'desc' },
    skip: 5, // Keep 5 most recent for audit
  });

  if (revokedTokens.length > 0) {
    await prisma.refreshToken.deleteMany({
      where: {
        id: { in: revokedTokens.map((t: { id: string }) => t.id) },
      },
    });
  }

  return {
    accessToken: tokens.accessToken,
    refreshToken: tokens.refreshToken,
    expiresIn: tokens.expiresIn,
  };
};

/**
 * Logout a user
 *
 * @param userId - User ID
 * @param refreshToken - Refresh token to invalidate (if provided, logs out single session)
 * @param logoutAll - If true, logs out all sessions for the user
 */
export const logout = async (
  userId: string,
  refreshToken?: string,
  logoutAll: boolean = false
): Promise<void> => {
  if (logoutAll) {
    // Logout all sessions - blacklist all user tokens
    await blacklistUserTokens(userId);

    // Delete all refresh tokens for user
    await prisma.refreshToken.deleteMany({
      where: { userId },
    });

    // Invalidate user cache
    await cache.invalidateByTag(CacheTags.user(userId));
  } else if (refreshToken) {
    // Blacklist specific refresh token
    await blacklistToken(refreshToken);

    // Delete specific refresh token
    await prisma.refreshToken.deleteMany({
      where: {
        userId,
        token: refreshToken,
      },
    });
  } else {
    // No token specified, logout all (default safe behavior)
    await blacklistUserTokens(userId);

    // Delete all refresh tokens for user
    await prisma.refreshToken.deleteMany({
      where: { userId },
    });
  }

  // Publish user.logout event for audit logging
  try {
    await publishUserLogout({
      userId,
      logoutAt: new Date().toISOString(),
    });
  } catch (_error) {
    // Log but don't fail logout - event publishing is non-critical
    console.error('Failed to publish user.logout event:', _error);
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
    emailVerified: user.emailVerified,
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
 * SECURITY: Changing password invalidates ALL sessions for the user
 * This prevents attackers from maintaining access if they compromised a session
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

  // Check if user has a password set (social-only users may not)
  if (!user.passwordHash || !user.hasPassword) {
    throw new ApiError(
      400,
      'NO_PASSWORD_SET',
      'You don\'t have a password set. Please use the "Set Password" option instead.'
    );
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

  // SECURITY: Blacklist ALL tokens for this user in Redis
  // This ensures immediate revocation even before DB sync
  await blacklistUserTokens(userId);

  // Invalidate user cache (all caches for this user)
  await cache.invalidateByTag(CacheTags.user(userId));

  // Invalidate all refresh tokens in database
  await prisma.refreshToken.deleteMany({
    where: { userId },
  });

  console.log(
    `[Security] Password changed for user ${userId}. All sessions invalidated.`
  );
};
