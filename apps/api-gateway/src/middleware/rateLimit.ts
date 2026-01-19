/**
 * Rate Limiting Middleware
 *
 * Protects against brute force and DoS attacks
 * Uses Redis for distributed rate limiting across multiple instances
 * Falls back to in-memory store if Redis is unavailable (e.g., in CI)
 */

import rateLimit, { type Store } from 'express-rate-limit';
import RedisStore from 'rate-limit-redis';
import Redis from 'ioredis';
import { config } from '../config';

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

/**
 * Create rate limit store - uses Redis if available, otherwise in-memory
 */
function createRateLimitStore(prefix: string): Store | undefined {
  // Try to use Redis if client is available and connected
  if (redisClient && redisConnected) {
    try {
      const sendCommand = async (...args: string[]): Promise<number | string | (number | string)[]> => {
        const command = args[0] as string;
        const commandArgs = args.slice(1);
        const result = await redisClient!.call(command, ...commandArgs);
        return result as number | string | (number | string)[];
      };

      return new RedisStore({
        sendCommand,
        prefix,
      });
    } catch (error) {
      console.warn(`[RateLimit] Failed to create Redis store for ${prefix}, using in-memory:`, error);
    }
  }

  // Return undefined to use express-rate-limit's default in-memory store
  console.log(`[RateLimit] Using in-memory store for ${prefix}`);
  return undefined;
}

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
});

/**
 * Strict rate limiter for auth endpoints
 * More restrictive to prevent brute force attacks
 * Limit: 5 attempts per 15 minutes per IP
 * Successful requests don't count toward the limit
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
    const ip = req.ip || req.socket.remoteAddress || 'unknown';
    const userAgent = req.get('user-agent') || 'unknown';
    // Hash user agent to keep key size reasonable
    const uaHash = Buffer.from(userAgent).toString('base64').slice(0, 16);
    return `${ip}:${uaHash}`;
  },
});

/**
 * Export Redis client for cleanup on shutdown
 */
export const rateLimitRedisClient = redisClient;
