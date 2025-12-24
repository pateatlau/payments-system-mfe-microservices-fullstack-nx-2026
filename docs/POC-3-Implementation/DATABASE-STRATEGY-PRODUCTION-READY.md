# Database Strategy & Production Readiness - POC-3

**Date:** December 24, 2025  
**Status:** Planning & Assessment  
**Purpose:** Comprehensive database strategy for production deployment

---

## Executive Summary

### Current State

✅ **4 PostgreSQL databases** - One per service (auth_db, payments_db, admin_db, profile_db)  
✅ **Prisma ORM** - Type-safe database access with migrations  
✅ **Schemas defined** - All services have Prisma schemas  
🟡 **Migrations pending** - Haven't been run in production scenario  
🟡 **Backup strategy needed** - No backup automation configured  
🟡 **Performance tuning pending** - Connection pooling, indexes, query optimization  
🟡 **Disaster recovery pending** - No failover, recovery procedures

### What Needs to Happen

**For Minimal Production Readiness:**

1. Database migration strategy (automated, rollback-able)
2. Backup & restore automation (daily backups, tested recovery)
3. Connection pooling configuration (prevent connection exhaustion)
4. Basic monitoring (query logs, slow query detection)
5. Disaster recovery plan (point-in-time recovery, failover)

**Timeline:** 2-3 weeks (parallel with security hardening + CI/CD setup)

---

## Table of Contents

1. [Current Database Architecture](#1-current-database-architecture)
2. [Database Setup & Configuration](#2-database-setup--configuration)
3. [Prisma Migrations](#3-prisma-migrations)
4. [Connection Pooling](#4-connection-pooling)
5. [Backup Strategy](#5-backup-strategy)
6. [Disaster Recovery](#6-disaster-recovery)
7. [Performance Optimization](#7-performance-optimization)
8. [Security Hardening](#8-security-hardening)
9. [Monitoring & Maintenance](#9-monitoring--maintenance)
10. [Production Deployment](#10-production-deployment)
11. [Implementation Phases](#11-implementation-phases)
12. [Integration with 8-Week Roadmap](#12-integration-with-8-week-roadmap)

---

## 1. Current Database Architecture

### Setup: 4 Independent PostgreSQL Databases

```
┌─────────────────────────────────────────────────────────────┐
│                   PostgreSQL (port 5432)                    │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌───────────────┐  ┌───────────────┐  ┌───────────────┐   │
│  │   auth_db     │  │ payments_db   │  │  admin_db     │   │
│  │               │  │               │  │               │   │
│  │ Users         │  │ Payments      │  │ AdminUsers    │   │
│  │ RefreshTokens │  │ Transactions  │  │ Roles         │   │
│  │ Devices       │  │ PaymentMethods│  │ Permissions   │   │
│  │               │  │ Refunds       │  │ Audit Logs    │   │
│  └───────────────┘  └───────────────┘  └───────────────┘   │
│                                                             │
│  ┌───────────────┐                                          │
│  │ profile_db    │                                          │
│  │               │                                          │
│  │ Profiles      │                                          │
│  │ Preferences   │                                          │
│  │ Addresses     │                                          │
│  └───────────────┘                                          │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### Why Four Databases?

✅ **Data Isolation** - Each service owns its data, no shared database  
✅ **Independent Scaling** - Scale auth separately from payments  
✅ **Microservices Pattern** - Loose coupling, no cross-service foreign keys  
✅ **Disaster Scope** - If one DB fails, only that service affected

### Trade-offs

❌ **Operational Complexity** - 4 backups, 4 migrations, 4 configurations  
❌ **Cross-Service Queries** - Can't join data across services (by design)  
❌ **Consistency** - Must rely on events, not transactions  
❌ **Testing** - Need to seed 4 databases for integration tests

---

## 2. Database Setup & Configuration

### Current Prisma Schemas

**Auth Service** (`apps/auth-service/prisma/schema.prisma`):

```prisma
model User {
  id            String    @id @default(uuid())
  email         String    @unique
  passwordHash  String
  name          String
  role          UserRole
  emailVerified Boolean   @default(false)
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt

  refreshTokens RefreshToken[]
  devices       Device[]
}

model RefreshToken {
  id        String   @id @default(uuid())
  userId    String
  token     String   @unique
  expiresAt DateTime
  createdAt DateTime @default(now())
}
```

**Payments Service** (`apps/payments-service/prisma/schema.prisma`):

```prisma
model Payment {
  id               String   @id @default(uuid())
  userId           String   // Foreign key reference (no FK constraint - ref only)
  amount           Decimal  @db.Decimal(10, 2)
  currency         String
  status           PaymentStatus
  paymentMethodId  String
  transactionId    String
  createdAt        DateTime @default(now())
  updatedAt        DateTime @updatedAt
}
```

**Profile Service & Admin Service** - Similar patterns

### Environment Configuration

**Docker Compose** (`docker-compose.yml`):

```yaml
services:
  postgres:
    image: postgres:16-alpine
    environment:
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgres
    ports:
      - '5432:5432'
    volumes:
      - postgres_data:/var/lib/postgresql/data
    healthcheck:
      test: ['CMD-SHELL', 'pg_isready -U postgres']
      interval: 10s
      timeout: 5s
      retries: 5
```

**Environment Variables** (`.env` example):

```env
AUTH_DATABASE_URL=postgresql://postgres:postgres@postgres:5432/auth_db
PAYMENTS_DATABASE_URL=postgresql://postgres:postgres@postgres:5432/payments_db
ADMIN_DATABASE_URL=postgresql://postgres:postgres@postgres:5432/admin_db
PROFILE_DATABASE_URL=postgresql://postgres:postgres@postgres:5432/profile_db
```

### Issues to Address

⚠️ **Default Credentials** - Plain text passwords in .env  
⚠️ **No Connection Pooling** - Prisma default settings may exhaust connections  
⚠️ **No SSL/TLS** - Local setup doesn't use encryption  
⚠️ **Shared Database User** - All services use same `postgres` user

---

## 3. Prisma Migrations

### How Prisma Migrations Work

```
┌────────────────────────────────────────────────────────────┐
│           PRISMA MIGRATION WORKFLOW                        │
├────────────────────────────────────────────────────────────┤
│                                                            │
│  1. Edit schema (apps/service/prisma/schema.prisma)       │
│     └─ Add field, change type, add relation, etc.         │
│                                                            │
│  2. Create migration                                       │
│     $ pnpm exec prisma migrate dev --name add_field       │
│     └─ Generates SQL file in prisma/migrations/           │
│     └─ Applies migration to local dev database            │
│                                                            │
│  3. Review generated SQL                                  │
│     └─ migrations/[timestamp]_add_field/migration.sql     │
│     └─ Make sure it's safe (no data loss)                 │
│                                                            │
│  4. Commit to git                                          │
│     └─ Include both schema.prisma AND migration SQL       │
│                                                            │
│  5. Deploy to staging                                     │
│     $ pnpm exec prisma migrate deploy                     │
│     └─ Applies pending migrations to staging DB           │
│     └─ Updates _prisma_migrations table                   │
│                                                            │
│  6. Deploy to production                                  │
│     $ pnpm exec prisma migrate deploy                     │
│     └─ Same as staging, but with backups                  │
│     └─ Automatic rollback if migration fails              │
│                                                            │
└────────────────────────────────────────────────────────────┘
```

### Current Migration Status

**Local Development:**

- ✅ Migrations created and working
- ✅ Stored in `apps/service/prisma/migrations/`
- 🟡 Not tested in production scenario
- 🟡 No backup before migration
- 🟡 No rollback mechanism

### Best Practices

#### ✅ Safe Migrations

```sql
-- SAFE: Adding nullable column
ALTER TABLE users ADD COLUMN nickname VARCHAR;

-- SAFE: Adding column with default
ALTER TABLE users ADD COLUMN status VARCHAR DEFAULT 'active';

-- SAFE: Adding constraint to empty table
ALTER TABLE users ADD CONSTRAINT unique_email UNIQUE (email);

-- SAFE: Renaming column (with intermediate column)
ALTER TABLE users ADD COLUMN email_new VARCHAR;
UPDATE users SET email_new = email;
ALTER TABLE users DROP COLUMN email;
ALTER TABLE users RENAME COLUMN email_new TO email;
```

#### ❌ Dangerous Migrations

```sql
-- DANGEROUS: Dropping column (data loss)
ALTER TABLE users DROP COLUMN phone;

-- DANGEROUS: Changing column type (data conversion risk)
ALTER TABLE payments ALTER COLUMN amount TYPE TEXT;

-- DANGEROUS: Removing constraint (might break app logic)
ALTER TABLE users DROP CONSTRAINT users_email_unique;

-- DANGEROUS: Renaming table without app code update
RENAME TABLE users TO user_accounts;
```

### Prisma-Specific Best Practices

**DO:**

```prisma
// Add optional field first
field String?

// Deploy code that handles optional field

// Later, populate existing rows

// Finally, make it required
field String
```

**DON'T:**

```prisma
// Don't add required field without default
field String  // Will break existing rows!

// Don't rename columns without migration
rename old_name to new_name  // Will lose data!

// Don't add unique constraint to non-unique data
@unique  // Will fail if duplicates exist!
```

---

## 4. Connection Pooling

### Problem: Connection Exhaustion

```
Database
├─ Max connections: 100 (default PostgreSQL)
│
├─ Dev Server 1: 2 connections
├─ Dev Server 2: 2 connections
├─ Dev Server 3: 2 connections
├─ Dev Server 4: 2 connections
├─ Dev Server 5: 2 connections
├─ ...
└─ PROBLEM: 50 connections available, 100 needed
   └─ New connections fail: "too many connections"
```

### Solution: Connection Pooling with PgBouncer

**In Production (AWS RDS):**

```
┌──────────────────────────────┐
│    Backend Services (ECS)    │
├──────────────────────────────┤
│ ┌────────┐  ┌────────┐       │
│ │ Auth   │  │Payments│       │
│ │ (1-2   │  │ (1-2   │       │
│ │ conn)  │  │ conn)  │       │
│ └────┬───┘  └────┬───┘       │
│      │           │           │
│      └─────┬─────┘           │
│            │                 │
│     ┌──────▼──────┐          │
│     │ PgBouncer   │          │
│     │ (connection │          │
│     │  pool)      │          │
│     └──────┬──────┘          │
│            │                 │
└────────────┼─────────────────┘
             │
      ┌──────▼──────────┐
      │ AWS RDS         │
      │ PostgreSQL      │
      │ 100 connections │
      └─────────────────┘
```

### Prisma Connection Pool Configuration

**Current** (Local - `schema.prisma`):

```prisma
datasource db {
  provider = "postgresql"
  url      = env("AUTH_DATABASE_URL")
}
```

**With Pooling** (Production):

```prisma
datasource db {
  provider = "postgresql"
  url      = env("AUTH_DATABASE_URL")
}

// In Prisma client initialization
const prisma = new PrismaClient({
  log: ['query', 'error', 'warn'],
});

// For production, set connection limits
// DATABASE_URL="postgresql://user:pass@host/db?max_pool_size=10"
```

### AWS RDS + PgBouncer Setup

**RDS Parameter Group:**

```
max_connections: 100 (standard)
  ├─ API Gateway: 10 connections
  ├─ Auth Service: 5 connections
  ├─ Payments Service: 5 connections
  ├─ Admin Service: 5 connections
  ├─ Profile Service: 5 connections
  ├─ PgBouncer: 20 connections (to RDS)
  └─ Buffer: 45 connections (headroom)
```

**Connection String with Pooling:**

```
postgresql://user:pass@pgbouncer:6432/auth_db?max_pool_size=10
                          ^^^^^^ pool port    ^^^^^^^^^^^^^^ pool size
```

### What to Configure

| Setting                         | Local Dev | Production  | Purpose                             |
| ------------------------------- | --------- | ----------- | ----------------------------------- |
| **max_pool_size**               | 5         | 10          | Max connections per service         |
| **connection_limit_mode**       | -         | transaction | Reset connections after transaction |
| **statement_timeout**           | -         | 30000ms     | Kill hanging queries                |
| **idle_in_transaction_timeout** | -         | 30000ms     | Kill idle transactions              |

---

## 5. Backup Strategy

### Backup Philosophy

```
"A backup you haven't tested is not a backup."
                                    - DBA wisdom

Three Rules:
1. Backup automatically (daily)
2. Test recovery regularly (weekly)
3. Document procedures (always)
```

### Backup Architecture

```
┌─────────────────────────────────────────────────────┐
│              PRODUCTION DATABASES                   │
├─────────────────────────────────────────────────────┤
│  auth_db | payments_db | admin_db | profile_db      │
└────────────────┬────────────────────────────────────┘
                 │ pg_dump (automated daily)
                 │
    ┌────────────▼────────────┐
    │  AWS S3 Backup Bucket   │
    │  (encrypted)            │
    │                         │
    │ backup-2025-12-24.sql   │ ← Daily backup
    │ backup-2025-12-23.sql   │ ← Keep 30 days
    │ backup-2025-12-22.sql   │
    │ ...                     │
    └────────────┬────────────┘
                 │ Point-in-time recovery
                 ▼
    ┌──────────────────────┐
    │  Staging Database    │
    │  (for testing)       │
    └──────────────────────┘
                 │ Verify recovery
                 ▼
    ✅ RECOVERY TESTED & DOCUMENTED
```

### Backup Strategy Options

#### Option A: AWS RDS Automated Backups (RECOMMENDED)

**What it does:**

- Automatic daily backup of entire database
- 7-day retention (configurable up to 35 days)
- Point-in-time recovery to any second
- No manual intervention needed

**Configuration:**

```bash
# AWS CLI
aws rds modify-db-instance \
  --db-instance-identifier auth-db-prod \
  --backup-retention-period 30 \
  --preferred-backup-window "03:00-04:00" \
  --preferred-maintenance-window "sun:04:00-sun:05:00"
```

**Cost:** ~$0.02 per GB per month  
**RPO (Recovery Point Objective):** Minutes  
**RTO (Recovery Time Objective):** < 15 minutes

#### Option B: Manual pg_dump to S3 (COMPLEMENTARY)

**What it does:**

- Export entire database as SQL file
- Store in S3 (cheap long-term storage)
- Can restore to any database, not just AWS

**Script:**

```bash
#!/bin/bash
# backup.sh - Daily backup script

DB_NAME="auth_db"
DB_USER="postgres"
DB_HOST="auth-db-prod.rds.amazonaws.com"
BACKUP_FILE="backup-$(date +%Y-%m-%d).sql.gz"

pg_dump \
  --host=$DB_HOST \
  --username=$DB_USER \
  --dbname=$DB_NAME \
  --format=plain \
  --compress=9 \
  > $BACKUP_FILE

# Upload to S3
aws s3 cp $BACKUP_FILE s3://backups-bucket/$DB_NAME/

# Cleanup old backups (keep 30 days)
aws s3 rm s3://backups-bucket/$DB_NAME/ \
  --exclude "*" --include "*.gz" \
  --older-than 30
```

**Setup:**

```bash
# Add to cron (runs daily at 2 AM)
0 2 * * * /scripts/backup.sh >> /var/log/backup.log 2>&1
```

**Cost:** ~$0.02 per GB for S3 storage  
**RPO:** 1 day (daily backups)  
**RTO:** 15-60 minutes (depends on database size)

#### Option C: Continuous Replication (ADVANCED)

**What it does:**

- Real-time replica database in another AZ
- Automatic failover on primary failure
- Can be promoted to standalone
- Logs shipped to S3 for PITR

**When to use:** After launch, when availability critical  
**Cost:** 2x database cost (~$600 → $1200/month)  
**RPO:** Seconds  
**RTO:** < 1 minute (automatic failover)

### Recommended Backup Strategy

**For Launch (Week 8):**

- ✅ AWS RDS automated backups (daily, 30-day retention)
- ✅ Manual pg_dump to S3 (daily, long-term archive)
- ❌ Replication (not needed for MVP)

**After Launch (Month 3+):**

- ✅ Keep RDS + S3 backups
- ✅ Add read replica for HA
- ✅ Implement continuous replication

### Backup Testing Procedure

**Weekly (Every Monday):**

1. Restore latest backup to staging
2. Run smoke tests (queries work, data intact)
3. Document any issues
4. Destroy staging restore

**Script:**

```bash
#!/bin/bash
# test-backup.sh - Weekly backup recovery test

echo "Testing backup for $1 database..."

# Restore to staging
aws rds restore-db-instance-from-db-snapshot \
  --db-instance-identifier "$1-staging-restore" \
  --db-snapshot-identifier "$1-snapshot-latest"

# Wait for restore
while true; do
  STATUS=$(aws rds describe-db-instances \
    --db-instance-identifier "$1-staging-restore" \
    --query 'DBInstances[0].DBInstanceStatus' --output text)
  if [ "$STATUS" = "available" ]; then break; fi
  sleep 10
done

# Run smoke tests
psql -h "endpoint" -U postgres -d "$1" -c "SELECT COUNT(*) FROM users;"

# Check results
if [ $? -eq 0 ]; then
  echo "✅ Backup test PASSED"
else
  echo "❌ Backup test FAILED"
  # Alert team!
fi

# Cleanup
aws rds delete-db-instance \
  --db-instance-identifier "$1-staging-restore" \
  --skip-final-snapshot
```

---

## 6. Disaster Recovery

### RTO/RPO Targets

| Scenario                     | RTO (Recovery Time) | RPO (Data Loss) | Strategy                       |
| ---------------------------- | ------------------- | --------------- | ------------------------------ |
| **Single query fails**       | < 1 min             | 0               | App retry logic                |
| **Service crashes**          | < 2 min             | 0               | Service restart (Kubernetes)   |
| **Database connection lost** | < 5 min             | Minutes         | Connection pool failover       |
| **Single table corrupted**   | 15 min              | Minutes         | Point-in-time recovery         |
| **Entire database lost**     | 30 min              | Hours           | RDS restore from snapshot      |
| **Data center failure**      | 2 hours             | Hours           | Cross-region failover (future) |

### Disaster Recovery Plan

#### Scenario 1: Query Timeout / Slow Query

**Detection:**

- Application sees > 30s query response
- Application logs warning

**Recovery:**

```typescript
// Implement retry with exponential backoff
async function executeWithRetry(query, maxRetries = 3) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await prisma.$queryRaw(query);
    } catch (error) {
      if (i < maxRetries - 1) {
        await sleep(Math.pow(2, i) * 1000); // 1s, 2s, 4s
      } else {
        throw error;
      }
    }
  }
}
```

**Prevention:**

- Add query timeouts (30s)
- Monitor slow queries
- Create missing indexes

#### Scenario 2: Service Can't Connect to Database

**Detection:**

```
ERROR: connect ECONNREFUSED 127.0.0.1:5432
Error: too many connections
```

**Recovery:**

1. Check database status: `pg_isready -h host`
2. Check connection pool: `SELECT count(*) FROM pg_stat_activity;`
3. If > 100 connections:
   ```sql
   -- Terminate idle connections
   SELECT pg_terminate_backend(pid)
   FROM pg_stat_activity
   WHERE state = 'idle' AND idle_in_transaction;
   ```
4. Restart PgBouncer connection pool
5. Restart service containers

**Prevention:**

- Set connection pool limits
- Set statement timeouts
- Monitor active connections

#### Scenario 3: Data Corruption / Accidental Deletion

**Detection:**

- User reports missing data
- Data integrity checks fail (custom audits)

**Recovery:**

```bash
# Restore from point-in-time backup
# 1. Create new RDS instance from snapshot
aws rds restore-db-instance-from-db-snapshot \
  --source-db-snapshot-identifier auth-db-prod-2025-12-24 \
  --db-instance-identifier auth-db-recovery

# 2. Verify data restored correctly
# 3. Switch application to recovery database
# 4. Update endpoint in Prisma

# 5. Once verified, promote recovery to primary
```

**Time Required:** 30 minutes (test + switch)

**Prevention:**

- Enable transaction logging
- Implement audit tables (track changes)
- Use soft deletes (mark as deleted, don't remove)
- Regular data integrity checks

#### Scenario 4: Complete Database Failure

**Detection:**

- All services unable to connect
- RDS admin shows DB unavailable

**Recovery:**

```bash
# Option A: Restore from latest backup
# Option B: Fail over to read replica (if configured)
# Option C: Promote staging to production
```

**RTO:** 15-60 minutes  
**Data Loss:** Up to 24 hours (last backup)

**Prevention:**

- Daily automated backups
- Weekly restore testing
- Read replicas in different AZs
- Multi-region backup archives

### Disaster Recovery Runbook

**Template for each database:**

````markdown
# Recovery Runbook: auth_db

## Contacts

- DBA On-Call: +1-555-0123
- Team Lead: +1-555-0124
- AWS TAM: aws-support@company.com

## Scenarios

### Scenario 1: Service can't connect

1. Check RDS dashboard: Databases → auth-db-prod → Status
2. If "available": Problem is network/credentials
   - Check security groups
   - Check VPC/subnet
   - Verify DATABASE_URL in Secrets Manager
3. If "failed": Contact AWS support
4. If "stopped": Start instance
   ```bash
   aws rds start-db-instance --db-instance-identifier auth-db-prod
   ```
````

### Scenario 2: Slow queries / connection limit

1. SSH to RDS proxy or bastion host
2. Connect to database:
   ```bash
   psql -h auth-db-prod.rds.amazonaws.com -U postgres -d auth_db
   ```
3. Check connections:
   ```sql
   SELECT count(*) FROM pg_stat_activity;
   ```
4. Kill idle connections:
   ```sql
   SELECT pg_terminate_backend(pid)
   FROM pg_stat_activity
   WHERE state = 'idle' AND idle_in_transaction;
   ```
5. Restart affected service containers

### Scenario 3: Data loss / corruption

1. Create snapshot from point-in-time
   ```bash
   aws rds restore-db-instance-from-db-snapshot \
     --db-instance-identifier auth-db-recovery \
     --db-snapshot-identifier auth-db-prod-2025-12-24-02-00
   ```
2. Wait ~15 minutes for recovery
3. Verify data:
   ```bash
   psql -h recovery-endpoint -U postgres -d auth_db -c "SELECT COUNT(*) FROM users;"
   ```
4. Update app endpoint (temporary)
5. Investigate root cause
6. Once fixed, restore from recovery DB

## Testing Schedule

- Weekly: `./test-backup.sh auth_db`
- Monthly: Full recovery simulation
- Quarterly: Cross-region failover test

## Success Criteria

- All queries return expected data
- No constraint violations
- Data integrity checks pass
- Application connections work

````

---

## 7. Performance Optimization

### Indexes Strategy

**Current Indexes** (from schemas):

```prisma
// Auth Service
model User {
  ...
  @@index([email])
  @@index([role])
}

// Good! These are high-cardinality fields used in queries
````

**Indexes to Add** (per service):

```prisma
// Payments Service
model Payment {
  id        String      @id
  userId    String      // Add index - filter by user
  status    PaymentStatus // Add index - filter by status
  createdAt DateTime    // Add index - order by date

  @@index([userId])
  @@index([status])
  @@index([createdAt])
  @@index([userId, status, createdAt]) // Composite for common queries
}

// Profile Service
model Profile {
  id        String
  userId    String      // Add index
  createdAt DateTime    // Add index

  @@index([userId])
  @@index([createdAt])
}
```

**Rules:**

- ✅ Index high-cardinality columns (e.g., email, userId)
- ✅ Index columns used in WHERE clauses
- ✅ Index columns used in ORDER BY
- ✅ Composite indexes for common multi-column queries
- ❌ Don't over-index (slows writes, increases storage)
- ❌ Don't index low-cardinality columns (e.g., status with 3 values)

### Query Optimization

**Before:**

```typescript
// Bad: N+1 query problem
const users = await prisma.user.findMany();
for (const user of users) {
  const tokens = await prisma.refreshToken.findMany({
    where: { userId: user.id },
  }); // Runs once per user!
}
```

**After:**

```typescript
// Good: Single query with relation
const users = await prisma.user.findMany({
  include: {
    refreshTokens: true,
    devices: true,
  },
});
// One query, all data
```

**Query Execution Plan:**

```bash
# See how database executes queries
EXPLAIN ANALYZE
SELECT * FROM users
WHERE role = 'ADMIN'
ORDER BY created_at DESC
LIMIT 10;

# Shows:
# Seq Scan on users (slow without index)
# vs
# Index Scan using users_role_idx (fast with index)
```

### Caching Strategy

```
Request
  ↓
┌─────────────┐
│ Redis Cache │ ← Check here first
└────┬────────┘
     │ MISS
     ↓
┌──────────────┐
│ PostgreSQL   │ ← Check database
└────┬─────────┘
     │ FOUND
     ↓
┌─────────────┐
│ Redis Cache │ ← Store here for next time
└────┬────────┘
     │
     ↓
Response (with 1s cache TTL)
```

**Example:**

```typescript
// Implement caching
async function getUserWithCache(userId: string) {
  // 1. Check cache
  const cached = await redis.get(`user:${userId}`);
  if (cached) return JSON.parse(cached);

  // 2. Check database
  const user = await prisma.user.findUnique({
    where: { id: userId },
  });

  // 3. Store in cache (60s TTL)
  await redis.setex(`user:${userId}`, 60, JSON.stringify(user));

  return user;
}
```

### Query Monitoring

**Enable Query Logging:**

```prisma
const prisma = new PrismaClient({
  log: [
    { level: 'warn', emit: 'stdout' },      // Warnings
    { level: 'error', emit: 'stdout' },     // Errors
    { level: 'info', emit: 'event' },       // All queries
  ],
});

prisma.$on('query', (e) => {
  console.log('Query: ' + e.query);
  console.log('Params: ' + e.params);
  console.log('Duration: ' + e.duration + 'ms');
});
```

**Slow Query Threshold:**

```sql
-- PostgreSQL: log queries > 1 second
ALTER SYSTEM SET log_min_duration_statement = 1000;
SELECT pg_reload_conf();

-- View slow queries
SELECT query, calls, mean_time FROM pg_stat_statements
WHERE mean_time > 1000
ORDER BY mean_time DESC;
```

---

## 8. Security Hardening

### Database Credentials Management

**Problem (Current):**

```env
# .env file - INSECURE!
AUTH_DATABASE_URL=postgresql://postgres:postgres@localhost:5432/auth_db
                              ^^^^^^^^  ^^^^^^^^
                              username password (EXPOSED!)
```

**Solution: AWS Secrets Manager**

```bash
# Store credentials securely
aws secretsmanager create-secret \
  --name prod/auth-db-credentials \
  --secret-string '{"username":"auth_user","password":"$(openssl rand -base64 32)"}'

# Retrieve at runtime
const secret = await secretsManager.getSecretValue({
  SecretId: 'prod/auth-db-credentials'
});
const { username, password } = JSON.parse(secret.SecretString);
```

### Least Privilege Database Users

**Problem (Current):**

```bash
# All services use same 'postgres' user (full admin rights!)
```

**Solution: Service-Specific Users**

```sql
-- Create limited users per service
CREATE USER auth_service WITH PASSWORD 'random-password';
CREATE USER payments_service WITH PASSWORD 'random-password';
CREATE USER admin_service WITH PASSWORD 'random-password';
CREATE USER profile_service WITH PASSWORD 'random-password';

-- Grant only necessary permissions
GRANT CONNECT ON DATABASE auth_db TO auth_service;
GRANT USAGE ON SCHEMA public TO auth_service;
GRANT SELECT, INSERT, UPDATE ON ALL TABLES IN SCHEMA public TO auth_service;
-- DO NOT grant DELETE or DROP!

-- Prevent privilege escalation
ALTER DEFAULT PRIVILEGES IN SCHEMA public
  GRANT SELECT, INSERT, UPDATE ON TABLES TO auth_service;
```

### Connection Security (Production)

**Enable SSL/TLS:**

```bash
# In AWS RDS console:
# Database → Modify → SSL options → require-and-verify
```

**Prisma Connection String with SSL:**

```env
AUTH_DATABASE_URL="postgresql://user:pass@host:5432/db?sslmode=require"
                                                        ^^^^^^^^^^^^
                                                        Require SSL
```

### Query Injection Prevention

**Prisma already prevents SQL injection:**

```typescript
// SAFE - Parameterized query
const users = await prisma.user.findMany({
  where: { email: userInput },
});
// Prisma handles escaping

// NEVER DO THIS:
const query = `SELECT * FROM users WHERE email = '${userInput}'`;
// SQL injection vulnerability!
```

---

## 9. Monitoring & Maintenance

### Key Metrics to Monitor

| Metric                  | Threshold          | Action                         |
| ----------------------- | ------------------ | ------------------------------ |
| **CPU Usage**           | > 80% for 5 min    | Scale up / optimize queries    |
| **Storage**             | > 80% of allocated | Increase storage               |
| **Connections**         | > 80 of 100 max    | Check for leaks / restart pool |
| **Query Latency (p95)** | > 100ms            | Add indexes / optimize         |
| **Replication Lag**     | > 1s               | Check replica resources        |
| **Backup Age**          | > 24h              | Check backup automation        |
| **Failed Connections**  | Any                | Check network / credentials    |

### Monitoring Setup

**CloudWatch Metrics** (AWS):

```bash
# RDS automatically sends these metrics:
- CPUUtilization
- DatabaseConnections
- DiskQueueDepth
- ReadLatency / WriteLatency
- StorageUsed
```

**Grafana Dashboard:**

```
┌─────────────────────────────────┐
│  Database Health Dashboard      │
├─────────────────────────────────┤
│                                 │
│ CPU Usage        [████░░░░] 65% │
│ Storage Used     [███░░░░░░] 30%│
│ Connections      [██░░░░░░░░] 20│
│ Avg Query Time   [░░░░░░░░░░] 45ms│
│ Transactions/sec [████░░░░░░] 120│
│                                 │
│ Recent Slow Queries:            │
│ • UPDATE payments... (2.3s)     │
│ • SELECT * FROM users... (1.8s) │
│                                 │
│ Backup Status: ✅ OK (12h ago)  │
│ Replication Lag: < 100ms        │
│                                 │
└─────────────────────────────────┘
```

### Maintenance Tasks

**Daily:**

- ✅ Monitor backup completion
- ✅ Check for failed connections
- ✅ Review slow query logs

**Weekly:**

- ✅ Test backup recovery
- ✅ Review storage growth
- ✅ Analyze query performance
- ✅ Check disk space

**Monthly:**

- ✅ Full backup verification
- ✅ Vacuum & analyze databases
- ✅ Review indexes for optimization
- ✅ Update statistics

**Quarterly:**

- ✅ Disaster recovery simulation
- ✅ Capacity planning review
- ✅ Security audit
- ✅ Performance baseline

---

## 10. Production Deployment

### Pre-Production Checklist

**Database Configuration:**

- [ ] All 4 databases created
- [ ] SSL/TLS certificates installed
- [ ] Connection pooling configured
- [ ] Parameter group optimized
- [ ] Monitoring enabled
- [ ] Automated backups configured (daily, 30-day retention)

**Credentials & Security:**

- [ ] Database passwords in AWS Secrets Manager
- [ ] Service-specific users created (not 'postgres')
- [ ] Least-privilege permissions configured
- [ ] Security groups locked down
- [ ] IAM roles for Secrets Manager access

**Migrations & Data:**

- [ ] All migrations tested on staging
- [ ] Migration rollback procedure documented
- [ ] Baseline data loaded (if needed)
- [ ] Indexes created
- [ ] Statistics analyzed

**Monitoring & Backup:**

- [ ] CloudWatch metrics configured
- [ ] Backup restoration tested
- [ ] Slow query log enabled
- [ ] Connection alerts set up
- [ ] Runbooks created

**Testing:**

- [ ] Data integrity tests pass
- [ ] Load test: 1000 requests/sec
- [ ] Failover test: kill database, services recover
- [ ] Backup recovery: restore works in < 30 min

### Migration Execution Plan

```
┌─────────────────────────────────────────┐
│  DAY 1: Staging Validation              │
├─────────────────────────────────────────┤
│  1. Deploy code to staging              │
│  2. Run migrations: prisma migrate dev  │
│  3. Verify all tables exist             │
│  4. Load test data                      │
│  5. Run smoke tests                     │
│  6. Check logs for errors               │
│  → If all OK, proceed to production     │
│                                         │
│  DAY 2: Production Deployment (3 AM)    │
├─────────────────────────────────────────┤
│  1. Backup all databases (automated)    │
│  2. Notify on-call team                 │
│  3. Stop new requests (health check 503)│
│  4. Deploy code (rolling update)        │
│  5. Run migrations: prisma migrate prod │
│  6. Verify migrations completed         │
│  7. Resume requests (health check 200)  │
│  8. Monitor for 1 hour                  │
│  9. If issues: rollback from backup     │
│                                         │
│  ROLLBACK PROCEDURE:                    │
│  • Stop application servers             │
│  • Restore database from pre-deploy     │
│  • Revert code to previous version      │
│  • Restart application servers          │
│  • Monitor and notify team              │
│                                         │
└─────────────────────────────────────────┘
```

### Production Safeguards

**Read-Only Replica:**

```
Production Database (Read/Write)
    ↓ Replicates
Replica Database (Read-Only)
    ↓ Queries
Analytics / Reporting
```

**Automated Failover:**

```
Primary (failed)
    ↓ ← detects failure (5s)
Automatic failover
    ↓
Replica promoted to Primary
    ↓ App reconnects
All queries route to new primary
```

---

## 11. Implementation Phases

### Phase 1: Connection Pooling & Configuration (Week 5-6)

**Effort:** 4 hours  
**Complexity:** Low

**Tasks:**

1. Configure Prisma connection pooling
   - Set `max_pool_size=10` per service
   - Set query timeout 30s
   - Set idle timeout 300s

2. Update environment variables
   - Move to AWS Secrets Manager
   - Create service-specific users (auth_service, payments_service, etc.)
   - Set proper permissions (no DELETE/DROP)

3. Test connection limits
   - Load test: 1000 concurrent connections
   - Verify pool resets connections
   - Monitor active connections

**Deliverable:** Production-safe connection configuration

---

### Phase 2: Backup & Recovery (Week 5-6)

**Effort:** 6 hours  
**Complexity:** Medium

**Tasks:**

1. AWS RDS Automated Backups
   - Enable automated backups (daily)
   - Set retention to 30 days
   - Test restore from snapshot

2. Manual Backup to S3
   - Create pg_dump script
   - Set up cron job (daily 2 AM)
   - Test S3 restore procedure

3. Backup Testing
   - Create test procedure
   - Restore to staging weekly
   - Document success/failures

4. Create runbooks
   - Recovery procedures for each scenario
   - Contact list & escalation
   - Testing schedule

**Deliverable:** Automated, tested backup strategy

---

### Phase 3: Monitoring & Alerts (Week 6-7)

**Effort:** 4 hours  
**Complexity:** Low

**Tasks:**

1. CloudWatch Monitoring
   - Enable metrics collection
   - Create custom dashboards
   - Set up alarms (CPU > 80%, connections > 80, etc.)

2. Slow Query Monitoring
   - Enable query logging
   - Create alerts for slow queries (> 1s)
   - Add to Grafana dashboard

3. Database Health Checks
   - Create health check endpoint (SELECT 1)
   - Monitor backup completion
   - Track storage usage

**Deliverable:** Visibility into database health

---

### Phase 4: Security & Audit (Week 6-7)

**Effort:** 4 hours  
**Complexity:** Medium

**Tasks:**

1. User & Permission Hardening
   - Create service-specific database users
   - Grant least-privilege permissions
   - Remove postgres user access

2. Connection Security
   - Enable SSL/TLS in RDS
   - Update connection strings with sslmode=require
   - Test encrypted connections

3. Audit Logging
   - Enable query logging
   - Create audit middleware in Prisma
   - Store audit logs separately

4. Access Control
   - Document who has access to each database
   - Set up IAM roles
   - Enable CloudTrail logging

**Deliverable:** Security-hardened database configuration

---

### Phase 5: Performance Tuning (Week 7)

**Effort:** 6 hours  
**Complexity:** Medium

**Tasks:**

1. Index Analysis
   - Add missing indexes based on query patterns
   - Remove unused indexes
   - Create composite indexes for common queries

2. Query Optimization
   - Identify slow queries (> 1s)
   - Rewrite using Prisma include/select
   - Add caching layer for read-heavy queries

3. Parameter Tuning
   - Adjust work_mem (for sorting)
   - Adjust shared_buffers
   - Tune maintenance_work_mem

4. Load Testing
   - Simulate production load
   - Monitor query performance
   - Identify bottlenecks

**Deliverable:** Optimized database performance

---

## 12. Integration with 8-Week Roadmap

### Timeline Integration

```
Week 1-2   Backend Hardening
           └─ No database changes yet

Week 3     Security Testing
           └─ No database changes yet

Week 4     CI/CD Foundation (CI Pipeline + Docker)
           └─ No database changes yet

Week 5-6   AWS Infrastructure
           ├─ RDS PostgreSQL provisioning
           ├─ Create 4 databases (auth_db, payments_db, admin_db, profile_db)
           ├─ Configure connection pooling
           ├─ Set up automated backups
           ├─ Enable CloudWatch monitoring
           └─ PARALLEL: Database Phase 1-3 (Connection pooling, Backup, Monitoring)

Week 6-7   CD Pipeline Deployment + Database Hardening
           ├─ Track A: CD Pipeline (staging/production deployment)
           ├─ Track B: Advanced Security
           └─ Track C: Observability

           Database Phase 4-5 (Security + Performance)
           ├─ User & permission hardening
           ├─ Enable SSL/TLS
           ├─ Add audit logging
           ├─ Index optimization
           └─ Load testing

Week 8     Production Launch
           ├─ Run migrations to production
           ├─ Verify all data integrity
           ├─ Test backup/recovery
           └─ 🚀 Go live with secure, backed-up databases
```

### Critical Path for Databases

```
Migrations strategy (plan)
    ↓ BEFORE Week 5
Connection pooling (configure)
    ↓ DURING Week 5-6 (AWS setup)
Backup automation (set up)
    ↓ DURING Week 5-6 (AWS setup)
Backup testing (verify)
    ↓ DURING Week 5-6 (AWS setup)

    🚦 GATE 2A: Database Infrastructure Ready (Week 6)

Monitoring (enable)
    ↓ DURING Week 6-7
Security hardening (configure)
    ↓ DURING Week 6-7
Performance tuning (test)
    ↓ DURING Week 6-7

    🚦 GATE 2B: Database Production Ready (Week 7)

Production migrations (execute)
    ↓ WEEK 8
Production verification
    ↓ WEEK 8

    ✅ LAUNCH (Week 8)
```

---

## Summary Checklist

### Must-Have for Production (Critical)

- [ ] All 4 databases created in RDS
- [ ] Automated daily backups configured (30-day retention)
- [ ] Backup restoration tested (weekly)
- [ ] Connection pooling configured (prevent exhaustion)
- [ ] Service-specific database users (least privilege)
- [ ] SSL/TLS enabled (encrypted connections)
- [ ] Monitoring enabled (CloudWatch + Grafana)
- [ ] Disaster recovery runbook created
- [ ] Migration strategy documented
- [ ] Pre-production checklist completed

### Nice-to-Have (Optional)

- [ ] Query optimization completed
- [ ] Read replicas configured
- [ ] Continuous replication (for HA)
- [ ] Advanced audit logging
- [ ] Automated performance tuning
- [ ] Query caching layer
- [ ] Cross-region backup archives

### Success Criteria

✅ **Week 5-6:** Database infrastructure ready

- RDS instances created
- Backups automated & tested
- Monitoring active
- Connection pooling configured

✅ **Week 6-7:** Database hardened for production

- Security configured
- Least-privilege users
- Audit logging enabled
- Performance tuned

✅ **Week 8:** Production deployment

- Migrations executed successfully
- Data integrity verified
- Backup/recovery tested
- 24h monitoring passed

---

## Related Documents

- [BACKEND-HARDENING-PLAN.md](./BACKEND-HARDENING-PLAN.md) - Phase 4: Database Security
- [CI-CD-PLANNING.md](./CI-CD-PLANNING.md) - Phase 6: Database Migration Automation
- [COMPLETE-PRODUCTION-READINESS-ROADMAP.md](./COMPLETE-PRODUCTION-READINESS-ROADMAP.md) - Integrated timeline

---

**Document Version:** 1.0  
**Date:** December 24, 2025  
**Status:** Complete - Ready for Implementation  
**Next Step:** Week 5 - AWS RDS provisioning + Database Phase 1 (Connection pooling)
