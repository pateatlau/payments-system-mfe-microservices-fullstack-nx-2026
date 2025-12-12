# @mfe-poc/cache

Production-ready Redis caching library for backend services with TTL support and tag-based invalidation.

## Features

- **Simple API**: Easy-to-use get/set/delete operations
- **TTL Support**: Automatic key expiration
- **Tag-based Invalidation**: Invalidate related keys efficiently
- **Type-safe**: Full TypeScript support
- **Statistics**: Built-in cache hit/miss tracking
- **Production-ready**: Error handling and retry logic
- **Key Prefixing**: Namespace isolation for different environments

## Installation

The library is available in the monorepo at `@mfe-poc/cache`.

### Peer Dependencies

Requires `ioredis` ^5.8.2 (already installed in the workspace).

## Usage

### Basic Usage

```typescript
import { CacheService } from '@mfe-poc/cache';

// Initialize with connection string
const cache = new CacheService('redis://localhost:6379');

// Or with configuration
const cache = new CacheService({
  redisUrl: 'redis://localhost:6379',
  keyPrefix: 'myapp:',
  defaultTtl: 300, // 5 minutes
  enableStats: true,
});

// Get value
const user = await cache.get<User>('user:123');

// Set value with TTL
await cache.set('user:123', { id: '123', name: 'John' }, { ttl: 300 });

// Delete value
await cache.delete('user:123');
```

### Advanced Usage

#### Tag-based Invalidation

```typescript
// Set values with tags
await cache.set('user:1', user1, {
  ttl: 300,
  tags: ['users', 'active-users'],
});
await cache.set('user:2', user2, {
  ttl: 300,
  tags: ['users', 'active-users'],
});

// Invalidate all keys with a tag
await cache.invalidateByTag('users'); // Deletes both user:1 and user:2

// Invalidate multiple tags
await cache.invalidateByTags(['users', 'payments']);
```

#### Using Cache Key Patterns

```typescript
import { CacheKeys, CacheTags } from '@mfe-poc/cache';

// Consistent key generation
const userKey = CacheKeys.user('123'); // 'user:123'
const paymentKey = CacheKeys.payment('abc'); // 'payment:abc'
const listKey = CacheKeys.paymentList('user-1', 1); // 'payments:user:user-1:page:1'

// Consistent tag generation
const userTag = CacheTags.user('123'); // 'user:123'
const paymentsTag = CacheTags.payments; // 'payments'

// Example usage
await cache.set(userKey, userData, {
  ttl: 300,
  tags: [CacheTags.users, userTag],
});
```

#### Statistics

```typescript
// Get cache statistics
const stats = cache.getStats();
console.log(`Hit Rate: ${stats.hitRate.toFixed(2)}%`);
console.log(`Hits: ${stats.hits}, Misses: ${stats.misses}`);

// Reset statistics
cache.resetStats();
```

#### Health Check

```typescript
// Check if Redis is healthy
const isHealthy = await cache.isHealthy();
if (!isHealthy) {
  console.error('Redis connection is unhealthy');
}
```

#### TTL Management

```typescript
// Check if key exists
const exists = await cache.exists('user:123');

// Get remaining TTL
const ttl = await cache.getTtl('user:123');
console.log(`Key expires in ${ttl} seconds`);
```

#### Cleanup

```typescript
// Flush all cache keys (with prefix)
await cache.flush();

// Disconnect when done
await cache.disconnect();
```

## Service Integration Example

### Auth Service

```typescript
import { CacheService, CacheKeys, CacheTags } from '@mfe-poc/cache';

class UserService {
  private cache: CacheService;

  constructor(private prisma: PrismaClient) {
    this.cache = new CacheService({
      redisUrl: process.env.REDIS_URL || 'redis://localhost:6379',
      keyPrefix: 'auth:',
      defaultTtl: 300, // 5 minutes
    });
  }

  async getUserById(id: string): Promise<User | null> {
    // Try cache first
    const cached = await this.cache.get<User>(CacheKeys.user(id));
    if (cached) {
      console.log(`[Cache HIT] ${CacheKeys.user(id)}`);
      return cached;
    }

    // Cache miss - fetch from database
    console.log(`[Cache MISS] ${CacheKeys.user(id)}`);
    const user = await this.prisma.user.findUnique({ where: { id } });
    
    if (user) {
      await this.cache.set(CacheKeys.user(id), user, {
        ttl: 300,
        tags: [CacheTags.users],
      });
    }

    return user;
  }

  async updateUser(id: string, data: UpdateUserDto): Promise<User> {
    const user = await this.prisma.user.update({ where: { id }, data });
    
    // Invalidate user cache
    await this.cache.delete(CacheKeys.user(id));
    
    return user;
  }
}
```

## Configuration

### CacheConfig

| Option       | Type    | Required | Default                    | Description                        |
| ------------ | ------- | -------- | -------------------------- | ---------------------------------- |
| redisUrl     | string  | Yes      | -                          | Redis connection URL               |
| keyPrefix    | string  | No       | ''                         | Prefix for all cache keys          |
| defaultTtl   | number  | No       | undefined (no expiration)  | Default TTL in seconds             |
| enableStats  | boolean | No       | true in dev, false in prod | Enable statistics collection       |

### CacheOptions

| Option | Type     | Required | Description                  |
| ------ | -------- | -------- | ---------------------------- |
| ttl    | number   | No       | Time-to-live in seconds      |
| tags   | string[] | No       | Tags for cache invalidation  |

## Cache Key Patterns

Predefined key patterns for consistency:

```typescript
CacheKeys.user(id)                      // 'user:{id}'
CacheKeys.userByEmail(email)            // 'user:email:{email}'
CacheKeys.payment(id)                   // 'payment:{id}'
CacheKeys.paymentList(userId, page)     // 'payments:user:{userId}:page:{page}'
CacheKeys.profile(userId)               // 'profile:{userId}'
CacheKeys.profilePreferences(userId)    // 'profile:{userId}:preferences'
CacheKeys.auditLogs(page, limit)        // 'audit:logs:page:{page}:limit:{limit}'
CacheKeys.systemConfig(key)             // 'config:{key}'
```

## Cache Tag Patterns

Predefined tags for invalidation:

```typescript
CacheTags.users                         // 'users'
CacheTags.user(userId)                  // 'user:{userId}'
CacheTags.payments                      // 'payments'
CacheTags.profiles                      // 'profiles'
CacheTags.auditLogs                     // 'audit-logs'
CacheTags.systemConfig                  // 'system-config'
```

## Best Practices

### 1. Use Appropriate TTLs

```typescript
// Frequently changing data - short TTL
await cache.set('payment:status:123', status, { ttl: 60 }); // 1 minute

// Stable data - longer TTL
await cache.set('user:profile:123', profile, { ttl: 300 }); // 5 minutes

// Very stable data - very long TTL
await cache.set('system:config', config, { ttl: 3600 }); // 1 hour
```

### 2. Always Use Tags

```typescript
// Good: Tags allow bulk invalidation
await cache.set('user:123', user, {
  tags: ['users', 'user:123'],
});

// Later, invalidate all user-related caches
await cache.invalidateByTag('user:123');
```

### 3. Invalidate on Mutations

```typescript
async updateUser(id: string, data: UpdateUserDto) {
  const user = await this.prisma.user.update({ where: { id }, data });
  
  // Invalidate user cache
  await cache.delete(CacheKeys.user(id));
  
  // Or invalidate all user-related caches
  await cache.invalidateByTag(CacheTags.user(id));
  
  return user;
}
```

### 4. Handle Cache Failures Gracefully

```typescript
async getUser(id: string): Promise<User | null> {
  try {
    const cached = await cache.get<User>(CacheKeys.user(id));
    if (cached) return cached;
  } catch (error) {
    // Log but don't fail - fallback to database
    console.error('Cache error:', error);
  }

  // Always have database fallback
  return await this.prisma.user.findUnique({ where: { id } });
}
```

### 5. Monitor Cache Performance

```typescript
// Periodically log cache statistics
setInterval(() => {
  const stats = cache.getStats();
  console.log('Cache Stats:', {
    hitRate: `${stats.hitRate.toFixed(2)}%`,
    hits: stats.hits,
    misses: stats.misses,
  });
}, 60000); // Every minute
```

## Testing

```bash
# Run cache library tests
pnpm nx test cache

# Run with coverage
pnpm nx test cache --coverage
```

## Performance

### Expected Hit Rates

- **User lookups**: 80-90% (frequently accessed)
- **Payment lists**: 70-80% (pagination changes)
- **Profiles**: 85-95% (rarely changes)
- **System config**: 95%+ (very stable)

### Response Time Improvements

- **Cached**: < 5ms
- **Uncached (DB query)**: 50-200ms
- **Improvement**: 10-40x faster

## Troubleshooting

### Connection Issues

```typescript
// Check if Redis is reachable
const isHealthy = await cache.isHealthy();
```

### Cache Not Working

1. Check Redis is running: `docker ps | grep redis`
2. Test Redis connection: `pnpm redis:ping`
3. Check logs for errors
4. Verify REDIS_URL environment variable

### High Miss Rate

1. Check if TTLs are too short
2. Verify invalidation isn't too aggressive
3. Check if keys are being generated consistently
4. Monitor logs for cache errors

## Related Documentation

- [Redis Documentation](https://redis.io/docs/)
- [ioredis Documentation](https://github.com/redis/ioredis)
- [Caching Best Practices](https://redis.io/docs/manual/patterns/)

## License

Private - Part of Payments System MFE POC-3
