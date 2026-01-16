/**
 * Rate Limiting Middleware
 *
 * Protects against brute force and DoS attacks
 * Uses Redis for distributed rate limiting across multiple instances
 */

import rateLimit from 'express-rate-limit';
import RedisStore from 'rate-limit-redis';
import Redis from 'ioredis';
import { config } from '../config';

/**
 * Create Redis client for rate limiting
 * Separate client to avoid conflicts with other Redis usage
 */
const redisClient = new Redis(config.redis.url, {
  enableOfflineQueue: false,
  maxRetriesPerRequest: 3,
  retryStrategy: (times: number) => {
    const delay = Math.min(times * 50, 2000);
    return delay;
  },
});

redisClient.on('error', (err) => {
  console.error('[RateLimit] Redis connection error:', err.message);
});

redisClient.on('connect', () => {
  console.log('[RateLimit] Connected to Redis for rate limiting');
});

/**
 * Helper function to send Redis commands
 * rate-limit-redis v4 requires sendCommand for ioredis
 * Type assertion needed as ioredis returns different types than node-redis
 */
const sendCommand = async (...args: string[]): Promise<number | string | (number | string)[]> => {
  // ioredis.call() expects command as first arg, rest as additional args
  const command = args[0] as string;
  const commandArgs = args.slice(1);
  const result = await redisClient.call(command, ...commandArgs);
  return result as number | string | (number | string)[];
};

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
  store: new RedisStore({
    sendCommand,
    prefix: 'rl:general:',
  }),
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
  max: 5, // RESTORED: 5 attempts per 15 minutes
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
  store: new RedisStore({
    sendCommand,
    prefix: 'rl:auth:',
  }),
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
