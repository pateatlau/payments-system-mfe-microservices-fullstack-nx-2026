# MFE POC-1 Tech Stack - Production-Ready & Scalable

**Status:** Authoritative  
**Version:** 1.0  
**Date:** 2026-01-XX

---

## 1. Philosophy & Principles

### 1.1 Core Principles

**No Throw-Away Code:**

- Every technology choice must be production-ready
- All code written in POC-1 must carry forward to MVP and Production
- Avoid temporary solutions or "quick fixes"
- Choose technologies with long-term support and active development

**Scalability First:**

- Technologies must scale from POC to Production
- Architecture must support enterprise-level requirements
- Performance optimizations built-in, not bolted-on
- Monitoring and observability from day one

**Web-First Approach:**

- Optimized for web platform
- Modern web standards
- Excellent developer experience
- Fast development and builds

**Type Safety:**

- TypeScript-first approach
- Runtime validation where needed
- Type-safe APIs and state management
- Compile-time error detection

---

## 2. Complete Tech Stack Matrix

| Category                      | Technology  | Version | Platform | Production-Ready                     | Notes |
| ----------------------------- | ----------- | ------- | -------- | ------------------------------------ | ----- |
| **Core Framework**            |
| React                         | 19.2.0      | Web     | ✅       | Latest stable, future-proof          |
| React DOM                     | 19.2.0      | Web     | ✅       | Must match React version             |
| **Monorepo**                  |
| Nx                            | Latest      | All     | ✅       | Scalable, build caching              |
| **Bundling & Build**          |
| Vite                          | 6.x         | Web     | ✅       | Fast dev server, excellent DX        |
| TypeScript                    | 5.9.x       | All     | ✅       | React 19 support                     |
| **Module Federation**         |
| @module-federation/enhanced   | 0.21.6      | Web     | ✅       | BIMF (Module Federation v2)          |
| **Routing**                   |
| React Router                  | 7.x         | Web     | ✅       | Latest, production-ready             |
| **State Management (Client)** |
| Zustand                       | 4.5.x       | Web     | ✅       | Client state (auth, UI, theme)       |
| **State Management (Server)** |
| TanStack Query                | 5.x         | Web     | ✅       | Server state (API data, caching)     |
| **Styling**                   |
| Tailwind CSS                  | 4.0+        | Web     | ✅       | Latest, 5x faster builds, modern CSS |
| **Design System**             |
| shadcn/ui                     | Latest      | Web     | 🔄       | POC-2/POC-3                          |
| **Form Handling**             |
| React Hook Form               | 7.52.x      | Web     | ✅       | Industry standard, performant        |
| **Validation**                |
| Zod                           | 3.23.x      | Web     | ✅       | TypeScript-first, runtime validation |
| **Storage**                   |
| localStorage                  | Native      | Web     | ✅       | Browser API                          |
| **HTTP Client**               |
| Axios                         | 1.7.x       | Web     | ✅       | Production-ready, interceptors       |
| **Error Handling**            |
| react-error-boundary          | 4.0.13      | Web     | ✅       | React 19 compatible                  |
| **Testing**                   |
| Vitest                        | 2.0.x       | Web     | ✅       | Fast, Vite-native                    |
| React Testing Library         | 16.1.x      | Web     | ✅       | Works with Vitest                    |
| **E2E Testing**               |
| Playwright                    | Latest      | Web     | ✅       | Modern, fast, reliable               |
| **Code Quality**              |
| ESLint                        | 9.x         | All     | ✅       | Latest, flat config                  |
| Prettier                      | 3.3.x       | All     | ✅       | Code formatting                      |
| TypeScript ESLint             | 8.x         | All     | ✅       | TS-specific linting                  |
| **Performance**               |
| React DevTools Profiler       | Native      | Web     | ✅       | Built-in profiling                   |
| **Monitoring (Future)**       |
| Sentry                        | Latest      | Web     | 🔄       | Error tracking (MVP phase)           |
| **CI/CD**                     |
| GitHub Actions                | Native      | All     | ✅       | Free, scalable                       |
| **Package Management**        |
| pnpm                          | 9.x         | All     | ✅       | Recommended for Nx                   |
| **Node.js**                   |
| Node.js                       | 24.11.x LTS | All     | ✅       | Latest LTS, SWC support              |

---

## 3. Detailed Technology Breakdown

### 3.1 Core Framework

#### React 19.2.0

**Rationale:**

- Latest stable version with long-term support
- Improved performance and concurrent features
- Future-proof for upcoming React features
- Excellent TypeScript support

**Production Considerations:**

- Stable API, no breaking changes expected
- Excellent TypeScript support
- Large ecosystem and community
- Used by major companies in production

**Carry Forward:** ✅ Yes - Core framework, no changes needed

---

### 3.2 Monorepo

#### Nx

**Rationale:**

- Scalable monorepo management
- Build caching (only rebuild what changed)
- Task orchestration (parallel execution)
- Dependency graph (visualize dependencies)
- Code generation (scaffold new apps/libs)
- Affected projects (only test/build affected)

**Production Considerations:**

- Used by major companies
- Production-ready
- Active maintenance
- Excellent developer experience
- Scales to enterprise

**Carry Forward:** ✅ Yes - Production-ready, scales to enterprise

---

### 3.3 Bundling & Build

#### Vite 6.x

**Rationale:**

- Fast dev server (instant startup)
- Excellent HMR (near-instant updates)
- Fast production builds (esbuild + Rollup)
- Native ESM (modern JavaScript)
- TypeScript support (excellent)
- Plugin ecosystem (large)

**Production Considerations:**

- Production-ready
- Used by major companies
- Active maintenance
- Excellent performance
- Scales to large applications

**Carry Forward:** ✅ Yes - Production-ready, excellent DX

---

### 3.4 Module Federation

#### @module-federation/enhanced 0.21.6

**Rationale:**

- Module Federation v2 (BIMF)
- Runtime code sharing
- Independent deployments
- Shared dependencies
- Type-safe remotes
- Better than MF v1 (enhanced features)

**Production Considerations:**

- Production-ready
- Used in production
- Active maintenance
- Better than MF v1

**Carry Forward:** ✅ Yes - Production-ready, future-proof

---

### 3.5 Routing

#### React Router 7.x

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

**Production Considerations:**

- Used in production by major companies
- Active development and support
- Excellent documentation
- Performance optimizations

**Carry Forward:** ✅ Yes - Production-ready, scales to enterprise

**Implementation:**

```typescript
// apps/shell/src/router.tsx
import { createBrowserRouter, RouterProvider } from 'react-router';
import { ProtectedRoute } from './components/ProtectedRoute';

const router = createBrowserRouter([
  {
    path: '/signin',
    element: <SignInPage />,
  },
  {
    path: '/payments',
    element: (
      <ProtectedRoute>
        <PaymentsPage />
      </ProtectedRoute>
    ),
  },
]);

export function App() {
  return <RouterProvider router={router} />;
}
```

---

### 3.6 State Management

#### Architecture: Client State + Server State + Inter-MFE Communication

**Three-Tier State Management:**

- **Zustand** - Client-side state (auth, UI, theme)
- **TanStack Query** - Server-side state (API data, caching)
- **Event Bus** - Inter-MFE communication (POC-2+)

**Evolution Strategy:**

**POC-1 (Current):**

- ✅ Zustand shared stores for inter-MFE communication (acceptable for POC)
- ✅ Zustand for state within single MFEs
- ✅ TanStack Query for server state (with mock APIs)

**POC-2 (Future):**

- ✅ Event bus for inter-MFE communication (decouples MFEs)
- ✅ Zustand only for state within single MFEs (no shared stores)
- ✅ TanStack Query for server state (with real backend)

---

#### Zustand 4.5.x (Client State)

**Reference:** See `docs/adr/poc-1/0002-use-zustand-for-state.md` and `docs/adr/poc-1/0005-shared-zustand-stores-poc1.md` for decision rationale, alternatives considered, and trade-offs.

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

**POC-2 Evolution:**

- ✅ Zustand only for state within single MFEs (decoupled)
- ❌ No shared Zustand stores across MFEs
- ✅ Event bus for inter-MFE communication

**Features:**

- Simple API
- Middleware support (persist, devtools)
- TypeScript-first
- Small bundle size
- Performance optimizations

**Production Considerations:**

- Used in production by major companies
- Production-ready
- Active maintenance
- Excellent performance
- Scales to enterprise applications

**Carry Forward:** ✅ Yes - Production-ready, scales to complex state

**Implementation:**

```typescript
// libs/shared-auth-store/src/index.ts
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

export type UserRole = 'ADMIN' | 'CUSTOMER' | 'VENDOR';

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
}

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
        const user = await mockLogin(email, password);
        set({ user, isAuthenticated: true, isLoading: false });
      },
      logout: () => {
        set({ user: null, isAuthenticated: false });
      },
      signup: async (email, password) => {
        set({ isLoading: true });
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

---

#### TanStack Query 5.x (Server State)

**Reference:** See `docs/adr/poc-1/0003-use-tanstack-query.md` for decision rationale, alternatives considered, and trade-offs.

**Rationale:**

- **Server state management** - Designed for API data, caching, synchronization
- **Works without backend** - Can use mock APIs in POC-1, swap for real API later
- **No throw-away code** - Same patterns carry forward to real backend
- **Production-ready** - Industry standard for server state
- **Excellent TypeScript support** - Type-safe queries and mutations

**Features:**

- Automatic caching
- Background updates
- Request deduplication
- Optimistic updates
- Error handling and retries
- DevTools for debugging
- TypeScript-first

**Production Considerations:**

- Used by major companies
- Production-ready
- Active maintenance
- Excellent performance
- Scales to complex APIs

**Carry Forward:** ✅ Yes - Production-ready, patterns carry forward from mocks to real API

**Implementation (POC-1 with Mocks):**

```typescript
// apps/payments-mfe/src/api/mockPayments.ts
export const mockPaymentsApi = {
  getPayments: async (): Promise<Payment[]> => {
    await new Promise((resolve) => setTimeout(resolve, 500));
    return [
      { id: '1', amount: 100, description: 'Payment 1' },
      { id: '2', amount: 200, description: 'Payment 2' },
    ];
  },
  createPayment: async (dto: CreatePaymentDto): Promise<Payment> => {
    await new Promise((resolve) => setTimeout(resolve, 300));
    return { id: '3', ...dto };
  },
};

// apps/payments-mfe/src/hooks/usePayments.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { mockPaymentsApi } from '../api/mockPayments';

export const usePayments = () => {
  return useQuery({
    queryKey: ['payments'],
    queryFn: () => mockPaymentsApi.getPayments(),
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
};

export const useCreatePayment = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (dto: CreatePaymentDto) => mockPaymentsApi.createPayment(dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payments'] });
    },
  });
};
```

**Migration Path (POC-1 → POC-2):**

1. **POC-1:** Use mock APIs (as shown above)
2. **POC-2:** Replace mock functions with real API calls:

   ```typescript
   // libs/shared-api-client/src/payments.ts
   import apiClient from './index';

   export const paymentsApi = {
     getPayments: async (): Promise<Payment[]> => {
       const response = await apiClient.get('/payments');
       return response.data;
     },
   };
   ```

**Benefits of Including in POC-1:**

- ✅ No throw-away code - Same patterns carry forward
- ✅ Early pattern establishment - Team learns React Query early
- ✅ Easy migration - Swap mocks for real API calls
- ✅ Better DX - DevTools, caching, background updates
- ✅ Production-ready - Works seamlessly with backend

---

#### Event Bus (POC-2+)

**Rationale:**

- **Decouples MFEs** - MFEs communicate via events, not shared state
- **Loose coupling** - MFEs don't need to know about each other
- **Scalability** - Easy to add/remove MFEs without breaking others
- **Production-ready pattern** - Industry standard for microfrontend communication

**POC-1 Status:**

- ⚠️ Not implemented in POC-1
- ✅ Using shared Zustand stores for inter-MFE communication (acceptable for POC)

**POC-2 Implementation:**

- ✅ Event bus for inter-MFE communication
- ✅ Zustand only for state within single MFEs
- ✅ MFEs publish/subscribe to events

**Event Bus Pattern:**

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
    this.listeners.get(event)?.forEach((callback) => callback(data));
  }
}

export const EventBus = new EventBus();
```

**Carry Forward:** ✅ Yes - Event bus is production-ready pattern for microfrontend communication

---

### 3.7 Styling

#### POC-1: Inline Tailwind Classes

**Approach:**

- ✅ Direct inline Tailwind classes in components
- ✅ No design system component library
- ✅ Simple and fast for POC-1
- ✅ Full flexibility for rapid development

**Example:**

```typescript
function SignInButton() {
  return (
    <button className="bg-blue-500 px-4 py-2 rounded-lg text-white font-semibold hover:bg-blue-600">
      Sign In
    </button>
  );
}
```

**POC-2/POC-3 Evolution:**

- 🔄 Design system using Tailwind + shadcn/ui
- 🔄 Reusable component library
- 🔄 Consistent design tokens
- 🔄 Shared component patterns

---

#### Tailwind CSS 4.0+

**Reference:** See `docs/adr/poc-1/0004-use-tailwind-css-v4.md` for decision rationale, alternatives considered, and trade-offs.

**Rationale:**

- **Latest version** - Released January 2025, production-ready
- **5x faster full builds, 100x+ faster incremental builds** - Massive performance improvement
- **Modern CSS features** - Cascade layers, `color-mix()`, container queries
- **Simplified setup** - Zero configuration, fewer dependencies
- **Future-proof** - Latest version with long-term support

**Features:**

- Utility classes
- Responsive design
- Dark mode support
- Modern CSS features (cascade layers, `color-mix()`)
- Simplified configuration (CSS-first approach)
- JIT compilation (even faster in v4)

**Production Considerations:**

- ✅ Officially released and stable (January 2025)
- ✅ Used in production by early adopters
- ✅ Better performance = faster CI/CD builds
- ✅ Active maintenance and support
- ✅ Backward compatible migration path from v3

**Carry Forward:** ✅ Yes - Latest version, better performance, future-proof

---

### 3.8 Form Handling

#### React Hook Form 7.52.x

**Rationale:**

- Industry standard for form handling
- Excellent performance (uncontrolled components)
- TypeScript-first
- Zod integration

**Features:**

- Uncontrolled components (performance)
- Validation integration
- Error handling
- TypeScript support
- Small bundle size

**Production Considerations:**

- Used by major companies
- Production-ready
- Excellent performance
- Active maintenance
- Scales to complex forms

**Carry Forward:** ✅ Yes - Industry standard, no alternatives needed

**Implementation:**

```typescript
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

const signInSchema = z.object({
  email: z.string().email('Invalid email'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
});

type SignInForm = z.infer<typeof signInSchema>;

function SignInForm() {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<SignInForm>({
    resolver: zodResolver(signInSchema),
  });

  const onSubmit = (data: SignInForm) => {
    // Handle form submission
  };

  return <form onSubmit={handleSubmit(onSubmit)}>{/* Form fields */}</form>;
}
```

---

### 3.9 Validation

#### Zod 3.23.x

**Rationale:**

- TypeScript-first validation
- Runtime type checking
- Schema inference
- Excellent error messages

**Features:**

- Type-safe schemas
- Runtime validation
- Type inference
- Custom validators
- Error formatting

**Production Considerations:**

- Production-ready
- Used by major companies
- Active maintenance
- Excellent TypeScript support
- Scales to complex schemas

**Carry Forward:** ✅ Yes - Industry standard, no alternatives needed

**Implementation:**

```typescript
import { z } from 'zod';

// Define schema
export const userSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  name: z.string().min(1),
});

// Infer TypeScript type
export type User = z.infer<typeof userSchema>;

// Validate at runtime
const result = userSchema.safeParse(data);
if (result.success) {
  // Type-safe data
  const user: User = result.data;
}
```

---

### 3.10 Storage

#### localStorage

**Rationale:**

- Native browser API
- No dependencies
- Production-ready
- Persistent storage
- Works with Zustand persist

**Production Considerations:**

- Production-ready
- Used by all web applications
- Secure (HTTPS will be implemented in POC-3 with self-signed certificates, real certificates in MVP)
- Persistent across sessions

**Carry Forward:** ✅ Yes - Native API, no changes needed

---

### 3.11 HTTP Client

#### Axios 1.7.x

**Rationale:**

- Industry standard
- Production-ready
- Interceptors support
- Request/response transformation
- TypeScript support

**Features:**

- Request/response interceptors
- Automatic JSON parsing
- Error handling
- Request cancellation
- TypeScript support

**Production Considerations:**

- Used by major companies
- Production-ready
- Active maintenance
- Excellent documentation
- Scales to complex APIs

**Carry Forward:** ✅ Yes - Industry standard, scales to enterprise APIs

**Implementation:**

```typescript
import axios from 'axios';
import { useAuthStore } from '@web-mfe/shared-auth-store';

// Create instance
const apiClient = axios.create({
  baseURL: process.env['NX_API_BASE_URL'] || 'http://localhost:3000/api',
  timeout: 10000,
});

// Request interceptor (add auth token)
apiClient.interceptors.request.use((config) => {
  const token = useAuthStore.getState().user?.token;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor (handle errors)
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      useAuthStore.getState().logout();
    }
    return Promise.reject(error);
  }
);

export default apiClient;
```

---

### 3.12 Error Handling

#### react-error-boundary 4.0.13

**Rationale:**

- React 19 compatible
- Production-ready
- Simple API
- Error recovery
- TypeScript support

**Features:**

- Error boundaries
- Error recovery
- Fallback UI
- Error logging integration
- TypeScript support

**Production Considerations:**

- Production-ready
- Active maintenance
- React 19 compatible
- Scales to complex error handling

**Carry Forward:** ✅ Yes - Production-ready, scales to enterprise error handling

**Implementation:**

```typescript
import { ErrorBoundary } from 'react-error-boundary';

function ErrorFallback({ error, resetErrorBoundary }) {
  return (
    <div>
      <h2>Something went wrong:</h2>
      <pre>{error.message}</pre>
      <button onClick={resetErrorBoundary}>Try again</button>
    </div>
  );
}

function App() {
  return (
    <ErrorBoundary
      FallbackComponent={ErrorFallback}
      onError={(error, info) => {
        // Log to error tracking service (Sentry, etc.)
        console.error('Error:', error, info);
      }}
    >
      <AppContent />
    </ErrorBoundary>
  );
}
```

---

### 3.13 Testing

#### Vitest 2.0.x

**Rationale:**

- **Fast** - ESM-first, Vite-powered, parallel execution
- **Better TypeScript support** - Native ESM, better type checking
- **Modern tooling** - Built for modern JavaScript/TypeScript
- **Better DX** - Faster feedback, better error messages
- **Vite-native** - Works seamlessly with Vite
- **Smaller bundle** - More lightweight than Jest

**Features:**

- Fast execution
- TypeScript support
- Watch mode
- Coverage reports
- UI mode
- Parallel execution

**Production Considerations:**

- Production-ready
- Used by major companies
- Active maintenance
- Excellent performance
- Scales to large test suites

**Carry Forward:** ✅ Yes - Production-ready, excellent DX

**Implementation:**

```typescript
// vitest.config.ts
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test/setup.ts'],
  },
});
```

---

#### React Testing Library 16.1.x

**Rationale:**

- Best practices for React testing
- Production-ready
- User-centric testing
- TypeScript support

**Carry Forward:** ✅ Yes - Industry standard, scales to complex testing

---

#### Playwright (E2E Testing)

**Rationale:**

- **Modern** - Built for modern web testing
- **Fast** - Faster than Cypress
- **Reliable** - Better flakiness handling
- **Cross-browser** - Chrome, Firefox, Safari, Edge
- **Better DX** - Excellent debugging tools
- **Active development** - Actively maintained

**Features:**

- Cross-browser testing
- Visual testing
- Network interception
- Mobile emulation
- Screenshot/video recording
- Excellent debugging

**Production Considerations:**

- Production-ready
- Used by major companies
- Active maintenance
- Excellent performance
- Scales to complex E2E tests

**Carry Forward:** ✅ Yes - Production-ready, modern alternative to Cypress

**Implementation:**

```typescript
// e2e/auth-flow.spec.ts
import { test, expect } from '@playwright/test';

test('should sign in successfully', async ({ page }) => {
  await page.goto('http://localhost:4200');
  await page.click('text=Sign In');
  await page.fill('[name="email"]', 'user@example.com');
  await page.fill('[name="password"]', 'password123');
  await page.click('button[type="submit"]');
  await expect(page).toHaveURL('http://localhost:4200/payments');
});
```

---

### 3.14 Code Quality

#### ESLint 9.x

**Rationale:**

- Latest version with flat config
- Production-ready
- Large ecosystem
- TypeScript support
- React rules

**Carry Forward:** ✅ Yes - Industry standard, scales to enterprise codebases

---

#### Prettier 3.3.x

**Rationale:**

- Code formatting
- Production-ready
- Works with ESLint
- Consistent code style

**Carry Forward:** ✅ Yes - Industry standard, no alternatives needed

---

#### TypeScript ESLint 8.x

**Rationale:**

- TypeScript-specific linting
- Production-ready
- Type-aware rules
- React support

**Carry Forward:** ✅ Yes - Production-ready, scales to complex TypeScript codebases

---

## 4. Version Compatibility Matrix

| Technology      | Version | React 19 | Vite 6 | Module Federation v2 | Notes |
| --------------- | ------- | -------- | ------ | -------------------- | ----- |
| React           | 19.2.0  | ✅       | ✅     | ✅                   | Core  |
| React Router    | 7.x     | ✅       | ✅     | ✅                   | Web   |
| Zustand         | 4.5.x   | ✅       | ✅     | ✅                   | All   |
| TanStack Query  | 5.x     | ✅       | ✅     | ✅                   | All   |
| Tailwind CSS    | 4.0+    | ✅       | ✅     | ✅                   | Web   |
| React Hook Form | 7.52.x  | ✅       | ✅     | ✅                   | All   |
| Zod             | 3.23.x  | ✅       | ✅     | ✅                   | All   |
| Axios           | 1.7.x   | ✅       | ✅     | ✅                   | All   |
| Vitest          | 2.0.x   | ✅       | ✅     | ✅                   | Web   |
| Playwright      | Latest  | ✅       | ✅     | ✅                   | Web   |

---

## 5. Implementation Phases

### Phase 1: Core Setup (POC-1)

- Install all dependencies
- Configure routing (React Router 7)
- Setup Zustand stores (client state)
- Setup TanStack Query (server state with mock APIs)
- Configure Tailwind CSS v4
- Setup React Hook Form + Zod
- Configure error boundaries
- Setup Vitest for all packages
- Setup Playwright for E2E testing

### Phase 2: Authentication (POC-1)

- Implement auth MFE
- Mock authentication
- Zustand auth store
- Route protection
- Form validation

### Phase 3: Payments (POC-1)

- Implement payments MFE
- Mock payment data
- Universal header
- Navigation
- Role-based access control

### Phase 4: Testing (POC-1)

- Unit tests (Vitest for all packages + RTL)
- Integration tests
- E2E tests (Playwright)

### Phase 5: Production Readiness (MVP-0)

- Add Sentry for error tracking
- Performance monitoring
- Security hardening
- CI/CD pipeline
- Documentation

---

## 6. Future Enhancements (Post-POC-1)

### MVP Phase

- Real authentication backend
- Event bus for inter-MFE communication
- Advanced error handling
- Performance optimizations
- Security enhancements

### Production Phase

- Advanced monitoring (Sentry, Datadog)
- Analytics integration
- A/B testing framework
- Advanced caching strategies
- CDN integration
- Advanced security (MFA, etc.)

---

## 7. Migration Path

**All technologies chosen have clear upgrade paths:**

- React 19 → React 20 (when available)
- Tailwind CSS 4.0 → 4.1+ (already on latest)
- Zustand 4.5 → 5.0 (when available)
- React Router 7 → 8 (when available)
- Vitest 2.0 → 3.0 (when available)
- Playwright → Latest (continuous updates)

**No breaking changes expected in POC-1 → MVP → Production transition.**

---

## 8. Summary

**All technologies are:**

- ✅ Production-ready
- ✅ Scalable to enterprise
- ✅ Actively maintained
- ✅ TypeScript-first
- ✅ Well-documented
- ✅ Battle-tested
- ✅ No throw-away code

**Everything carries forward from POC-1 through Production.**

---

---

## 9. Related Documents

- `docs/mfe-poc1-architecture.md` - POC-1 architecture and implementation plan
- `docs/mfe-poc0-architecture.md` - POC-0 foundation
- `docs/mfe-poc2-architecture.md` - POC-2 backend integration, design system & basic observability
- `docs/mfe-poc3-architecture.md` - POC-3 infrastructure, enhanced observability & basic analytics
- `docs/testing-strategy-poc-phases.md` - Comprehensive testing strategy
- `docs/sast-implementation-plan.md` - SAST implementation plan (Git hooks & CI/CD)

---

**Last Updated:** 2026-01-XX  
**Status:** Authoritative Tech Stack
