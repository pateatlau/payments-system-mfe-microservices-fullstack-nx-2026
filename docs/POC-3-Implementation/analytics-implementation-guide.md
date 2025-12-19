# Analytics Implementation Guide - POC-3

**Status:** Complete  
**Version:** 1.0  
**Date:** 2026-12-11  
**Purpose:** Complete guide for implementing and using analytics in POC-3

---

## Overview

POC-3 implements architecture-focused analytics for tracking system performance and usage patterns. The analytics library tracks MFE load times, API call patterns, cache performance, and infrastructure metrics.

---

## Table of Contents

1. [Architecture](#architecture)
2. [Installation](#installation)
3. [Basic Usage](#basic-usage)
4. [Event Tracking](#event-tracking)
5. [Metrics Collection](#metrics-collection)
6. [React Hooks](#react-hooks)
7. [Best Practices](#best-practices)
8. [Troubleshooting](#troubleshooting)

---

## Architecture

### Analytics Library

The analytics library (`libs/shared-analytics`) provides:

- **Event Tracking** - Custom events with properties
- **MFE Load Tracking** - Micro-frontend load time measurement
- **API Call Tracking** - API endpoint performance metrics
- **Cache Tracking** - Cache hit/miss rates
- **Metrics Retrieval** - Get metrics snapshots and statistics

### Architecture-Focused Events

POC-3 focuses on architecture-related events:

- `mfe:loaded` - MFE load completion
- `mfe:load-failed` - MFE load failure
- `remote:loaded` - Module Federation remote loaded
- `api:call` - API endpoint called
- `api:error` - API call failed
- `event-bus:event` - Event bus message
- `websocket:connected` - WebSocket connection established
- `cache:hit` - Cache hit
- `cache:miss` - Cache miss

---

## Installation

The analytics library is already available:

```typescript
import { analytics } from '@payments-system/shared-analytics';
import { useAnalytics } from '@payments-system/shared-analytics/hooks';
```

---

## Basic Usage

### Track Custom Events

```typescript
import { analytics } from '@payments-system/shared-analytics';

// Track a custom event
analytics.trackEvent('user:clicked_button', {
  buttonId: 'submit-payment',
  page: 'payments',
});
```

### Track MFE Load Time

```typescript
// Track MFE load time
const loadStart = performance.now();
// ... load MFE ...
const loadEnd = performance.now();
const loadTime = loadEnd - loadStart;

analytics.trackMfeLoad('payments-mfe', loadTime);
```

### Track API Calls

```typescript
const startTime = performance.now();
try {
  const response = await api.get('/payments');
  const duration = performance.now() - startTime;
  analytics.trackApiCall('/payments', duration, true);
} catch (error) {
  const duration = performance.now() - startTime;
  analytics.trackApiCall('/payments', duration, false);
}
```

### Track Cache Performance

```typescript
// Track cache hit
analytics.trackCacheHit('query', 'user:123');

// Track cache miss
analytics.trackCacheMiss('service-worker', '/assets/app.js');
```

---

## Event Tracking

### Event Structure

```typescript
interface AnalyticsEvent {
  name: string;
  properties?: Record<string, unknown>;
  timestamp: Date;
}
```

### Event Examples

```typescript
// MFE loaded
analytics.trackEvent('mfe:loaded', {
  mfe: 'payments-mfe',
  duration: 1200,
  remoteEntry: 'https://localhost:4202/remoteEntry.js',
});

// API call
analytics.trackEvent('api:call', {
  endpoint: '/payments',
  method: 'GET',
  duration: 150,
  status: 200,
});

// Cache hit
analytics.trackEvent('cache:hit', {
  cacheType: 'service-worker',
  resource: '/assets/app.js',
});

// WebSocket connected
analytics.trackEvent('websocket:connected', {
  url: 'wss://localhost/ws',
  reconnectAttempts: 0,
});
```

---

## Metrics Collection

### Get Metrics Snapshot

```typescript
const metrics = analytics.getMetrics();

console.log(metrics);
// {
//   events: [...],
//   mfeLoadTimes: Map { 'payments-mfe' => 1200, ... },
//   apiCallMetrics: Map { '/payments' => { count: 10, totalTime: 1500, errors: 0 }, ... },
//   cacheMetrics: {
//     hits: 100,
//     misses: 20,
//     byType: Map { 'query' => { hits: 50, misses: 10 }, ... }
//   }
// }
```

### Get Cache Hit Rate

```typescript
// Overall cache hit rate
const overallHitRate = analytics.getCacheHitRate();
// Returns: 83.33 (percentage)

// Specific cache type hit rate
const queryHitRate = analytics.getCacheHitRate('query');
const swHitRate = analytics.getCacheHitRate('service-worker');
const redisHitRate = analytics.getCacheHitRate('redis');
```

### Get Average API Duration

```typescript
const avgDuration = analytics.getAverageApiDuration('/payments');
// Returns: 150 (milliseconds)
```

---

## React Hooks

### useAnalytics Hook

```typescript
import { useAnalytics } from '@payments-system/shared-analytics/hooks';

function PaymentsPage() {
  const {
    trackEvent,
    trackMfeLoad,
    trackApiCall,
    trackCacheHit,
    trackCacheMiss,
    getMetrics,
    getCacheHitRate,
    getAverageApiDuration,
  } = useAnalytics();

  useEffect(() => {
    trackEvent('page:viewed', { page: 'payments' });
  }, []);

  return <div>Payments Page</div>;
}
```

### useMfeLoadTracking Hook

```typescript
import { useMfeLoadTracking } from '@payments-system/shared-analytics/hooks';

function PaymentsMfe() {
  // Automatically tracks MFE load time
  useMfeLoadTracking('payments-mfe');

  return <div>Payments MFE</div>;
}
```

---

## Best Practices

### 1. Track Key Events

Track events that provide architectural insights:

```typescript
// Good - Architecture-focused
analytics.trackEvent('mfe:loaded', { mfe: 'payments-mfe', duration: 1200 });
analytics.trackEvent('api:call', { endpoint: '/payments', duration: 150 });
analytics.trackEvent('cache:hit', { cacheType: 'query', key: 'user:123' });

// Avoid - Business-focused (not in POC-3 scope)
// analytics.trackEvent('user:purchased_item', { itemId: 'item_123' });
```

### 2. Include Relevant Properties

Always include relevant properties for context:

```typescript
analytics.trackEvent('api:call', {
  endpoint: '/payments',
  method: 'GET',
  duration: 150,
  status: 200,
  cacheHit: false,
});
```

### 3. Track Performance Metrics

Track performance-critical operations:

```typescript
const startTime = performance.now();
await loadPayment();
const duration = performance.now() - startTime;
analytics.trackMfeLoad('payments-mfe', duration);
```

### 4. Monitor Cache Performance

Track cache hits and misses:

```typescript
const cached = await cache.get(key);
if (cached) {
  analytics.trackCacheHit('query', key);
} else {
  analytics.trackCacheMiss('query', key);
}
```

### 5. Clear Metrics for Testing

Reset metrics in tests:

```typescript
beforeEach(() => {
  analytics.clear();
});
```

---

## Troubleshooting

### Events Not Tracked

**Possible Causes:**

- Analytics library not imported
- Event name not recognized
- Development mode logging disabled

**Solutions:**

1. Verify import: `import { analytics } from '@payments-system/shared-analytics'`
2. Check event name matches expected format
3. Enable development mode logging

### Metrics Not Available

**Possible Causes:**

- Metrics not collected yet
- Metrics cleared
- Library not initialized

**Solutions:**

1. Verify events are being tracked
2. Check metrics retrieval timing
3. Verify library initialization

---

## Additional Resources

- **Analytics Library:** `libs/shared-analytics/`
- **React Hooks:** `libs/shared-analytics/src/hooks/`
- **Tests:** `libs/shared-analytics/src/lib/analytics.spec.ts`

---

**Last Updated:** 2026-12-11  
**Status:** Complete
