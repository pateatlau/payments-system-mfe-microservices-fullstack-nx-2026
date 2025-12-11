/**
 * Backend Cache Library
 * Production-ready Redis caching with TTL and tag-based invalidation
 */

export { CacheService } from './lib/cache-service';
export {
  CacheConfig,
  CacheOptions,
  CacheStats,
  CacheKeys,
  CacheTags,
} from './lib/types';
