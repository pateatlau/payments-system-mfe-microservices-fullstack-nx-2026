/**
 * Cache Service Initialization
 *
 * Singleton Redis cache instance for Payments Service
 */

import { CacheService, CacheKeys, CacheTags } from '@mfe-poc/cache';
import { config } from '../config';

/**
 * Initialize cache service
 */
export const cache = new CacheService({
  redisUrl: config.redisUrl,
  keyPrefix: 'payments:',
  defaultTtl: 60, // 1 minute default (payments change frequently)
  enableStats: config.nodeEnv === 'development',
});

/**
 * Export cache keys and tags for consistent usage
 */
export { CacheKeys, CacheTags };

/**
 * Payments-specific cache TTLs (in seconds)
 */
export const PaymentsCacheTTL = {
  PAYMENT_BY_ID: 60, // 1 minute
  PAYMENT_LIST: 60, // 1 minute
  PAYMENT_REPORTS: 300, // 5 minutes
} as const;
