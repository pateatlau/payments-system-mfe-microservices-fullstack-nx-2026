# Caching Strategy Guide - POC-3

**Status:** Complete  
**Version:** 1.0  
**Date:** 2026-12-11  
**Purpose:** Complete guide for caching strategies in POC-3

---

## Overview

POC-3 implements a multi-layer caching strategy to improve performance and reduce server load. This guide covers browser caching, CDN/nginx caching, service worker caching, and Redis backend caching.

---

## Table of Contents

1. [Caching Layers](#caching-layers)
2. [Browser Cache (HTTP Headers)](#browser-cache-http-headers)
3. [Service Worker Cache](#service-worker-cache)
4. [Redis Backend Cache](#redis-backend-cache)
5. [Cache Invalidation](#cache-invalidation)
6. [Best Practices](#best-practices)
7. [Troubleshooting](#troubleshooting)

---

## Caching Layers

### Layer 1: Browser Cache (HTTP Headers)

nginx sets cache headers for static assets and API responses.

### Layer 2: Service Worker (Workbox)

Browser-based caching for offline support and performance.

### Layer 3: Redis Cache (Backend)

Server-side caching for database queries and API responses.

---

## Browser Cache (HTTP Headers)

### Static Assets

nginx configuration for long-lived static assets:

```nginx
# Static assets - 1 year cache, immutable
location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
    expires 1y;
    add_header Cache-Control "public, immutable";
    access_log off;
}
```

**Cache Strategy:** Cache-First  
**TTL:** 1 year  
**Use Case:** JS bundles, CSS, images, fonts

### HTML Files

```nginx
# HTML files - no cache
location ~* \.html$ {
    expires -1;
    add_header Cache-Control "no-cache, no-store, must-revalidate";
    add_header Pragma "no-cache";
}
```

**Cache Strategy:** No-Cache  
**Use Case:** HTML files (always fetch latest)

### JSON Files

```nginx
# JSON files - 5 minutes cache
location ~* \.json$ {
    expires 5m;
    add_header Cache-Control "public, max-age=300";
}
```

**Cache Strategy:** Network-First  
**TTL:** 5 minutes  
**Use Case:** API responses, configuration files

---

## Service Worker Cache

### Installation

Service Worker is automatically registered in production:

```typescript
// apps/shell/src/utils/register-sw.ts
import { registerServiceWorker } from './register-sw';

// Automatically registers in production
registerServiceWorker();
```

### Caching Strategies

#### 1. Precaching (Static Assets)

```typescript
// apps/shell/src/sw.ts
import { precacheAndRoute } from 'workbox-precaching';

// Precache all static assets
precacheAndRoute(self.__WB_MANIFEST);
```

**Strategy:** Cache-First  
**Use Case:** Build-time static assets

#### 2. API Responses (NetworkFirst)

```typescript
import { registerRoute } from 'workbox-routing';
import { NetworkFirst } from 'workbox-strategies';
import { ExpirationPlugin } from 'workbox-expiration';

registerRoute(
  ({ url }) => url.pathname.startsWith('/api/'),
  new NetworkFirst({
    cacheName: 'api-cache',
    networkTimeoutSeconds: 5,
    plugins: [
      new ExpirationPlugin({
        maxEntries: 100,
        maxAgeSeconds: 5 * 60, // 5 minutes
      }),
    ],
  })
);
```

**Strategy:** NetworkFirst  
**TTL:** 5 minutes  
**Max Entries:** 100  
**Use Case:** API GET requests

#### 3. Images (CacheFirst)

```typescript
registerRoute(
  ({ request }) => request.destination === 'image',
  new CacheFirst({
    cacheName: 'images',
    plugins: [
      new ExpirationPlugin({
        maxEntries: 60,
        maxAgeSeconds: 30 * 24 * 60 * 60, // 30 days
      }),
    ],
  })
);
```

**Strategy:** CacheFirst  
**TTL:** 30 days  
**Max Entries:** 60  
**Use Case:** Images, icons

#### 4. Fonts (CacheFirst)

```typescript
registerRoute(
  ({ request }) => request.destination === 'font',
  new CacheFirst({
    cacheName: 'fonts',
    plugins: [
      new ExpirationPlugin({
        maxEntries: 30,
        maxAgeSeconds: 365 * 24 * 60 * 60, // 1 year
      }),
    ],
  })
);
```

**Strategy:** CacheFirst  
**TTL:** 1 year  
**Max Entries:** 30  
**Use Case:** Web fonts

#### 5. Module Federation Remotes (NetworkFirst)

```typescript
registerRoute(
  ({ url }) => url.pathname.includes('remoteEntry.js'),
  new NetworkFirst({
    cacheName: 'remotes',
    networkTimeoutSeconds: 3,
    plugins: [
      new ExpirationPlugin({
        maxEntries: 10,
        maxAgeSeconds: 60 * 60, // 1 hour
      }),
    ],
  })
);
```

**Strategy:** NetworkFirst  
**TTL:** 1 hour  
**Max Entries:** 10  
**Use Case:** Module Federation remote entry files

### Offline Support

```typescript
// Offline fallback page
registerRoute(
  ({ request }) => request.mode === 'navigate',
  new NetworkFirst({
    cacheName: 'pages',
    plugins: [
      new ExpirationPlugin({
        maxEntries: 50,
      }),
    ],
  })
);
```

**Offline Fallback:** `/offline.html`

---

## Redis Backend Cache

### Installation

Redis cache service is available in `libs/backend/cache`:

```typescript
import { CacheService } from '@payments-system/cache';

const cache = new CacheService({
  redisUrl: process.env.REDIS_URL || 'redis://localhost:6379',
  keyPrefix: 'app:',
  defaultTtl: 3600, // 1 hour
});
```

### Cache Patterns

#### 1. Cache-Aside Pattern

```typescript
async getUser(id: string): Promise<User> {
  const cacheKey = `user:${id}`;

  // Try cache first
  const cached = await cache.get<User>(cacheKey);
  if (cached) {
    return cached;
  }

  // Cache miss - fetch from database
  const user = await prisma.user.findUnique({ where: { id } });

  // Store in cache
  await cache.set(cacheKey, user, {
    ttl: 300, // 5 minutes
    tags: ['users', `user:${id}`],
  });

  return user;
}
```

#### 2. Write-Through Pattern

```typescript
async updateUser(id: string, data: UpdateUserDto): Promise<User> {
  // Update database
  const user = await prisma.user.update({ where: { id }, data });

  // Update cache
  await cache.set(`user:${id}`, user, {
    ttl: 300,
    tags: ['users', `user:${id}`],
  });

  return user;
}
```

#### 3. Cache Invalidation

```typescript
async deleteUser(id: string): Promise<void> {
  // Delete from database
  await prisma.user.delete({ where: { id } });

  // Invalidate cache
  await cache.delete(`user:${id}`);
  await cache.invalidateByTag('users');
}
```

### Cache Key Patterns

| Entity        | Key Pattern              | TTL    | Tags                        |
| ------------- | ------------------------ | ------ | --------------------------- |
| User          | `user:{id}`              | 5 min  | `users`, `user:{id}`        |
| User by Email | `user:email:{email}`     | 5 min  | `users`                     |
| Payment       | `payment:{id}`           | 10 min | `payments`, `payment:{id}`  |
| Payment List  | `payments:user:{userId}` | 5 min  | `payments`, `user:{userId}` |

### Cache Service API

```typescript
interface CacheService {
  // Get value from cache
  get<T>(key: string): Promise<T | null>;

  // Set value in cache
  set<T>(key: string, value: T, options?: CacheOptions): Promise<void>;

  // Delete value from cache
  delete(key: string): Promise<void>;

  // Invalidate by tag
  invalidateByTag(tag: string): Promise<void>;

  // Get cache statistics
  getStats(): Promise<CacheStats>;
}
```

---

## Cache Invalidation

### Tag-Based Invalidation

```typescript
// Invalidate all user-related cache
await cache.invalidateByTag('users');

// Invalidate specific user cache
await cache.invalidateByTag(`user:${userId}`);
```

### Time-Based Invalidation

```typescript
// Set TTL for automatic expiration
await cache.set(key, value, {
  ttl: 300, // 5 minutes
});
```

### Manual Invalidation

```typescript
// Delete specific key
await cache.delete(`user:${userId}`);

// Delete pattern
await cache.deletePattern('user:*');
```

---

## Best Practices

### 1. Cache Key Naming

Use consistent, hierarchical naming:

```typescript
// Good
'user:123';
'user:email:user@example.com';
'payments:user:123:page:1';

// Bad
'user123';
'user_email_user@example.com';
'payments_user_123_page_1';
```

### 2. TTL Selection

Choose appropriate TTL based on data volatility:

- **Static data:** 1 hour - 1 day
- **Semi-static data:** 5-15 minutes
- **Dynamic data:** 1-5 minutes
- **Real-time data:** No cache

### 3. Cache Size Limits

Set max entries to prevent memory issues:

```typescript
new ExpirationPlugin({
  maxEntries: 100, // Limit cache size
  maxAgeSeconds: 300,
});
```

### 4. Error Handling

Always handle cache errors gracefully:

```typescript
try {
  const cached = await cache.get(key);
  if (cached) return cached;
} catch (error) {
  // Log error but continue to database
  logger.warn('Cache error', { error });
}

// Fallback to database
const data = await fetchFromDatabase();
```

### 5. Cache Warming

Pre-populate cache for frequently accessed data:

```typescript
async warmCache(): Promise<void> {
  const popularUsers = await prisma.user.findMany({
    where: { isActive: true },
    take: 100,
  });

  await Promise.all(
    popularUsers.map(user =>
      cache.set(`user:${user.id}`, user, { ttl: 300 })
    )
  );
}
```

---

## Troubleshooting

### Cache Not Working

**Possible Causes:**

- Redis not running
- Cache service not initialized
- TTL expired

**Solutions:**

1. Check Redis: `docker-compose ps redis`
2. Verify cache service initialization
3. Check cache TTL settings

### Stale Data

**Possible Causes:**

- Cache not invalidated on update
- TTL too long
- Tag-based invalidation not working

**Solutions:**

1. Ensure cache invalidation on data updates
2. Reduce TTL for frequently updated data
3. Verify tag-based invalidation

### Memory Issues

**Possible Causes:**

- Too many cache entries
- TTL too long
- No max entries limit

**Solutions:**

1. Set max entries limit
2. Reduce TTL
3. Implement cache eviction policy

---

## Additional Resources

- **ADR:** `docs/adr/poc-3/0003-caching-strategy.md`
- **Cache Service:** `libs/backend/cache/`
- **Service Worker:** `apps/shell/src/sw.ts`
- **nginx Config:** `nginx/nginx.conf`

---

**Last Updated:** 2026-12-11  
**Status:** Complete
