# MFE POC-2 Architecture & Implementation Plan

**Status:** Planning  
**Version:** 1.0  
**Date:** 2026-01-XX  
**Tech Stack:** React + Nx + Vite + Module Federation v2 + Backend API

---

## 1. Executive Summary

This document defines the architecture and implementation plan for **POC-2** of the microfrontend (MFE) platform, extending POC-1 with:

- **Backend integration** (REST API)
- **Real authentication** (JWT tokens)
- **Event bus** for inter-MFE communication (decoupled architecture)
- **Admin MFE** (ADMIN role functionality)
- **Payment operations** (backend API integration - stubbed, no actual PSP)
- **API client library** (shared Axios client)
- **Design system & components library** (Tailwind CSS + shadcn/ui)
- **Enhanced error handling** and error boundaries
- **Basic observability** (error logging, API logging, health checks, basic metrics)

**POC Purpose & Philosophy:**

The POC phases are designed to **validate the viability, practicality, and effort required** for implementing this microfrontend architecture. Security remains a priority throughout all phases, but the bank does not yet have these specific architectures in place. Therefore, POC-2 focuses on:

- ✅ **Architecture validation** - Testing backend integration patterns, event bus communication, and decoupled MFE architecture
- ✅ **Practicality assessment** - Evaluating real-world challenges with backend APIs, authentication flows, and inter-MFE communication
- ✅ **Effort estimation** - Understanding complexity of backend integration, design system implementation, and observability setup
- ✅ **Security foundation** - Establishing enhanced security patterns (JWT, RBAC, API security, secure headers, audit logging)
- ✅ **Incremental complexity** - Building from POC-1 to more complex backend integration and infrastructure patterns

This explains why payment operations remain **stubbed** (no actual PSP integration) - the focus is on validating the architecture and patterns with backend integration, not delivering complete payment processing (which will come in MVP/Production phases).

**Scope:** POC-2 integrates the frontend with the backend API, implements real authentication, adds admin functionality, establishes a decoupled inter-MFE communication pattern using an event bus, and introduces a production-ready design system with reusable components. Payment operations are stubbed (no actual PSP integration). POC-2 builds on POC-1 and sets the foundation for POC-3 infrastructure improvements.

---

## 2. Architecture Overview

### 2.1 High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    MFE Platform (POC-2)             │
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
│              │  - shared-auth-store │                       │
│              │  - shared-header-ui │                        │
│              │  - shared-api-client │ (NEW)                 │
│              │  - shared-event-bus │ (NEW)                  │
│              │  - shared-design-system │ (NEW)              │
│              └──────────────────┘                            │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
                    ┌───────────────┐
                    │  Backend API  │
                    │  (REST API)   │
                    │  - Auth Service │
                    │  - Payments Service │
                    │  - Admin Service │
                    │  - Profile Service │
                    └───────────────┘
```

### 2.2 Technology Stack

| Category              | Technology                  | Version     | Rationale                                   |
| --------------------- | --------------------------- | ----------- | ------------------------------------------- |
| **Monorepo**          | Nx                          | Latest      | Scalable, build caching, task orchestration |
| **Runtime**           | Node.js                     | 24.11.x LTS | Latest LTS                                  |
| **Framework**         | React                       | 19.2.0      | Latest stable                               |
| **Bundler**           | Vite                        | 6.x         | Fast dev server, excellent DX               |
| **Module Federation** | @module-federation/enhanced | 0.21.6      | BIMF (Module Federation v2)                 |
| **Language**          | TypeScript                  | 5.9.x       | Type safety                                 |
| **Package Manager**   | pnpm                        | 9.x         | Recommended for Nx                          |
| **Routing**           | React Router                | 7.x         | Latest, production-ready                    |
| **State (Client)**    | Zustand                     | 4.5.x       | Lightweight, scalable                       |
| **State (Server)**    | TanStack Query              | 5.x         | Server state management                     |
| **Inter-MFE Comm**    | Event Bus                   | Custom      | Decoupled MFE communication                 |
| **Styling**           | Tailwind CSS                | 4.0+        | Latest, fast builds                         |
| **Design System**     | shadcn/ui                   | Latest      | POC-2 - Production-ready component library  |
| **Form Handling**     | React Hook Form             | 7.52.x      | Industry standard                           |
| **Validation**        | Zod                         | 3.23.x      | Type-safe validation                        |
| **HTTP Client**       | Axios                       | 1.7.x       | Production-ready                            |
| **Storage**           | localStorage                | Native      | Browser API                                 |
| **Error Handling**    | react-error-boundary        | 4.0.13      | React 19 compatible                         |
| **Testing**           | Vitest                      | 2.0.x       | Fast, Vite-native                           |
| **E2E Testing**       | Playwright                  | Latest      | Web E2E testing                             |
| **Code Quality**      | ESLint                      | 9.x         | Latest, flat config                         |
| **Formatting**        | Prettier                    | 3.3.x       | Code formatting                             |
| **Type Checking**     | TypeScript ESLint           | 8.x         | TS-specific linting                         |

---

## 3. Project Structure

### 3.1 Nx Workspace Structure

```
web-mfe-workspace/
├── apps/
│   ├── shell/              # Host application
│   ├── auth-mfe/           # Auth remote (updated)
│   ├── payments-mfe/        # Payments remote (updated)
│   └── admin-mfe/          # NEW: Admin remote (POC-2)
├── libs/
│   ├── shared-utils/       # Shared utilities
│   ├── shared-ui/          # Shared UI components
│   ├── shared-types/       # Shared TypeScript types
│   ├── shared-auth-store/  # Auth Zustand store (updated)
│   ├── shared-header-ui/  # Universal header component
│   ├── shared-api-client/ # NEW: API client (POC-2)
│   ├── shared-event-bus/  # NEW: Event bus (POC-2)
│   ├── shared-design-system/ # NEW: Design system & components (POC-2)
│   ├── shared-logging/    # NEW: Basic logging (POC-2)
│   └── shared-metrics/    # NEW: Basic metrics (POC-2)
├── tools/                  # Nx generators, executors
├── nx.json                 # Nx configuration
├── package.json
└── pnpm-workspace.yaml     # pnpm workspace config
```

### 3.2 Package Responsibilities

**Shell App (Host):**

- Application routing (React Router 7)
- Layout (header, navigation)
- Remote loading and orchestration
- Event bus initialization
- Authentication flow
- Route protection

**Auth MFE (Remote):**

- Sign-in/sign-up pages
- Real authentication (JWT)
- Form validation
- Token management
- Exposes: `./SignIn`, `./SignUp`

**Payments MFE (Remote):**

- Payments dashboard
- Payment operations (stubbed - backend API but no actual PSP integration)
- Role-based access control
- Real-time updates (via polling or WebSocket)
- Exposes: `./PaymentsPage`

**Note:** All payment flows are stubbed (no actual Payment Service Provider/PSP integration). Backend API simulates payment processing but does not integrate with real PSPs. This applies to all POC phases. Real PSP integration will be implemented in MVP/Production phases.

**Admin MFE (Remote) - NEW:**

- Admin dashboard
- User management
- System configuration
- Analytics and reports
- Exposes: `./AdminDashboard`

**Shared Libraries:**

- `shared-utils`: Pure TypeScript utilities
- `shared-ui`: Shared React components
- `shared-types`: TypeScript types/interfaces
- `shared-auth-store`: Zustand auth store (MFE-local in POC-2)
- `shared-header-ui`: Universal header component
- `shared-api-client`: Axios client with interceptors (POC-2)
- `shared-event-bus`: Event bus for inter-MFE communication (POC-2)
- `shared-design-system`: Design system & reusable components (POC-2)
- `shared-logging`: Basic error logging and structured logging (POC-2)
- `shared-metrics`: Basic performance metrics collection (POC-2)

---

## 4. POC-2 Requirements

### 4.1 Backend Integration

**Note:** For inter-microservices event-based communication, see `docs/backend-event-hub-implementation-plan.md`. The event hub will be implemented in POC-2 (basic) and enhanced in POC-3 (production-ready).

**Scope:**

- Replace stubbed APIs with backend API calls (still stubbed - no actual PSP)
- Integrate with Auth Service, Payments Service, Admin Service
- Implement JWT token management
- Handle authentication errors
- Implement token refresh mechanism

**Deliverables:**

- API client library (`shared-api-client`)
- All stubbed APIs integrated with backend (still stubbed - no PSP)
- JWT token management working
- Error handling implemented

**Note:** Payment operations remain stubbed (no actual Payment Service Provider/PSP integration). Backend API simulates payment processing but does not integrate with real PSPs. Real PSP integration will be implemented in MVP/Production phases.

---

### 4.2 Event Bus Implementation

**Purpose:** Decouple MFEs by replacing shared Zustand stores with event-based communication

**Package to Create:**

- `libs/shared-event-bus` - Event bus library

**Features:**

- Publish/subscribe pattern
- Type-safe events
- Event payload validation
- Event history (optional)
- Debug mode

**Migration from POC-1:**

- **POC-1:** Shared Zustand stores (acceptable for POC)
- **POC-2:** Event bus for inter-MFE communication, Zustand only within single MFEs

**Event Types:**

- `auth:login` - User logged in
- `auth:logout` - User logged out
- `auth:token-refreshed` - Token refreshed
- `payments:created` - Payment created
- `payments:updated` - Payment updated
- `admin:user-updated` - User updated (admin)

---

### 4.3 Admin MFE

**Purpose:** System administration and user management (ADMIN role)

**Application to Create:**

- `apps/admin-mfe` - Admin remote application

**Features:**

- Admin dashboard
- User management (CRUD)
- Role assignment
- System configuration
- Analytics and reports
- Audit logs

**Exposed Components:**

- `./AdminDashboard` - Main admin dashboard
- `./UserManagement` - User management page
- `./SystemConfig` - System configuration page

**State Management:**

- Local component state
- TanStack Query for server state
- Zustand for MFE-local state
- Event bus for inter-MFE communication

**Styling:**

- Tailwind CSS v4 + shadcn/ui components
- Design system components from `shared-design-system`
- Pure React components

---

### 4.4 Design System & Components Library

**Purpose:** Production-ready design system with reusable components using Tailwind CSS + shadcn/ui

**Package to Create:**

- `libs/shared-design-system` - Design system & components library

**Features:**

- **shadcn/ui components** - Copy components into the library
- **Tailwind CSS v4** - Utility classes and design tokens
- **Consistent design tokens** - Colors, typography, spacing, shadows
- **Reusable components** - Button, Card, Input, Dialog, Table, etc.
- **Type-safe** - Full TypeScript support
- **Accessible** - ARIA-compliant components
- **Customizable** - Easy to theme and extend

**Components to Include:**

- **Form Components:** Button, Input, Textarea, Select, Checkbox, Radio, Switch, Label
- **Layout Components:** Card, Container, Separator, Sheet, Dialog, Drawer
- **Data Display:** Table, Badge, Avatar, Alert, Toast
- **Navigation:** Breadcrumb, Tabs, Pagination
- **Feedback:** Loading, Skeleton, Progress, Alert
- **Overlay:** Dialog, Sheet, Popover, Tooltip, Dropdown Menu

**Design Tokens:**

```typescript
// libs/shared-design-system/src/tokens.ts
export const colors = {
  primary: {
    50: '#f0f9ff',
    500: '#3b82f6',
    900: '#1e3a8a',
  },
  // ... more colors
};

export const spacing = {
  xs: '0.5rem',
  sm: '1rem',
  md: '1.5rem',
  lg: '2rem',
  // ... more spacing
};

export const typography = {
  fontFamily: {
    sans: ['Inter', 'system-ui', 'sans-serif'],
    mono: ['Fira Code', 'monospace'],
  },
  fontSize: {
    xs: '0.75rem',
    sm: '0.875rem',
    base: '1rem',
    // ... more sizes
  },
};
```

**Implementation:**

```typescript
// libs/shared-design-system/src/components/button.tsx
import { ButtonHTMLAttributes, forwardRef } from 'react';
import { cn } from '../utils/cn';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?:
    | 'default'
    | 'destructive'
    | 'outline'
    | 'secondary'
    | 'ghost'
    | 'link';
  size?: 'default' | 'sm' | 'lg' | 'icon';
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'default', size = 'default', ...props }, ref) => {
    return (
      <button
        className={cn(
          'inline-flex items-center justify-center rounded-md font-medium transition-colors',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
          'disabled:pointer-events-none disabled:opacity-50',
          {
            'bg-primary text-primary-foreground hover:bg-primary/90':
              variant === 'default',
            'bg-destructive text-destructive-foreground hover:bg-destructive/90':
              variant === 'destructive',
            'border border-input bg-background hover:bg-accent':
              variant === 'outline',
            'bg-secondary text-secondary-foreground hover:bg-secondary/80':
              variant === 'secondary',
            'hover:bg-accent hover:text-accent-foreground': variant === 'ghost',
            'text-primary underline-offset-4 hover:underline':
              variant === 'link',
          },
          {
            'h-10 px-4 py-2': size === 'default',
            'h-9 rounded-md px-3': size === 'sm',
            'h-11 rounded-md px-8': size === 'lg',
            'h-10 w-10': size === 'icon',
          },
          className
        )}
        ref={ref}
        {...props}
      />
    );
  }
);

Button.displayName = 'Button';
```

**Usage in MFEs:**

```typescript
// apps/auth-mfe/src/components/SignInForm.tsx
import { Button, Input, Card } from '@web-mfe/shared-design-system';

export function SignInForm() {
  return (
    <Card>
      <Input
        type="email"
        placeholder="Email"
      />
      <Input
        type="password"
        placeholder="Password"
      />
      <Button
        variant="default"
        size="default"
      >
        Sign In
      </Button>
    </Card>
  );
}
```

**Migration from POC-1:**

- **POC-1:** Inline Tailwind classes
- **POC-2:** Design system components (shadcn/ui)

**Benefits:**

- ✅ Consistent design across all MFEs
- ✅ Reusable components (DRY principle)
- ✅ Type-safe components
- ✅ Accessible by default
- ✅ Easy to maintain and update
- ✅ Production-ready design system

---

### 4.5 Real Authentication

**Scope:**

- Replace mock authentication with real JWT-based authentication
- Implement token storage and management
- Implement token refresh mechanism
- Handle authentication errors
- Session persistence

**Implementation:**

- Auth MFE calls `/api/auth/login` and `/api/auth/register`
- JWT tokens stored in Zustand store (with localStorage persistence)
- Token sent in `Authorization` header for all API requests
- Refresh token mechanism for long-lived sessions
- Automatic token refresh on 401 errors

---

### 4.6 Payment Operations (Stubbed)

**Scope:**

- Replace stubbed payment APIs with backend API calls (still stubbed - no actual PSP)
- Implement stubbed payment initiation (VENDOR) - backend simulates payment initiation
- Implement stubbed payment processing (CUSTOMER) - backend simulates payment processing
- Real-time payment status updates (via polling or WebSocket)
- Payment history and reports

**Implementation:**

- Payments MFE uses TanStack Query with backend API calls
- VENDOR role can initiate payments via `POST /api/payments` with `type: 'initiate'` (stubbed - backend simulates)
- CUSTOMER role can make payments via `POST /api/payments` with `type: 'payment'` (stubbed - backend simulates)
- Real-time updates via polling or WebSocket (POC-3)

**Important:** All payment flows are stubbed (no actual Payment Service Provider/PSP integration). The backend API simulates payment processing but does not integrate with real PSPs (Stripe, PayPal, etc.). This applies to all POC phases (POC-1, POC-2, POC-3). Real PSP integration will be implemented in MVP/Production phases.

---

### 4.7 API Client Library

**Purpose:** Centralized HTTP client with authentication and error handling

**Package:** `libs/shared-api-client`

**Features:**

- Axios instance with base configuration
- Request interceptor (add JWT token)
- Response interceptor (handle errors, token refresh)
- Type-safe API methods
- Error handling
- Request/response logging (dev mode)

**Implementation:**

```typescript
// libs/shared-api-client/src/index.ts
import axios from 'axios';
import { useAuthStore } from '@web-mfe/shared-auth-store';

const apiClient = axios.create({
  baseURL: process.env['NX_API_BASE_URL'] || 'http://localhost:3000/api',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor - Add auth token
apiClient.interceptors.request.use((config) => {
  const token = useAuthStore.getState().user?.accessToken;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor - Handle errors and token refresh
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Handle 401 - Unauthorized
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        // Attempt token refresh
        const refreshToken = useAuthStore.getState().user?.refreshToken;
        if (refreshToken) {
          const response = await axios.post('/api/auth/refresh', {
            refreshToken,
          });
          const { accessToken } = response.data.data;

          // Update store with new token
          useAuthStore.getState().setAccessToken(accessToken);

          // Retry original request
          originalRequest.headers.Authorization = `Bearer ${accessToken}`;
          return apiClient(originalRequest);
        }
      } catch (refreshError) {
        // Refresh failed - logout user
        useAuthStore.getState().logout();
        window.location.href = '/signin';
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

export default apiClient;
```

---

### 4.8 Basic Observability

**Purpose:** Foundation observability for backend integration debugging and architecture validation

**Scope:**

- **Basic error logging** - Console-based, structured logging, error aggregation (dev mode)
- **API request/response logging** - Request/response logging in API client (dev mode)
- **Basic performance metrics** - In-memory/localStorage metrics collection
- **Health check endpoints** - Shell, remotes, and backend health checks
- **Event bus monitoring** - Event logging and metrics (dev mode)
- **Basic dev dashboard** - Error logs viewer, metrics viewer, health status

**Package to Create:**

- `libs/shared-logging` - Basic error logging library
- `libs/shared-metrics` - Basic performance metrics library

**Implementation:**

```typescript
// libs/shared-logging/src/index.ts
class BasicLogger {
  logError(error: Error, context?: any) {
    const errorLog = {
      timestamp: new Date().toISOString(),
      message: error.message,
      stack: error.stack,
      context,
    };

    // Console for development
    console.error('[ERROR]', errorLog);

    // Store in localStorage for dev (limited to last 50 errors)
    if (process.env['NX_ENV'] === 'development') {
      const errors = JSON.parse(localStorage.getItem('error-logs') || '[]');
      errors.unshift(errorLog);
      localStorage.setItem('error-logs', JSON.stringify(errors.slice(0, 50)));
    }
  }

  logInfo(message: string, data?: any) {
    console.log('[INFO]', {
      timestamp: new Date().toISOString(),
      message,
      data,
    });
  }
}

export const logger = new BasicLogger();
```

```typescript
// libs/shared-metrics/src/index.ts
class BasicMetrics {
  private metrics: Map<string, number[]> = new Map();

  recordMetric(name: string, value: number) {
    if (!this.metrics.has(name)) {
      this.metrics.set(name, []);
    }
    this.metrics.get(name)!.push(value);

    // Keep last 100 values
    const values = this.metrics.get(name)!;
    if (values.length > 100) {
      values.shift();
    }
  }

  getAverage(name: string): number {
    const values = this.metrics.get(name) || [];
    return values.reduce((a, b) => a + b, 0) / values.length || 0;
  }

  getMetrics() {
    return Object.fromEntries(this.metrics);
  }
}

export const metrics = new BasicMetrics();
```

**API Client Integration:**

```typescript
// libs/shared-api-client/src/index.ts
import { logger } from '@web-mfe/shared-logging';
import { metrics } from '@web-mfe/shared-metrics';

// Response interceptor - Log errors and track metrics
apiClient.interceptors.response.use(
  (response) => {
    // Track API response time
    const duration =
      Date.now() - (response.config.metadata?.startTime || Date.now());
    metrics.recordMetric('api-response-time', duration);

    if (process.env['NX_ENV'] === 'development') {
      logger.logInfo('API Response', {
        url: response.config.url,
        method: response.config.method,
        status: response.status,
        duration,
      });
    }

    return response;
  },
  (error) => {
    logger.logError(error, {
      url: error.config?.url,
      method: error.config?.method,
      status: error.response?.status,
    });
    return Promise.reject(error);
  }
);
```

**Health Check Endpoints:**

```typescript
// apps/shell/src/health.ts
export async function checkHealth() {
  const health = {
    timestamp: new Date().toISOString(),
    shell: 'healthy',
    remotes: {
      auth: await checkRemoteHealth('auth-mfe'),
      payments: await checkRemoteHealth('payments-mfe'),
      admin: await checkRemoteHealth('admin-mfe'),
    },
    backend: await checkBackendHealth(),
  };

  return health;
}
```

**Event Bus Monitoring:**

```typescript
// libs/shared-event-bus/src/index.ts
import { logger } from '@web-mfe/shared-logging';
import { metrics } from '@web-mfe/shared-metrics';

class EventBus {
  emit(event: string, data?: any) {
    // Log events in dev mode
    if (process.env['NX_ENV'] === 'development') {
      logger.logInfo(`Event: ${event}`, data);
    }

    // Track event metrics
    metrics.recordMetric('event-bus:events', 1);

    this.listeners.get(event)?.forEach((callback) => callback(data));
  }
}
```

**Deliverables:**

- ✅ `shared-logging` library created
- ✅ `shared-metrics` library created
- ✅ API client integrated with logging
- ✅ Health check endpoints implemented
- ✅ Event bus monitoring implemented
- ✅ Basic dev dashboard created

**Note:** This is basic observability for architecture completeness. Enhanced observability (Sentry, production monitoring) and basic analytics will be implemented in POC-3. See `docs/observability-analytics-phasing.md` for detailed phasing strategy.

---

### 4.9 State Management Evolution

**Architecture: Client State + Server State + Inter-MFE Communication**

**Three-Tier State Management:**

- **Zustand** - Client-side state (auth, UI, theme) - **MFE-local only**
- **TanStack Query** - Server-side state (API data, caching)
- **Event Bus** - Inter-MFE communication (decoupled)

**POC-2 Changes:**

- ✅ Event bus for inter-MFE communication (decouples MFEs)
- ✅ Zustand only for state within single MFEs (no shared stores)
- ✅ TanStack Query for server state (with real backend)

**Migration from POC-1:**

1. **Remove shared Zustand stores** (except for MFE-local state)
2. **Implement event bus** for inter-MFE communication
3. **Update auth store** to be MFE-local (publish events instead of sharing state)
4. **Update all MFEs** to subscribe to relevant events

---

## 5. High-Level Architecture

### 5.1 Package Structure

```
web-mfe-workspace/
├── apps/
│   ├── shell/                    # Web host (updated)
│   ├── auth-mfe/                 # Auth remote (updated)
│   ├── payments-mfe/             # Payments remote (updated)
│   └── admin-mfe/                # NEW: Admin remote
├── libs/
│   ├── shared-utils/             # Existing shared utilities
│   ├── shared-ui/                # Existing shared UI
│   ├── shared-types/              # Existing shared types
│   ├── shared-auth-store/        # Auth store (updated - MFE-local)
│   ├── shared-header-ui/         # Universal header component
│   ├── shared-api-client/        # NEW: API client
│   ├── shared-event-bus/         # NEW: Event bus
│   └── shared-design-system/     # NEW: Design system & components
├── tools/                        # Nx generators, executors
├── nx.json                       # Nx configuration
├── package.json
└── pnpm-workspace.yaml           # pnpm workspace config
```

---

### 5.2 Architecture Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                        Web Shell                             │
│  ┌───────────────────────────────────────────────────────┐  │
│  │  React Router 7 + Event Bus + Universal Header        │  │
│  └───────────────────────────────────────────────────────┘  │
│                          │                                   │
│        ┌─────────────────┴─────────────────┐               │
│        │                                     │               │
│  ┌─────▼─────┐  ┌──────▼──────┐  ┌──────▼──────┐        │
│  │ Auth MFE  │  │ Payments MFE │  │  Admin MFE  │        │
│  │ (Remote)  │  │  (Remote)    │  │  (Remote)   │        │
│  └─────┬─────┘  └──────┬──────┘  └──────┬──────┘        │
│        │                │                  │               │
│        └───────────────┼──────────────────┘               │
│                        │                                    │
│              ┌─────────▼─────────┐                         │
│              │    Event Bus      │                         │
│              │  (Decoupled)      │                         │
│              └───────────────────┘                         │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
                    ┌───────────────┐
                    │  Backend API  │
                    │  (REST API)   │
                    └───────────────┘
```

---

### 5.3 Data Flow

**Authentication Flow (POC-2):**

1. User submits login form in Auth MFE
2. Auth MFE calls `POST /api/auth/login` via API client
3. Backend validates credentials and returns JWT tokens
4. Auth MFE updates local Zustand store with user data and tokens
5. Auth MFE publishes `auth:login` event to event bus
6. Shell and other MFEs subscribe to `auth:login` event
7. Shell redirects to `/payments` based on event
8. Payments MFE loads and fetches data using JWT token

**Payment Creation Flow (POC-2 - Stubbed):**

1. User creates payment in Payments MFE
2. Payments MFE calls `POST /api/payments` via API client
3. Backend simulates payment processing (stubbed - no actual PSP) and returns result
4. Payments MFE updates local state via TanStack Query
5. Payments MFE publishes `payments:created` event to event bus
6. Other MFEs can subscribe to payment events if needed

**Note:** Payment processing is stubbed - backend simulates the flow but does not integrate with actual Payment Service Providers (PSPs).

**Inter-MFE Communication:**

- **POC-1:** Shared Zustand stores (coupled)
- **POC-2:** Event bus (decoupled)

---

## 6. Implementation Plan

### Phase 1: Backend Integration & Design System (Week 1)

**Tasks:**

1. **Create API Client Library**

   ```bash
   nx generate @nx/js:library shared-api-client \
     --bundler=tsc \
     --unitTestRunner=vitest
   ```

2. **Create Design System Library**

   ```bash
   nx generate @nx/react:library shared-design-system \
     --bundler=vite \
     --unitTestRunner=vitest
   ```

3. **Setup Design System**

   - Install shadcn/ui dependencies
   - Configure Tailwind CSS v4 with design tokens
   - Copy shadcn/ui components into library
   - Create design token system (colors, spacing, typography)
   - Setup component utilities (cn helper)
   - Create base components (Button, Input, Card, etc.)

4. **Implement API Client**

   - Setup Axios instance
   - Implement request interceptor (JWT token)
   - Implement response interceptor (error handling, token refresh)
   - Create type-safe API methods
   - Add error handling

5. **Update Auth Store**

   - Replace mock authentication with real API calls
   - Implement JWT token storage
   - Implement token refresh mechanism
   - Make auth store MFE-local (remove shared state)
   - Publish events to event bus

6. **Update TanStack Query Hooks**

   - Replace stubbed APIs with backend API calls (still stubbed - no PSP)
   - Update all query hooks to use API client
   - Handle authentication errors
   - Note: Payment operations remain stubbed (backend simulates, no actual PSP)

7. **Create Basic Observability Libraries**

   ```bash
   # Logging library
   nx generate @nx/js:library shared-logging \
     --bundler=tsc \
     --unitTestRunner=vitest

   # Metrics library
   nx generate @nx/js:library shared-metrics \
     --bundler=tsc \
     --unitTestRunner=vitest
   ```

8. **Implement Basic Observability**

   - Implement basic error logging
   - Implement basic performance metrics
   - Integrate logging into API client
   - Add health check endpoints
   - Add event bus monitoring
   - Create basic dev dashboard

**Deliverables:**

- ✅ Design system library created
- ✅ shadcn/ui components integrated
- ✅ Design tokens configured
- ✅ API client library created
- ✅ Auth store updated with real authentication
- ✅ All stubbed APIs integrated with backend (still stubbed - no PSP)
- ✅ Token management working
- ✅ Basic observability libraries created
- ✅ Logging and metrics integrated
- ✅ Health check endpoints implemented
- ✅ Basic dev dashboard created

---

### Phase 2: Event Bus Implementation (Week 2)

**Tasks:**

1. **Create Event Bus Library**

   ```bash
   nx generate @nx/js:library shared-event-bus \
     --bundler=tsc \
     --unitTestRunner=vitest
   ```

2. **Implement Event Bus**

   - Publish/subscribe pattern
   - Type-safe events
   - Event payload validation
   - Debug mode

3. **Migrate from Shared Stores**

   - Remove shared Zustand stores
   - Update auth MFE to publish events
   - Update shell to subscribe to events
   - Update payments MFE to subscribe to events

4. **Update All MFEs**

   - Subscribe to relevant events
   - Publish events when state changes
   - Remove dependencies on shared stores

**Deliverables:**

- ✅ Event bus library created
- ✅ Shared stores removed
- ✅ All MFEs using event bus
- ✅ Decoupled architecture achieved

---

### Phase 3: Admin MFE (Week 3)

**Tasks:**

1. **Create Admin MFE Application**

   ```bash
   nx generate @nx/react:application admin-mfe \
     --bundler=vite \
     --style=css \
     --routing=false
   ```

2. **Implement Admin Features**

   - Admin dashboard
   - User management (CRUD)
   - Role assignment
   - System configuration
   - Analytics and reports

3. **Configure Module Federation v2**

   - Setup Vite plugin for Module Federation v2
   - Expose admin components
   - Test standalone mode

4. **Styling**

   - Use design system components from `shared-design-system`
   - Style with Tailwind CSS v4 + shadcn/ui
   - Responsive design
   - Admin-specific UI
   - Consistent design across all pages

**Deliverables:**

- ✅ Admin MFE application created
- ✅ Admin features implemented using design system components
- ✅ Module Federation v2 configured
- ✅ Styling complete with design system

---

### Phase 4: Shell Integration & Design System Migration (Week 4)

**Tasks:**

1. **Update Shell Application**

   - Integrate event bus
   - Subscribe to auth events
   - Subscribe to payment events
   - Dynamic remote loading (admin-mfe)
   - Update Module Federation v2 config

2. **Migrate to Design System**

   - Replace inline Tailwind classes with design system components
   - Update Auth MFE to use design system components
   - Update Payments MFE to use design system components
   - Update Shell to use design system components
   - Ensure consistent design across all MFEs

3. **Route Protection**

   - Update route protection for admin routes
   - Role-based route access
   - Redirect logic based on role

4. **Integration Testing**

   - Test authentication flow with backend
   - Test payment operations with backend (stubbed - no actual PSP)
   - Test admin functionality
   - Test event bus communication
   - Test token refresh

**Deliverables:**

- ✅ Shell integrated with event bus
- ✅ Admin routes protected
- ✅ All remotes loading dynamically
- ✅ All MFEs migrated to design system
- ✅ Consistent design across platform
- ✅ Integration testing complete

---

### Phase 5: Testing & Refinement (Week 5)

**Tasks:**

1. **Unit Testing**

   - Write Vitest tests for API client
   - Write Vitest tests for event bus
   - Write Vitest tests for design system components
   - Test auth store with real API
   - Test admin features
   - Test TanStack Query hooks

2. **Integration Testing**

   - Test authentication flow with backend
   - Test payment operations with backend (stubbed - no actual PSP)
   - Test admin functionality
   - Test event bus communication
   - Test error handling

3. **E2E Testing**

   - Setup Playwright with backend
   - Write E2E tests for auth flow
   - Write E2E tests for payments flow
   - Write E2E tests for admin flow
   - Test role-based access

4. **Documentation**

   - Update architecture docs
   - Create POC-2 completion summary
   - Document API client usage
   - Document event bus usage
   - Document design system usage and component API
   - Create design system component catalog
   - Update testing guide

5. **Refinement**

   - Fix identified issues
   - Optimize performance
   - Improve error handling
   - Final review

**Deliverables:**

- ✅ Unit tests written and passing (including design system components)
- ✅ Integration tests written and passing
- ✅ E2E tests written and passing
- ✅ Documentation updated (including design system)
- ✅ Design system component catalog created
- ✅ Code refined and optimized

---

## 7. Key Technical Decisions

### 7.1 Event Bus for Inter-MFE Communication

**Decision:** Use event bus to decouple MFEs

**Reference:** See `docs/adr/poc-2/0001-event-bus-for-inter-mfe-comm.md` for decision rationale, alternatives considered, and trade-offs.

**Rationale:**

- Decouples MFEs (no shared state dependencies)
- Loose coupling (MFEs don't need to know about each other)
- Scalability (easy to add/remove MFEs)
- Production-ready pattern (industry standard)

**Migration from POC-1:**

- **POC-1:** Shared Zustand stores (acceptable for POC)
- **POC-2:** Event bus (decoupled architecture)

**Carry Forward:** ✅ Yes - Production-ready pattern for microfrontend communication

---

### 7.2 MFE-Local Zustand Stores

**Decision:** Use Zustand only within single MFEs (no shared stores)

**Rationale:**

- Decouples MFEs
- Each MFE manages its own state
- Event bus for inter-MFE communication
- Better scalability

**POC-2 Usage:**

- ✅ Zustand for state within single MFEs
- ❌ No shared Zustand stores across MFEs
- ✅ Event bus for inter-MFE communication

**Carry Forward:** ✅ Yes - Production-ready, decoupled architecture

---

### 7.3 Real Backend Integration

**Decision:** Replace stubbed APIs with backend API calls (still stubbed - no actual PSP)

**Rationale:**

- Production-ready architecture
- Real authentication and authorization
- Backend API integration (payment flows remain stubbed)
- Better testing and validation

**Implementation:**

- API client library for all HTTP requests
- JWT token management
- Error handling and token refresh
- Type-safe API methods
- Backend simulates payment processing (no actual PSP integration)

**Payment Processing:** All payment flows are stubbed (no actual Payment Service Provider/PSP integration). Backend API simulates payment operations but does not integrate with real PSPs. Real PSP integration will be implemented in MVP/Production phases.

**Carry Forward:** ✅ Yes - Production-ready backend integration (payment flows stubbed until MVP)

---

### 7.4 Admin MFE

**Decision:** Create separate Admin MFE for admin functionality

**Rationale:**

- Separation of concerns
- Independent deployment
- Role-based access (ADMIN only)
- Scalability

**Features:**

- User management
- System configuration
- Analytics and reports
- Audit logs

**Carry Forward:** ✅ Yes - Production-ready, scalable architecture

---

### 7.5 Design System & Components Library

**Decision:** Use Tailwind CSS + shadcn/ui for design system

**Reference:** See `docs/adr/poc-2/0002-use-shadcn-ui-design-system.md` for decision rationale, alternatives considered, and trade-offs.

**Rationale:**

- **Production-ready** - shadcn/ui is battle-tested and widely used
- **Tailwind CSS v4** - Latest version with excellent performance
- **Type-safe** - Full TypeScript support
- **Accessible** - ARIA-compliant components by default
- **Customizable** - Easy to theme and extend
- **Copy-paste approach** - Components live in your codebase (not a dependency)
- **Consistent design** - Shared design tokens across all MFEs

**Features:**

- Reusable components (Button, Input, Card, Table, etc.)
- Design tokens (colors, spacing, typography)
- Consistent styling across all MFEs
- Easy to maintain and update
- Production-ready design system

**Migration from POC-1:**

- **POC-1:** Inline Tailwind classes
- **POC-2:** Design system components (shadcn/ui)

**Carry Forward:** ✅ Yes - Production-ready design system, scales to enterprise

---

### 7.6 Basic Observability

**Decision:** Implement basic observability in POC-2 for architecture completeness

**Rationale:**

- Essential for debugging backend integration
- Needed to validate event bus architecture
- Required for monitoring system health during architecture development
- Foundation for enhanced observability in POC-3

**POC-2 Implementation:**

- ✅ Basic error logging (console, localStorage for dev)
- ✅ API request/response logging (dev mode)
- ✅ Basic performance metrics (in-memory/localStorage)
- ✅ Health check endpoints
- ✅ Event bus monitoring (dev mode)
- ✅ Basic dev dashboard

**POC-3 Evolution:**

- 🔄 Enhanced observability (Sentry, production monitoring)
- 🔄 Infrastructure monitoring (nginx, WebSocket, cache)
- 🔄 Basic analytics (architecture-focused)

**Carry Forward:** ✅ Yes - Foundation for production-ready observability

**Note:** See `docs/observability-analytics-phasing.md` for detailed phasing strategy.

---

## 8. Success Criteria

✅ **Functional Requirements:**

- [ ] Real authentication working (JWT)
- [ ] Token refresh mechanism working
- [ ] Payment operations working (stubbed - no actual PSP integration)
- [ ] Admin functionality working (ADMIN role)
- [ ] Event bus communication working
- [ ] All MFEs decoupled (no shared stores)
- [ ] Design system components working across all MFEs
- [ ] Consistent design and styling
- [ ] Error handling working
- [ ] Works in all modern browsers

✅ **Technical Requirements:**

- [ ] API client library implemented
- [ ] Event bus library implemented
- [ ] All stubbed APIs integrated with backend (still stubbed - no PSP)
- [ ] JWT token management working
- [ ] Event bus communication working
- [ ] Admin MFE created and working
- [ ] Design system library implemented
- [ ] All MFEs using design system components
- [ ] Module Federation v2 configured correctly
- [ ] All remotes load dynamically

✅ **Quality Requirements:**

- [ ] Code follows architectural constraints
- [ ] TypeScript types are correct
- [ ] No shared Zustand stores across MFEs
- [ ] Event bus used for inter-MFE communication
- [ ] Design system components tested
- [ ] Consistent design across all MFEs
- [ ] Documentation is updated (including design system)
- [ ] Unit tests pass
- [ ] Integration tests pass
- [ ] E2E tests pass

---

## 9. Security Strategy (Banking-Grade)

**Context:** This platform is designed for a large banking institution, requiring enterprise-grade security.

**Reference:** See `docs/security-strategy-banking.md` for comprehensive security strategy.

### 9.1 POC-2 Security Features (Enhanced)

**Scope:** Enhanced security building on POC-1 foundation

**Security Features:**

1. **Real Authentication with JWT**

   - ✅ JWT token management
   - ✅ Automatic token refresh
   - ✅ Secure token storage
   - ✅ Token expiration handling
   - ✅ Session timeout

2. **Enhanced RBAC**

   - ✅ Fine-grained permissions
   - ✅ Resource-level access control
   - ✅ Route protection
   - ✅ Component-level access control

3. **API Security**

   - ✅ Request signing for sensitive operations
   - ✅ Rate limiting (client-side + server-side)
   - ✅ Request ID tracking
   - ✅ API versioning
   - ✅ Input validation

4. **Secure Headers**

   - ✅ X-Content-Type-Options
   - ✅ X-Frame-Options (clickjacking prevention)
   - ✅ X-XSS-Protection
   - ✅ Strict-Transport-Security (HSTS)
   - ✅ Referrer-Policy
   - ✅ Permissions-Policy

5. **Audit Logging**

   - ✅ All authentication events logged
   - ✅ All authorization failures logged
   - ✅ All sensitive operations logged
   - ✅ IP address tracking
   - ✅ User agent tracking
   - ✅ Immutable audit logs

6. **Data Encryption**
   - ✅ Encryption at rest (database)
   - ⚠️ Encryption in transit (HTTPS in POC-3 with self-signed certificates)
   - ✅ PII encryption
   - ✅ Sensitive data hashing
   - ⚠️ Real certificates planned for MVP

**Implementation:**

- All security features implemented in Phase 1-5
- Security testing in Phase 5
- Penetration testing in Phase 5
- Security review before POC-3

**Note:** See `docs/security-strategy-banking.md` for comprehensive security strategy. POC-3 will add infrastructure security (nginx) and session management security features.

**Compliance Progress:**

- ✅ PCI DSS compliance (payment data security)
- ✅ GDPR compliance (data protection)
- ✅ Banking regulations (enhanced)
- 🔄 SOC 2 preparation (MVP)

**Next Phase (MVP):**

- 🔄 Multi-Factor Authentication (MFA)
- 🔄 Security monitoring (Sentry, SOC)
- 🔄 Advanced threat protection
- 🔄 Full compliance certification

---

## 10. CI/CD & Deployment Strategy

**Reference:** See `docs/cicd-deployment-recommendation.md` for comprehensive CI/CD strategy.

### 10.1 POC-2 CI/CD (Basic CI/CD)

**Scope:** Essential CI/CD for development and testing with backend integration (payment flows stubbed - no actual PSP)

**Rationale:**

- Real backend integration requires automated testing
- Multiple MFEs need coordinated builds
- Integration complexity (event bus, API client, auth flow) needs testing
- Early feedback improves quality
- Development workflow improvement

**CI/CD Components:**

1. **Automated Testing**

   - ✅ Unit tests (Vitest) - All MFEs and shared libraries
   - ✅ Integration tests (Playwright) - MFE integration with backend
   - ✅ E2E tests - Full user flows with real backend
   - ✅ Test coverage reporting

2. **Build Verification**

   - ✅ Build all MFEs (Shell, Auth, Payments, Admin)
   - ✅ Build all shared libraries
   - ✅ Module Federation v2 configuration validation
   - ✅ Build artifact verification

3. **Code Quality & SAST**

   - ✅ ESLint - Code linting (with security rules)
   - ✅ TypeScript type checking
   - ✅ Prettier formatting check
   - ✅ SonarQube - Code quality and security analysis
   - ✅ Code quality gates
   - ✅ Git hooks - Pre-commit validation (Prettier + ESLint)

   **Reference:** See `docs/sast-implementation-plan.md` for detailed SAST setup.

4. **Basic Deployment to Staging**

   - ✅ Build artifacts upload
   - ✅ Deploy to staging environment
   - ✅ Smoke tests after deployment
   - ✅ Health checks

5. **Dependency Management**
   - ✅ Security vulnerability scanning (Snyk, Dependabot)
   - ✅ Dependency updates (automated PRs)
   - ✅ Version compatibility checks

**Implementation:**

#### GitHub Actions Workflow

```yaml
# .github/workflows/ci.yml
name: CI Pipeline

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main, develop]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v2
        with:
          version: 9
      - uses: actions/setup-node@v4
        with:
          node-version: '24.11.x'
          cache: 'pnpm'

      - run: pnpm install
      - run: pnpm nx run-many --target=test --all
      - run: pnpm nx run-many --target=lint --all
      - run: pnpm nx run-many --target=type-check --all

  build:
    runs-on: ubuntu-latest
    needs: test
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v2
      - uses: actions/setup-node@v4
        with:
          node-version: '24.11.x'
          cache: 'pnpm'

      - run: pnpm install
      - run: pnpm nx run-many --target=build --all

      - uses: actions/upload-artifact@v4
        with:
          name: build-artifacts
          path: dist/

  e2e:
    runs-on: ubuntu-latest
    needs: build
    services:
      postgres:
        image: postgres:16
        env:
          POSTGRES_PASSWORD: postgres
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5

    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v2
      - uses: actions/setup-node@v4
        with:
          node-version: '24.11.x'
          cache: 'pnpm'

      - run: pnpm install
      - run: pnpm nx run-many --target=build --all
      - run: pnpm nx run-many --target=e2e --all

  deploy-staging:
    runs-on: ubuntu-latest
    needs: [test, build, e2e]
    if: github.ref == 'refs/heads/develop'
    environment: staging
    steps:
      - uses: actions/checkout@v4
      - uses: actions/download-artifact@v4
        with:
          name: build-artifacts

      - name: Deploy to Staging
        run: |
          # Deploy to staging server
          # Example: rsync, scp, or cloud provider CLI
```

#### Nx Configuration

```json
// nx.json
{
  "targetDefaults": {
    "test": {
      "inputs": ["default", "^default"],
      "executor": "@nx/vite:test"
    },
    "build": {
      "inputs": ["production", "^production"],
      "executor": "@nx/vite:build",
      "dependsOn": ["^build"]
    },
    "lint": {
      "inputs": ["default", "{workspaceRoot}/.eslintrc.json"],
      "executor": "@nx/eslint:lint"
    },
    "e2e": {
      "inputs": ["default", "^default"],
      "executor": "@nx/playwright:playwright"
    }
  },
  "affected": {
    "defaultBase": "main"
  }
}
```

**Deliverables:**

- ✅ CI/CD pipeline configured
- ✅ Automated testing working
- ✅ Build verification working
- ✅ Staging deployment working
- ✅ Dependency scanning working

**Limitations (Addressed in POC-3):**

- ⚠️ No production deployment
- ⚠️ No infrastructure automation (nginx)
- ⚠️ No advanced performance checks
- ⚠️ No multi-environment support
- ⚠️ No WebSocket real-time updates
- ⚠️ No advanced caching strategies
- ⚠️ No session management (cross-tab, cross-device)

**Next Phase (POC-3):**

- 🔄 Full deployment pipeline
- 🔄 Infrastructure automation (nginx)
- 🔄 Performance testing
- 🔄 Multi-environment support
- 🔄 Advanced deployment strategies
- 🔄 WebSocket real-time updates
- 🔄 Advanced caching (Service Worker, CDN)
- 🔄 Session management (cross-tab, cross-device - basic)
- 🔄 Advanced monitoring (Sentry)

**Note:** See `docs/mfe-poc3-architecture.md` for detailed POC-3 implementation plan.

---

## 11. Out of Scope (Future)

**Not Included in POC-2:**

- GraphQL API (REST only for now) (POC-3 optional)
- WebSocket for real-time updates (polling for now) (POC-3)
- Advanced caching strategies (POC-3)
- Performance optimizations (code splitting, lazy loading) (POC-3)
- nginx reverse proxy (POC-3)
- Enhanced observability (Sentry, production monitoring) (POC-3)
- Basic analytics (architecture-focused) (POC-3)
- Message queue for inter-service communication
- Session management (cross-tab, cross-device) (POC-3)

---

## 12. Risks & Mitigations

| Risk                               | Impact | Mitigation                                              |
| ---------------------------------- | ------ | ------------------------------------------------------- |
| Backend API integration complexity | Medium | Start early, test thoroughly, handle errors gracefully  |
| Event bus implementation           | Medium | Design carefully, test event flow, document event types |
| Token refresh mechanism            | Medium | Implement robust error handling, test edge cases        |
| Admin MFE complexity               | Medium | Start with basic features, iterate                      |
| Migration from shared stores       | Medium | Plan migration carefully, test thoroughly               |

---

## 13. Dependencies

**New Dependencies:**

- All POC-1 dependencies remain
- Backend API (REST API)
- JWT token management

**Backend Dependencies:**

- See `docs/backend-architecture.md` for backend dependencies

---

## 14. Migration from POC-1

### 12.1 API Migration

**Step 1: Create API Client**

```typescript
// Before (POC-1)
import { stubbedPaymentsApi } from '../api/stubbedPayments';

// After (POC-2)
import apiClient from '@web-mfe/shared-api-client';
const response = await apiClient.get('/payments');
// Note: Backend API still stubs payment processing (no actual PSP)
```

**Step 2: Update Auth Store**

```typescript
// Before (POC-1 - mock authentication)
login: async (email, password) => {
  const user = await mockLogin(email, password);
  set({ user, isAuthenticated: true });
};

// After (POC-2)
login: async (email, password) => {
  const response = await apiClient.post('/auth/login', { email, password });
  const { user, accessToken, refreshToken } = response.data.data;
  set({ user, isAuthenticated: true });
  // Publish event
  EventBus.emit('auth:login', { user });
};
```

**Step 3: Update TanStack Query Hooks**

```typescript
// Before (POC-1)
queryFn: () => stubbedPaymentsApi.getPayments(),

// After (POC-2)
queryFn: async () => {
  const response = await apiClient.get('/payments');
  return response.data.data;
  // Note: Backend API still stubs payment processing (no actual PSP)
},
```

### 12.2 Event Bus Migration

**Step 1: Remove Shared Stores**

- Remove `@web-mfe/shared-auth-store` from shared packages
- Make auth store MFE-local

**Step 2: Implement Event Bus**

- Create event bus library
- Publish events from auth MFE
- Subscribe to events in shell and other MFEs

**Step 3: Update All MFEs**

- Remove dependencies on shared stores
- Subscribe to relevant events
- Publish events when state changes

---

## 15. Testing Strategy

**Reference:** See `docs/testing-strategy-poc-phases.md` for comprehensive testing strategy.

### 15.1 Testing Goals

- ✅ Test backend API integration
- ✅ Test real authentication (JWT)
- ✅ Test event bus communication
- ✅ Test design system components
- ✅ Test Admin MFE
- ✅ Test API client library
- ✅ Test error handling

### 15.2 Unit Testing

**Tools:** Vitest 2.0.x, React Testing Library 16.1.x

**Scope:**

- All MFE components (Auth, Payments, Admin, Shell)
- Design system components
- API client library
- Event bus library
- JWT token management
- Error boundaries
- RBAC helpers

**Coverage Target:** 75%

**Example:**

```typescript
// libs/shared-api-client/src/apiClient.test.ts
import { describe, it, expect, vi } from 'vitest';
import apiClient from './apiClient';

describe('API Client', () => {
  it('should add JWT token to requests', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ data: {} }),
    });

    await apiClient.get('/payments');

    expect(global.fetch).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({
        headers: expect.objectContaining({
          Authorization: expect.stringContaining('Bearer'),
        }),
      })
    );
  });
});
```

### 15.3 Integration Testing

**Tools:** Vitest, MSW (Mock Service Worker)

**Scope:**

- Backend API integration (Auth, Payments, Admin)
- Event bus communication between MFEs
- Design system component integration
- JWT token refresh flow
- Error handling (API errors, network errors)
- Admin MFE integration

**Example:**

```typescript
// apps/auth-mfe/src/integration/backend-auth.test.tsx
import { rest } from 'msw';
import { setupServer } from 'msw/node';

const server = setupServer(
  rest.post('/api/auth/login', (req, res, ctx) => {
    return res(
      ctx.json({
        success: true,
        data: {
          user: { id: '1', email: 'user@example.com', role: 'CUSTOMER' },
          accessToken: 'mock-jwt-token',
        },
      })
    );
  })
);
```

### 15.4 E2E Testing

**Tools:** Playwright

**Scope:**

- Complete authentication flow with backend
- Payment operations with backend API
- Admin MFE functionality
- Event bus communication (visual verification)
- Error handling (network errors, API errors)
- Design system components in real usage

**Coverage Target:** All critical user journeys + admin flows

**Example:**

```typescript
// e2e/backend-integration.spec.ts
import { test, expect } from '@playwright/test';

test('should sign in with real backend API', async ({ page }) => {
  await page.goto('http://localhost:4200');
  await page.fill('[name="email"]', 'user@example.com');
  await page.fill('[name="password"]', 'password123');
  await page.click('button:has-text("Sign In")');

  await expect(page).toHaveURL(/.*\/payments/);
});
```

### 15.5 Testing Deliverables

- ✅ Unit tests for all components (75% coverage)
- ✅ Integration tests for backend API integration
- ✅ Integration tests for event bus
- ✅ Integration tests for design system
- ✅ E2E tests for all critical flows
- ✅ Test coverage report (75% target)
- ✅ CI/CD test integration
- ✅ Test documentation

---

## 16. Next Steps

1. **Review and Approve:** Review this document and approve the approach
2. **Backend Setup:** Ensure backend API is ready (see `docs/backend-architecture.md`)
3. **Kickoff:** Start Phase 1 (Backend Integration)
4. **Iterate:** Follow the implementation plan, adjusting as needed
5. **Document:** Document learnings and decisions as we go
6. **Deliver:** Complete POC-2 and prepare for POC-3

**Related Documents:**

- `docs/testing-strategy-poc-phases.md` - Comprehensive testing strategy for all POC phases
- `docs/sast-implementation-plan.md` - SAST implementation plan (Git hooks & CI/CD)
- `docs/adr/README.md` - Architecture Decision Records (ADRs) index
- `docs/backend-poc2-architecture.md` - **Backend POC-2 architecture and implementation plan** (detailed backend documentation)
- `docs/backend-poc2-tech-stack.md` - **Backend POC-2 tech stack** (detailed backend tech stack)
- `docs/backend-testing-strategy.md` - **Backend testing strategy** (comprehensive backend testing)
- `docs/backend-api-documentation-standards.md` - **API documentation standards** (OpenAPI, Swagger)
- `docs/mfe-poc0-architecture.md` - POC-0 foundation
- `docs/mfe-poc1-architecture.md` - POC-1 authentication & payments
- `docs/mfe-poc3-architecture.md` - POC-3 infrastructure, enhanced observability & basic analytics
- `docs/backend-architecture.md` - Backend architecture
- `docs/backend-event-hub-implementation-plan.md` - Event hub implementation plan for inter-microservices communication
- `docs/observability-analytics-phasing.md` - Observability and analytics phasing strategy

---

**Last Updated:** 2026-01-XX  
**Status:** Planning - Ready for Implementation
