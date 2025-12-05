# Backend POC-2 Architecture & Implementation Plan

**Status:** Planning  
**Version:** 1.0  
**Date:** 2026-01-XX  
**Tech Stack:** Node.js + Express + PostgreSQL + Prisma + Redis + JWT

---

## 1. Executive Summary

This document defines the architecture and implementation plan for **POC-2 Backend** of the microfrontend (MFE) platform. POC-2 backend extends the frontend POC-1 with:

- **Real backend API** (REST API)
- **Microservices architecture** (Auth, Payments, Admin, Profile services)
- **API Gateway** (routing, authentication, rate limiting)
- **Real authentication** (JWT tokens with refresh tokens)
- **Database integration** (PostgreSQL with Prisma ORM)
- **Event Hub (Basic)** (Redis Pub/Sub for inter-microservices communication)
- **RBAC implementation** (Role-based access control)
- **API security** (Rate limiting, CORS, input validation)
- **Basic observability** (Logging, health checks, basic metrics)
- **Payment operations** (Stubbed - no actual PSP integration)

**POC Purpose & Philosophy:**

The POC phases are designed to **validate the viability, practicality, and effort required** for implementing this microservices backend architecture. Security remains a priority throughout all phases, but the bank does not yet have these specific architectures in place. Therefore, POC-2 backend focuses on:

- ✅ **Architecture validation** - Testing microservices patterns, API Gateway, event-based communication
- ✅ **Practicality assessment** - Evaluating real-world challenges with service communication, database design, and API design
- ✅ **Effort estimation** - Understanding complexity of microservices setup, authentication flows, and event hub implementation
- ✅ **Security foundation** - Establishing enhanced security patterns (JWT, RBAC, API security, audit logging)
- ✅ **Incremental complexity** - Building from simple to complex in manageable phases

This explains why payment operations remain **stubbed** (no actual PSP integration) - the focus is on validating the architecture and patterns with backend integration, not delivering complete payment processing (which will come in MVP/Production phases).

**Scope:** POC-2 backend implements a microservices architecture with REST API, real JWT authentication, role-based access control, basic event hub for inter-service communication, and comprehensive API security. Payment operations are stubbed (no actual PSP integration). POC-2 backend builds the foundation for POC-3 infrastructure improvements (nginx, enhanced event hub, advanced observability).

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
│                    API Gateway                               │
│              (Authentication, Routing, Rate Limiting)        │
└─────────┬────────────────┬──────────────────┬────────────┘
          │                │                  │
    ┌─────▼─────┐    ┌─────▼─────┐    ┌─────▼─────┐
    │  Auth     │    │ Payments  │    │  Admin    │
    │  Service  │    │  Service  │    │  Service  │
    └─────┬─────┘    └─────┬─────┘    └─────┬─────┘
          │                │                  │
          │                │                  │
          │  Event Hub (Redis Pub/Sub)        │
          │                │                  │
          └────────────────┼──────────────────┘
                           │
                    ┌──────▼──────┐
                    │  PostgreSQL  │
                    │   Database   │
                    └─────────────┘
```

### 2.2 Technology Stack

| Category             | Technology         | Version     | Rationale                           |
| -------------------- | ------------------ | ----------- | ----------------------------------- |
| **Runtime**          | Node.js            | 24.11.x LTS | Latest LTS, aligns with frontend    |
| **Framework**        | Express            | 4.x         | Industry standard, production-ready |
| **Language**         | TypeScript         | 5.9.x       | Type safety, aligns with frontend   |
| **Package Manager**  | pnpm               | 9.x         | Aligns with frontend monorepo (Nx)  |
| **Database**         | PostgreSQL         | 16.x        | Production-ready, ACID compliance   |
| **ORM**              | Prisma             | 5.x         | Type-safe, excellent DX, migrations |
| **Validation**       | Zod                | 3.23.x      | Aligns with frontend, type-safe     |
| **Authentication**   | JWT (jsonwebtoken) | 9.x         | Stateless authentication            |
| **Password Hashing** | bcrypt             | 5.x         | Industry standard                   |
| **Event Hub**        | Redis Pub/Sub      | 7.x         | Basic event-based communication     |
| **Logging**          | Winston            | 3.x         | Structured logging                  |
| **Testing**          | Vitest             | 2.0.x       | Aligns with frontend, fast, modern  |
| **API Testing**      | Supertest          | 7.x         | HTTP testing                        |

**Reference:** See `docs/backend-poc2-tech-stack.md` for detailed technology breakdown, alternatives considered, and rationale.

---

## 3. Microservices Design

### 3.1 Auth Service

**Purpose:** Handle authentication, authorization, and user management

**Responsibilities:**

- User registration and login
- JWT token generation and validation
- Password management (hashing, reset)
- Role-based access control (RBAC)
- Session management (refresh tokens)
- User CRUD operations
- Email verification (basic)

**Endpoints:**

```
POST   /api/auth/register          - User registration
POST   /api/auth/login             - User login
POST   /api/auth/logout            - User logout
POST   /api/auth/refresh           - Refresh JWT token
GET    /api/auth/me                - Get current user
PUT    /api/auth/password          - Change password
POST   /api/auth/forgot-password   - Password reset request
POST   /api/auth/reset-password    - Password reset
GET    /api/auth/verify-email      - Verify email (basic)
```

**Database Schema:**

```sql
-- users table
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  name VARCHAR(255) NOT NULL,
  role VARCHAR(50) NOT NULL CHECK (role IN ('ADMIN', 'CUSTOMER', 'VENDOR')),
  email_verified BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- refresh_tokens table
CREATE TABLE refresh_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  token VARCHAR(255) UNIQUE NOT NULL,
  expires_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_refresh_tokens_user_id ON refresh_tokens(user_id);
CREATE INDEX idx_refresh_tokens_token ON refresh_tokens(token);
```

**Integration with Frontend:**

- Auth MFE calls `/api/auth/login` and `/api/auth/register`
- JWT tokens stored in Zustand store (frontend)
- Token sent in `Authorization` header for protected routes
- Refresh token mechanism for long-lived sessions
- Role information included in JWT payload

**Event Publishing:**

- `auth:user:registered` - When user registers
- `auth:user:logged_in` - When user logs in
- `auth:user:logged_out` - When user logs out
- `auth:password:changed` - When password is changed

---

### 3.2 Payments Service

**Purpose:** Handle payment processing, transactions, and reports (stubbed - no actual PSP)

**Responsibilities:**

- Payment initiation (VENDOR role)
- Payment processing (CUSTOMER role) - stubbed
- Transaction management
- Payment history
- Reports generation (VENDOR/ADMIN)
- Payment status tracking

**Endpoints:**

```
GET    /api/payments              - List payments (role-based filtering)
GET    /api/payments/:id          - Get payment details
POST   /api/payments              - Create payment (initiate or make)
PUT    /api/payments/:id          - Update payment
DELETE /api/payments/:id          - Cancel payment
GET    /api/payments/reports      - Get payment reports (VENDOR/ADMIN)
GET    /api/payments/history      - Get payment history
POST   /api/payments/:id/status   - Update payment status
```

**Database Schema:**

```sql
-- payments table
CREATE TABLE payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) NOT NULL,
  amount DECIMAL(10, 2) NOT NULL,
  currency VARCHAR(3) DEFAULT 'USD',
  status VARCHAR(50) NOT NULL CHECK (status IN ('pending', 'initiated', 'processing', 'completed', 'failed', 'cancelled')),
  type VARCHAR(50) NOT NULL CHECK (type IN ('initiate', 'payment')),
  description TEXT,
  metadata JSONB,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- payment_transactions table
CREATE TABLE payment_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  payment_id UUID REFERENCES payments(id) ON DELETE CASCADE,
  transaction_type VARCHAR(50) NOT NULL,
  amount DECIMAL(10, 2) NOT NULL,
  status VARCHAR(50) NOT NULL,
  metadata JSONB,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_payments_user_id ON payments(user_id);
CREATE INDEX idx_payments_status ON payments(status);
CREATE INDEX idx_payments_created_at ON payments(created_at);
CREATE INDEX idx_payment_transactions_payment_id ON payment_transactions(payment_id);
```

**Payment Processing (Stubbed):**

All payment operations are **stubbed** - the backend simulates payment processing but does not integrate with actual Payment Service Providers (PSPs). This allows us to:

- Validate payment API design
- Test payment flows end-to-end
- Implement role-based access (VENDOR initiates, CUSTOMER pays)
- Test event publishing for payment events
- Validate transaction management patterns

Real PSP integration will be implemented in MVP/Production phases.

**Integration with Frontend:**

- Payments MFE uses TanStack Query to fetch payments
- VENDOR role can initiate payments via `POST /api/payments` with `type: 'initiate'`
- CUSTOMER role can make payments via `POST /api/payments` with `type: 'payment'`
- Real-time updates via polling (WebSocket in POC-3)

**Event Publishing:**

- `payments:payment:created` - When payment is created
- `payments:payment:updated` - When payment status changes
- `payments:payment:completed` - When payment is completed
- `payments:payment:failed` - When payment fails

---

### 3.3 Admin Service

**Purpose:** System administration and user management

**Responsibilities:**

- User management (CRUD)
- Role assignment
- System configuration
- Audit logs
- Analytics and reporting
- System health monitoring

**Endpoints:**

```
GET    /api/admin/users           - List all users
GET    /api/admin/users/:id       - Get user details
POST   /api/admin/users            - Create user
PUT    /api/admin/users/:id        - Update user
DELETE /api/admin/users/:id        - Delete user
PUT    /api/admin/users/:id/role   - Update user role
GET    /api/admin/audit-logs       - Get audit logs
GET    /api/admin/analytics        - Get system analytics
GET    /api/admin/config           - Get system configuration
PUT    /api/admin/config           - Update system configuration
GET    /api/admin/health           - System health check
```

**Database Schema:**

```sql
-- audit_logs table
CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  action VARCHAR(100) NOT NULL,
  resource_type VARCHAR(50),
  resource_id UUID,
  details JSONB,
  ip_address VARCHAR(45),
  user_agent TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- system_config table
CREATE TABLE system_config (
  key VARCHAR(100) PRIMARY KEY,
  value JSONB NOT NULL,
  description TEXT,
  updated_at TIMESTAMP DEFAULT NOW(),
  updated_by UUID REFERENCES users(id)
);

-- Indexes
CREATE INDEX idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at);
CREATE INDEX idx_audit_logs_action ON audit_logs(action);
```

**Integration with Frontend:**

- Admin MFE (POC-2) will consume admin endpoints
- Role-based access: Only ADMIN role can access admin endpoints
- Real-time dashboard updates via polling (WebSocket in POC-3)

**Event Publishing:**

- `admin:user:created` - When admin creates user
- `admin:user:updated` - When admin updates user
- `admin:user:deleted` - When admin deletes user
- `admin:config:updated` - When system config is updated

---

### 3.4 Profile Service

**Purpose:** User profile management and preferences

**Responsibilities:**

- User profile CRUD
- User preferences
- Avatar/image management (basic)
- Notification settings
- Account settings

**Endpoints:**

```
GET    /api/profile                - Get current user profile
PUT    /api/profile                - Update profile
POST   /api/profile/avatar         - Upload avatar (basic)
DELETE /api/profile/avatar         - Delete avatar
GET    /api/profile/preferences    - Get preferences
PUT    /api/profile/preferences    - Update preferences
```

**Database Schema:**

```sql
-- user_profiles table
CREATE TABLE user_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE UNIQUE,
  avatar_url VARCHAR(500),
  phone VARCHAR(20),
  address TEXT,
  bio TEXT,
  preferences JSONB,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_user_profiles_user_id ON user_profiles(user_id);
```

**Integration with Frontend:**

- Profile MFE (future) will consume profile endpoints
- Shared with Auth MFE for profile updates
- Image uploads handled via multipart/form-data (basic implementation)

---

## 4. API Gateway

### 4.1 Purpose

The API Gateway serves as the single entry point for all frontend requests, handling:

- **Routing** - Route requests to appropriate microservices
- **Authentication** - Validate JWT tokens
- **Rate Limiting** - Prevent DDoS attacks
- **CORS** - Handle cross-origin requests
- **Request/Response Transformation** - Standardize API responses
- **Error Handling** - Centralized error handling
- **Logging** - Request/response logging

### 4.2 Architecture

```
Frontend Request
      │
      ▼
┌─────────────────┐
│   API Gateway   │
│                 │
│ 1. CORS Check   │
│ 2. Rate Limit   │
│ 3. Auth Check   │
│ 4. Route        │
└────────┬────────┘
         │
         ├──────────────┬──────────────┬──────────────┐
         ▼              ▼              ▼              ▼
    Auth Service  Payments Service  Admin Service  Profile Service
```

### 4.3 Implementation

**Routing Configuration:**

```typescript
// packages/api-gateway/src/routes.ts
import express from 'express';
import authRoutes from './routes/auth';
import paymentsRoutes from './routes/payments';
import adminRoutes from './routes/admin';
import profileRoutes from './routes/profile';

const router = express.Router();

// Public routes
router.use('/api/auth', authRoutes);

// Protected routes (require authentication)
router.use('/api/payments', authenticate, paymentsRoutes);
router.use('/api/profile', authenticate, profileRoutes);

// Admin routes (require ADMIN role)
router.use('/api/admin', authenticate, requireRole('ADMIN'), adminRoutes);

export default router;
```

**Authentication Middleware:**

```typescript
// packages/api-gateway/src/middleware/auth.ts
import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

export function authenticate(req: Request, res: Response, next: NextFunction) {
  const token = req.headers.authorization?.replace('Bearer ', '');

  if (!token) {
    return res.status(401).json({
      success: false,
      error: { code: 'UNAUTHORIZED', message: 'No token provided' },
    });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!);
    req.user = decoded; // Attach user to request
    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      error: { code: 'UNAUTHORIZED', message: 'Invalid token' },
    });
  }
}
```

**Rate Limiting:**

```typescript
// packages/api-gateway/src/middleware/rateLimit.ts
import rateLimit from 'express-rate-limit';

export const apiRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.',
});

export const authRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5, // Stricter limit for auth endpoints
  message: 'Too many authentication attempts, please try again later.',
});
```

---

## 5. Database Design

### 5.1 Architecture

**Approach:** Shared database with service-specific schemas

**Rationale:**

- Simpler for POC-2/MVP
- Easier transactions across services
- Can migrate to separate databases later if needed
- Prisma supports schema separation

**Schema Organization:**

```sql
-- Service-specific schemas
CREATE SCHEMA auth;
CREATE SCHEMA payments;
CREATE SCHEMA admin;
CREATE SCHEMA profile;
```

### 5.2 Entity Relationship Diagram

```
┌─────────────┐
│   users     │
│─────────────│
│ id (PK)     │
│ email       │
│ password    │
│ name        │
│ role        │
└──────┬──────┘
       │
       ├─────────────────┬──────────────────┐
       │                 │                  │
┌──────▼──────┐  ┌──────▼──────┐  ┌────────▼──────┐
│user_profiles│  │  payments   │  │ refresh_tokens│
│─────────────│  │─────────────│  │───────────────│
│ user_id (FK)│  │ user_id (FK)│  │ user_id (FK)  │
│ avatar_url  │  │ amount      │  │ token         │
│ preferences │  │ status      │  │ expires_at    │
└─────────────┘  └──────┬──────┘  └───────────────┘
                        │
                 ┌──────▼──────────┐
                 │payment_transactions│
                 │──────────────────│
                 │ payment_id (FK)  │
                 │ transaction_type │
                 │ amount           │
                 └──────────────────┘
```

### 5.3 Prisma Schema

```prisma
// packages/shared-db/prisma/schema.prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

// Auth Service Schema
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
  profile       UserProfile?
  payments      Payment[]

  @@map("users")
}

model RefreshToken {
  id        String   @id @default(uuid())
  userId    String   @map("user_id")
  token     String   @unique
  expiresAt DateTime @map("expires_at")
  createdAt DateTime @default(now()) @map("created_at")

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([userId])
  @@index([token])
  @@map("refresh_tokens")
}

enum UserRole {
  ADMIN
  CUSTOMER
  VENDOR
}

// Payments Service Schema
model Payment {
  id          String        @id @default(uuid())
  userId      String        @map("user_id")
  amount      Decimal       @db.Decimal(10, 2)
  currency    String        @default("USD")
  status      PaymentStatus
  type        PaymentType
  description String?
  metadata    Json?
  createdAt   DateTime      @default(now()) @map("created_at")
  updatedAt   DateTime      @updatedAt @map("updated_at")

  user         User                  @relation(fields: [userId], references: [id])
  transactions PaymentTransaction[]

  @@index([userId])
  @@index([status])
  @@index([createdAt])
  @@map("payments")
}

model PaymentTransaction {
  id              String   @id @default(uuid())
  paymentId       String   @map("payment_id")
  transactionType String   @map("transaction_type")
  amount          Decimal  @db.Decimal(10, 2)
  status          String
  metadata        Json?
  createdAt       DateTime @default(now()) @map("created_at")

  payment Payment @relation(fields: [paymentId], references: [id], onDelete: Cascade)

  @@index([paymentId])
  @@map("payment_transactions")
}

enum PaymentStatus {
  pending
  initiated
  processing
  completed
  failed
  cancelled
}

enum PaymentType {
  initiate
  payment
}

// Admin Service Schema
model AuditLog {
  id           String   @id @default(uuid())
  userId       String?  @map("user_id")
  action       String
  resourceType String?  @map("resource_type")
  resourceId   String?  @map("resource_id")
  details      Json?
  ipAddress    String?  @map("ip_address")
  userAgent    String?  @map("user_agent")
  createdAt    DateTime @default(now()) @map("created_at")

  @@index([userId])
  @@index([createdAt])
  @@index([action])
  @@map("audit_logs")
}

model SystemConfig {
  key       String   @id
  value     Json
  description String?
  updatedAt DateTime @default(now()) @updatedAt @map("updated_at")
  updatedBy String?  @map("updated_by")

  @@map("system_config")
}

// Profile Service Schema
model UserProfile {
  id         String   @id @default(uuid())
  userId     String   @unique @map("user_id")
  avatarUrl  String?  @map("avatar_url")
  phone      String?
  address    String?
  bio        String?
  preferences Json?
  createdAt  DateTime @default(now()) @map("created_at")
  updatedAt  DateTime @updatedAt @map("updated_at")

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([userId])
  @@map("user_profiles")
}
```

---

## 6. Event Hub (Basic - Redis Pub/Sub)

### 6.1 Purpose

The event hub enables asynchronous, event-based communication between microservices, decoupling services and enabling scalability.

**POC-2 Implementation:** Redis Pub/Sub (basic)

**POC-3 Evolution:** RabbitMQ (production-ready with message persistence)

**Reference:** See `docs/backend-event-hub-implementation-plan.md` for detailed implementation plan.

### 6.2 Architecture

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
            │  Redis Pub/Sub│
            │  (Event Hub)  │
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

### 6.3 Event Types

**Auth Service Events:**

- `auth:user:registered` - User registered
- `auth:user:logged_in` - User logged in
- `auth:user:logged_out` - User logged out
- `auth:password:changed` - Password changed

**Payments Service Events:**

- `payments:payment:created` - Payment created
- `payments:payment:updated` - Payment updated
- `payments:payment:completed` - Payment completed
- `payments:payment:failed` - Payment failed

**Admin Service Events:**

- `admin:user:created` - Admin created user
- `admin:user:updated` - Admin updated user
- `admin:user:deleted` - Admin deleted user
- `admin:config:updated` - System config updated

### 6.4 Implementation

**Event Publisher:**

```typescript
// packages/shared-event-hub/src/publisher.ts
import Redis from 'ioredis';

const redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');

export class EventPublisher {
  async publish(eventType: string, data: any): Promise<void> {
    await redis.publish(
      'events',
      JSON.stringify({
        type: eventType,
        data,
        timestamp: new Date().toISOString(),
      })
    );
  }
}

export const eventPublisher = new EventPublisher();
```

**Event Subscriber:**

```typescript
// packages/shared-event-hub/src/subscriber.ts
import Redis from 'ioredis';

const redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');

export class EventSubscriber {
  private subscribers: Map<string, Set<(data: any) => void>> = new Map();

  async subscribe(
    eventType: string,
    handler: (data: any) => void
  ): Promise<void> {
    if (!this.subscribers.has(eventType)) {
      this.subscribers.set(eventType, new Set());
    }
    this.subscribers.get(eventType)!.add(handler);

    // Subscribe to Redis channel
    const subscriber = new Redis(
      process.env.REDIS_URL || 'redis://localhost:6379'
    );
    subscriber.subscribe('events');

    subscriber.on('message', (channel, message) => {
      const event = JSON.parse(message);
      if (event.type === eventType) {
        handler(event.data);
      }
    });
  }

  async unsubscribe(
    eventType: string,
    handler: (data: any) => void
  ): Promise<void> {
    this.subscribers.get(eventType)?.delete(handler);
  }
}

export const eventSubscriber = new EventSubscriber();
```

**Usage Example:**

```typescript
// Auth Service - Publish event
import { eventPublisher } from '@backend/shared-event-hub';

async function loginUser(email: string, password: string) {
  // ... login logic
  await eventPublisher.publish('auth:user:logged_in', {
    userId: user.id,
    email: user.email,
    role: user.role,
  });
}

// Payments Service - Subscribe to event
import { eventSubscriber } from '@backend/shared-event-hub';

eventSubscriber.subscribe('auth:user:logged_in', (data) => {
  // Handle user login event
  console.log('User logged in:', data);
});
```

---

## 7. API Design

### 7.1 REST API Standards

**Base URL:** `http://localhost:3000/api` (development)

**Versioning:** URL-based (`/api/v1/...`) - Future enhancement

**Authentication:** JWT Bearer token

```
Authorization: Bearer <token>
```

**Response Format:**

```typescript
// Success response
{
  "success": true,
  "data": { ... },
  "message": "Operation successful"
}

// Error response
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Error message",
    "details": { ... }
  }
}
```

**HTTP Status Codes:**

- `200` - Success
- `201` - Created
- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `429` - Too Many Requests
- `500` - Internal Server Error

### 7.2 API Endpoints Summary

| Service      | Endpoint                    | Method | Auth | Role            |
| ------------ | --------------------------- | ------ | ---- | --------------- |
| **Auth**     |
|              | `/api/auth/register`        | POST   | ❌   | -               |
|              | `/api/auth/login`           | POST   | ❌   | -               |
|              | `/api/auth/logout`          | POST   | ✅   | All             |
|              | `/api/auth/refresh`         | POST   | ✅   | All             |
|              | `/api/auth/me`              | GET    | ✅   | All             |
|              | `/api/auth/password`        | PUT    | ✅   | All             |
| **Payments** |
|              | `/api/payments`             | GET    | ✅   | All             |
|              | `/api/payments`             | POST   | ✅   | VENDOR/CUSTOMER |
|              | `/api/payments/:id`         | GET    | ✅   | All             |
|              | `/api/payments/:id`         | PUT    | ✅   | VENDOR/ADMIN    |
|              | `/api/payments/:id`         | DELETE | ✅   | VENDOR/ADMIN    |
|              | `/api/payments/reports`     | GET    | ✅   | VENDOR/ADMIN    |
| **Admin**    |
|              | `/api/admin/users`          | GET    | ✅   | ADMIN           |
|              | `/api/admin/users/:id`      | PUT    | ✅   | ADMIN           |
|              | `/api/admin/users/:id/role` | PUT    | ✅   | ADMIN           |
|              | `/api/admin/audit-logs`     | GET    | ✅   | ADMIN           |
|              | `/api/admin/analytics`      | GET    | ✅   | ADMIN           |
| **Profile**  |
|              | `/api/profile`              | GET    | ✅   | All             |
|              | `/api/profile`              | PUT    | ✅   | All             |

**Reference:** See `docs/backend-api-documentation-standards.md` for complete API documentation standards and OpenAPI specification.

---

## 8. Authentication & Authorization

### 8.1 Authentication Flow

```
1. User logs in via Auth MFE
   ↓
2. Frontend calls POST /api/auth/login
   ↓
3. Auth Service validates credentials
   ↓
4. Returns JWT access token + refresh token
   ↓
5. Frontend stores tokens in Zustand store
   ↓
6. Frontend includes token in Authorization header
   ↓
7. API Gateway validates token
   ↓
8. Request forwarded to appropriate service
```

### 8.2 JWT Token Structure

```typescript
interface JWTPayload {
  userId: string;
  email: string;
  role: 'ADMIN' | 'CUSTOMER' | 'VENDOR';
  iat: number;
  exp: number;
}
```

**Token Expiration:**

- Access Token: 15 minutes
- Refresh Token: 7 days

### 8.3 Role-Based Access Control (RBAC)

**Middleware:**

```typescript
// packages/api-gateway/src/middleware/rbac.ts
import { Request, Response, NextFunction } from 'express';

export function requireRole(...roles: UserRole[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    const userRole = req.user?.role;
    if (!userRole || !roles.includes(userRole)) {
      return res.status(403).json({
        success: false,
        error: { code: 'FORBIDDEN', message: 'Insufficient permissions' },
      });
    }
    next();
  };
}

// Usage
router.post(
  '/api/payments',
  authenticate,
  requireRole('VENDOR', 'CUSTOMER'),
  createPayment
);
```

**Role Permissions:**

- **ADMIN:** Full access to all endpoints
- **VENDOR:** Can initiate payments, view reports, manage own payments
- **CUSTOMER:** Can make payments, view own payment history

---

## 9. Security Implementation

### 9.1 Security Features

- ✅ **JWT Authentication** - Stateless authentication
- ✅ **Password Hashing** - bcrypt with salt rounds
- ✅ **Rate Limiting** - DDoS protection
- ✅ **CORS** - Configured for frontend origins only
- ✅ **Input Validation** - Zod validation on all inputs
- ✅ **SQL Injection Prevention** - Prisma ORM prevents SQL injection
- ✅ **XSS Prevention** - Input sanitization
- ✅ **Audit Logging** - All security-relevant events logged

**Reference:** See `docs/security-strategy-banking.md` for comprehensive security strategy.

### 9.2 Security Headers

```typescript
// packages/api-gateway/src/middleware/security.ts
import helmet from 'helmet';

export const securityHeaders = helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
    },
  },
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true,
  },
});
```

---

## 10. Observability (Basic)

### 10.1 Logging

**Winston Configuration:**

```typescript
// packages/shared-utils/src/logger.ts
import winston from 'winston';

export const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.Console(),
    new winston.transports.File({ filename: 'error.log', level: 'error' }),
    new winston.transports.File({ filename: 'combined.log' }),
  ],
});
```

### 10.2 Health Checks

**Health Check Endpoint:**

```typescript
// packages/api-gateway/src/routes/health.ts
router.get('/health', async (req, res) => {
  const health = {
    status: 'ok',
    timestamp: new Date().toISOString(),
    services: {
      database: await checkDatabase(),
      redis: await checkRedis(),
    },
  };
  res.json(health);
});
```

### 10.3 Basic Metrics

- Request count per endpoint
- Response time per endpoint
- Error rate
- Active users

**Reference:** See `docs/observability-analytics-phasing.md` for detailed observability strategy. Enhanced observability (Sentry, Prometheus, OpenTelemetry) will be implemented in POC-3.

---

## 11. Project Structure

### 11.1 Monorepo Structure

```
backend/
├── packages/
│   ├── api-gateway/          # API Gateway service
│   │   ├── src/
│   │   │   ├── routes/       # Route definitions
│   │   │   ├── middleware/   # Auth, rate limiting, etc.
│   │   │   └── index.ts       # Entry point
│   │   └── package.json
│   ├── auth-service/         # Auth microservice
│   │   ├── src/
│   │   │   ├── controllers/  # Request handlers
│   │   │   ├── services/     # Business logic
│   │   │   ├── routes/       # Express routes
│   │   │   ├── middleware/   # Auth middleware
│   │   │   ├── validators/   # Request validation
│   │   │   └── index.ts      # Entry point
│   │   └── package.json
│   ├── payments-service/     # Payments microservice
│   ├── admin-service/        # Admin microservice
│   ├── profile-service/      # Profile microservice
│   ├── shared-types/         # Shared TypeScript types
│   ├── shared-utils/         # Shared utilities
│   ├── shared-db/            # Shared database schema (Prisma)
│   └── shared-event-hub/     # Event hub (Redis Pub/Sub)
├── docker-compose.yml        # Local development
├── package.json              # Root workspace config
├── pnpm-lock.yaml            # pnpm lockfile
└── tsconfig.json
```

**Package Management:**

- ✅ **pnpm (v9.x)** - **Same as frontend** - Unified package management across full stack
- ✅ **pnpm workspaces** - Monorepo management for backend services (via pnpm-workspace.yaml)
- ✅ **Consistent tooling** - Same package manager for frontend and backend simplifies development
- ✅ **Shared dependencies** - Consistent versions across services

---

## 12. Implementation Plan

### Phase 1: Foundation Setup (Week 1)

**Tasks:**

1. Setup backend monorepo structure

   - Initialize pnpm workspaces (via pnpm-workspace.yaml)
   - Create package structure
   - Setup TypeScript configuration
   - Setup ESLint and Prettier

2. Setup database

   - Install PostgreSQL
   - Setup Prisma
   - Create initial schema
   - Run migrations

3. Setup API Gateway
   - Create Express app
   - Setup routing
   - Implement authentication middleware
   - Implement rate limiting
   - Setup CORS

**Deliverables:**

- ✅ Backend monorepo structure created
- ✅ Database schema defined
- ✅ API Gateway basic setup complete

---

### Phase 2: Auth Service (Week 2)

**Tasks:**

1. Implement Auth Service

   - User registration
   - User login
   - JWT token generation
   - Refresh token mechanism
   - Password hashing

2. Implement RBAC

   - Role checking middleware
   - Permission validation

3. Integration with API Gateway
   - Route authentication
   - Token validation

**Deliverables:**

- ✅ Auth Service implemented
- ✅ JWT authentication working
- ✅ RBAC implemented

---

### Phase 3: Payments Service (Week 3)

**Tasks:**

1. Implement Payments Service

   - Payment CRUD operations
   - Role-based access (VENDOR vs CUSTOMER)
   - Payment status management
   - Reports generation

2. Stubbed payment processing

   - Simulate payment processing
   - No actual PSP integration

3. Integration with API Gateway
   - Payment routes
   - Role-based route protection

**Deliverables:**

- ✅ Payments Service implemented
- ✅ Payment operations (stubbed) working
- ✅ Role-based access working

---

### Phase 4: Admin & Profile Services (Week 4)

**Tasks:**

1. Implement Admin Service

   - User management
   - Audit logging
   - System configuration
   - Analytics endpoints

2. Implement Profile Service

   - Profile CRUD
   - Preferences management

3. Integration with API Gateway
   - Admin routes (ADMIN only)
   - Profile routes

**Deliverables:**

- ✅ Admin Service implemented
- ✅ Profile Service implemented
- ✅ All services integrated with API Gateway

---

### Phase 5: Event Hub & Integration (Week 5)

**Tasks:**

1. Implement Event Hub (Redis Pub/Sub)

   - Event publisher
   - Event subscriber
   - Event types definition

2. Integrate Event Hub with services

   - Auth Service events
   - Payments Service events
   - Admin Service events

3. Frontend integration

   - API client setup
   - Authentication flow
   - Payment flow testing

4. Testing
   - Unit tests
   - Integration tests
   - E2E tests

**Deliverables:**

- ✅ Event Hub implemented
- ✅ All services publishing/subscribing to events
- ✅ Frontend integration complete
- ✅ Tests written and passing

---

### Phase 6: Observability & Documentation (Week 6)

**Tasks:**

1. Implement basic observability

   - Winston logging
   - Health checks
   - Basic metrics

2. Documentation

   - API documentation (OpenAPI)
   - Service documentation
   - Deployment guide

3. Final testing and refinement
   - Security testing
   - Performance testing
   - Documentation review

**Deliverables:**

- ✅ Basic observability implemented
- ✅ Documentation complete
- ✅ All tests passing
- ✅ POC-2 backend complete

---

## 13. Success Criteria

### 13.1 Functional Requirements

- ✅ All microservices implemented and working
- ✅ API Gateway routing all requests correctly
- ✅ JWT authentication working end-to-end
- ✅ RBAC implemented and tested
- ✅ Event Hub (Redis Pub/Sub) working
- ✅ All API endpoints documented
- ✅ Frontend integration complete

### 13.2 Non-Functional Requirements

- ✅ All services have unit tests (70% coverage)
- ✅ Integration tests for all critical flows
- ✅ API response time < 200ms (p95)
- ✅ Rate limiting working
- ✅ Security headers configured
- ✅ Audit logging implemented
- ✅ Health checks working

### 13.3 Documentation Requirements

- ✅ API documentation (OpenAPI spec)
- ✅ Service documentation
- ✅ Database schema documentation
- ✅ Deployment guide
- ✅ Testing guide

---

## 14. Key Technical Decisions

### 14.1 Express Framework

**Decision:** Use Express 4.x for REST API

**Rationale:**

- Industry standard
- Large ecosystem
- Production-ready
- Excellent TypeScript support
- Easy to learn and maintain

**Reference:** See `docs/adr/backend/poc-2/0001-use-express-framework.md` for decision rationale, alternatives considered, and trade-offs.

---

### 14.2 Prisma ORM

**Decision:** Use Prisma 5.x for database access

**Rationale:**

- Type-safe database access
- Excellent developer experience
- Automatic migrations
- Great TypeScript support
- Production-ready

**Reference:** See `docs/adr/backend/poc-2/0002-use-prisma-orm.md` for decision rationale, alternatives considered, and trade-offs.

---

### 14.3 Shared Database Strategy

**Decision:** Use shared database with service-specific schemas (POC-2)

**Rationale:**

- Simpler for POC-2/MVP
- Easier transactions across services
- Can migrate to separate databases later if needed
- Prisma supports schema separation

**Reference:** See `docs/adr/backend/poc-2/0003-shared-database-strategy.md` for decision rationale, alternatives considered, and trade-offs.

---

### 14.4 Redis Pub/Sub for Event Hub

**Decision:** Use Redis Pub/Sub for basic event hub (POC-2)

**Rationale:**

- Simple to implement
- Fast and lightweight
- Good for POC-2 validation
- Easy migration to RabbitMQ in POC-3

**Reference:** See `docs/adr/backend/poc-2/0004-redis-pubsub-event-hub.md` for decision rationale, alternatives considered, and trade-offs.

---

### 14.5 JWT Authentication

**Decision:** Use JWT with refresh tokens for authentication

**Rationale:**

- Stateless authentication
- Scalable
- Industry standard
- Works well with microservices

**Reference:** See `docs/adr/backend/poc-2/0005-jwt-authentication.md` for decision rationale, alternatives considered, and trade-offs.

---

## 15. Testing Strategy

### 15.1 Unit Testing

**Tools:** Vitest

**Coverage Target:** 70%

**What to Test:**

- Service layer logic
- Controller handlers
- Middleware functions
- Utility functions
- Validation logic

**Reference:** See `docs/backend-testing-strategy.md` for comprehensive testing strategy.

---

### 15.2 Integration Testing

**Tools:** Vitest + Supertest

**What to Test:**

- API endpoint testing
- Database integration
- Event hub integration
- Authentication flows
- Payment flows (stubbed)

---

### 15.3 E2E Testing

**Tools:** Playwright

**What to Test:**

- Full authentication flow
- Payment flow (stubbed)
- Admin operations
- Error handling

---

## 16. Dependencies

### 16.1 External Dependencies

- PostgreSQL 16.x (database)
- Redis 7.x (event hub, session storage)
- Node.js 24.11.x LTS (runtime)

### 16.2 Frontend Dependencies

- Frontend MFEs must be ready for backend integration
- API client library must be implemented
- Authentication store must support JWT tokens

---

## 17. Risks & Mitigation

### 17.1 Risks

1. **Database Performance** - Shared database may become bottleneck

   - **Mitigation:** Monitor performance, optimize queries, add indexes

2. **Event Hub Reliability** - Redis Pub/Sub has no message persistence

   - **Mitigation:** Acceptable for POC-2, migrate to RabbitMQ in POC-3

3. **Service Communication** - Direct HTTP calls may create coupling

   - **Mitigation:** Use event hub for async communication, minimize direct calls

4. **Security** - JWT tokens need proper management
   - **Mitigation:** Follow security best practices, implement token refresh

---

## 18. Out of Scope (POC-2)

- ❌ nginx reverse proxy (POC-3)
- ❌ RabbitMQ event hub (POC-3)
- ❌ GraphQL API (POC-3 optional)
- ❌ WebSocket support (POC-3)
- ❌ Advanced caching (POC-3)
- ❌ Enhanced observability (Sentry, Prometheus) (POC-3)
- ❌ Real PSP integration (MVP/Production)
- ❌ Separate databases per service (Future)

---

## 19. Related Documents

- `docs/adr/README.md` - Architecture Decision Records (ADRs) index
- `docs/backend-architecture.md` - High-level backend architecture
- `docs/backend-poc2-tech-stack.md` - Complete tech stack for POC-2
- `docs/backend-poc3-architecture.md` - POC-3 backend architecture (next phase)
- `docs/backend-poc3-tech-stack.md` - POC-3 backend tech stack (next phase)
- `docs/backend-event-hub-implementation-plan.md` - Event hub implementation plan
- `docs/backend-testing-strategy.md` - Comprehensive testing strategy
- `docs/backend-api-documentation-standards.md` - API documentation standards
- `docs/backend-development-setup.md` - Developer onboarding and setup guide
- `docs/mfe-poc2-architecture.md` - Frontend POC-2 architecture
- `docs/security-strategy-banking.md` - Comprehensive security strategy
- `docs/testing-strategy-poc-phases.md` - General testing strategy
- `docs/sast-implementation-plan.md` - SAST implementation plan

---

**Last Updated:** 2026-01-XX  
**Status:** Planning - Ready for POC-2 Implementation
