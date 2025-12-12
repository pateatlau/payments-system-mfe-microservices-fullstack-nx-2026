/**
 * Cache Service Initialization
 * 
 * Singleton Redis cache instance for Profile Service
 */

import { CacheService, CacheKeys, CacheTags } from '@mfe-poc/cache';
import config from '../config';

/**
 * Initialize cache service
 */
export const cache = new CacheService({
  redisUrl: config.redisUrl,
  keyPrefix: 'profile:',
  defaultTtl: 300, // 5 minutes default
  enableStats: config.nodeEnv === 'development',
});

/**
 * Export cache keys and tags for consistent usage
 */
export { CacheKeys, CacheTags };

/**
 * Profile-specific cache TTLs (in seconds)
 */
export const ProfileCacheTTL = {
  PROFILE: 300, // 5 minutes
  PREFERENCES: 300, // 5 minutes
} as const;
