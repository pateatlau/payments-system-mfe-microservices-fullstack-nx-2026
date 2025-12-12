# RabbitMQ Event Hub Library

**Purpose:** Production-ready event hub for microservices using RabbitMQ

**Zero-Coupling Pattern:** Services communicate ONLY via RabbitMQ events. No direct API calls between services. Eventual consistency via event synchronization.

## Features

- **Connection Management:** Automatic reconnection with exponential backoff
- **Reliable Publishing:** Message persistence, publisher confirms, retry logic
- **Flexible Subscription:** Manual ack/nack, dead letter queues, prefetch control
- **Type Safety:** Full TypeScript support with strict typing
- **Health Checks:** Connection status and statistics monitoring
- **Retry Logic:** Configurable exponential backoff with jitter

## Installation

```bash
pnpm add @payments-system/rabbitmq-event-hub
```

## Quick Start

### 1. Create Connection Manager

```typescript
import { RabbitMQConnectionManager } from '@payments-system/rabbitmq-event-hub';

const connectionManager = new RabbitMQConnectionManager({
  url: 'amqp://localhost:5672',
  reconnection: {
    enabled: true,
    maxRetries: 0, // Infinite
    initialDelay: 1000,
    maxDelay: 30000,
    multiplier: 2,
  },
});

await connectionManager.connect();
```

### 2. Publish Events

```typescript
import { RabbitMQPublisher } from '@payments-system/rabbitmq-event-hub';

const publisher = new RabbitMQPublisher(connectionManager, {
  exchange: 'payments_events',
  exchangeType: 'topic',
  durable: true,
});

await publisher.initialize();

// Publish an event
await publisher.publish('user.created', {
  userId: '123',
  email: 'user@example.com',
  name: 'John Doe',
});
```

### 3. Subscribe to Events

```typescript
import { RabbitMQSubscriber } from '@payments-system/rabbitmq-event-hub';

const subscriber = new RabbitMQSubscriber(connectionManager, {
  exchange: 'payments_events',
  queue: 'admin_service_queue',
  routingKeyPattern: 'user.*',
  manualAck: true,
  durable: true,
});

await subscriber.initialize();

// Subscribe to events
await subscriber.subscribe(async (event, context) => {
  console.log('Received event:', event);

  try {
    // Process event
    await processUserEvent(event.data);

    // Acknowledge successful processing
    context.ack();
  } catch (error) {
    console.error('Error processing event:', error);

    // Negative acknowledge - requeue for retry
    context.nack(true);
  }
});
```

## Event Structure

All events follow the `BaseEvent` interface:

```typescript
interface BaseEvent<T> {
  id: string;               // UUID
  type: string;             // e.g., 'user.created'
  version: string;          // e.g., '1.0'
  timestamp: string;        // ISO 8601
  source: string;           // e.g., 'auth-service'
  correlationId?: string;   // For tracing
  causationId?: string;     // ID of causing event
  data: T;                  // Event payload
  metadata?: EventMetadata; // Additional info
}
```

## Configuration Options

### Connection Options

```typescript
interface RabbitMQConnectionOptions {
  url: string;
  connectionTimeout?: number;     // Default: 10000ms
  heartbeat?: number;             // Default: 60s
  prefetch?: number;              // Default: 10
  reconnection?: {
    enabled: boolean;             // Default: true
    maxRetries: number;           // Default: 0 (infinite)
    initialDelay: number;         // Default: 1000ms
    maxDelay: number;             // Default: 30000ms
    multiplier: number;           // Default: 2
  };
}
```

### Publisher Options

```typescript
interface PublisherOptions {
  exchange: string;
  exchangeType?: 'topic' | 'direct' | 'fanout' | 'headers'; // Default: 'topic'
  durable?: boolean;                                         // Default: true
  autoDelete?: boolean;                                      // Default: false
  confirm?: boolean;                                         // Default: true
  timeout?: number;                                          // Default: 10000ms
  defaultProperties?: Partial<MessageProperties>;
}
```

### Subscriber Options

```typescript
interface SubscriberOptions {
  exchange: string;
  queue?: string;                   // Auto-generated if not provided
  routingKeyPattern: string;        // e.g., 'user.*'
  durable?: boolean;                // Default: true
  autoDelete?: boolean;             // Default: false
  exclusive?: boolean;              // Default: false
  manualAck?: boolean;              // Default: true
  prefetch?: number;                // Default: 10
  deadLetterExchange?: string;      // For failed messages
  deadLetterRoutingKey?: string;
  messageTtl?: number;              // Message TTL in ms
}
```

## Zero-Coupling Pattern

This library implements the zero-coupling pattern for microservices:

### Rules

1. **No Direct API Calls:** Services NEVER call other services' APIs directly
2. **Event-Driven Communication:** All inter-service communication via events
3. **Eventual Consistency:** Data synchronized via events (not strong consistency)
4. **Database Per Service:** Each service owns its data and database

### Example: User Management

**Auth Service (Authoritative Source):**

```typescript
// User created in auth_db
await prisma.user.create({ ... });

// Publish event
await publisher.publish('user.created', {
  userId: user.id,
  email: user.email,
  name: user.name,
  role: user.role,
});
```

**Admin Service (Denormalized Copy):**

```typescript
// Subscribe to user events
await subscriber.subscribe(async (event, context) => {
  if (event.type === 'user.created') {
    // Create denormalized copy in admin_db
    await prisma.user.create({
      id: event.data.userId,
      email: event.data.email,
      name: event.data.name,
      role: event.data.role,
    });
  }

  context.ack();
});
```

## Health Checks

```typescript
// Check connection health
const isHealthy = await connectionManager.healthCheck();

// Get statistics
const stats = connectionManager.getStats();
console.log(stats);
// {
//   published: 100,
//   consumed: 95,
//   acknowledged: 90,
//   rejected: 2,
//   nacked: 3,
//   errors: 0,
//   connected: true,
//   uptime: 3600000
// }
```

## Error Handling

### Retryable Errors

The library automatically retries these errors:

- ECONNREFUSED
- ENOTFOUND
- ETIMEDOUT
- ECONNRESET
- Channel closed
- Connection closed

### Non-Retryable Errors

Validation errors and business logic errors are NOT retried automatically.

## Best Practices

1. **Use Manual Acknowledgment:** Enable `manualAck: true` for reliable processing
2. **Set Prefetch:** Limit concurrent message processing with `prefetch`
3. **Dead Letter Queues:** Configure DLQ for failed messages
4. **Idempotency:** Design event handlers to be idempotent
5. **Event Versioning:** Use semantic versioning for event schemas
6. **Correlation IDs:** Pass correlation IDs for distributed tracing
7. **Health Checks:** Monitor connection status and statistics

## Testing

Run tests:

```bash
pnpm nx test rabbitmq-event-hub
```

Build library:

```bash
pnpm nx build rabbitmq-event-hub
```

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│                     RabbitMQ Broker                     │
│                                                          │
│  ┌────────────────────────────────────────────────────┐│
│  │         Exchange: payments_events (topic)           ││
│  └────────────────────────────────────────────────────┘│
│                          │                              │
│       ┌──────────────────┼──────────────────┐          │
│       │                  │                  │          │
│  ┌────▼───────┐    ┌─────▼────────┐   ┌────▼───────┐ │
│  │  Queue 1   │    │   Queue 2    │   │  Queue 3   │ │
│  │ (Auth SVC) │    │ (Admin SVC)  │   │ (Pay SVC)  │ │
│  └────────────┘    └──────────────┘   └────────────┘ │
└─────────────────────────────────────────────────────────┘
```

## License

MIT
