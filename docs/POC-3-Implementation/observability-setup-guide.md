# Observability Setup Guide - POC-3

**Status:** Complete  
**Version:** 1.0  
**Date:** 2026-12-11  
**Purpose:** Complete guide for setting up observability with Sentry, Prometheus, and OpenTelemetry

---

## Overview

POC-3 implements comprehensive observability with error tracking (Sentry), metrics (Prometheus), and distributed tracing (OpenTelemetry). This guide covers setup, configuration, and usage.

---

## Table of Contents

1. [Sentry Error Tracking](#sentry-error-tracking)
2. [Prometheus Metrics](#prometheus-metrics)
3. [OpenTelemetry Tracing](#opentelemetry-tracing)
4. [Logging](#logging)
5. [Configuration](#configuration)
6. [Best Practices](#best-practices)
7. [Troubleshooting](#troubleshooting)

---

## Sentry Error Tracking

### Backend Setup

```typescript
// apps/api-gateway/src/main.ts
import { initSentry } from '@payments-system/observability';

initSentry(app, {
  serviceName: 'api-gateway',
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV || 'development',
  tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
});
```

### Frontend Setup

```typescript
// apps/shell/src/main.tsx
import { initSentry } from '@payments-system/shared-observability';

initSentry({
  appName: 'shell',
  dsn: process.env.VITE_SENTRY_DSN,
  environment: process.env.NODE_ENV || 'development',
  tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
});
```

### Error Capture

```typescript
// Backend
import * as Sentry from '@sentry/node';

try {
  // Your code
} catch (error) {
  Sentry.captureException(error, {
    tags: { component: 'payment-service' },
    extra: { paymentId: 'pay_123' },
  });
  throw error;
}

// Frontend
import * as Sentry from '@sentry/react';

try {
  // Your code
} catch (error) {
  Sentry.captureException(error, {
    tags: { component: 'PaymentsPage' },
    extra: { userId: user.id },
  });
}
```

### User Context

```typescript
// Backend
import * as Sentry from '@sentry/node';

Sentry.setUser({
  id: user.id,
  email: user.email,
  username: user.name,
});

// Frontend
import * as Sentry from '@sentry/react';

Sentry.setUser({
  id: user.id,
  email: user.email,
  username: user.name,
});
```

---

## Prometheus Metrics

### Setup

```typescript
// apps/api-gateway/src/main.ts
import { initMetrics } from '@payments-system/observability';

const metrics = initMetrics({
  serviceName: 'api-gateway',
  port: 9090, // Metrics endpoint port
});
```

### Metrics Endpoint

```typescript
// GET /metrics
app.get('/metrics', async (req, res) => {
  res.set('Content-Type', metrics.contentType);
  res.end(await metrics.register.metrics());
});
```

### Custom Metrics

```typescript
import { Counter, Histogram, Gauge } from 'prom-client';

// Counter - total requests
const httpRequestsTotal = new Counter({
  name: 'http_requests_total',
  help: 'Total number of HTTP requests',
  labelNames: ['method', 'route', 'status'],
});

// Histogram - request duration
const httpRequestDuration = new Histogram({
  name: 'http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'route', 'status'],
  buckets: [0.1, 0.5, 1, 2, 5],
});

// Gauge - active connections
const activeConnections = new Gauge({
  name: 'active_connections',
  help: 'Number of active connections',
});
```

### Recording Metrics

```typescript
// Increment counter
httpRequestsTotal.inc({ method: 'GET', route: '/api/health', status: '200' });

// Record duration
const end = httpRequestDuration.startTimer();
// ... your code ...
end({ method: 'GET', route: '/api/health', status: '200' });

// Set gauge
activeConnections.set(10);
```

---

## OpenTelemetry Tracing

### Setup

```typescript
// apps/api-gateway/src/main.ts
import { initTracing } from '@payments-system/observability';

const sdk = initTracing({
  serviceName: 'api-gateway',
  serviceVersion: '1.0.0',
  otlpEndpoint:
    process.env.OTEL_EXPORTER_OTLP_ENDPOINT ||
    'http://localhost:4318/v1/traces',
});
```

### Creating Spans

```typescript
import { trace } from '@opentelemetry/api';

const tracer = trace.getTracer('api-gateway');

async function processPayment(paymentId: string) {
  const span = tracer.startSpan('process_payment', {
    attributes: {
      'payment.id': paymentId,
    },
  });

  try {
    // Your code
    span.setStatus({ code: SpanStatusCode.OK });
  } catch (error) {
    span.setStatus({
      code: SpanStatusCode.ERROR,
      message: error.message,
    });
    span.recordException(error);
    throw error;
  } finally {
    span.end();
  }
}
```

### Nested Spans

```typescript
async function processPayment(paymentId: string) {
  const parentSpan = tracer.startSpan('process_payment');

  const validateSpan = tracer.startSpan('validate_payment', {
    parent: parentSpan,
  });
  // Validation logic
  validateSpan.end();

  const processSpan = tracer.startSpan('process_payment_logic', {
    parent: parentSpan,
  });
  // Processing logic
  processSpan.end();

  parentSpan.end();
}
```

---

## Logging

### Structured Logging

```typescript
import { logger } from '../utils/logger';

// Info log
logger.info('Payment processed', {
  paymentId: 'pay_123',
  amount: 100.0,
  userId: 'user_456',
});

// Error log
logger.error('Payment failed', {
  paymentId: 'pay_123',
  error: error.message,
  stack: error.stack,
});

// Debug log
logger.debug('Cache hit', {
  key: 'user:123',
  ttl: 300,
});
```

### Log Levels

- **error** - Errors that need attention
- **warn** - Warnings that might indicate issues
- **info** - General information
- **debug** - Detailed debugging information

---

## Configuration

### Environment Variables

```bash
# Sentry
SENTRY_DSN=https://your-sentry-dsn@sentry.io/project-id
SENTRY_ENVIRONMENT=production
SENTRY_RELEASE=api-gateway@1.0.0

# Prometheus
PROMETHEUS_PORT=9090

# OpenTelemetry
OTEL_ENABLED=true
OTEL_EXPORTER_OTLP_ENDPOINT=http://localhost:4318/v1/traces
OTEL_SERVICE_NAME=api-gateway
OTEL_SERVICE_VERSION=1.0.0
```

### Service Configuration

```typescript
// Backend service
import {
  initSentry,
  initMetrics,
  initTracing,
} from '@payments-system/observability';

// Initialize all observability tools
initSentry(app, {
  serviceName: 'api-gateway',
  dsn: process.env.SENTRY_DSN,
});

const metrics = initMetrics({
  serviceName: 'api-gateway',
  port: 9090,
});

const sdk = initTracing({
  serviceName: 'api-gateway',
  otlpEndpoint: process.env.OTEL_EXPORTER_OTLP_ENDPOINT,
});
```

---

## Best Practices

### 1. Error Context

Always provide context when capturing errors:

```typescript
Sentry.captureException(error, {
  tags: {
    component: 'payment-service',
    operation: 'process-payment',
  },
  extra: {
    paymentId: payment.id,
    userId: user.id,
    amount: payment.amount,
  },
});
```

### 2. Metric Labels

Use consistent label names:

```typescript
// Good
httpRequestsTotal.inc({ method: 'GET', route: '/api/health', status: '200' });

// Bad
httpRequestsTotal.inc({ httpMethod: 'GET', path: '/api/health', code: '200' });
```

### 3. Span Attributes

Include relevant attributes in spans:

```typescript
span.setAttributes({
  'payment.id': paymentId,
  'payment.amount': amount,
  'user.id': userId,
});
```

### 4. Log Correlation

Use correlation IDs for request tracking:

```typescript
const correlationId = req.headers['x-correlation-id'] || uuid();

logger.info('Request started', {
  correlationId,
  method: req.method,
  path: req.path,
});
```

### 5. Sampling Rates

Adjust sampling rates for production:

```typescript
// Development: 100% sampling
tracesSampleRate: 1.0;

// Production: 10% sampling
tracesSampleRate: 0.1;
```

---

## Troubleshooting

### Sentry Not Capturing Errors

**Possible Causes:**

- DSN not configured
- Environment variable not set
- Sentry not initialized

**Solutions:**

1. Verify `SENTRY_DSN` environment variable
2. Check Sentry initialization in main.ts
3. Verify Sentry dashboard for errors

### Prometheus Metrics Not Available

**Possible Causes:**

- Metrics endpoint not exposed
- Port conflict
- Prometheus not scraping

**Solutions:**

1. Verify `/metrics` endpoint is accessible
2. Check port configuration
3. Verify Prometheus scrape configuration

### OpenTelemetry Traces Not Appearing

**Possible Causes:**

- OTLP endpoint not configured
- Tracing disabled
- Collector not running

**Solutions:**

1. Verify `OTEL_EXPORTER_OTLP_ENDPOINT` environment variable
2. Check `OTEL_ENABLED=true`
3. Verify OpenTelemetry collector is running

---

## Additional Resources

- **Backend Observability:** `libs/backend/observability/`
- **Frontend Observability:** `libs/shared-observability/`
- **Sentry Documentation:** https://docs.sentry.io/
- **Prometheus Documentation:** https://prometheus.io/docs/
- **OpenTelemetry Documentation:** https://opentelemetry.io/docs/

---

**Last Updated:** 2026-12-11  
**Status:** Complete
