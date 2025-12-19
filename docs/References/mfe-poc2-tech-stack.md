# MFE POC-2 Tech Stack - Production-Ready & Scalable

**Status:** Authoritative  
**Version:** 1.0  
**Date:** 2026-01-XX

---

## 1. Philosophy & Principles

### 1.1 Core Principles

**No Throw-Away Code:**

- Every technology choice must be production-ready
- All code written in POC-2 must carry forward to MVP and Production
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

| Category                      | Technology  | Version | Platform | Production-Ready                                | Notes |
| ----------------------------- | ----------- | ------- | -------- | ----------------------------------------------- | ----- |
| **Core Framework**            |
| React                         | 19.2.0      | Web     | ✅       | Latest stable, future-proof                     |
| React DOM                     | 19.2.0      | Web     | ✅       | Must match React version                        |
| **Monorepo**                  |
| Nx                            | Latest      | All     | ✅       | Scalable, build caching                         |
| **Bundling & Build**          |
| Rspack                        | Latest      | Web     | ✅       | Fast builds, HMR with MF v2                     |
| TypeScript                    | 5.9.x       | All     | ✅       | React 19 support                                |
| **Module Federation**         |
| @module-federation/enhanced   | 0.21.6      | Web     | ✅       | BIMF (Module Federation v2)                     |
| **Routing**                   |
| React Router                  | 7.x         | Web     | ✅       | Latest, production-ready                        |
| **State Management (Client)** |
| Zustand                       | 4.5.x       | Web     | ✅       | Client state (auth, UI, theme) - MFE-local only |
| **State Management (Server)** |
| TanStack Query                | 5.x         | Web     | ✅       | Server state (API data, caching)                |
| **Inter-MFE Communication**   |
| Event Bus                     | Custom      | Web     | ✅       | Decoupled MFE communication                     |
| **Styling**                   |
| Tailwind CSS                  | 4.0+        | Web     | ✅       | Latest, 5x faster builds, modern CSS            |
| **Design System**             |
| shadcn/ui                     | Latest      | Web     | ✅       | POC-2 - Production-ready component library      |
| **Form Handling**             |
| React Hook Form               | 7.52.x      | Web     | ✅       | Industry standard, performant                   |
| **Validation**                |
| Zod                           | 3.23.x      | Web     | ✅       | TypeScript-first, runtime validation            |
| **Storage**                   |
| localStorage                  | Native      | Web     | ✅       | Browser API                                     |
| **HTTP Client**               |
| Axios                         | 1.7.x       | Web     | ✅       | Production-ready, interceptors                  |
| **Error Handling**            |
| react-error-boundary          | 4.0.13      | Web     | ✅       | React 19 compatible                             |
| **Testing**                   |
| Jest                          | 30.x        | Web     | ✅       | Mature ecosystem, Rspack-compatible             |
| React Testing Library         | 16.1.x      | Web     | ✅       | Works with Jest                                 |
| **E2E Testing**               |
| Playwright                    | Latest      | Web     | ✅       | Modern, fast, reliable                          |
| **Code Quality**              |
| ESLint                        | 9.x         | All     | ✅       | Latest, flat config                             |
| Prettier                      | 3.3.x       | All     | ✅       | Code formatting                                 |
| TypeScript ESLint             | 8.x         | All     | ✅       | TS-specific linting                             |
| **Performance**               |
| React DevTools Profiler       | Native      | Web     | ✅       | Built-in profiling                              |
| **Monitoring (Future)**       |
| Sentry                        | Latest      | Web     | 🔄       | Error tracking (MVP phase)                      |
| **CI/CD**                     |
| GitHub Actions                | Native      | All     | ✅       | Free, scalable                                  |
| **Package Management**        |
| pnpm                          | 9.x         | All     | ✅       | Recommended for Nx                              |
| **Node.js**                   |
| Node.js                       | 24.11.x LTS | All     | ✅       | Latest LTS, SWC support                         |

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

#### Rspack

**Rationale:**

- Fast builds (Rust-based, 2-5x faster than Vite)
- HMR with Module Federation v2 (primary reason for migration)
- Webpack-compatible API (easier migration path)
- TypeScript support via SWC
- Production-ready and actively maintained
- Excellent performance for large applications

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
  {
    path: '/admin',
    element: (
      <ProtectedRoute requireRole="ADMIN">
        <AdminDashboard />
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

- **Zustand** - Client-side state (auth, UI, theme) - **MFE-local only**
- **TanStack Query** - Server-side state (API data, caching)
- **Event Bus** - Inter-MFE communication (decoupled)

**POC-2 Implementation:**

- ✅ Event bus for inter-MFE communication (decouples MFEs)
- ✅ Zustand only for state within single MFEs (no shared stores)
- ✅ TanStack Query for server state (with real backend)

**Migration from POC-1:**

- **POC-1:** Shared Zustand stores (acceptable for POC)
- **POC-2:** Event bus (decoupled architecture)

---

#### Zustand 4.5.x (Client State - MFE-Local Only)

**Rationale:**

- Lightweight and performant
- Excellent TypeScript support
- No provider wrapping needed
- Scales well to complex state
- Works well for MFE-local state

**POC-2 Usage:**

- ✅ Zustand for state within single MFEs (decoupled)
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

**Implementation (MFE-Local):**

```typescript
// apps/auth-mfe/src/stores/useAuthStore.ts
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { EventBus } from '@web-mfe/shared-event-bus';

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  hasRole: (role: UserRole) => boolean;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      isAuthenticated: false,
      isLoading: false,
      login: async (email, password) => {
        set({ isLoading: true });
        // Real API call via API client
        const response = await apiClient.post('/auth/login', {
          email,
          password,
        });
        const { user, accessToken, refreshToken } = response.data.data;
        set({ user, isAuthenticated: true, isLoading: false });
        // Publish event to event bus (not shared store)
        EventBus.emit('auth:login', { user });
      },
      logout: () => {
        set({ user: null, isAuthenticated: false });
        // Publish event to event bus
        EventBus.emit('auth:logout', {});
      },
      hasRole: (role: UserRole) => {
        const { user } = get();
        return user?.role === role;
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

#### TanStack Query 5.x (Server State - Real Backend)

**Rationale:**

- **Server state management** - Designed for API data, caching, synchronization
- **Real backend integration** - Works with REST API in POC-2
- **No throw-away code** - Same patterns from POC-1 carry forward
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

**Implementation (POC-2 with Real Backend):**

```typescript
// apps/payments-mfe/src/hooks/usePayments.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '@web-mfe/shared-api-client';

export const usePayments = () => {
  return useQuery({
    queryKey: ['payments'],
    queryFn: async () => {
      // Real API call via API client
      const response = await apiClient.get('/payments');
      return response.data.data;
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
};

export const useCreatePayment = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (dto: CreatePaymentDto) => {
      // Real API call via API client
      const response = await apiClient.post('/payments', dto);
      return response.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payments'] });
      // Publish event to event bus
      EventBus.emit('payments:created', {});
    },
  });
};
```

**Migration from POC-1:**

- **POC-1:** Mock APIs with TanStack Query
- **POC-2:** Real API calls with TanStack Query (same patterns, different implementation)

**Benefits:**

- ✅ No throw-away code - Same patterns carry forward
- ✅ Easy migration - Swap mocks for real API calls
- ✅ Better DX - DevTools, caching, background updates
- ✅ Production-ready - Works seamlessly with backend

---

#### Event Bus (Inter-MFE Communication)

**Reference:** See `docs/adr/poc-2/0001-event-bus-for-inter-mfe-comm.md` for decision rationale, alternatives considered, and trade-offs.

**Rationale:**

- **Decouples MFEs** - MFEs communicate via events, not shared state
- **Loose coupling** - MFEs don't need to know about each other
- **Scalability** - Easy to add/remove MFEs without breaking others
- **Production-ready pattern** - Industry standard for microfrontend communication

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
    this.listeners.get(event)?.forEach(callback => callback(data));
  }
}

export const EventBus = new EventBus();
```

**Usage Example (POC-2):**

```typescript
// Auth MFE publishes login event
import { EventBus } from '@web-mfe/shared-event-bus';

function handleLogin(user: User) {
  useAuthStore.getState().setUser(user);
  EventBus.emit('auth:login', { user });
}

// Shell subscribes to login event
import { EventBus } from '@web-mfe/shared-event-bus';

useEffect(() => {
  const handleAuthLogin = (data: { user: User }) => {
    // Redirect to payments page
    navigate('/payments');
  };

  EventBus.on('auth:login', handleAuthLogin);
  return () => EventBus.off('auth:login', handleAuthLogin);
}, []);
```

**Benefits:**

- ✅ Decouples MFEs (no shared state dependencies)
- ✅ Loose coupling (MFEs don't need to know about each other)
- ✅ Scalable (easy to add/remove MFEs)
- ✅ Testable (can mock event bus)
- ✅ Production-ready pattern

**Carry Forward:** ✅ Yes - Event bus is production-ready pattern for microfrontend communication

---

### 3.7 Styling

#### Design System: Tailwind CSS v4 + shadcn/ui

**POC-2 Approach: Production-Ready Design System**

- ✅ Design system using Tailwind + shadcn/ui
- ✅ Reusable component library
- ✅ Consistent design tokens
- ✅ Shared component patterns

**Migration from POC-1:**

- **POC-1:** Inline Tailwind classes
- **POC-2:** Design system components (shadcn/ui)

---

#### Tailwind CSS 4.0+

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

#### shadcn/ui (Design System Components)

**Rationale:**

- **Production-ready** - shadcn/ui is battle-tested and widely used
- **Copy-paste approach** - Components live in your codebase (not a dependency)
- **Type-safe** - Full TypeScript support
- **Accessible** - ARIA-compliant components by default
- **Customizable** - Easy to theme and extend
- **Tailwind CSS v4 compatible** - Works with latest Tailwind
- **Consistent design** - Shared design tokens across all MFEs

**Features:**

- Reusable components (Button, Input, Card, Table, Dialog, etc.)
- Design tokens (colors, spacing, typography)
- Consistent styling across all MFEs
- Easy to maintain and update
- Production-ready design system

**Components Included:**

- **Form Components:** Button, Input, Textarea, Select, Checkbox, Radio, Switch, Label
- **Layout Components:** Card, Container, Separator, Sheet, Dialog, Drawer
- **Data Display:** Table, Badge, Avatar, Alert, Toast
- **Navigation:** Breadcrumb, Tabs, Pagination
- **Feedback:** Loading, Skeleton, Progress, Alert
- **Overlay:** Dialog, Sheet, Popover, Tooltip, Dropdown Menu

**Production Considerations:**

- Production-ready
- Used by major companies
- Active maintenance
- Excellent TypeScript support
- Accessible by default
- Scales to enterprise applications

**Carry Forward:** ✅ Yes - Production-ready design system, scales to enterprise

**Implementation:**

```typescript
// libs/shared-design-system/src/components/button.tsx
import { ButtonHTMLAttributes, forwardRef } from 'react';
import { cn } from '../utils/cn';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link';
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
            'bg-primary text-primary-foreground hover:bg-primary/90': variant === 'default',
            'bg-destructive text-destructive-foreground hover:bg-destructive/90': variant === 'destructive',
            'border border-input bg-background hover:bg-accent': variant === 'outline',
            'bg-secondary text-secondary-foreground hover:bg-secondary/80': variant === 'secondary',
            'hover:bg-accent hover:text-accent-foreground': variant === 'ghost',
            'text-primary underline-offset-4 hover:underline': variant === 'link',
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
    <Card className="p-6">
      <Input type="email" placeholder="Email" />
      <Input type="password" placeholder="Password" />
      <Button variant="default" size="default">
        Sign In
      </Button>
    </Card>
  );
}
```

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
import { Button, Input } from '@web-mfe/shared-design-system';

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

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <Input {...register('email')} placeholder="Email" />
      {errors.email && <span>{errors.email.message}</span>}
      <Input {...register('password')} type="password" placeholder="Password" />
      {errors.password && <span>{errors.password.message}</span>}
      <Button type="submit">Sign In</Button>
    </form>
  );
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
  role: z.enum(['ADMIN', 'CUSTOMER', 'VENDOR']),
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
- Secure (HTTPS required for sensitive data)
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

**Implementation (API Client Library):**

```typescript
// libs/shared-api-client/src/index.ts
import axios from 'axios';
import { useAuthStore } from '@web-mfe/shared-auth-store';

// Create instance
const apiClient = axios.create({
  baseURL: process.env['NX_API_BASE_URL'] || 'http://localhost:3000/api',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor (add auth token)
apiClient.interceptors.request.use(config => {
  const token = useAuthStore.getState().user?.accessToken;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor (handle errors and token refresh)
apiClient.interceptors.response.use(
  response => response,
  async error => {
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
import { Button, Alert } from '@web-mfe/shared-design-system';

function ErrorFallback({ error, resetErrorBoundary }) {
  return (
    <Alert variant="destructive">
      <h2>Something went wrong:</h2>
      <pre>{error.message}</pre>
      <Button onClick={resetErrorBoundary}>Try again</Button>
    </Alert>
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

- **Mature ecosystem** - Battle-tested, widely used
- **Rspack-compatible** - Works well with Rspack bundler
- **Excellent TypeScript support** - Via ts-jest
- **Large community** - Extensive documentation and examples
- **Production-ready** - Used by major companies
- **Comprehensive tooling** - Rich ecosystem of plugins and utilities

**Features:**

- Mature test runner
- TypeScript support via ts-jest
- Watch mode
- Coverage reports
- Parallel execution
- Snapshot testing
- Mocking utilities

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

test('should access admin dashboard as ADMIN', async ({ page }) => {
  // Login as admin
  await page.goto('http://localhost:4200/signin');
  await page.fill('[name="email"]', 'admin@example.com');
  await page.fill('[name="password"]', 'password123');
  await page.click('button[type="submit"]');

  // Navigate to admin
  await page.goto('http://localhost:4200/admin');
  await expect(page).toHaveURL('http://localhost:4200/admin');
  await expect(page.locator('text=Admin Dashboard')).toBeVisible();
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
| Event Bus       | Custom  | ✅       | ✅     | ✅                   | All   |
| Tailwind CSS    | 4.0+    | ✅       | ✅     | ✅                   | Web   |
| shadcn/ui       | Latest  | ✅       | ✅     | ✅                   | Web   |
| React Hook Form | 7.52.x  | ✅       | ✅     | ✅                   | All   |
| Zod             | 3.23.x  | ✅       | ✅     | ✅                   | All   |
| Axios           | 1.7.x   | ✅       | ✅     | ✅                   | All   |
| Vitest          | 2.0.x   | ✅       | ✅     | ✅                   | Web   |
| Playwright      | Latest  | ✅       | ✅     | ✅                   | Web   |

---

## 5. Implementation Phases

### Phase 1: Backend Integration & Design System (POC-2)

- Install all dependencies
- Create API client library
- Create design system library
- Setup shadcn/ui components
- Configure Tailwind CSS v4 with design tokens
- Replace mock APIs with real API calls
- Update auth store with real authentication
- Setup JWT token management

### Phase 2: Event Bus Implementation (POC-2)

- Create event bus library
- Migrate from shared Zustand stores to event bus
- Update all MFEs to use event bus
- Remove shared store dependencies

### Phase 3: Admin MFE (POC-2)

- Create admin MFE application
- Implement admin features using design system components
- Configure Module Federation v2
- Test admin functionality

### Phase 4: Shell Integration & Design System Migration (POC-2)

- Integrate event bus in shell
- Migrate all MFEs to design system components
- Update route protection for admin routes
- Ensure consistent design across platform

### Phase 5: Testing & Refinement (POC-2)

- Unit tests (Vitest for all packages + RTL + design system components)
- Integration tests
- E2E tests (Playwright)
- Documentation (including design system)

---

## 6. Future Enhancements (Post-POC-2)

### MVP Phase

- Advanced error handling
- Performance optimizations
- Security enhancements
- Advanced monitoring (Sentry)
- CI/CD pipeline improvements

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
- shadcn/ui → Latest (continuous updates)

**No breaking changes expected in POC-2 → MVP → Production transition.**

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

**Everything carries forward from POC-2 through Production.**

**Key POC-2 Additions:**

- ✅ **Design System** - shadcn/ui components (production-ready)
- ✅ **Event Bus** - Decoupled inter-MFE communication
- ✅ **API Client** - Centralized HTTP client with authentication
- ✅ **Real Backend** - JWT authentication, real APIs
- ✅ **Admin MFE** - Admin functionality with role-based access

---

---

## 9. Related Documents

- `docs/mfe-poc2-architecture.md` - POC-2 architecture and implementation plan
- `docs/mfe-poc0-architecture.md` - POC-0 foundation
- `docs/mfe-poc1-architecture.md` - POC-1 authentication & payments
- `docs/mfe-poc3-architecture.md` - POC-3 infrastructure, enhanced observability & basic analytics
- `docs/backend-architecture.md` - Backend architecture
- `docs/backend-event-hub-implementation-plan.md` - Event hub implementation plan
- `docs/testing-strategy-poc-phases.md` - Comprehensive testing strategy
- `docs/sast-implementation-plan.md` - SAST implementation plan (Git hooks & CI/CD)

---

**Last Updated:** 2026-01-XX  
**Status:** Authoritative Tech Stack
