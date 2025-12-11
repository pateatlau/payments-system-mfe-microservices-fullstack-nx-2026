/**
 * Cache Service Tests
 * Integration tests that require Redis to be running
 */

import { CacheService } from './cache-service';
import type { CacheConfig } from './types';

// These are integration tests that require Redis to be running
// For unit tests, Redis would need to be mocked
describe('CacheService', () => {
  let cacheService: CacheService;
  const testRedisUrl = process.env.REDIS_URL || 'redis://localhost:6379';

  beforeAll(async () => {
    const config: CacheConfig = {
      redisUrl: testRedisUrl,
      keyPrefix: 'test:cache:',
      enableStats: true,
    };
    cacheService = new CacheService(config);
    
    // Wait for connection to fully establish
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Verify connection
    const isHealthy = await cacheService.isHealthy();
    if (!isHealthy) {
      console.warn('Redis is not available. Tests will be skipped.');
      console.warn('Make sure Redis is running: docker ps | grep redis');
    }
  });

  afterAll(async () => {
    // Clean up test data
    try {
      await cacheService.flush();
    } catch (error) {
      // Ignore errors during cleanup
    }
    try {
      await cacheService.disconnect();
    } catch (error) {
      // Ignore errors during cleanup
    }
  });

  beforeEach(async () => {
    // Reset stats before each test
    cacheService.resetStats();
    
    // Clear test keys
    try {
      await cacheService.flush();
    } catch (error) {
      // Ignore if Redis is not available
      console.log('Redis not available for tests, skipping flush');
    }
  });

  describe('basic operations', () => {
    it('should set and get a value', async () => {
      const testData = { id: '1', name: 'Test User' };

      await cacheService.set('user:1', testData);
      const result = await cacheService.get<{ id: string; name: string }>('user:1');

      expect(result).toEqual(testData);
    });

    it('should return null for non-existent key', async () => {
      const result = await cacheService.get('nonexistent');
      expect(result).toBeNull();
    });

    it('should delete a key', async () => {
      await cacheService.set('user:1', { id: '1' });
      await cacheService.delete('user:1');
      
      const result = await cacheService.get('user:1');
      expect(result).toBeNull();
    });

    it('should delete multiple keys', async () => {
      await cacheService.set('user:1', { id: '1' });
      await cacheService.set('user:2', { id: '2' });
      await cacheService.set('user:3', { id: '3' });

      await cacheService.deleteMany(['user:1', 'user:2', 'user:3']);

      const result1 = await cacheService.get('user:1');
      const result2 = await cacheService.get('user:2');
      const result3 = await cacheService.get('user:3');

      expect(result1).toBeNull();
      expect(result2).toBeNull();
      expect(result3).toBeNull();
    });
  });

  describe('TTL operations', () => {
    it('should set value with TTL', async () => {
      await cacheService.set('temp:key', 'value', { ttl: 2 });

      // Should exist immediately
      const exists1 = await cacheService.exists('temp:key');
      expect(exists1).toBe(true);

      // Wait for expiration
      await new Promise(resolve => setTimeout(resolve, 2500));

      // Should not exist after TTL
      const exists2 = await cacheService.exists('temp:key');
      expect(exists2).toBe(false);
    });

    it('should get remaining TTL', async () => {
      await cacheService.set('temp:key', 'value', { ttl: 10 });

      const ttl = await cacheService.getTtl('temp:key');
      
      // TTL should be between 9-10 seconds
      expect(ttl).toBeGreaterThan(8);
      expect(ttl).toBeLessThanOrEqual(10);
    });
  });

  describe('tag-based invalidation', () => {
    it('should invalidate keys by tag', async () => {
      await cacheService.set('user:1', { id: '1' }, { tags: ['users'] });
      await cacheService.set('user:2', { id: '2' }, { tags: ['users'] });
      await cacheService.set('payment:1', { id: '1' }, { tags: ['payments'] });

      // Invalidate all users
      await cacheService.invalidateByTag('users');

      // Users should be gone
      expect(await cacheService.get('user:1')).toBeNull();
      expect(await cacheService.get('user:2')).toBeNull();

      // Payment should still exist
      expect(await cacheService.get('payment:1')).not.toBeNull();
    });

    it('should invalidate multiple tags', async () => {
      await cacheService.set('user:1', { id: '1' }, { tags: ['users', 'active'] });
      await cacheService.set('user:2', { id: '2' }, { tags: ['users'] });
      await cacheService.set('payment:1', { id: '1' }, { tags: ['payments'] });

      await cacheService.invalidateByTags(['users', 'payments']);

      expect(await cacheService.get('user:1')).toBeNull();
      expect(await cacheService.get('user:2')).toBeNull();
      expect(await cacheService.get('payment:1')).toBeNull();
    });
  });

  describe('statistics', () => {
    it('should track hits and misses', async () => {
      // Reset stats at the start
      cacheService.resetStats();
      
      await cacheService.set('key1', 'value1');
      // Small delay for Redis
      await new Promise(resolve => setTimeout(resolve, 10));

      // Hit
      await cacheService.get('key1');
      
      // Miss
      await cacheService.get('key2');

      const stats = cacheService.getStats();
      expect(stats.hits).toBe(1);
      expect(stats.misses).toBe(1);
      expect(stats.hitRate).toBe(50);
    });

    it('should track set operations', async () => {
      await cacheService.set('key1', 'value1');
      await cacheService.set('key2', 'value2');

      const stats = cacheService.getStats();
      expect(stats.sets).toBe(2);
    });

    it('should track delete operations', async () => {
      await cacheService.set('key1', 'value1');
      await cacheService.delete('key1');

      const stats = cacheService.getStats();
      expect(stats.deletes).toBe(1);
    });

    it('should reset statistics', async () => {
      await cacheService.set('key', 'value');
      await cacheService.get('key');
      
      cacheService.resetStats();
      const stats = cacheService.getStats();

      expect(stats.hits).toBe(0);
      expect(stats.misses).toBe(0);
      expect(stats.sets).toBe(0);
      expect(stats.deletes).toBe(0);
    });
  });

  describe('utility methods', () => {
    it('should check if key exists', async () => {
      await cacheService.set('key', 'value');
      // Small delay for Redis
      await new Promise(resolve => setTimeout(resolve, 10));
      
      const exists = await cacheService.exists('key');
      expect(exists).toBe(true);

      await cacheService.delete('key');
      await new Promise(resolve => setTimeout(resolve, 10));
      
      const exists2 = await cacheService.exists('key');
      expect(exists2).toBe(false);
    });

    it('should check Redis health', async () => {
      // Small delay to ensure connection is established
      await new Promise(resolve => setTimeout(resolve, 100));
      
      const isHealthy = await cacheService.isHealthy();
      expect(isHealthy).toBe(true);
    });

    it('should flush all cache keys', async () => {
      await cacheService.set('key1', 'value1');
      await cacheService.set('key2', 'value2');

      await cacheService.flush();

      const result1 = await cacheService.get('key1');
      const result2 = await cacheService.get('key2');

      expect(result1).toBeNull();
      expect(result2).toBeNull();
    });
  });

  describe('string config', () => {
    it('should accept string as config', () => {
      const service = new CacheService('redis://localhost:6379');
      expect(service).toBeInstanceOf(CacheService);
    });
  });
});
