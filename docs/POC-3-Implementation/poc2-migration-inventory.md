# POC-2 Migration Inventory for POC-3

**Status:** Complete  
**Version:** 1.0  
**Date:** 2026-12-10  
**Purpose:** Document all POC-2 components requiring migration in POC-3

---

## 1. POC-2 Completion Status

**POC-2 Status:** Complete (100% - 66/66 tasks)  
**Completion Date:** 2026-12-09

### Completed Phases

| Phase                         | Status   | Tasks           |
| ----------------------------- | -------- | --------------- |
| Phase 1: Planning & Setup     | Complete | 7/7 sub-tasks   |
| Phase 2: Backend Foundation   | Complete | 11/11 sub-tasks |
| Phase 3: Backend Services     | Complete | 19/19 sub-tasks |
| Phase 4: Frontend Integration | Complete | 16/16 sub-tasks |
| Phase 5: Testing & Refinement | Complete | 13/13 sub-tasks |

---

## 2. Shared Database Usages

### Current Configuration

- **Database:** PostgreSQL 16
- **Connection:** Single shared database `mfe_poc2`
- **Port:** 5432
- **ORM:** Prisma 5.x
- **Schema Location:** `libs/backend/db/prisma/schema.prisma`

### Services Using Shared Database

| Service          | Port | Models Used                 | Foreign Keys                                 |
| ---------------- | ---- | --------------------------- | -------------------------------------------- |
| Auth Service     | 3001 | User, RefreshToken          | User → RefreshToken                          |
| Payments Service | 3002 | Payment, PaymentTransaction | Payment → User, PaymentTransaction → Payment |
| Admin Service    | 3003 | AuditLog, SystemConfig      | AuditLog → User                              |
| Profile Service  | 3004 | UserProfile                 | UserProfile → User                           |

### Cross-Service Foreign Key Dependencies

```
User ←──────────── RefreshToken (Auth Service owns User)
  ↑
  ├─── Payment.senderId (Payments Service)
  ├─── Payment.recipientId (Payments Service)
  ├─── AuditLog.userId (Admin Service)
  └─── UserProfile.userId (Profile Service)
```

### Migration Impact

**Breaking Changes:**

- Foreign keys between services must be removed
- Cross-service queries must be replaced with API calls or events
- User data must be accessed via Auth Service API

**Data Migration Required:**

- Users table → auth_db
- RefreshToken table → auth_db
- Payment, PaymentTransaction tables → payments_db
- AuditLog, SystemConfig tables → admin_db
- UserProfile table → profile_db

---

## 3. Redis Pub/Sub Usages (Event Hub)

### Current Configuration

- **Technology:** Redis 7.x
- **Port:** 6379
- **Library:** `libs/backend/event-hub`
- **Pattern:** Pub/Sub (fire and forget)

### Event Hub Library Structure

```
libs/backend/event-hub/
├── src/
│   ├── index.ts                    # Exports
│   └── lib/
│       ├── types.ts                # BaseEvent, EventHandler, EventSubscription
│       ├── redis-connection.ts     # Connection singleton
│       ├── event-publisher.ts      # EventPublisher class
│       └── event-subscriber.ts     # EventSubscriber class
```

### Event Types Currently Used

| Event Category | Event Types                                                         | Publisher        | Subscribers     |
| -------------- | ------------------------------------------------------------------- | ---------------- | --------------- |
| Auth Events    | user:registered, user:login, user:logout                            | Auth Service     | Admin, Payments |
| Payment Events | payment:created, payment:updated, payment:completed, payment:failed | Payments Service | Admin, Auth     |
| Admin Events   | audit:created, config:updated                                       | Admin Service    | All             |

### Current Limitations (To Fix in POC-3)

1. **No Message Persistence** - Messages lost if subscriber offline
2. **No Guaranteed Delivery** - Fire-and-forget pattern
3. **No Dead Letter Queue** - Failed messages discarded
4. **No Retry Mechanism** - No automatic retries
5. **No Message Ordering** - No ordering guarantees
6. **No Event Versioning** - No schema evolution support

### Migration to RabbitMQ

**Benefits:**

- Message persistence
- Guaranteed delivery with acknowledgments
- Dead letter queues for failed messages
- Retry mechanism with exponential backoff
- Event versioning support

---

## 4. API Gateway Proxy Status

### Current Status: DEFERRED

**Issue:** Request body not forwarded correctly through proxy

**Failed Attempts in POC-2:**

1. `http-proxy-middleware` v3.x - Path rewriting issues
2. Body parser order fixes - Partial success
3. Custom axios proxy - Request abort issues

### Current Workaround

Frontend applications call backend services directly:

| Frontend Component      | Direct URL              | Target Service   |
| ----------------------- | ----------------------- | ---------------- |
| `shared-api-client`     | `http://localhost:3001` | Auth Service     |
| `payments-mfe`          | `http://localhost:3002` | Payments Service |
| `admin-mfe` (admin)     | `http://localhost:3003` | Admin Service    |
| `admin-mfe` (dashboard) | `http://localhost:3002` | Payments Service |

### POC-3 Solution

**Recommended:** Node.js native http proxy with streaming

- No body buffering
- Direct stream piping
- Full header forwarding

---

## 5. Direct Service URLs in Frontend

### Complete Inventory

#### libs/shared-api-client/src/lib/apiClient.ts

```typescript
const baseURL = config.baseURL ?? envBaseURL ?? 'http://localhost:3001';
```

**Target:** Auth Service  
**Action:** Update to use API Gateway via nginx

#### apps/payments-mfe/src/api/payments.ts

```typescript
baseURL: envBaseURL ?? 'http://localhost:3002',
```

**Target:** Payments Service  
**Action:** Update to use API Gateway via nginx

#### apps/admin-mfe/src/api/adminApiClient.ts

```typescript
baseURL: 'http://localhost:3003/api',
refreshURL: 'http://localhost:3001',
```

**Target:** Admin Service, Auth Service  
**Action:** Update to use API Gateway via nginx

#### apps/admin-mfe/src/api/dashboard.ts

```typescript
baseURL: 'http://localhost:3002/api',
refreshURL: 'http://localhost:3001',
```

**Target:** Payments Service, Auth Service  
**Action:** Update to use API Gateway via nginx

#### apps/admin-service/src/controllers/system-health.controller.ts

```typescript
checkServiceHealth('http://localhost:3001'), // Auth Service
checkServiceHealth('http://localhost:3002'), // Payments Service
checkServiceHealth('http://localhost:3004'), // Profile Service
```

**Target:** Health checks  
**Action:** Update to use service discovery or env vars

### POC-3 Target Configuration

All frontend apps should use nginx proxy URL:

```typescript
// Development
baseURL: 'https://localhost/api';

// Production (example)
baseURL: 'https://api.example.com';
```

---

## 6. Infrastructure Components

### Current Docker Compose Services

| Service  | Image          | Port | Purpose             |
| -------- | -------------- | ---- | ------------------- |
| postgres | postgres:16    | 5432 | Shared database     |
| redis    | redis:7-alpine | 6379 | Event hub (Pub/Sub) |

### POC-3 Docker Compose Services (Target)

| Service     | Image                 | Port(s)     | Purpose           |
| ----------- | --------------------- | ----------- | ----------------- |
| nginx       | nginx:latest          | 80, 443     | Reverse proxy     |
| auth_db     | postgres:16           | 5432        | Auth database     |
| payments_db | postgres:16           | 5433        | Payments database |
| admin_db    | postgres:16           | 5434        | Admin database    |
| profile_db  | postgres:16           | 5435        | Profile database  |
| rabbitmq    | rabbitmq:3-management | 5672, 15672 | Event hub         |
| redis       | redis:7-alpine        | 6379        | Caching only      |

---

## 7. Configuration Files to Update

### Backend Services

| File                                        | Changes Needed                     |
| ------------------------------------------- | ---------------------------------- |
| `apps/auth-service/src/config/index.ts`     | Database URL, RabbitMQ URL         |
| `apps/payments-service/src/config/index.ts` | Database URL, RabbitMQ URL         |
| `apps/admin-service/src/config/index.ts`    | Database URL, RabbitMQ URL         |
| `apps/profile-service/src/config/index.ts`  | Database URL, RabbitMQ URL         |
| `apps/api-gateway/src/config/index.ts`      | Service URLs (internal), nginx URL |

### Frontend Applications

| File                                          | Changes Needed         |
| --------------------------------------------- | ---------------------- |
| `libs/shared-api-client/src/lib/apiClient.ts` | Use nginx URL          |
| `apps/payments-mfe/src/api/payments.ts`       | Use nginx URL          |
| `apps/admin-mfe/src/api/adminApiClient.ts`    | Use nginx URL          |
| `apps/admin-mfe/src/api/dashboard.ts`         | Use nginx URL          |
| `apps/shell/rspack.config.js`                 | Update NX_API_BASE_URL |
| `apps/auth-mfe/rspack.config.js`              | Update NX_API_BASE_URL |
| `apps/payments-mfe/rspack.config.js`          | Update NX_API_BASE_URL |
| `apps/admin-mfe/rspack.config.js`             | Update NX_API_BASE_URL |

### Infrastructure

| File                 | Changes Needed        |
| -------------------- | --------------------- |
| `docker-compose.yml` | Add all new services  |
| `.env.example`       | Add all new variables |
| `.env.required`      | Add all new variables |

---

## 8. Test Coverage Status

### Backend Test Coverage

| Service          | Coverage | Tests     |
| ---------------- | -------- | --------- |
| Auth Service     | 98.94%   | 78 tests  |
| Payments Service | 92.72%   | 50+ tests |
| Admin Service    | 77.85%   | 30+ tests |
| Profile Service  | 81.6%    | 22 tests  |
| Event Hub        | 98.36%   | 22 tests  |

### Frontend Test Coverage

| Component     | Coverage | Tests     |
| ------------- | -------- | --------- |
| API Client    | 88.88%   | 86+ tests |
| Event Bus     | 100%     | 14 tests  |
| Design System | 100%     | 15 tests  |
| Auth Store    | 93.65%   | 20 tests  |

**Total Tests:** 380+  
**Coverage Target:** 70%+ (met)

---

## 9. Migration Priority

### High Priority (Must Have)

1. **Separate Databases** - Core architectural change
2. **RabbitMQ Event Hub** - Reliability requirement
3. **API Gateway Proxy** - Fix deferred issue
4. **nginx Reverse Proxy** - Production requirement

### Medium Priority (Should Have)

5. **WebSocket** - Real-time updates
6. **Caching** - Performance improvement
7. **Observability** - Monitoring and debugging

### Lower Priority (Nice to Have)

8. **Session Management** - Enhanced UX
9. **GraphQL** - Optional API enhancement

---

## 10. Verification Checklist

- [x] POC-2 completion documented
- [x] Shared database usages identified (4 services)
- [x] Redis Pub/Sub usages identified (event-hub library)
- [x] API Gateway proxy issue documented
- [x] Direct service URLs listed (4 frontend locations)
- [x] Configuration files identified
- [x] Test coverage documented
- [x] Migration priorities defined

---

**Last Updated:** 2026-12-10  
**Status:** Complete  
**Next Steps:** Use this inventory for Phase 1.1.2 (Database Migration Strategy)
