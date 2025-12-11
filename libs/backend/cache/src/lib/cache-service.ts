/**
 * Redis Cache Service
 * Production-ready caching service with TTL and tag-based invalidation
 */

import Redis from 'ioredis';
import type { CacheConfig, CacheOptions, CacheStats } from './types';

export class CacheService {
  private redis: Redis;
  private readonly tagKeyPrefix = 'cache:tag:';
  private readonly keyPrefix: string;
  private readonly defaultTtl?: number;
  private readonly enableStats: boolean;
  
  // Statistics
  private stats: CacheStats = {
    hits: 0,
    misses: 0,
    sets: 0,
    deletes: 0,
    hitRate: 0,
  };

  constructor(config: CacheConfig | string) {
    const cfg = typeof config === 'string' ? { redisUrl: config } : config;
    
    this.redis = new Redis(cfg.redisUrl, {
      retryStrategy: (times) => {
        const delay = Math.min(times * 50, 2000);
        return delay;
      },
      maxRetriesPerRequest: 3,
      enableReadyCheck: true,
      lazyConnect: false,
      showFriendlyErrorStack: process.env.NODE_ENV === 'development',
    });

    this.keyPrefix = cfg.keyPrefix || '';
    this.defaultTtl = cfg.defaultTtl;
    this.enableStats = cfg.enableStats ?? process.env.NODE_ENV === 'development';

    // Log connection status in development
    if (process.env.NODE_ENV === 'development') {
      this.redis.on('connect', () => {
        console.log('[CacheService] Connected to Redis');
      });

      this.redis.on('error', (err) => {
        console.error('[CacheService] Redis error:', err.message);
      });
    }
  }

  /**
   * Get a value from cache
   */
  async get<T>(key: string): Promise<T | null> {
    try {
      const fullKey = this.getFullKey(key);
      const data = await this.redis.get(fullKey);
      
      if (data === null) {
        this.recordMiss();
        return null;
      }

      this.recordHit();
      return JSON.parse(data) as T;
    } catch (error) {
      console.error(`[CacheService] Error getting key "${key}":`, error);
      return null;
    }
  }

  /**
   * Set a value in cache with optional TTL and tags
   */
  async set<T>(key: string, value: T, options?: CacheOptions): Promise<void> {
    try {
      const fullKey = this.getFullKey(key);
      const data = JSON.stringify(value);
      const ttl = options?.ttl ?? this.defaultTtl;

      // Set with TTL if specified
      if (ttl) {
        await this.redis.setex(fullKey, ttl, data);
      } else {
        await this.redis.set(fullKey, data);
      }

      // Track key with tags for invalidation
      if (options?.tags && options.tags.length > 0) {
        const pipeline = this.redis.pipeline();
        for (const tag of options.tags) {
          pipeline.sadd(this.getTagKey(tag), fullKey);
        }
        await pipeline.exec();
      }

      this.recordSet();
    } catch (error) {
      console.error(`[CacheService] Error setting key "${key}":`, error);
      throw error;
    }
  }

  /**
   * Delete a specific key from cache
   */
  async delete(key: string): Promise<void> {
    try {
      const fullKey = this.getFullKey(key);
      await this.redis.del(fullKey);
      this.recordDelete();
    } catch (error) {
      console.error(`[CacheService] Error deleting key "${key}":`, error);
      throw error;
    }
  }

  /**
   * Delete multiple keys from cache
   */
  async deleteMany(keys: string[]): Promise<void> {
    if (keys.length === 0) return;

    try {
      const fullKeys = keys.map(k => this.getFullKey(k));
      await this.redis.del(...fullKeys);
      this.stats.deletes += keys.length;
    } catch (error) {
      console.error('[CacheService] Error deleting multiple keys:', error);
      throw error;
    }
  }

  /**
   * Invalidate all keys associated with a tag
   */
  async invalidateByTag(tag: string): Promise<void> {
    try {
      const tagKey = this.getTagKey(tag);
      const keys = await this.redis.smembers(tagKey);
      
      if (keys && keys.length > 0) {
        // Delete all keys associated with the tag
        await this.redis.del(...keys);
        // Delete the tag set itself
        await this.redis.del(tagKey);
        this.stats.deletes += keys.length;
        
        console.log(`[CacheService] Invalidated ${keys.length} keys for tag "${tag}"`);
      }
    } catch (error) {
      console.error(`[CacheService] Error invalidating tag "${tag}":`, error);
      throw error;
    }
  }

  /**
   * Invalidate multiple tags at once
   */
  async invalidateByTags(tags: string[]): Promise<void> {
    await Promise.all(tags.map(tag => this.invalidateByTag(tag)));
  }

  /**
   * Check if a key exists in cache
   */
  async exists(key: string): Promise<boolean> {
    try {
      const fullKey = this.getFullKey(key);
      const result = await this.redis.exists(fullKey);
      return result === 1;
    } catch (error) {
      console.error(`[CacheService] Error checking key existence "${key}":`, error);
      return false;
    }
  }

  /**
   * Get remaining TTL for a key (in seconds)
   */
  async getTtl(key: string): Promise<number> {
    try {
      const fullKey = this.getFullKey(key);
      return await this.redis.ttl(fullKey);
    } catch (error) {
      console.error(`[CacheService] Error getting TTL for key "${key}":`, error);
      return -1;
    }
  }

  /**
   * Flush all cache keys (use with caution!)
   */
  async flush(): Promise<void> {
    try {
      if (this.keyPrefix) {
        // Only flush keys with our prefix
        const keys = await this.redis.keys(`${this.keyPrefix}*`);
        if (keys && keys.length > 0) {
          await this.redis.del(...keys);
        }
      } else {
        // Flush entire database
        await this.redis.flushdb();
      }
      console.log('[CacheService] Cache flushed');
    } catch (error) {
      console.error('[CacheService] Error flushing cache:', error);
      throw error;
    }
  }

  /**
   * Get cache statistics
   */
  getStats(): CacheStats {
    const total = this.stats.hits + this.stats.misses;
    this.stats.hitRate = total > 0 ? (this.stats.hits / total) * 100 : 0;
    return { ...this.stats };
  }

  /**
   * Reset cache statistics
   */
  resetStats(): void {
    this.stats = {
      hits: 0,
      misses: 0,
      sets: 0,
      deletes: 0,
      hitRate: 0,
    };
  }

  /**
   * Close Redis connection
   */
  async disconnect(): Promise<void> {
    await this.redis.quit();
    console.log('[CacheService] Disconnected from Redis');
  }

  /**
   * Check if Redis connection is healthy
   */
  async isHealthy(): Promise<boolean> {
    try {
      const result = await this.redis.ping();
      return result === 'PONG';
    } catch (error) {
      return false;
    }
  }

  // Private helper methods

  private getFullKey(key: string): string {
    return this.keyPrefix ? `${this.keyPrefix}${key}` : key;
  }

  private getTagKey(tag: string): string {
    return `${this.keyPrefix}${this.tagKeyPrefix}${tag}`;
  }

  private recordHit(): void {
    if (this.enableStats) {
      this.stats.hits++;
    }
  }

  private recordMiss(): void {
    if (this.enableStats) {
      this.stats.misses++;
    }
  }

  private recordSet(): void {
    if (this.enableStats) {
      this.stats.sets++;
    }
  }

  private recordDelete(): void {
    if (this.enableStats) {
      this.stats.deletes++;
    }
  }
}
