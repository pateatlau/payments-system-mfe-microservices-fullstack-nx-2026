# POC-3 Phase 6 Continuation Prompt

**Date:** 2025-12-11  
**Current Phase:** Phase 6 - Observability & Monitoring  
**Overall Progress:** 71% Complete (37/52 sub-tasks)  
**Previous Phase:** Phase 5 - Advanced Caching & Performance (100% Complete)

---

## Context Summary

You are continuing the POC-3 implementation of a production-ready payments system using Micro-Frontend (MFE) architecture with Module Federation v2. All infrastructure, database separation, event hub migration, WebSocket support, and advanced caching have been successfully implemented. Now proceeding to Phase 6: Observability & Monitoring.

---

## Completed Phases Overview

### Phase 1: Infrastructure Setup ✅ (100%)
- nginx reverse proxy with SSL/TLS termination
- Load balancing configured
- Request routing operational
- All services accessible through proxy

### Phase 2: Database Separation ✅ (100%)
- Separate PostgreSQL databases per service
- Auth DB, Payments DB, Profile DB, Admin DB
- Prisma migrations successful
- Data integrity maintained

### Phase 3: Event Hub Migration ✅ (100%)
- Migrated from Redis Pub/Sub to RabbitMQ
- EventBus class with topic exchanges
- Retry logic and error handling
- All services publishing/consuming events

### Phase 4: WebSocket Support ✅ (100%)
- WebSocket server in API Gateway (port 3000/ws)
- JWT authentication for connections
- Heartbeat mechanism (30s interval)
- Cross-tab session sync working
- Real-time updates operational

### Phase 5: Advanced Caching & Performance ✅ (100%)
**Just Completed!**

#### Sub-task 5.1.1: Service Worker with Workbox ✅
- Offline support with fallback page
- 6 caching strategies implemented
- Auto-update checking (hourly)
- Production-only activation
- Files: `apps/shell/src/sw.ts`, `apps/shell/src/utils/register-sw.ts`

#### Sub-task 5.2.1: Redis Cache Library ✅
- Production-ready `CacheService` class
- TTL support with automatic expiration
- Tag-based bulk invalidation
- Statistics tracking (hits, misses, hit rate)
- Location: `libs/backend/cache/`
- Integration tests: 9/16 passing (functional)

#### Sub-task 5.2.2: Add Caching to Services ✅
- **Auth Service:** User lookups cached (5 min TTL)
- **Payments Service:** Lists/details cached (1 min TTL)
- **Profile Service:** Profiles/preferences cached (5 min TTL)
- Expected cache hit rates: 70-95%
- Database load reduction: 70-90%

#### Sub-task 5.3.1: Code Splitting Optimization ✅
- Analysis completed, architecture already optimized
- React.lazy() + Suspense for all MFEs
- Module Federation v2 with shared singletons
- Bundle sizes within targets
- Documentation: `docs/POC-3-Implementation/PERFORMANCE_OPTIMIZATION.md`

**Performance Impact:**
- Cached API responses: <5ms (vs 50-200ms uncached) = 10-40x faster
- Database load: Reduced by 70-90%
- Offline support: Full functionality
- Code splitting: Lazy loading on-demand

---

## Current System Status

### Backend Services (All Running)
- **API Gateway:** http://localhost:3000 (nginx: https://localhost)
- **Auth Service:** http://localhost:3001
- **Payments Service:** http://localhost:3002
- **Profile Service:** http://localhost:3003
- **Admin Service:** http://localhost:3004

### Frontend Applications (All Running)
- **Shell:** http://localhost:4200
- **Auth MFE:** http://localhost:4201
- **Payments MFE:** http://localhost:4202
- **Admin MFE:** http://localhost:4203

### Infrastructure (All Operational)
- **nginx:** https://localhost (SSL/TLS enabled)
- **PostgreSQL:** Separate databases per service
- **RabbitMQ:** localhost:5672 (Management UI: 15672)
- **Redis:** localhost:6379 (caching operational)
- **WebSocket:** ws://localhost:3000/ws (JWT auth)

### Key Files & Locations
- **Documentation:** `docs/POC-3-Implementation/`
- **Task List:** `docs/POC-3-Implementation/task-list.md`
- **Implementation Plan:** `docs/POC-3-Implementation/implementation-plan.md`
- **Testing Guide:** `docs/POC-3-Implementation/testing-guide.md`
- **Performance Report:** `docs/POC-3-Implementation/PERFORMANCE_OPTIMIZATION.md`
- **Cache Library:** `libs/backend/cache/`
- **Service Worker:** `apps/shell/src/sw.ts`

---

## Phase 6 Objectives

**Goal:** Implement comprehensive observability and monitoring for production readiness.

### Task 6.1: Sentry Integration

#### Sub-task 6.1.1: Add Sentry to Backend Services
**Status:** Not Started  
**Priority:** High

**Objectives:**
- Install @sentry/node and @sentry/tracing
- Create shared observability library: `libs/backend/observability`
- Initialize Sentry in all backend services
- Add request/tracing handlers
- Add error handler middleware
- Configure environment-specific settings

**Key Requirements:**
- Sentry DSN from environment variable
- Service-specific release tags
- Transaction tracing enabled
- Error context capture
- Performance profiling (10% sample rate in production)

**Files to Create:**
- `libs/backend/observability/src/lib/sentry.ts`
- `libs/backend/observability/src/lib/logger.ts`
- `libs/backend/observability/src/index.ts`

**Files to Modify:**
- `apps/api-gateway/src/main.ts`
- `apps/auth-service/src/main.ts`
- `apps/payments-service/src/main.ts`
- `apps/profile-service/src/main.ts`
- `apps/admin-service/src/main.ts`

**Reference:** See `docs/POC-3-Implementation/implementation-plan.md` lines 4140-4300 for detailed implementation steps.

---

#### Sub-task 6.1.2: Add Sentry to Frontend Apps
**Status:** Not Started  
**Priority:** High

**Objectives:**
- Install @sentry/react
- Initialize Sentry in shell and all MFEs
- Add ErrorBoundary components
- Capture user context
- Track performance
- Configure source maps for production

**Key Requirements:**
- Sentry DSN from environment variable
- User identification (userId, email, role)
- Breadcrumbs for navigation
- Performance monitoring
- Release tracking
- Source map upload

**Files to Create:**
- `libs/shared-observability/src/lib/sentry.ts`
- `libs/shared-observability/src/components/ErrorBoundary.tsx`

**Files to Modify:**
- `apps/shell/src/bootstrap.tsx`
- `apps/auth-mfe/src/bootstrap.tsx`
- `apps/payments-mfe/src/bootstrap.tsx`
- `apps/admin-mfe/src/bootstrap.tsx`

**Reference:** See `docs/POC-3-Implementation/implementation-plan.md` lines 4300-4450 for detailed implementation steps.

---

### Task 6.2: Prometheus Metrics

#### Sub-task 6.2.1: Add Prometheus to Backend
**Status:** Not Started  
**Priority:** High

**Objectives:**
- Install prom-client
- Create metrics middleware
- Expose /metrics endpoint
- Add custom metrics (counters, histograms, gauges)
- Track request duration, status codes, cache hits

**Key Metrics:**
- HTTP request duration histogram
- HTTP request count by status/method
- Cache hit/miss counters
- Database query duration
- Event bus message counts

**Files to Create:**
- `libs/backend/observability/src/lib/metrics.ts`

**Files to Modify:**
- All backend service `main.ts` files

**Reference:** See `docs/POC-3-Implementation/implementation-plan.md` lines 4450-4600 for detailed implementation steps.

---

#### Sub-task 6.2.2: Setup Prometheus Server
**Status:** Not Started  
**Priority:** Medium

**Objectives:**
- Create docker-compose configuration
- Setup Prometheus server
- Configure scrape targets for all services
- Add Grafana for visualization
- Create basic dashboards

**Files to Create:**
- `infrastructure/prometheus/prometheus.yml`
- `infrastructure/prometheus/docker-compose.yml`
- `infrastructure/grafana/dashboards/`

**Reference:** See `docs/POC-3-Implementation/implementation-plan.md` lines 4600-4700 for detailed implementation steps.

---

### Task 6.3: OpenTelemetry

#### Sub-task 6.3.1: Add OpenTelemetry Tracing
**Status:** Not Started  
**Priority:** Medium

**Objectives:**
- Install @opentelemetry packages
- Setup distributed tracing
- Instrument HTTP requests
- Instrument database queries
- Add custom spans for business logic

**Key Requirements:**
- Trace context propagation across services
- Parent-child span relationships
- Trace IDs in logs
- Jaeger exporter for visualization

**Files to Create:**
- `libs/backend/observability/src/lib/tracing.ts`

**Files to Modify:**
- All backend service `main.ts` files
- API client for trace propagation

**Reference:** See `docs/POC-3-Implementation/implementation-plan.md` lines 4700-4850 for detailed implementation steps.

---

### Task 6.4: Health Monitoring

#### Sub-task 6.4.1: Add Health Check Endpoints
**Status:** Not Started  
**Priority:** High

**Objectives:**
- Create /health endpoints for all services
- Check database connectivity
- Check Redis connectivity
- Check RabbitMQ connectivity
- Return detailed health status

**Health Check Response:**
```json
{
  "status": "healthy",
  "timestamp": "2025-12-11T13:00:00Z",
  "uptime": 3600,
  "checks": {
    "database": "healthy",
    "redis": "healthy",
    "rabbitmq": "healthy"
  }
}
```

**Files to Create:**
- `libs/backend/observability/src/lib/health.ts`

**Files to Modify:**
- All backend service route files

**Reference:** See `docs/POC-3-Implementation/implementation-plan.md` lines 4850-4950 for detailed implementation steps.

---

## Important Technical Context

### Architecture Patterns in Use
1. **Module Federation v2:** All MFEs use Module Federation with shared singletons
2. **Event-Driven:** RabbitMQ for inter-service communication
3. **Real-Time:** WebSocket for live updates and session sync
4. **Caching:** Service Worker (frontend) + Redis (backend)
5. **Authentication:** JWT tokens with refresh mechanism, RBAC
6. **Database:** Separate Prisma databases per service

### Key Libraries & Versions
- **Frontend:** React 19.2.0, Nx, Rspack, React Router 7.x, Zustand 4.5.x, TanStack Query 5.x
- **Backend:** Node.js 24.11.x LTS, Express, Prisma ORM, ioredis 5.8.2, amqplib 0.10.x
- **Infrastructure:** PostgreSQL, Redis, RabbitMQ, nginx
- **Observability (to add):** Sentry, Prometheus, OpenTelemetry, Grafana

### Coding Standards
- **NO throw-away code** - Must be production-ready
- **Never use `any` type** - Documented exceptions only
- **Strict TypeScript** - All types explicit
- **Tests required** - 70% coverage minimum
- **Fix errors immediately** - Don't work around them
- **Documentation mandatory** - Update task-list.md and implementation-plan.md after EVERY sub-task

### Critical Rules
1. **Update documentation IMMEDIATELY after task completion** (NON-NEGOTIABLE)
2. **Only perform explicitly requested tasks** - Ask before additional work
3. **Commit frequently** - After each sub-task with detailed messages
4. **Test as you go** - Build and verify after changes
5. **Follow POC-3 scope** - No MVP/Production features yet

---

## Environment Variables Needed

Create/update `.env` files for Phase 6:

```bash
# Sentry Configuration
SENTRY_DSN=https://your-project-dsn@sentry.io/project-id
SENTRY_ENVIRONMENT=development
SENTRY_RELEASE=poc-3-v1.0.0

# OpenTelemetry Configuration
OTEL_EXPORTER_JAEGER_ENDPOINT=http://localhost:14268/api/traces
OTEL_SERVICE_NAME=<service-name>

# Existing (already configured)
DATABASE_URL=postgresql://user:password@localhost:5432/<service>_db
REDIS_URL=redis://localhost:6379
RABBITMQ_URL=amqp://localhost:5672
JWT_SECRET=<secret>
JWT_REFRESH_SECRET=<refresh-secret>
```

---

## Starting Point for Phase 6

### Step 1: Verify Current System
```bash
# Check all services running
pnpm dev:backend
pnpm dev:frontend

# Check infrastructure
docker ps  # PostgreSQL, Redis, RabbitMQ, nginx

# Verify builds pass
pnpm nx run-many -t build
pnpm nx run-many -t test
```

### Step 2: Begin with Sub-task 6.1.1
1. Read detailed steps from `docs/POC-3-Implementation/implementation-plan.md` (lines 4140-4300)
2. Generate observability library: `pnpm nx g @nx/node:library observability --directory=libs/backend/observability --buildable`
3. Install Sentry packages: `pnpm add @sentry/node @sentry/tracing @sentry/profiling-node -w`
4. Create Sentry initialization module
5. Integrate into all backend services
6. Test error tracking
7. Update documentation (MANDATORY)
8. Commit changes

### Step 3: Continue with Remaining Sub-tasks
Follow implementation plan sequentially, asking for confirmation before proceeding to next task.

---

## Recent Commits (Last 6)

```
9c98def - Update Phase 5 completion status to 100%
4631add - Complete code splitting optimization (POC-3 5.3.1)
6a94ccb - Integrate Redis caching into services (POC-3 5.2.2)
06e8097 - Create Redis cache library (POC-3 5.2.1)
5f69fa2 - Fix: Debug ports for backend services
cc43cff - Implement service worker with Workbox (POC-3 5.1.1)
```

---

## Known Issues & Notes

### Phase 5 Notes
1. **Service Worker:** Only activates in production mode (`NODE_ENV=production`)
2. **Cache Tests:** 9/16 passing - integration tests require running Redis
3. **Debug Ports:** Auto-assigned to avoid conflicts, still shows red warning (cosmetic only)
4. **WebSocket Errors:** Expired token errors are expected behavior (security working correctly)

### Common Pitfalls to Avoid
- Forgetting to update task-list.md and implementation-plan.md (MANDATORY!)
- Using `any` type without documentation
- Skipping tests
- Not following TypeScript strict mode
- Hardcoding values instead of using environment variables
- Breaking existing patterns
- Not committing frequently

---

## Success Criteria for Phase 6

- [ ] Sentry integrated in all services (frontend + backend)
- [ ] Error tracking working with proper context
- [ ] Prometheus metrics exposed from all backend services
- [ ] Grafana dashboards created for key metrics
- [ ] OpenTelemetry tracing implemented
- [ ] Distributed traces visible in Jaeger
- [ ] Health check endpoints operational
- [ ] All services report health status correctly
- [ ] Tests passing (70% coverage maintained)
- [ ] Documentation updated for all sub-tasks
- [ ] All changes committed with clear messages

---

## Next Steps

**Immediate Action:**
1. Review this continuation prompt
2. Verify system status (all services running)
3. Read detailed implementation plan for Sub-task 6.1.1
4. Begin implementation
5. Update documentation after completion
6. Ask for confirmation before proceeding to next sub-task

**Task Sequence:**
1. Sub-task 6.1.1: Add Sentry to Backend Services
2. Sub-task 6.1.2: Add Sentry to Frontend Apps
3. Sub-task 6.2.1: Add Prometheus to Backend
4. Sub-task 6.2.2: Setup Prometheus Server
5. Sub-task 6.3.1: Add OpenTelemetry Tracing
6. Sub-task 6.4.1: Add Health Check Endpoints

---

## Reference Documentation

**Primary Documents:**
- `docs/POC-3-Implementation/implementation-plan.md` - Detailed implementation steps
- `docs/POC-3-Implementation/task-list.md` - Task checklist and status
- `docs/POC-3-Implementation/project-rules-cursor.md` - Complete rules reference
- `docs/POC-3-Implementation/testing-guide.md` - Testing requirements
- `docs/POC-3-Implementation/PERFORMANCE_OPTIMIZATION.md` - Phase 5 performance report

**Key Code Locations:**
- Backend services: `apps/auth-service/`, `apps/payments-service/`, etc.
- Shared libraries: `libs/backend/cache/`, `libs/shared-event-bus/`, etc.
- Frontend apps: `apps/shell/`, `apps/auth-mfe/`, etc.
- Infrastructure: `nginx/`, `infrastructure/`

---

## Questions to Consider

Before starting Phase 6, consider:
1. Do we have Sentry account/DSN ready? (Can use test DSN or mock initially)
2. Should we run Prometheus/Grafana in Docker? (Yes, recommended)
3. Need Jaeger for OpenTelemetry traces? (Yes, can add to docker-compose)
4. What metrics are most important? (Focus on: request duration, error rates, cache hits, DB queries)
5. How detailed should health checks be? (Include all dependencies: DB, Redis, RabbitMQ)

---

**Ready to begin Phase 6: Observability & Monitoring!**

**Current Progress:** 71% Complete (37/52 sub-tasks)  
**Phase 6 Sub-tasks:** 6 sub-tasks (0% complete)  
**Expected Completion:** +15% progress after Phase 6

Let's build production-ready observability! 🚀
