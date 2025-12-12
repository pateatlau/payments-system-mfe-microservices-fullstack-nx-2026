# Database Migration Strategy - POC-3

**Status:** Complete  
**Version:** 1.0  
**Date:** 2026-12-10  
**Purpose:** Define strategy for migrating from shared database to separate databases per service

---

## Executive Summary

This document defines the strategy for migrating from a single shared PostgreSQL database (`mfe_poc2`) to separate databases per microservice in POC-3. This is a critical architectural change that enables true service isolation, independent scaling, and production-ready microservices patterns.

---

## 1. Current State (POC-2)

### Shared Database Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    mfe_poc2 Database                         │
│                                                              │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  Auth Schema                                          │   │
│  │  - users (id, email, passwordHash, name, role, ...)  │   │
│  │  - refresh_tokens (id, userId, token, expiresAt)     │   │
│  └─────────────────────────────────────────────────────┘   │
│                           │                                  │
│                           │ Foreign Keys                     │
│                           ▼                                  │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  Payments Schema                                      │   │
│  │  - payments (senderId → users, recipientId → users)  │   │
│  │  - payment_transactions (paymentId → payments)        │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                              │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  Admin Schema                                         │   │
│  │  - audit_logs (userId → users)                       │   │
│  │  - system_config                                      │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                              │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  Profile Schema                                       │   │
│  │  - user_profiles (userId → users)                    │   │
│  └─────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

### Current Issues

1. **Tight Coupling** - Services share database, creating implicit dependencies
2. **Scaling Limitations** - Cannot scale databases independently per service
3. **Single Point of Failure** - Database failure affects all services
4. **Schema Conflicts** - All migrations affect shared database
5. **Testing Complexity** - Tests require full database setup

---

## 2. Target State (POC-3)

### Separate Database Architecture

```
┌──────────────┐   ┌──────────────┐   ┌──────────────┐   ┌──────────────┐
│   auth_db    │   │ payments_db  │   │  admin_db    │   │ profile_db   │
│  (Port 5432) │   │  (Port 5433) │   │  (Port 5434) │   │  (Port 5435) │
├──────────────┤   ├──────────────┤   ├──────────────┤   ├──────────────┤
│  - users     │   │  - payments  │   │  - audit_logs│   │  - profiles  │
│  - refresh_  │   │  - payment_  │   │  - system_   │   │              │
│    tokens    │   │    trans...  │   │    config    │   │              │
└──────────────┘   └──────────────┘   └──────────────┘   └──────────────┘
       │                   │                  │                  │
       │                   │                  │                  │
       └───────────────────┴──────────────────┴──────────────────┘
                                    │
                           ┌────────▼────────┐
                           │  RabbitMQ       │
                           │  (Event Hub)    │
                           │  - Sync data    │
                           │  - Notifications│
                           └─────────────────┘
```

### Benefits

1. **True Service Isolation** - Each service owns its data
2. **Independent Scaling** - Scale databases per service needs
3. **Fault Isolation** - Database failure only affects one service
4. **Independent Deployments** - Schema changes isolated per service
5. **Clear Ownership** - Data ownership is explicit

---

## 3. Separate Database Schemas

### 3.1 Auth Service Schema (`auth_db`)

```prisma
// apps/auth-service/prisma/schema.prisma
generator client {
  provider = "prisma-client-js"
  output   = "../node_modules/.prisma/auth-client"
}

datasource db {
  provider = "postgresql"
  url      = env("AUTH_DATABASE_URL")
}

enum UserRole {
  ADMIN
  CUSTOMER
  VENDOR
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

  @@index([email])
  @@index([role])
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
```

**Notes:**

- User is the authoritative source for user data
- Other services reference users by ID (string, no FK)
- Auth Service exposes API for user lookups

---

### 3.2 Payments Service Schema (`payments_db`)

```prisma
// apps/payments-service/prisma/schema.prisma
generator client {
  provider = "prisma-client-js"
  output   = "../node_modules/.prisma/payments-client"
}

datasource db {
  provider = "postgresql"
  url      = env("PAYMENTS_DATABASE_URL")
}

enum PaymentStatus {
  pending
  processing
  completed
  failed
  cancelled
}

enum PaymentType {
  instant
  scheduled
  recurring
}

model Payment {
  id                String        @id @default(uuid())
  senderId          String        @map("sender_id")        // Reference to User ID (no FK)
  recipientId       String?       @map("recipient_id")     // Reference to User ID (no FK)
  amount            Decimal       @db.Decimal(10, 2)
  currency          String        @default("USD")
  status            PaymentStatus
  type              PaymentType
  description       String?
  metadata          Json?
  pspTransactionId  String?       @map("psp_transaction_id")
  pspStatus         String?       @map("psp_status")
  failureReason     String?       @map("failure_reason")
  completedAt       DateTime?     @map("completed_at")
  createdAt         DateTime      @default(now()) @map("created_at")
  updatedAt         DateTime      @updatedAt @map("updated_at")

  transactions PaymentTransaction[]

  @@index([senderId])
  @@index([recipientId])
  @@index([status])
  @@index([createdAt])
  @@map("payments")
}

model PaymentTransaction {
  id               String        @id @default(uuid())
  paymentId        String        @map("payment_id")
  status           PaymentStatus
  statusMessage    String?       @map("status_message")
  pspTransactionId String?       @map("psp_transaction_id")
  metadata         Json?
  createdAt        DateTime      @default(now()) @map("created_at")

  payment Payment @relation(fields: [paymentId], references: [id], onDelete: Cascade)

  @@index([paymentId])
  @@index([createdAt])
  @@map("payment_transactions")
}
```

**Notes:**

- `senderId` and `recipientId` are strings, not foreign keys
- User validation happens at API level by calling Auth Service
- User data cached locally if needed for display

---

### 3.3 Admin Service Schema (`admin_db`)

```prisma
// apps/admin-service/prisma/schema.prisma
generator client {
  provider = "prisma-client-js"
  output   = "../node_modules/.prisma/admin-client"
}

datasource db {
  provider = "postgresql"
  url      = env("ADMIN_DATABASE_URL")
}

model AuditLog {
  id           String   @id @default(uuid())
  userId       String?  @map("user_id")         // Reference to User ID (no FK)
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
  key         String   @id
  value       Json
  description String?
  updatedAt   DateTime @default(now()) @updatedAt @map("updated_at")
  updatedBy   String?  @map("updated_by")       // Reference to User ID (no FK)

  @@map("system_config")
}
```

**Notes:**

- `userId` is string reference, no FK constraint
- User details fetched via Auth Service API when needed
- Audit logs may cache user name at creation time

---

### 3.4 Profile Service Schema (`profile_db`)

```prisma
// apps/profile-service/prisma/schema.prisma
generator client {
  provider = "prisma-client-js"
  output   = "../node_modules/.prisma/profile-client"
}

datasource db {
  provider = "postgresql"
  url      = env("PROFILE_DATABASE_URL")
}

model UserProfile {
  id          String   @id @default(uuid())
  userId      String   @unique @map("user_id")  // Reference to User ID (no FK)
  avatarUrl   String?  @map("avatar_url")
  phone       String?
  address     String?
  bio         String?
  preferences Json?
  createdAt   DateTime @default(now()) @map("created_at")
  updatedAt   DateTime @updatedAt @map("updated_at")

  @@index([userId])
  @@map("user_profiles")
}
```

**Notes:**

- `userId` is string reference, no FK constraint
- Profile created when first accessed (lazy creation)
- User existence validated via Auth Service

---

## 4. Cross-Service Data Access Patterns

### 4.1 Synchronous Access (API Calls)

For operations requiring immediate user data:

```typescript
// payments-service/src/services/payment.service.ts
async createPayment(senderId: string, recipientEmail: string) {
  // Validate sender via Auth Service
  const sender = await this.authServiceClient.getUser(senderId);
  if (!sender) {
    throw new ApiError(404, 'Sender not found');
  }

  // Find recipient by email via Auth Service
  const recipient = await this.authServiceClient.getUserByEmail(recipientEmail);
  if (!recipient) {
    throw new ApiError(404, 'Recipient not found');
  }

  // Create payment with user IDs
  return this.prisma.payment.create({
    data: {
      senderId: sender.id,
      recipientId: recipient.id,
      // ... other fields
    }
  });
}
```

### 4.2 Asynchronous Access (Events)

For operations not requiring immediate consistency:

```typescript
// auth-service publishes event on user registration
await eventPublisher.publish('user:registered', {
  userId: user.id,
  email: user.email,
  name: user.name,
  role: user.role,
});

// profile-service subscribes to create default profile
eventSubscriber.subscribe('user:registered', async event => {
  await this.profileService.createDefaultProfile(event.data.userId);
});
```

### 4.3 Caching Pattern

For frequently accessed user data:

```typescript
// payments-service with user cache
class PaymentsService {
  private userCache: Map<string, { user: User; expiry: number }> = new Map();

  async getUserName(userId: string): Promise<string> {
    const cached = this.userCache.get(userId);
    if (cached && cached.expiry > Date.now()) {
      return cached.user.name;
    }

    const user = await this.authServiceClient.getUser(userId);
    this.userCache.set(userId, {
      user,
      expiry: Date.now() + 5 * 60 * 1000, // 5 minutes
    });
    return user.name;
  }
}
```

---

## 5. Data Migration Approach

### 5.1 Migration Steps

```
Phase 1: Preparation
├── Create separate databases (auth_db, payments_db, admin_db, profile_db)
├── Create Prisma schemas for each service
├── Generate Prisma clients
└── Test schema migrations (empty databases)

Phase 2: Data Export
├── Export users and refresh_tokens from shared DB
├── Export payments and transactions from shared DB
├── Export audit_logs and system_config from shared DB
├── Export user_profiles from shared DB
└── Validate exported data

Phase 3: Data Import
├── Import users and refresh_tokens to auth_db
├── Import payments and transactions to payments_db
├── Import audit_logs and system_config to admin_db
├── Import user_profiles to profile_db
└── Validate imported data

Phase 4: Verification
├── Verify row counts match
├── Verify data integrity
├── Test service connections
└── Run integration tests

Phase 5: Cutover
├── Update service configurations
├── Deploy updated services
├── Verify all operations work
└── Keep shared DB as backup (read-only)
```

### 5.2 Migration Scripts

**Export Script Example:**

```typescript
// scripts/export-auth-data.ts
import { PrismaClient } from '@prisma/client';
import { writeFileSync } from 'fs';

const prisma = new PrismaClient({
  datasources: { db: { url: process.env.DATABASE_URL } },
});

async function exportAuthData() {
  const users = await prisma.user.findMany({
    include: { refreshTokens: true },
  });

  writeFileSync(
    'migration-data/auth-data.json',
    JSON.stringify({ users }, null, 2)
  );

  console.log(`Exported ${users.length} users`);
}

exportAuthData();
```

**Import Script Example:**

```typescript
// scripts/import-auth-data.ts
import { PrismaClient } from '@prisma/auth-client';
import { readFileSync } from 'fs';

const prisma = new PrismaClient({
  datasources: { db: { url: process.env.AUTH_DATABASE_URL } },
});

async function importAuthData() {
  const data = JSON.parse(
    readFileSync('migration-data/auth-data.json', 'utf-8')
  );

  for (const user of data.users) {
    await prisma.user.create({
      data: {
        id: user.id,
        email: user.email,
        passwordHash: user.passwordHash,
        name: user.name,
        role: user.role,
        emailVerified: user.emailVerified,
        createdAt: new Date(user.createdAt),
        updatedAt: new Date(user.updatedAt),
        refreshTokens: {
          create: user.refreshTokens.map(token => ({
            id: token.id,
            token: token.token,
            expiresAt: new Date(token.expiresAt),
            createdAt: new Date(token.createdAt),
          })),
        },
      },
    });
  }

  console.log(`Imported ${data.users.length} users`);
}

importAuthData();
```

---

## 6. Rollback Strategy

### 6.1 Rollback Triggers

- Data corruption detected
- Services unable to connect to new databases
- Unacceptable performance degradation
- Critical bugs discovered

### 6.2 Rollback Procedure

```
1. Stop all services
2. Revert service configurations to shared database
3. Deploy services with original configuration
4. Verify services connect to shared database
5. Test critical operations
6. Investigate root cause
```

### 6.3 Safeguards

1. **Keep Shared Database** - Don't delete until fully validated
2. **Database Backups** - Take backups before migration
3. **Feature Flags** - Use flags to switch between configurations
4. **Monitoring** - Watch for errors during and after migration

---

## 7. Service Configuration Updates

### 7.1 Auth Service

```typescript
// apps/auth-service/src/config/index.ts
export const config = {
  database: {
    url:
      process.env.AUTH_DATABASE_URL ||
      'postgresql://postgres:postgres@localhost:5432/auth_db',
  },
  // ... other config
};
```

### 7.2 Payments Service

```typescript
// apps/payments-service/src/config/index.ts
export const config = {
  database: {
    url:
      process.env.PAYMENTS_DATABASE_URL ||
      'postgresql://postgres:postgres@localhost:5433/payments_db',
  },
  authService: {
    url: process.env.AUTH_SERVICE_URL || 'http://localhost:3001',
  },
  // ... other config
};
```

### 7.3 Admin Service

```typescript
// apps/admin-service/src/config/index.ts
export const config = {
  database: {
    url:
      process.env.ADMIN_DATABASE_URL ||
      'postgresql://postgres:postgres@localhost:5434/admin_db',
  },
  authService: {
    url: process.env.AUTH_SERVICE_URL || 'http://localhost:3001',
  },
  // ... other config
};
```

### 7.4 Profile Service

```typescript
// apps/profile-service/src/config/index.ts
export const config = {
  database: {
    url:
      process.env.PROFILE_DATABASE_URL ||
      'postgresql://postgres:postgres@localhost:5435/profile_db',
  },
  authService: {
    url: process.env.AUTH_SERVICE_URL || 'http://localhost:3001',
  },
  // ... other config
};
```

---

## 8. Testing Strategy

### 8.1 Unit Tests

- Test each service with its own database
- Mock cross-service API calls
- Test data access patterns

### 8.2 Integration Tests

- Test cross-service communication
- Test event publishing/subscribing
- Test data consistency

### 8.3 Migration Tests

- Test export scripts with sample data
- Test import scripts with sample data
- Verify data integrity after migration

---

## 9. Verification Checklist

- [x] Auth Service schema designed
- [x] Payments Service schema designed
- [x] Admin Service schema designed
- [x] Profile Service schema designed
- [x] Cross-service patterns defined
- [x] Migration approach documented
- [x] Rollback strategy documented

---

**Last Updated:** 2026-12-10  
**Status:** Complete  
**Next Steps:** Use this strategy in Phase 2 (Infrastructure Setup) and Phase 3 (Database Migration)
