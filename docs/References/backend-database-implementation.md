# Backend Database Implementation Guide

**Status:** Authoritative  
**Version:** 1.0  
**Date:** 2026-01-XX  
**Context:** Comprehensive guide for database implementation using PostgreSQL and Prisma

---

## Executive Summary

This document provides a comprehensive guide for implementing the database layer using PostgreSQL and Prisma ORM. It covers schema design patterns, migration strategies, seed data setup, query optimization, indexing, transaction management, and best practices.

**Target Audience:**

- Backend developers implementing database layer
- Database administrators
- DevOps engineers setting up database infrastructure

---

## 1. Prisma Setup

### 1.1 Prisma Schema Structure

**Location:** `packages/shared-db/prisma/schema.prisma`

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

enum UserRole {
  ADMIN
  CUSTOMER
  VENDOR
}

// ... (other models)
```

### 1.2 Prisma Client Generation

```bash
# Navigate to shared database package
cd packages/shared-db

# Generate Prisma Client
pnpm prisma generate

# This creates:
# - node_modules/.prisma/client/ (Prisma Client)
# - TypeScript types for all models
```

### 1.3 Prisma Client Usage

```typescript
// packages/shared-db/src/index.ts
import { PrismaClient } from '@prisma/client';

export const prisma = new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
});

// Export types
export * from '@prisma/client';
```

---

## 2. Database Schema Design

### 2.1 Schema Organization

**POC-2 Approach:** Shared database with service-specific schemas

**Rationale for POC-2:**

- Simpler for initial implementation
- Easier transactions across services
- Prisma supports schema separation via `@@map` and comments
- Good for architecture validation

**POC-3 Approach:** Separate databases per service (one database per microservice)

**Rationale for POC-3:**

- True service isolation
- Independent scaling per service
- Service-specific optimizations
- Reduced coupling
- Better fault isolation
- Production-ready microservices pattern

**Database Assignment (POC-3):**

- **Auth Service** → `auth_db` (PostgreSQL)
- **Payments Service** → `payments_db` (PostgreSQL)
- **Admin Service** → `admin_db` (PostgreSQL)
- **Profile Service** → `profile_db` (PostgreSQL)

**Reference:** See `docs/adr/backend/poc-2/0003-shared-database-strategy.md` for POC-2 decision and `docs/adr/backend/poc-3/0004-separate-databases-per-service.md` for POC-3 decision.

### 2.2 Naming Conventions

**Tables:** Plural, snake_case
- `users`, `payments`, `refresh_tokens`

**Columns:** snake_case
- `user_id`, `created_at`, `email_verified`

**Models:** Singular, PascalCase
- `User`, `Payment`, `RefreshToken`

**Enums:** PascalCase
- `UserRole`, `PaymentStatus`

### 2.3 Complete Schema

```prisma
// packages/shared-db/prisma/schema.prisma

// ============================================
// Auth Service Schema
// ============================================

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
  sessions      Session[]
  devices       Device[]

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

enum UserRole {
  ADMIN
  CUSTOMER
  VENDOR
}

// ============================================
// Payments Service Schema
// ============================================

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

// ============================================
// Admin Service Schema
// ============================================

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

// ============================================
// Profile Service Schema
// ============================================

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

// ============================================
// Session Management Schema (POC-3)
// ============================================

model Device {
  id          String   @id @default(uuid())
  userId      String   @map("user_id")
  deviceId    String   @unique @map("device_id")
  deviceName String?  @map("device_name")
  deviceType String?  @map("device_type")
  lastActiveAt DateTime @default(now()) @map("last_active_at")
  createdAt   DateTime @default(now()) @map("created_at")

  user     User      @relation(fields: [userId], references: [id], onDelete: Cascade)
  sessions Session[]

  @@index([userId])
  @@index([deviceId])
  @@map("devices")
}

model Session {
  id            String   @id @default(uuid())
  userId        String   @map("user_id")
  deviceId      String   @map("device_id")
  refreshTokenId String? @map("refresh_token_id")
  ipAddress     String?  @map("ip_address")
  userAgent     String?  @map("user_agent")
  createdAt     DateTime @default(now()) @map("created_at")
  expiresAt     DateTime @map("expires_at")

  user   User   @relation(fields: [userId], references: [id], onDelete: Cascade)
  device Device @relation(fields: [deviceId], references: [id], onDelete: Cascade)

  @@index([userId])
  @@index([deviceId])
  @@index([expiresAt])
  @@map("sessions")
}
```

---

## 3. Migration Strategy

### 3.1 Creating Migrations

```bash
# Navigate to shared database package
cd packages/shared-db

# Create a new migration
pnpm prisma migrate dev --name add_payment_table

# This will:
# 1. Create migration file in prisma/migrations/
# 2. Apply migration to database
# 3. Regenerate Prisma Client
```

### 3.2 Migration Files

**Location:** `packages/shared-db/prisma/migrations/`

**Structure:**

```
prisma/migrations/
├── 20260101000000_init/
│   └── migration.sql
├── 20260102000000_add_payments/
│   └── migration.sql
└── 20260103000000_add_sessions/
    └── migration.sql
```

### 3.3 Applying Migrations

**Development:**

```bash
# Apply all pending migrations
pnpm prisma migrate dev

# This applies migrations and regenerates Prisma Client
```

**Production:**

```bash
# Apply migrations without prompts
pnpm prisma migrate deploy

# This only applies migrations (doesn't regenerate)
```

### 3.4 Migration Best Practices

- ✅ **One migration per feature** - Keep migrations focused
- ✅ **Test migrations** - Test both up and down migrations
- ✅ **Backup before migration** - Always backup production database
- ✅ **Review SQL** - Review generated SQL before applying
- ✅ **Rollback plan** - Have rollback plan for production migrations

---

## 4. Seed Data

### 4.1 Seed Script

**Location:** `packages/shared-db/prisma/seed.ts`

```typescript
// packages/shared-db/prisma/seed.ts
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // Create test users
  const adminPassword = await bcrypt.hash('admin123', 10);
  const customerPassword = await bcrypt.hash('customer123', 10);
  const vendorPassword = await bcrypt.hash('vendor123', 10);

  const admin = await prisma.user.create({
    data: {
      email: 'admin@test.com',
      passwordHash: adminPassword,
      name: 'Admin User',
      role: 'ADMIN',
      emailVerified: true,
    },
  });

  const customer = await prisma.user.create({
    data: {
      email: 'customer@test.com',
      passwordHash: customerPassword,
      name: 'Customer User',
      role: 'CUSTOMER',
      emailVerified: true,
    },
  });

  const vendor = await prisma.user.create({
    data: {
      email: 'vendor@test.com',
      passwordHash: vendorPassword,
      name: 'Vendor User',
      role: 'VENDOR',
      emailVerified: true,
    },
  });

  console.log('✅ Seeded users:', { admin, customer, vendor });
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
```

### 4.2 Running Seed

```bash
# Navigate to shared database package
cd packages/shared-db

# Run seed
pnpm prisma db seed

# Or directly
ts-node prisma/seed.ts
```

### 4.3 Seed Configuration

**Add to `package.json`:**

```json
{
  "prisma": {
    "seed": "ts-node prisma/seed.ts"
  }
}
```

---

## 5. Query Optimization

### 5.1 Indexing Strategy

**Primary Indexes (Automatic):**
- Primary keys are automatically indexed
- Unique constraints are automatically indexed

**Secondary Indexes:**

```prisma
model Payment {
  // ... fields

  @@index([userId])           // For filtering by user
  @@index([status])            // For filtering by status
  @@index([createdAt])         // For sorting by date
  @@index([userId, status])    // Composite index for common queries
}
```

**Index Guidelines:**

- ✅ Index foreign keys
- ✅ Index frequently filtered columns
- ✅ Index columns used in WHERE clauses
- ✅ Index columns used in ORDER BY
- ⚠️ Don't over-index (slows down writes)
- ⚠️ Monitor index usage

### 5.2 Query Patterns

**Eager Loading (Include):**

```typescript
// Good: Eager load related data
const user = await prisma.user.findUnique({
  where: { id: userId },
  include: {
    profile: true,
    payments: {
      take: 10,
      orderBy: { createdAt: 'desc' },
    },
  },
});
```

**Select Specific Fields:**

```typescript
// Good: Select only needed fields
const user = await prisma.user.findUnique({
  where: { id: userId },
  select: {
    id: true,
    email: true,
    name: true,
    role: true,
    // Don't select passwordHash
  },
});
```

**Pagination:**

```typescript
// Good: Use cursor-based pagination
const payments = await prisma.payment.findMany({
  where: { userId },
  take: 20,
  skip: (page - 1) * 20,
  orderBy: { createdAt: 'desc' },
});

// Better: Cursor-based pagination
const payments = await prisma.payment.findMany({
  where: { userId },
  take: 20,
  cursor: { id: cursor },
  orderBy: { createdAt: 'desc' },
});
```

### 5.3 Connection Pooling

```typescript
// packages/shared-db/src/index.ts
import { PrismaClient } from '@prisma/client';

export const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL,
    },
  },
  log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
});

// Connection pooling is handled by Prisma automatically
// Default pool size: num_physical_cpus * 2 + 1
```

**PostgreSQL Connection Pooling:**

```bash
# In DATABASE_URL, add connection pool parameters
DATABASE_URL=postgresql://user:password@localhost:5432/db?connection_limit=10&pool_timeout=20
```

---

## 6. Transaction Management

### 6.1 Prisma Transactions

**Simple Transaction:**

```typescript
// Create user and profile in transaction
const result = await prisma.$transaction(async (tx) => {
  const user = await tx.user.create({
    data: {
      email: 'user@example.com',
      passwordHash: hash,
      name: 'User Name',
      role: 'CUSTOMER',
    },
  });

  const profile = await tx.userProfile.create({
    data: {
      userId: user.id,
      preferences: {},
    },
  });

  return { user, profile };
});
```

**Batch Operations:**

```typescript
// Batch create
await prisma.user.createMany({
  data: [
    { email: 'user1@example.com', ... },
    { email: 'user2@example.com', ... },
  ],
  skipDuplicates: true,
});
```

### 6.2 Transaction Best Practices

- ✅ **Keep transactions short** - Long transactions lock resources
- ✅ **Handle errors** - Always handle transaction errors
- ✅ **Rollback on error** - Prisma automatically rolls back on error
- ⚠️ **Avoid nested transactions** - Use single transaction for related operations

---

## 7. Database Views (Advanced)

### 7.1 Creating Views

```sql
-- Create view for payment reports
CREATE VIEW payment_reports AS
SELECT
  u.id as user_id,
  u.email,
  u.role,
  COUNT(p.id) as total_payments,
  SUM(p.amount) as total_amount,
  AVG(p.amount) as avg_amount
FROM users u
LEFT JOIN payments p ON u.id = p.user_id
GROUP BY u.id, u.email, u.role;
```

### 7.2 Using Views in Prisma

```prisma
// Note: Prisma doesn't directly support views
// Use raw SQL queries for views

const reports = await prisma.$queryRaw`
  SELECT * FROM payment_reports
  WHERE role = ${role}
`;
```

---

## 8. Backup and Recovery

### 8.1 Database Backup

**Manual Backup:**

```bash
# Backup database
pg_dump -U postgres -d universal_mfe_dev > backup.sql

# Backup with compression
pg_dump -U postgres -d universal_mfe_dev | gzip > backup.sql.gz
```

**Automated Backup:**

```bash
# Create backup script
#!/bin/bash
BACKUP_DIR="/backups"
DATE=$(date +%Y%m%d_%H%M%S)
pg_dump -U postgres universal_mfe_dev | gzip > "$BACKUP_DIR/backup_$DATE.sql.gz"

# Add to cron
# 0 2 * * * /path/to/backup.sh
```

### 8.2 Database Recovery

```bash
# Restore from backup
psql -U postgres -d universal_mfe_dev < backup.sql

# Restore from compressed backup
gunzip < backup.sql.gz | psql -U postgres -d universal_mfe_dev
```

---

## 9. Performance Monitoring

### 9.1 Query Performance

**Enable Query Logging:**

```typescript
const prisma = new PrismaClient({
  log: [
    { emit: 'event', level: 'query' },
    { emit: 'stdout', level: 'error' },
  ],
});

prisma.$on('query', (e) => {
  console.log('Query: ' + e.query);
  console.log('Duration: ' + e.duration + 'ms');
});
```

**Slow Query Detection:**

```typescript
prisma.$on('query', (e) => {
  if (e.duration > 1000) {
    console.warn('Slow query detected:', {
      query: e.query,
      duration: e.duration,
      params: e.params,
    });
  }
});
```

### 9.2 Database Monitoring

**PostgreSQL Statistics:**

```sql
-- Check table sizes
SELECT
  schemaname,
  tablename,
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;

-- Check index usage
SELECT
  schemaname,
  tablename,
  indexname,
  idx_scan,
  idx_tup_read,
  idx_tup_fetch
FROM pg_stat_user_indexes
ORDER BY idx_scan DESC;
```

---

## 10. Best Practices

### 10.1 Schema Design

- ✅ **Use UUIDs for primary keys** - Better for distributed systems
- ✅ **Use timestamps** - Always include `created_at` and `updated_at`
- ✅ **Use enums for fixed values** - Type safety
- ✅ **Use JSONB for flexible data** - For metadata, preferences
- ✅ **Add indexes strategically** - Don't over-index
- ✅ **Use foreign keys** - Maintain referential integrity
- ✅ **Use cascade deletes carefully** - Understand implications

### 10.2 Query Patterns

- ✅ **Use transactions for related operations** - Ensure consistency
- ✅ **Select only needed fields** - Reduce data transfer
- ✅ **Use pagination** - Don't fetch all records
- ✅ **Use eager loading** - Avoid N+1 queries
- ✅ **Monitor query performance** - Identify slow queries
- ⚠️ **Avoid raw SQL when possible** - Use Prisma for type safety

### 10.3 Migration Practices

- ✅ **Test migrations** - Test on development database first
- ✅ **Backup before migration** - Always backup production
- ✅ **Review generated SQL** - Understand what will happen
- ✅ **One migration per feature** - Keep migrations focused
- ✅ **Have rollback plan** - Plan for migration failures

---

## 11. Common Patterns

### 11.1 Soft Deletes

```prisma
model User {
  id        String   @id @default(uuid())
  email     String   @unique
  deletedAt DateTime? @map("deleted_at")  // Soft delete

  @@index([deletedAt])
  @@map("users")
}
```

**Usage:**

```typescript
// Soft delete
await prisma.user.update({
  where: { id: userId },
  data: { deletedAt: new Date() },
});

// Query (exclude soft-deleted)
const users = await prisma.user.findMany({
  where: { deletedAt: null },
});
```

### 11.2 Audit Trail

```prisma
model AuditLog {
  id           String   @id @default(uuid())
  userId       String?  @map("user_id")
  action       String
  resourceType String?  @map("resource_type")
  resourceId   String?  @map("resource_id")
  details      Json?
  createdAt    DateTime @default(now()) @map("created_at")
}
```

**Usage:**

```typescript
// Log action
await prisma.auditLog.create({
  data: {
    userId: user.id,
    action: 'payment.created',
    resourceType: 'payment',
    resourceId: payment.id,
    details: { amount: payment.amount },
  },
});
```

---

## 12. Troubleshooting

### 12.1 Common Issues

**Issue:** Prisma Client not found

**Solution:**

```bash
cd packages/shared-db
pnpm prisma generate
```

**Issue:** Migration conflicts

**Solution:**

```bash
# Reset database (WARNING: Deletes all data)
pnpm prisma migrate reset

# Or resolve conflicts manually
# Edit migration files in prisma/migrations/
```

**Issue:** Connection timeout

**Solution:**

```bash
# Increase connection timeout in DATABASE_URL
DATABASE_URL=postgresql://...?connect_timeout=60
```

---

## 13. Related Documents

- `docs/backend-architecture.md` - High-level backend architecture
- `docs/backend-poc2-architecture.md` - POC-2 architecture (includes database schema)
- `docs/backend-poc3-architecture.md` - POC-3 architecture (includes database enhancements)
- `docs/backend-poc2-tech-stack.md` - Tech stack (includes Prisma details)
- `docs/backend-development-setup.md` - Development setup (includes database setup)

---

**Last Updated:** 2026-01-XX  
**Status:** Authoritative - Ready for Implementation

