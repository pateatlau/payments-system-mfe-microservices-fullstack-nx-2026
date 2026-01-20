/**
 * Password Reset Service
 *
 * Handles forgot password and reset password flows.
 *
 * POC-3: Password Reset Implementation
 * - Secure token generation (crypto.randomBytes)
 * - Redis-based token storage with TTL
 * - Rate limiting to prevent abuse
 * - OpenTelemetry tracing for observability
 *
 * Security considerations:
 * - Tokens are hashed before storage (prevents exposure if Redis is compromised)
 * - Short TTL (15 minutes) to minimize attack window
 * - Rate limiting per email to prevent enumeration
 * - Always returns success to prevent email enumeration attacks
 */

import crypto from 'crypto';
import bcrypt from 'bcrypt';
import { trace, SpanStatusCode } from '@opentelemetry/api';
import { cache } from '../lib/cache';
import { prisma } from '../lib/prisma';
import { config } from '../config';
import { ApiError } from '../middleware/errorHandler';
import { blacklistUserTokens } from './token-blacklist.service';

// Get tracer for password reset operations
const tracer = trace.getTracer('password-reset-service', '1.0.0');

/**
 * Redis key prefixes for password reset
 */
const RESET_TOKEN_PREFIX = 'password_reset:';
const RESET_RATE_LIMIT_PREFIX = 'password_reset_limit:';

/**
 * Configuration for password reset
 */
const PASSWORD_RESET_CONFIG = {
  // Token TTL: 15 minutes
  tokenTtlSeconds: 15 * 60,
  // Token length in bytes (32 bytes = 64 hex chars)
  tokenLength: 32,
  // Max reset requests per email per hour
  maxRequestsPerHour: 3,
  // Rate limit TTL: 1 hour
  rateLimitTtlSeconds: 60 * 60,
};

/**
 * Stored reset token data
 */
interface ResetTokenData {
  userId: string;
  email: string;
  tokenHash: string;
  createdAt: string;
  expiresAt: string;
}

/**
 * Generate a secure random token
 */
function generateResetToken(): string {
  return crypto
    .randomBytes(PASSWORD_RESET_CONFIG.tokenLength)
    .toString('hex');
}

/**
 * Hash a reset token for secure storage
 */
function hashResetToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex');
}

/**
 * Check rate limit for password reset requests
 *
 * @param email - Email to check rate limit for
 * @returns Object with allowed status and remaining attempts
 */
async function checkRateLimit(
  email: string
): Promise<{ allowed: boolean; remaining: number }> {
  const key = `${RESET_RATE_LIMIT_PREFIX}${email.toLowerCase()}`;
  const current = await cache.get<number>(key);

  if (current === null || current === undefined) {
    return { allowed: true, remaining: PASSWORD_RESET_CONFIG.maxRequestsPerHour };
  }

  if (current >= PASSWORD_RESET_CONFIG.maxRequestsPerHour) {
    return { allowed: false, remaining: 0 };
  }

  return {
    allowed: true,
    remaining: PASSWORD_RESET_CONFIG.maxRequestsPerHour - current,
  };
}

/**
 * Increment rate limit counter for email
 */
async function incrementRateLimit(email: string): Promise<void> {
  const key = `${RESET_RATE_LIMIT_PREFIX}${email.toLowerCase()}`;
  const current = await cache.get<number>(key);

  if (current === null || current === undefined) {
    await cache.set(key, 1, { ttl: PASSWORD_RESET_CONFIG.rateLimitTtlSeconds });
  } else {
    await cache.set(key, current + 1, {
      ttl: PASSWORD_RESET_CONFIG.rateLimitTtlSeconds,
    });
  }
}

/**
 * Request password reset (forgot password)
 *
 * This function:
 * 1. Validates the email exists (silently - doesn't expose to caller)
 * 2. Generates a secure reset token
 * 3. Stores hashed token in Redis with TTL
 * 4. Returns the token (caller should send via email)
 *
 * SECURITY: Always returns success to prevent email enumeration
 *
 * @param email - Email address to send reset link to
 * @returns Object with token (if user exists) or null (if not)
 */
export async function requestPasswordReset(email: string): Promise<{
  success: boolean;
  token?: string;
  userId?: string;
  expiresAt?: string;
}> {
  return tracer.startActiveSpan('passwordReset.request', async (span) => {
    try {
      span.setAttribute('email.domain', email.split('@')[1] || 'unknown');

      // Check rate limit first
      const rateLimit = await checkRateLimit(email);
      if (!rateLimit.allowed) {
        span.setAttribute('rate_limited', true);
        span.setStatus({ code: SpanStatusCode.OK });
        // Return success to prevent enumeration, but don't generate token
        console.log(`[Password Reset] Rate limited for email: ${email}`);
        return { success: true };
      }

      // Increment rate limit counter
      await incrementRateLimit(email);

      // Look up user by email
      const user = await tracer.startActiveSpan(
        'passwordReset.request.findUser',
        async (findSpan) => {
          try {
            const result = await prisma.user.findUnique({
              where: { email: email.toLowerCase() },
              select: { id: true, email: true },
            });
            findSpan.setStatus({ code: SpanStatusCode.OK });
            return result;
          } catch (error) {
            findSpan.recordException(error as Error);
            findSpan.setStatus({
              code: SpanStatusCode.ERROR,
              message: 'Failed to find user',
            });
            throw error;
          } finally {
            findSpan.end();
          }
        }
      );

      // If user doesn't exist, return success (prevent enumeration)
      if (!user) {
        span.setAttribute('user_found', false);
        span.setStatus({ code: SpanStatusCode.OK });
        console.log(
          `[Password Reset] Request for non-existent email: ${email}`
        );
        return { success: true };
      }

      span.setAttribute('user_found', true);
      span.setAttribute('user.id', user.id);

      // Generate reset token
      const token = generateResetToken();
      const tokenHash = hashResetToken(token);
      const now = new Date();
      const expiresAt = new Date(
        now.getTime() + PASSWORD_RESET_CONFIG.tokenTtlSeconds * 1000
      );

      // Delete any existing reset token for this user
      const existingKey = `${RESET_TOKEN_PREFIX}${user.id}`;
      await cache.delete(existingKey);

      // Store token data in Redis
      const tokenData: ResetTokenData = {
        userId: user.id,
        email: user.email,
        tokenHash,
        createdAt: now.toISOString(),
        expiresAt: expiresAt.toISOString(),
      };

      await tracer.startActiveSpan(
        'passwordReset.request.storeToken',
        async (storeSpan) => {
          try {
            await cache.set(existingKey, tokenData, {
              ttl: PASSWORD_RESET_CONFIG.tokenTtlSeconds,
            });
            storeSpan.setStatus({ code: SpanStatusCode.OK });
          } catch (error) {
            storeSpan.recordException(error as Error);
            storeSpan.setStatus({
              code: SpanStatusCode.ERROR,
              message: 'Failed to store token',
            });
            throw error;
          } finally {
            storeSpan.end();
          }
        }
      );

      console.log(`[Password Reset] Token generated for user ${user.id}`);
      span.setStatus({ code: SpanStatusCode.OK });

      return {
        success: true,
        token,
        userId: user.id,
        expiresAt: expiresAt.toISOString(),
      };
    } catch (error) {
      span.recordException(error as Error);
      span.setStatus({
        code: SpanStatusCode.ERROR,
        message: 'Password reset request failed',
      });
      throw error;
    } finally {
      span.end();
    }
  });
}

/**
 * Validate a password reset token
 *
 * @param token - The reset token to validate
 * @returns User ID if token is valid, null otherwise
 */
export async function validateResetToken(
  _token: string
): Promise<{ userId: string; email: string } | null> {
  return tracer.startActiveSpan('passwordReset.validate', async (span) => {
    try {
      // NOTE: Token lookup by hash is not implemented.
      // We need to find the token by scanning keys (not ideal, but secure)
      // In production, consider storing token -> userId mapping separately
      // For now, we'll need to pass userId in the reset request

      span.setStatus({ code: SpanStatusCode.OK });
      return null; // Token lookup by hash not implemented - see resetPassword
    } finally {
      span.end();
    }
  });
}

/**
 * Reset password with token
 *
 * @param userId - User ID (from token validation or passed in request)
 * @param token - Reset token
 * @param newPassword - New password
 * @returns Success status
 * @throws ApiError if token is invalid or expired
 */
export async function resetPassword(
  userId: string,
  token: string,
  newPassword: string
): Promise<{ success: boolean; message: string }> {
  return tracer.startActiveSpan('passwordReset.reset', async (span) => {
    try {
      span.setAttribute('user.id', userId);

      // Get stored token data
      const key = `${RESET_TOKEN_PREFIX}${userId}`;
      const storedData = await tracer.startActiveSpan(
        'passwordReset.reset.getToken',
        async (getSpan) => {
          try {
            const result = await cache.get<ResetTokenData>(key);
            getSpan.setStatus({ code: SpanStatusCode.OK });
            return result;
          } catch (error) {
            getSpan.recordException(error as Error);
            getSpan.setStatus({
              code: SpanStatusCode.ERROR,
              message: 'Failed to get token',
            });
            throw error;
          } finally {
            getSpan.end();
          }
        }
      );

      // Check if token exists
      if (!storedData) {
        const error = new ApiError(
          400,
          'INVALID_RESET_TOKEN',
          'Password reset link is invalid or has expired. Please request a new one.'
        );
        span.recordException(error);
        span.setStatus({
          code: SpanStatusCode.ERROR,
          message: 'Token not found',
        });
        throw error;
      }

      // Verify token hash matches
      const tokenHash = hashResetToken(token);
      if (storedData.tokenHash !== tokenHash) {
        const error = new ApiError(
          400,
          'INVALID_RESET_TOKEN',
          'Password reset link is invalid or has expired. Please request a new one.'
        );
        span.recordException(error);
        span.setStatus({
          code: SpanStatusCode.ERROR,
          message: 'Token hash mismatch',
        });
        throw error;
      }

      // Check if token has expired (belt and suspenders - Redis TTL should handle this)
      const expiresAt = new Date(storedData.expiresAt);
      if (expiresAt < new Date()) {
        // Delete expired token
        await cache.delete(key);
        const error = new ApiError(
          400,
          'RESET_TOKEN_EXPIRED',
          'Password reset link has expired. Please request a new one.'
        );
        span.recordException(error);
        span.setStatus({
          code: SpanStatusCode.ERROR,
          message: 'Token expired',
        });
        throw error;
      }

      // Hash new password
      const passwordHash = await bcrypt.hash(newPassword, config.bcryptRounds);

      // Update password in database
      await tracer.startActiveSpan(
        'passwordReset.reset.updatePassword',
        async (updateSpan) => {
          try {
            await prisma.user.update({
              where: { id: userId },
              data: { passwordHash },
            });
            updateSpan.setStatus({ code: SpanStatusCode.OK });
          } catch (error) {
            updateSpan.recordException(error as Error);
            updateSpan.setStatus({
              code: SpanStatusCode.ERROR,
              message: 'Failed to update password',
            });
            throw error;
          } finally {
            updateSpan.end();
          }
        }
      );

      // Delete the reset token (single-use)
      await cache.delete(key);

      // SECURITY: Invalidate all existing sessions for this user
      await blacklistUserTokens(userId);

      // Delete all refresh tokens
      await prisma.refreshToken.deleteMany({
        where: { userId },
      });

      console.log(
        `[Password Reset] Password reset completed for user ${userId}. All sessions invalidated.`
      );
      span.setStatus({ code: SpanStatusCode.OK });

      return {
        success: true,
        message:
          'Password has been reset successfully. Please log in with your new password.',
      };
    } catch (error) {
      if (!(error instanceof ApiError)) {
        span.recordException(error as Error);
        span.setStatus({
          code: SpanStatusCode.ERROR,
          message: 'Password reset failed',
        });
      }
      throw error;
    } finally {
      span.end();
    }
  });
}

/**
 * Get password reset status (for debugging/admin)
 *
 * @param userId - User ID
 * @returns Reset token status or null if no pending reset
 */
export async function getResetStatus(
  userId: string
): Promise<{ hasPendingReset: boolean; expiresAt?: string } | null> {
  const key = `${RESET_TOKEN_PREFIX}${userId}`;
  const data = await cache.get<ResetTokenData>(key);

  if (!data) {
    return { hasPendingReset: false };
  }

  return {
    hasPendingReset: true,
    expiresAt: data.expiresAt,
  };
}
