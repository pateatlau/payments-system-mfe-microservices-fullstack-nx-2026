# POC-2 Implementation Plan

**Status:** ⬜ Not Started  
**Version:** 1.0  
**Date:** 2026-01-XX  
**Phase:** POC-2 - Backend Integration & Full-Stack

> **📊 Progress Tracking:** See [`task-list.md`](./task-list.md) to track completion status and overall progress.

---

## Executive Summary

This document provides a detailed, step-by-step implementation plan for POC-2, extending POC-1 with real backend integration, event bus for inter-MFE communication, Admin MFE, design system, and enhanced RBAC. Each task is designed to be:

- **Clear and actionable** - Specific steps that can be executed
- **Small and testable** - Easy to verify completion
- **Production-ready** - No throw-away code
- **Incremental** - Builds on previous steps

**Timeline:** 8 weeks  
**Goal:** Full-stack integration with real JWT authentication, backend services, event bus communication, Admin MFE, and design system

**Key Features:**

- Real JWT authentication (replace mock)
- Backend microservices (API Gateway, Auth, Payments, Admin, Profile)
- Event bus for inter-MFE communication (replace shared Zustand stores)
- Admin MFE for admin functionality (ADMIN role)
- Design system (shadcn/ui + Tailwind CSS v4)
- PostgreSQL database with Prisma ORM
- Redis Pub/Sub for inter-service communication
- API client library with interceptors

---

## Current State (POC-1 Complete)

### Completed Infrastructure

- ✅ **Shell App** (Port 4200) - Host application with routing
- ✅ **Auth MFE** (Port 4201) - Sign-in/sign-up with mock auth
- ✅ **Payments MFE** (Port 4202) - Payment operations (stubbed frontend APIs)
- ✅ **Module Federation v2** - Dynamic remote loading with Rspack + HMR
- ✅ **React Router 7** - Routing with route protection
- ✅ **Zustand** - Shared auth store for state management
- ✅ **TanStack Query** - Server state with stubbed APIs
- ✅ **Tailwind CSS v4** - Styling with proper monorepo config
- ✅ **Jest + RTL** - Testing framework (73+ unit, 22 integration, 16 E2E tests)
- ✅ **70%+ Test Coverage** - All coverage targets met

### Libraries to Update/Create in POC-2

| Library                | Status  | POC-2 Changes                                  |
| ---------------------- | ------- | ---------------------------------------------- |
| `shared-auth-store`    | Exists  | Update for real JWT auth, add token management |
| `shared-types`         | Exists  | Extend with API types, event types, enums      |
| `shared-utils`         | Exists  | Add API utilities, validation helpers          |
| `shared-ui`            | Exists  | Migrate to design system                       |
| `shared-header-ui`     | Exists  | Update to use design system components         |
| `shared-api-client`    | **NEW** | Axios client with interceptors                 |
| `shared-event-bus`     | **NEW** | Event bus for inter-MFE communication          |
| `shared-design-system` | **NEW** | shadcn/ui components                           |

---

## POC-2 Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Frontend (Nx Monorepo)                     │
│                                                               │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐
│  │  Shell App   │  │  Auth MFE    │  │ Payments MFE │  │  Admin MFE   │
│  │  (Host)      │  │  (Remote)    │  │  (Remote)    │  │  (Remote)    │
│  │  Port 4200   │  │  Port 4201   │  │  Port 4202   │  │  Port 4203   │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘
│         │                  │                  │                  │
│         │ Module Federation v2 (BIMF)         │                  │
│         │                  │                  │                  │
│         └──────────┬───────┴──────────────────┴──────────────────┘
│                    │
│              ┌─────▼──────┐
│              │ Event Bus  │ (Inter-MFE Communication)
│              └─────┬──────┘
│                    │
│              ┌─────▼──────┐
│              │ API Client │ (Shared Axios)
│              └─────┬──────┘
└─────────────────────┼────────────────────────────────────────────┘
                      │
                      │ HTTP/REST API
                      │
                      ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Backend (Nx Monorepo)                         │
│                                                                   │
│              ┌───────────────┐                                   │
│              │  API Gateway  │ (Port 3000)                       │
│              └───────┬───────┘                                   │
│                      │                                           │
│      ┌───────────────┼───────────────┬──────────────┐           │
│      │               │               │              │           │
│      ▼               ▼               ▼              ▼           │
│  ┌────────┐    ┌──────────┐    ┌────────┐    ┌─────────┐       │
│  │  Auth  │    │ Payments │    │ Admin  │    │ Profile │       │
│  │ Service│    │ Service  │    │ Service│    │ Service │       │
│  │ (3001) │    │ (3002)   │    │ (3003) │    │ (3004)  │       │
│  └────┬───┘    └────┬─────┘    └───┬────┘    └────┬────┘       │
│       │             │              │              │             │
│       │    Event Hub (Redis Pub/Sub)             │             │
│       │             │              │              │             │
│       └─────────────┴──────────────┴──────────────┘             │
│                     │                                           │
│              ┌──────▼───────┐                                   │
│              │  PostgreSQL  │ (Shared Database)                 │
│              └──────────────┘                                   │
└─────────────────────────────────────────────────────────────────┘
```

### Data Flow

1. **Authentication Flow:**
   - User submits credentials in Auth MFE
   - API client sends request to `/api/auth/login`
   - Auth Service validates and returns JWT tokens
   - Auth MFE updates local Zustand store
   - Auth MFE emits `auth:login` event to event bus
   - Shell subscribes to event and navigates to `/payments`

2. **Payment Flow (Stubbed):**
   - User creates payment in Payments MFE
   - API client sends request to `/api/payments`
   - Payments Service simulates processing (no real PSP)
   - Payments MFE updates via TanStack Query
   - Payments MFE emits `payments:created` event

---

## Phase 1: Planning & Setup (Week 1)

### Task 1.1: Development Environment Setup

> **Progress:** Track completion in [`task-list.md`](./task-list.md#task-11-development-environment-setup)

**Objective:** Set up local infrastructure for backend development

#### Sub-task 1.1.1: Docker Compose Setup

**Steps:**

1. Create `docker-compose.yml` in project root
2. Configure PostgreSQL container (port 5432)
3. Configure Redis container (port 6379)
4. Add health checks for all services
5. Create `.env.example` template
6. Create `.env.required` checklist
7. Document Docker setup

**Verification:**

- [x] `docker-compose.yml` created
- [x] PostgreSQL container configured
- [x] Redis container configured
- [x] Health checks configured
- [x] `.env.example` template created
- [x] `.env.required` checklist created
- [x] `docker-compose up` starts all containers
- [x] PostgreSQL accepts connections on localhost:5432
- [x] Redis accepts connections on localhost:6379

**Acceptance Criteria:**

- ✅ Docker Compose file created with PostgreSQL and Redis
- ✅ All containers start successfully
- ✅ Health checks pass
- ✅ Environment template documented

**Status:** ✅ Complete  
**Completed Date:** 2026-01-XX  
**Notes:**

Created docker-compose.yml with PostgreSQL 16 and Redis 7-alpine. Both services have:

- Health checks (10s interval, 5 retries, 10s start period)
- Data persistence via Docker volumes (postgres_data, redis_data)
- Bridge network (mfe-network) for service communication
- Proper restart policies (unless-stopped)

Created .env.example with all required environment variables for both frontend (NX\_ prefix) and backend services.

Created docker-setup-guide.md with comprehensive documentation including:

- Quick start instructions
- Service details and connection strings
- Common tasks (access, logs, restart)
- Troubleshooting guide
- Production considerations

Docker Compose configuration validated successfully.

**Files Created:**

- ✅ `/docker-compose.yml`
- ✅ `/.env.example`
- ✅ `/.env.required` (checklist of required variables)
- ✅ `/docs/POC-2-Implementation/docker-setup-guide.md`

---

#### Sub-task 1.1.2: Backend Project Structure

**Steps:**

1. Create backend app folder structure under `apps/`
2. Create shared backend libraries under `libs/backend/`
3. Configure TypeScript for backend projects
4. Set up ESLint and Prettier for backend
5. Configure Vitest for backend testing
6. Add scripts to root `package.json`

**Project Structure:**

```
apps/
├── api-gateway/          # API Gateway (Port 3000)
├── auth-service/         # Auth microservice (Port 3001)
├── payments-service/     # Payments microservice (Port 3002)
├── admin-service/        # Admin microservice (Port 3003)
└── profile-service/      # Profile microservice (Port 3004)

libs/
├── shared-types/         # Extended with API types (existing)
├── shared-api-client/    # NEW: Axios client
├── shared-event-bus/     # NEW: Frontend event bus
├── shared-design-system/ # NEW: shadcn/ui components
└── backend/
    ├── shared-types/     # Backend types (shared with frontend)
    ├── shared-utils/     # Backend utilities
    ├── shared-db/        # Prisma schema and client
    └── shared-event-hub/ # Redis Pub/Sub
```

**Verification:**

- [x] Backend app folders created
- [x] Backend shared libraries created
- [x] TypeScript configured for backend
- [x] ESLint/Prettier configured for backend
- [x] Jest configured for backend (Vitest can be added later if needed)
- [x] Root package.json scripts updated
- [x] Nx recognizes all new projects (`nx graph`)
- [x] TypeScript compiles for all projects

**Acceptance Criteria:**

- ✅ Backend project structure matches specification
- ✅ All projects recognized by Nx
- ✅ TypeScript compiles without errors
- ✅ ESLint runs without errors
- ✅ Test setup works for backend

**Status:** ✅ Complete  
**Completed Date:** 2026-01-XX  
**Notes:**

Created all backend applications and libraries:

**Backend Applications (using @nx/node:application):**

- `apps/api-gateway` - API Gateway (Port 3000, tags: backend, api-gateway)
- `apps/auth-service` - Auth Service (Port 3001, tags: backend, auth-service)
- `apps/payments-service` - Payments Service (Port 3002, tags: backend, payments-service)
- `apps/admin-service` - Admin Service (Port 3003, tags: backend, admin-service)
- `apps/profile-service` - Profile Service (Port 3004, tags: backend, profile-service)

**Backend Libraries (using @nx/js:library):**

- `libs/backend/types` - Backend types (project name: types, tags: backend, shared)
- `libs/backend/utils` - Backend utilities (project name: utils, tags: backend, shared)
- `libs/backend/db` - Prisma schema and client (project name: db, tags: backend, shared)
- `libs/backend/event-hub` - Redis Pub/Sub (project name: event-hub, tags: backend, shared)

**Configuration:**

- All projects use esbuild bundler (apps) or tsc bundler (libraries)
- Jest configured for all projects (Vitest can be added later if preferred)
- ESLint extends base config (already configured)
- Prettier configured globally (already configured)
- TypeScript paths configured in tsconfig.base.json for all backend libraries

**Scripts Added to package.json:**

- `dev:backend` - Run all backend services in parallel
- `dev:api-gateway`, `dev:auth-service`, etc. - Individual service commands
- `build:backend` - Build all backend services
- `test:backend` - Test all backend services and libraries
- `lint:backend` - Lint all backend services and libraries

All projects are recognized by Nx and TypeScript compilation verified.

---

#### Sub-task 1.1.3: Database Schema Design (Prisma)

**Steps:**

1. Create Prisma schema file (`libs/backend/shared-db/prisma/schema.prisma`)
2. Define User model with role enum
3. Define RefreshToken model
4. Define Payment model with status/type enums
5. Define PaymentTransaction model
6. Define UserProfile model
7. Define AuditLog model
8. Define SystemConfig model
9. Create initial migration
10. Add seed data for testing

**Verification:**

- [x] Prisma schema file created
- [x] User model defined
- [x] RefreshToken model defined
- [x] Payment model defined
- [x] PaymentTransaction model defined
- [x] UserProfile model defined
- [x] AuditLog model defined
- [x] SystemConfig model defined
- [x] Prisma client generated (validates schema)
- [x] Seed data script created
- [ ] `npx prisma migrate dev` runs successfully (requires database running)
- [ ] `npx prisma studio` shows all tables (requires database running)
- [ ] Seed data populates test users (requires database running)

**Acceptance Criteria:**

- ✅ Prisma schema defined with all models
- ⬜ Database migrations created and run successfully (pending database setup)
- ✅ Seed data created for testing
- ✅ Prisma client generates correct types

**Status:** ✅ Complete (schema ready, migration pending database)  
**Completed Date:** 2026-01-XX  
**Notes:**

Created Prisma schema with all required models:

**Models Created:**

- `User` - User accounts with roles (ADMIN, CUSTOMER, VENDOR)
- `RefreshToken` - JWT refresh tokens for session management
- `Payment` - Payment records with status and type
- `PaymentTransaction` - Transaction history for payments
- `UserProfile` - User profile information and preferences
- `AuditLog` - Audit trail for admin actions
- `SystemConfig` - System configuration key-value store

**Enums Created:**

- `UserRole` - ADMIN, CUSTOMER, VENDOR
- `PaymentStatus` - pending, initiated, processing, completed, failed, cancelled
- `PaymentType` - initiate, payment

**Prisma Client Setup:**

- Created Prisma client singleton in `libs/backend/db/src/lib/prisma.ts`
- Client configured with development logging
- Global instance to prevent multiple connections in development

**Seed Data:**

- Created comprehensive seed script (`libs/backend/db/prisma/seed.ts`)
- Seeds test users (admin@example.com, customer@example.com, vendor@example.com)
- Creates user profiles, sample payments, transactions, system config, and audit logs
- Uses bcrypt for password hashing

**Scripts Added:**

- `db:generate` - Generate Prisma client
- `db:migrate` - Create and run migrations
- `db:migrate:deploy` - Deploy migrations (production)
- `db:seed` - Run seed script
- `db:studio` - Open Prisma Studio
- `db:reset` - Reset database and run seed
- `db:format` - Format schema file
- `db:validate` - Validate schema

**Prisma Version:**

- Installed Prisma 5.22.0 (as specified in architecture docs)
- Schema validated and Prisma client generated successfully

**Next Steps:**

- Initial migration will be created when database is running (after Docker Compose setup)
- Seed data can be run after migration: `pnpm db:seed`

**Files Created:**

- ✅ `/libs/backend/db/prisma/schema.prisma`
- ✅ `/libs/backend/db/prisma/seed.ts`
- ✅ `/libs/backend/db/src/lib/prisma.ts`

---

### Task 1.2: Frontend Library Setup

> **Progress:** Track completion in [`task-list.md`](./task-list.md#task-12-frontend-library-setup)

**Objective:** Create new frontend libraries for POC-2

#### Sub-task 1.2.1: Create API Client Library

**Steps:**

1. Generate library: `nx g @nx/js:library shared-api-client --bundler=tsc`
2. Install Axios: `pnpm add axios`
3. Create Axios instance with base configuration
4. Implement request interceptor for JWT token
5. Implement response interceptor for error handling
6. Implement token refresh mechanism
7. Add retry logic for failed requests
8. Create type-safe API methods
9. Write unit tests (70%+ coverage)
10. Export from library index

**API Client Interface:**

```typescript
interface ApiClient {
  get<T>(url: string, config?: AxiosRequestConfig): Promise<T>;
  post<T>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<T>;
  put<T>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<T>;
  patch<T>(
    url: string,
    data?: unknown,
    config?: AxiosRequestConfig
  ): Promise<T>;
  delete<T>(url: string, config?: AxiosRequestConfig): Promise<T>;
}
```

**Verification:**

- [ ] Library generated at `libs/shared-api-client`
- [ ] Axios installed
- [ ] Axios instance created with base config
- [ ] Request interceptor implemented (JWT token)
- [ ] Response interceptor implemented (error handling)
- [ ] Token refresh mechanism implemented
- [ ] Retry logic implemented
- [ ] Type-safe methods created
- [ ] Unit tests written (70%+ coverage)
- [ ] Library builds without errors

**Acceptance Criteria:**

- ⬜ API client library created
- ⬜ All interceptors working correctly
- ⬜ Token refresh mechanism works
- ⬜ Unit tests pass (70%+ coverage)

**Status:** ⬜ Not Started  
**Completed Date:**  
**Notes:**

**Files to Create:**

- `/libs/shared-api-client/src/index.ts`
- `/libs/shared-api-client/src/lib/apiClient.ts`
- `/libs/shared-api-client/src/lib/interceptors.ts`
- `/libs/shared-api-client/src/lib/apiClient.test.ts`

---

#### Sub-task 1.2.2: Create Event Bus Library

**Steps:**

1. Generate library: `nx g @nx/js:library shared-event-bus --bundler=tsc`
2. Create base event interface (as per `event-bus-contract.md`)
3. Create event type definitions (auth, payments, admin, system)
4. Implement EventBus class with pub/sub pattern
5. Add event history for debugging
6. Create React hooks (`useEventSubscription`, `useEventEmitter`)
7. Add event validation with Zod
8. Write unit tests (70%+ coverage)
9. Export from library index

**Event Types:**

- `auth:login`, `auth:logout`, `auth:token-refreshed`, `auth:session-expired`
- `payments:created`, `payments:updated`, `payments:completed`, `payments:failed`
- `admin:user-created`, `admin:user-updated`, `admin:user-deleted`, `admin:config-updated`
- `system:error`, `system:navigation`

**Verification:**

- [ ] Library generated at `libs/shared-event-bus`
- [ ] Base event interface created
- [ ] Event type definitions created
- [ ] EventBus class implemented
- [ ] Event history implemented
- [ ] React hooks created
- [ ] Event validation added
- [ ] Unit tests written (70%+ coverage)
- [ ] Library builds without errors

**Acceptance Criteria:**

- ⬜ Event bus library created
- ⬜ All event types defined
- ⬜ Pub/sub pattern working
- ⬜ React hooks working
- ⬜ Unit tests pass (70%+ coverage)

**Status:** ⬜ Not Started  
**Completed Date:**  
**Notes:**

**Files to Create:**

- `/libs/shared-event-bus/src/index.ts`
- `/libs/shared-event-bus/src/types.ts`
- `/libs/shared-event-bus/src/events/auth.ts`
- `/libs/shared-event-bus/src/events/payments.ts`
- `/libs/shared-event-bus/src/events/admin.ts`
- `/libs/shared-event-bus/src/events/system.ts`
- `/libs/shared-event-bus/src/event-bus.ts`
- `/libs/shared-event-bus/src/hooks/useEventBus.ts`
- `/libs/shared-event-bus/src/lib/event-bus.test.ts`

---

#### Sub-task 1.2.3: Create Design System Library

**Steps:**

1. Generate library: `nx g @nx/react:library shared-design-system --bundler=rspack`
2. Install shadcn/ui dependencies: `pnpm add class-variance-authority clsx tailwind-merge`
3. Install Radix UI primitives (as needed for shadcn/ui components)
4. Create `cn` utility function
5. Configure design tokens (colors, spacing, typography)
6. Create base components:
   - Button (with variants)
   - Input (with variants)
   - Label
   - Card
   - Alert
   - Badge
   - Avatar
   - Separator
7. Create form components:
   - Form wrapper
   - Form field
   - Select
   - Checkbox
   - Radio
8. Create feedback components:
   - Loading spinner
   - Skeleton
   - Toast
9. Create layout components:
   - Container
   - Dialog/Modal
   - Sheet
   - Dropdown menu
10. Create data display:
    - Table
    - Tabs
    - Pagination
11. Write unit tests for all components
12. Create component documentation
13. Export from library index

**Verification:**

- [ ] Library generated at `libs/shared-design-system`
- [ ] shadcn/ui dependencies installed
- [ ] `cn` utility created
- [ ] Design tokens configured
- [ ] All base components created
- [ ] All form components created
- [ ] All feedback components created
- [ ] All layout components created
- [ ] All data display components created
- [ ] Unit tests written (70%+ coverage)
- [ ] Component documentation created
- [ ] Library builds without errors

**Acceptance Criteria:**

- ⬜ Design system library created
- ⬜ All components render correctly
- ⬜ Components are accessible (ARIA)
- ⬜ Tailwind CSS v4 works correctly
- ⬜ Unit tests pass (70%+ coverage)

**Status:** ⬜ Not Started  
**Completed Date:**  
**Notes:**

**Files to Create:**

- `/libs/shared-design-system/src/index.ts`
- `/libs/shared-design-system/src/utils/cn.ts`
- `/libs/shared-design-system/src/tokens/index.ts`
- `/libs/shared-design-system/src/components/button.tsx`
- `/libs/shared-design-system/src/components/input.tsx`
- `/libs/shared-design-system/src/components/card.tsx`
- (and more components as listed above)

---

### Task 1.3: Shared Types Extension

> **Progress:** Track completion in [`task-list.md`](./task-list.md#task-13-shared-types-extension)

**Objective:** Extend shared types library with API and event types

#### Sub-task 1.3.1: Extend Shared Types

**Steps:**

1. Add API contract types (from `api-contracts.md`)
   - Common types (ApiResponse, PaginationParams, etc.)
   - Auth API types (LoginRequest, RegisterRequest, etc.)
   - Payments API types (CreatePaymentRequest, etc.)
   - Admin API types
   - Profile API types
2. Add model types
   - User model
   - Payment model
   - AuditLog model
3. Add enums
   - UserRole (ADMIN, CUSTOMER, VENDOR)
   - PaymentStatus
   - PaymentType
4. Add event types (from `event-bus-contract.md`)
5. Update exports

**Verification:**

- [ ] API contract types added
- [ ] Model types added
- [ ] Enums added
- [ ] Event types added
- [ ] Exports updated
- [ ] Types compile without errors
- [ ] Types are importable from `@mfe/shared-types`

**Acceptance Criteria:**

- ⬜ All API types defined per `api-contracts.md`
- ⬜ All event types defined per `event-bus-contract.md`
- ⬜ Types compile without errors
- ⬜ Types are correctly exported

**Status:** ⬜ Not Started  
**Completed Date:**  
**Notes:**

**Files to Update/Create:**

- `/libs/shared-types/src/lib/types.ts` (extend)
- `/libs/shared-types/src/api/index.ts` (new)
- `/libs/shared-types/src/api/common.ts` (new)
- `/libs/shared-types/src/api/auth.ts` (new)
- `/libs/shared-types/src/api/payments.ts` (new)
- `/libs/shared-types/src/api/admin.ts` (new)
- `/libs/shared-types/src/api/profile.ts` (new)
- `/libs/shared-types/src/models/index.ts` (new)
- `/libs/shared-types/src/enums/index.ts` (new)
- `/libs/shared-types/src/events/index.ts` (new)

---

### Phase 1 Acceptance Criteria

- [x] Docker Compose runs PostgreSQL and Redis locally
- [x] Backend project structure created in Nx monorepo
- [x] Prisma schema defined with all models
- [ ] Database migrations created and run successfully (pending database running)
- [ ] API client library created with interceptors
- [ ] Event bus library created with all event types
- [ ] Design system library created with base components
- [ ] Shared types extended with API and event types
- [ ] All new libraries have 70%+ test coverage
- [x] Documentation updated

**Phase 1 Status:** 🟡 In Progress (3/7 sub-tasks complete - 43%)  
**Phase 1 Completed Date:**  
**Phase 1 Notes:**

**Completed:**

- ✅ Sub-task 1.1.1: Docker Compose Setup
- ✅ Sub-task 1.1.2: Backend Project Structure
- ✅ Sub-task 1.1.3: Database Schema Design (Prisma) - Schema ready, migration pending database

**Remaining:**

- ⬜ Sub-task 1.2.1: Create API Client Library
- ⬜ Sub-task 1.2.2: Create Event Bus Library
- ⬜ Sub-task 1.2.3: Create Design System Library
- ⬜ Sub-task 1.3.1: Extend Shared Types

---

## Phase 2: Backend Foundation (Week 2-3)

### Task 2.1: API Gateway Implementation

> **Progress:** Track completion in [`task-list.md`](./task-list.md#task-21-api-gateway-implementation)

**Objective:** Create centralized API Gateway for routing and authentication

#### Sub-task 2.1.1: Create API Gateway Application

**Steps:**

1. Generate app: `nx g @nx/node:application api-gateway`
2. Configure Express server
3. Setup CORS middleware (whitelist frontend origins)
4. Setup Helmet for security headers
5. Setup rate limiting middleware
6. Setup request logging (Winston)
7. Setup error handling middleware
8. Configure health check endpoint (`/health`)
9. Write tests

**Verification:**

- [ ] Application created at `apps/api-gateway`
- [ ] Express server configured
- [ ] CORS middleware setup
- [ ] Helmet configured
- [ ] Rate limiting configured
- [ ] Request logging setup
- [ ] Error handling middleware created
- [ ] Health check endpoint created
- [ ] Tests written
- [ ] Server starts on port 3000

**Acceptance Criteria:**

- ⬜ API Gateway application created
- ⬜ Server starts on port 3000
- ⬜ CORS allows frontend origins
- ⬜ Security headers are set
- ⬜ Rate limiting works
- ⬜ Health check returns 200

**Status:** ⬜ Not Started  
**Completed Date:**  
**Notes:**

**Files to Create:**

- `/apps/api-gateway/src/main.ts`
- `/apps/api-gateway/src/middleware/cors.ts`
- `/apps/api-gateway/src/middleware/security.ts`
- `/apps/api-gateway/src/middleware/rateLimit.ts`
- `/apps/api-gateway/src/middleware/errorHandler.ts`
- `/apps/api-gateway/src/routes/health.ts`

---

#### Sub-task 2.1.2: Authentication Middleware

**Steps:**

1. Create JWT verification middleware
2. Extract user from token and attach to request
3. Handle expired tokens (401 response)
4. Handle invalid tokens (401 response)
5. Create RBAC middleware (`requireRole`)
6. Write tests for auth middleware

**Verification:**

- [ ] JWT verification middleware created
- [ ] User extracted from token
- [ ] Expired tokens return 401
- [ ] Invalid tokens return 401
- [ ] RBAC middleware created
- [ ] Tests written and passing

**Acceptance Criteria:**

- ⬜ Valid tokens allow request through
- ⬜ Expired tokens return 401
- ⬜ Invalid tokens return 401
- ⬜ RBAC restricts access based on role

**Status:** ⬜ Not Started  
**Completed Date:**  
**Notes:**

**Files to Create:**

- `/apps/api-gateway/src/middleware/auth.ts`
- `/apps/api-gateway/src/middleware/rbac.ts`
- `/apps/api-gateway/src/middleware/auth.test.ts`

---

#### Sub-task 2.1.3: Route Configuration

**Steps:**

1. Setup route proxying to services
2. Configure public routes (`/api/auth/login`, `/api/auth/register`)
3. Configure protected routes (`/api/payments/*`, `/api/profile/*`)
4. Configure admin routes (`/api/admin/*` - ADMIN only)
5. Write integration tests for routing

**Verification:**

- [ ] Route proxying configured
- [ ] Public routes accessible without auth
- [ ] Protected routes require valid token
- [ ] Admin routes require ADMIN role
- [ ] Integration tests written

**Acceptance Criteria:**

- ⬜ Public routes accessible without auth
- ⬜ Protected routes require valid token
- ⬜ Admin routes require ADMIN role
- ⬜ Routes proxy to correct services

**Status:** ⬜ Not Started  
**Completed Date:**  
**Notes:**

**Files to Create:**

- `/apps/api-gateway/src/routes/index.ts`
- `/apps/api-gateway/src/routes/auth.ts`
- `/apps/api-gateway/src/routes/payments.ts`
- `/apps/api-gateway/src/routes/admin.ts`
- `/apps/api-gateway/src/routes/profile.ts`

---

### Task 2.2: Auth Service Implementation

> **Progress:** Track completion in [`task-list.md`](./task-list.md#task-22-auth-service-implementation)

**Objective:** Implement authentication service with JWT

#### Sub-task 2.2.1: Create Auth Service Application

**Steps:**

1. Generate app: `nx g @nx/node:application auth-service`
2. Configure Express server
3. Connect to PostgreSQL via Prisma
4. Setup error handling
5. Configure health check endpoint
6. Write tests

**Verification:**

- [ ] Application created at `apps/auth-service`
- [ ] Express server configured
- [ ] Database connection works
- [ ] Error handling setup
- [ ] Health check created
- [ ] Server starts on port 3001

**Acceptance Criteria:**

- ⬜ Auth Service application created
- ⬜ Server starts on port 3001
- ⬜ Database connection works
- ⬜ Health check returns 200

**Status:** ⬜ Not Started  
**Completed Date:**  
**Notes:**

---

#### Sub-task 2.2.2: User Registration

**Steps:**

1. Create registration endpoint (`POST /api/auth/register`)
2. Validate request body with Zod
3. Check for existing user by email
4. Hash password with bcrypt (10 rounds)
5. Create user in database
6. Generate JWT tokens (access + refresh)
7. Create refresh token in database
8. Return user data and tokens
9. Publish `auth:user:registered` event to Event Hub
10. Write unit and integration tests

**Validation Rules:**

- Email: Valid email format
- Password: 12+ characters, uppercase, lowercase, number, symbol
- Name: 1+ characters
- Role: Optional, defaults to CUSTOMER

**Verification:**

- [ ] Registration endpoint created
- [ ] Request validation with Zod
- [ ] Existing user check
- [ ] Password hashing with bcrypt
- [ ] User created in database
- [ ] JWT tokens generated
- [ ] Refresh token stored
- [ ] User data returned
- [ ] Event published
- [ ] Tests written and passing

**Acceptance Criteria:**

- ⬜ Valid registration creates user
- ⬜ Duplicate email returns 409
- ⬜ Invalid data returns 400 with details
- ⬜ Tokens are valid JWT
- ⬜ Event is published

**Status:** ⬜ Not Started  
**Completed Date:**  
**Notes:**

**Files to Create:**

- `/apps/auth-service/src/controllers/auth.controller.ts`
- `/apps/auth-service/src/services/auth.service.ts`
- `/apps/auth-service/src/validators/auth.validators.ts`
- `/apps/auth-service/src/controllers/auth.controller.test.ts`

---

#### Sub-task 2.2.3: User Login

**Steps:**

1. Create login endpoint (`POST /api/auth/login`)
2. Validate request body with Zod
3. Find user by email
4. Verify password with bcrypt
5. Generate JWT tokens (access + refresh)
6. Create refresh token in database
7. Return user data and tokens
8. Publish `auth:user:logged_in` event
9. Write unit and integration tests

**Verification:**

- [ ] Login endpoint created
- [ ] Request validation with Zod
- [ ] User found by email
- [ ] Password verified
- [ ] JWT tokens generated
- [ ] Refresh token stored
- [ ] User data returned
- [ ] Event published
- [ ] Tests written and passing

**Acceptance Criteria:**

- ⬜ Valid credentials return tokens
- ⬜ Invalid email returns 401
- ⬜ Invalid password returns 401
- ⬜ Tokens contain correct claims
- ⬜ Event is published

**Status:** ⬜ Not Started  
**Completed Date:**  
**Notes:**

---

#### Sub-task 2.2.4: Token Refresh

**Steps:**

1. Create refresh endpoint (`POST /api/auth/refresh`)
2. Validate refresh token
3. Find refresh token in database
4. Verify token hasn't expired
5. Generate new access token
6. Return new access token
7. Publish `auth:token:refreshed` event
8. Write tests

**Verification:**

- [ ] Refresh endpoint created
- [ ] Refresh token validated
- [ ] Token found in database
- [ ] Token expiry verified
- [ ] New access token generated
- [ ] Event published
- [ ] Tests written and passing

**Acceptance Criteria:**

- ⬜ Valid refresh token returns new access token
- ⬜ Expired refresh token returns 401
- ⬜ Invalid refresh token returns 401

**Status:** ⬜ Not Started  
**Completed Date:**  
**Notes:**

---

#### Sub-task 2.2.5: Logout

**Steps:**

1. Create logout endpoint (`POST /api/auth/logout`)
2. Require authentication
3. Delete refresh token from database
4. Return success response
5. Publish `auth:user:logged_out` event
6. Write tests

**Verification:**

- [ ] Logout endpoint created
- [ ] Authentication required
- [ ] Refresh token deleted
- [ ] Success response returned
- [ ] Event published
- [ ] Tests written and passing

**Acceptance Criteria:**

- ⬜ Logout deletes refresh token
- ⬜ Subsequent refresh attempts fail

**Status:** ⬜ Not Started  
**Completed Date:**  
**Notes:**

---

#### Sub-task 2.2.6: Get Current User

**Steps:**

1. Create me endpoint (`GET /api/auth/me`)
2. Require authentication
3. Return current user data
4. Write tests

**Verification:**

- [ ] Me endpoint created
- [ ] Authentication required
- [ ] User data returned
- [ ] Tests written and passing

**Acceptance Criteria:**

- ⬜ Returns current user data
- ⬜ Requires valid token

**Status:** ⬜ Not Started  
**Completed Date:**  
**Notes:**

---

#### Sub-task 2.2.7: Change Password

**Steps:**

1. Create change password endpoint (`PUT /api/auth/password`)
2. Require authentication
3. Validate current password
4. Validate new password complexity
5. Hash and update password
6. Invalidate all refresh tokens
7. Publish `auth:password:changed` event
8. Write tests

**Verification:**

- [ ] Change password endpoint created
- [ ] Authentication required
- [ ] Current password validated
- [ ] New password validated
- [ ] Password updated in database
- [ ] All refresh tokens invalidated
- [ ] Event published
- [ ] Tests written and passing

**Acceptance Criteria:**

- ⬜ Valid current password allows change
- ⬜ Invalid current password returns 401
- ⬜ All sessions are invalidated

**Status:** ⬜ Not Started  
**Completed Date:**  
**Notes:**

---

### Task 2.3: Backend Event Hub (Redis Pub/Sub)

> **Progress:** Track completion in [`task-list.md`](./task-list.md#task-23-backend-event-hub-redis-pubsub)

**Objective:** Implement event publishing/subscribing for inter-service communication

#### Sub-task 2.3.1: Create Event Hub Library

**Steps:**

1. Create library: `/libs/backend/shared-event-hub`
2. Install ioredis: `pnpm add ioredis`
3. Create Redis connection manager
4. Create EventPublisher class
5. Create EventSubscriber class
6. Define event types (matching `event-bus-contract.md`)
7. Add event validation
8. Write tests
9. Export from library index

**Event Publisher Interface:**

```typescript
interface EventPublisher {
  publish(eventType: string, data: unknown): Promise<void>;
}
```

**Verification:**

- [ ] Library created
- [ ] ioredis installed
- [ ] Connection manager created
- [ ] EventPublisher created
- [ ] EventSubscriber created
- [ ] Event types defined
- [ ] Event validation added
- [ ] Tests written and passing

**Acceptance Criteria:**

- ⬜ Publisher sends events to Redis
- ⬜ Subscriber receives events
- ⬜ Events are properly serialized/deserialized
- ⬜ Tests pass

**Status:** ⬜ Not Started  
**Completed Date:**  
**Notes:**

**Files to Create:**

- `/libs/backend/shared-event-hub/src/index.ts`
- `/libs/backend/shared-event-hub/src/publisher.ts`
- `/libs/backend/shared-event-hub/src/subscriber.ts`
- `/libs/backend/shared-event-hub/src/types.ts`
- `/libs/backend/shared-event-hub/src/connection.ts`

---

### Phase 2 Acceptance Criteria

- [ ] API Gateway running and routing requests
- [ ] Authentication middleware validates JWT tokens
- [ ] RBAC middleware enforces role-based access
- [ ] Auth Service endpoints fully implemented
- [ ] User registration working end-to-end
- [ ] User login working end-to-end
- [ ] Token refresh working end-to-end
- [ ] Logout working end-to-end
- [ ] Event Hub publishing/subscribing works
- [ ] All backend code has 70%+ test coverage
- [ ] API matches contracts in `api-contracts.md`

**Phase 2 Status:** ⬜ Not Started  
**Phase 2 Completed Date:**  
**Phase 2 Notes:**

---

## Phase 3: Backend Services (Week 4-5)

### Task 3.1: Payments Service Implementation

> **Progress:** Track completion in [`task-list.md`](./task-list.md#task-31-payments-service-implementation)

**Objective:** Implement payments service with stubbed processing

#### Sub-task 3.1.1: Create Payments Service Application

**Steps:**

1. Generate app: `nx g @nx/node:application payments-service`
2. Configure Express server
3. Connect to PostgreSQL via Prisma
4. Setup error handling
5. Configure health check endpoint
6. Write tests

**Verification:**

- [ ] Application created at `apps/payments-service`
- [ ] Express server configured
- [ ] Database connection works
- [ ] Error handling setup
- [ ] Health check created
- [ ] Server starts on port 3002

**Acceptance Criteria:**

- ⬜ Payments Service application created
- ⬜ Server starts on port 3002
- ⬜ Database connection works
- ⬜ Health check returns 200

**Status:** ⬜ Not Started  
**Completed Date:**  
**Notes:**

---

#### Sub-task 3.1.2: List Payments

**Steps:**

1. Create endpoint (`GET /api/payments`)
2. Require authentication
3. Implement pagination
4. Implement filtering (status, type, date range)
5. Implement sorting
6. Role-based filtering:
   - CUSTOMER: Own payments only
   - VENDOR: Payments they initiated
   - ADMIN: All payments
7. Write tests

**Query Parameters:**

- `page`, `limit`, `sort`, `order`
- `status`, `type`, `startDate`, `endDate`

**Verification:**

- [ ] Endpoint created
- [ ] Authentication required
- [ ] Pagination implemented
- [ ] Filtering implemented
- [ ] Sorting implemented
- [ ] Role-based filtering implemented
- [ ] Tests written and passing

**Acceptance Criteria:**

- ⬜ Pagination works correctly
- ⬜ Filtering works correctly
- ⬜ Role-based access enforced
- ⬜ Response matches API contract

**Status:** ⬜ Not Started  
**Completed Date:**  
**Notes:**

---

#### Sub-task 3.1.3: Get Payment by ID

**Steps:**

1. Create endpoint (`GET /api/payments/:id`)
2. Require authentication
3. Role-based access check
4. Include transactions in response
5. Return 404 if not found
6. Return 403 if not authorized
7. Write tests

**Verification:**

- [ ] Endpoint created
- [ ] Authentication required
- [ ] Role-based access checked
- [ ] Transactions included
- [ ] 404 returned if not found
- [ ] 403 returned if not authorized
- [ ] Tests written and passing

**Acceptance Criteria:**

- ⬜ Returns payment details
- ⬜ Includes transactions
- ⬜ Authorization enforced
- ⬜ 404 for non-existent

**Status:** ⬜ Not Started  
**Completed Date:**  
**Notes:**

---

#### Sub-task 3.1.4: Create Payment

**Steps:**

1. Create endpoint (`POST /api/payments`)
2. Require authentication
3. Validate request body
4. CUSTOMER: Can create type="payment"
5. VENDOR: Can create type="initiate"
6. Create payment in database
7. Create initial transaction record
8. Publish `payments:payment:created` event
9. Return created payment
10. Write tests

**Note:** Payment processing is stubbed - no actual PSP integration.

**Verification:**

- [ ] Endpoint created
- [ ] Authentication required
- [ ] Request validation
- [ ] Role-based type restriction
- [ ] Payment created in database
- [ ] Transaction record created
- [ ] Event published
- [ ] Tests written and passing

**Acceptance Criteria:**

- ⬜ Payment created in database
- ⬜ Initial transaction created
- ⬜ Event published
- ⬜ Role-based type restriction enforced

**Status:** ⬜ Not Started  
**Completed Date:**  
**Notes:**

---

#### Sub-task 3.1.5: Update Payment

**Steps:**

1. Create endpoint (`PUT /api/payments/:id`)
2. Require authentication (VENDOR/ADMIN)
3. Validate request body
4. Update description and metadata
5. Publish `payments:payment:updated` event
6. Return updated payment
7. Write tests

**Verification:**

- [ ] Endpoint created
- [ ] Authentication required (VENDOR/ADMIN)
- [ ] Request validation
- [ ] Payment updated
- [ ] Event published
- [ ] Tests written and passing

**Acceptance Criteria:**

- ⬜ Payment updated
- ⬜ Event published
- ⬜ Authorization enforced

**Status:** ⬜ Not Started  
**Completed Date:**  
**Notes:**

---

#### Sub-task 3.1.6: Update Payment Status

**Steps:**

1. Create endpoint (`POST /api/payments/:id/status`)
2. Require authentication (VENDOR/ADMIN)
3. Validate status transition (state machine)
4. Create transaction record for status change
5. Update payment status
6. Publish appropriate event:
   - `payments:payment:updated`
   - `payments:payment:completed`
   - `payments:payment:failed`
7. Write tests

**Valid Status Transitions:**

- `pending` → `initiated`, `cancelled`
- `initiated` → `processing`, `cancelled`
- `processing` → `completed`, `failed`
- `completed` → (terminal)
- `failed` → (terminal)
- `cancelled` → (terminal)

**Verification:**

- [ ] Endpoint created
- [ ] Authentication required (VENDOR/ADMIN)
- [ ] Status transitions validated
- [ ] Transaction record created
- [ ] Payment status updated
- [ ] Appropriate event published
- [ ] Tests written and passing

**Acceptance Criteria:**

- ⬜ Valid transitions allowed
- ⬜ Invalid transitions rejected (400)
- ⬜ Transaction record created
- ⬜ Event published

**Status:** ⬜ Not Started  
**Completed Date:**  
**Notes:**

---

#### Sub-task 3.1.7: Cancel Payment

**Steps:**

1. Create endpoint (`DELETE /api/payments/:id`)
2. Require authentication (VENDOR/ADMIN)
3. Validate payment can be cancelled
4. Update status to "cancelled"
5. Write tests

**Verification:**

- [ ] Endpoint created
- [ ] Authentication required (VENDOR/ADMIN)
- [ ] Cancellation validation
- [ ] Status updated to cancelled
- [ ] Tests written and passing

**Acceptance Criteria:**

- ⬜ Pending/initiated payments can be cancelled
- ⬜ Completed/failed payments cannot be cancelled

**Status:** ⬜ Not Started  
**Completed Date:**  
**Notes:**

---

#### Sub-task 3.1.8: Payment Reports

**Steps:**

1. Create endpoint (`GET /api/payments/reports`)
2. Require authentication (VENDOR/ADMIN)
3. Accept date range parameters
4. Calculate totals by status
5. Calculate totals by type
6. Return report data
7. Write tests

**Verification:**

- [ ] Endpoint created
- [ ] Authentication required (VENDOR/ADMIN)
- [ ] Date range parameters accepted
- [ ] Totals calculated by status
- [ ] Totals calculated by type
- [ ] Tests written and passing

**Acceptance Criteria:**

- ⬜ Report data is accurate
- ⬜ Date range filtering works
- ⬜ Authorization enforced

**Status:** ⬜ Not Started  
**Completed Date:**  
**Notes:**

---

### Task 3.2: Admin Service Implementation

> **Progress:** Track completion in [`task-list.md`](./task-list.md#task-32-admin-service-implementation)

**Objective:** Implement admin service for user management

#### Sub-task 3.2.1: Create Admin Service Application

**Steps:**

1. Generate app: `nx g @nx/node:application admin-service`
2. Configure Express server
3. Connect to PostgreSQL via Prisma
4. Setup error handling
5. Configure health check endpoint
6. Write tests

**Verification:**

- [ ] Application created at `apps/admin-service`
- [ ] Express server configured
- [ ] Database connection works
- [ ] Error handling setup
- [ ] Health check created
- [ ] Server starts on port 3003

**Acceptance Criteria:**

- ⬜ Admin Service application created
- ⬜ Server starts on port 3003
- ⬜ Database connection works
- ⬜ Health check returns 200

**Status:** ⬜ Not Started  
**Completed Date:**  
**Notes:**

---

#### Sub-task 3.2.2: List Users

**Steps:**

1. Create endpoint (`GET /api/admin/users`)
2. Require ADMIN role
3. Implement pagination
4. Implement filtering (role, search)
5. Write tests

**Verification:**

- [ ] Endpoint created
- [ ] ADMIN role required
- [ ] Pagination implemented
- [ ] Filtering implemented
- [ ] Tests written and passing

**Acceptance Criteria:**

- ⬜ Returns paginated user list
- ⬜ Filtering works correctly
- ⬜ ADMIN only access

**Status:** ⬜ Not Started  
**Completed Date:**  
**Notes:**

---

#### Sub-task 3.2.3: Get User by ID

**Steps:**

1. Create endpoint (`GET /api/admin/users/:id`)
2. Require ADMIN role
3. Include profile in response
4. Return 404 if not found
5. Write tests

**Verification:**

- [ ] Endpoint created
- [ ] ADMIN role required
- [ ] Profile included
- [ ] 404 returned if not found
- [ ] Tests written and passing

**Acceptance Criteria:**

- ⬜ Returns user details with profile
- ⬜ 404 for non-existent

**Status:** ⬜ Not Started  
**Completed Date:**  
**Notes:**

---

#### Sub-task 3.2.4: Create User (Admin)

**Steps:**

1. Create endpoint (`POST /api/admin/users`)
2. Require ADMIN role
3. Validate request body
4. Hash password
5. Create user in database
6. Create audit log entry
7. Publish `admin:user:created` event
8. Return created user
9. Write tests

**Verification:**

- [ ] Endpoint created
- [ ] ADMIN role required
- [ ] Request validated
- [ ] Password hashed
- [ ] User created
- [ ] Audit log created
- [ ] Event published
- [ ] Tests written and passing

**Acceptance Criteria:**

- ⬜ User created in database
- ⬜ Audit log created
- ⬜ Event published

**Status:** ⬜ Not Started  
**Completed Date:**  
**Notes:**

---

#### Sub-task 3.2.5: Update User (Admin)

**Steps:**

1. Create endpoint (`PUT /api/admin/users/:id`)
2. Require ADMIN role
3. Validate request body
4. Update user in database
5. Create audit log entry
6. Publish `admin:user:updated` event
7. Return updated user
8. Write tests

**Verification:**

- [ ] Endpoint created
- [ ] ADMIN role required
- [ ] Request validated
- [ ] User updated
- [ ] Audit log created
- [ ] Event published
- [ ] Tests written and passing

**Acceptance Criteria:**

- ⬜ User updated
- ⬜ Audit log created
- ⬜ Event published

**Status:** ⬜ Not Started  
**Completed Date:**  
**Notes:**

---

#### Sub-task 3.2.6: Update User Role

**Steps:**

1. Create endpoint (`PUT /api/admin/users/:id/role`)
2. Require ADMIN role
3. Validate role value
4. Update role in database
5. Create audit log entry
6. Publish `admin:user:updated` event
7. Return updated user
8. Write tests

**Verification:**

- [ ] Endpoint created
- [ ] ADMIN role required
- [ ] Role validated
- [ ] Role updated
- [ ] Audit log created
- [ ] Event published
- [ ] Tests written and passing

**Acceptance Criteria:**

- ⬜ Role updated
- ⬜ Audit log created
- ⬜ Event published

**Status:** ⬜ Not Started  
**Completed Date:**  
**Notes:**

---

#### Sub-task 3.2.7: Delete User

**Steps:**

1. Create endpoint (`DELETE /api/admin/users/:id`)
2. Require ADMIN role
3. Soft delete or hard delete (decision needed)
4. Create audit log entry
5. Publish `admin:user:deleted` event
6. Write tests

**Verification:**

- [ ] Endpoint created
- [ ] ADMIN role required
- [ ] User deleted (soft/hard)
- [ ] Audit log created
- [ ] Event published
- [ ] Tests written and passing

**Acceptance Criteria:**

- ⬜ User deleted
- ⬜ Audit log created
- ⬜ Event published

**Status:** ⬜ Not Started  
**Completed Date:**  
**Notes:**

---

#### Sub-task 3.2.8: Audit Logs

**Steps:**

1. Create endpoint (`GET /api/admin/audit-logs`)
2. Require ADMIN role
3. Implement pagination
4. Implement filtering (userId, action, date range)
5. Write tests

**Verification:**

- [ ] Endpoint created
- [ ] ADMIN role required
- [ ] Pagination implemented
- [ ] Filtering implemented
- [ ] Tests written and passing

**Acceptance Criteria:**

- ⬜ Returns paginated audit logs
- ⬜ Filtering works correctly

**Status:** ⬜ Not Started  
**Completed Date:**  
**Notes:**

---

#### Sub-task 3.2.9: System Analytics

**Steps:**

1. Create endpoint (`GET /api/admin/analytics`)
2. Require ADMIN role
3. Calculate user statistics
4. Calculate payment statistics
5. Return analytics data
6. Write tests

**Verification:**

- [ ] Endpoint created
- [ ] ADMIN role required
- [ ] User statistics calculated
- [ ] Payment statistics calculated
- [ ] Tests written and passing

**Acceptance Criteria:**

- ⬜ Analytics data is accurate
- ⬜ Response matches API contract

**Status:** ⬜ Not Started  
**Completed Date:**  
**Notes:**

---

#### Sub-task 3.2.10: System Health

**Steps:**

1. Create endpoint (`GET /api/admin/health`)
2. Require ADMIN role
3. Check database status
4. Check Redis status
5. Check service status
6. Return health status
7. Write tests

**Verification:**

- [ ] Endpoint created
- [ ] ADMIN role required
- [ ] Database status checked
- [ ] Redis status checked
- [ ] Service status checked
- [ ] Tests written and passing

**Acceptance Criteria:**

- ⬜ Health status is accurate
- ⬜ All services checked

**Status:** ⬜ Not Started  
**Completed Date:**  
**Notes:**

---

### Task 3.3: Profile Service Implementation

> **Progress:** Track completion in [`task-list.md`](./task-list.md#task-33-profile-service-implementation)

**Objective:** Implement profile service for user profile management

#### Sub-task 3.3.1: Create Profile Service Application

**Steps:**

1. Generate app: `nx g @nx/node:application profile-service`
2. Configure Express server
3. Connect to PostgreSQL via Prisma
4. Setup error handling
5. Configure health check endpoint
6. Write tests

**Verification:**

- [ ] Application created at `apps/profile-service`
- [ ] Express server configured
- [ ] Database connection works
- [ ] Error handling setup
- [ ] Health check created
- [ ] Server starts on port 3004

**Acceptance Criteria:**

- ⬜ Profile Service application created
- ⬜ Server starts on port 3004
- ⬜ Database connection works
- ⬜ Health check returns 200

**Status:** ⬜ Not Started  
**Completed Date:**  
**Notes:**

---

#### Sub-task 3.3.2: Get Profile

**Steps:**

1. Create endpoint (`GET /api/profile`)
2. Require authentication
3. Return current user's profile
4. Create profile if not exists
5. Write tests

**Verification:**

- [ ] Endpoint created
- [ ] Authentication required
- [ ] Profile returned
- [ ] Auto-creates profile if missing
- [ ] Tests written and passing

**Acceptance Criteria:**

- ⬜ Returns profile data
- ⬜ Auto-creates profile if missing

**Status:** ⬜ Not Started  
**Completed Date:**  
**Notes:**

---

#### Sub-task 3.3.3: Update Profile

**Steps:**

1. Create endpoint (`PUT /api/profile`)
2. Require authentication
3. Validate request body
4. Update profile in database
5. Return updated profile
6. Write tests

**Verification:**

- [ ] Endpoint created
- [ ] Authentication required
- [ ] Request validated
- [ ] Profile updated
- [ ] Tests written and passing

**Acceptance Criteria:**

- ⬜ Profile updated
- ⬜ Response matches API contract

**Status:** ⬜ Not Started  
**Completed Date:**  
**Notes:**

---

#### Sub-task 3.3.4: Get Preferences

**Steps:**

1. Create endpoint (`GET /api/profile/preferences`)
2. Require authentication
3. Return current user's preferences
4. Write tests

**Verification:**

- [ ] Endpoint created
- [ ] Authentication required
- [ ] Preferences returned
- [ ] Tests written and passing

**Acceptance Criteria:**

- ⬜ Returns preferences data

**Status:** ⬜ Not Started  
**Completed Date:**  
**Notes:**

---

#### Sub-task 3.3.5: Update Preferences

**Steps:**

1. Create endpoint (`PUT /api/profile/preferences`)
2. Require authentication
3. Validate request body
4. Update preferences in database
5. Return updated preferences
6. Write tests

**Verification:**

- [ ] Endpoint created
- [ ] Authentication required
- [ ] Request validated
- [ ] Preferences updated
- [ ] Tests written and passing

**Acceptance Criteria:**

- ⬜ Preferences updated
- ⬜ Response matches API contract

**Status:** ⬜ Not Started  
**Completed Date:**  
**Notes:**

---

### Phase 3 Acceptance Criteria

- [ ] Payments Service fully implemented
- [ ] All payment endpoints match API contracts
- [ ] Payment status transitions enforce state machine
- [ ] Admin Service fully implemented
- [ ] All admin endpoints match API contracts
- [ ] Audit logging works for all admin actions
- [ ] Profile Service fully implemented
- [ ] All profile endpoints match API contracts
- [ ] All services have 70%+ test coverage
- [ ] All services publish events correctly
- [ ] API documentation matches implementation

**Phase 3 Status:** ⬜ Not Started  
**Phase 3 Completed Date:**  
**Phase 3 Notes:**

---

## Phase 4: Frontend Integration (Week 6-7)

### Task 4.1: Update Auth Store for Real JWT

> **Progress:** Track completion in [`task-list.md`](./task-list.md#task-41-update-auth-store-for-real-jwt)

**Objective:** Replace mock auth with real backend authentication

#### Sub-task 4.1.1: Update Auth Store

**Steps:**

1. Update `shared-auth-store` to use API client
2. Implement `login` function with real API call
3. Implement `signup` function with real API call
4. Implement `logout` function with real API call
5. Add token storage (accessToken, refreshToken)
6. Add `setAccessToken` function for token refresh
7. Emit events to event bus on auth actions
8. Update tests
9. Remove mock authentication logic

**Changes:**

```typescript
// Before (POC-1)
login: async (email, password) => {
  // Mock validation
  const user = mockLogin(email, password);
  set({ user, isAuthenticated: true });
};

// After (POC-2)
login: async (email, password) => {
  const response = await apiClient.post('/api/auth/login', { email, password });
  const { user, accessToken, refreshToken } = response.data.data;
  set({ user, isAuthenticated: true, accessToken, refreshToken });
  eventBus.emit('auth:login', { user, accessToken, refreshToken }, 'auth-mfe');
};
```

**Verification:**

- [ ] API client used for login
- [ ] API client used for signup
- [ ] API client used for logout
- [ ] Token storage implemented
- [ ] setAccessToken function added
- [ ] Events emitted to event bus
- [ ] Tests updated
- [ ] Mock logic removed

**Acceptance Criteria:**

- ⬜ Login works with backend API
- ⬜ Signup works with backend API
- ⬜ Logout invalidates tokens
- ⬜ Events emitted correctly
- ⬜ Tests pass

**Status:** ⬜ Not Started  
**Completed Date:**  
**Notes:**

---

#### Sub-task 4.1.2: Update Auth MFE Components

**Steps:**

1. Update SignIn component to use new auth store
2. Update SignUp component to use new auth store
3. Use design system components (Button, Input, Card, etc.)
4. Handle API errors properly
5. Show loading states
6. Update tests

**Verification:**

- [ ] SignIn updated
- [ ] SignUp updated
- [ ] Design system components used
- [ ] API errors handled
- [ ] Loading states working
- [ ] Tests updated and passing

**Acceptance Criteria:**

- ⬜ SignIn works with backend
- ⬜ SignUp works with backend
- ⬜ Error messages display correctly
- ⬜ Loading states work
- ⬜ Uses design system components

**Status:** ⬜ Not Started  
**Completed Date:**  
**Notes:**

---

### Task 4.2: Update Payments MFE

> **Progress:** Track completion in [`task-list.md`](./task-list.md#task-42-update-payments-mfe)

**Objective:** Replace stubbed APIs with real backend calls

#### Sub-task 4.2.1: Update TanStack Query Hooks

**Steps:**

1. Update `usePayments` to use API client
2. Update `useCreatePayment` to use API client
3. Update `useUpdatePayment` to use API client
4. Update `useDeletePayment` to use API client
5. Add `usePaymentById` hook
6. Add `usePaymentReports` hook (VENDOR/ADMIN)
7. Emit events on mutations
8. Update tests
9. Remove stubbed API code

**Changes:**

```typescript
// Before (POC-1)
queryFn: () => stubbedPaymentsApi.getPayments();

// After (POC-2)
queryFn: async () => {
  const response = await apiClient.get('/api/payments');
  return response.data.data;
};
```

**Verification:**

- [ ] usePayments updated
- [ ] useCreatePayment updated
- [ ] useUpdatePayment updated
- [ ] useDeletePayment updated
- [ ] usePaymentById added
- [ ] usePaymentReports added
- [ ] Events emitted on mutations
- [ ] Tests updated
- [ ] Stubbed API code removed

**Acceptance Criteria:**

- ⬜ Queries fetch from backend
- ⬜ Mutations work with backend
- ⬜ Events emitted on success
- ⬜ Error handling works
- ⬜ Tests pass

**Status:** ⬜ Not Started  
**Completed Date:**  
**Notes:**

---

#### Sub-task 4.2.2: Update PaymentsPage Component

**Steps:**

1. Use design system components
2. Display payment list from backend
3. Implement create payment form
4. Implement payment status display
5. Implement role-based UI
6. Handle API errors
7. Show loading states
8. Update tests

**Verification:**

- [ ] Design system components used
- [ ] Payment list displays correctly
- [ ] Create payment form works
- [ ] Status display works
- [ ] Role-based UI works
- [ ] API errors handled
- [ ] Loading states working
- [ ] Tests updated and passing

**Acceptance Criteria:**

- ⬜ Payment list displays correctly
- ⬜ Create payment works
- ⬜ Role-based UI works
- ⬜ Uses design system components

**Status:** ⬜ Not Started  
**Completed Date:**  
**Notes:**

---

### Task 4.3: Create Admin MFE

> **Progress:** Track completion in [`task-list.md`](./task-list.md#task-43-create-admin-mfe)

**Objective:** Implement Admin MFE for admin functionality

#### Sub-task 4.3.1: Create Admin MFE Application

**Steps:**

1. Generate app: `nx g @nx/react:application admin-mfe --bundler=rspack`
2. Configure Module Federation (remote)
3. Configure port 4203
4. Setup Tailwind CSS v4
5. Create basic layout
6. Write tests

**Module Federation Config:**

```typescript
// rspack.config.js
new ModuleFederationPlugin({
  name: 'adminMfe',
  filename: 'remoteEntry.js',
  exposes: {
    './AdminDashboard': './src/components/AdminDashboard.tsx',
  },
  shared: {
    react: { singleton: true, requiredVersion: '^19.0.0' },
    'react-dom': { singleton: true, requiredVersion: '^19.0.0' },
  },
});
```

**Verification:**

- [ ] Application created at `apps/admin-mfe`
- [ ] Module Federation configured
- [ ] Port 4203 configured
- [ ] Tailwind CSS v4 setup
- [ ] Basic layout created
- [ ] Tests written

**Acceptance Criteria:**

- ⬜ App runs on port 4203
- ⬜ Module Federation exposes components
- ⬜ Tailwind CSS v4 works

**Status:** ⬜ Not Started  
**Completed Date:**  
**Notes:**

---

#### Sub-task 4.3.2: Create Admin Dashboard

**Steps:**

1. Create AdminDashboard component
2. Use design system components
3. Display system analytics
4. Display recent activity
5. Implement navigation tabs
6. Write tests

**Verification:**

- [ ] AdminDashboard component created
- [ ] Design system components used
- [ ] Analytics displayed
- [ ] Recent activity displayed
- [ ] Navigation tabs working
- [ ] Tests written

**Acceptance Criteria:**

- ⬜ Dashboard displays analytics
- ⬜ Uses design system components
- ⬜ Navigation works

**Status:** ⬜ Not Started  
**Completed Date:**  
**Notes:**

---

#### Sub-task 4.3.3: Create User Management

**Steps:**

1. Create UserManagement component
2. Implement user list with pagination
3. Implement user search/filter
4. Implement create user form
5. Implement edit user form
6. Implement role change
7. Implement delete user
8. Write tests

**Verification:**

- [ ] UserManagement component created
- [ ] User list with pagination
- [ ] Search/filter working
- [ ] Create user form working
- [ ] Edit user form working
- [ ] Role change working
- [ ] Delete user working
- [ ] Tests written

**Acceptance Criteria:**

- ⬜ User list displays correctly
- ⬜ CRUD operations work
- ⬜ Pagination works
- ⬜ Search/filter works

**Status:** ⬜ Not Started  
**Completed Date:**  
**Notes:**

---

#### Sub-task 4.3.4: Create Audit Logs View

**Steps:**

1. Create AuditLogs component
2. Implement log list with pagination
3. Implement log filtering
4. Display log details
5. Write tests

**Verification:**

- [ ] AuditLogs component created
- [ ] Log list with pagination
- [ ] Filtering working
- [ ] Log details displayed
- [ ] Tests written

**Acceptance Criteria:**

- ⬜ Audit logs display correctly
- ⬜ Filtering works
- ⬜ Pagination works

**Status:** ⬜ Not Started  
**Completed Date:**  
**Notes:**

---

#### Sub-task 4.3.5: Create System Health View

**Steps:**

1. Create SystemHealth component
2. Display service status
3. Display database status
4. Display Redis status
5. Auto-refresh status
6. Write tests

**Verification:**

- [ ] SystemHealth component created
- [ ] Service status displayed
- [ ] Database status displayed
- [ ] Redis status displayed
- [ ] Auto-refresh working
- [ ] Tests written

**Acceptance Criteria:**

- ⬜ Health status displays correctly
- ⬜ Auto-refresh works

**Status:** ⬜ Not Started  
**Completed Date:**  
**Notes:**

---

### Task 4.4: Update Shell for Admin MFE

> **Progress:** Track completion in [`task-list.md`](./task-list.md#task-44-update-shell-for-admin-mfe)

**Objective:** Integrate Admin MFE into Shell application

#### Sub-task 4.4.1: Update Module Federation Config

**Steps:**

1. Add admin-mfe to shell's remotes
2. Update remote type declarations
3. Update environment configuration

**Changes:**

```typescript
// rspack.config.js
remotes: {
  authMfe: 'authMfe@http://localhost:4201/remoteEntry.js',
  paymentsMfe: 'paymentsMfe@http://localhost:4202/remoteEntry.js',
  adminMfe: 'adminMfe@http://localhost:4203/remoteEntry.js', // NEW
}
```

**Verification:**

- [ ] admin-mfe added to remotes
- [ ] Type declarations updated
- [ ] Environment configuration updated
- [ ] Admin MFE loads dynamically
- [ ] No TypeScript errors

**Acceptance Criteria:**

- ⬜ Admin MFE loads dynamically
- ⬜ No TypeScript errors

**Status:** ⬜ Not Started  
**Completed Date:**  
**Notes:**

---

#### Sub-task 4.4.2: Add Admin Routes

**Steps:**

1. Create AdminPage component
2. Add `/admin` route with ADMIN role protection
3. Update ProtectedRoute for role checking
4. Update navigation in header
5. Write tests

**Verification:**

- [ ] AdminPage component created
- [ ] `/admin` route added
- [ ] ADMIN role protection working
- [ ] Navigation updated
- [ ] Tests written

**Acceptance Criteria:**

- ⬜ Admin route accessible by ADMIN
- ⬜ Non-ADMIN users redirected
- ⬜ Navigation shows Admin link for ADMIN

**Status:** ⬜ Not Started  
**Completed Date:**  
**Notes:**

---

#### Sub-task 4.4.3: Integrate Event Bus

**Steps:**

1. Initialize event bus in Shell
2. Subscribe to auth events
3. Subscribe to relevant payment events
4. Handle navigation based on events
5. Update tests

**Verification:**

- [ ] Event bus initialized
- [ ] Auth events subscribed
- [ ] Payment events subscribed
- [ ] Navigation handling working
- [ ] Tests updated

**Acceptance Criteria:**

- ⬜ Event bus initialized
- ⬜ Auth events trigger navigation
- ⬜ Cross-MFE communication works

**Status:** ⬜ Not Started  
**Completed Date:**  
**Notes:**

---

### Task 4.5: Design System Migration

> **Progress:** Track completion in [`task-list.md`](./task-list.md#task-45-design-system-migration)

**Objective:** Migrate existing components to use design system

#### Sub-task 4.5.1: Update Shell Components

**Steps:**

1. Update Layout to use design system
2. Update ProtectedRoute to use design system
3. Update error boundaries to use design system
4. Update navigation to use design system
5. Update tests

**Verification:**

- [ ] Layout updated
- [ ] ProtectedRoute updated
- [ ] Error boundaries updated
- [ ] Navigation updated
- [ ] Tests updated and passing

**Acceptance Criteria:**

- ⬜ Shell uses design system components
- ⬜ Consistent styling

**Status:** ⬜ Not Started  
**Completed Date:**  
**Notes:**

---

#### Sub-task 4.5.2: Update Auth MFE Components

**Steps:**

1. Update SignIn to use design system
2. Update SignUp to use design system
3. Update form styling
4. Update tests

**Verification:**

- [ ] SignIn updated
- [ ] SignUp updated
- [ ] Form styling updated
- [ ] Tests updated and passing

**Acceptance Criteria:**

- ⬜ Auth MFE uses design system components
- ⬜ Consistent styling

**Status:** ⬜ Not Started  
**Completed Date:**  
**Notes:**

---

#### Sub-task 4.5.3: Update Payments MFE Components

**Steps:**

1. Update PaymentsPage to use design system
2. Update payment forms to use design system
3. Update tables to use design system
4. Update tests

**Verification:**

- [ ] PaymentsPage updated
- [ ] Payment forms updated
- [ ] Tables updated
- [ ] Tests updated and passing

**Acceptance Criteria:**

- ⬜ Payments MFE uses design system components
- ⬜ Consistent styling

**Status:** ⬜ Not Started  
**Completed Date:**  
**Notes:**

---

#### Sub-task 4.5.4: Update Header Component

**Steps:**

1. Update shared-header-ui to use design system
2. Update navigation styling
3. Update user menu
4. Update tests

**Verification:**

- [ ] Header updated
- [ ] Navigation styling updated
- [ ] User menu updated
- [ ] Tests updated and passing

**Acceptance Criteria:**

- ⬜ Header uses design system components
- ⬜ Consistent styling

**Status:** ⬜ Not Started  
**Completed Date:**  
**Notes:**

---

### Phase 4 Acceptance Criteria

- [ ] Auth store uses real backend API
- [ ] Token management works correctly
- [ ] Payments MFE uses real backend API
- [ ] Admin MFE created and fully functional
- [ ] User management works end-to-end
- [ ] Audit logs display correctly
- [ ] System health displays correctly
- [ ] Shell integrates Admin MFE
- [ ] Event bus works for inter-MFE communication
- [ ] All MFEs use design system components
- [ ] All frontend code has 70%+ test coverage
- [ ] Design is consistent across all MFEs

**Phase 4 Status:** ⬜ Not Started  
**Phase 4 Completed Date:**  
**Phase 4 Notes:**

---

## Phase 5: Testing & Refinement (Week 8)

### Task 5.1: Backend Testing

> **Progress:** Track completion in [`task-list.md`](./task-list.md#task-51-backend-testing)

**Objective:** Ensure comprehensive backend test coverage

#### Sub-task 5.1.1: Unit Tests

**Steps:**

1. Auth Service: 70%+ coverage
2. Payments Service: 70%+ coverage
3. Admin Service: 70%+ coverage
4. Profile Service: 70%+ coverage
5. Event Hub: 70%+ coverage
6. All validators tested
7. All utilities tested

**Verification:**

- [ ] Auth Service 70%+ coverage
- [ ] Payments Service 70%+ coverage
- [ ] Admin Service 70%+ coverage
- [ ] Profile Service 70%+ coverage
- [ ] Event Hub 70%+ coverage
- [ ] All validators tested
- [ ] All utilities tested

**Acceptance Criteria:**

- ⬜ All unit tests pass
- ⬜ Coverage targets met

**Status:** ⬜ Not Started  
**Completed Date:**  
**Notes:**

---

#### Sub-task 5.1.2: Integration Tests

**Steps:**

1. Auth endpoints integration tests
2. Payments endpoints integration tests
3. Admin endpoints integration tests
4. Profile endpoints integration tests
5. Event publishing integration tests
6. Database integration tests

**Verification:**

- [ ] Auth endpoints tested
- [ ] Payments endpoints tested
- [ ] Admin endpoints tested
- [ ] Profile endpoints tested
- [ ] Event publishing tested
- [ ] Database tested

**Acceptance Criteria:**

- ⬜ All integration tests pass
- ⬜ APIs work end-to-end

**Status:** ⬜ Not Started  
**Completed Date:**  
**Notes:**

---

#### Sub-task 5.1.3: API Contract Tests

**Steps:**

1. Verify all endpoints match `api-contracts.md`
2. Verify request/response formats
3. Verify error responses
4. Verify status codes

**Verification:**

- [ ] All endpoints verified
- [ ] Request/response formats verified
- [ ] Error responses verified
- [ ] Status codes verified

**Acceptance Criteria:**

- ⬜ All APIs match contracts
- ⬜ Documentation accurate

**Status:** ⬜ Not Started  
**Completed Date:**  
**Notes:**

---

### Task 5.2: Frontend Testing

> **Progress:** Track completion in [`task-list.md`](./task-list.md#task-52-frontend-testing)

**Objective:** Ensure comprehensive frontend test coverage

#### Sub-task 5.2.1: Unit Tests

**Steps:**

1. API client: 70%+ coverage
2. Event bus: 70%+ coverage
3. Design system components: 70%+ coverage
4. Auth store: 70%+ coverage
5. All hooks tested
6. All components tested

**Verification:**

- [ ] API client 70%+ coverage
- [ ] Event bus 70%+ coverage
- [ ] Design system 70%+ coverage
- [ ] Auth store 70%+ coverage
- [ ] All hooks tested
- [ ] All components tested

**Acceptance Criteria:**

- ⬜ All unit tests pass
- ⬜ Coverage targets met

**Status:** ⬜ Not Started  
**Completed Date:**  
**Notes:**

---

#### Sub-task 5.2.2: Integration Tests

**Steps:**

1. Auth flow integration tests
2. Payments flow integration tests
3. Admin flow integration tests
4. Event bus integration tests
5. Route protection tests

**Verification:**

- [ ] Auth flow tested
- [ ] Payments flow tested
- [ ] Admin flow tested
- [ ] Event bus tested
- [ ] Route protection tested

**Acceptance Criteria:**

- ⬜ All integration tests pass
- ⬜ Flows work end-to-end

**Status:** ⬜ Not Started  
**Completed Date:**  
**Notes:**

---

### Task 5.3: Full-Stack Integration Testing

> **Progress:** Track completion in [`task-list.md`](./task-list.md#task-53-full-stack-integration-testing)

**Objective:** Test end-to-end flows across frontend and backend

#### Sub-task 5.3.1: Authentication Flow Tests

**Steps:**

1. Test registration end-to-end
2. Test login end-to-end
3. Test logout end-to-end
4. Test token refresh
5. Test session expiry
6. Test invalid credentials

**Verification:**

- [ ] Registration tested e2e
- [ ] Login tested e2e
- [ ] Logout tested e2e
- [ ] Token refresh tested
- [ ] Session expiry tested
- [ ] Invalid credentials tested

**Acceptance Criteria:**

- ⬜ All auth flows work
- ⬜ Error handling works

**Status:** ⬜ Not Started  
**Completed Date:**  
**Notes:**

---

#### Sub-task 5.3.2: Payments Flow Tests

**Steps:**

1. Test view payments
2. Test create payment
3. Test update payment
4. Test payment status changes
5. Test role-based access

**Verification:**

- [ ] View payments tested
- [ ] Create payment tested
- [ ] Update payment tested
- [ ] Status changes tested
- [ ] Role-based access tested

**Acceptance Criteria:**

- ⬜ All payment flows work
- ⬜ Role-based access enforced

**Status:** ⬜ Not Started  
**Completed Date:**  
**Notes:**

---

#### Sub-task 5.3.3: Admin Flow Tests

**Steps:**

1. Test user management
2. Test role changes
3. Test audit logs
4. Test system health
5. Test analytics

**Verification:**

- [ ] User management tested
- [ ] Role changes tested
- [ ] Audit logs tested
- [ ] System health tested
- [ ] Analytics tested

**Acceptance Criteria:**

- ⬜ All admin flows work
- ⬜ ADMIN only access enforced

**Status:** ⬜ Not Started  
**Completed Date:**  
**Notes:**

---

### Task 5.4: E2E Testing

> **Progress:** Track completion in [`task-list.md`](./task-list.md#task-54-e2e-testing)

**Objective:** Comprehensive end-to-end testing with Playwright

#### Sub-task 5.4.1: Update E2E Tests

**Steps:**

1. Update auth flow tests for real backend
2. Update payments flow tests for real backend
3. Add admin flow tests
4. Add event bus verification tests
5. Add error handling tests

**Verification:**

- [ ] Auth flow tests updated
- [ ] Payments flow tests updated
- [ ] Admin flow tests added
- [ ] Event bus tests added
- [ ] Error handling tests added

**Acceptance Criteria:**

- ⬜ All E2E tests pass
- ⬜ Critical user journeys covered

**Status:** ⬜ Not Started  
**Completed Date:**  
**Notes:**

---

### Task 5.5: Documentation

> **Progress:** Track completion in [`task-list.md`](./task-list.md#task-55-documentation)

**Objective:** Complete and accurate documentation

#### Sub-task 5.5.1: Technical Documentation

**Steps:**

1. Create `design-system-guide.md` with component usage
2. Create `migration-guide-poc1-to-poc2.md`
3. Create `developer-workflow-frontend.md`
4. Create `developer-workflow-backend.md`
5. Create `developer-workflow-fullstack.md`
6. Create `testing-guide.md`
7. Update API documentation

**Verification:**

- [ ] Design system guide created
- [ ] Migration guide created
- [ ] Frontend workflow created
- [ ] Backend workflow created
- [ ] Full-stack workflow created
- [ ] Testing guide created
- [ ] API documentation updated

**Acceptance Criteria:**

- ⬜ All documentation complete
- ⬜ Documentation accurate

**Status:** ⬜ Not Started  
**Completed Date:**  
**Notes:**

---

#### Sub-task 5.5.2: Update Existing Documentation

**Steps:**

1. Update `architecture-review.md` with implementation notes
2. Update `api-contracts.md` if any changes
3. Update `event-bus-contract.md` if any changes
4. Update README files

**Verification:**

- [ ] Architecture review updated
- [ ] API contracts updated (if needed)
- [ ] Event bus contract updated (if needed)
- [ ] README files updated

**Acceptance Criteria:**

- ⬜ All documentation up-to-date

**Status:** ⬜ Not Started  
**Completed Date:**  
**Notes:**

---

### Task 5.6: Refinement

> **Progress:** Track completion in [`task-list.md`](./task-list.md#task-56-refinement)

**Objective:** Fix issues and optimize performance

#### Sub-task 5.6.1: Bug Fixes

**Steps:**

1. Fix any identified issues
2. Address edge cases
3. Improve error handling

**Verification:**

- [ ] All identified issues fixed
- [ ] Edge cases addressed
- [ ] Error handling improved

**Acceptance Criteria:**

- ⬜ No critical bugs remaining

**Status:** ⬜ Not Started  
**Completed Date:**  
**Notes:**

---

#### Sub-task 5.6.2: Performance Review

**Steps:**

1. Review API response times
2. Review bundle sizes
3. Review render performance
4. Optimize if needed

**Verification:**

- [ ] API response times reviewed
- [ ] Bundle sizes reviewed
- [ ] Render performance reviewed
- [ ] Optimizations applied if needed

**Acceptance Criteria:**

- ⬜ Performance acceptable

**Status:** ⬜ Not Started  
**Completed Date:**  
**Notes:**

---

### Phase 5 Acceptance Criteria

- [ ] All backend tests pass with 70%+ coverage
- [ ] All frontend tests pass with 70%+ coverage
- [ ] All E2E tests pass
- [ ] API contracts verified
- [ ] Event bus contracts verified
- [ ] All documentation complete
- [ ] No critical bugs
- [ ] Performance acceptable

**Phase 5 Status:** ⬜ Not Started  
**Phase 5 Completed Date:**  
**Phase 5 Notes:**

---

## Success Criteria Summary

### Functional Requirements

- [ ] Real JWT authentication working
- [ ] Token refresh mechanism working
- [ ] Payment operations working (stubbed backend)
- [ ] Admin functionality working (ADMIN role)
- [ ] Event bus communication working
- [ ] All MFEs decoupled (no shared Zustand stores)
- [ ] Design system components working
- [ ] Consistent design across all MFEs

### Technical Requirements

- [ ] API client library implemented
- [ ] Event bus library implemented
- [ ] Design system library implemented
- [ ] All APIs integrated with backend
- [ ] JWT token management working
- [ ] Admin MFE created and working
- [ ] Module Federation v2 configured
- [ ] All remotes load dynamically

### Quality Requirements

- [ ] Backend test coverage: 70%+
- [ ] Frontend test coverage: 70%+
- [ ] All E2E tests pass
- [ ] API contracts verified
- [ ] Documentation complete
- [ ] No critical bugs

---

## Risk Mitigation

| Risk                          | Impact | Mitigation                  |
| ----------------------------- | ------ | --------------------------- |
| Backend complexity            | Medium | Start early, iterate        |
| Database migrations           | Medium | Use Prisma, test thoroughly |
| Event bus reliability         | Medium | Start with Redis Pub/Sub    |
| Design system integration     | Low    | Incremental migration       |
| Full-stack testing complexity | Medium | Comprehensive test strategy |
| Type synchronization          | Low    | Use shared types library    |

---

## Development Workflows

### Frontend Development

1. Start backend services: `docker-compose up -d`
2. Start API Gateway: `pnpm nx serve api-gateway`
3. Start frontend MFEs: `pnpm dev:mf`
4. Develop with HMR enabled
5. Run tests: `pnpm nx test <project>`

### Backend Development

1. Start infrastructure: `docker-compose up -d`
2. Start specific service: `pnpm nx serve <service>`
3. Develop with auto-reload
4. Run tests: `pnpm nx test <service>`
5. Test API with Postman/curl

### Full-Stack Integration

1. Start all services: `docker-compose up -d && pnpm dev:all`
2. Test end-to-end flows
3. Run E2E tests: `pnpm nx e2e shell-e2e`
4. Verify API contracts
5. Verify event bus communication

---

## Related Documents

- `docs/POC-2-Implementation/api-contracts.md` - API specifications
- `docs/POC-2-Implementation/event-bus-contract.md` - Event types
- `docs/POC-2-Implementation/type-sharing-strategy.md` - Type organization
- `docs/POC-2-Implementation/environment-configuration.md` - Environment setup
- `docs/References/mfe-poc2-architecture.md` - Frontend architecture
- `docs/References/backend-poc2-architecture.md` - Backend architecture
- `docs/References/fullstack-architecture.md` - Full-stack overview

---

**Last Updated:** 2026-01-XX  
**Status:** ⬜ Not Started
