# MFE POC-0 Architecture & Implementation Plan

**Status:** ✅ Complete (Migrated to Rspack in POC-1)  
**Version:** 1.0  
**Date:** 2026-01-XX  
**Tech Stack:** React + Nx + Vite + Module Federation v2  
**Note:** POC-0 used Vite. POC-1+ migrated to Rspack to enable HMR with Module Federation v2. See `docs/Rspack-Migration/` for migration details.

---

## 1. Executive Summary

This document defines the architecture and implementation plan for a **microfrontend (MFE) platform** using:

- **React 19** (no React Native/RNW)
- **Nx monorepo** for scalable monorepo management
- **Vite** for fast development and builds
- **Module Federation v2 (BIMF)** for runtime code sharing
- **TypeScript** for type safety

**POC Purpose & Philosophy:**

The POC phases (POC-0, POC-1, POC-2, POC-3, and potentially beyond) are designed to **validate the viability, practicality, and effort required** for implementing this microfrontend architecture. Security remains a priority throughout all phases, but the bank does not yet have these specific architectures (both universal MFE and MFE) in place. Therefore, the POC phases focus on:

- ✅ **Architecture validation** - Testing technical feasibility and patterns
- ✅ **Practicality assessment** - Evaluating real-world implementation challenges
- ✅ **Effort estimation** - Understanding development complexity and resource requirements
- ✅ **Security foundation** - Establishing security patterns and practices from the start
- ✅ **Incremental complexity** - Building from simple to complex in manageable phases

This explains why certain features (e.g., payment operations) are **stubbed** rather than fully implemented - the focus is on validating the architecture and patterns, not delivering complete product features (which will come in MVP/Production phases).

**Scope:** POC-0 establishes the foundation, with clear paths to POC-1, POC-2, POC-3, MVP, and Production.

---

## 2. Architecture Overview

### 2.1 High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    MFE Platform                     │
│                                                               │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │  Shell App   │  │  Auth MFE   │  │ Payments MFE │      │
│  │  (Host)      │  │  (Remote)   │  │  (Remote)    │      │
│  │  Port 4200   │  │  Port 4201  │  │  Port 4202   │      │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘      │
│         │                  │                  │               │
│         │ Module Federation v2 (BIMF)         │               │
│         │                  │                  │               │
│         └──────────┬───────┬──────────────────┘               │
│                    │       │                                  │
│                    ▼       ▼                                  │
│              ┌──────────────────┐                            │
│              │  Shared Libraries │                           │
│              │  - shared-utils   │                           │
│              │  - shared-ui      │                           │
│              │  - shared-types  │                           │
│              └──────────────────┘                            │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
                    ┌───────────────┐
                    │  Backend API  │
                    │  (POC-2)      │
                    └───────────────┘
```

### 2.2 Technology Stack

| Category              | Technology                  | Version     | Rationale                                                                                                           |
| --------------------- | --------------------------- | ----------- | ------------------------------------------------------------------------------------------------------------------- |
| **Monorepo**          | Nx                          | Latest      | Scalable, build caching, task orchestration<br>See `docs/adr/poc-0/0001-use-nx-monorepo.md`                         |
| **Runtime**           | Node.js                     | 24.11.x LTS | Latest LTS                                                                                                          |
| **Framework**         | React                       | 19.2.0      | Latest stable                                                                                                       |
| **Bundler**           | Rspack                      | Latest      | Fast builds, HMR with MF v2 (migrated from Vite in POC-1)<br>See `docs/adr/poc-1/0006-migrate-to-rspack-bundler.md` |
| **Module Federation** | @module-federation/enhanced | 0.21.6      | BIMF (Module Federation v2)<br>See `docs/adr/poc-0/0003-use-module-federation-v2.md`                                |
| **Language**          | TypeScript                  | 5.9.x       | Type safety                                                                                                         |
| **Package Manager**   | pnpm/npm                    | Latest      | Nx compatible                                                                                                       |
| **Routing**           | React Router                | 7.x         | Latest, production-ready                                                                                            |
| **State (Client)**    | Zustand                     | 4.5.x       | Lightweight, scalable                                                                                               |
| **State (Server)**    | TanStack Query              | 5.x         | Server state management                                                                                             |
| **Styling**           | Tailwind CSS                | 4.0+        | Latest, fast builds                                                                                                 |
| **Design System**     | shadcn/ui                   | Latest      | POC-2                                                                                                               |
| **Form Handling**     | React Hook Form             | 7.52.x      | Industry standard                                                                                                   |
| **Validation**        | Zod                         | 3.23.x      | Type-safe validation                                                                                                |
| **HTTP Client**       | Axios                       | 1.7.x       | Production-ready                                                                                                    |
| **Testing**           | Jest                        | 30.x        | Mature ecosystem, Rspack-compatible (migrated from Vitest in POC-1)                                                 |
| **E2E Testing**       | Playwright                  | Latest      | Web E2E testing<br>See `docs/adr/poc-0/0005-use-playwright-for-e2e.md`                                              |
| **Code Quality**      | ESLint                      | 9.x         | Latest, flat config                                                                                                 |
| **Formatting**        | Prettier                    | 3.3.x       | Code formatting                                                                                                     |
| **Type Checking**     | TypeScript ESLint           | 8.x         | TS-specific linting                                                                                                 |

---

## 3. Project Structure

### 3.1 Nx Workspace Structure

```
web-mfe-workspace/
├── apps/
│   ├── shell/              # Host application
│   ├── auth-mfe/           # Auth remote (POC-1)
│   └── payments-mfe/       # Payments remote (POC-1)
├── libs/
│   ├── shared-utils/       # Shared utilities
│   ├── shared-ui/          # Shared UI components
│   ├── shared-types/       # Shared TypeScript types
│   ├── shared-api-client/  # API client (POC-2)
│   └── shared-auth-store/ # Auth store (POC-1)
├── tools/                  # Nx generators, executors
├── nx.json                 # Nx configuration
├── package.json
└── pnpm-workspace.yaml     # pnpm workspace config (recommended)
```

### 3.2 Package Responsibilities

**Shell App (Host):**

- Application routing (React Router 7)
- Layout (header, navigation)
- Remote loading and orchestration
- Shared state management (Zustand)
- Authentication flow

**Auth MFE (Remote):**

- Sign-in/sign-up pages
- Authentication logic
- Exposes: `./SignIn`, `./SignUp`

**Payments MFE (Remote):**

- Payments dashboard
- Payment operations (stubbed - no actual PSP integration)
- Exposes: `./PaymentsPage`

**Note:** All payment flows are stubbed (no actual Payment Service Provider/PSP integration) across all POC phases. Real PSP integration will be implemented in MVP/Production phases.

**Shared Libraries:**

- `shared-utils`: Pure TypeScript utilities
- `shared-ui`: Shared React components
- `shared-types`: TypeScript types/interfaces
- `shared-api-client`: Axios client (POC-2)
- `shared-auth-store`: Zustand auth store (POC-1)

---

## 4. POC-0 Implementation Plan

### 4.1 Phase 1: Foundation Setup

**Goal:** Establish Nx workspace with basic shell and remote

**Tasks:**

1. **Initialize Nx Workspace**

   ```bash
   npx create-nx-workspace@latest web-mfe-workspace \
     --preset=react \
     --packageManager=pnpm \
     --nxCloud=skip
   ```

2. **Install Dependencies**

   ```bash
   pnpm add -w react@19.2.0 react-dom@19.2.0
   pnpm add -D -w @nx/vite @nx/react vite@6.x
   pnpm add -D -w @module-federation/enhanced@0.21.6
   pnpm add -D -w typescript@5.9.x
   ```

3. **Create Shell App**

   ```bash
   nx generate @nx/react:application shell \
     --bundler=vite \
     --style=css \
     --routing=true
   ```

4. **Create Hello Remote**

   ```bash
   nx generate @nx/react:library hello-remote \
     --bundler=vite \
     --style=css
   ```

5. **Configure Module Federation v2**
   - Setup Vite plugin for Module Federation v2
   - Configure shell to consume remote
   - Configure remote to expose components

**Deliverables:**

- ✅ Nx workspace setup
- ✅ Shell app running
- ✅ Hello remote app running
- ✅ Dynamic remote loading working
- ✅ Module Federation v2 configured

---

### 4.2 Phase 2: Module Federation v2 Configuration

**Goal:** Configure Module Federation v2 (BIMF) with Vite

**Implementation:**

**Vite Plugin Setup:**

```typescript
// apps/shell/vite.config.ts
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import federation from '@originjs/vite-plugin-federation';

export default defineConfig({
  plugins: [
    react(),
    federation({
      name: 'shell',
      remotes: {
        helloRemote: 'http://localhost:4201/assets/remoteEntry.js',
      },
      shared: {
        react: { singleton: true, requiredVersion: '19.2.0' },
        'react-dom': { singleton: true, requiredVersion: '19.2.0' },
      },
    }),
  ],
  build: {
    target: 'esnext',
    minify: false,
    cssCodeSplit: false,
  },
});
```

**Remote Configuration:**

```typescript
// apps/hello-remote/vite.config.ts
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import federation from '@originjs/vite-plugin-federation';

export default defineConfig({
  plugins: [
    react(),
    federation({
      name: 'helloRemote',
      filename: 'remoteEntry.js',
      exposes: {
        './HelloRemote': './src/HelloRemote.tsx',
      },
      shared: {
        react: { singleton: true, requiredVersion: '19.2.0' },
        'react-dom': { singleton: true, requiredVersion: '19.2.0' },
      },
    }),
  ],
  build: {
    target: 'esnext',
    minify: false,
    cssCodeSplit: false,
  },
  server: {
    port: 4201,
    cors: true,
  },
});
```

**Note:** For Module Federation v2 (BIMF), use `@module-federation/enhanced` plugin instead.

**Deliverables:**

- ✅ Module Federation v2 configured
- ✅ Remote loading working
- ✅ Shared dependencies working
- ✅ Development workflow established

---

### 4.3 Phase 3: Shared Libraries

**Goal:** Create shared libraries for code reuse

**Libraries to Create:**

1. **shared-utils**

   ```bash
   nx generate @nx/js:library shared-utils \
     --bundler=tsc \
     --unitTestRunner=vitest
   ```

2. **shared-ui**

   ```bash
   nx generate @nx/react:library shared-ui \
     --bundler=vite \
     --unitTestRunner=vitest
   ```

3. **shared-types**
   ```bash
   nx generate @nx/js:library shared-types \
     --bundler=tsc
   ```

**Deliverables:**

- ✅ Shared utilities library
- ✅ Shared UI components library
- ✅ Shared types library
- ✅ Libraries consumed by shell and remotes

---

### 4.4 Phase 4: Testing & Validation

**Goal:** Verify POC-0 functionality

**Test Scenarios:**

- ✅ Shell loads successfully
- ✅ Remote loads dynamically
- ✅ Shared dependencies work
- ✅ Hot Module Replacement (HMR) works
- ✅ Production builds work
- ✅ TypeScript types work across boundaries

**Deliverables:**

- ✅ Working POC-0 demo
- ✅ Documentation
- ✅ Test results

---

## 5. POC-1 Implementation Plan

### 5.1 Overview

**Goal:** Add authentication and payments system foundation (similar to Universal MFE POC-1)

**New Features:**

- Auth MFE (sign-in/sign-up)
- Payments MFE (payments dashboard)
- React Router 7 for routing
- Zustand for state management (client state)
- TanStack Query for server state (with stubbed payment APIs, mock authentication)
- Tailwind CSS v4 for styling (inline classes)
- RBAC (roles: ADMIN, CUSTOMER, VENDOR)
- Universal header with branding and navigation
- Route protection
- Mock authentication (no real backend yet)

### 5.2 New Applications

**Auth MFE:**

```bash
nx generate @nx/react:application auth-mfe \
  --bundler=vite \
  --style=css \
  --routing=false
```

**Payments MFE:**

```bash
nx generate @nx/react:application payments-mfe \
  --bundler=vite \
  --style=css \
  --routing=false
```

### 5.3 New Libraries

**Shared Auth Store:**

```bash
nx generate @nx/js:library shared-auth-store \
  --bundler=tsc
```

**Shared API Client (POC-2):**

```bash
nx generate @nx/js:library shared-api-client \
  --bundler=tsc
```

### 5.4 Shell Updates

**Routing:**

- Integrate React Router 7
- Route protection (private routes)
- Redirect logic based on auth state

**Layout:**

- Universal header with branding
- Navigation items
- Logout functionality

**State Management:**

- Setup Zustand stores (auth, UI)
- Setup TanStack Query (with stubbed payment APIs, mock authentication)
- Shared auth store between shell and remotes

**Integration:**

- Integrate auth MFE (sign-in/sign-up pages)
- Integrate payments MFE (payments dashboard)
- Dynamic remote loading

**Styling:**

- Tailwind CSS v4 setup
- Inline utility classes (POC-1)
- Responsive design

---

## 6. POC-2 Implementation Plan

### 6.1 Overview

**Goal:** Integrate with backend API

**New Features:**

- Replace stubbed APIs with backend API (still stubbed - no PSP)
- API client integration
- Authentication with JWT
- Payment operations (stubbed - backend API but no actual PSP)
- Admin functionality (ADMIN role)

### 6.2 Backend Integration

**Backend Architecture:**

- Microservices: Auth, Payments, Admin, Profile
- REST API (GraphQL future)
- PostgreSQL database
- Node.js + Express
- JWT authentication

**See:** `docs/backend-architecture.md` for detailed backend architecture

**API Client Setup:**

```typescript
// libs/shared-api-client/src/index.ts
import axios from 'axios';
import { useAuthStore } from '@web-mfe/shared-auth-store';

const apiClient = axios.create({
  baseURL: process.env['NX_API_BASE_URL'] || 'http://localhost:3000/api',
  timeout: 10000,
});

// Request interceptor
apiClient.interceptors.request.use(config => {
  const token = useAuthStore.getState().user?.token;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default apiClient;
```

**TanStack Query Integration:**

```typescript
// libs/payments-mfe/src/hooks/usePayments.ts
import { useQuery } from '@tanstack/react-query';
import apiClient from '@web-mfe/shared-api-client';

export const usePayments = () => {
  return useQuery({
    queryKey: ['payments'],
    queryFn: async () => {
      const response = await apiClient.get('/payments');
      return response.data.data;
    },
  });
};
```

### 6.3 Event Bus (POC-2)

**Inter-MFE Communication:**

- Implement event bus for inter-MFE communication
- Replace shared Zustand stores with event bus
- Decouple MFEs (no shared state dependencies)
- MFEs publish/subscribe to events

**Implementation:**

```typescript
// libs/shared-event-bus/src/index.ts
class EventBus {
  private listeners: Map<string, Set<Function>> = new Map();

  on(event: string, callback: Function) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(callback);
  }

  off(event: string, callback: Function) {
    this.listeners.get(event)?.delete(callback);
  }

  emit(event: string, data?: any) {
    this.listeners.get(event)?.forEach(callback => callback(data));
  }
}

export const EventBus = new EventBus();
```

**Migration from POC-1:**

- POC-1: Shared Zustand stores (acceptable for POC)
- POC-2: Event bus (decoupled architecture)

---

## 7. MVP → Production Path

### 7.1 MVP Phase

**Enhancements:**

- Enhanced session management (cross-tab/cross-device sync improvements)
- "Logout other devices" feature (device management UI)
- Multi-Factor Authentication (MFA)
- Advanced security monitoring
- Enhanced CI/CD pipeline
- Production optimizations
- Real SSL/TLS certificates (replacing self-signed from POC-3)

**Note:** See `docs/mfe-poc2-architecture.md` for POC-2 details and `docs/mfe-poc3-architecture.md` for POC-3 details.

### 7.2 Production Phase

**Enhancements:**

- Advanced monitoring
- Analytics integration
- CDN deployment
- Multi-region support
- Advanced caching
- Security hardening

---

## 8. Technology Stack Details

### 8.1 Core Technologies

**Nx Monorepo:**

- ✅ Build caching (only rebuild what changed)
- ✅ Task orchestration (parallel execution)
- ✅ Dependency graph (visualize dependencies)
- ✅ Code generation (scaffold new apps/libs)
- ✅ Affected projects (only test/build affected)
- ✅ Excellent developer experience

**Vite:**

- ✅ Fast dev server (instant startup)
- ✅ Excellent HMR (near-instant updates)
- ✅ Fast production builds (esbuild + Rollup)
- ✅ Native ESM (modern JavaScript)
- ✅ TypeScript support (excellent)
- ✅ Plugin ecosystem (large)

**Module Federation v2 (BIMF):**

- ✅ Runtime code sharing
- ✅ Independent deployments
- ✅ Shared dependencies
- ✅ Type-safe remotes (with TypeScript)
- ✅ Better than MF v1 (enhanced features)

### 8.2 State Management

**Client State (Zustand):**

- Auth state
- UI state
- Theme state

**Server State (TanStack Query):**

- API data
- Caching
- Background updates

**Inter-MFE Communication:**

- POC-1: Shared Zustand stores
- POC-2: Event bus

### 8.3 Styling

**POC-0:**

- Basic CSS or inline Tailwind classes

**POC-1:**

- Tailwind CSS v4 (inline utility classes)
- No design system yet

**POC-2:**

- Design system (shadcn/ui)
- Shared component library
- Consistent design tokens

**POC-3:**

- Advanced caching strategies
- Performance optimizations
- Session management (cross-tab, cross-device)
- nginx infrastructure

---

## 9. Implementation Phases Summary

### POC-0 (Current)

**Scope:**

- Nx workspace setup
- Shell app (host)
- Hello remote (remote)
- Module Federation v2 (BIMF) configuration
- Shared libraries (utils, ui, types)
- Development workflow
- Production builds

**Timeline:** 1-2 weeks

**Deliverables:**

- ✅ Working shell + remote
- ✅ Dynamic remote loading
- ✅ Module Federation v2 configured
- ✅ Shared libraries working
- ✅ Development workflow established
- ✅ Production builds working

---

### POC-1

**Scope:**

- Auth MFE (sign-in/sign-up)
- Payments MFE (payments dashboard)
- React Router 7 (routing)
- Zustand (client state)
- TanStack Query (server state with stubbed payment APIs, mock authentication)
- Tailwind CSS v4 (inline classes)
- RBAC (ADMIN, CUSTOMER, VENDOR roles)
- Universal header
- Route protection
- Mock authentication

**Timeline:** 3-4 weeks

**Deliverables:**

- ✅ Authentication flow (mock)
- ✅ Payments dashboard (stubbed data - no actual PSP)
- ✅ Role-based access control
- ✅ Stubbed payment APIs (TanStack Query)
- ✅ Universal header
- ✅ Route protection

---

### POC-2

**Scope:**

- Backend integration (REST API)
- Backend API integration (replace stubbed payment APIs with backend API - still stubbed, no PSP)
- JWT authentication
- Event bus (inter-MFE communication)
- Admin functionality (ADMIN role)
- Design system (shadcn/ui)
- Basic observability (error logging, API logging, health checks, basic metrics)
- TanStack Query with real backend

**Timeline:** 2-3 weeks

**Deliverables:**

- ✅ Backend integration
- ✅ Real authentication (JWT)
- ✅ Payment operations (stubbed - backend API but no actual PSP)
- ✅ Event bus (decoupled MFEs)
- ✅ Admin functionality
- ✅ API client library
- ✅ Design system (shadcn/ui)
- ✅ Basic observability (logging, metrics, health checks)

---

### POC-3

**Scope:**

- nginx reverse proxy (load balancing, SSL/TLS termination with self-signed certificates)
- GraphQL API (optional, alongside REST)
- WebSocket for real-time updates
- Advanced caching strategies (browser, CDN, service worker)
- Performance optimizations (code splitting, lazy loading, bundle optimization)
- Enhanced observability (Sentry error tracking, performance monitoring, infrastructure monitoring)
- Basic analytics (architecture-focused: MFE metrics, API patterns, system usage)
- Session management (cross-tab sync, cross-device sync - basic implementation)

**Timeline:** 4-5 weeks

**Deliverables:**

- ✅ nginx reverse proxy configured
- ✅ SSL/TLS with self-signed certificates
- ✅ WebSocket real-time updates
- ✅ GraphQL integration (if implemented)
- ✅ Service Worker and offline support
- ✅ Performance optimizations
- ✅ Enhanced observability (Sentry, infrastructure monitoring)
- ✅ Basic analytics (architecture-focused)
- ✅ Monitoring dashboard
- ✅ Basic cross-tab session sync
- ✅ Basic cross-device session sync

**Note:** See `docs/mfe-poc3-architecture.md` for detailed POC-3 architecture.

---

### MVP

**Scope:**

- Design system (shadcn/ui)
- Error tracking (Sentry)
- Performance monitoring
- Comprehensive testing (Vitest + Playwright)
- Production optimizations
- CI/CD pipeline
- Documentation

**Timeline:** 4-6 weeks

---

### Production

**Scope:**

- Advanced monitoring
- Analytics
- CDN deployment
- Multi-region
- Security hardening

**Timeline:** Ongoing

---

## 10. Nx Configuration

### 10.1 Module Federation Executor

**Custom Executor (if needed):**

```typescript
// tools/executors/module-federation-vite/executor.ts
import { ExecutorContext } from '@nx/devkit';
import { exec } from 'child_process';

export default async function moduleFederationExecutor(
  options: any,
  context: ExecutorContext
) {
  // Custom executor for Module Federation v2 with Vite
  // This may not be needed if Vite plugin works directly
}
```

### 10.2 Build Configuration

**nx.json:**

```json
{
  "targetDefaults": {
    "build": {
      "executor": "@nx/vite:build",
      "outputs": ["{options.outputPath}"],
      "cache": true
    },
    "serve": {
      "executor": "@nx/vite:dev-server",
      "cache": false
    }
  }
}
```

---

## 11. Development Workflow

### 11.1 Local Development

**Start Shell:**

```bash
nx serve shell
```

**Start Remote:**

```bash
nx serve hello-remote
```

**Run All:**

```bash
nx run-many --target=serve --projects=shell,hello-remote --parallel
```

### 11.2 Build

**Build All:**

```bash
nx run-many --target=build --all
```

**Build Affected:**

```bash
nx affected --target=build
```

### 11.3 Testing

**Unit Tests:**

```bash
nx test shell
nx test hello-remote
```

**E2E Tests:**

```bash
nx e2e shell-e2e
```

---

## 12. Integration with Backend

### 12.1 Backend Architecture

**Backend Stack (POC-2):**

- Node.js + Express
- PostgreSQL
- Microservices: Auth, Payments, Admin, Profile
- REST API (GraphQL optional in POC-3)
- JWT authentication

**See:** `docs/backend-architecture.md` for detailed backend architecture

**Note:** GraphQL API is optional and can be added in POC-3 alongside REST API. See `docs/mfe-poc3-architecture.md` Section 4.2 for GraphQL implementation details.

### 12.2 API Client Setup

**Shared API Client Library:**

```typescript
// libs/shared-api-client/src/index.ts
import axios from 'axios';
import { useAuthStore } from '@web-mfe/shared-auth-store';

const apiClient = axios.create({
  baseURL: process.env['NX_API_BASE_URL'] || 'http://localhost:3000/api',
  timeout: 10000,
});

// Request interceptor - Add auth token
apiClient.interceptors.request.use(config => {
  const token = useAuthStore.getState().user?.token;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor - Handle errors
apiClient.interceptors.response.use(
  response => response,
  async error => {
    if (error.response?.status === 401) {
      // Refresh token or logout
      useAuthStore.getState().logout();
    }
    return Promise.reject(error);
  }
);

export default apiClient;
```

### 12.3 Environment Configuration

**Environment Variables:**

```bash
# .env.local (local development)
NX_API_BASE_URL=http://localhost:3000/api

# .env.production (production)
NX_API_BASE_URL=https://api.example.com/api
```

**Nx Environment Files:**

- `.env.local` - Local development
- `.env.production` - Production
- `.env.staging` - Staging (if needed)

**Usage in Code:**

```typescript
// Access via process.env['NX_API_BASE_URL']
const apiUrl = process.env['NX_API_BASE_URL'];
```

---

## 13. Scaling Considerations

### 13.1 Monorepo Scaling

**Nx Advantages:**

- ✅ **Build caching** - Only rebuild what changed (massive time savings)
- ✅ **Task orchestration** - Parallel execution across projects
- ✅ **Dependency graph** - Visualize dependencies, detect cycles
- ✅ **Affected projects** - Only test/build affected projects
- ✅ **Code generation** - Scaffold new apps/libs quickly
- ✅ **Computation caching** - Cache test results, lint results, etc.
- ✅ **Distributed caching** - Share cache across team (Nx Cloud)

**Scales to:**

- 100+ applications
- 1000+ libraries
- Large teams
- Enterprise monorepos

### 13.2 Performance

**Vite Advantages:**

- ✅ **Fast dev server** - Instant startup (vs Webpack's seconds)
- ✅ **Fast HMR** - Near-instant updates
- ✅ **Fast production builds** - esbuild + Rollup (faster than Webpack)
- ✅ **Native ESM** - Modern JavaScript, better tree-shaking
- ✅ **Optimized chunks** - Better code splitting

**Performance Metrics:**

- Dev server startup: < 1 second
- HMR: < 100ms
- Production build: 2-5x faster than Webpack

### 13.3 Module Federation Scaling

**Benefits:**

- ✅ **Independent deployments** - Deploy remotes independently
- ✅ **Team autonomy** - Teams own their MFEs
- ✅ **Technology flexibility** - Can use different frameworks (future)
- ✅ **Runtime code sharing** - Share code at runtime
- ✅ **Shared dependencies** - Avoid duplicate dependencies
- ✅ **Lazy loading** - Load remotes on demand

**Scales to:**

- 10+ remote MFEs
- Multiple teams
- Large codebases
- Enterprise applications

---

## 14. Comparison with Universal MFE

| Aspect                | Universal MFE                | MFE                     |
| --------------------- | ---------------------------- | ----------------------- |
| **Platforms**         | Web + Android + iOS          | Web only                |
| **UI Framework**      | React Native + RNW           | React only              |
| **Monorepo**          | Yarn Workspaces              | Nx                      |
| **Bundler (Web)**     | Rspack                       | Vite                    |
| **Bundler (Mobile)**  | Re.Pack                      | N/A                     |
| **Module Federation** | MF v1 (web) + MF v2 (mobile) | MF v2 (web)             |
| **Complexity**        | Very High                    | Medium                  |
| **Code Sharing**      | Maximum (RN primitives)      | Standard (React)        |
| **Scalability**       | High                         | Very High (Nx benefits) |

---

## 15. Migration Path (If Needed)

### 15.1 From Universal MFE to Web-Only

**If you decide to drop mobile:**

1. Remove React Native dependencies
2. Remove Re.Pack configurations
3. Migrate React Native components to React
4. Update build configurations
5. Update shared libraries

**Effort:** 2-4 weeks

---

## 16. Detailed Implementation Steps

### 16.1 POC-0 Step-by-Step

**Week 1: Setup & Foundation**

1. **Day 1-2: Nx Workspace Setup**
   - Initialize Nx workspace
   - Install dependencies
   - Configure TypeScript
   - Setup ESLint and Prettier

2. **Day 3-4: Shell App**
   - Create shell application
   - Configure Vite
   - Setup basic routing
   - Create layout structure

3. **Day 5: Hello Remote**
   - Create hello remote application
   - Configure Module Federation v2
   - Create HelloRemote component
   - Test remote loading

**Week 2: Integration & Testing**

4. **Day 6-7: Module Federation Integration**
   - Configure shell to consume remote
   - Test dynamic loading
   - Verify shared dependencies
   - Fix any integration issues

5. **Day 8-9: Shared Libraries**
   - Create shared-utils library
   - Create shared-ui library
   - Create shared-types library
   - Test library consumption

6. **Day 10: Testing & Documentation**
   - Write unit tests
   - Test production builds
   - Document architecture
   - Create development guide

---

## 17. Summary

### 17.1 POC-0 Deliverables

- ✅ Nx workspace with React + Vite
- ✅ Shell app (host)
- ✅ Hello remote (remote)
- ✅ Module Federation v2 (BIMF) configured
- ✅ Shared libraries (utils, ui, types)
- ✅ Development workflow established
- ✅ Production builds working
- ✅ Testing setup (Vitest)
- ✅ Documentation

### 17.2 Success Criteria

- ✅ Shell loads and runs on http://localhost:4200
- ✅ Remote loads dynamically from http://localhost:4201
- ✅ Module Federation v2 works correctly
- ✅ Shared dependencies work (no duplicates)
- ✅ HMR works (fast updates)
- ✅ Production builds work (optimized)
- ✅ TypeScript types work across boundaries
- ✅ Tests pass

### 17.3 Next Steps

1. **POC-0:** Implement foundation (1-2 weeks) ← **Current**
2. **POC-1:** Add auth and payments (3-4 weeks)
3. **POC-2:** Backend integration + design system (2-3 weeks)
4. **POC-3:** Infrastructure + performance + session management (4-5 weeks)
5. **MVP:** Production readiness + enhanced features (4-6 weeks)
6. **Production:** Scale and optimize (ongoing)

### 17.4 Key Advantages of This Stack

**Nx:**

- ✅ Build caching (massive time savings)
- ✅ Task orchestration (parallel execution)
- ✅ Dependency graph (visualize architecture)
- ✅ Affected projects (only build what changed)
- ✅ Scales to enterprise

**Vite:**

- ✅ Fast dev server (instant startup)
- ✅ Fast HMR (near-instant updates)
- ✅ Fast production builds
- ✅ Excellent TypeScript support
- ✅ Large plugin ecosystem

**Module Federation v2:**

- ✅ Runtime code sharing
- ✅ Independent deployments
- ✅ Team autonomy
- ✅ Technology flexibility
- ✅ Better than MF v1

---

**Last Updated:** 2026-01-XX  
**Status:** Planning - Ready for Implementation

## 18. Testing Strategy

**Reference:** See `docs/testing-strategy-poc-phases.md` for comprehensive testing strategy.

### 18.1 Testing Goals

- ✅ Validate Module Federation v2 setup
- ✅ Test remote loading and integration
- ✅ Test shared libraries
- ✅ Establish testing patterns

### 18.2 Unit Testing

**Tools:** Vitest 2.0.x, React Testing Library 16.1.x

**Scope:**

- Shell app components
- Hello remote component
- Shared library utilities
- Type definitions

**Coverage Target:** 60%

**Example:**

```typescript
// apps/shell/src/components/App.test.tsx
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import App from './App';

describe('App', () => {
  it('should render shell app', () => {
    render(<App />);
    expect(screen.getByText('Shell App')).toBeInTheDocument();
  });
});
```

### 18.3 Integration Testing

**Scope:**

- Module Federation remote loading
- Shared dependencies resolution
- Remote component rendering in shell

### 18.4 E2E Testing

**Tools:** Playwright

**Scope:**

- Shell app loads successfully
- Remote component loads and displays
- Navigation works (if routing implemented)

**Coverage Target:** Critical paths only

### 18.5 Testing Deliverables

- ✅ Unit tests for shell and remote components
- ✅ Unit tests for shared utilities
- ✅ Integration tests for Module Federation
- ✅ E2E tests for critical paths
- ✅ Test coverage report (60% target)
- ✅ CI/CD test integration

---

**Related Documents:**

- `docs/testing-strategy-poc-phases.md` - Comprehensive testing strategy for all POC phases
- `docs/sast-implementation-plan.md` - SAST implementation plan (Git hooks & CI/CD)
- `docs/adr/README.md` - Architecture Decision Records (ADRs) index
- `docs/mfe-poc1-architecture.md` - POC-1 authentication & payments
- `docs/mfe-poc2-architecture.md` - POC-2 backend integration, design system & basic observability
- `docs/mfe-poc3-architecture.md` - POC-3 infrastructure, enhanced observability & basic analytics
- `docs/observability-analytics-phasing.md` - Observability and analytics phasing strategy
