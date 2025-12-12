# RabbitMQ Implementation Guide - POC-3

**Status:** Complete  
**Version:** 1.0  
**Date:** 2026-12-12  
**Purpose:** Document RabbitMQ implementation, issues faced, and resolutions

---

## Table of Contents

1. [Overview](#overview)
2. [Architecture](#architecture)
3. [Implementation Details](#implementation-details)
4. [Configuration](#configuration)
5. [Issues Faced and Resolutions](#issues-faced-and-resolutions)
6. [Testing](#testing)
7. [Usage Guide](#usage-guide)
8. [Troubleshooting](#troubleshooting)
9. [Performance Results](#performance-results)
10. [Production Recommendations](#production-recommendations)

---

## Overview

POC-3 migrates the event hub from Redis Pub/Sub to RabbitMQ to provide production-ready messaging capabilities essential for a banking application.

### Why RabbitMQ?

| Feature | Redis Pub/Sub | RabbitMQ |
|---------|---------------|----------|
| Message Persistence | No | Yes |
| Guaranteed Delivery | No | Yes |
| Dead Letter Queues | No | Yes |
| Retry Mechanism | No | Yes |
| Message Ordering | No (best effort) | Yes (FIFO) |
| Acknowledgments | No | Yes |
| Management UI | Limited | Full |

### Key Benefits

- **Message Persistence:** Messages survive broker restart
- **Guaranteed Delivery:** Publisher confirms ensure messages are stored
- **Dead Letter Queues:** Failed messages are preserved for analysis
- **Automatic Retry:** Configurable retry with exponential backoff
- **FIFO Ordering:** Messages processed in order per queue
- **Management UI:** Visual monitoring at `http://localhost:15672`

---

## Architecture

### Event Hub Topology

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
│       └───────────────┴───────┬───────┴───────────────┘                    │
│                               │                                            │
│                               ▼ (on failure)                               │
│  ┌──────────────────────────────────────────────────────────────────────┐ │
│  │                    Dead Letter Exchange: "events.dlx"                  │ │
│  │                              │                                        │ │
│  │                              ▼                                        │ │
│  │                    Dead Letter Queue: "events.dlq"                    │ │
│  └──────────────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Exchanges

| Exchange Name | Type | Durable | Description |
|---------------|------|---------|-------------|
| `events` | topic | Yes | Main event exchange for all services |
| `events.dlx` | direct | Yes | Dead letter exchange for failed messages |

### Queues

| Queue Name | Durable | DLX | Description |
|------------|---------|-----|-------------|
| `auth.events.queue` | Yes | events.dlx | Auth service events |
| `payments.events.queue` | Yes | events.dlx | Payments service events |
| `admin.events.queue` | Yes | events.dlx | Admin service events (receives all events) |
| `profile.events.queue` | Yes | events.dlx | Profile service events |
| `events.dlq` | Yes | - | Dead letter queue for failed messages |

### Bindings

| Source Exchange | Routing Key Pattern | Target Queue | Description |
|-----------------|---------------------|--------------|-------------|
| events | auth.# | auth.events.queue | All auth events |
| events | payments.# | payments.events.queue | All payments events |
| events | # | admin.events.queue | ALL events (audit) |
| events | auth.user.# | profile.events.queue | User events for profile sync |
| events.dlx | dead-letter | events.dlq | Failed messages |

---

## Implementation Details

### Library Structure

```
libs/backend/rabbitmq-event-hub/
├── src/
│   ├── index.ts                 # Public exports
│   └── lib/
│       ├── connection.ts        # Connection manager with auto-reconnect
│       ├── publisher.ts         # Event publisher with confirms
│       ├── subscriber.ts        # Event subscriber with manual ack
│       ├── retry.ts             # Retry logic with exponential backoff
│       └── types.ts             # TypeScript interfaces
├── package.json
└── README.md
```

### Key Components

#### 1. Connection Manager (`connection.ts`)

Manages RabbitMQ connections with:
- Automatic reconnection on failure
- Connection pooling
- Health checks
- Graceful shutdown
- Statistics tracking

```typescript
const manager = new RabbitMQConnectionManager({
  url: 'amqp://admin:admin@localhost:5672',
  heartbeat: 60,
  reconnection: {
    enabled: true,
    maxRetries: 0, // Infinite retries
    initialDelay: 1000,
    maxDelay: 30000,
    multiplier: 2,
  },
  prefetch: 10,
});
```

#### 2. Publisher (`publisher.ts`)

Publishes events with:
- Publisher confirms (guaranteed delivery)
- Persistent messages (survive broker restart)
- Automatic retry on failure
- Event validation

```typescript
const publisher = new RabbitMQPublisher(manager, {
  exchange: 'events',
  exchangeType: 'topic',
  durable: true,
  confirm: true,
});

await publisher.publish('auth.user.registered', {
  userId: 'user-123',
  email: 'user@example.com',
});
```

#### 3. Subscriber (`subscriber.ts`)

Consumes events with:
- Manual acknowledgment
- Dead letter queue routing
- Prefetch control
- Event context (ack, nack, reject)

```typescript
const subscriber = new RabbitMQSubscriber(manager, {
  exchange: 'events',
  queue: 'auth.events.queue',
  routingKeyPattern: 'auth.#',
  manualAck: true,
  durable: true,
});

await subscriber.subscribe(async (event, context) => {
  // Process event
  context.ack(); // Acknowledge successful processing
});
```

#### 4. Event Types (`types.ts`)

```typescript
interface BaseEvent<T = unknown> {
  id: string;           // UUID
  type: string;         // Event type (e.g., 'user.registered')
  version: string;      // Schema version
  timestamp: string;    // ISO 8601
  source: string;       // Service name
  correlationId?: string;
  data: T;              // Event payload
  metadata?: EventMetadata;
}
```

---

## Configuration

### Docker Compose Configuration

```yaml
# docker-compose.yml
rabbitmq:
  image: rabbitmq:3-management
  container_name: mfe-rabbitmq
  environment:
    RABBITMQ_DEFAULT_USER: admin
    RABBITMQ_DEFAULT_PASS: admin
    RABBITMQ_SERVER_ADDITIONAL_ERL_ARGS: '-rabbitmq_management load_definitions "/etc/rabbitmq/definitions.json"'
  ports:
    - '5672:5672'   # AMQP protocol
    - '15672:15672' # Management UI
  volumes:
    - rabbitmq_data:/var/lib/rabbitmq
    - ./rabbitmq/definitions.json:/etc/rabbitmq/definitions.json:ro
  healthcheck:
    test: ['CMD', 'rabbitmq-diagnostics', '-q', 'ping']
    interval: 10s
    timeout: 10s
    retries: 5
    start_period: 30s
```

### Definitions File (`rabbitmq/definitions.json`)

The definitions file pre-configures RabbitMQ with:
- Users and permissions
- Virtual hosts
- Exchanges
- Queues
- Bindings

**Critical:** The `users` section must include password hashes generated using RabbitMQ's hashing algorithm.

```json
{
  "rabbit_version": "3.13.7",
  "users": [
    {
      "name": "admin",
      "password_hash": "a37JkaAs+Ep+Tk7otm5aNFx3w73Dke2P5+pL9GgW1x40Y67C",
      "hashing_algorithm": "rabbit_password_hashing_sha256",
      "tags": ["administrator"]
    },
    {
      "name": "guest",
      "password_hash": "LNFcjtcJzUWJw57XzclQvwfKq8TM3dyp1A4hx/UvjArSCkml",
      "hashing_algorithm": "rabbit_password_hashing_sha256",
      "tags": ["administrator"]
    }
  ],
  "permissions": [
    {
      "user": "admin",
      "vhost": "/",
      "configure": ".*",
      "write": ".*",
      "read": ".*"
    }
  ],
  "exchanges": [...],
  "queues": [...],
  "bindings": [...]
}
```

### Environment Variables

```bash
# .env
RABBITMQ_URL=amqp://admin:admin@localhost:5672
RABBITMQ_USER=admin
RABBITMQ_PASSWORD=admin
```

---

## Issues Faced and Resolutions

### Issue 1: User Authentication Failed - "PLAIN login refused: user 'admin' - invalid credentials"

**Symptoms:**
- Backend services failed to connect to RabbitMQ
- Error: `PLAIN login refused: user 'admin' - invalid credentials`
- RabbitMQ Management UI showed no users except `guest`

**Root Cause:**
The `RABBITMQ_DEFAULT_USER` and `RABBITMQ_DEFAULT_PASS` environment variables only create users on the **first startup** when the data volume is empty. Since the volume already existed from previous runs, the users were never created.

**Why This Happens:**
1. Docker Compose creates a named volume `rabbitmq_data` on first run
2. `RABBITMQ_DEFAULT_USER` creates the user and stores it in the volume
3. On subsequent runs, RabbitMQ uses the existing volume data
4. Environment variables are ignored because user data already exists
5. If the volume was created without users, no users exist

**Resolution:**

1. **Generate password hashes** using RabbitMQ's hashing algorithm:
   ```bash
   # Start RabbitMQ container
   docker-compose up -d rabbitmq
   
   # Generate hash for 'admin' password
   docker exec mfe-rabbitmq rabbitmqctl hash_password admin
   # Output: a37JkaAs+Ep+Tk7otm5aNFx3w73Dke2P5+pL9GgW1x40Y67C
   
   # Generate hash for 'guest' password
   docker exec mfe-rabbitmq rabbitmqctl hash_password guest
   # Output: LNFcjtcJzUWJw57XzclQvwfKq8TM3dyp1A4hx/UvjArSCkml
   ```

2. **Add users section to `definitions.json`:**
   ```json
   {
     "users": [
       {
         "name": "admin",
         "password_hash": "a37JkaAs+Ep+Tk7otm5aNFx3w73Dke2P5+pL9GgW1x40Y67C",
         "hashing_algorithm": "rabbit_password_hashing_sha256",
         "tags": ["administrator"]
       },
       {
         "name": "guest",
         "password_hash": "LNFcjtcJzUWJw57XzclQvwfKq8TM3dyp1A4hx/UvjArSCkml",
         "hashing_algorithm": "rabbit_password_hashing_sha256",
         "tags": ["administrator"]
       }
     ],
     "permissions": [
       {
         "user": "admin",
         "vhost": "/",
         "configure": ".*",
         "write": ".*",
         "read": ".*"
       },
       {
         "user": "guest",
         "vhost": "/",
         "configure": ".*",
         "write": ".*",
         "read": ".*"
       }
     ]
   }
   ```

3. **Recreate the RabbitMQ container with a fresh volume:**
   ```bash
   # Stop and remove container and volume
   docker-compose down
   docker volume rm payments-system-mfe-microservices-fullstack-nx-2026_rabbitmq_data
   
   # Start fresh
   docker-compose up -d rabbitmq
   ```

4. **Verify users exist:**
   ```bash
   docker exec mfe-rabbitmq rabbitmqctl list_users
   # Should show: admin [administrator], guest [administrator]
   ```

**Prevention:**
- Always include `users` and `permissions` in `definitions.json`
- Use password hashes, not plaintext passwords
- Document the volume recreation process

---

### Issue 2: waitForConfirms Not a Function

**Symptoms:**
- Publisher failed with error: `channel.waitForConfirms is not a function`
- Events were not being confirmed

**Root Cause:**
The connection manager was using `createChannel()` instead of `createConfirmChannel()`. Only confirm channels support the `waitForConfirms()` method.

**Resolution:**
Updated `connection.ts` to use `createConfirmChannel()`:

```typescript
// Before (incorrect)
this.channel = await this.connection.createChannel();

// After (correct)
this.channel = await this.connection.createConfirmChannel();
```

---

### Issue 3: Stale Messages in Test Queue

**Symptoms:**
- Ordering test receiving extra messages from previous runs
- Test failures due to unexpected message counts

**Root Cause:**
Durable queues persist messages between test runs. When running tests multiple times, old messages accumulated.

**Resolution:**
1. Use unique routing keys per test run:
   ```typescript
   const testRunId = Date.now();
   const routingKey = `test.ordering.${testRunId}`;
   ```

2. Purge test queue before runs (optional):
   ```bash
   docker exec mfe-rabbitmq rabbitmqctl purge_queue test.queue
   ```

---

### Issue 4: Connection URL Mismatch

**Symptoms:**
- Services using `guest:guest` credentials instead of `admin:admin`
- Connection failures after fixing user authentication

**Root Cause:**
Some service configurations defaulted to `guest:guest` credentials:

```typescript
// Old default
url: process.env['RABBITMQ_URL'] || 'amqp://guest:guest@localhost:5672'
```

**Resolution:**
Updated all service configurations to use `admin:admin`:

```typescript
// New default
url: process.env['RABBITMQ_URL'] || 'amqp://admin:admin@localhost:5672'
```

Files updated:
- `apps/auth-service/src/config/index.ts`
- `apps/payments-service/src/config/index.ts`
- `apps/api-gateway/src/websocket/event-bridge.ts`
- `scripts/test-event-hub.ts`
- `scripts/integration/infrastructure-integration.test.ts`

---

## Testing

### Test Scripts

```bash
# Run all automated tests
pnpm rabbitmq:test

# Run individual tests
pnpm rabbitmq:test:ordering      # Message ordering test
pnpm rabbitmq:test:load          # Load/performance test
pnpm rabbitmq:test:retry         # Retry mechanism test
pnpm rabbitmq:test:dlq           # DLQ verification test

# Persistence test (manual)
pnpm rabbitmq:test:persistence:publish  # Step 1: Publish messages
# (manually restart broker: docker-compose restart rabbitmq)
pnpm rabbitmq:test:persistence:verify   # Step 2: Verify persistence

# DLQ monitoring
pnpm rabbitmq:monitor-dlq        # Monitor DLQ messages in real-time
```

### RabbitMQ Management Commands

```bash
# Access Management UI
pnpm rabbitmq:ui                 # Opens http://localhost:15672

# Command-line utilities
pnpm rabbitmq:status             # Check RabbitMQ status
pnpm rabbitmq:list-queues        # List all queues
pnpm rabbitmq:list-exchanges     # List all exchanges
pnpm rabbitmq:list-bindings      # List all bindings
pnpm rabbitmq:list-users         # List all users
```

### Verification Checklist

- [x] RabbitMQ container starts successfully
- [x] Management UI accessible at http://localhost:15672
- [x] Admin user can authenticate
- [x] Exchanges created (events, events.dlx)
- [x] Queues created (auth, payments, admin, profile, dlq)
- [x] Bindings configured correctly
- [x] Services can connect and publish
- [x] Services can subscribe and consume
- [x] Dead letter queue routing works
- [x] Message persistence works (survives restart)

---

## Usage Guide

### Publishing Events

```typescript
import {
  RabbitMQConnectionManager,
  RabbitMQPublisher,
} from '@payments-system/rabbitmq-event-hub';

// Create connection
const manager = new RabbitMQConnectionManager({
  url: process.env.RABBITMQ_URL || 'amqp://admin:admin@localhost:5672',
  heartbeat: 60,
  reconnection: { enabled: true, maxRetries: 0, initialDelay: 1000, maxDelay: 30000, multiplier: 2 },
});

await manager.connect();

// Create publisher
const publisher = new RabbitMQPublisher(manager, {
  exchange: 'events',
  exchangeType: 'topic',
  durable: true,
});

await publisher.initialize();

// Publish event
await publisher.publish('auth.user.registered', {
  userId: 'user-123',
  email: 'user@example.com',
  name: 'John Doe',
});
```

### Subscribing to Events

```typescript
import {
  RabbitMQConnectionManager,
  RabbitMQSubscriber,
  BaseEvent,
  EventContext,
} from '@payments-system/rabbitmq-event-hub';

// Create connection
const manager = new RabbitMQConnectionManager({
  url: process.env.RABBITMQ_URL || 'amqp://admin:admin@localhost:5672',
});

await manager.connect();

// Create subscriber
const subscriber = new RabbitMQSubscriber(manager, {
  exchange: 'events',
  queue: 'profile.events.queue',
  routingKeyPattern: 'auth.user.#',
  manualAck: true,
  durable: true,
});

await subscriber.initialize();

// Subscribe to events
await subscriber.subscribe(async (event: BaseEvent, context: EventContext) => {
  console.log('Received event:', event.type, event.data);
  
  try {
    // Process event
    await processUserEvent(event.data);
    context.ack(); // Success
  } catch (error) {
    console.error('Processing failed:', error);
    context.nack(true); // Requeue for retry
  }
});
```

---

## Troubleshooting

### Common Issues

#### 1. Cannot Connect to RabbitMQ

```bash
# Check container is running
docker-compose ps rabbitmq

# Check container logs
docker-compose logs rabbitmq

# Check health
docker exec mfe-rabbitmq rabbitmq-diagnostics ping
```

#### 2. Authentication Failed

```bash
# List users
docker exec mfe-rabbitmq rabbitmqctl list_users

# If admin user missing, recreate container with fresh volume
docker-compose down
docker volume rm payments-system-mfe-microservices-fullstack-nx-2026_rabbitmq_data
docker-compose up -d rabbitmq
```

#### 3. Messages Not Being Delivered

```bash
# Check queue bindings
docker exec mfe-rabbitmq rabbitmqctl list_bindings

# Check queue status
docker exec mfe-rabbitmq rabbitmqctl list_queues name messages consumers
```

#### 4. DLQ Filling Up

```bash
# Check DLQ message count
docker exec mfe-rabbitmq rabbitmqctl list_queues name messages | grep dlq

# View DLQ messages in Management UI
# http://localhost:15672/#/queues/%2F/events.dlq
```

### Diagnostic Script

Run the comprehensive diagnostic script:

```bash
./scripts/diagnose-backend-errors.sh
```

This checks:
- RabbitMQ container status
- Service health
- Admin user existence
- Environment variables

---

## Performance Results

From reliability testing (`pnpm rabbitmq:test`):

| Metric | Result | Target | Status |
|--------|--------|--------|--------|
| Throughput | 2,409 msg/sec | >1,000 msg/sec | 240% of target |
| P95 Latency | 1ms | <100ms | 99% below target |
| Message Ordering | 100% FIFO | 100% | Pass |
| Message Delivery | 100% | 100% | Pass |
| Retry Mechanism | Working | Working | Pass |
| DLQ Routing | Working | Working | Pass |

---

## Production Recommendations

### 1. Security

- Use strong passwords (not `admin:admin`)
- Enable TLS/SSL for AMQP connections
- Restrict user permissions per service
- Use separate vhosts per environment

### 2. High Availability

- Deploy RabbitMQ cluster (3+ nodes)
- Enable queue mirroring
- Configure quorum queues for critical data
- Set up automatic failover

### 3. Monitoring

- Enable Prometheus metrics export
- Set up alerts for:
  - DLQ message accumulation
  - Queue depth thresholds
  - Connection failures
  - Memory usage

### 4. Retry Strategy

For production, implement exponential backoff with DLX + TTL:

```typescript
// Retry queue with TTL
await channel.assertQueue('auth.retry.queue', {
  durable: true,
  arguments: {
    'x-message-ttl': 5000, // 5 second delay
    'x-dead-letter-exchange': 'events',
    'x-dead-letter-routing-key': 'auth.#',
  },
});
```

### 5. Backup and Recovery

- Regular backup of definitions
- Export/import queue data
- Test recovery procedures

---

## Files Reference

### Core Implementation

| File | Purpose |
|------|---------|
| `libs/backend/rabbitmq-event-hub/src/lib/connection.ts` | Connection manager |
| `libs/backend/rabbitmq-event-hub/src/lib/publisher.ts` | Event publisher |
| `libs/backend/rabbitmq-event-hub/src/lib/subscriber.ts` | Event subscriber |
| `libs/backend/rabbitmq-event-hub/src/lib/retry.ts` | Retry logic |
| `libs/backend/rabbitmq-event-hub/src/lib/types.ts` | TypeScript types |

### Configuration

| File | Purpose |
|------|---------|
| `docker-compose.yml` | RabbitMQ service definition |
| `rabbitmq/definitions.json` | Pre-configured topology |

### Testing

| File | Purpose |
|------|---------|
| `scripts/test-event-hub.ts` | Reliability test suite |
| `scripts/test-event-persistence.ts` | Persistence test |
| `scripts/monitor-dlq.ts` | DLQ monitoring |

### Documentation

| File | Purpose |
|------|---------|
| `docs/POC-3-Implementation/RABBITMQ_IMPLEMENTATION.md` | This document |
| `docs/POC-3-Implementation/event-hub-migration-strategy.md` | Migration strategy |
| `docs/POC-3-Implementation/event-hub-test-results.md` | Test results |

---

**Last Updated:** 2026-12-12  
**Status:** Complete  
**Next Steps:** Monitor in production, implement HA cluster if needed

