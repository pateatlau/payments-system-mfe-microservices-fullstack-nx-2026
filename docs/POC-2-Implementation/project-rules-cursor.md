# MFE POC-2 - Cursor Rules

> **Phase:** POC-2 Only | **Reference:** `docs/POC-2-Implementation/project-rules.md` for detailed rules

---

## 🚨 Critical Rules

1. **NO throw-away code** - Must carry forward to Production
2. **Never use `any` type** - Documented exceptions only
3. **Always use Tailwind v4 syntax** - Never v3 (CRITICAL)
4. **Fix type errors immediately** - Don't work around them
5. **Write tests alongside code** - 70% coverage minimum
6. **POC-2 scope only** - Real backend integration, JWT auth, event bus, design system, Admin MFE
7. **DO NOT automatically perform additional tasks** - Only perform tasks explicitly requested in the prompt. If a related task seems helpful, ask for confirmation with a clear description of what you want to implement before proceeding.

---

## POC-2 Scope

**In Scope:**

- Real backend API integration (REST API with backend services)
- Real JWT authentication (replace mock auth with backend Auth Service)
- Event bus for inter-MFE communication (replace shared Zustand stores)
- Admin MFE (new remote, Port 4203) for ADMIN role functionality
- Design system (Tailwind CSS v4 + shadcn/ui components)
- Enhanced RBAC (ADMIN, CUSTOMER, VENDOR roles)
- API client library (shared Axios client with interceptors)
- Backend services (API Gateway, Auth, Payments, Admin, Profile, Event Hub)
- Database integration (PostgreSQL with Prisma ORM)
- Redis Pub/Sub for inter-service communication
- Enhanced error handling and error boundaries
- Basic observability (error logging, API logging, health checks, basic metrics)

**NOT in Scope:**

- ❌ Real payment processing with PSP integration (all POC phases use stubbed payments)
- ❌ Advanced infrastructure (nginx, advanced observability) - POC-3
- ❌ Separate databases per service (shared database in POC-2) - POC-3
- ❌ WebSocket real-time updates - POC-3

---

## Tech Stack (POC-2)

- **React:** 19.2.0 (match React DOM)
- **Nx:** Latest
- **Rspack:** Latest (for HMR with Module Federation v2)
- **Module Federation:** @module-federation/enhanced 0.21.6 (BIMF)
- **Routing:** React Router 7.x
- **State (Client):** Zustand 4.5.x (within MFEs only)
- **State (Server):** TanStack Query 5.x
- **Inter-MFE Communication:** Event Bus (custom implementation)
- **Forms:** React Hook Form 7.52.x + Zod 3.23.x
- **Styling:** Tailwind CSS 4.0+ - **CRITICAL: Always use v4 syntax, never v3**
- **Design System:** shadcn/ui (latest) - **POC-2: Production-ready component library**
- **HTTP Client:** Axios 1.7.x (shared API client with interceptors)
- **Error Handling:** react-error-boundary 4.0.13
- **Testing:** Jest 30.x (Rspack-compatible), React Testing Library 16.1.x, Playwright
- **Package Manager:** pnpm 9.x
- **TypeScript:** 5.9.x (strict mode)
- **Backend:** Node.js 24.11.x LTS, Express, PostgreSQL, Prisma ORM, Redis, JWT

---

## Code Rules

### TypeScript

- **MUST:** Strict mode, no `any`, explicit return types, `interface` for objects, `type` for unions
- **MUST:** Fix type errors immediately

### React

- **MUST:** Functional components only, hooks for state, explicit props interfaces
- **MUST:** PascalCase components (`SignIn.tsx`), camelCase hooks with `use` prefix

### File Organization

- **MUST:** One component per file, tests alongside (`*.test.tsx`), index files for exports

### Naming

- Components: PascalCase | Hooks: camelCase with `use` | Functions: camelCase | Constants: UPPER_SNAKE_CASE | Types: PascalCase

---

## Authentication & Authorization

### Real JWT Authentication

- **MUST:** Use real JWT authentication with backend Auth Service (no mock auth)
- **MUST:** Store auth state in Zustand store (`libs/shared-auth-store`)
- **MUST:** Use shared API client with JWT token interceptors
- **MUST:** Implement token refresh mechanism
- **MUST:** Implement RBAC helpers (hasRole, hasAnyRole)
- **MUST:** Secure token storage (consider httpOnly cookies for production)

**User Roles:**

- `ADMIN` - Full system access, admin dashboard (Admin MFE)
- `CUSTOMER` - Can make payments, view own history
- `VENDOR` - Can initiate payments, view reports

### Auth Store

- **MUST:** Update Zustand store for real JWT authentication
- **MUST:** Use persist middleware (localStorage)
- **MUST:** Export store and types
- **MUST:** Handle token refresh

**Example:**

```typescript
// libs/shared-auth-store/src/index.ts
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { apiClient } from 'shared-api-client';

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
  accessToken: string | null;
  refreshToken: string | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  refreshAccessToken: () => Promise<void>;
  hasRole: (role: UserRole) => boolean;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      isAuthenticated: false,
      accessToken: null,
      refreshToken: null,
      login: async (email, password) => {
        const response = await apiClient.post('/auth/login', {
          email,
          password,
        });
        set({
          user: response.data.user,
          isAuthenticated: true,
          accessToken: response.data.accessToken,
          refreshToken: response.data.refreshToken,
        });
      },
      logout: () =>
        set({
          user: null,
          isAuthenticated: false,
          accessToken: null,
          refreshToken: null,
        }),
      refreshAccessToken: async () => {
        const { refreshToken } = get();
        const response = await apiClient.post('/auth/refresh', {
          refreshToken,
        });
        set({ accessToken: response.data.accessToken });
      },
      hasRole: role => {
        const { user } = get();
        return user?.role === role;
      },
    }),
    { name: 'auth-storage' }
  )
);
```

---

## Routing (React Router 7)

### Route Configuration

- **MUST:** Use React Router 7.x
- **MUST:** Configure routes in shell app
- **MUST:** Use BrowserRouter
- **MUST:** Implement route protection

**Routes:**

- `/` - Redirect based on auth state
- `/signin` - Sign-in page (unauthenticated)
- `/signup` - Sign-up page (unauthenticated)
- `/payments` - Payments page (authenticated, protected)
- `/admin` - Admin dashboard (authenticated, ADMIN role only)

### Route Protection

- **MUST:** Create `ProtectedRoute` component
- **MUST:** Check auth state from Zustand store
- **MUST:** Verify JWT token validity
- **MUST:** Redirect to `/signin` if not authenticated
- **MUST:** Redirect authenticated users away from auth pages
- **MUST:** Implement role-based route protection

**Example:**

```typescript
// apps/shell/src/components/ProtectedRoute.tsx
import { Navigate } from 'react-router';
import { useAuthStore } from 'shared-auth-store';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: UserRole;
}

export function ProtectedRoute({ children, requiredRole }: ProtectedRouteProps) {
  const { isAuthenticated, user, hasRole } = useAuthStore();

  if (!isAuthenticated) {
    return <Navigate to="/signin" replace />;
  }

  if (requiredRole && !hasRole(requiredRole)) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}
```

---

## State Management

### Zustand (Client State)

- **MUST:** Use Zustand for client-side state (auth, UI, theme)
- **MUST:** Use Zustand only within single MFEs (not shared across MFEs)
- **MUST:** Use event bus for inter-MFE communication (replace shared Zustand stores)
- **MUST:** Use persist middleware for auth state (localStorage)
- **MUST NOT:** Create shared Zustand stores across MFEs

**POC-2 Usage:**

- ✅ Zustand only for state within single MFEs (decoupled)
- ❌ No shared Zustand stores across MFEs
- ✅ Event bus for inter-MFE communication

### TanStack Query (Server State)

- **MUST:** Use TanStack Query for server-side state (API data, caching)
- **MUST:** Use with real backend APIs (no stubbed frontend APIs)
- **MUST:** Configure query options (staleTime, cacheTime)
- **MUST:** Use query hooks for data fetching
- **MUST:** Use mutation hooks for data mutations
- **MUST:** Use shared API client for all API calls

**Example:**

```typescript
// apps/payments-mfe/src/hooks/usePayments.ts
import { useQuery } from '@tanstack/react-query';
import { apiClient } from 'shared-api-client';

export function usePayments() {
  return useQuery({
    queryKey: ['payments'],
    queryFn: () => apiClient.get('/payments').then(res => res.data),
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}
```

### Event Bus (Inter-MFE Communication)

- **MUST:** Use event bus for decoupled inter-MFE communication
- **MUST:** Replace shared Zustand stores with event bus pattern
- **MUST:** Implement event bus library (`libs/shared-event-bus`)
- **MUST:** Define event types and contracts
- **MUST:** Use event bus for auth state changes, user updates, etc.

**Example:**

```typescript
// libs/shared-event-bus/src/index.ts
type EventType =
  | 'auth:login'
  | 'auth:logout'
  | 'user:updated'
  | 'payment:created';

interface Event {
  type: EventType;
  payload: unknown;
}

class EventBus {
  private subscribers = new Map<EventType, Set<(event: Event) => void>>();

  subscribe(type: EventType, callback: (event: Event) => void) {
    if (!this.subscribers.has(type)) {
      this.subscribers.set(type, new Set());
    }
    this.subscribers.get(type)!.add(callback);
    return () => this.unsubscribe(type, callback);
  }

  unsubscribe(type: EventType, callback: (event: Event) => void) {
    this.subscribers.get(type)?.delete(callback);
  }

  publish(type: EventType, payload: unknown) {
    const event = { type, payload };
    this.subscribers.get(type)?.forEach(callback => callback(event));
  }
}

export const eventBus = new EventBus();
```

---

## Payments System

### Backend API Integration

**CRITICAL: Payment operations are stubbed at backend level (no actual PSP integration):**

- **MUST:** Use real backend Payments Service API (no frontend stubbed APIs)
- **MUST:** Document that operations are stubbed at backend level
- **MUST:** Use TanStack Query hooks with real backend API calls
- **MUST:** Use shared API client for all payment operations
- **MUST NOT:** Integrate with real Payment Service Provider

**Backend Operations:**

- `GET /api/payments` - Returns payment list (stubbed)
- `POST /api/payments` - Creates payment (stubbed, no actual PSP)
- `PUT /api/payments/:id` - Updates payment (stubbed, no actual PSP)
- `DELETE /api/payments/:id` - Deletes payment (stubbed)

### Role-Based Access Control (RBAC)

**VENDOR Role:**

- ✅ Can initiate payments (stubbed backend API)
- ✅ Can view reports
- ✅ Can view payment history
- ❌ Cannot make payments (only initiate)

**CUSTOMER Role:**

- ✅ Can make payments (stubbed backend API)
- ✅ Can view own payment history
- ❌ Cannot initiate payments
- ❌ Cannot view reports

**ADMIN Role:**

- ✅ Full system access
- ✅ Admin dashboard (Admin MFE)
- ✅ User management
- ✅ System configuration

---

## Forms & Validation

### React Hook Form + Zod

- **MUST:** Use React Hook Form for all forms
- **MUST:** Use Zod for validation schemas
- **MUST:** Use type inference from Zod schemas
- **MUST:** Validate all inputs

**Example:**

```typescript
// apps/auth-mfe/src/components/SignIn.tsx
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

const signInSchema = z.object({
  email: z.string().email('Invalid email'),
  password: z.string().min(12, 'Password must be at least 12 characters'),
});

type SignInForm = z.infer<typeof signInSchema>;

export function SignIn() {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<SignInForm>({
    resolver: zodResolver(signInSchema),
  });

  const onSubmit = (data: SignInForm) => {
    // Handle form submission with backend API
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      {/* Form fields */}
    </form>
  );
}
```

### Password Requirements

- **MUST:** Minimum 12 characters (banking-grade)
- **MUST:** Complexity requirements (uppercase, lowercase, numbers, symbols)
- **MUST:** Password strength validation
- **MUST:** Confirm password validation
- **MUST NOT:** Log passwords

---

## Styling (Tailwind CSS v4)

### Tailwind CSS v4 Rules

**CRITICAL: Always use Tailwind v4 syntax, never v3:**

- **MUST:** Use Tailwind CSS 4.0+
- **MUST:** Use design system components (shadcn/ui) for common UI patterns
- **MUST:** Refer to Tailwind v4 documentation
- **MUST NOT:** Use v3 syntax
- **MUST:** Follow design system patterns and component usage

**POC-2 Approach:**

- Design system using Tailwind + shadcn/ui
- Reusable component library
- Consistent design tokens
- Replace inline components with design system components

**Example:**

```tsx
// ✅ GOOD (Tailwind v4 + design system)
import { Button } from 'shared-design-system';

<Button variant="default" size="lg">
  Sign In
</Button>

// ✅ GOOD (Custom Tailwind v4 classes)
<div className="bg-blue-500 px-4 py-2 rounded-lg text-white font-semibold hover:bg-blue-600">
  Custom Component
</div>

// ❌ BAD (Don't use v3 syntax or inline components when design system exists)
<button className="bg-blue-500 px-4 py-2 rounded-lg text-white font-semibold hover:bg-blue-600">
  Sign In
</button>
```

---

## Design System (shadcn/ui)

### shadcn/ui Integration

- **MUST:** Use shadcn/ui components for common UI patterns
- **MUST:** Create design system library (`libs/shared-design-system`)
- **MUST:** Use Tailwind CSS v4 for styling
- **MUST:** Follow shadcn/ui patterns and conventions
- **MUST:** Document component usage and customization
- **MUST:** Replace inline components with design system components where appropriate

**Design System Components:**

- Button, Input, Form, Card, Dialog, Dropdown, Select, etc.
- All components accessible (a11y)
- Customizable via Tailwind classes
- Type-safe component props

---

## Module Federation v2

### Remote Configuration

**Auth MFE (Port 4201):**

- **MUST:** Expose `./SignIn` component
- **MUST:** Expose `./SignUp` component
- **MUST:** Configure shared dependencies
- **MUST:** Updated for real JWT authentication

**Payments MFE (Port 4202):**

- **MUST:** Expose `./PaymentsPage` component
- **MUST:** Configure shared dependencies
- **MUST:** Updated for backend API integration

**Admin MFE (Port 4203) - NEW:**

- **MUST:** Expose `./AdminDashboard` component
- **MUST:** Configure shared dependencies
- **MUST:** ADMIN role only access

**Shell (Port 4200):**

- **MUST:** Configure as host
- **MUST:** Load `authMfe` remote: `http://localhost:4201/assets/remoteEntry.js`
- **MUST:** Load `paymentsMfe` remote: `http://localhost:4202/assets/remoteEntry.js`
- **MUST:** Load `adminMfe` remote: `http://localhost:4203/assets/remoteEntry.js` (NEW)
- **MUST:** Configure shared dependencies
- **MUST:** Initialize event bus

### Shared Dependencies

- **MUST:** React 19.2.0 (singleton)
- **MUST:** React DOM 19.2.0 (singleton)
- **MUST:** Zustand 4.5.x (shared)
- **MUST:** TanStack Query 5.x (shared)
- **MUST:** React Router 7.x (shared)
- **MUST:** Event bus (shared)
- **MUST:** API client (shared)
- **MUST:** Design system (shared)

---

## API Client Library

### Shared API Client

- **MUST:** Create shared API client library (`libs/shared-api-client`)
- **MUST:** Use Axios with interceptors for JWT tokens
- **MUST:** Implement error handling and retry logic
- **MUST:** Configure base URL from environment variables
- **MUST:** Handle token refresh automatically

**Example:**

```typescript
// libs/shared-api-client/src/index.ts
import axios from 'axios';
import { useAuthStore } from 'shared-auth-store';

export const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api',
});

// Request interceptor - add JWT token
apiClient.interceptors.request.use(config => {
  const { accessToken } = useAuthStore.getState();
  if (accessToken) {
    config.headers.Authorization = `Bearer ${accessToken}`;
  }
  return config;
});

// Response interceptor - handle token refresh
apiClient.interceptors.response.use(
  response => response,
  async error => {
    if (error.response?.status === 401) {
      const { refreshAccessToken } = useAuthStore.getState();
      await refreshAccessToken();
      return apiClient.request(error.config);
    }
    return Promise.reject(error);
  }
);
```

---

## Project Structure

```
apps/
├── shell/              # Host (Port 4200) - Routing, header, event bus init
├── auth-mfe/           # Remote (Port 4201) - Updated with real JWT auth
├── payments-mfe/        # Remote (Port 4202) - Updated with backend API
└── admin-mfe/          # Remote (Port 4203) - NEW: Admin dashboard
libs/
├── shared-utils/       # Existing
├── shared-ui/          # Existing
├── shared-types/       # Existing (extended)
├── shared-auth-store/  # Updated: Real JWT auth (no mock)
├── shared-header-ui/   # Existing
├── shared-api-client/  # NEW: API client with interceptors
├── shared-event-bus/   # NEW: Event bus for inter-MFE communication
└── shared-design-system/ # NEW: Design system & shadcn/ui components
```

---

## Nx Commands

- `nx serve shell` / `nx serve auth-mfe` / `nx serve payments-mfe` / `nx serve admin-mfe`
- `nx run-many --target=serve --projects=shell,auth-mfe,payments-mfe,admin-mfe --parallel`
- `nx build <project>` / `nx test <project>` / `nx lint <project>`
- `nx generate @nx/react:application <name> --bundler=rspack`
- `nx generate @nx/react:library <name> --bundler=rspack`
- `nx generate @nx/js:library <name> --bundler=tsc`

---

## Git & Documentation Rules

### Git Commits

- **MUST:** Ask for user confirmation before making any git commits
- **MUST:** Show commit message and changed files before committing
- **MUST NOT:** Commit automatically without explicit user approval
- **MUST:** Perform a git commit after completing each major/top-level phase (e.g., Phase 1, Phase 2, etc.)
- **MUST:** Commit only after verifying everything works and updating status in both `task-list.md` and `implementation-plan.md`
- **MUST:** Commit before asking user whether to proceed to the next phase

### Documentation Files

- **MUST:** Create documentation files in `docs/POC-2-Implementation/` folder
- **MUST:** Update both `task-list.md` and `implementation-plan.md` after each task
- **MUST:** Ask for confirmation if documentation location is unclear

---

## Task Management & Workflow

### Task Progression

- **MUST:** Follow `docs/POC-2-Implementation/implementation-plan.md` for detailed task steps
- **MUST:** Update `docs/POC-2-Implementation/task-list.md` after completing each task/sub-task
- **MUST:** Update `docs/POC-2-Implementation/implementation-plan.md` after completing each task/sub-task (mark verification checkboxes and update status)
- **MUST:** Ask for user confirmation before proceeding to the next task after completing each task or sub-task
- **MUST:** Show completed task summary and next task details when asking for confirmation
- **MUST NOT:** Automatically proceed to next task without explicit user approval

### Package.json Scripts

- **MUST:** Add relevant commands to root `package.json` scripts section when creating new features, apps, libraries, or testing configurations
- **MUST:** Follow the existing naming convention: `feature:project` (e.g., `dev:shell`, `dev:auth-mfe`, `test:payments-mfe`)
- **MUST:** Include both individual project commands and aggregate commands (e.g., `dev` for all, `dev:shell` for one)
- **MUST:** Add affected commands when applicable (e.g., `build:affected`, `test:affected`)

### Task Completion Checklist

- ✅ Task completed according to implementation plan
- ✅ Verification checklist items completed
- ✅ Acceptance criteria met
- ✅ Task list updated with completion status (`task-list.md`)
- ✅ Implementation plan updated with completion status (`implementation-plan.md`)
- ✅ User confirmation obtained before next task

---

## Testing Requirements

### Unit Testing

- **MUST:** Write tests alongside code (not after)
- **MUST:** 70%+ test coverage target
- **MUST:** Test all components, stores, hooks, API clients, and event bus functions
- **MUST:** Use Jest + React Testing Library

### Integration Testing

- **MUST:** Test authentication flow with real backend
- **MUST:** Test payments flow with backend API
- **MUST:** Test route protection
- **MUST:** Test event bus communication
- **MUST:** Test role-based access
- **MUST:** Test API client interceptors
- **MUST:** Test token refresh

### E2E Testing

- **MUST:** Use Playwright for E2E tests
- **MUST:** Test critical user journeys
- **MUST:** Test sign-in/sign-up flows with backend
- **MUST:** Test payments flow with backend
- **MUST:** Test logout flow
- **MUST:** Test role-based access
- **MUST:** Test Admin MFE functionality
- **MUST:** Test event bus communication

---

## Before Committing

✅ TypeScript compiles | ✅ ESLint passes | ✅ Tests pass | ✅ Build works | ✅ No `any` types | ✅ Tests written | ✅ Module Federation works | ✅ Tailwind v4 syntax | ✅ Real JWT auth works | ✅ Backend API integration works | ✅ Event bus works | ✅ Design system components used

---

## Success Criteria

✅ Auth MFE (4201), Payments MFE (4202), Admin MFE (4203) run | ✅ React Router 7 works | ✅ Real JWT authentication works | ✅ Event bus communication works | ✅ TanStack Query works with backend APIs | ✅ Tailwind CSS v4 works | ✅ Design system components work | ✅ Route protection works | ✅ RBAC works (ADMIN, CUSTOMER, VENDOR) | ✅ Universal header displays | ✅ Tests pass (70% coverage) | ✅ All remotes load dynamically | ✅ Backend services integrated | ✅ API client works correctly

---

## Common Pitfalls to Avoid

- ❌ Using `any` type without justification
- ❌ Creating throw-away code
- ❌ Ignoring TypeScript errors
- ❌ Using Tailwind v3 syntax (must use v4)
- ❌ Skipping tests
- ❌ Breaking existing patterns
- ❌ Not following project structure
- ❌ Hardcoding values (use environment variables)
- ❌ Creating circular dependencies
- ❌ Mixing concerns (keep components, hooks, utilities separate)
- ❌ Using mock authentication (must use real JWT auth)
- ❌ Using frontend stubbed APIs (must use backend APIs)
- ❌ Using shared Zustand stores for inter-MFE communication (must use event bus)
- ❌ Not using design system components (must use shadcn/ui where appropriate)
- ❌ Not using shared API client (must use shared API client for all backend calls)
- ❌ Integrating with real PSP (must use stubbed backend operations)

---

## Quick Reference

### Creating API Client

```typescript
// libs/shared-api-client/src/index.ts
import axios from 'axios';
import { useAuthStore } from 'shared-auth-store';

export const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api',
});

// Add JWT token interceptor
apiClient.interceptors.request.use(config => {
  const { accessToken } = useAuthStore.getState();
  if (accessToken) {
    config.headers.Authorization = `Bearer ${accessToken}`;
  }
  return config;
});
```

### Creating Event Bus

```typescript
// libs/shared-event-bus/src/index.ts
type EventType = 'auth:login' | 'auth:logout' | 'user:updated';

interface Event {
  type: EventType;
  payload: unknown;
}

class EventBus {
  private subscribers = new Map<EventType, Set<(event: Event) => void>>();

  subscribe(type: EventType, callback: (event: Event) => void) {
    if (!this.subscribers.has(type)) {
      this.subscribers.set(type, new Set());
    }
    this.subscribers.get(type)!.add(callback);
    return () => this.unsubscribe(type, callback);
  }

  publish(type: EventType, payload: unknown) {
    const event = { type, payload };
    this.subscribers.get(type)?.forEach(callback => callback(event));
  }
}

export const eventBus = new EventBus();
```

### Using TanStack Query with Backend API

```typescript
// Hook with TanStack Query and backend API
import { useQuery } from '@tanstack/react-query';
import { apiClient } from 'shared-api-client';

export function usePayments() {
  return useQuery({
    queryKey: ['payments'],
    queryFn: () => apiClient.get('/payments').then(res => res.data),
    staleTime: 1000 * 60 * 5,
  });
}
```

### Using Design System Components

```typescript
// Using shadcn/ui components
import { Button, Input, Card } from 'shared-design-system';

export function MyComponent() {
  return (
    <Card>
      <Input placeholder="Email" />
      <Button variant="default">Submit</Button>
    </Card>
  );
}
```

---

## References

- Architecture: `docs/References/mfe-poc2-architecture.md`
- Backend Architecture: `docs/References/backend-poc2-architecture.md`
- Full-Stack Architecture: `docs/References/fullstack-architecture.md`
- Detailed Rules: `docs/POC-2-Implementation/project-rules.md`
- Implementation Plan: `docs/POC-2-Implementation/implementation-plan.md` (when created)
- Task List: `docs/POC-2-Implementation/task-list.md` (when created)
- ADRs: `docs/adr/poc-2/` and `docs/adr/backend/poc-2/`

---

**For detailed rules, examples, and guidance:** See `docs/POC-2-Implementation/project-rules.md`
