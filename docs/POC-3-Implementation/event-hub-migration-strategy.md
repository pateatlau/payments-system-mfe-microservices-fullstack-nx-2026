# Event Hub Migration Strategy - POC-3

**Status:** Complete  
**Version:** 1.0  
**Date:** 2026-12-10  
**Purpose:** Define strategy for migrating from Redis Pub/Sub to RabbitMQ

---

## Executive Summary

This document defines the strategy for migrating the event hub from Redis Pub/Sub to RabbitMQ in POC-3. RabbitMQ provides message persistence, guaranteed delivery, and production-ready reliability patterns that are essential for a banking application.

---

## 1. Current State (POC-2 - Redis Pub/Sub)

### Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Redis Pub/Sub                             │
│                                                              │
│  ┌──────────┐    ┌──────────┐    ┌──────────┐             │
│  │  Auth    │    │ Payments │    │  Admin   │             │
│  │ Service  │    │ Service  │    │ Service  │             │
│  └────┬─────┘    └────┬─────┘    └────┬─────┘             │
│       │               │               │                    │
│       │  PUBLISH      │  PUBLISH      │  PUBLISH          │
│       ▼               ▼               ▼                    │
│  ┌──────────────────────────────────────────────────────┐ │
│  │            Redis Pub/Sub Channels                      │ │
│  │  - user:registered                                     │ │
│  │  - user:login                                          │ │
│  │  - payment:created                                     │ │
│  │  - payment:updated                                     │ │
│  │  - audit:created                                       │ │
│  └──────────────────────────────────────────────────────┘ │
│       │               │               │                    │
│       │  SUBSCRIBE    │  SUBSCRIBE    │  SUBSCRIBE        │
│       ▼               ▼               ▼                    │
│  ┌──────────┐    ┌──────────┐    ┌──────────┐             │
│  │  All     │    │  All     │    │  All     │             │
│  │ Services │    │ Services │    │ Services │             │
│  └──────────┘    └──────────┘    └──────────┘             │
└─────────────────────────────────────────────────────────────┘
```

### Current Event Types

| Event Type              | Publisher        | Subscribers    | Description            |
| ----------------------- | ---------------- | -------------- | ---------------------- |
| `user:registered`       | Auth Service     | Admin, Profile | New user created       |
| `user:login`            | Auth Service     | Admin          | User logged in         |
| `user:logout`           | Auth Service     | Admin          | User logged out        |
| `user:password-changed` | Auth Service     | Admin          | Password changed       |
| `payment:created`       | Payments Service | Admin          | New payment            |
| `payment:updated`       | Payments Service | Admin          | Payment status changed |
| `payment:completed`     | Payments Service | Admin, Auth    | Payment completed      |
| `payment:failed`        | Payments Service | Admin          | Payment failed         |
| `audit:created`         | Admin Service    | -              | Audit log entry        |
| `config:updated`        | Admin Service    | All            | Config changed         |

### Current Limitations

| Limitation             | Impact                              | Risk Level |
| ---------------------- | ----------------------------------- | ---------- |
| No message persistence | Messages lost if subscriber offline | High       |
| No guaranteed delivery | Fire-and-forget pattern             | High       |
| No dead letter queue   | Failed messages discarded           | High       |
| No retry mechanism     | No automatic retries                | Medium     |
| No message ordering    | Order not guaranteed                | Medium     |
| No event versioning    | Schema changes break consumers      | Medium     |
| No acknowledgments     | No delivery confirmation            | High       |

---

## 2. Target State (POC-3 - RabbitMQ)

### Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    RabbitMQ Event Hub                                        │
│                                                                              │
│  ┌──────────┐    ┌──────────┐    ┌──────────┐    ┌──────────┐             │
│  │  Auth    │    │ Payments │    │  Admin   │    │ Profile  │             │
│  │ Service  │    │ Service  │    │ Service  │    │ Service  │             │
│  └────┬─────┘    └────┬─────┘    └────┬─────┘    └────┬─────┘             │
│       │               │               │               │                    │
│       │  PUBLISH      │  PUBLISH      │  PUBLISH      │  PUBLISH          │
│       ▼               ▼               ▼               ▼                    │
│  ┌──────────────────────────────────────────────────────────────────────┐ │
│  │                     Topic Exchange: "events"                           │ │
│  │  Routing Keys:                                                        │ │
│  │  - auth.user.registered                                               │ │
│  │  - auth.user.login                                                    │ │
│  │  - payments.payment.created                                           │ │
│  │  - admin.audit.created                                                │ │
│  └──────────────────────────────────────────────────────────────────────┘ │
│       │               │               │               │                    │
│       │  BINDINGS     │  BINDINGS     │  BINDINGS     │  BINDINGS         │
│       ▼               ▼               ▼               ▼                    │
│  ┌──────────┐    ┌──────────┐    ┌──────────┐    ┌──────────┐             │
│  │ auth.    │    │ payments.│    │ admin.   │    │ profile. │             │
│  │ events.  │    │ events.  │    │ events.  │    │ events.  │             │
│  │ queue    │    │ queue    │    │ queue    │    │ queue    │             │
│  └────┬─────┘    └────┬─────┘    └────┬─────┘    └────┬─────┘             │
│       │               │               │               │                    │
│       │  CONSUME      │  CONSUME      │  CONSUME      │  CONSUME          │
│       ▼               ▼               ▼               ▼                    │
│  ┌──────────┐    ┌──────────┐    ┌──────────┐    ┌──────────┐             │
│  │  Auth    │    │ Payments │    │  Admin   │    │ Profile  │             │
│  │ Service  │    │ Service  │    │ Service  │    │ Service  │             │
│  └──────────┘    └──────────┘    └──────────┘    └──────────┘             │
│                                                                              │
│  ┌──────────────────────────────────────────────────────────────────────┐ │
│  │                    Dead Letter Exchange: "events.dlx"                  │ │
│  │  - Failed messages after max retries                                   │ │
│  │  - Manual review and reprocessing                                      │ │
│  └──────────────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────────────┘
```

### RabbitMQ Benefits

| Feature             | Description                          | Value          |
| ------------------- | ------------------------------------ | -------------- |
| Message Persistence | Messages survive broker restart      | Data safety    |
| Acknowledgments     | Consumers confirm message processing | Reliability    |
| Dead Letter Queues  | Failed messages preserved            | Error recovery |
| Retry Mechanism     | Automatic retries with backoff       | Resilience     |
| Routing Flexibility | Topic, direct, fanout exchanges      | Scalability    |
| Management UI       | Visual monitoring and management     | Operations     |

---

## 3. Event Type Inventory and Migration

### 3.1 Event Type Mapping

| POC-2 Event             | POC-3 Routing Key            | Exchange | Format |
| ----------------------- | ---------------------------- | -------- | ------ |
| `user:registered`       | `auth.user.registered`       | events   | JSON   |
| `user:login`            | `auth.user.login`            | events   | JSON   |
| `user:logout`           | `auth.user.logout`           | events   | JSON   |
| `user:password-changed` | `auth.user.password-changed` | events   | JSON   |
| `payment:created`       | `payments.payment.created`   | events   | JSON   |
| `payment:updated`       | `payments.payment.updated`   | events   | JSON   |
| `payment:completed`     | `payments.payment.completed` | events   | JSON   |
| `payment:failed`        | `payments.payment.failed`    | events   | JSON   |
| `audit:created`         | `admin.audit.created`        | events   | JSON   |
| `config:updated`        | `admin.config.updated`       | events   | JSON   |

### 3.2 Event Message Format

```typescript
interface BaseEvent {
  id: string;           // Unique message ID (UUID)
  type: string;         // Event type (e.g., 'user.registered')
  version: string;      // Schema version (e.g., '1.0')
  timestamp: string;    // ISO 8601 timestamp
  source: string;       // Service name
  correlationId?: string; // Request correlation ID
  data: unknown;        // Event payload
}

// Example: User Registered Event
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "type": "user.registered",
  "version": "1.0",
  "timestamp": "2026-12-10T10:30:00.000Z",
  "source": "auth-service",
  "correlationId": "req-123456",
  "data": {
    "userId": "user-123",
    "email": "user@example.com",
    "name": "John Doe",
    "role": "CUSTOMER"
  }
}
```

---

## 4. RabbitMQ Topology Design

### 4.1 Exchanges

| Exchange Name  | Type   | Durable | Description          |
| -------------- | ------ | ------- | -------------------- |
| `events`       | topic  | yes     | Main event exchange  |
| `events.dlx`   | direct | yes     | Dead letter exchange |
| `events.retry` | direct | yes     | Retry exchange       |

### 4.2 Queues

| Queue Name              | Durable | Arguments                             | Description             |
| ----------------------- | ------- | ------------------------------------- | ----------------------- |
| `auth.events.queue`     | yes     | x-dead-letter-exchange: events.dlx    | Auth service events     |
| `payments.events.queue` | yes     | x-dead-letter-exchange: events.dlx    | Payments service events |
| `admin.events.queue`    | yes     | x-dead-letter-exchange: events.dlx    | Admin service events    |
| `profile.events.queue`  | yes     | x-dead-letter-exchange: events.dlx    | Profile service events  |
| `events.dlq`            | yes     | -                                     | Dead letter queue       |
| `auth.retry.queue`      | yes     | x-message-ttl, x-dead-letter-exchange | Auth retry queue        |
| `payments.retry.queue`  | yes     | x-message-ttl, x-dead-letter-exchange | Payments retry queue    |
| `admin.retry.queue`     | yes     | x-message-ttl, x-dead-letter-exchange | Admin retry queue       |
| `profile.retry.queue`   | yes     | x-message-ttl, x-dead-letter-exchange | Profile retry queue     |

### 4.3 Bindings

| Source Exchange | Routing Key Pattern | Target Queue          | Description                 |
| --------------- | ------------------- | --------------------- | --------------------------- |
| events          | auth.\*             | auth.events.queue     | Auth events                 |
| events          | payments.\*         | payments.events.queue | Payments events             |
| events          | admin.\*            | admin.events.queue    | Admin events                |
| events          | profile.\*          | profile.events.queue  | Profile events              |
| events          | _.user._            | admin.events.queue    | All user events to admin    |
| events          | _.payment._         | admin.events.queue    | All payment events to admin |

### 4.4 Queue Naming Convention

```
{service}.{purpose}.queue

Examples:
- auth.events.queue      - Auth service main queue
- auth.retry.queue       - Auth service retry queue
- payments.events.queue  - Payments service main queue
- events.dlq             - Global dead letter queue
```

---

## 5. Dead Letter Queue Strategy

### 5.1 DLQ Flow

```
Message Published
       │
       ▼
┌──────────────┐
│ Main Queue   │
│ (e.g., auth. │
│  events.queue)│
└──────┬───────┘
       │
       │ Consumer processes
       ▼
   ┌────────┐
   │ Success?│
   └────┬───┘
     Yes│  No
       │   │
       │   ▼
       │ ┌────────────┐
       │ │ Retry Queue │
       │ │ (with TTL)  │
       │ └──────┬─────┘
       │        │
       │        │ After TTL expires
       │        ▼
       │   ┌────────┐
       │   │ Retry  │
       │   │ Count  │
       │   │ < Max? │
       │   └───┬───┘
       │    Yes│  No
       │       │   │
       │       │   ▼
       │       │ ┌────────────┐
       │       │ │ Dead Letter│
       │       │ │ Queue (DLQ)│
       │       │ └────────────┘
       │       │
       │       ▼
       │   Back to Main Queue
       │
       ▼
   Message ACKed
```

### 5.2 Retry Configuration

| Parameter          | Value     | Description            |
| ------------------ | --------- | ---------------------- |
| Max Retries        | 3         | Maximum retry attempts |
| Initial Delay      | 1,000 ms  | First retry delay      |
| Max Delay          | 60,000 ms | Maximum retry delay    |
| Backoff Multiplier | 2         | Exponential backoff    |

### 5.3 Retry Delays

| Retry # | Delay     |
| ------- | --------- |
| 1       | 1 second  |
| 2       | 2 seconds |
| 3       | 4 seconds |
| After 3 | → DLQ     |

---

## 6. Event Versioning Strategy

### 6.1 Version Field

All events include a `version` field:

```typescript
{
  "type": "user.registered",
  "version": "1.0",
  "data": { ... }
}
```

### 6.2 Version Evolution Rules

1. **Additive Changes** (Minor Version)
   - Add new optional fields
   - Add new event types
   - Example: 1.0 → 1.1

2. **Breaking Changes** (Major Version)
   - Remove fields
   - Change field types
   - Change field meanings
   - Example: 1.1 → 2.0

### 6.3 Consumer Compatibility

```typescript
// Consumer handles multiple versions
function handleUserRegistered(event: BaseEvent) {
  switch (event.version) {
    case '1.0':
      return handleV1(event.data);
    case '2.0':
      return handleV2(event.data);
    default:
      logger.warn(`Unknown version: ${event.version}`);
      // Attempt to process with latest handler
      return handleV2(event.data);
  }
}
```

---

## 7. Backward Compatibility Period

### 7.1 Migration Phases

```
Phase 1: Parallel Publishing (1 week)
├── Services publish to both Redis and RabbitMQ
├── Consumers read from Redis (primary)
└── Monitor RabbitMQ for message delivery

Phase 2: Dual Consumption (1 week)
├── Services publish to both Redis and RabbitMQ
├── Consumers read from RabbitMQ (primary)
├── Redis as fallback
└── Verify message consistency

Phase 3: RabbitMQ Only
├── Stop Redis publishing
├── All consumers on RabbitMQ
└── Decommission Redis Pub/Sub (keep for caching)
```

### 7.2 Dual Publishing Code

```typescript
// During migration: publish to both
class DualEventPublisher {
  constructor(
    private redisPublisher: RedisEventPublisher,
    private rabbitPublisher: RabbitMQEventPublisher,
    private useRabbitMQ: boolean = false
  ) {}

  async publish(eventType: string, data: unknown) {
    // Always publish to Redis during migration
    await this.redisPublisher.publish(eventType, data);

    // Publish to RabbitMQ if enabled
    if (this.useRabbitMQ) {
      await this.rabbitPublisher.publish(eventType, data);
    }
  }
}
```

---

## 8. RabbitMQ Implementation

### 8.1 Connection Manager

```typescript
// libs/backend/rabbitmq-event-hub/src/lib/connection.ts
import amqp, { Connection, Channel } from 'amqplib';

class RabbitMQConnectionManager {
  private connection: Connection | null = null;
  private channel: Channel | null = null;
  private url: string;

  constructor(url: string) {
    this.url = url;
  }

  async connect(): Promise<void> {
    this.connection = await amqp.connect(this.url);
    this.channel = await this.connection.createChannel();

    // Setup exchanges
    await this.channel.assertExchange('events', 'topic', { durable: true });
    await this.channel.assertExchange('events.dlx', 'direct', {
      durable: true,
    });

    // Setup dead letter queue
    await this.channel.assertQueue('events.dlq', { durable: true });
    await this.channel.bindQueue('events.dlq', 'events.dlx', 'dead-letter');

    // Handle connection errors
    this.connection.on('error', this.handleError.bind(this));
    this.connection.on('close', this.handleClose.bind(this));
  }

  async getChannel(): Promise<Channel> {
    if (!this.channel) {
      await this.connect();
    }
    return this.channel!;
  }

  private handleError(error: Error) {
    console.error('RabbitMQ connection error:', error);
  }

  private handleClose() {
    console.log('RabbitMQ connection closed, reconnecting...');
    setTimeout(() => this.connect(), 5000);
  }

  async close(): Promise<void> {
    await this.channel?.close();
    await this.connection?.close();
  }
}

export const connectionManager = new RabbitMQConnectionManager(
  process.env.RABBITMQ_URL || 'amqp://localhost:5672'
);
```

### 8.2 Publisher

```typescript
// libs/backend/rabbitmq-event-hub/src/lib/publisher.ts
import { v4 as uuidv4 } from 'uuid';
import { connectionManager } from './connection';
import { BaseEvent } from './types';

export class RabbitMQPublisher {
  private serviceName: string;

  constructor(serviceName: string) {
    this.serviceName = serviceName;
  }

  async publish<T>(
    routingKey: string,
    data: T,
    correlationId?: string
  ): Promise<void> {
    const channel = await connectionManager.getChannel();

    const event: BaseEvent = {
      id: uuidv4(),
      type: routingKey.replace(/\./g, ':'), // Convert routing key to event type
      version: '1.0',
      timestamp: new Date().toISOString(),
      source: this.serviceName,
      correlationId,
      data,
    };

    channel.publish('events', routingKey, Buffer.from(JSON.stringify(event)), {
      persistent: true,
      messageId: event.id,
      correlationId: event.correlationId,
      contentType: 'application/json',
      timestamp: Date.now(),
    });
  }
}
```

### 8.3 Subscriber

```typescript
// libs/backend/rabbitmq-event-hub/src/lib/subscriber.ts
import { connectionManager } from './connection';
import { BaseEvent, EventHandler } from './types';

export class RabbitMQSubscriber {
  private serviceName: string;
  private queueName: string;

  constructor(serviceName: string) {
    this.serviceName = serviceName;
    this.queueName = `${serviceName}.events.queue`;
  }

  async subscribe<T>(
    routingKeyPattern: string,
    handler: EventHandler<T>
  ): Promise<void> {
    const channel = await connectionManager.getChannel();

    // Assert queue with DLX
    await channel.assertQueue(this.queueName, {
      durable: true,
      arguments: {
        'x-dead-letter-exchange': 'events.dlx',
        'x-dead-letter-routing-key': 'dead-letter',
      },
    });

    // Bind queue to exchange
    await channel.bindQueue(this.queueName, 'events', routingKeyPattern);

    // Consume messages
    channel.consume(this.queueName, async msg => {
      if (!msg) return;

      try {
        const event = JSON.parse(msg.content.toString()) as BaseEvent & {
          data: T;
        };
        await handler(event);
        channel.ack(msg);
      } catch (error) {
        console.error('Error processing message:', error);

        // Check retry count
        const retryCount = (msg.properties.headers?.['x-retry-count'] ||
          0) as number;

        if (retryCount < 3) {
          // Reject and requeue with delay
          channel.nack(msg, false, false);
          // Message will go to DLX, then back to queue after TTL
        } else {
          // Max retries exceeded, send to DLQ
          channel.nack(msg, false, false);
        }
      }
    });
  }
}
```

---

## 9. RabbitMQ Definitions File

```json
// rabbitmq/definitions.json
{
  "rabbit_version": "3.12.0",
  "users": [
    {
      "name": "admin",
      "password_hash": "...",
      "tags": "administrator"
    },
    {
      "name": "app",
      "password_hash": "...",
      "tags": ""
    }
  ],
  "vhosts": [{ "name": "/" }],
  "permissions": [
    {
      "user": "admin",
      "vhost": "/",
      "configure": ".*",
      "write": ".*",
      "read": ".*"
    },
    {
      "user": "app",
      "vhost": "/",
      "configure": "^(auth|payments|admin|profile)\\..*$",
      "write": ".*",
      "read": ".*"
    }
  ],
  "exchanges": [
    {
      "name": "events",
      "vhost": "/",
      "type": "topic",
      "durable": true,
      "auto_delete": false
    },
    {
      "name": "events.dlx",
      "vhost": "/",
      "type": "direct",
      "durable": true,
      "auto_delete": false
    }
  ],
  "queues": [
    {
      "name": "auth.events.queue",
      "vhost": "/",
      "durable": true,
      "auto_delete": false,
      "arguments": {
        "x-dead-letter-exchange": "events.dlx",
        "x-dead-letter-routing-key": "dead-letter"
      }
    },
    {
      "name": "payments.events.queue",
      "vhost": "/",
      "durable": true,
      "auto_delete": false,
      "arguments": {
        "x-dead-letter-exchange": "events.dlx",
        "x-dead-letter-routing-key": "dead-letter"
      }
    },
    {
      "name": "admin.events.queue",
      "vhost": "/",
      "durable": true,
      "auto_delete": false,
      "arguments": {
        "x-dead-letter-exchange": "events.dlx",
        "x-dead-letter-routing-key": "dead-letter"
      }
    },
    {
      "name": "profile.events.queue",
      "vhost": "/",
      "durable": true,
      "auto_delete": false,
      "arguments": {
        "x-dead-letter-exchange": "events.dlx",
        "x-dead-letter-routing-key": "dead-letter"
      }
    },
    {
      "name": "events.dlq",
      "vhost": "/",
      "durable": true,
      "auto_delete": false
    }
  ],
  "bindings": [
    {
      "source": "events",
      "vhost": "/",
      "destination": "auth.events.queue",
      "destination_type": "queue",
      "routing_key": "auth.#"
    },
    {
      "source": "events",
      "vhost": "/",
      "destination": "payments.events.queue",
      "destination_type": "queue",
      "routing_key": "payments.#"
    },
    {
      "source": "events",
      "vhost": "/",
      "destination": "admin.events.queue",
      "destination_type": "queue",
      "routing_key": "#"
    },
    {
      "source": "events",
      "vhost": "/",
      "destination": "profile.events.queue",
      "destination_type": "queue",
      "routing_key": "auth.user.#"
    },
    {
      "source": "events.dlx",
      "vhost": "/",
      "destination": "events.dlq",
      "destination_type": "queue",
      "routing_key": "dead-letter"
    }
  ]
}
```

---

## 10. Testing Strategy

### 10.1 Unit Tests

- Test message serialization
- Test event type mapping
- Test retry logic

### 10.2 Integration Tests

- Test message publishing
- Test message consumption
- Test DLQ routing

### 10.3 Reliability Tests

- Test broker restart (message persistence)
- Test consumer crash (message redelivery)
- Test network partition (reconnection)

---

## 11. Verification Checklist

- [x] Event types inventoried (10 event types)
- [x] Exchange topology designed
- [x] Queue naming defined
- [x] DLQ strategy defined
- [x] Retry mechanism defined
- [x] Versioning approach defined
- [x] Backward compatibility defined

---

**Last Updated:** 2026-12-10  
**Status:** Complete  
**Next Steps:** Use this strategy in Phase 2 (RabbitMQ Setup) and Phase 3 (Event Hub Migration)
