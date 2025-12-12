# Migration Guide: POC-2 to POC-3

**Status:** Template (To be completed during Phase 8)  
**Version:** 1.0  
**Date:** 2026-12-10  
**Purpose:** Comprehensive guide for migrating from POC-2 to POC-3

---

## Overview

This guide covers all changes required to migrate from POC-2 (shared database, Redis Pub/Sub, direct service URLs) to POC-3 (separate databases, RabbitMQ, nginx proxy, WebSocket).

---

## Pre-Migration Requirements

### Infrastructure

- [ ] Docker Desktop running
- [ ] At least 8GB RAM available
- [ ] Ports available: 80, 443, 5432-5435, 5672, 15672, 6379

### Code

- [ ] POC-2 branch stable and tested
- [ ] All POC-2 tests passing
- [ ] No uncommitted changes

---

## Migration Summary

| Component     | POC-2             | POC-3                    | Migration Required |
| ------------- | ----------------- | ------------------------ | ------------------ |
| Database      | Shared PostgreSQL | Separate per service     | Yes                |
| Event Hub     | Redis Pub/Sub     | RabbitMQ                 | Yes                |
| API Gateway   | Proxy disabled    | Streaming proxy          | Yes                |
| Reverse Proxy | None              | nginx                    | Yes (new)          |
| WebSocket     | None              | ws in API Gateway        | Yes (new)          |
| Caching       | TanStack Query    | + Redis + Service Worker | Yes                |
| Observability | Basic logging     | Sentry, Prometheus, OTel | Yes (new)          |
| Session Sync  | None              | Cross-tab, cross-device  | Yes (new)          |

---

## Step-by-Step Migration

### Phase 1: Infrastructure Setup

#### 1.1 Update Docker Compose

Replace `docker-compose.yml` with POC-3 version including:

- [ ] nginx service (ports 80, 443)
- [ ] auth_db service (port 5432)
- [ ] payments_db service (port 5433)
- [ ] admin_db service (port 5434)
- [ ] profile_db service (port 5435)
- [ ] rabbitmq service (ports 5672, 15672)
- [ ] redis service (port 6379, caching only)

```bash
docker-compose down
docker-compose up -d
```

#### 1.2 Generate SSL Certificates

```bash
./scripts/generate-ssl-certs.sh
```

#### 1.3 Verify Infrastructure

```bash
# Check all containers running
docker-compose ps

# Check nginx health
curl -k https://localhost/health

# Check RabbitMQ management
open http://localhost:15672
```

---

### Phase 2: Database Migration

#### 2.1 Backup POC-2 Database

```bash
pg_dump -h localhost -p 5432 -U postgres -d mfe_poc2 > backup/poc2_backup.sql
```

#### 2.2 Create Service Prisma Schemas

Copy schema files to each service:

- [ ] `apps/auth-service/prisma/schema.prisma`
- [ ] `apps/payments-service/prisma/schema.prisma`
- [ ] `apps/admin-service/prisma/schema.prisma`
- [ ] `apps/profile-service/prisma/schema.prisma`

#### 2.3 Run Migrations

```bash
pnpm prisma:migrate:all
```

#### 2.4 Migrate Data

```bash
pnpm migrate:data
```

See [Database Migration Guide](./database-migration-guide.md) for details.

---

### Phase 3: Event Hub Migration

#### 3.1 Install RabbitMQ Library

```bash
pnpm add amqplib
pnpm add -D @types/amqplib
```

#### 3.2 Update Service Event Publishing

Replace Redis publisher with RabbitMQ publisher in each service.

#### 3.3 Update Service Event Subscribing

Replace Redis subscriber with RabbitMQ subscriber.

#### 3.4 Run Dual Publishing (Optional)

For safe migration, run both Redis and RabbitMQ temporarily.

See [Event Hub Migration Guide](./event-hub-migration-guide.md) for details.

---

### Phase 4: API Gateway Proxy

#### 4.1 Replace Proxy Implementation

Update `apps/api-gateway/src/routes/proxy.ts` with streaming proxy.

#### 4.2 Enable All Proxy Routes

Uncomment and enable:

- [ ] `/api/auth/*`
- [ ] `/api/payments/*`
- [ ] `/api/admin/*`
- [ ] `/api/profile/*`

#### 4.3 Test Proxy

```bash
# Test auth endpoint through proxy
curl -k https://localhost/api/auth/health

# Test with POST body
curl -k -X POST https://localhost/api/auth/signin \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","password":"password"}'
```

---

### Phase 5: Frontend Updates

#### 5.1 Update API Base URL

Update all frontend API clients to use nginx URL:

```typescript
// Before (POC-2)
baseURL: 'http://localhost:3001';

// After (POC-3)
baseURL: import.meta.env.VITE_API_BASE_URL || 'https://localhost/api';
```

Files to update:

- [ ] `libs/shared-api-client/src/lib/apiClient.ts`
- [ ] `apps/payments-mfe/src/api/payments.ts`
- [ ] `apps/admin-mfe/src/api/adminApiClient.ts`
- [ ] `apps/admin-mfe/src/api/dashboard.ts`

#### 5.2 Add WebSocket Provider

Add WebSocket provider to Shell app:

```tsx
// apps/shell/src/App.tsx
import { WebSocketProvider } from '@mfe-poc/shared-websocket';

function App() {
  return <WebSocketProvider>{/* ... existing providers */}</WebSocketProvider>;
}
```

#### 5.3 Add Service Worker

Register service worker in Shell app for caching.

---

### Phase 6: Environment Updates

#### 6.1 Update .env Files

Add new environment variables:

```bash
# Database URLs
AUTH_DATABASE_URL=postgresql://postgres:postgres@localhost:5432/auth_db
PAYMENTS_DATABASE_URL=postgresql://postgres:postgres@localhost:5433/payments_db
ADMIN_DATABASE_URL=postgresql://postgres:postgres@localhost:5434/admin_db
PROFILE_DATABASE_URL=postgresql://postgres:postgres@localhost:5435/profile_db

# RabbitMQ
RABBITMQ_URL=amqp://localhost:5672
RABBITMQ_USER=admin
RABBITMQ_PASSWORD=admin

# nginx
VITE_API_BASE_URL=https://localhost/api
VITE_WS_URL=wss://localhost/ws

# Observability
SENTRY_DSN=<your-sentry-dsn>
```

---

### Phase 7: Testing

#### 7.1 Run All Tests

```bash
# Backend tests
pnpm test:backend

# Frontend tests
pnpm test:frontend

# E2E tests
pnpm test:e2e
```

#### 7.2 Manual Testing

- [ ] Sign in works
- [ ] Sign up works
- [ ] Payment creation works
- [ ] Payment list loads
- [ ] Admin dashboard loads
- [ ] Profile updates work
- [ ] WebSocket connects
- [ ] Real-time updates work

---

## Rollback Procedure

If migration fails:

### 1. Stop POC-3 Services

```bash
docker-compose down
```

### 2. Restore POC-2 Configuration

```bash
git checkout poc-2 -- docker-compose.yml
git checkout poc-2 -- apps/*/src/config/
git checkout poc-2 -- libs/shared-api-client/
```

### 3. Start POC-2 Services

```bash
docker-compose up -d
pnpm start:backend
pnpm start:frontend
```

### 4. Restore Database (if needed)

```bash
psql -h localhost -p 5432 -U postgres -d mfe_poc2 < backup/poc2_backup.sql
```

---

## Post-Migration Verification

| Feature             | Verification                   | Status      |
| ------------------- | ------------------------------ | ----------- |
| nginx proxy         | Requests routed correctly      | Not Started |
| SSL/TLS             | HTTPS works, certificate valid | Not Started |
| Database separation | Each service uses own DB       | Not Started |
| RabbitMQ events     | Events published and consumed  | Not Started |
| API Gateway proxy   | All routes work                | Not Started |
| WebSocket           | Connection established         | Not Started |
| Real-time updates   | Events reach frontend          | Not Started |
| Caching             | Service worker active          | Not Started |
| Observability       | Errors tracked in Sentry       | Not Started |
| Session sync        | Cross-tab sync works           | Not Started |

---

## Troubleshooting

### nginx not starting

```bash
# Check nginx config syntax
docker-compose exec nginx nginx -t

# Check nginx logs
docker-compose logs nginx
```

### Database connection issues

```bash
# Verify database is running
docker-compose ps auth_db

# Test connection
psql -h localhost -p 5432 -U postgres -d auth_db
```

### RabbitMQ connection issues

```bash
# Check RabbitMQ is running
docker-compose ps rabbitmq

# Check management UI
open http://localhost:15672
```

### WebSocket not connecting

1. Check nginx WebSocket proxy config
2. Check JWT token is valid
3. Check API Gateway WebSocket server is running
4. Check browser console for errors

---

## Documentation Updates

After migration, update:

- [ ] README.md with new architecture
- [ ] API documentation with new URLs
- [ ] Developer setup guide
- [ ] Deployment documentation

---

**Last Updated:** 2026-12-10  
**Status:** Template  
**Next Steps:** Complete during Phase 8 (Documentation)
