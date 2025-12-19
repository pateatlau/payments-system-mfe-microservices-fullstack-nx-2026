# Backend POC-3 Architecture & Implementation Plan

**Status:** Planning  
**Version:** 1.0  
**Date:** 2026-01-XX  
**Tech Stack:** Node.js + Express + PostgreSQL + Prisma + RabbitMQ + nginx + GraphQL (optional) + WebSocket

---

## 1. Executive Summary

This document defines the architecture and implementation plan for **POC-3 Backend** of the microfrontend (MFE) platform. POC-3 backend extends POC-2 with:

- **Separate databases per service** (migrate from shared database to one database per microservice)
- **nginx reverse proxy** (load balancing, SSL/TLS termination, request routing)
- **Event Hub (Production-Ready)** (RabbitMQ migration from Redis Pub/Sub)
- **GraphQL API (Optional)** (alongside REST API)
- **WebSocket support** (real-time updates, session sync)
- **Advanced caching** (Redis caching patterns, query result caching)
- **Enhanced observability** (Sentry error tracking, Prometheus metrics, OpenTelemetry tracing)
- **Session management backend** (cross-device session sync)
- **Performance optimizations** (database indexing, query optimization, connection pooling)
- **Infrastructure deployment** (Docker, nginx configuration, SSL/TLS setup)

**POC Purpose & Philosophy:**

The POC phases are designed to **validate the viability, practicality, and effort required** for implementing this microservices backend architecture. Security remains a priority throughout all phases, but the bank does not yet have these specific architectures in place. Therefore, POC-3 backend focuses on:

- ✅ **Architecture validation** - Testing production-ready infrastructure patterns (separate databases, nginx, RabbitMQ, WebSocket, advanced observability)
- ✅ **Practicality assessment** - Evaluating real-world challenges with database migration, infrastructure setup, event hub migration, and advanced features
- ✅ **Effort estimation** - Understanding complexity of database separation, infrastructure deployment, performance optimization, and monitoring setup
- ✅ **Security foundation** - Establishing infrastructure security patterns (database isolation, nginx security, WebSocket security, session management security)
- ✅ **Incremental complexity** - Building from POC-2 to production-ready infrastructure and advanced features

This explains why payment operations remain **stubbed** (no actual PSP integration) - the focus is on validating the architecture and patterns with production-ready infrastructure, not delivering complete payment processing (which will come in MVP/Production phases).

**Scope:** POC-3 backend implements production-ready infrastructure with separate databases per service, nginx reverse proxy, RabbitMQ event hub, optional GraphQL API, WebSocket support, advanced caching, enhanced observability, and session management. Payment operations remain stubbed (no actual PSP integration). POC-3 backend builds on POC-2 and sets the foundation for MVP/Production scaling.

---

## 2. Architecture Overview

### 2.1 High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Frontend MFEs                             │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │  Auth MFE   │  │ Payments MFE │  │  Admin MFE   │      │
│  └──────┬──────┘  └──────┬───────┘  └──────┬───────┘      │
│         │                │                  │               │
└─────────┼────────────────┼──────────────────┼──────────────┘
          │                │                  │
          ▼                ▼                  ▼
┌─────────────────────────────────────────────────────────────┐
│                    nginx (POC-3)                            │
│              (Reverse Proxy, Load Balancing, SSL/TLS)        │
└───────────────────────────┬─────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                    API Gateway                               │
│              (Authentication, Routing, Rate Limiting)        │
└─────────┬────────────────┬──────────────────┬────────────┘
          │                │                  │
    ┌─────▼─────┐    ┌─────▼─────┐    ┌─────▼─────┐    ┌─────▼─────┐
    │  Auth     │    │ Payments  │    │  Admin    │    │ Profile   │
    │  Service  │    │  Service  │    │  Service  │    │  Service  │
    └─────┬─────┘    └─────┬─────┘    └─────┬─────┘    └─────┬─────┘
          │                │                  │                 │
          │                │                  │                 │
          │  Event Hub (RabbitMQ)             │                 │
          │                │                  │                 │
          └────────────────┼──────────────────┴─────────────────┘
                           │
        ┌──────────────────┼──────────────────┐
        │                  │                  │
        ▼                  ▼                  ▼                  ▼
┌──────────┐      ┌──────────┐      ┌──────────┐      ┌──────────┐
│  auth_db │      │payments_ │      │ admin_db│      │profile_db│
│(PostgreSQL)│      │  db     │      │(PostgreSQL)│      │(PostgreSQL)│
│          │      │(PostgreSQL)│      │          │      │          │
└──────────┘      └──────────┘      └──────────┘      └──────────┘
        │                  │                  │                 │
        └──────────────────┼──────────────────┴─────────────────┘
                           │
                    ┌──────▼──────┐
                    │    Redis     │
                    │  (Caching)  │
                    └─────────────┘
```

### 2.2 Technology Stack

| Category               | Technology         | Version     | Rationale                           |
| ---------------------- | ------------------ | ----------- | ----------------------------------- |
| **Runtime**            | Node.js            | 24.11.x LTS | Latest LTS, aligns with frontend    |
| **Framework**          | Express            | 4.x         | Industry standard, production-ready |
| **Language**           | TypeScript         | 5.9.x       | Type safety, aligns with frontend   |
| **Package Manager**    | pnpm               | 9.x         | Aligns with frontend monorepo (Nx)  |
| **Database**           | PostgreSQL         | 16.x        | Production-ready, ACID compliance   |
| **ORM**                | Prisma             | 5.x         | Type-safe, excellent DX, migrations |
| **Validation**         | Zod                | 3.23.x      | Aligns with frontend, type-safe     |
| **Authentication**     | JWT (jsonwebtoken) | 9.x         | Stateless authentication            |
| **Password Hashing**   | bcrypt             | 5.x         | Industry standard                   |
| **Event Hub**          | RabbitMQ           | 3.x         | Production-ready event hub          |
| **Caching**            | Redis              | 7.x         | Query result caching                |
| **Reverse Proxy**      | nginx              | Latest      | Load balancing, SSL/TLS             |
| **GraphQL (Optional)** | Apollo Server      | Latest      | GraphQL API (optional)              |
| **WebSocket**          | ws / socket.io     | Latest      | Real-time communication             |
| **Logging**            | Winston            | 3.x         | Structured logging                  |
| **Error Tracking**     | Sentry             | Latest      | Error tracking and monitoring       |
| **Metrics**            | Prometheus         | Latest      | Metrics collection                  |
| **Tracing**            | OpenTelemetry      | Latest      | Distributed tracing                 |
| **Testing**            | Vitest             | 2.0.x       | Aligns with frontend, fast, modern  |
| **API Testing**        | Supertest          | 7.x         | HTTP testing                        |

**Reference:** See `docs/backend-poc3-tech-stack.md` for detailed technology breakdown, alternatives considered, and rationale.

---

## 3. POC-3 Enhancements

### 3.1 nginx Reverse Proxy

**Purpose:** Production-ready reverse proxy, load balancing, and SSL/TLS termination

**Responsibilities:**

- Reverse proxy for API Gateway
- Load balancing across service instances
- SSL/TLS termination (self-signed certificates in POC-3)
- Static file serving
- Rate limiting at infrastructure level
- Request routing and path rewriting
- Caching headers
- Compression (gzip, brotli)
- Security headers

**Configuration:**

```nginx
# nginx/nginx.conf
upstream api_gateway {
    least_conn;
    server api-gateway-1:3000;
    server api-gateway-2:3000;
    keepalive 32;
}

server {
    listen 443 ssl http2;
    server_name api.example.com;

    # SSL Configuration (self-signed in POC-3)
    ssl_certificate /etc/nginx/ssl/cert.pem;
    ssl_certificate_key /etc/nginx/ssl/key.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;

    # Security Headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;

    # Rate Limiting
    limit_req_zone $binary_remote_addr zone=api_limit:10m rate=100r/m;
    limit_req zone=api_limit burst=20 nodelay;

    location /api/ {
        proxy_pass http://api_gateway;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    location /graphql {
        proxy_pass http://api_gateway;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
    }

    location /ws {
        proxy_pass http://api_gateway;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_read_timeout 86400;
    }
}
```

**Reference:** See `docs/adr/backend/poc-3/0002-nginx-reverse-proxy.md` for decision rationale.

---

### 3.2 Event Hub (Production-Ready - RabbitMQ)

**Purpose:** Production-ready event-based inter-microservices communication

**Migration from POC-2:**

- **POC-2:** Redis Pub/Sub (basic, no persistence)
- **POC-3:** RabbitMQ (production-ready, message persistence, guaranteed delivery)

**Features:**

- Message persistence
- Guaranteed delivery
- Retry mechanisms with exponential backoff
- Dead letter queue (DLQ)
- Event replay
- Event versioning
- Event schema validation
- Event routing (topic-based, direct, fanout)
- Event authentication and authorization

**Architecture:**

```
┌──────────────┐         ┌──────────────┐         ┌──────────────┐
│  Auth        │         │  Payments    │         │  Admin       │
│  Service     │         │  Service     │         │  Service     │
└──────┬───────┘         └──────┬───────┘         └──────┬───────┘
       │                        │                        │
       │  Publish Events        │                        │
       │                        │                        │
       └────────────┬───────────┴────────────────────────┘
                    │
                    ▼
            ┌───────────────┐
            │   RabbitMQ    │
            │  (Event Hub)  │
            │               │
            │  - Exchanges  │
            │  - Queues     │
            │  - Bindings   │
            │  - DLQ        │
            └───────┬───────┘
                    │
                    │  Subscribe to Events
                    │
       ┌────────────┼────────────┐
       │            │            │
       ▼            ▼            ▼
  Auth Service  Payments    Admin Service
                 Service
```

**Implementation:**

```typescript
// packages/shared-event-hub/src/rabbitmq-publisher.ts
import amqp from 'amqplib';

export class RabbitMQPublisher {
  private connection: amqp.Connection;
  private channel: amqp.Channel;

  async connect(): Promise<void> {
    this.connection = await amqp.connect(process.env.RABBITMQ_URL!);
    this.channel = await this.connection.createChannel();
  }

  async publish(
    exchange: string,
    routingKey: string,
    event: any
  ): Promise<void> {
    await this.channel.assertExchange(exchange, 'topic', { durable: true });

    const message = JSON.stringify({
      ...event,
      timestamp: new Date().toISOString(),
      version: '1.0',
    });

    this.channel.publish(exchange, routingKey, Buffer.from(message), {
      persistent: true,
      messageId: event.id,
      correlationId: event.correlationId,
    });
  }
}
```

**Reference:** See `docs/backend-event-hub-implementation-plan.md` for detailed implementation plan and `docs/adr/backend/poc-3/0001-rabbitmq-event-hub.md` for decision rationale.

---

### 3.3 GraphQL API (Optional)

**Purpose:** Optional GraphQL API alongside REST API

**Scope:**

- GraphQL schema definition
- Resolvers for Auth, Payments, Admin, Profile
- GraphQL subscriptions (real-time updates)
- GraphQL security (authentication, authorization, rate limiting)
- GraphQL error handling
- GraphQL performance optimization (DataLoader, query complexity)

**Schema Example:**

```graphql
# schema.graphql
type Query {
  me: User
  payments(filter: PaymentFilter): [Payment!]!
  payment(id: ID!): Payment
}

type Mutation {
  login(email: String!, password: String!): AuthPayload!
  createPayment(input: CreatePaymentInput!): Payment!
}

type Subscription {
  paymentUpdated: Payment!
}

type User {
  id: ID!
  email: String!
  name: String!
  role: UserRole!
}

type Payment {
  id: ID!
  amount: Float!
  status: PaymentStatus!
  createdAt: DateTime!
}
```

**Reference:** See `docs/adr/backend/poc-3/0003-graphql-optional.md` for decision rationale.

---

### 3.4 WebSocket Support

**Purpose:** Real-time updates and session synchronization

**Use Cases:**

- Real-time payment status updates
- Cross-device session synchronization
- Live notifications
- Admin dashboard real-time updates

**Implementation:**

```typescript
// packages/api-gateway/src/websocket-server.ts
import { WebSocketServer } from 'ws';
import jwt from 'jsonwebtoken';

const wss = new WebSocketServer({ port: 8080 });

wss.on('connection', (ws, req) => {
  // Authenticate WebSocket connection
  const token = new URL(req.url!, 'http://localhost').searchParams.get('token');

  try {
    const decoded = jwt.verify(token!, process.env.JWT_SECRET!);
    ws.userId = decoded.userId;

    // Subscribe to user-specific events
    subscribeToUserEvents(decoded.userId, (event) => {
      ws.send(JSON.stringify(event));
    });
  } catch (error) {
    ws.close(1008, 'Unauthorized');
  }

  ws.on('message', (message) => {
    // Handle WebSocket messages
  });
});
```

**Security:**

- JWT authentication for WebSocket connections
- WSS (secure WebSocket) in production
- Rate limiting per connection
- Message validation

---

### 3.5 Advanced Caching

**Purpose:** Improve performance with intelligent caching

**Caching Strategies:**

- **Query Result Caching:** Cache database query results in Redis
- **API Response Caching:** Cache API responses for GET requests
- **Session Caching:** Cache user sessions in Redis
- **Event Caching:** Cache frequently accessed events

**Implementation:**

```typescript
// packages/shared-cache/src/redis-cache.ts
import Redis from 'ioredis';

const redis = new Redis(process.env.REDIS_URL!);

export class CacheService {
  async get<T>(key: string): Promise<T | null> {
    const value = await redis.get(key);
    return value ? JSON.parse(value) : null;
  }

  async set(key: string, value: any, ttl: number = 3600): Promise<void> {
    await redis.setex(key, ttl, JSON.stringify(value));
  }

  async invalidate(pattern: string): Promise<void> {
    const keys = await redis.keys(pattern);
    if (keys.length > 0) {
      await redis.del(...keys);
    }
  }
}
```

---

### 3.6 Enhanced Observability

**Purpose:** Production-ready monitoring, logging, and tracing

**Components:**

1. **Error Tracking (Sentry)**

   - Error capture and reporting
   - Performance monitoring
   - Release tracking
   - User context

2. **Metrics (Prometheus)**

   - Request rate
   - Response time
   - Error rate
   - Database query performance
   - Event hub metrics

3. **Tracing (OpenTelemetry)**

   - Distributed tracing
   - Service dependency mapping
   - Performance bottleneck identification

4. **Logging (Winston + Structured Logging)**
   - Structured JSON logs
   - Log levels (error, warn, info, debug)
   - Log aggregation
   - Log correlation IDs

**Implementation:**

```typescript
// packages/shared-observability/src/sentry.ts
import * as Sentry from '@sentry/node';

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV,
  tracesSampleRate: 1.0,
});

// packages/shared-observability/src/prometheus.ts
import { Registry, Counter, Histogram } from 'prom-client';

const register = new Registry();

export const httpRequestDuration = new Histogram({
  name: 'http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'route', 'status'],
  registers: [register],
});
```

---

### 3.7 Session Management Backend

**Purpose:** Cross-device session synchronization

**Features:**

- Device registration
- Session tracking across devices
- Session invalidation
- "Logout other devices" functionality

**Database Schema:**

```sql
-- devices table
CREATE TABLE devices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  device_id VARCHAR(255) UNIQUE NOT NULL,
  device_name VARCHAR(255),
  device_type VARCHAR(50),
  last_active_at TIMESTAMP DEFAULT NOW(),
  created_at TIMESTAMP DEFAULT NOW()
);

-- sessions table
CREATE TABLE sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  device_id UUID REFERENCES devices(id) ON DELETE CASCADE,
  refresh_token_id UUID REFERENCES refresh_tokens(id) ON DELETE CASCADE,
  ip_address VARCHAR(45),
  user_agent TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  expires_at TIMESTAMP NOT NULL
);
```

**Reference:** See `docs/session-management-strategy.md` for detailed session management strategy.

---

## 4. Database Enhancements

### 4.1 Separate Databases per Service

**Purpose:** Migrate from shared database to separate databases per service for true service isolation

**Migration from POC-2:**

- **POC-2:** Shared database with service-specific schemas
- **POC-3:** Separate databases per service (one database per microservice)

**Benefits:**

- **True Service Isolation** - Each service has its own database
- **Independent Scaling** - Scale databases independently per service
- **Service-Specific Optimizations** - Optimize each database for its service's needs
- **Reduced Coupling** - Services don't share database resources
- **Independent Deployments** - Database changes don't affect other services
- **Better Fault Isolation** - Database failure in one service doesn't affect others

**Database Assignment:**

- **Auth Service** → `auth_db` (PostgreSQL)
- **Payments Service** → `payments_db` (PostgreSQL)
- **Admin Service** → `admin_db` (PostgreSQL)
- **Profile Service** → `profile_db` (PostgreSQL)

**Migration Strategy:**

1. **Phase 1: Setup Separate Databases**

   - Create separate PostgreSQL databases for each service
   - Setup Prisma clients for each service
   - Configure database connections

2. **Phase 2: Data Migration**

   - Migrate data from shared database to separate databases
   - Use event hub for data synchronization during migration
   - Validate data integrity

3. **Phase 3: Code Updates**

   - Update each service to use its own database
   - Update Prisma schemas to be service-specific
   - Remove cross-service database dependencies

4. **Phase 4: Testing & Validation**
   - Integration tests for each service
   - End-to-end tests for cross-service operations
   - Performance testing

**Prisma Schema Structure:**

```prisma
// apps/backend/auth-service/prisma/schema.prisma
datasource db {
  provider = "postgresql"
  url      = env("AUTH_DATABASE_URL")
}

model User {
  id            String    @id @default(uuid())
  email         String    @unique
  passwordHash  String    @map("password_hash")
  name          String
  role          UserRole
  emailVerified Boolean   @default(false) @map("email_verified")
  createdAt     DateTime  @default(now()) @map("created_at")
  updatedAt     DateTime  @updatedAt @map("updated_at")

  refreshTokens RefreshToken[]
  devices       Device[]
  sessions      Session[]

  @@map("users")
}

// ... (other auth service models)
```

```prisma
// apps/backend/payments-service/prisma/schema.prisma
datasource db {
  provider = "postgresql"
  url      = env("PAYMENTS_DATABASE_URL")
}

model Payment {
  id          String   @id @default(uuid())
  userId      String   @map("user_id") // Reference to user ID (not FK)
  amount      Decimal
  currency    String   @default("USD")
  status      PaymentStatus
  type        PaymentType
  description String?
  metadata    Json?
  createdAt   DateTime @default(now()) @map("created_at")
  updatedAt   DateTime @updatedAt @map("updated_at")

  transactions PaymentTransaction[]

  @@map("payments")
}

// ... (other payments service models)
```

**Cross-Service Data Access:**

Since services now have separate databases, cross-service data access must use:

- **Event Hub** - For async data synchronization
- **API Calls** - For synchronous data access
- **Event Sourcing** - For maintaining data consistency across services

**Example: Payments Service needs User data**

```typescript
// Option 1: API Call (Synchronous)
const user = await fetch(`http://auth-service/api/users/${userId}`, {
  headers: { Authorization: `Bearer ${token}` },
});

// Option 2: Event-Based (Asynchronous)
// User data cached in Payments Service, updated via events
const user = await userCache.get(userId);
```

**Connection Pooling per Service:**

```typescript
// apps/backend/auth-service/src/db.ts
import { PrismaClient } from '@prisma/client';

export const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.AUTH_DATABASE_URL,
    },
  },
  log: ['query', 'error', 'warn'],
});
```

**Reference:** See `docs/adr/backend/poc-3/0004-separate-databases-per-service.md` for decision rationale, migration strategy, and trade-offs.

---

### 4.2 Performance Optimizations

**Indexing Strategy:**

```sql
-- Add indexes for frequently queried fields
CREATE INDEX idx_payments_user_id_status ON payments(user_id, status);
CREATE INDEX idx_payments_created_at ON payments(created_at DESC);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_sessions_user_id_device_id ON sessions(user_id, device_id);
```

**Query Optimization:**

- Use Prisma query optimization
- Implement connection pooling
- Use database views for complex queries
- Implement materialized views for reports

**Connection Pooling:**

```typescript
// Prisma connection pooling
const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL,
    },
  },
  log: ['query', 'error', 'warn'],
});
```

---

## 5. Security Enhancements

### 5.1 Infrastructure Security

- nginx security headers
- SSL/TLS configuration
- Rate limiting at infrastructure level
- DDoS protection

### 5.2 WebSocket Security

- JWT authentication for WebSocket connections
- WSS (secure WebSocket) in production
- Message validation
- Rate limiting per connection

### 5.3 GraphQL Security

- Query complexity limits
- Depth limits
- Rate limiting per user
- Authentication and authorization

### 5.4 Cache Security

- Cache key validation
- Cache poisoning prevention
- Sensitive data exclusion from cache

**Reference:** See `docs/security-strategy-banking.md` for comprehensive security strategy.

---

## 6. Implementation Plan

### Phase 1: Infrastructure Setup (Week 1)

**Tasks:**

1. Setup nginx

   - Install and configure nginx
   - Setup SSL/TLS (self-signed certificates)
   - Configure reverse proxy
   - Setup load balancing
   - Configure security headers

2. Setup RabbitMQ

   - Install and configure RabbitMQ
   - Create exchanges, queues, bindings
   - Setup dead letter queue
   - Migrate from Redis Pub/Sub

3. Setup Separate Databases
   - Create separate PostgreSQL databases for each service
   - Configure database connections
   - Setup Prisma clients for each service

**Deliverables:**

- ✅ nginx configured and running
- ✅ RabbitMQ configured and running
- ✅ Event hub migrated from Redis Pub/Sub
- ✅ Separate databases created and configured

---

### Phase 2: Database Migration (Week 2)

**Tasks:**

1. Migrate to Separate Databases

   - Migrate data from shared database to separate databases
   - Update Prisma schemas to be service-specific
   - Update each service to use its own database
   - Setup data synchronization via event hub
   - Validate data integrity

2. Update Code

   - Update Prisma clients for each service
   - Remove cross-service database dependencies
   - Implement cross-service data access patterns (API calls, events)
   - Update connection pooling

3. Testing
   - Integration tests for each service
   - End-to-end tests for cross-service operations
   - Data integrity validation
   - Performance testing

**Deliverables:**

- ✅ Separate databases per service implemented
- ✅ Data migration complete
- ✅ All services using their own databases
- ✅ Cross-service data access working
- ✅ Tests passing

---

### Phase 3: Event Hub Migration (Week 3)

**Tasks:**

1. Migrate Event Hub to RabbitMQ

   - Update event publisher
   - Update event subscriber
   - Implement retry mechanisms
   - Implement dead letter queue
   - Add event versioning

2. Testing
   - Integration tests
   - Load testing
   - Failure scenario testing

**Deliverables:**

- ✅ Event hub migrated to RabbitMQ
- ✅ Retry mechanisms working
- ✅ Dead letter queue working
- ✅ Tests passing

---

### Phase 4: GraphQL & WebSocket (Week 4)

**Tasks:**

1. Implement GraphQL API (Optional)

   - Define GraphQL schema
   - Implement resolvers
   - Add subscriptions
   - Add security

2. Implement WebSocket Server
   - Setup WebSocket server
   - Implement authentication
   - Add real-time updates
   - Add session sync

**Deliverables:**

- ✅ GraphQL API working (if implemented)
- ✅ WebSocket server working
- ✅ Real-time updates working

---

### Phase 5: Caching & Performance (Week 5)

**Tasks:**

1. Implement Advanced Caching

   - Query result caching
   - API response caching
   - Cache invalidation strategies

2. Performance Optimizations
   - Database indexing
   - Query optimization
   - Connection pooling

**Deliverables:**

- ✅ Caching implemented
- ✅ Performance optimizations complete
- ✅ Performance metrics improved

---

### Phase 6: Observability & Session Management (Week 6)

**Tasks:**

1. Enhanced Observability

   - Sentry integration
   - Prometheus metrics
   - OpenTelemetry tracing
   - Enhanced logging

2. Session Management
   - Device registration
   - Cross-device session sync
   - Session invalidation

**Deliverables:**

- ✅ Observability enhanced
- ✅ Session management working
- ✅ Monitoring dashboard

---

### Phase 7: Testing & Documentation (Week 7)

**Tasks:**

1. Testing

   - Integration tests
   - E2E tests
   - Performance tests
   - Security tests

2. Documentation
   - API documentation
   - Deployment guide
   - Monitoring guide

**Deliverables:**

- ✅ All tests passing
- ✅ Documentation complete
- ✅ POC-3 backend complete

---

## 7. Success Criteria

### 7.1 Functional Requirements

- ✅ nginx reverse proxy working
- ✅ RabbitMQ event hub working
- ✅ GraphQL API working (if implemented)
- ✅ WebSocket server working
- ✅ Advanced caching working
- ✅ Enhanced observability working
- ✅ Session management working
- ✅ Separate databases per service working

### 7.2 Non-Functional Requirements

- ✅ API response time < 150ms (p95)
- ✅ Event hub message delivery > 99.9%
- ✅ Zero message loss (with RabbitMQ)
- ✅ All services have health checks
- ✅ Monitoring dashboard working
- ✅ Error tracking working

### 7.3 Documentation Requirements

- ✅ API documentation (OpenAPI + GraphQL schema)
- ✅ Deployment guide
- ✅ Monitoring guide
- ✅ nginx configuration documented

---

## 8. Key Technical Decisions

### 8.1 RabbitMQ for Event Hub

**Decision:** Migrate from Redis Pub/Sub to RabbitMQ

**Rationale:**

- Message persistence
- Guaranteed delivery
- Retry mechanisms
- Dead letter queue
- Production-ready

**Reference:** See `docs/adr/backend/poc-3/0001-rabbitmq-event-hub.md` for decision rationale, alternatives considered, and trade-offs.

---

### 8.2 nginx Reverse Proxy

**Decision:** Use nginx for reverse proxy, load balancing, and SSL/TLS

**Rationale:**

- Industry standard
- High performance
- Excellent SSL/TLS support
- Flexible configuration
- Production-ready

**Reference:** See `docs/adr/backend/poc-3/0002-nginx-reverse-proxy.md` for decision rationale, alternatives considered, and trade-offs.

---

### 8.3 Separate Databases per Service

**Decision:** Migrate from shared database to separate databases per service

**Rationale:**

- True service isolation
- Independent scaling per service
- Service-specific optimizations
- Reduced coupling
- Better fault isolation
- Production-ready microservices pattern

**Reference:** See `docs/adr/backend/poc-3/0004-separate-databases-per-service.md` for decision rationale, migration strategy, alternatives considered, and trade-offs.

---

### 8.4 GraphQL API (Optional)

**Decision:** Implement GraphQL API optionally alongside REST

**Rationale:**

- Flexible querying
- Reduced over-fetching
- Real-time subscriptions
- Evaluate need for MVP

**Reference:** See `docs/adr/backend/poc-3/0003-graphql-optional.md` for decision rationale, alternatives considered, and trade-offs.

---

## 9. Testing Strategy

### 9.1 Unit Testing

- Service layer logic
- Event hub library
- Cache service
- WebSocket handlers

### 9.2 Integration Testing

- nginx routing
- RabbitMQ event flow
- GraphQL queries/mutations
- WebSocket connections
- Cache invalidation

### 9.3 E2E Testing

- Full request flow through nginx
- Event publishing/subscribing
- Real-time updates
- Session synchronization

### 9.4 Performance Testing

- Load testing with nginx
- Event hub throughput
- Cache hit rates
- Database query performance

**Reference:** See `docs/backend-testing-strategy.md` for comprehensive testing strategy.

---

## 10. Dependencies

### 10.1 External Dependencies

- PostgreSQL 16.x (4 separate databases: auth_db, payments_db, admin_db, profile_db)
- RabbitMQ 3.x (event hub)
- Redis 7.x (caching)
- nginx (reverse proxy)
- Node.js 24.11.x LTS (runtime)

### 10.2 Frontend Dependencies

- Frontend MFEs must support WebSocket
- Frontend must support GraphQL (if implemented)
- Frontend must support session sync

---

## 11. Risks & Mitigation

### 11.1 Risks

1. **Database Migration Complexity** - Migrating from shared to separate databases

   - **Mitigation:** Phased migration, comprehensive testing, data validation

2. **Cross-Service Data Access** - Services need data from other services

   - **Mitigation:** API calls, event-based synchronization, caching

3. **RabbitMQ Complexity** - More complex than Redis Pub/Sub

   - **Mitigation:** Phased migration, comprehensive testing

4. **nginx Configuration** - Complex configuration

   - **Mitigation:** Documented configuration, testing

5. **WebSocket Scalability** - May need horizontal scaling

   - **Mitigation:** Load testing, connection pooling

6. **GraphQL Performance** - Query complexity issues
   - **Mitigation:** Query complexity limits, depth limits

---

## 12. Out of Scope (POC-3)

- ❌ Real PSP integration (MVP/Production)
- ❌ Service mesh (Future)
- ❌ Advanced analytics (MVP)
- ❌ Multi-region deployment (MVP/Production)

---

## 13. Related Documents

- `docs/adr/README.md` - Architecture Decision Records (ADRs) index
- `docs/backend-architecture.md` - High-level backend architecture
- `docs/backend-poc2-architecture.md` - POC-2 backend architecture (previous phase)
- `docs/backend-poc2-tech-stack.md` - POC-2 backend tech stack (previous phase)
- `docs/backend-poc3-tech-stack.md` - Complete tech stack for POC-3
- `docs/backend-event-hub-implementation-plan.md` - Event hub implementation plan
- `docs/backend-testing-strategy.md` - Comprehensive testing strategy
- `docs/backend-api-documentation-standards.md` - API documentation standards
- `docs/backend-development-setup.md` - Developer onboarding and setup guide
- `docs/mfe-poc3-architecture.md` - Frontend POC-3 architecture
- `docs/security-strategy-banking.md` - Comprehensive security strategy
- `docs/session-management-strategy.md` - Session management strategy
- `docs/observability-analytics-phasing.md` - Observability and analytics phasing

---

**Last Updated:** 2026-01-XX  
**Status:** Planning - Ready for POC-3 Implementation
