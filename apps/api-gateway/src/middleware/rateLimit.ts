/**
 * Rate Limiting Middleware
 *
 * Protects against brute force and DoS attacks
 * Uses Redis for distributed rate limiting across multiple instances
 * Falls back to in-memory store if Redis is unavailable (e.g., in CI)
 */

import rateLimit, { ipKeyGenerator } from 'express-rate-limit';
import Redis from 'ioredis';
import { config } from '../config';
import type { RequestHandler } from 'express';

/**
 * Track Redis connection state
 */
let redisConnected = false;
let redisClient: Redis | null = null;

/**
 * Try to create Redis client for rate limiting
 * Returns null if Redis is not available
 */
function createRedisClient(): Redis | null {
  try {
    const client = new Redis(config.redis.url, {
      // Enable offline queue temporarily to allow connection
      enableOfflineQueue: true,
      maxRetriesPerRequest: 3,
      retryStrategy: (times: number) => {
        if (times > 3) {
          console.warn('[RateLimit] Redis not available, falling back to in-memory store');
          return null; // Stop retrying
        }
        const delay = Math.min(times * 100, 2000);
        return delay;
      },
      // Faster connection timeout for CI
      connectTimeout: 5000,
      lazyConnect: true, // Don't connect immediately
    });

    client.on('error', (err) => {
      if (redisConnected) {
        console.error('[RateLimit] Redis connection error:', err.message);
      }
      redisConnected = false;
    });

    client.on('connect', () => {
      console.log('[RateLimit] Connected to Redis for rate limiting');
      redisConnected = true;
    });

    client.on('close', () => {
      redisConnected = false;
    });

    return client;
  } catch (error) {
    console.warn('[RateLimit] Failed to create Redis client:', error);
    return null;
  }
}

// Note: createRateLimitStore removed - using in-memory store by default for reliability
// Redis store can be re-enabled later if needed for distributed rate limiting

/**
 * Initialize Redis connection asynchronously
 * This doesn't block server startup
 */
async function initializeRedis(): Promise<void> {
  redisClient = createRedisClient();
  if (redisClient) {
    try {
      await redisClient.connect();
      // Test the connection
      await redisClient.ping();
      redisConnected = true;
      console.log('[RateLimit] Redis connection verified');
    } catch (error) {
      console.warn('[RateLimit] Redis not available, using in-memory rate limiting:', error);
      redisConnected = false;
      redisClient = null;
    }
  }
}

// Initialize Redis in the background (don't block startup)
initializeRedis().catch((err) => {
  console.warn('[RateLimit] Background Redis init failed:', err);
});

/**
 * General rate limiter
 * Applies to all routes by default
 * Limit: 100 requests per 15 minutes per IP
 *
 * Note: Cast to RequestHandler for Express 5 compatibility.
 * express-rate-limit v7 types are not fully compatible with Express 5.
 */
export const generalRateLimiter = rateLimit({
  windowMs: config.rateLimit.windowMs,
  max: config.rateLimit.max,
  message: {
    success: false,
    error: {
      code: 'RATE_LIMIT_EXCEEDED',
      message: 'Too many requests, please try again later',
    },
  },
  standardHeaders: true, // Return rate limit info in RateLimit-* headers
  legacyHeaders: false, // Disable X-RateLimit-* headers
  // Don't specify store - will use in-memory by default
  // Redis store will be used dynamically if available
  // Skip health checks and metrics endpoints
  skip: (req) => {
    return req.path === '/health' || req.path === '/metrics';
  },
}) as unknown as RequestHandler;

/**
 * Strict rate limiter for auth endpoints
 * More restrictive to prevent brute force attacks
 * Limit: 5 attempts per 15 minutes per IP
 * Successful requests don't count toward the limit
 *
 * Note: Cast to RequestHandler for Express 5 compatibility.
 */
export const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 attempts per 15 minutes
  message: {
    success: false,
    error: {
      code: 'RATE_LIMIT_EXCEEDED',
      message: 'Too many authentication attempts, please try again later',
    },
  },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true, // Don't count successful requests
  // Don't specify store - will use in-memory by default
  // Custom key generator to track by IP + User-Agent combination
  keyGenerator: (req) => {
    const ip = ipKeyGenerator(req.ip || req.socket.remoteAddress || '0.0.0.0');
    const userAgent = req.get('user-agent') || 'unknown';
    // Hash user agent to keep key size reasonable
    const uaHash = Buffer.from(userAgent).toString('base64').slice(0, 16);
    return `${ip}:${uaHash}`;
  },
}) as unknown as RequestHandler;

/**
 * OAuth rate limiter for social login endpoints
 * Prevents OAuth abuse while allowing legitimate use
 * Limit: 10 OAuth initiations per 15 minutes per IP
 *
 * Applied to:
 * - GET /api/auth/oauth/:provider (initiate OAuth flow)
 * - POST /api/auth/oauth/link/:provider (link OAuth account)
 *
 * Not applied to:
 * - GET /api/auth/oauth/callback (handled by provider, not user-initiated)
 * - GET /api/auth/oauth/providers (public info endpoint)
 * - GET /api/auth/oauth/accounts (authenticated, get linked accounts)
 * - DELETE /api/auth/oauth/:provider (authenticated, unlink)
 *
 * Note: Cast to RequestHandler for Express 5 compatibility.
 */
export const oauthRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // 10 OAuth initiations per 15 minutes
  message: {
    success: false,
    error: {
      code: 'RATE_LIMIT_EXCEEDED',
      message: 'Too many OAuth requests, please try again later',
    },
  },
  standardHeaders: true,
  legacyHeaders: false,
  // Track by IP address
  keyGenerator: (req) => {
    const ip = ipKeyGenerator(req.ip || req.socket.remoteAddress || '0.0.0.0');
    return `oauth:${ip}`;
  },
}) as unknown as RequestHandler;

/**
 * Get Redis client for cleanup on shutdown
 * Returns null if Redis is not being used
 */
export function getRateLimitRedisClient(): Redis | null {
  return redisClient;
}
