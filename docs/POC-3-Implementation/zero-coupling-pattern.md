# Zero Coupling Pattern - Denormalization with Event Synchronization

**Status:** Complete  
**Date:** 2026-12-10  
**Purpose:** Document the zero-coupling architecture pattern used in POC-3

---

## Problem Statement

In a microservices architecture with separate databases per service, services need access to data owned by other services. The naive approach of calling other services' APIs creates **coupling**, which defeats the purpose of service isolation.

**Example Problem:**

- Admin Service needs to list/manage users (owned by Auth Service)
- Payments Service needs to validate recipients (users owned by Auth Service)
- Direct API calls: `GET /api/auth/users` → **COUPLING** ❌ **STRICTLY FORBIDDEN**

## Core Principle: ZERO COUPLING

**STRICT SERVICE BOUNDARIES:**

- Services NEVER call other services' APIs directly
- Services NEVER share databases
- Services ONLY communicate via RabbitMQ events
- Each service maintains its own data (denormalized if needed)
- Eventual consistency is acceptable for most operations

---

## Solution: Denormalization with Event Synchronization

### Pattern Overview

Each service maintains a **denormalized copy** of data it needs from other services, synchronized via **RabbitMQ events**. This enables:

- ✅ **Zero Coupling**: No direct API calls between services
- ✅ **Fast Queries**: Local database access
- ✅ **Fault Tolerance**: Services work even if other services are down
- ✅ **Eventual Consistency**: Data syncs via events (acceptable trade-off)

### Architecture

```
┌──────────────┐                    ┌──────────────┐
│ Auth Service │                    │ Admin Service│
│  (auth_db)   │                    │  (admin_db)  │
│              │                    │              │
│  - users     │                    │  - users     │ ← Denormalized copy
│  - tokens    │                    │  - audit_logs│
└──────┬───────┘                    └──────┬───────┘
       │                                    │
       │  Publishes Events                  │  Subscribes to Events
       │  - auth.user.created               │  - auth.user.created
       │  - auth.user.updated               │  - auth.user.updated
       │  - auth.user.deleted               │  - auth.user.deleted
       │                                    │
       └──────────────┬─────────────────────┘
                      │
              ┌───────▼────────┐
              │   RabbitMQ     │
              │  Event Hub     │
              └────────────────┘
```

---

## Service Boundaries - Strict Rules

### Rule 1: No Direct API Calls Between Services

- Services communicate ONLY via RabbitMQ events
- Exception: NONE (strictly enforced)

### Rule 2: Each Service Owns Its Data

- Each service has its own database
- Denormalized copies are maintained via events
- No shared databases, no foreign keys across databases

### Rule 3: Eventual Consistency is Acceptable

- Services sync via events (typically within seconds)
- Strong consistency not required for most operations
- Trade-off for service independence

### Rule 4: Event-Driven Communication Only

- Publish events when data changes
- Subscribe to events from other services
- Update local denormalized copies

---

## Implementation Details

### 1. Admin Service - User Management

**Requirement:** Admin Service needs to list, view, update, and manage users.

**Solution:** Admin Service maintains a denormalized `User` table in `admin_db`.

**Schema:**

```prisma
// apps/admin-service/prisma/schema.prisma
model User {
  id            String    @id
  email         String    @unique
  name          String
  role          UserRole
  emailVerified Boolean   @default(false)
  createdAt     DateTime
  updatedAt     DateTime
  // Note: passwordHash NOT stored (security - only in auth_db)
  // This is a read-only copy for admin operations
}
```

**Event Synchronization (Phase 4):**

- Auth Service publishes: `auth.user.created`, `auth.user.updated`, `auth.user.deleted`
- Admin Service subscribes and updates local `User` table
- Admin operations query local `User` table (no API calls)

**Benefits:**

- Admin Service can manage users without calling Auth Service API
- Fast queries (local database)
- Works even if Auth Service is down
- Eventual consistency (acceptable for admin operations)

### 2. Payments Service - Recipient Validation

**Requirement:** Payments Service needs to validate that recipients exist.

**Solution:** Payments Service maintains a minimal denormalized `User` table in `payments_db`.

**Schema:**

```prisma
// apps/payments-service/prisma/schema.prisma
model User {
  id    String  @id
  email String  @unique
  // Only minimal fields needed for validation
  // Full user data is in auth_db
}
```

**Event Synchronization (Phase 4):**

- Auth Service publishes: `auth.user.created`, `auth.user.updated`, `auth.user.deleted`
- Payments Service subscribes and updates local `User` table
- Payment creation validates recipients against local `User` table

**Benefits:**

- Recipient validation without calling Auth Service API
- Fast validation (local database)
- Works even if Auth Service is down
- Eventual consistency (new users sync within seconds)

---

## Event Flow (Phase 4 - RabbitMQ Integration)

### User Creation Flow

```
1. User registers via Auth Service
   POST /api/auth/register
   ↓
2. Auth Service creates user in auth_db
   ↓
3. Auth Service publishes event
   RabbitMQ: auth.user.created
   {
     userId: "123",
     email: "user@example.com",
     name: "User Name",
     role: "CUSTOMER",
     ...
   }
   ↓
4. Admin Service subscribes
   - Receives auth.user.created event
   - Creates user in admin_db (denormalized copy)
   ↓
5. Payments Service subscribes
   - Receives auth.user.created event
   - Creates user in payments_db (minimal copy)
   ↓
6. Both services now have user data locally
   - No API calls needed
   - Zero coupling maintained
```

### User Update Flow

```
1. Admin updates user via Admin Service
   PUT /api/admin/users/:id
   ↓
2. Admin Service updates user in admin_db
   ↓
3. Admin Service publishes event
   RabbitMQ: admin.user.updated
   {
     userId: "123",
     email: "newemail@example.com",
     ...
   }
   ↓
4. Auth Service subscribes
   - Receives admin.user.updated event
   - Updates user in auth_db (source of truth)
   ↓
5. Payments Service subscribes
   - Receives admin.user.updated event
   - Updates user in payments_db
   ↓
6. All services synchronized via events
   - No direct API calls
   - Zero coupling maintained
```

---

## Data Ownership

### Source of Truth

- **Auth Service (`auth_db`)**: Source of truth for user data
  - Full user records
  - Password hashes
  - Authentication tokens

- **Admin Service (`admin_db`)**: Denormalized copy for admin operations
  - Read-only copy (for queries)
  - No password hashes (security)
  - Can trigger updates via events

- **Payments Service (`payments_db`)**: Minimal copy for validation
  - Only id and email (for recipient validation)
  - No sensitive data

### Update Patterns

**Option 1: Admin Service Updates via Events**

- Admin Service updates local copy
- Publishes `admin.user.updated` event
- Auth Service subscribes and updates source of truth
- Other services subscribe and update their copies

**Option 2: Admin Service Calls Auth Service API** ❌ **NOT RECOMMENDED**

- Direct API calls create coupling
- Violates service boundary principles
- NOT used in this implementation

**STRICT RULE:** Use Option 1 (event-driven) exclusively. ALL operations (read and write) must maintain zero coupling. No direct API calls between services.

---

## Trade-offs

### Advantages

1. **Zero Coupling**: No direct API calls between services
2. **Performance**: Fast local database queries
3. **Fault Tolerance**: Services work independently
4. **Scalability**: Each service scales independently
5. **Clear Ownership**: Each service owns its data

### Disadvantages

1. **Data Duplication**: Same data stored in multiple databases
2. **Eventual Consistency**: Data may be slightly out of sync
3. **Storage Cost**: More storage needed (usually acceptable)
4. **Complexity**: Event synchronization logic needed

### When to Use

✅ **Use this pattern when:**

- Services need to query data owned by other services frequently
- Performance is critical (local queries are faster)
- Fault tolerance is important
- Eventual consistency is acceptable

❌ **Don't use this pattern when:**

- Data changes very frequently (too many events)
- Strong consistency is required (use API calls or transactions)
- Data is very large (storage cost too high)

---

## Implementation Status

### Phase 3 (Current)

- ✅ Schemas updated with denormalized User tables
- ✅ Code updated to use local User tables
- ✅ Zero coupling pattern documented
- ⏳ Event synchronization (Phase 4)

### Phase 4 (Planned)

- ⏳ RabbitMQ event publishers in Auth Service
- ⏳ RabbitMQ event subscribers in Admin/Payments Services
- ⏳ Event handlers to sync User tables
- ⏳ Error handling and retry logic
- ⏳ Event ordering and idempotency

---

## Related Documentation

- [`database-migration-strategy.md`](./database-migration-strategy.md) - Database separation strategy
- [`event-hub-migration-strategy.md`](./event-hub-migration-strategy.md) - RabbitMQ event hub strategy
- [`implementation-plan.md`](./implementation-plan.md) - Implementation plan

---

**Last Updated:** 2026-12-10
