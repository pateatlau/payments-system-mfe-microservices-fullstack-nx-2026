/**
 * Email Verification Service
 *
 * Handles email verification token generation, storage, and validation.
 *
 * POC-3: Email Verification Implementation (Priority 1.1)
 * - JWT-based verification tokens (24h TTL)
 * - Redis storage for token tracking and single-use enforcement
 * - Rate limiting to prevent abuse (max 5 per hour)
 * - OpenTelemetry tracing for observability
 *
 * Security considerations:
 * - Tokens are JWTs signed with application secret
 * - Single-use enforcement via Redis (delete after verification)
 * - Rate limiting per user to prevent spam
 * - Privacy-safe logging (masked emails)
 */

import jwt from 'jsonwebtoken';
import { trace, SpanStatusCode } from '@opentelemetry/api';
import { cache } from '../lib/cache';
import { config } from '../config';
import { ApiError } from '../middleware/errorHandler';

// Get tracer for email verification operations
const tracer = trace.getTracer('email-verification-service', '1.0.0');

/**
 * Verification token JWT payload
 */
export interface VerificationTokenPayload {
  userId: string;
  email: string;
  purpose: 'email_verification';
  iat?: number;
  exp?: number;
}

/**
 * Stored verification token data in Redis
 */
interface VerificationTokenData {
  token: string;
  userId: string;
  email: string;
  createdAt: string;
  expiresAt: string;
}

/**
 * Rate limit data stored in Redis
 */
interface RateLimitData {
  count: number;
}

/**
 * Redis key prefixes for email verification
 */
const EMAIL_VERIFICATION_TOKEN_PREFIX = 'email_verification:';
const EMAIL_VERIFICATION_RATE_LIMIT_PREFIX = 'email_verification_rate:';

/**
 * Configuration for email verification
 */
const EMAIL_VERIFICATION_CONFIG = {
  // Token TTL: 24 hours (in seconds)
  tokenTtlSeconds: 24 * 60 * 60,
  // Max verification token requests per user per hour
  maxRequestsPerHour: 5,
  // Rate limit TTL: 1 hour (in seconds)
  rateLimitTtlSeconds: 60 * 60,
};

/**
 * Mask an email address for privacy-safe logging
 * e.g., "john.doe@example.com" -> "j*****e@example.com"
 */
function maskEmail(email: string): string {
  const [localPart, domain] = email.split('@');
  if (!localPart || !domain) return '***@***';
  if (localPart.length <= 2) return `${localPart[0]}*@${domain}`;
  return `${localPart[0]}${'*'.repeat(Math.min(localPart.length - 2, 5))}${localPart[localPart.length - 1]}@${domain}`;
}

/**
 * Check if rate limit allows token generation for a user
 *
 * Uses atomic Redis increment for race condition safety.
 *
 * @param userId - User ID to check rate limit for
 * @returns Object with allowed status and remaining attempts
 */
async function checkRateLimit(
  userId: string
): Promise<{ allowed: boolean; remaining: number; count: number }> {
  const key = `${EMAIL_VERIFICATION_RATE_LIMIT_PREFIX}${userId}`;

  // Atomic increment with TTL for new keys
  const newCount = await cache.increment(
    key,
    EMAIL_VERIFICATION_CONFIG.rateLimitTtlSeconds
  );

  if (newCount > EMAIL_VERIFICATION_CONFIG.maxRequestsPerHour) {
    return { allowed: false, remaining: 0, count: newCount };
  }

  return {
    allowed: true,
    remaining: EMAIL_VERIFICATION_CONFIG.maxRequestsPerHour - newCount,
    count: newCount,
  };
}

/**
 * Generate a verification token for a user
 *
 * Creates a JWT token with the user's ID and email, stores it in Redis,
 * and enforces rate limiting.
 *
 * @param userId - User ID to generate token for
 * @param email - User's email address
 * @returns Object with token and expiry, or error info if rate limited
 * @throws ApiError if rate limited
 */
export async function generateVerificationToken(
  userId: string,
  email: string
): Promise<{
  success: boolean;
  token?: string;
  expiresAt?: string;
  error?: string;
}> {
  return tracer.startActiveSpan('emailVerification.generateToken', async (span) => {
    try {
      span.setAttribute('user.id', userId);
      span.setAttribute('email.masked', maskEmail(email));

      // Check rate limit
      const rateLimit = await checkRateLimit(userId);
      if (!rateLimit.allowed) {
        span.setAttribute('rate_limited', true);
        span.setStatus({ code: SpanStatusCode.OK });
        console.log(
          `[Email Verification] Rate limited for user ${userId} (${rateLimit.count} requests this hour)`
        );
        throw new ApiError(
          429,
          'RATE_LIMITED',
          'Too many verification email requests. Please wait before requesting another.',
          { retryAfter: EMAIL_VERIFICATION_CONFIG.rateLimitTtlSeconds }
        );
      }

      // Delete any existing verification token for this user
      const existingKey = `${EMAIL_VERIFICATION_TOKEN_PREFIX}${userId}`;
      await cache.delete(existingKey);

      // Generate JWT token
      const now = new Date();
      const expiresAt = new Date(
        now.getTime() + EMAIL_VERIFICATION_CONFIG.tokenTtlSeconds * 1000
      );

      const payload: VerificationTokenPayload = {
        userId,
        email,
        purpose: 'email_verification',
      };

      const token = jwt.sign(
        payload,
        config.jwtSecret,
        { expiresIn: EMAIL_VERIFICATION_CONFIG.tokenTtlSeconds }
      );

      // Store token data in Redis
      const tokenData: VerificationTokenData = {
        token,
        userId,
        email,
        createdAt: now.toISOString(),
        expiresAt: expiresAt.toISOString(),
      };

      await tracer.startActiveSpan(
        'emailVerification.generateToken.store',
        async (storeSpan) => {
          try {
            await cache.set(existingKey, tokenData, {
              ttl: EMAIL_VERIFICATION_CONFIG.tokenTtlSeconds,
            });
            storeSpan.setStatus({ code: SpanStatusCode.OK });
          } catch (error) {
            storeSpan.recordException(error as Error);
            storeSpan.setStatus({
              code: SpanStatusCode.ERROR,
              message: 'Failed to store verification token',
            });
            throw error;
          } finally {
            storeSpan.end();
          }
        }
      );

      console.log(
        `[Email Verification] Token generated for user ${userId} (${maskEmail(email)})`
      );
      span.setStatus({ code: SpanStatusCode.OK });

      return {
        success: true,
        token,
        expiresAt: expiresAt.toISOString(),
      };
    } catch (error) {
      if (!(error instanceof ApiError)) {
        span.recordException(error as Error);
        span.setStatus({
          code: SpanStatusCode.ERROR,
          message: 'Failed to generate verification token',
        });
      }
      throw error;
    } finally {
      span.end();
    }
  });
}

/**
 * Validate a verification token
 *
 * Verifies the JWT signature, checks expiry, and validates against Redis store.
 * Does NOT consume the token - use consumeVerificationToken for that.
 *
 * @param token - JWT verification token
 * @returns Decoded token payload if valid
 * @throws ApiError if token is invalid, expired, or not found
 */
export async function validateVerificationToken(
  token: string
): Promise<VerificationTokenPayload> {
  return tracer.startActiveSpan('emailVerification.validateToken', async (span) => {
    try {
      // Verify JWT signature and expiry
      let payload: VerificationTokenPayload;
      try {
        payload = jwt.verify(token, config.jwtSecret) as VerificationTokenPayload;
      } catch (error) {
        if (error instanceof jwt.TokenExpiredError) {
          throw new ApiError(
            400,
            'TOKEN_EXPIRED',
            'Verification link has expired. Please request a new one.'
          );
        }
        if (error instanceof jwt.JsonWebTokenError) {
          throw new ApiError(
            400,
            'INVALID_TOKEN',
            'Invalid verification link. Please request a new one.'
          );
        }
        throw error;
      }

      // Verify token purpose
      if (payload.purpose !== 'email_verification') {
        throw new ApiError(
          400,
          'INVALID_TOKEN',
          'Invalid verification link. Please request a new one.'
        );
      }

      span.setAttribute('user.id', payload.userId);
      span.setAttribute('email.masked', maskEmail(payload.email));

      // Check if token exists in Redis (single-use enforcement)
      const key = `${EMAIL_VERIFICATION_TOKEN_PREFIX}${payload.userId}`;
      const storedData = await tracer.startActiveSpan(
        'emailVerification.validateToken.checkRedis',
        async (checkSpan) => {
          try {
            const result = await cache.get<VerificationTokenData>(key);
            checkSpan.setStatus({ code: SpanStatusCode.OK });
            return result;
          } catch (error) {
            checkSpan.recordException(error as Error);
            checkSpan.setStatus({
              code: SpanStatusCode.ERROR,
              message: 'Failed to check Redis',
            });
            throw error;
          } finally {
            checkSpan.end();
          }
        }
      );

      // Token not found in Redis - already used or never existed
      if (!storedData) {
        throw new ApiError(
          400,
          'TOKEN_ALREADY_USED',
          'This verification link has already been used or is invalid.'
        );
      }

      // Verify token matches stored token
      if (storedData.token !== token) {
        throw new ApiError(
          400,
          'INVALID_TOKEN',
          'Invalid verification link. Please request a new one.'
        );
      }

      console.log(
        `[Email Verification] Token validated for user ${payload.userId}`
      );
      span.setStatus({ code: SpanStatusCode.OK });

      return payload;
    } catch (error) {
      if (error instanceof ApiError) {
        span.setAttribute('error.code', error.code);
      } else {
        span.recordException(error as Error);
      }
      span.setStatus({
        code: SpanStatusCode.ERROR,
        message: error instanceof ApiError ? error.code : 'Validation failed',
      });
      throw error;
    } finally {
      span.end();
    }
  });
}

/**
 * Consume (use) a verification token
 *
 * Validates the token and deletes it from Redis (single-use enforcement).
 * Call this AFTER successfully updating the user's emailVerified status.
 *
 * @param userId - User ID whose token should be consumed
 * @returns Success status
 */
export async function consumeVerificationToken(userId: string): Promise<boolean> {
  return tracer.startActiveSpan('emailVerification.consumeToken', async (span) => {
    try {
      span.setAttribute('user.id', userId);

      const key = `${EMAIL_VERIFICATION_TOKEN_PREFIX}${userId}`;

      // Delete the token from Redis
      await cache.delete(key);

      console.log(
        `[Email Verification] Token consumed for user ${userId}`
      );
      span.setStatus({ code: SpanStatusCode.OK });

      return true;
    } catch (error) {
      span.recordException(error as Error);
      span.setStatus({
        code: SpanStatusCode.ERROR,
        message: 'Failed to consume verification token',
      });
      // Don't throw - token consumption failure shouldn't block verification
      console.error(
        `[Email Verification] Failed to consume token for user ${userId}:`,
        error
      );
      return false;
    } finally {
      span.end();
    }
  });
}

/**
 * Get verification token status for a user
 *
 * Useful for checking if a user has a pending verification token.
 *
 * @param userId - User ID to check
 * @returns Token status or null if no pending token
 */
export async function getVerificationStatus(
  userId: string
): Promise<{
  hasPendingVerification: boolean;
  expiresAt?: string;
  createdAt?: string;
} | null> {
  const key = `${EMAIL_VERIFICATION_TOKEN_PREFIX}${userId}`;
  const data = await cache.get<VerificationTokenData>(key);

  if (!data) {
    return { hasPendingVerification: false };
  }

  return {
    hasPendingVerification: true,
    expiresAt: data.expiresAt,
    createdAt: data.createdAt,
  };
}

/**
 * Get rate limit status for a user
 *
 * @param userId - User ID to check
 * @returns Rate limit info
 */
export async function getRateLimitStatus(
  userId: string
): Promise<{
  remaining: number;
  maxPerHour: number;
  resetsIn?: number;
}> {
  const key = `${EMAIL_VERIFICATION_RATE_LIMIT_PREFIX}${userId}`;
  const data = await cache.get<RateLimitData>(key);

  if (!data) {
    return {
      remaining: EMAIL_VERIFICATION_CONFIG.maxRequestsPerHour,
      maxPerHour: EMAIL_VERIFICATION_CONFIG.maxRequestsPerHour,
    };
  }

  const remaining = Math.max(
    0,
    EMAIL_VERIFICATION_CONFIG.maxRequestsPerHour - data.count
  );

  return {
    remaining,
    maxPerHour: EMAIL_VERIFICATION_CONFIG.maxRequestsPerHour,
    // Note: We don't have exact TTL info here, but it resets within an hour
    resetsIn: EMAIL_VERIFICATION_CONFIG.rateLimitTtlSeconds,
  };
}

/**
 * Clear verification token for a user (admin use)
 *
 * @param userId - User ID to clear token for
 */
export async function clearVerificationToken(userId: string): Promise<void> {
  const key = `${EMAIL_VERIFICATION_TOKEN_PREFIX}${userId}`;
  await cache.delete(key);
  console.log(`[Email Verification] Token cleared for user ${userId}`);
}

/**
 * Clear rate limit for a user (admin use)
 *
 * @param userId - User ID to clear rate limit for
 */
export async function clearRateLimit(userId: string): Promise<void> {
  const key = `${EMAIL_VERIFICATION_RATE_LIMIT_PREFIX}${userId}`;
  await cache.delete(key);
  console.log(`[Email Verification] Rate limit cleared for user ${userId}`);
}
