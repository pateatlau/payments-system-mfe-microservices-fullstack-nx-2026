# MFE POC-1 Architecture & Implementation Plan

**Status:** ✅ Complete  
**Version:** 1.0  
**Date:** 2026-01-XX  
**Tech Stack:** React + Nx + Vite + Module Federation v2  
**Completion Date:** 2026-01-XX

---

## 1. Executive Summary

This document defines the architecture and implementation plan for **POC-1** of the microfrontend (MFE) platform, extending POC-0 with:

- **Authentication system** (Auth MFE)
- **Payments system** (Payments MFE)
- **Routing** (React Router 7)
- **State management** (Zustand + TanStack Query)
- **Styling** (Tailwind CSS v4)
- **Role-based access control** (RBAC)
- **Universal header** with branding and navigation

**POC Purpose & Philosophy:**

The POC phases are designed to **validate the viability, practicality, and effort required** for implementing this microfrontend architecture. Security remains a priority throughout all phases, but the bank does not yet have these specific architectures in place. Therefore, POC-1 focuses on:

- ✅ **Architecture validation** - Testing MFE patterns, routing, state management, and inter-MFE communication
- ✅ **Practicality assessment** - Evaluating real-world implementation challenges with multiple MFEs
- ✅ **Effort estimation** - Understanding development complexity for authentication, payments, and RBAC patterns
- ✅ **Security foundation** - Establishing security patterns (input validation, secure storage, authentication flows)
- ✅ **Incremental complexity** - Building from POC-0 foundation to more complex features

This explains why payment operations are **stubbed** (no actual PSP integration) - the focus is on validating the architecture and patterns, not delivering complete payment processing (which will come in MVP/Production phases).

**Scope:** POC-1 establishes the foundation for authentication, payments (stubbed - no actual PSP), and core infrastructure, with clear paths to POC-2, POC-3, MVP, and Production.

---

## 2. Architecture Overview

### 2.1 High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    MFE Platform (POC-1)             │
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
| **Styling**           | Tailwind CSS                | 4.0+        | Latest, fast builds                         |
| **Design System**     | shadcn/ui                   | Latest      | POC-2                                       |
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
│   ├── auth-mfe/           # Auth remote (POC-1)
│   └── payments-mfe/        # Payments remote (POC-1)
├── libs/
│   ├── shared-utils/       # Shared utilities
│   ├── shared-ui/          # Shared UI components
│   ├── shared-types/       # Shared TypeScript types
│   ├── shared-auth-store/  # Auth Zustand store (POC-1)
│   ├── shared-header-ui/   # Universal header component (POC-1)
│   └── shared-api-client/  # API client (POC-2)
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
- Shared state management (Zustand)
- Authentication flow
- Route protection

**Auth MFE (Remote):**

- Sign-in/sign-up pages
- Authentication logic (mock)
- Form validation
- Exposes: `./SignIn`, `./SignUp`

**Payments MFE (Remote):**

- Payments dashboard
- Payment operations (stubbed - no actual PSP)
- Role-based access control
- Exposes: `./PaymentsPage`

**Shared Libraries:**

- `shared-utils`: Pure TypeScript utilities
- `shared-ui`: Shared React components
- `shared-types`: TypeScript types/interfaces
- `shared-auth-store`: Zustand auth store (POC-1)
- `shared-header-ui`: Universal header component (POC-1)
- `shared-api-client`: Axios client (POC-2)

---

## 4. POC-1 Requirements

### 4.1 Bug Fixes & Refactoring (POC-0)

**Scope:**

- Fix any identified bugs from POC-0
- Refactor code for maintainability and consistency
- Improve documentation
- Optimize build configurations
- Address any performance issues

**Deliverables:**

- Bug fix list and resolutions
- Refactored code with improved structure
- Updated documentation

---

### 4.2 New Remote MFEs

#### 4.2.1 Auth MFE (`auth-mfe`)

**Purpose:** Handle user authentication (signin/signup)

**Application to Create:**

- `apps/auth-mfe` - Auth remote application

**Features:**

- Sign-in page/form
- Sign-up page/form
- Mock authentication (no real backend)
- Form validation (React Hook Form + Zod)
- Error handling
- Loading states

**Exposed Components:**

- `./SignIn` - Sign-in page component
- `./SignUp` - Sign-up page component

**State Management:**

- Local component state for forms (React Hook Form)
- Zustand store for authentication state (shared with shell)

**Styling:**

- Tailwind CSS v4 (inline utility classes)
- Responsive design
- Pure React components (no React Native)

---

#### 4.2.2 Payments MFE (`payments-mfe`)

**Purpose:** Display payments page after authentication

**Application to Create:**

- `apps/payments-mfe` - Payments remote application

**Features:**

- Payments dashboard/page
- Stubbed payment data display (no actual PSP integration)
- Basic payment operations (stubbed - no actual payment processing)
- List/table view of transactions (stubbed data)
- **Role-based access control:**
  - **VENDOR:** Can initiate payments (stubbed), view reports
  - **CUSTOMER:** Can make payments (stubbed), view own history
  - **ADMIN:** Full access (POC-2)

**Note:** All payment flows are stubbed (no actual Payment Service Provider/PSP integration). Payment operations simulate the flow but do not process real payments. This applies to all POC phases (POC-1, POC-2, POC-3). Real PSP integration will be implemented in MVP/Production phases.

**Exposed Components:**

- `./PaymentsPage` - Main payments page component
- `./PaymentList` - List of payments (optional)

**State Management:**

- Local component state
- TanStack Query for server state (stubbed payment APIs - no actual PSP)
- Zustand store for payments state (optional, for future)

**Styling:**

- Tailwind CSS v4 (inline utility classes)
- Pure React components

---

### 4.3 Shell/Host Updates

#### 4.3.1 Authentication Flow

**Unauthenticated State:**

- Display signin/signup pages from `auth-mfe`
- No header/navigation
- Full-page auth experience

**Authenticated State:**

- Redirect to Payments page from `payments-mfe`
- Display universal header with branding and navigation
- Show logout link in header
- Protected routes

**Authentication Mock:**

- Simple in-memory authentication
- Mock user data
- Session persistence (localStorage)
- No real backend integration

---

#### 4.3.2 Universal Header Component

**Features:**

- Branding/logo
- Navigation items
- Logout button/link
- User info display (optional)
- Responsive design

**Implementation:**

- Shared component in `libs/shared-header-ui`
- Pure React components
- Styled with Tailwind CSS v4
- Works across all MFEs

**Layout Structure:**

```
┌─────────────────────────────────┐
│  Universal Header (Branding + Nav) │
├─────────────────────────────────┤
│                                 │
│  Content Area (Remote MFE)      │
│                                 │
│                                 │
└─────────────────────────────────┘
```

---

#### 4.3.3 Routing

**Technology:** React Router 7

**Implementation:**

- React Router 7 (browser router)
- Route protection (private routes)
- Redirect logic
- Lazy loading of remotes

**Routes:**

- `/` - Redirect based on auth state
- `/signin` - Sign-in page (unauthenticated)
- `/signup` - Sign-up page (unauthenticated)
- `/payments` - Payments page (authenticated, protected)

**Route Protection:**

- Private routes require authentication
- Redirect unauthenticated users to `/signin`
- Redirect authenticated users away from auth pages

---

### 4.4 State Management

**Architecture: Client State + Server State + Inter-MFE Communication**

**Three-Tier State Management:**

- **Zustand** - Client-side state (auth, UI, theme)
- **TanStack Query** - Server-side state (API data, caching)
- **Event Bus** - Inter-MFE communication (POC-2+)

**Evolution Strategy:**

**POC-1 (Current):**

- ✅ Zustand shared stores for inter-MFE communication (acceptable for POC)
- ✅ Zustand for state within single MFEs
- ✅ TanStack Query for server state (with stubbed payment APIs, mock authentication)

**POC-2 (Future):**

- ✅ Event bus for inter-MFE communication (decouples MFEs)
- ✅ Zustand only for state within single MFEs (no shared stores)
- ✅ TanStack Query for server state (with real backend)

---

#### 4.4.1 Auth Store

**Package:** `libs/shared-auth-store`

**Store Structure:**

```typescript
// User type with RBAC
export type UserRole = 'ADMIN' | 'CUSTOMER' | 'VENDOR';

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
}

// Auth Store
interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  signup: (email: string, password: string) => Promise<void>;
  // Role-based access helpers
  hasRole: (role: UserRole) => boolean;
  hasAnyRole: (roles: UserRole[]) => boolean;
}
```

**Implementation:**

```typescript
// libs/shared-auth-store/src/index.ts
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  signup: (email: string, password: string) => Promise<void>;
  hasRole: (role: UserRole) => boolean;
  hasAnyRole: (roles: UserRole[]) => boolean;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      isAuthenticated: false,
      isLoading: false,
      login: async (email, password) => {
        set({ isLoading: true });
        // Mock authentication
        const user = await mockLogin(email, password);
        set({ user, isAuthenticated: true, isLoading: false });
      },
      logout: () => {
        set({ user: null, isAuthenticated: false });
      },
      signup: async (email, password) => {
        set({ isLoading: true });
        // Mock signup
        const user = await mockSignup(email, password);
        set({ user, isAuthenticated: true, isLoading: false });
      },
      hasRole: (role: UserRole) => {
        const { user } = get();
        return user?.role === role;
      },
      hasAnyRole: (roles: UserRole[]) => {
        const { user } = get();
        return user ? roles.includes(user.role) : false;
      },
    }),
    {
      name: 'auth-storage',
      storage: createJSONStorage(() => localStorage),
    }
  )
);
```

**Role-Based Access Control (RBAC):**

**Roles:**

- **ADMIN** - Full system access (functionality in POC-2)
- **CUSTOMER** - Can make payments
- **VENDOR** - Can initiate payments, view reports, etc.

**Permissions:**

- **VENDOR:**
  - ✅ Initiate payment
  - ✅ View reports
  - ✅ View payment history
  - ❌ Cannot make payments (only initiate)
- **CUSTOMER:**
  - ✅ Make payments
  - ✅ View own payment history
  - ❌ Cannot initiate payments
  - ❌ Cannot view reports
- **ADMIN:**
  - 🔄 Full system access (POC-2)

---

#### 4.4.2 TanStack Query (Server State)

**Purpose:** Manage server state (API data, caching)

**POC-1 Implementation (Stubbed Payment APIs):**

```typescript
// apps/payments-mfe/src/api/stubbedPayments.ts
export const stubbedPaymentsApi = {
  getPayments: async (): Promise<Payment[]> => {
    await new Promise((resolve) => setTimeout(resolve, 500)); // Simulate delay
    return [
      { id: '1', amount: 100, description: 'Payment 1', status: 'completed' },
      { id: '2', amount: 200, description: 'Payment 2', status: 'pending' },
    ];
  },
  createPayment: async (dto: CreatePaymentDto): Promise<Payment> => {
    await new Promise((resolve) => setTimeout(resolve, 300));
    // Stubbed payment - simulates payment creation but does not process real payment
    return { id: '3', ...dto, status: 'completed' };
  },
};

// apps/payments-mfe/src/hooks/usePayments.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { stubbedPaymentsApi } from '../api/stubbedPayments';

export const usePayments = () => {
  return useQuery({
    queryKey: ['payments'],
    queryFn: () => stubbedPaymentsApi.getPayments(),
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
};

export const useCreatePayment = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (dto: CreatePaymentDto) =>
      stubbedPaymentsApi.createPayment(dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payments'] });
    },
  });
};
```

**Migration Path (POC-1 → POC-2):**

1. **POC-1:** Use stubbed payment APIs (as shown above) - no actual PSP integration
2. **POC-2:** Replace stubbed functions with backend API calls (still stubbed - no actual PSP):

   ```typescript
   // libs/shared-api-client/src/payments.ts
   import apiClient from './index';

   export const paymentsApi = {
     getPayments: async (): Promise<Payment[]> => {
       const response = await apiClient.get('/payments');
       return response.data;
     },
     // ... same interface, different implementation
     // Note: Backend API also stubs payment processing (no actual PSP integration)
   };
   ```

**Important:** All payment flows remain stubbed (no actual Payment Service Provider/PSP integration) across all POC phases. Real PSP integration will be implemented in MVP/Production phases.

**Benefits of Including in POC-1:**

- ✅ No throw-away code - Same patterns carry forward
- ✅ Early pattern establishment - Team learns React Query early
- ✅ Easy migration - Swap stubbed APIs for backend API calls (still stubbed, no PSP)
- ✅ Better DX - DevTools, caching, background updates
- ✅ Production-ready - Works seamlessly with backend

---

### 4.5 Styling

**POC-1 Approach: Inline Tailwind Classes**

- ✅ Direct inline Tailwind classes in components
- ✅ No design system component library
- ✅ Simple and fast for POC-1
- ✅ Full flexibility for rapid development

**Implementation:**

- Tailwind CSS v4.0+
- Vite integration
- Inline utility classes
- Responsive design

**Example:**

```typescript
// Pure React component with Tailwind CSS v4
function SignInButton() {
  return (
    <button className="bg-blue-500 px-4 py-2 rounded-lg text-white font-semibold hover:bg-blue-600">
      Sign In
    </button>
  );
}
```

**POC-2: Design System (Future):**

- 🔄 Design system using Tailwind + shadcn/ui
- 🔄 Reusable component library
- 🔄 Consistent design tokens
- 🔄 Shared component patterns

**Note:** See `docs/mfe-poc2-architecture.md` Section 4.4 for detailed design system implementation.

---

### 4.6 Code Sharing Strategy

**Maximum Code Sharing:**

- Shared UI components (React components)
- Shared business logic (TypeScript utilities)
- Shared state management (Zustand stores)
- Shared types/interfaces
- Shared validation logic (Zod schemas)
- Shared constants

**New Shared Libraries:**

- `@web-mfe/shared-auth-store` - Auth Zustand store
- `@web-mfe/shared-header-ui` - Universal header component
- `@web-mfe/shared-types` - Shared TypeScript types

**Platform-Specific Code:**

- Routing configuration (React Router 7)
- Storage (localStorage)
- Platform-specific utilities (if needed)

---

## 5. High-Level Architecture

### 5.1 Package Structure

```
web-mfe-workspace/
├── apps/
│   ├── shell/                    # Web host (updated)
│   ├── auth-mfe/                 # NEW: Auth web remote
│   └── payments-mfe/              # NEW: Payments web remote
├── libs/
│   ├── shared-utils/             # Existing shared utilities
│   ├── shared-ui/                # Existing shared UI
│   ├── shared-types/              # Existing shared types
│   ├── shared-auth-store/        # NEW: Auth Zustand store
│   └── shared-header-ui/         # NEW: Universal header component
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
│  │  React Router 7 + Zustand + Universal Header         │  │
│  └───────────────────────────────────────────────────────┘  │
│                          │                                   │
│        ┌─────────────────┴─────────────────┐               │
│        │                                     │               │
│  ┌─────▼─────┐                      ┌──────▼──────┐        │
│  │ Auth MFE  │                      │ Payments MFE │        │
│  │ (Remote)  │                      │  (Remote)    │        │
│  └───────────┘                      └──────────────┘        │
│        │                                     │               │
│        └──────────────┬──────────────────────┘               │
│                       │                                      │
│              ┌────────▼────────┐                            │
│              │  Shared Stores  │                            │
│              │  (Zustand)      │                            │
│              └─────────────────┘                            │
└─────────────────────────────────────────────────────────────┘
```

---

### 5.3 Data Flow

**Authentication Flow:**

1. User visits app → Check auth state (Zustand store)
2. If unauthenticated → Show signin/signup from `auth-mfe`
3. User submits form → Mock authentication → Update Zustand store
4. Store update → Router redirects to `/payments`
5. Shell loads `payments-mfe` → Displays payments page with header

**Logout Flow:**

1. User clicks logout in header
2. Zustand store `logout()` action → Clear user data
3. Router redirects to `/signin`
4. Shell loads `auth-mfe` → Displays signin page

**State Synchronization:**

- Zustand store is shared between shell and remotes
- Store updates trigger re-renders across MFEs
- No event bus needed for POC-1 (future enhancement in POC-2)

---

## 6. Implementation Plan

### Phase 1: Foundation & Setup (Week 1)

**Tasks:**

1. **Bug Fixes & Refactoring**

   - Review POC-0 issues
   - Fix identified bugs
   - Refactor code structure
   - Update documentation

2. **Install Dependencies**

   ```bash
   pnpm add -w react-router@7.x zustand@4.5.x @tanstack/react-query@5.x
   pnpm add -w react-hook-form@7.52.x zod@3.23.x axios@1.7.x
   pnpm add -w tailwindcss@4.0 react-error-boundary@4.0.13
   pnpm add -D -w vitest@2.0.x @testing-library/react@16.1.x
   pnpm add -D -w playwright@latest
   ```

3. **Create Shared Libraries**

   ```bash
   # Auth store
   nx generate @nx/js:library shared-auth-store \
     --bundler=tsc \
     --unitTestRunner=vitest

   # Header UI
   nx generate @nx/react:library shared-header-ui \
     --bundler=vite \
     --unitTestRunner=vitest

   # Shared types (if not exists)
   nx generate @nx/js:library shared-types \
     --bundler=tsc
   ```

4. **Setup Tailwind CSS v4**

   - Configure Tailwind CSS v4 for all apps
   - Create shared Tailwind config
   - Test styling across apps

**Deliverables:**

- ✅ Dependencies installed
- ✅ Shared libraries created
- ✅ Tailwind CSS v4 configured
- ✅ Bug fixes completed

---

### Phase 2: Authentication MFE (Week 2)

**Tasks:**

1. **Create Auth MFE Application**

   ```bash
   nx generate @nx/react:application auth-mfe \
     --bundler=vite \
     --style=css \
     --routing=false
   ```

2. **Implement Auth Store**

   - Create Zustand auth store in `libs/shared-auth-store`
   - Implement mock authentication
   - Add RBAC helpers
   - Add persistence (localStorage)

3. **Create Auth Components**

   - Sign-in page/form
   - Sign-up page/form
   - Form validation (React Hook Form + Zod)
   - Error handling
   - Loading states

4. **Configure Module Federation v2**

   - Setup Vite plugin for Module Federation v2
   - Expose `./SignIn` and `./SignUp` components
   - Test standalone mode

5. **Styling**

   - Style with Tailwind CSS v4
   - Responsive design
   - Error states
   - Loading states

**Deliverables:**

- ✅ Auth MFE application created
- ✅ Auth store implemented
- ✅ Sign-in/sign-up pages working
- ✅ Module Federation v2 configured
- ✅ Styling complete

---

### Phase 3: Payments MFE (Week 3)

**Tasks:**

1. **Create Payments MFE Application**

   ```bash
   nx generate @nx/react:application payments-mfe \
     --bundler=vite \
     --style=css \
     --routing=false
   ```

2. **Implement Stubbed Payment APIs**

   - Create stubbed payments API (no actual PSP integration)
   - Setup TanStack Query hooks
   - Implement data fetching
   - Implement mutations

3. **Create Payments Components**

   - Payments dashboard/page
   - Payment list/table
   - Payment operations (stubbed - no actual PSP integration)
   - Role-based UI (VENDOR vs CUSTOMER)

4. **Configure Module Federation v2**

   - Setup Vite plugin for Module Federation v2
   - Expose `./PaymentsPage` component
   - Test standalone mode

5. **Styling**

   - Style with Tailwind CSS v4
   - Responsive design
   - Role-based UI variations

**Deliverables:**

- ✅ Payments MFE application created
- ✅ Stubbed payment APIs implemented (no actual PSP)
- ✅ Payments page working
- ✅ Role-based access control
- ✅ Module Federation v2 configured
- ✅ Styling complete

---

### Phase 4: Shell Integration (Week 4)

**Tasks:**

1. **Update Shell Application**

   - Integrate React Router 7
   - Setup route protection
   - Integrate Zustand auth store
   - Add universal header component
   - Dynamic remote loading (auth-mfe, payments-mfe)
   - Update Module Federation v2 config

2. **Universal Header**

   - Implement header component in `libs/shared-header-ui`
   - Branding/logo
   - Navigation items
   - Logout functionality
   - User info display (optional)
   - Responsive design

3. **Route Protection**

   - Create `ProtectedRoute` component
   - Redirect logic based on auth state
   - Test route protection

4. **Integration Testing**

   - Test authentication flow
   - Test route protection
   - Test state synchronization
   - Test remote loading
   - Test logout flow

**Deliverables:**

- ✅ Shell integrated with React Router 7
- ✅ Route protection working
- ✅ Universal header implemented
- ✅ Authentication flow complete
- ✅ All remotes loading dynamically

---

### Phase 5: Testing & Refinement (Week 5)

**Tasks:**

1. **Unit Testing**

   - Write Vitest tests for all components
   - Test auth store
   - Test form validation
   - Test role-based access
   - Test TanStack Query hooks

2. **Integration Testing**

   - Test authentication flow
   - Test route protection
   - Test state synchronization
   - Test remote loading
   - Test logout flow

3. **E2E Testing**

   - Setup Playwright
   - Write E2E tests for auth flow
   - Write E2E tests for payments flow
   - Test role-based access

4. **Documentation**

   - Update architecture docs
   - Create POC-1 completion summary
   - Document new packages
   - Update testing guide

5. **Refinement**

   - Fix identified issues
   - Optimize performance
   - Improve code quality
   - Final review

**Deliverables:**

- ✅ Unit tests written and passing
- ✅ Integration tests written and passing
- ✅ E2E tests written and passing
- ✅ Documentation updated
- ✅ Code refined and optimized

---

## 7. Key Technical Decisions

### 7.1 React Router 7

**Decision:** Use React Router 7 for routing

**Reference:** See `docs/adr/poc-1/0001-use-react-router-7.md` for decision rationale, alternatives considered, and trade-offs.

**Rationale:**

- Latest version with modern features
- Excellent TypeScript support
- Route protection built-in
- Data loading APIs
- Production-ready

**Features:**

- Route protection/guards
- Lazy loading
- Data loaders
- Error boundaries integration
- Type-safe routing

**Carry Forward:** ✅ Yes - Production-ready, scales to enterprise

---

### 7.2 Zustand for State Management

**Decision:** Use Zustand for client-side state management

**Reference:** See `docs/adr/poc-1/0002-use-zustand-for-state.md` for decision rationale, alternatives considered, and trade-offs.

**Rationale:**

- Lightweight and performant
- Excellent TypeScript support
- No provider wrapping needed
- Scales well to complex state
- Easy to share between MFEs

**POC-1 Usage:**

- ✅ Shared stores for inter-MFE communication (e.g., `@web-mfe/shared-auth-store`)
- ✅ MFE-local stores for component state within single MFEs
- ⚠️ Acceptable for POC, but creates coupling between MFEs

**Reference:** See `docs/adr/poc-1/0005-shared-zustand-stores-poc1.md` for rationale on using shared stores in POC-1 and migration plan to event bus in POC-2.

**POC-2 Evolution:**

- ✅ Zustand only for state within single MFEs (decoupled)
- ❌ No shared Zustand stores across MFEs
- ✅ Event bus for inter-MFE communication

**Carry Forward:** ✅ Yes - Production-ready, scales to complex state

---

### 7.3 TanStack Query for Server State

**Decision:** Use TanStack Query for server state management

**Reference:** See `docs/adr/poc-1/0003-use-tanstack-query.md` for decision rationale, alternatives considered, and trade-offs.

**Rationale:**

- Server state management - Designed for API data, caching, synchronization
- Works without backend - Can use stubbed APIs in POC-1, swap for backend API later (still stubbed, no PSP)
- No throw-away code - Same patterns carry forward to real backend
- Production-ready - Industry standard for server state
- Excellent TypeScript support - Type-safe queries and mutations

**POC-1 Implementation:**

- Use stubbed payment APIs with TanStack Query (no actual PSP)
- Same patterns as backend API (which also stubs payments)
- Easy migration to backend API in POC-2 (still stubbed, no PSP)

**Carry Forward:** ✅ Yes - Production-ready, patterns carry forward from stubbed payment APIs to backend API (still stubbed, no PSP)

---

### 7.4 Tailwind CSS v4

**Decision:** Use Tailwind CSS v4 for styling

**Reference:** See `docs/adr/poc-1/0004-use-tailwind-css-v4.md` for decision rationale, alternatives considered, and trade-offs.

**Rationale:**

- Latest version - Released January 2025, production-ready
- 5x faster full builds, 100x+ faster incremental builds - Massive performance improvement
- Modern CSS features - Cascade layers, `color-mix()`, container queries
- Simplified setup - Zero configuration, fewer dependencies
- Future-proof - Latest version with long-term support

**POC-1 Approach:**

- Inline Tailwind classes
- No design system yet
- Full flexibility for rapid development

**POC-2/POC-3 Evolution:**

- Design system using Tailwind + shadcn/ui
- Reusable component library
- Consistent design tokens

**Carry Forward:** ✅ Yes - Latest version, better performance, future-proof

---

### 7.5 Mock Authentication

**Decision:** Implement simple in-memory mock authentication

**Rationale:**

- POC-1 focus is on architecture, not real auth
- Faster development
- No backend dependency
- Can be replaced with real auth later

**Future Enhancement:**

- Replace with real authentication service
- JWT token management
- OAuth integration (if needed)

---

## 8. Success Criteria

✅ **Functional Requirements:**

- [ ] User can sign in/sign up (mock)
- [ ] Authenticated users see payments page
- [ ] Unauthenticated users see signin/signup
- [ ] Logout redirects to signin
- [ ] Routes are protected
- [ ] Universal header displays correctly
- [ ] Role-based access control works (VENDOR vs CUSTOMER)
- [ ] Payment operations work (stubbed - no actual PSP integration)
- [ ] Works in all modern browsers

✅ **Technical Requirements:**

- [ ] React Router 7 integrated and working
- [ ] Zustand stores shared between MFEs
- [ ] TanStack Query working with stubbed payment APIs (mock authentication)
- [ ] Tailwind CSS v4 working
- [ ] Maximum code sharing achieved
- [ ] All remotes load dynamically
- [ ] No static imports of remotes
- [ ] Module Federation v2 configured correctly

✅ **Quality Requirements:**

- [ ] Code follows architectural constraints
- [ ] TypeScript types are correct
- [ ] No bundler-specific code in shared packages
- [ ] Documentation is updated
- [ ] Unit tests pass
- [ ] Integration tests pass
- [ ] E2E tests pass

---

## 9. Security Strategy (Banking-Grade)

**Context:** This platform is designed for a large banking institution, requiring enterprise-grade security from the start.

**Reference:** See `docs/security-strategy-banking.md` for comprehensive security strategy.

### 9.1 POC-1 Security Features (Foundation)

**Scope:** Basic security foundation for banking application

**Security Features:**

1. **Authentication & Authorization**

   - ✅ Secure password handling (never log passwords)
   - ✅ Session management
   - ✅ Role-based access control (RBAC) foundation
   - ✅ Secure storage (localStorage with encryption consideration)
   - ✅ Mock authentication (real JWT in POC-2)

2. **Input Validation & Sanitization**

   - ✅ Strong password requirements (12+ chars, complexity)
   - ✅ Input sanitization (XSS prevention)
   - ✅ Type-safe validation (Zod)
   - ✅ SQL injection prevention (parameterized queries in backend)

3. **Secure Communication**

   - ✅ Secure headers
   - ✅ CORS configuration
   - ⚠️ HTTP for POC-1 (HTTPS with self-signed certificates in POC-3)
   - ⚠️ Real certificates planned for MVP

4. **Secure Storage**

   - ✅ Encryption at rest (localStorage)
   - ✅ Secure key management
   - ✅ No plaintext sensitive data
   - ✅ Automatic cleanup on logout

5. **Error Handling & Information Disclosure**

   - ✅ No sensitive data in error messages
   - ✅ Generic error messages in production
   - ✅ Secure error logging
   - ✅ No stack traces in production

6. **Content Security Policy (CSP)**
   - ✅ CSP headers
   - ✅ XSS prevention
   - ✅ Restricted resource loading

**Implementation:**

- All security features implemented in Phase 1-5
- Security testing in Phase 5
- Security review before POC-2

**Note:** See `docs/security-strategy-banking.md` for comprehensive security strategy across all phases (POC-1, POC-2, POC-3, MVP, Production).

**Compliance Considerations:**

- ✅ PCI DSS preparation (payment data security)
- ✅ GDPR preparation (data protection)
- ✅ Banking regulations (foundation)

---

## 10. Out of Scope (Future)

**Not Included in POC-1:**

- Real authentication backend (POC-2)
- Event bus for inter-MFE communication (POC-2)
- Advanced payment features
- Real payment processing with PSP integration (MVP/Production - all POC phases use stubbed payments)
- User profile management
- Advanced routing (deep linking, etc.)
- Performance optimizations (code splitting, lazy loading) (POC-3)
- Error boundaries and error handling (basic only)
- Analytics integration
- Theming system (basic styling only)
- Design system (POC-2)
- nginx reverse proxy (POC-3)
- WebSocket real-time updates (POC-3)
- Basic observability (POC-2)
- Enhanced observability (POC-3)
- Basic analytics (architecture-focused) (POC-3)
- Session management (cross-tab, cross-device) (POC-3)
- Advanced monitoring (POC-3)

---

## 11. Risks & Mitigations

| Risk                                     | Impact | Mitigation                                                               |
| ---------------------------------------- | ------ | ------------------------------------------------------------------------ |
| React Router 7 setup complexity          | Medium | Research and test early, follow documentation                            |
| Tailwind CSS v4 setup complexity         | Medium | Start early, follow documentation, test build performance                |
| Zustand store sharing across MFEs        | Medium | Design store structure carefully, test state synchronization             |
| Module Federation v2 configuration       | Medium | Follow documentation, test remote loading thoroughly                     |
| TanStack Query with stubbed payment APIs | Low    | Use same patterns as backend API, easy migration (still stubbed, no PSP) |
| Performance with multiple remotes        | Low    | Monitor bundle sizes, optimize if needed                                 |

---

## 12. Dependencies

**New Dependencies:**

- `react-router` v7
- `zustand` v4.5.x
- `@tanstack/react-query` v5.x
- `tailwindcss` v4.0+
- `react-hook-form` v7.52.x
- `zod` v3.23.x
- `axios` v1.7.x
- `react-error-boundary` v4.0.13
- `vitest` v2.0.x
- `@testing-library/react` v16.1.x
- `playwright` (latest)

**Existing Dependencies:**

- All POC-0 dependencies remain
- React 19.2.0
- Vite 6.x
- Module Federation v2 (@module-federation/enhanced)

---

## 13. Next Steps

1. **Review and Approve:** Review this document and approve the approach
2. **Kickoff:** Start Phase 1 (Foundation & Setup)
3. **Iterate:** Follow the implementation plan, adjusting as needed
4. **Document:** Document learnings and decisions as we go
5. **Deliver:** Complete POC-1 and prepare for POC-2

## 14. Testing Strategy

**Reference:** See `docs/testing-strategy-poc-phases.md` for comprehensive testing strategy.

### 14.1 Testing Goals

- ✅ Test authentication flows (mock)
- ✅ Test payment operations (stubbed)
- ✅ Test routing and navigation
- ✅ Test state management (Zustand, TanStack Query)
- ✅ Test RBAC patterns

### 14.2 Unit Testing

**Tools:** Vitest 2.0.x, React Testing Library 16.1.x

**Scope:**

- Auth MFE components (SignIn, SignUp)
- Payments MFE components (PaymentsPage, PaymentForm)
- Shell components (Header, Navigation)
- Zustand stores (auth store)
- TanStack Query hooks
- Form validation (React Hook Form + Zod)
- RBAC helpers

**Coverage Target:** 70%

**Example:**

```typescript
// apps/auth-mfe/src/components/SignIn.test.tsx
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import SignIn from './SignIn';

describe('SignIn', () => {
  it('should validate email format', async () => {
    const user = userEvent.setup();
    render(<SignIn />);

    const emailInput = screen.getByLabelText(/email/i);
    await user.type(emailInput, 'invalid-email');
    await user.click(screen.getByRole('button', { name: /sign in/i }));

    await waitFor(() => {
      expect(screen.getByText(/invalid email/i)).toBeInTheDocument();
    });
  });
});
```

### 14.3 Integration Testing

**Scope:**

- Authentication flow (sign in → redirect → payments page)
- Payment creation flow (form → API → state update)
- Event bus communication (auth events → shell updates)
- Routing integration (protected routes, navigation)
- RBAC integration (role-based access)

### 14.4 E2E Testing

**Tools:** Playwright

**Scope:**

- Complete authentication flow (sign in → payments page)
- Payment creation flow (form → success message)
- Navigation between pages
- RBAC (role-based access control)
- Logout flow

**Coverage Target:** Critical user journeys

### 14.5 Testing Deliverables

- ✅ Unit tests for all MFE components (70% coverage)
- ✅ Integration tests for authentication and payment flows
- ✅ E2E tests for critical user journeys
- ✅ Test coverage report (70% target)
- ✅ CI/CD test integration
- ✅ Test documentation

---

**Related Documents:**

- `docs/testing-strategy-poc-phases.md` - Comprehensive testing strategy for all POC phases
- `docs/sast-implementation-plan.md` - SAST implementation plan (Git hooks & CI/CD)
- `docs/adr/README.md` - Architecture Decision Records (ADRs) index
- `docs/mfe-poc0-architecture.md` - POC-0 foundation
- `docs/mfe-poc2-architecture.md` - POC-2 backend integration, design system & basic observability
- `docs/mfe-poc3-architecture.md` - POC-3 infrastructure, enhanced observability & basic analytics
- `docs/observability-analytics-phasing.md` - Observability and analytics phasing strategy

---

**Last Updated:** 2026-01-XX  
**Status:** ✅ Complete - Implementation Finished

**Related Documentation:**
- [`../POC-1-Implementation/poc-1-completion-summary.md`](../POC-1-Implementation/poc-1-completion-summary.md) - POC-1 completion summary
- [`../POC-1-Implementation/implementation-plan.md`](../POC-1-Implementation/implementation-plan.md) - Detailed implementation plan
- [`../POC-1-Implementation/task-list.md`](../POC-1-Implementation/task-list.md) - Task tracking
