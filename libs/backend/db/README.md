# @payments-system/db

Database utilities and query monitoring for the payments system backend services.

## Features

- Query timeout configuration
- Slow query logging and monitoring
- Query performance metrics for Prometheus
- Prisma middleware for query tracking

## Installation

This library is used internally by the payments system services.

## Usage

```typescript
import { createQueryMonitorMiddleware, QueryMonitorConfig } from '@payments-system/db';

const config: QueryMonitorConfig = {
  serviceName: 'auth-service',
  queryTimeoutMs: 10000,     // 10 seconds
  slowQueryThresholdMs: 1000, // 1 second
  enableMetrics: true,
};

const middleware = createQueryMonitorMiddleware(config);
prisma.$use(middleware);
```

## Configuration

| Option | Default | Description |
|--------|---------|-------------|
| `serviceName` | required | Name of the service for logging/metrics |
| `queryTimeoutMs` | 10000 | Query timeout in milliseconds |
| `slowQueryThresholdMs` | 1000 | Threshold for slow query logging |
| `enableMetrics` | true | Enable Prometheus metrics |
| `enableLogging` | true | Enable slow query logging |
