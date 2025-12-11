# POC-3 Implementation Continuation - Start Prompt

**Date:** 2026-12-11  
**Phase:** Phase 5 - Advanced Caching & Performance  
**Status:** Ready to Continue  
**Overall Progress:** 50% (4 of 8 phases complete)

---

## Context

POC-3 implementation is **50% complete** with Phases 1-4 fully finished. All infrastructure, backend migrations, and WebSocket real-time features are operational. **Major integration bugs have been resolved** (Dec 11, 2026), and the system is now fully functional end-to-end. We are ready to begin **Phase 5: Advanced Caching & Performance**.

**Important:** All previous work is committed and documented. The repository is in a stable state with all builds passing, frontend fully integrated with backend.

---

## Current State

### Completed Phases (50% - 34/52 sub-tasks)

#### Phase 1: Planning & Architecture Review (100% - 12/12 sub-tasks)

- Complete planning and architecture documentation
- Database migration strategy with separate schemas per service
- RabbitMQ event hub migration strategy (zero-coupling pattern)
- API Gateway proxy implementation design
- nginx reverse proxy configuration design
- WebSocket architecture design
- All ADRs documented
- Docker Compose updated with all POC-3 services
- Environment variable templates created

#### Phase 2: Infrastructure Setup (100% - 9/9 sub-tasks)

- Production-ready nginx reverse proxy with SSL/TLS, rate limiting, security headers
- 4 separate PostgreSQL databases (auth_db, payments_db, admin_db, profile_db)
- RabbitMQ event hub with topic exchange, queues, and dead-letter queue
- Complete Docker Compose infrastructure (8 services running healthy)
- 25+ package.json scripts for infrastructure management

#### Phase 3: Backend Infrastructure Migration (100% - 9/9 sub-tasks)

- Database migration: 4 separate databases with data migrated, zero coupling maintained
- RabbitMQ event hub: Production-ready library with 2409 msg/sec throughput, reliability tested
- API Gateway: Streaming HTTP proxy with all service routes enabled
- Frontend integration: All MFEs updated to use API Gateway via nginx
- Zero-coupling pattern: Services communicate only via RabbitMQ events

#### Phase 4: WebSocket & Real-Time Features (100% - 4/4 sub-tasks)

- WebSocket Server: Production-ready with JWT auth, connection management, room-based messaging, heartbeat
- RabbitMQ Integration: Event bridge forwarding events to WebSocket clients via rooms
- WebSocket Client Library: Complete React library with hooks, reconnection, TanStack Query integration
- MFE Integration: Real-time updates in Payments and Admin MFEs, automatic query invalidation

### 📋 Next Phase: Phase 5 - Advanced Caching & Performance (0%)

**Sub-tasks:**

- Task 5.1: Service Worker Implementation (1 sub-task)
- Task 5.2: Redis Caching (Backend) (2 sub-tasks)
- Task 5.3: CDN Configuration (1 sub-task)

**Total:** 4 sub-tasks

### 🔜 Remaining Phases

- **Phase 6:** Observability & Monitoring (0% - 5 sub-tasks)
- **Phase 7:** Session Management (0% - 3 sub-tasks)
- **Phase 8:** Integration, Testing & Documentation (0% - 5 sub-tasks)

---

## Critical Rules to Follow

1. **Follow `.cursorrules` strictly** - All rules apply, especially:
   - NO throw-away code
   - Never use `any` type
   - Always use Tailwind v4 syntax (CRITICAL: v4 only, never v3)
   - Fix type errors immediately
   - Write tests alongside code (70% coverage minimum)

2. **MANDATORY Documentation Updates:**
   - After EACH task/sub-task completion, update BOTH:
     - `docs/POC-3-Implementation/task-list.md`
     - `docs/POC-3-Implementation/implementation-plan.md`
   - Mark checkboxes `[x]`, set Status "Complete", add date, add comprehensive notes
   - **NON-NEGOTIABLE** - Must be done immediately, before moving to next task

3. **Granular Steps:**
   - Follow `docs/POC-3-Implementation/implementation-plan.md` for detailed step-by-step instructions
   - Each sub-task should be small, testable, and verifiable
   - Ask for confirmation before proceeding to next task

4. **No Automatic Implementation:**
   - Only perform tasks explicitly requested
   - If a related task seems helpful, ask for confirmation with clear description
   - Wait for user approval before moving to next task

5. **Verification:**
   - Complete all verification checklist items
   - Meet all acceptance criteria
   - Test and verify before marking complete
   - Ensure builds pass before committing

---

## First Task: Phase 5.1.1 - Create Service Worker with Workbox

**Objective:** Implement service worker for offline support and asset caching

**Reference Documents:**

- `docs/POC-3-Implementation/implementation-plan.md` - Sub-task 5.1.1 (around line 3264+)
- `docs/POC-3-Implementation/task-list.md` - Task 5.1.1 (around line 665+)

**Key Requirements:**

- Install Workbox packages (workbox-core, workbox-precaching, workbox-routing, workbox-strategies, workbox-expiration)
- Create service worker configuration
- Implement precaching for static assets
- Implement runtime caching strategies
- Add offline support
- Register service worker in Shell app
- Verify caching functionality

**Detailed Steps:**

1. Read task details in `implementation-plan.md` (Sub-task 5.1.1)
2. Install Workbox packages via pnpm
3. Create service worker configuration file
4. Configure precaching for static assets
5. Configure runtime caching strategies (NetworkFirst, CacheFirst, StaleWhileRevalidate)
6. Add offline fallback page
7. Register service worker in Shell app bootstrap
8. Test caching functionality
9. Update documentation (task-list.md and implementation-plan.md)

**Verification Checklist:**

- [ ] Workbox installed
- [ ] SW config created
- [ ] Precaching works
- [ ] Runtime caching works
- [ ] Offline works
- [ ] SW registered
- [ ] Caching verified

**Acceptance Criteria:**

- Service worker operational with Workbox
- Static assets precached
- Runtime caching strategies working
- Offline support functional

---

## Implementation Workflow

For each task:

1. **Read the task details** in `implementation-plan.md`
2. **Understand the requirements** and verification checklist
3. **Implement the task** step-by-step
4. **Test and verify** using verification checklist
5. **Update documentation** (task-list.md and implementation-plan.md) - MANDATORY
6. **Commit changes** with descriptive message
7. **Ask for confirmation** before proceeding to next task

---

## Key Reference Documents

### Primary Documentation

- **Implementation Plan:** `docs/POC-3-Implementation/implementation-plan.md`
- **Task List:** `docs/POC-3-Implementation/task-list.md`
- **Project Rules:** `.cursorrules` and `docs/POC-3-Implementation/project-rules-cursor.md`
- **Testing Guide:** `docs/POC-3-Implementation/testing-guide.md`

### Architecture & Strategy Documents

- **Database Migration:** `docs/POC-3-Implementation/database-migration-strategy.md`
- **Event Hub Migration:** `docs/POC-3-Implementation/event-hub-migration-strategy.md`
- **nginx Configuration:** `docs/POC-3-Implementation/nginx-configuration-design.md`
- **WebSocket Architecture:** `docs/POC-3-Implementation/websocket-architecture.md`
- **Model Selection:** `docs/POC-3-Implementation/model-selection-strategy.md`

### ADRs

- `docs/adr/backend/poc-3/` - Backend architecture decisions
- `docs/adr/poc-3/` - General POC-3 decisions

---

## Tech Stack Summary

**Frontend:**

- React 19.2.0, Nx, Rspack (HMR + Module Federation v2)
- React Router 7.x, Zustand 4.5.x, TanStack Query 5.x
- React Hook Form 7.52.x + Zod 3.23.x
- Tailwind CSS 4.0+ (CRITICAL: v4 syntax only)
- shadcn/ui, Axios 1.7.x
- Jest 30.x + React Testing Library 16.1.x, Playwright
- pnpm 9.x, TypeScript 5.9.x (strict)

**Backend:**

- Node.js 24.11.x LTS, Express
- PostgreSQL (4 separate databases), Prisma ORM
- Redis (caching only), RabbitMQ (event hub)
- JWT authentication

**Infrastructure:**

- nginx reverse proxy (SSL/TLS, rate limiting)
- Docker Compose (8 services)
- WebSocket server (ws library)

---

## Project Structure

```
apps/
  shell/              - Host MFE (port 4200)
  auth-mfe/           - Auth MFE (port 4201)
  payments-mfe/       - Payments MFE (port 4202)
  admin-mfe/          - Admin MFE (port 4203)
  api-gateway/        - API Gateway (port 3000)
  auth-service/       - Auth Service (port 3001)
  payments-service/   - Payments Service (port 3002)
  admin-service/      - Admin Service (port 3003)
  profile-service/    - Profile Service (port 3004)

libs/
  shared-websocket/   - WebSocket client library
  shared-api-client/   - API client with interceptors
  shared-event-bus/    - Inter-MFE event bus
  shared-auth-store/   - Zustand auth store
  shared-design-system/ - shadcn/ui components
  backend/rabbitmq-event-hub/ - RabbitMQ event hub library

nginx/                - nginx configuration
rabbitmq/             - RabbitMQ definitions
```

---

## Success Criteria

- Each task completed per implementation plan
- All verification checklist items completed
- All acceptance criteria met
- Documentation updated immediately after each task (MANDATORY)
- Tests written alongside code (70%+ coverage)
- No TypeScript errors
- No `any` types
- Tailwind v4 syntax used (never v3)
- All builds pass
- User confirmation obtained before next task

---

## Recent Commits Context

The following major features have been implemented and committed:

### Latest Integration Fixes (Dec 11, 2026)

**Commit:** `7d7b76f` - Add WebSocketProvider to Admin and Payments MFEs for standalone mode

- Fixed "useWebSocketContext must be used within WebSocketProvider" error
- Admin and Payments MFEs now support standalone mode with full WebSocket functionality
- Both MFEs remain compatible with shell mode via Module Federation

**Commit:** `5b4f43f` - Fix database migration: implement service-specific Prisma clients and resolve integration issues

- **Backend fixes:**
  - Migrated all services from shared `@prisma/client` to service-specific Prisma clients
  - Fixed Prisma client imports with dynamic `require()` using `process.cwd()` paths
  - Fixed database schema mismatches in denormalized tables
  - Updated API Gateway proxy path rewriting for correct service routing
  - Added audit-logs stub endpoint to Admin Service
  - Fixed Admin Service user creation with explicit id, timestamps, emailVerified
  - All CRUD operations working in Admin User Management tab

- **Frontend fixes:**
  - Updated all MFE rspack configs with correct `NX_API_BASE_URL` for development
  - Changed WebSocket URL from `wss://localhost/ws` to `ws://localhost:3000/ws`
  - Updated API client baseURL from `https://localhost/api` to `http://localhost:3000/api`
  - Added `shared-websocket` to Module Federation shared dependencies for all MFEs
  - Fixed WebSocketProvider to only connect when token is available
  - Fixed payments MFE API client to avoid double `/payments` in URL

**Current System State:**

- ✅ Shell (http://localhost:4200) - Fully operational with all remote MFEs integrated
- ✅ Standalone MFEs - All working (Admin: 4203, Payments: 4202, Auth: 4201)
- ✅ Backend services - All operational with correct database clients
- ✅ API Gateway routing - All services proxied correctly
- ✅ WebSocket real-time updates - Operational across all MFEs
- ✅ Event bus - Inter-MFE communication working
- ⚠️ HTTPS/SSL - Temporarily disabled (self-signed certificates pending)

### Previously Completed Features

1. **WebSocket Infrastructure** (Phase 4)
   - WebSocket server with JWT authentication
   - RabbitMQ event bridge for real-time updates
   - WebSocket client library with React hooks
   - Real-time updates integrated into MFEs

2. **API Gateway Proxy** (Phase 3)
   - Streaming HTTP proxy implementation
   - All service routes enabled
   - Frontend updated to use API Gateway

3. **Database Migration** (Phase 3)
   - 4 separate databases per service
   - Data migration completed
   - Zero-coupling pattern maintained

4. **Infrastructure** (Phase 2)
   - nginx reverse proxy with SSL/TLS
   - RabbitMQ event hub
   - Docker Compose with 8 services

---

## Ready to Begin

**Next Task:** Sub-task 5.1.1: Create Service Worker with Workbox

Please start by reading the detailed instructions in `docs/POC-3-Implementation/implementation-plan.md` for Sub-task 5.1.1, then proceed with the implementation.

**Remember:**

- Update documentation immediately after completion
- Test thoroughly before marking complete
- Ask for confirmation before proceeding to next task
- Follow all `.cursorrules` strictly

---
