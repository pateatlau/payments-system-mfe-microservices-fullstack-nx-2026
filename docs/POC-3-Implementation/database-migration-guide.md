# Database Migration Guide - POC-3

**Status:** Template (To be completed during Phase 3)  
**Version:** 1.0  
**Date:** 2026-12-10  
**Purpose:** Step-by-step guide for migrating from shared database to separate databases per service

---

## Pre-Migration Checklist

### Prerequisites

- [ ] All POC-2 tests passing
- [ ] Docker Compose with separate databases configured
- [ ] All separate databases created and accessible
- [ ] Prisma schemas created for each service
- [ ] Backup of shared database completed
- [ ] Migration scripts written and tested

### Environment Setup

- [ ] `AUTH_DATABASE_URL` configured
- [ ] `PAYMENTS_DATABASE_URL` configured
- [ ] `ADMIN_DATABASE_URL` configured
- [ ] `PROFILE_DATABASE_URL` configured

---

## Migration Steps

### Step 1: Backup Shared Database

```bash
# Create backup of shared database
pg_dump -h localhost -p 5432 -U postgres -d mfe_poc2 > backup/mfe_poc2_$(date +%Y%m%d_%H%M%S).sql
```

**Verification:**

- [ ] Backup file created
- [ ] Backup file size > 0
- [ ] Test restore to temporary database

---

### Step 2: Create Separate Databases

```bash
# Start Docker Compose with new databases
docker-compose up -d auth_db payments_db admin_db profile_db

# Verify databases are running
docker-compose ps
```

**Verification:**

- [ ] auth_db accessible on port 5432
- [ ] payments_db accessible on port 5433
- [ ] admin_db accessible on port 5434
- [ ] profile_db accessible on port 5435

---

### Step 3: Run Prisma Migrations

```bash
# Auth Service
cd apps/auth-service
npx prisma migrate deploy

# Payments Service
cd ../payments-service
npx prisma migrate deploy

# Admin Service
cd ../admin-service
npx prisma migrate deploy

# Profile Service
cd ../profile-service
npx prisma migrate deploy
```

**Verification:**

- [ ] Auth Service migrations applied
- [ ] Payments Service migrations applied
- [ ] Admin Service migrations applied
- [ ] Profile Service migrations applied
- [ ] No migration errors

---

### Step 4: Export Data from Shared Database

```bash
# Run export scripts
npx ts-node scripts/export-auth-data.ts
npx ts-node scripts/export-payments-data.ts
npx ts-node scripts/export-admin-data.ts
npx ts-node scripts/export-profile-data.ts
```

**Verification:**

- [ ] `migration-data/auth-data.json` created
- [ ] `migration-data/payments-data.json` created
- [ ] `migration-data/admin-data.json` created
- [ ] `migration-data/profile-data.json` created
- [ ] Data counts logged and noted

---

### Step 5: Import Data to Separate Databases

```bash
# Run import scripts
npx ts-node scripts/import-auth-data.ts
npx ts-node scripts/import-payments-data.ts
npx ts-node scripts/import-admin-data.ts
npx ts-node scripts/import-profile-data.ts
```

**Verification:**

- [ ] Auth data imported (users, refresh_tokens)
- [ ] Payments data imported (payments, transactions)
- [ ] Admin data imported (audit_logs, system_config)
- [ ] Profile data imported (user_profiles)
- [ ] Import counts match export counts

---

### Step 6: Validate Data Integrity

```bash
# Run validation script
npx ts-node scripts/validate-migration.ts
```

**Validation Checks:**

- [ ] User count matches
- [ ] Payment count matches
- [ ] All foreign key references valid (as string IDs)
- [ ] No orphaned records
- [ ] Test queries return expected results

---

### Step 7: Update Service Configurations

Update each service to use its separate database URL.

**Verification:**

- [ ] Auth Service connects to auth_db
- [ ] Payments Service connects to payments_db
- [ ] Admin Service connects to admin_db
- [ ] Profile Service connects to profile_db
- [ ] No service connects to shared database

---

### Step 8: Run Integration Tests

```bash
# Run all backend tests
pnpm test:backend
```

**Verification:**

- [ ] Auth Service tests pass
- [ ] Payments Service tests pass
- [ ] Admin Service tests pass
- [ ] Profile Service tests pass
- [ ] Cross-service integration tests pass

---

### Step 9: Manual Verification

**Auth Service:**

- [ ] User login works
- [ ] User registration works
- [ ] Token refresh works

**Payments Service:**

- [ ] Create payment works
- [ ] List payments works
- [ ] Payment status updates work

**Admin Service:**

- [ ] Audit log creation works
- [ ] System config retrieval works
- [ ] User management works

**Profile Service:**

- [ ] Get profile works
- [ ] Update profile works

---

## Post-Migration Tasks

- [ ] Remove shared database dependency from services
- [ ] Update documentation
- [ ] Monitor service health
- [ ] Keep shared database backup for 30 days

---

## Rollback Procedure

If issues are detected:

### Step 1: Stop Services

```bash
# Stop all backend services
pnpm stop:backend
```

### Step 2: Revert Configuration

Restore original database URLs pointing to shared database.

### Step 3: Restart Services

```bash
# Start services with original configuration
pnpm start:backend
```

### Step 4: Verify Rollback

- [ ] All services connect to shared database
- [ ] All API endpoints working
- [ ] All tests passing

---

## Validation Checklist Summary

| Check                   | Expected | Actual | Status      |
| ----------------------- | -------- | ------ | ----------- |
| User count              | -        | -      | Not Started |
| Payment count           | -        | -      | Not Started |
| Transaction count       | -        | -      | Not Started |
| Audit log count         | -        | -      | Not Started |
| Profile count           | -        | -      | Not Started |
| Auth Service health     | Complete | -      | Not Started |
| Payments Service health | Complete | -      | Not Started |
| Admin Service health    | Complete | -      | Not Started |
| Profile Service health  | Complete | -      | Not Started |

---

**Last Updated:** 2026-12-10  
**Status:** Template  
**Next Steps:** Complete during Phase 3 (Database Migration)
