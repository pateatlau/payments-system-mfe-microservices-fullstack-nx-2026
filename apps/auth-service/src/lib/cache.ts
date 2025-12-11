/**
 * Cache Service Initialization
 * 
 * Singleton Redis cache instance for Auth Service
 */

import { CacheService, CacheKeys, CacheTags } from '@mfe-poc/cache';
import { config } from '../config';

/**
 * Initialize cache service
 */
export const cache = new CacheService({
  redisUrl: config.redisUrl,
  keyPrefix: 'auth:',
  defaultTtl: 300, // 5 minutes default
  enableStats: config.nodeEnv === 'development',
});

/**
 * Export cache keys and tags for consistent usage
 */
export { CacheKeys, CacheTags };

/**
 * Auth-specific cache TTLs (in seconds)
 */
export const AuthCacheTTL = {
  USER_BY_ID: 300, // 5 minutes
  USER_BY_EMAIL: 300, // 5 minutes
  REFRESH_TOKEN: 3600, // 1 hour
} as const;
