/**
 * Cache Types
 * Type definitions for the caching library
 */

/**
 * Options for caching operations
 */
export interface CacheOptions {
  /**
   * Time-to-live in seconds
   * If not specified, the key will not expire
   */
  ttl?: number;

  /**
   * Tags for cache invalidation
   * Allows invalidating multiple related keys at once
   */
  tags?: string[];
}

/**
 * Cache statistics for monitoring
 */
export interface CacheStats {
  hits: number;
  misses: number;
  sets: number;
  deletes: number;
  hitRate: number;
}

/**
 * Cache configuration
 */
export interface CacheConfig {
  /**
   * Redis connection URL
   * Format: redis://[username:password@]host[:port][/database]
   */
  redisUrl: string;

  /**
   * Prefix for all cache keys
   * Helps namespace keys for different environments
   */
  keyPrefix?: string;

  /**
   * Default TTL in seconds
   * Applied to all set operations unless overridden
   */
  defaultTtl?: number;

  /**
   * Enable stats collection
   */
  enableStats?: boolean;
}

/**
 * Cache key patterns for consistent key generation
 */
export const CacheKeys = {
  user: (id: string) => `user:${id}`,
  userByEmail: (email: string) => `user:email:${email}`,
  payment: (id: string) => `payment:${id}`,
  paymentList: (userId: string, page: number) =>
    `payments:user:${userId}:page:${page}`,
  profile: (userId: string) => `profile:${userId}`,
  profilePreferences: (userId: string) => `profile:${userId}:preferences`,
  auditLogs: (page: number, limit: number) =>
    `audit:logs:page:${page}:limit:${limit}`,
  systemConfig: (key: string) => `config:${key}`,
} as const;

/**
 * Cache tag patterns for invalidation
 */
export const CacheTags = {
  users: 'users',
  user: (userId: string) => `user:${userId}`,
  payments: 'payments',
  profiles: 'profiles',
  auditLogs: 'audit-logs',
  systemConfig: 'system-config',
} as const;
