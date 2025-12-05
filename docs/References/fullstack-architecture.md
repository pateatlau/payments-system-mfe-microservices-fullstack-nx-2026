# Full-Stack Architecture

**Status:** Authoritative  
**Version:** 1.0  
**Date:** 2026-01-XX  
**Tech Stack:** React + Nx + Vite + Module Federation v2 + Node.js + Express + PostgreSQL + pnpm

---

## 1. Executive Summary

This document defines the **master architecture** for the full-stack microfrontend (MFE) platform, integrating both frontend and backend in a single Nx monorepo. The architecture supports a scalable, production-ready system with microfrontends on the frontend and microservices on the backend.

**Key Characteristics:**

- **Single Nx Monorepo** - Unified workspace for frontend and backend
- **Microfrontends (Frontend)** - Shell app + remote MFEs (Auth, Payments, Admin)
- **Microservices (Backend)** - API Gateway + services (Auth, Payments, Admin, Profile)
- **Module Federation v2** - Dynamic remote loading for frontend
- **Event-Based Communication** - Event hub for inter-service communication
- **Unified Tooling** - pnpm workspaces, Vitest testing, TypeScript throughout
- **Production-Ready** - All technologies are production-ready from day one

**POC Purpose & Philosophy:**

The POC phases are designed to **validate the viability, practicality, and effort required** for implementing this full-stack microfrontend and microservices architecture. Security remains a priority throughout all phases, but the bank does not yet have these specific architectures in place. Therefore, the POC phases focus on:

- ✅ **Architecture validation** - Testing microfrontend and microservices patterns
- ✅ **Practicality assessment** - Evaluating real-world challenges with full-stack integration
- ✅ **Effort estimation** - Understanding complexity of full-stack setup and deployment
- ✅ **Security foundation** - Establishing security patterns across frontend and backend
- ✅ **Incremental complexity** - Building from simple to complex in manageable phases

**Scope:** This document covers the complete full-stack architecture from POC-0 through POC-3, including frontend microfrontends, backend microservices, database, event hub, infrastructure, and deployment strategies.

---

## 2. High-Level Architecture

### 2.1 Complete System Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    Frontend Layer (Nx Monorepo)                              │
│                                                                               │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐    │
│  │  Shell App   │  │  Auth MFE   │  │ Payments MFE │  │  Admin MFE   │    │
│  │  (Host)      │  │  (Remote)   │  │  (Remote)    │  │  (Remote)    │    │
│  │  Port 4200   │  │  Port 4201  │  │  Port 4202   │  │  Port 4203   │    │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘    │
│         │                  │                  │                  │               │
│         │ Module Federation v2 (BIMF)         │                  │               │
│         │                  │                  │                  │               │
│         └──────────┬───────┬──────────────────┴──────────────────┘               │
│                    │       │                                                    │
│                    ▼       ▼                                                    │
│              ┌──────────────────┐                                              │
│              │  Shared Libraries │                                              │
│              │  - shared-utils   │                                              │
│              │  - shared-types  │                                              │
│              │  - shared-auth-store │                                          │
│              │  - shared-api-client │                                          │
│              │  - shared-event-bus │                                           │
│              │  - shared-design-system │                                       │
│              └──────────────────┘                                              │
└─────────────────────────────────────────────────────────────────────────────┘
                            │
                            │ HTTP/REST API
                            │ WebSocket (POC-3)
                            │
                            ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                    Infrastructure Layer (POC-3)                             │
│                                                                               │
│                    ┌───────────────┐                                         │
│                    │  nginx (POC-3) │                                         │
│                    │  (Reverse Proxy, │                                       │
│                    │   Load Balancing, │                                     │
│                    │   SSL/TLS)      │                                        │
│                    └───────┬─────────┘                                        │
└────────────────────────────┼─────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                    Backend Layer (Nx Monorepo)                               │
│                                                                               │
│                    ┌───────────────┐                                         │
│                    │  API Gateway  │                                         │
│                    │  (Port 3000)  │                                         │
│                    └───────┬───────┘                                         │
│                            │                                                  │
│        ┌───────────────────┼───────────────────┬──────────────┐             │
│        │                   │                   │              │             │
│        ▼                   ▼                   ▼              ▼             │
│  ┌──────────┐      ┌──────────┐      ┌──────────┐      ┌──────────┐        │
│  │  Auth    │      │ Payments │      │  Admin   │      │ Profile  │        │
│  │ Service  │      │ Service  │      │ Service  │      │ Service  │        │
│  │ (3001)   │      │ (3002)   │      │ (3003)   │      │ (3004)   │        │
│  └────┬─────┘      └────┬─────┘      └────┬─────┘      └────┬─────┘        │
│       │                 │                  │                 │               │
│       │  Event Hub (Redis Pub/Sub → RabbitMQ)                │               │
│       │                 │                  │                 │               │
│       └─────────────────┼───────────────────┴─────────────────┘               │
│                         │                                                   │
│                         ▼                                                   │
│              ┌──────────────────────┐                                       │
│              │  Shared Libraries     │                                       │
│              │  - shared-types      │                                       │
│              │  - shared-utils      │                                       │
│              │  - shared-event-hub  │                                       │
│              └──────────────────────┘                                       │
└─────────────────────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                    Data & Infrastructure Layer                               │
│                                                                               │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐   │
│  │  auth_db     │  │ payments_db  │  │  admin_db    │  │ profile_db   │   │
│  │(PostgreSQL)  │  │(PostgreSQL)  │  │(PostgreSQL)  │  │(PostgreSQL)  │   │
│  │  Port 5432   │  │  Port 5433   │  │  Port 5434   │  │  Port 5435   │   │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘   │
│         │                 │                  │                 │            │
│         │                 │                  │                 │            │
│    ┌────▼─────┐      ┌────▼─────┐      ┌────▼─────┐      ┌────▼─────┐     │
│    │  Auth    │      │ Payments │      │  Admin   │      │ Profile  │     │
│    │ Service  │      │ Service  │      │ Service  │      │ Service  │     │
│    └──────────┘      └──────────┘      └──────────┘      └──────────┘     │
│                                                                               │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐                      │
│  │   RabbitMQ   │  │    Redis     │  │    nginx     │                      │
│  │  (Event Hub) │  │  (Caching)   │  │(Reverse Proxy)│                      │
│  │  Port 5672   │  │  Port 6379   │  │  Port 443    │                      │
│  └──────────────┘  └──────────────┘  └──────────────┘                      │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 2.2 Request Flow

```
User Request
    │
    ▼
┌─────────────────┐
│  Browser        │
│  (Frontend)     │
└────────┬────────┘
         │
         │ 1. Load Shell App (Module Federation)
         ▼
┌─────────────────┐
│  Shell App      │
│  (Host MFE)     │
└────────┬────────┘
         │
         │ 2. Load Remote MFE (Dynamic Import)
         ▼
┌─────────────────┐
│  Remote MFE     │
│  (Auth/Payments)│
└────────┬────────┘
         │
         │ 3. API Request (HTTP/REST)
         ▼
┌─────────────────┐
│  nginx (POC-3)  │
│  (Reverse Proxy)│
└────────┬────────┘
         │
         │ 4. Route to API Gateway
         ▼
┌─────────────────┐
│  API Gateway    │
│  (Auth, Rate    │
│   Limiting)     │
└────────┬────────┘
         │
         │ 5. Route to Service
         ▼
┌─────────────────┐
│  Microservice   │
│  (Auth/Payments)│
└────────┬────────┘
         │
         │ 6. Database Query
         ▼
┌─────────────────┐
│  Service DB     │
│  (auth_db /     │
│   payments_db / │
│   admin_db /    │
│   profile_db)   │
└─────────────────┘
```

### 2.3 Event Flow

```
┌──────────────┐
│  Auth Service│
│  (Publishes) │
└──────┬───────┘
       │
       │ Event: auth:user:registered
       ▼
┌──────────────┐
│  Event Hub   │
│  (Redis/RabbitMQ)│
└──────┬───────┘
       │
       │ Subscribe to Events
       │
┌──────┴───────┐
│              │
▼              ▼
┌──────────┐  ┌──────────┐
│ Payments │  │  Admin   │
│ Service  │  │ Service  │
│(Subscribes)│(Subscribes)│
└──────────┘  └──────────┘
```

---

## 3. Nx Monorepo Structure

### 3.1 Complete Workspace Structure

```
web-mfe-fullstack-workspace/
├── apps/
│   ├── frontend/
│   │   ├── shell/              # Host application (Port 4200)
│   │   ├── auth-mfe/           # Auth remote (Port 4201)
│   │   ├── payments-mfe/        # Payments remote (Port 4202)
│   │   └── admin-mfe/          # Admin remote (Port 4203)
│   └── backend/
│       ├── api-gateway/        # API Gateway (Port 3000)
│       ├── auth-service/       # Auth microservice (Port 3001)
│       ├── payments-service/    # Payments microservice (Port 3002)
│       ├── admin-service/      # Admin microservice (Port 3003)
│       └── profile-service/    # Profile microservice (Port 3004)
├── libs/
│   ├── frontend/
│   │   ├── shared-utils/       # Shared utilities
│   │   ├── shared-types/       # Shared TypeScript types
│   │   ├── shared-auth-store/  # Auth Zustand store
│   │   ├── shared-api-client/  # REST API client
│   │   ├── shared-event-bus/  # Event bus (inter-MFE)
│   │   ├── shared-design-system/ # Design system (POC-2+)
│   │   └── shared-graphql-client/ # GraphQL client (POC-3, optional)
│   └── backend/
│       ├── shared-types/       # Shared TypeScript types
│       ├── shared-utils/       # Shared utilities
│       └── shared-event-hub/   # Event hub (Redis/RabbitMQ)
│   Note: Each service has its own database in POC-3
│   (auth_db, payments_db, admin_db, profile_db)
├── tools/                      # Nx generators, executors
├── nginx/                      # nginx configuration (POC-3)
├── docker-compose.yml          # Local development
├── nx.json                     # Nx configuration
├── package.json                # Root package.json
├── pnpm-lock.yaml              # pnpm lockfile
└── pnpm-workspace.yaml         # pnpm workspace config
```

### 3.2 Package Organization

**Frontend Apps:**

- `apps/frontend/shell` - Host application (Module Federation host)
- `apps/frontend/auth-mfe` - Auth remote MFE
- `apps/frontend/payments-mfe` - Payments remote MFE
- `apps/frontend/admin-mfe` - Admin remote MFE

**Backend Apps:**

- `apps/backend/api-gateway` - API Gateway (routing, auth, rate limiting)
- `apps/backend/auth-service` - Authentication microservice
- `apps/backend/payments-service` - Payments microservice
- `apps/backend/admin-service` - Admin microservice
- `apps/backend/profile-service` - Profile microservice

**Shared Libraries:**

- `libs/frontend/shared-*` - Frontend shared libraries
- `libs/backend/shared-*` - Backend shared libraries
- Cross-references via TypeScript path aliases

### 3.3 Nx Configuration

```json
// nx.json
{
  "$schema": "./node_modules/nx/schemas/nx-schema.json",
  "defaultBase": "main",
  "namedInputs": {
    "default": ["{projectRoot}/**/*", "sharedGlobals"],
    "production": [
      "default",
      "!{projectRoot}/**/?(*.)+(spec|test).[jt]s?(x)?(.snap)",
      "!{projectRoot}/tsconfig.spec.json",
      "!{projectRoot}/.eslintrc.json"
    ],
    "sharedGlobals": []
  },
  "targetDefaults": {
    "build": {
      "dependsOn": ["^build"],
      "inputs": ["production", "^production"],
      "cache": true
    },
    "test": {
      "inputs": ["default", "^production", "{workspaceRoot}/jest.preset.js"],
      "cache": true
    },
    "lint": {
      "inputs": ["default", "{workspaceRoot}/.eslintrc.json"],
      "cache": true
    }
  },
  "affected": {
    "defaultBase": "main"
  },
  "tasksRunnerOptions": {
    "default": {
      "runner": "nx/tasks-runners/default",
      "options": {
        "cacheableOperations": ["build", "lint", "test"]
      }
    }
  }
}
```

### 3.4 pnpm Workspace Configuration

```yaml
# pnpm-workspace.yaml
packages:
  - 'apps/**'
  - 'libs/**'
  - 'tools/**'
```

```json
// package.json (root)
{
  "name": "web-mfe-fullstack-workspace",
  "version": "1.0.0",
  "private": true,
  "packageManager": "pnpm@9.x",
  "scripts": {
    "dev": "nx run-many --target=dev --all --parallel",
    "build": "nx run-many --target=build --all",
    "test": "nx run-many --target=test --all",
    "lint": "nx run-many --target=lint --all"
  }
}
```

---

## 4. Technology Stack Overview

### 4.1 Frontend Stack

| Category              | Technology                  | Version | Purpose                    |
| --------------------- | --------------------------- | ------- | -------------------------- |
| **Framework**         | React                       | 19.2.0  | UI framework               |
| **Monorepo**          | Nx                          | Latest  | Monorepo management        |
| **Bundler**           | Vite                        | 6.x     | Fast dev server, builds    |
| **Module Federation** | @module-federation/enhanced | 0.21.6  | Dynamic remote loading     |
| **Routing**           | React Router                | 7.x     | Client-side routing        |
| **State (Client)**    | Zustand                     | 4.5.x   | Client state management    |
| **State (Server)**    | TanStack Query              | 5.x     | Server state management    |
| **Styling**           | Tailwind CSS                | 4.0+    | Utility-first CSS          |
| **Testing**           | Vitest                      | 2.0.x   | Unit & integration testing |
| **E2E Testing**       | Playwright                  | Latest  | End-to-end testing         |

### 4.2 Backend Stack

| Category           | Technology               | Version     | Purpose                     |
| ------------------ | ------------------------ | ----------- | --------------------------- |
| **Runtime**        | Node.js                  | 24.11.x LTS | JavaScript runtime          |
| **Framework**      | Express                  | 4.x         | Web framework               |
| **Language**       | TypeScript               | 5.9.x       | Type safety                 |
| **Database**       | PostgreSQL               | 16.x        | Relational database         |
| **ORM**            | Prisma                   | 5.x         | Database ORM                |
| **Authentication** | JWT                      | 9.x         | Stateless auth              |
| **Event Hub**      | Redis Pub/Sub → RabbitMQ | 7.x → 3.x   | Inter-service communication |
| **Caching**        | Redis                    | 7.x         | Query result caching        |
| **Testing**        | Vitest                   | 2.0.x       | Unit & integration testing  |
| **API Testing**    | Supertest                | 7.x         | HTTP testing                |

### 4.3 Infrastructure Stack

| Category            | Technology | Version | Purpose                         |
| ------------------- | ---------- | ------- | ------------------------------- |
| **Reverse Proxy**   | nginx      | Latest  | Load balancing, SSL/TLS (POC-3) |
| **Package Manager** | pnpm       | 9.x     | Unified package management      |
| **Monorepo**        | Nx         | Latest  | Workspace management            |

---

## 5. Frontend Architecture

### 5.1 Microfrontend Architecture

**Host Application (Shell):**

- Loads remote MFEs dynamically via Module Federation v2
- Provides routing, layout, and shared context
- Manages authentication state
- Universal header with navigation

**Remote MFEs:**

- **Auth MFE:** Sign in/sign up, password reset
- **Payments MFE:** Payment operations (stubbed), payment history
- **Admin MFE:** User management, audit logs, analytics

**Shared Libraries:**

- `shared-utils` - Utility functions
- `shared-types` - TypeScript types (shared with backend)
- `shared-auth-store` - Zustand auth store
- `shared-api-client` - REST API client
- `shared-event-bus` - Inter-MFE communication (POC-2+)
- `shared-design-system` - Design system components (POC-2+)

### 5.2 Module Federation Configuration

```typescript
// apps/frontend/shell/vite.config.ts
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { federation } from '@module-federation/vite';

export default defineConfig({
  plugins: [
    react(),
    federation({
      name: 'shell',
      remotes: {
        auth_mfe: {
          type: 'module',
          entry: 'http://localhost:4201/remoteEntry.js',
        },
        payments_mfe: {
          type: 'module',
          entry: 'http://localhost:4202/remoteEntry.js',
        },
        admin_mfe: {
          type: 'module',
          entry: 'http://localhost:4203/remoteEntry.js',
        },
      },
      shared: {
        react: { singleton: true },
        'react-dom': { singleton: true },
        'react-router': { singleton: true },
      },
    }),
  ],
});
```

---

## 6. Backend Architecture

### 6.1 Microservices Architecture

**API Gateway:**

- Single entry point for all API requests
- Authentication and authorization
- Rate limiting
- Request routing to microservices
- CORS handling

**Microservices:**

- **Auth Service:** User authentication, JWT tokens, password management
- **Payments Service:** Payment processing (stubbed), transactions
- **Admin Service:** User management, audit logs, system configuration
- **Profile Service:** User profile management

**Shared Libraries:**

- `shared-types` - TypeScript types (shared with frontend)
- `shared-utils` - Utility functions
- `shared-event-hub` - Event publishing/subscribing

**Note:** In POC-3, each service has its own database (auth_db, payments_db, admin_db, profile_db). Each service maintains its own Prisma schema and client in `apps/backend/{service}/prisma/schema.prisma`.

### 6.2 API Gateway Routing

```typescript
// apps/backend/api-gateway/src/routes/index.ts
import express from 'express';
import { authenticate } from '../middleware/auth';
import { requireRole } from '../middleware/rbac';

// Public routes
router.use('/api/auth', authRoutes);

// Protected routes
router.use('/api/payments', authenticate, paymentsRoutes);
router.use('/api/profile', authenticate, profileRoutes);

// Admin routes
router.use('/api/admin', authenticate, requireRole('ADMIN'), adminRoutes);
```

---

## 7. Data Architecture

### 7.1 Database Design

**POC-2 Approach:** Shared database with service-specific schemas

**Rationale for POC-2:**

- Simpler for initial implementation
- Easier transactions across services
- Prisma supports schema separation
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

**Schema Organization:**

- **POC-2:** All models in `libs/backend/shared-db/prisma/schema.prisma` with service-specific schemas
- **POC-3:** Each service has its own Prisma schema in `apps/backend/{service}/prisma/schema.prisma`
- Shared types exported for frontend use

**Cross-Service Data Access (POC-3):**

- **Event Hub** - For async data synchronization
- **API Calls** - For synchronous data access
- **Caching** - For frequently accessed cross-service data

### 7.2 Event Hub Architecture

**POC-2: Redis Pub/Sub (Basic)**

- Simple event publishing/subscribing
- No message persistence
- Fast and lightweight
- Good for architecture validation

**POC-3: RabbitMQ (Production-Ready)**

- Message persistence
- Guaranteed delivery
- Retry mechanisms
- Dead letter queue

---

## 8. Integration Points

### 8.1 Frontend-Backend Integration

**API Communication:**

- Frontend uses `shared-api-client` library
- REST API endpoints (`/api/*`)
- JWT token authentication
- TanStack Query for data fetching

**Type Sharing:**

- Shared types in `libs/frontend/shared-types` and `libs/backend/shared-types`
- Can be consolidated into single shared library
- TypeScript ensures type safety across stack

**Authentication Flow:**

1. User logs in via Auth MFE
2. Frontend calls `/api/auth/login`
3. Backend returns JWT tokens
4. Frontend stores tokens in Zustand store
5. Tokens sent in `Authorization` header for protected routes

### 8.2 Event-Based Communication

**Frontend Event Bus (POC-2+):**

- Inter-MFE communication
- Decouples MFEs
- Event-driven architecture

**Backend Event Hub:**

- Inter-microservices communication
- Async event publishing/subscribing
- Decouples services

---

## 9. Development Workflow

### 9.1 Local Development

**Start All Services:**

```bash
# Install dependencies
pnpm install

# Start all frontend apps
pnpm --filter "@web-mfe/shell" dev &
pnpm --filter "@web-mfe/auth-mfe" dev &
pnpm --filter "@web-mfe/payments-mfe" dev &
pnpm --filter "@web-mfe/admin-mfe" dev &

# Start all backend services
pnpm --filter "@backend/api-gateway" dev &
pnpm --filter "@backend/auth-service" dev &
pnpm --filter "@backend/payments-service" dev &
pnpm --filter "@backend/admin-service" dev &
pnpm --filter "@backend/profile-service" dev &

# Or use Docker Compose
docker-compose up
```

**Nx Commands:**

```bash
# Run all tests
nx run-many --target=test --all

# Build all projects
nx run-many --target=build --all

# Run affected tests
nx affected:test

# Run affected builds
nx affected:build
```

### 9.2 Code Generation

**Nx Generators:**

```bash
# Generate new frontend app
nx generate @nx/react:application shell

# Generate new backend service
nx generate @nx/node:application auth-service

# Generate shared library
nx generate @nx/js:library shared-utils
```

---

## 10. Deployment Architecture

### 10.1 Development Environment

```
┌─────────────────────────────────────────────────────────────┐
│                    Development Environment                    │
│                                                               │
│  Frontend:                                                    │
│  - Shell: http://localhost:4200                             │
│  - Auth MFE: http://localhost:4201                           │
│  - Payments MFE: http://localhost:4202                        │
│  - Admin MFE: http://localhost:4203                          │
│                                                               │
│  Backend:                                                     │
│  - API Gateway: http://localhost:3000                        │
│  - Auth Service: http://localhost:3001                       │
│  - Payments Service: http://localhost:3002                   │
│  - Admin Service: http://localhost:3003                     │
│  - Profile Service: http://localhost:3004                     │
│                                                               │
│  Infrastructure:                                              │
│  - PostgreSQL (POC-2: shared, POC-3: separate per service):  │
│    * auth_db: localhost:5432                                  │
│    * payments_db: localhost:5433                              │
│    * admin_db: localhost:5434                                 │
│    * profile_db: localhost:5435                               │
│  - Redis: localhost:6379                                      │
│  - RabbitMQ: localhost:5672 (POC-3)                          │
└─────────────────────────────────────────────────────────────┘
```

### 10.2 Production Environment (POC-3+)

```
┌─────────────────────────────────────────────────────────────┐
│                    Production Environment                     │
│                                                               │
│  ┌──────────────┐                                            │
│  │    nginx     │  (Reverse Proxy, Load Balancing, SSL/TLS) │
│  └──────┬───────┘                                            │
│         │                                                    │
│    ┌────┴────┬──────────┬──────────┐                        │
│    │         │          │          │                        │
│    ▼         ▼          ▼          ▼                        │
│  Frontend  Frontend  Backend   Backend                      │
│  (Shell)   (MFEs)    (API)     (Services)                   │
│                                                               │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐ │
│  │  auth_db     │  │ payments_db  │  │  admin_db   │  │ profile_db  │ │
│  │(PostgreSQL)  │  │(PostgreSQL)  │  │(PostgreSQL) │  │(PostgreSQL) │ │
│  └──────────────┘  └──────────────┘  └──────────────┘  └──────────────┘ │
│                                                                          │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐                  │
│  │   RabbitMQ   │  │    Redis     │  │    nginx     │                  │
│  └──────────────┘  └──────────────┘  └──────────────┘                  │
└─────────────────────────────────────────────────────────────┘
```

---

## 11. Cross-Cutting Concerns

### 11.1 Authentication & Authorization

**Frontend:**

- Zustand auth store
- JWT token management
- Protected routes
- Role-based UI rendering

**Backend:**

- JWT token validation
- Role-based access control (RBAC)
- API Gateway authentication middleware

### 11.2 State Management

**Frontend:**

- **Client State:** Zustand (auth, UI state)
- **Server State:** TanStack Query (API data, caching)
- **Inter-MFE:** Event Bus (POC-2+)

**Backend:**

- **Service State:** In-memory (stateless services)
- **Shared State:** Event Hub (inter-service communication)
- **Persistent State:** PostgreSQL database

### 11.3 Error Handling

**Frontend:**

- React Error Boundaries
- TanStack Query error handling
- Global error handler

**Backend:**

- Express error middleware
- Structured error responses
- Error logging (Winston)

### 11.4 Logging & Monitoring

**Frontend:**

- Console logging (development)
- Sentry error tracking (POC-3+)

**Backend:**

- Winston structured logging
- Sentry error tracking (POC-3+)
- Prometheus metrics (POC-3+)
- OpenTelemetry tracing (POC-3+)

---

## 12. Security Architecture

### 12.1 Security Layers

**Frontend:**

- Input validation (Zod)
- XSS protection
- CSRF protection
- Secure token storage

**Backend:**

- JWT authentication
- Password hashing (bcrypt)
- Rate limiting
- CORS configuration
- Security headers (Helmet)
- Input validation (Zod)

**Infrastructure (POC-3):**

- nginx security headers
- SSL/TLS termination
- Rate limiting at infrastructure level

### 12.2 Authentication Flow

```
1. User enters credentials in Auth MFE
   ↓
2. Frontend calls POST /api/auth/login
   ↓
3. Backend validates credentials
   ↓
4. Backend generates JWT tokens
   ↓
5. Frontend stores tokens in Zustand store
   ↓
6. Frontend includes token in Authorization header
   ↓
7. API Gateway validates token
   ↓
8. Request routed to microservice
```

---

## 13. Testing Strategy

### 13.1 Testing Pyramid

**Frontend:**

- **Unit Tests (70%):** Vitest + React Testing Library
- **Integration Tests (20%):** Vitest + Supertest
- **E2E Tests (10%):** Playwright

**Backend:**

- **Unit Tests (60%):** Vitest
- **Integration Tests (30%):** Vitest + Supertest
- **E2E Tests (10%):** Playwright

### 13.2 Test Organization

```
apps/
├── frontend/
│   └── shell/
│       ├── src/
│       └── src/**/*.test.tsx
└── backend/
    └── auth-service/
        ├── src/
        └── src/**/*.test.ts

libs/
└── shared-utils/
    ├── src/
    └── src/**/*.test.ts
```

---

## 14. CI/CD Strategy

### 14.1 GitHub Actions Workflow

```yaml
# .github/workflows/ci.yml
name: CI

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: pnpm/action-setup@v2
        with:
          version: 9
      - uses: actions/checkout@v3
      - run: pnpm install
      - run: nx run-many --target=test --all
      - run: nx run-many --target=lint --all
      - run: nx run-many --target=build --all
```

### 14.2 Deployment Pipeline

**POC-2:**

- Automated testing
- Build verification
- Basic staging deployment

**POC-3:**

- Multi-environment pipeline
- Infrastructure deployment
- Advanced testing
- Production deployment

---

## 15. Performance Considerations

### 15.1 Frontend Performance

- **Code Splitting:** Module Federation enables dynamic loading
- **Lazy Loading:** Route-based code splitting
- **Caching:** TanStack Query caching
- **Bundle Optimization:** Vite optimizations

### 15.2 Backend Performance

- **Database Indexing:** Strategic indexes for queries
- **Connection Pooling:** Prisma connection pooling
- **Caching:** Redis query result caching (POC-3)
- **Load Balancing:** nginx load balancing (POC-3)

---

## 16. Scalability Considerations

### 16.1 Horizontal Scaling

**Frontend:**

- Multiple instances of each MFE
- CDN for static assets (POC-3+)
- Load balancing via nginx (POC-3)

**Backend:**

- Multiple instances of each microservice
- Load balancing via nginx (POC-3)
- Database connection pooling
- Event hub for async communication

### 16.2 Vertical Scaling

- Optimize bundle sizes
- Database query optimization
- Caching strategies
- Resource monitoring

---

## 17. Implementation Phases

### 17.1 POC-0: Foundation

**Frontend:**

- Shell app + Hello Remote MFE
- Module Federation v2 setup
- Basic routing

**Backend:**

- Not included in POC-0

**Deliverables:**

- ✅ Working microfrontend architecture
- ✅ Dynamic remote loading
- ✅ Module Federation v2 validation

---

### 17.2 POC-1: Authentication & Payments (Stubbed)

**Frontend:**

- Auth MFE (sign in/sign up)
- Payments MFE (stubbed operations)
- Shell updates (auth flow, routing)
- Zustand state management
- TanStack Query (mock APIs)

**Backend:**

- Not included in POC-1 (mock APIs only)

**Deliverables:**

- ✅ Complete authentication flow
- ✅ Payment operations (stubbed)
- ✅ Routing and state management

---

### 17.3 POC-2: Backend Integration

**Frontend:**

- Real backend API integration
- Event bus for inter-MFE communication
- Admin MFE
- Design system (Tailwind + shadcn/ui)

**Backend:**

- API Gateway
- Auth Service
- Payments Service (stubbed)
- Admin Service
- Profile Service
- Event Hub (Redis Pub/Sub)
- Database (POC-2: Shared PostgreSQL, POC-3: Separate databases per service)

**Deliverables:**

- ✅ Full-stack integration
- ✅ Real authentication
- ✅ Event-based communication
- ✅ Design system

---

### 17.4 POC-3: Production Infrastructure

**Frontend:**

- WebSocket support
- Advanced caching
- Performance optimizations
- Enhanced observability

**Backend:**

- Separate databases per service (migration from shared database)
- nginx reverse proxy
- RabbitMQ event hub
- GraphQL API (optional)
- WebSocket support
- Advanced caching
- Enhanced observability

**Deliverables:**

- ✅ Production-ready infrastructure
- ✅ Advanced features
- ✅ Performance optimizations
- ✅ Enhanced monitoring

---

## 18. Key Technical Decisions

### 18.1 Monorepo Strategy

**Decision:** Single Nx monorepo for frontend and backend

**Rationale:**

- Unified tooling (pnpm, Vitest, TypeScript)
- Shared types and utilities
- Simplified CI/CD
- Better code sharing
- Single source of truth

**Reference:** See `docs/adr/poc-0/0001-use-nx-monorepo.md`

---

### 18.2 Module Federation v2

**Decision:** Use Module Federation v2 (BIMF) for frontend

**Rationale:**

- Future-proof
- Better performance
- Modern architecture
- Production-ready

**Reference:** See `docs/adr/poc-0/0003-use-module-federation-v2.md`

---

### 18.3 Microservices Architecture

**Decision:** Microservices for backend

**Rationale:**

- Scalability
- Independent deployment
- Technology flexibility
- Team autonomy

**Reference:** See `docs/backend-architecture.md`

---

### 18.4 Event Hub

**Decision:** Event-based inter-service communication

**Rationale:**

- Decoupling
- Scalability
- Async communication
- Event-driven architecture

**Reference:** See `docs/backend-event-hub-implementation-plan.md`

---

## 19. Dependencies & Integration

### 19.1 Frontend Dependencies on Backend

- API endpoints must be available
- Authentication flow must work
- Event types must match

### 19.2 Backend Dependencies on Frontend

- API contract must be stable
- Authentication tokens must be valid
- Request format must match

### 19.3 Shared Dependencies

- **TypeScript types** - Shared between frontend and backend
- **Validation schemas** - Zod schemas can be shared
- **Constants** - Shared constants (roles, statuses, etc.)

---

## 20. Development Best Practices

### 20.1 Code Organization

- **Apps:** Application entry points
- **Libs:** Reusable libraries
- **Shared:** Cross-cutting concerns
- **Tools:** Nx generators, executors

### 20.2 Type Safety

- TypeScript throughout
- Shared types between frontend and backend
- Runtime validation with Zod

### 20.3 Testing

- Test coverage targets: 70% (POC-2), 75% (POC-3)
- Unit tests for business logic
- Integration tests for API endpoints
- E2E tests for critical flows

---

## 21. Related Documents

### 21.1 Frontend Architecture

- `docs/mfe-poc0-architecture.md` - POC-0 frontend architecture
- `docs/mfe-poc1-architecture.md` - POC-1 frontend architecture
- `docs/mfe-poc2-architecture.md` - POC-2 frontend architecture
- `docs/mfe-poc3-architecture.md` - POC-3 frontend architecture

### 21.2 Backend Architecture

- `docs/backend-architecture.md` - High-level backend architecture
- `docs/backend-poc2-architecture.md` - POC-2 backend architecture
- `docs/backend-poc3-architecture.md` - POC-3 backend architecture

### 21.3 Tech Stack

- `docs/mfe-poc0-tech-stack.md` - POC-0 frontend tech stack
- `docs/mfe-poc1-tech-stack.md` - POC-1 frontend tech stack
- `docs/mfe-poc2-tech-stack.md` - POC-2 frontend tech stack
- `docs/mfe-poc3-tech-stack.md` - POC-3 frontend tech stack
- `docs/backend-poc2-tech-stack.md` - POC-2 backend tech stack
- `docs/backend-poc3-tech-stack.md` - POC-3 backend tech stack

### 21.4 Implementation Guides

- `docs/backend-development-setup.md` - Developer setup guide
- `docs/backend-database-implementation.md` - Database implementation
- `docs/backend-deployment-guide.md` - Deployment guide
- `docs/backend-auth-service-implementation.md` - Auth service guide
- `docs/backend-payments-service-implementation.md` - Payments service guide
- `docs/backend-admin-service-implementation.md` - Admin service guide
- `docs/backend-profile-service-implementation.md` - Profile service guide
- `docs/backend-api-gateway-implementation.md` - API Gateway guide

### 21.5 Cross-Cutting

- `docs/adr/README.md` - Architecture Decision Records index
- `docs/security-strategy-banking.md` - Security strategy
- `docs/session-management-strategy.md` - Session management
- `docs/testing-strategy-poc-phases.md` - Testing strategy
- `docs/cicd-deployment-recommendation.md` - CI/CD strategy
- `docs/backend-testing-strategy.md` - Backend testing strategy
- `docs/backend-event-hub-implementation-plan.md` - Event hub plan

---

## 22. Future Enhancements

### 22.1 MVP Phase

- Real PSP integration (payments)
- Enhanced security features
- Advanced analytics
- Multi-region deployment

### 22.2 Production Phase

- Service mesh (optional)
- Advanced monitoring
- Compliance features
- Enterprise features

---

**Last Updated:** 2026-01-XX  
**Status:** Authoritative - Master Architecture Document
