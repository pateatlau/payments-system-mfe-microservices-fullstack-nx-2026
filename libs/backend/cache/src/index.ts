/**
 * Backend Cache Library
 * Production-ready Redis caching with TTL and tag-based invalidation
 */

export { CacheService } from './lib/cache-service';
export type {
  CacheConfig,
  CacheOptions,
  CacheStats,
} from './lib/types';
export {
  CacheKeys,
  CacheTags,
} from './lib/types';
