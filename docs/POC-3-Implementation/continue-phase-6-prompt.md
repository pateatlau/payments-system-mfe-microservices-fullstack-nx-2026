# POC-3 Phase 6 Continuation Prompt

**Project:** Payments System MFE with Microservices  
**Current Phase:** Phase 6 - Observability & Monitoring  
**Status:** Sub-tasks 6.1.1 & 6.1.2 Complete (Sentry Integration)  
**Next Task:** Sub-task 6.2.1 - Add Prometheus Metrics

---

## Context

You are continuing the POC-3 implementation of a production-ready payments system using Micro-Frontend (MFE) architecture with Module Federation v2.

**Completed:**

- ✅ Phase 1-5: Infrastructure, database separation, RabbitMQ migration, WebSocket, caching
- ✅ Sub-task 6.1.1: Sentry backend integration (all 5 services)
- ✅ Sub-task 6.1.2: Sentry frontend integration (all 4 apps)
- ✅ **FIXED:** Backend module resolution issue - changed serve targets to run from `dist/` instead of `tmp/`

**Current State:**

- All 5 backend services (API Gateway, Auth, Payments, Admin, Profile) are running successfully
- Sentry integration working in both backend and frontend
- Services use `nx:run-commands` executor to run directly from `dist/apps/{service}/main.js`

---

## Next Task: Sub-task 6.2.1 - Add Prometheus Metrics

**Objective:** Add Prometheus metrics collection to all backend services

**Key Requirements:**

1. Install Prometheus client libraries (`prom-client`)
2. Create metrics collection library (`libs/backend/observability/src/lib/prometheus.ts`)
3. Expose `/metrics` endpoint on all backend services
4. Track key metrics:
   - HTTP request duration (histogram)
   - HTTP request count (counter)
   - Active connections (gauge)
   - Error rates (counter)
   - Database query duration (histogram)
   - Cache hit/miss rates (counter)
5. Integrate with existing observability library
6. Update all 5 backend services to expose metrics endpoint

**Reference Files:**

- `docs/POC-3-Implementation/implementation-plan.md` (lines 4233-4417 for Sub-task 6.2.1)
- `docs/POC-3-Implementation/task-list.md` (Sub-task 6.2.1 section)
- `libs/backend/observability/src/lib/sentry.ts` (reference for integration pattern)

**Important Notes:**

- Follow the same pattern as Sentry integration (centralized library, service-specific initialization)
- Metrics endpoint should be accessible at `/metrics` on each service
- Use `prom-client` package (standard Prometheus client for Node.js)
- Ensure metrics don't impact performance (use efficient collection)
- Update `libs/backend/observability/src/index.ts` to export Prometheus functions

**After Completion:**

1. Update `task-list.md` - mark Sub-task 6.2.1 as complete with notes
2. Update `implementation-plan.md` - mark verification checkboxes and acceptance criteria
3. Test all services respond to `/metrics` endpoint
4. Commit changes with descriptive message

---

## Quick Start Commands

```bash
# Verify all services are running
pnpm backend:status

# Test metrics endpoint (after implementation)
curl http://localhost:3001/metrics  # Auth Service
curl http://localhost:3002/metrics  # Payments Service
curl http://localhost:3003/metrics  # Admin Service
curl http://localhost:3004/metrics  # Profile Service
curl http://localhost:3000/metrics  # API Gateway
```

---

**Ready to continue Phase 6: Observability & Monitoring!**
