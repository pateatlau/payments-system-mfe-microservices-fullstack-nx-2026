/**
 * Rate Limiting Middleware
 *
 * Protects against brute force and DoS attacks
 */

import rateLimit from 'express-rate-limit';
import { config } from '../config';

/**
 * General rate limiter
 * Applies to all routes by default
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
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * Strict rate limiter for auth endpoints
 * More restrictive to prevent brute force attacks
 * TODO: RESTORE ORIGINAL RATE LIMIT - Currently set to very high value temporarily
 */
export const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  // Original: max: 5, // 5 attempts per 15 minutes
  max: 100000, // Temporary high value (to be restored to 5)
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
});
