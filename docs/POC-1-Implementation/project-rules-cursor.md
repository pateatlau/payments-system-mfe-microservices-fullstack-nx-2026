# MFE POC-1 - Cursor Rules

> **Phase:** POC-1 Only | **Reference:** `docs/POC-1-Implementation/project-rules.md` for detailed rules

---

## 🚨 Critical Rules

1. **NO throw-away code** - Must carry forward to Production
2. **Never use `any` type** - Documented exceptions only
3. **Always use Tailwind v4 syntax** - Never v3 (CRITICAL)
4. **Fix type errors immediately** - Don't work around them
5. **Write tests alongside code** - 70% coverage minimum
6. **POC-1 scope only** - Mock auth, stubbed payments (no actual PSP), no backend

---

## POC-1 Scope

**In Scope:**

- Authentication system (Auth MFE, Port 4201) with mock authentication
- Payments system (Payments MFE, Port 4202) with stubbed operations (no actual PSP)
- Routing (React Router 7)
- State management (Zustand + TanStack Query)
- Styling (Tailwind CSS v4)
- Role-based access control (RBAC) - VENDOR and CUSTOMER roles
- Universal header component
- Form validation (React Hook Form + Zod)
- Route protection

**NOT in Scope:**

- ❌ Real authentication backend (POC-2)
- ❌ Event bus for inter-MFE communication (POC-2)
- ❌ Real payment processing with PSP integration (MVP/Production - all POC phases use stubbed payments)
- ❌ Design system (POC-2)
- ❌ Backend integration (POC-2)

---

## Tech Stack (POC-1)

- **React:** 19.2.0 (match React DOM)
- **Nx:** Latest
- **Vite:** 6.x
- **Module Federation:** @module-federation/enhanced 0.21.6 (BIMF)
- **Routing:** React Router 7.x
- **State (Client):** Zustand 4.5.x
- **State (Server):** TanStack Query 5.x
- **Forms:** React Hook Form 7.52.x + Zod 3.23.x
- **Styling:** Tailwind CSS 4.0+ - **CRITICAL: Always use v4 syntax, never v3**
- **HTTP Client:** Axios 1.7.x (for future backend integration)
- **Error Handling:** react-error-boundary 4.0.13
- **Testing:** Vitest 2.0.x, React Testing Library 16.1.x, Playwright
- **Package Manager:** pnpm 9.x
- **TypeScript:** 5.9.x (strict mode)

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

### Mock Authentication

- **MUST:** Use mock authentication (no real backend in POC-1)
- **MUST:** Store auth state in Zustand store (`libs/shared-auth-store`)
- **MUST:** Use localStorage for persistence
- **MUST:** Implement RBAC helpers (hasRole, hasAnyRole)

**User Roles:**

- `ADMIN` - Full system access (functionality in POC-2)
- `CUSTOMER` - Can make payments, view own history
- `VENDOR` - Can initiate payments, view reports

### Auth Store

- **MUST:** Create Zustand store in `libs/shared-auth-store`
- **MUST:** Use persist middleware (localStorage)
- **MUST:** Export store and types

**Example:**

```typescript
// libs/shared-auth-store/src/index.ts
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

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
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  hasRole: (role: UserRole) => boolean;
}

export const useAuthStore = create<AuthState>()(
  persist(
    set => ({
      user: null,
      isAuthenticated: false,
      login: async (email, password) => {
        // Mock authentication
        const user = await mockLogin(email, password);
        set({ user, isAuthenticated: true });
      },
      logout: () => set({ user: null, isAuthenticated: false }),
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

### Route Protection

- **MUST:** Create `ProtectedRoute` component
- **MUST:** Check auth state from Zustand store
- **MUST:** Redirect to `/signin` if not authenticated
- **MUST:** Redirect authenticated users away from auth pages

**Example:**

```typescript
// apps/shell/src/components/ProtectedRoute.tsx
import { Navigate } from 'react-router';
import { useAuthStore } from 'shared-auth-store';

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuthStore();

  if (!isAuthenticated) {
    return <Navigate to="/signin" replace />;
  }

  return <>{children}</>;
}
```

---

## State Management

### Zustand (Client State)

- **MUST:** Use Zustand for client-side state (auth, UI, theme)
- **MUST:** Share auth store between MFEs (acceptable for POC-1)
- **MUST:** Use persist middleware for auth state
- **MUST NOT:** Create throw-away stores

**POC-1 Usage:**

- ✅ Shared stores for inter-MFE communication (e.g., `shared-auth-store`)
- ✅ MFE-local stores for component state within single MFEs

**POC-2 Evolution:**

- ✅ Zustand only for state within single MFEs (decoupled)
- ❌ No shared Zustand stores across MFEs
- ✅ Event bus for inter-MFE communication

### TanStack Query (Server State)

- **MUST:** Use TanStack Query for server-side state (API data, caching)
- **MUST:** Use with stubbed payment APIs (no actual PSP)
- **MUST:** Configure query options (staleTime, cacheTime)
- **MUST:** Use query hooks for data fetching
- **MUST:** Use mutation hooks for data mutations

**Example:**

```typescript
// apps/payments-mfe/src/hooks/usePayments.ts
import { useQuery } from '@tanstack/react-query';
import { stubbedPaymentsApi } from '../api/stubbedPayments';

export function usePayments() {
  return useQuery({
    queryKey: ['payments'],
    queryFn: () => stubbedPaymentsApi.getPayments(),
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}
```

---

## Payments System

### Stubbed Payment Operations

**CRITICAL: All payment operations are stubbed (no actual PSP integration):**

- **MUST:** Create stubbed payment APIs (no actual PSP)
- **MUST:** Document that operations are stubbed
- **MUST:** Use TanStack Query hooks with stubbed APIs
- **MUST:** Simulate payment flow (no actual payment processing)
- **MUST NOT:** Integrate with real Payment Service Provider

**Stubbed Operations:**

- `getPayments()` - Returns mock payment list
- `createPayment()` - Simulates payment creation (no actual PSP)
- `updatePayment()` - Simulates payment update (no actual PSP)
- `deletePayment()` - Simulates payment deletion (no actual PSP)

**Example:**

```typescript
// apps/payments-mfe/src/api/stubbedPayments.ts
export const stubbedPaymentsApi = {
  getPayments: async (): Promise<Payment[]> => {
    await new Promise(resolve => setTimeout(resolve, 500)); // Simulate delay
    return [
      { id: '1', amount: 100, description: 'Payment 1', status: 'completed' },
    ];
  },
  createPayment: async (dto: CreatePaymentDto): Promise<Payment> => {
    await new Promise(resolve => setTimeout(resolve, 300));
    // Stubbed payment - simulates payment creation but does not process real payment
    return { id: '3', ...dto, status: 'completed' };
  },
};
```

### Role-Based Access Control (RBAC)

**VENDOR Role:**

- ✅ Can initiate payments (stubbed)
- ✅ Can view reports
- ✅ Can view payment history
- ❌ Cannot make payments (only initiate)

**CUSTOMER Role:**

- ✅ Can make payments (stubbed)
- ✅ Can view own payment history
- ❌ Cannot initiate payments
- ❌ Cannot view reports

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
  password: z.string().min(8, 'Password must be at least 8 characters'),
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
    // Handle form submission
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
- **MUST:** Use inline utility classes (POC-1)
- **MUST:** Refer to Tailwind v4 documentation
- **MUST NOT:** Use v3 syntax
- **MUST NOT:** Use design system components yet (POC-2)

**POC-1 Approach:**

- Direct inline Tailwind classes in components
- No design system component library
- Simple and fast for POC-1
- Full flexibility for rapid development

**POC-2 Evolution:**

- Design system using Tailwind + shadcn/ui
- Reusable component library
- Consistent design tokens

**Example:**

```tsx
// ✅ GOOD (Tailwind v4 - inline classes)
<button className="bg-blue-500 px-4 py-2 rounded-lg text-white font-semibold hover:bg-blue-600">
  Sign In
</button>

// ❌ BAD (Don't use v3 syntax or design system components in POC-1)
<Button variant="primary">Sign In</Button>
```

---

## Module Federation v2

### Remote Configuration

**Auth MFE (Port 4201):**

- **MUST:** Expose `./SignIn` component
- **MUST:** Expose `./SignUp` component
- **MUST:** Configure shared dependencies

**Payments MFE (Port 4202):**

- **MUST:** Expose `./PaymentsPage` component
- **MUST:** Configure shared dependencies

**Shell (Port 4200):**

- **MUST:** Configure as host
- **MUST:** Load `authMfe` remote: `http://localhost:4201/assets/remoteEntry.js`
- **MUST:** Load `paymentsMfe` remote: `http://localhost:4202/assets/remoteEntry.js`
- **MUST:** Configure shared dependencies

### Shared Dependencies

- **MUST:** React 19.2.0 (singleton)
- **MUST:** React DOM 19.2.0 (singleton)
- **MUST:** Zustand 4.5.x (shared)
- **MUST:** TanStack Query 5.x (shared)
- **MUST:** React Router 7.x (shared)

---

## Project Structure

```
apps/
├── shell/              # Host (Port 4200) - Updated with routing, header
├── auth-mfe/           # Remote (Port 4201) - NEW
└── payments-mfe/       # Remote (Port 4202) - NEW
libs/
├── shared-utils/       # Existing
├── shared-ui/          # Existing
├── shared-types/       # Existing (extended)
├── shared-auth-store/  # NEW - Zustand auth store
└── shared-header-ui/  # NEW - Universal header component
```

---

## Nx Commands

- `nx serve shell` / `nx serve auth-mfe` / `nx serve payments-mfe`
- `nx run-many --target=serve --projects=shell,auth-mfe,payments-mfe --parallel`
- `nx build <project>` / `nx test <project>` / `nx lint <project>`
- `nx generate @nx/react:application <name> --bundler=vite`
- `nx generate @nx/react:library <name> --bundler=vite`
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

- **MUST:** Create documentation files in `docs/POC-1-Implementation/` folder
- **MUST:** Update both `task-list.md` and `implementation-plan.md` after each task
- **MUST:** Ask for confirmation if documentation location is unclear

---

## Task Management & Workflow

### Task Progression

- **MUST:** Follow `docs/POC-1-Implementation/implementation-plan.md` for detailed task steps
- **MUST:** Update `docs/POC-1-Implementation/task-list.md` after completing each task/sub-task
- **MUST:** Update `docs/POC-1-Implementation/implementation-plan.md` after completing each task/sub-task (mark verification checkboxes and update status)
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
- **MUST:** Test all components, stores, and hooks
- **MUST:** Use Vitest + React Testing Library

### Integration Testing

- **MUST:** Test authentication flow
- **MUST:** Test payments flow
- **MUST:** Test route protection
- **MUST:** Test state synchronization
- **MUST:** Test role-based access

### E2E Testing

- **MUST:** Use Playwright for E2E tests
- **MUST:** Test critical user journeys
- **MUST:** Test sign-in/sign-up flows
- **MUST:** Test payments flow
- **MUST:** Test logout flow
- **MUST:** Test role-based access

---

## Before Committing

✅ TypeScript compiles | ✅ ESLint passes | ✅ Tests pass | ✅ Build works | ✅ No `any` types | ✅ Tests written | ✅ Module Federation works | ✅ Tailwind v4 syntax | ✅ Mock auth works | ✅ Stubbed payments work

---

## Success Criteria

✅ Auth MFE (4201) & Payments MFE (4202) run | ✅ React Router 7 works | ✅ Zustand stores shared | ✅ TanStack Query works | ✅ Tailwind CSS v4 works | ✅ Route protection works | ✅ RBAC works | ✅ Universal header displays | ✅ Tests pass (70% coverage) | ✅ All remotes load dynamically

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
- ❌ Using real PSP integration (must use stubbed operations)
- ❌ Using real backend authentication (must use mock auth)
- ❌ Using design system components (POC-2)

---

## Quick Reference

### Creating Auth Store

```typescript
// libs/shared-auth-store/src/index.ts
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      // Store implementation
    }),
    { name: 'auth-storage' }
  )
);
```

### Creating Form with Validation

```typescript
// Component with React Hook Form + Zod
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

type FormData = z.infer<typeof schema>;

export function MyForm() {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
  });
  // ...
}
```

### Using TanStack Query

```typescript
// Hook with TanStack Query
import { useQuery, useMutation } from '@tanstack/react-query';

export function usePayments() {
  return useQuery({
    queryKey: ['payments'],
    queryFn: () => stubbedPaymentsApi.getPayments(),
    staleTime: 1000 * 60 * 5,
  });
}
```

---

## References

- Architecture: `docs/References/mfe-poc1-architecture.md`
- Tech Stack: `docs/References/mfe-poc1-tech-stack.md`
- Detailed Rules: `docs/POC-1-Implementation/project-rules.md`
- Implementation Plan: `docs/POC-1-Implementation/implementation-plan.md`
- Task List: `docs/POC-1-Implementation/task-list.md`
- ADRs: `docs/adr/poc-1/`

---

**For detailed rules, examples, and guidance:** See `docs/POC-1-Implementation/project-rules.md`
