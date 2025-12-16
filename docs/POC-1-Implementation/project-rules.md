# Project Rules - POC-1 Implementation

**Status:** Authoritative  
**Version:** 1.0  
**Date:** 2026-01-XX  
**Phase:** POC-1 - Authentication & Payments

> **📋 Base Rules:** These rules extend the POC-0 rules. See [`../POC-0-Implementation/project-rules.md`](../POC-0-Implementation/project-rules.md) for foundational rules.

---

## 1. POC-1 Scope & Constraints

### 1.1 In Scope

**POC-1 includes:**

- ✅ Authentication system (Auth MFE) with mock authentication
- ✅ Payments system (Payments MFE) with stubbed payment operations
- ✅ React Router 7 for routing
- ✅ Zustand for client-side state management
- ✅ TanStack Query for server-side state management
- ✅ Tailwind CSS v4 for styling
- ✅ Role-based access control (RBAC) - VENDOR and CUSTOMER roles
- ✅ Universal header component
- ✅ Form validation (React Hook Form + Zod)
- ✅ Route protection
- ✅ Shared auth store library
- ✅ Shared header UI library

### 1.2 Out of Scope

**POC-1 does NOT include:**

- ❌ Real authentication backend (POC-2)
- ❌ Event bus for inter-MFE communication (POC-2)
- ❌ Real payment processing with PSP integration (MVP/Production - all POC phases use stubbed payments)
- ❌ Design system (POC-2)
- ❌ Backend integration (POC-2)
- ❌ Advanced routing features (deep linking, etc.)
- ❌ Performance optimizations (code splitting, lazy loading) (POC-3)
- ❌ Error boundaries and error handling (basic only)
- ❌ Analytics integration
- ❌ Theming system (basic styling only)
- ❌ nginx reverse proxy (POC-3)
- ❌ WebSocket real-time updates (POC-3)

---

## 2. POC-1 Technology Stack

### 2.1 New Dependencies (POC-1)

**Routing:**

- `react-router@7.x` - Latest version, production-ready

**State Management:**

- `zustand@4.5.x` - Client-side state (auth, UI, theme)
- `@tanstack/react-query@5.x` - Server-side state (API data, caching)

**Forms & Validation:**

- `react-hook-form@7.52.x` - Form handling
- `zod@3.23.x` - TypeScript-first validation

**HTTP Client:**

- `axios@1.7.x` - HTTP client (for future backend integration)

**Styling:**

- `tailwindcss@4.0+` - **CRITICAL: Always use v4 syntax, never v3**

**Error Handling:**

- `react-error-boundary@4.0.13` - React 19 compatible

**Testing:**

- `@testing-library/user-event@14.6.1` - User interaction testing

### 2.2 Version Compatibility

All POC-1 dependencies must be compatible with:

- React 19.2.0
- Vite 6.x
- Module Federation v2 (@module-federation/enhanced 0.21.6)
- TypeScript 5.9.x

---

## 3. Authentication & Authorization Rules

### 3.1 Mock Authentication

**POC-1 uses mock authentication:**

- ✅ Simple in-memory authentication
- ✅ Mock user data
- ✅ Session persistence (localStorage)
- ✅ No real backend integration
- ✅ Can be replaced with real auth in POC-2

**Mock User Roles:**

- `ADMIN` - Full system access (functionality in POC-2)
- `CUSTOMER` - Can make payments, view own history
- `VENDOR` - Can initiate payments, view reports

### 3.2 Auth Store Rules

**Zustand Auth Store (`libs/shared-auth-store`):**

- ✅ Shared store for inter-MFE communication (acceptable for POC-1)
- ✅ Persistence middleware (localStorage)
- ✅ RBAC helpers (hasRole, hasAnyRole)
- ✅ Type-safe with TypeScript
- ✅ Mock authentication functions

**Store Structure:**

```typescript
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
```

### 3.3 Route Protection Rules

**Protected Routes:**

- ✅ Use `ProtectedRoute` component
- ✅ Check auth state from Zustand store
- ✅ Redirect to `/signin` if not authenticated
- ✅ Redirect authenticated users away from auth pages
- ✅ Loading state while checking auth

**Route Structure:**

- `/` - Redirect based on auth state
- `/signin` - Sign-in page (unauthenticated)
- `/signup` - Sign-up page (unauthenticated)
- `/payments` - Payments page (authenticated, protected)

---

## 4. Payments System Rules

### 4.1 Stubbed Payment Operations

**CRITICAL: All payment operations are stubbed (no actual PSP integration):**

- ✅ Payment operations simulate the flow
- ✅ No actual Payment Service Provider (PSP) integration
- ✅ Stubbed payment APIs return mock data
- ✅ TanStack Query hooks work with stubbed APIs
- ✅ Same patterns as real backend (which also stubs payments)
- ✅ Easy migration to backend API in POC-2 (still stubbed, no PSP)

**Stubbed Operations:**

- `getPayments()` - Returns mock payment list
- `createPayment()` - Simulates payment creation (no actual PSP)
- `updatePayment()` - Simulates payment update (no actual PSP)
- `deletePayment()` - Simulates payment deletion (no actual PSP)

### 4.2 Role-Based Access Control (RBAC)

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

**ADMIN Role:**

- 🔄 Full system access (POC-2)

### 4.3 TanStack Query Rules

**Server State Management:**

- ✅ Use TanStack Query for all payment operations
- ✅ Query hooks for data fetching
- ✅ Mutation hooks for data mutations
- ✅ Query options configured (staleTime, cacheTime)
- ✅ Works with stubbed APIs (no actual PSP)
- ✅ Easy migration to backend API in POC-2 (still stubbed, no PSP)

**Query Hooks:**

- `usePayments()` - Fetch payments list
- `useCreatePayment()` - Create payment (stubbed)
- `useUpdatePayment()` - Update payment (stubbed)
- `useDeletePayment()` - Delete payment (stubbed)

---

## 5. Styling Rules

### 5.1 Tailwind CSS v4

**CRITICAL: Always use Tailwind CSS v4 syntax, never v3:**

- ✅ Tailwind CSS v4.0+ installed
- ✅ Use inline utility classes
- ✅ No design system yet (POC-2)
- ✅ Responsive design with Tailwind utilities
- ✅ Modern CSS features (cascade layers, `color-mix()`)

**POC-1 Approach:**

- Direct inline Tailwind classes in components
- No design system component library
- Simple and fast for POC-1
- Full flexibility for rapid development

**POC-2 Evolution:**

- Design system using Tailwind + shadcn/ui
- Reusable component library
- Consistent design tokens

### 5.2 Component Styling

**Styling Rules:**

- ✅ Use Tailwind utility classes
- ✅ Responsive design with Tailwind breakpoints
- ✅ Error states styled
- ✅ Loading states styled
- ✅ Role-based UI variations styled

---

## 6. Form Validation Rules

### 6.1 React Hook Form + Zod

**Form Handling:**

- ✅ Use React Hook Form for all forms
- ✅ Use Zod for validation schemas
- ✅ Type-safe form validation
- ✅ Runtime validation with Zod
- ✅ Type inference from Zod schemas

**Form Structure:**

```typescript
const signInSchema = z.object({
  email: z.string().email('Invalid email'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
});

type SignInForm = z.infer<typeof signInSchema>;
```

### 6.2 Password Requirements

**Security Rules:**

- ✅ Minimum 12 characters (banking-grade)
- ✅ Complexity requirements (uppercase, lowercase, numbers, symbols)
- ✅ Password strength validation
- ✅ Confirm password validation
- ✅ Never log passwords
- ✅ Secure storage (localStorage with encryption consideration)

---

## 7. Module Federation v2 Rules

### 7.1 Remote Configuration

**Auth MFE (Port 4201):**

- ✅ Exposes `./SignIn` component
- ✅ Exposes `./SignUp` component
- ✅ Shared dependencies configured

**Payments MFE (Port 4202):**

- ✅ Exposes `./PaymentsPage` component
- ✅ Shared dependencies configured

**Shell (Port 4200):**

- ✅ Configured as host
- ✅ Loads `authMfe` remote
- ✅ Loads `paymentsMfe` remote
- ✅ Shared dependencies configured

### 7.2 Shared Dependencies

**Shared Dependencies:**

- ✅ React 19.2.0 (singleton)
- ✅ React DOM 19.2.0 (singleton)
- ✅ Zustand 4.5.x (shared)
- ✅ TanStack Query 5.x (shared)
- ✅ React Router 7.x (shared)

---

## 8. Testing Rules

### 8.1 Unit Testing

**Coverage Requirements:**

- ✅ 70%+ test coverage target
- ✅ All components have unit tests
- ✅ All stores have unit tests
- ✅ All hooks have unit tests
- ✅ Form validation tested
- ✅ RBAC helpers tested

**Testing Tools:**

- Vitest 2.0.x
- React Testing Library 16.1.x
- @testing-library/user-event 14.6.1

### 8.2 Integration Testing

**Integration Test Coverage:**

- ✅ Authentication flow tested
- ✅ Payments flow tested
- ✅ Route protection tested
- ✅ State synchronization tested
- ✅ Role-based access tested

### 8.3 E2E Testing

**E2E Test Coverage:**

- ✅ Sign-in flow tested
- ✅ Sign-up flow tested
- ✅ Payments flow tested
- ✅ Logout flow tested
- ✅ Role-based access tested

**Testing Tools:**

- Playwright (latest)

---

## 9. Code Organization Rules

### 9.1 Shared Libraries

**New Shared Libraries (POC-1):**

- `libs/shared-auth-store` - Zustand auth store
- `libs/shared-header-ui` - Universal header component
- `libs/shared-types` - Shared TypeScript types (extended)

**Existing Shared Libraries (POC-0):**

- `libs/shared-utils` - Utility functions
- `libs/shared-ui` - Shared UI components

### 9.2 Application Structure

**Applications:**

- `apps/shell` - Host application (updated with routing, header)
- `apps/auth-mfe` - Auth remote (NEW)
- `apps/payments-mfe` - Payments remote (NEW)

---

## 10. Security Rules (Banking-Grade)

### 10.1 POC-1 Security Features

**Security Foundation:**

- ✅ Secure password handling (never log passwords)
- ✅ Session management
- ✅ Role-based access control (RBAC) foundation
- ✅ Secure storage (localStorage with encryption consideration)
- ✅ Mock authentication (real JWT in POC-2)
- ✅ Input validation (Zod schemas)
- ✅ Input sanitization (XSS prevention)
- ✅ Strong password requirements (12+ chars, complexity)
- ✅ Type-safe validation (Zod)
- ✅ Generic error messages (no sensitive data)
- ✅ Secure error logging

### 10.2 Security Considerations

**Not Yet Implemented (Future Phases):**

- ⚠️ HTTPS (HTTP for POC-1, HTTPS with self-signed certificates in POC-3)
- ⚠️ Real JWT authentication (POC-2)
- ⚠️ Content Security Policy (CSP) headers (POC-2)
- ⚠️ Real certificates (MVP)

---

## 11. Documentation Rules

### 11.1 Required Documentation

**POC-1 Documentation:**

- ✅ Implementation plan (`implementation-plan.md`)
- ✅ Task list (`task-list.md`)
- ✅ Success criteria validation (`success-criteria-validation.md`)
- ✅ Project rules (`project-rules.md`)
- ✅ Development guide (updated)
- ✅ Testing guide (updated)
- ✅ Architecture documentation (updated)

### 11.2 Code Documentation

**Code Comments:**

- ✅ Document complex logic
- ✅ Document why, not what
- ✅ Document security considerations
- ✅ Document stubbed operations (no actual PSP)
- ✅ Document mock authentication

---

## 12. Migration Path

### 12.1 POC-1 → POC-2

**Migration Considerations:**

- ✅ Mock authentication → Real JWT authentication
- ✅ Shared Zustand stores → Event bus for inter-MFE communication
- ✅ Stubbed payment APIs → Backend API calls (still stubbed, no PSP)
- ✅ Inline Tailwind → Design system (shadcn/ui)
- ✅ No backend → Backend integration

**No Throw-Away Code:**

- ✅ All POC-1 code carries forward
- ✅ Same patterns used in POC-2
- ✅ Easy migration path

---

## 13. Best Practices

### 13.1 Development Workflow

**Workflow Rules:**

- ✅ Follow implementation plan step-by-step
- ✅ Update task list after each task
- ✅ Write tests alongside code
- ✅ Fix type errors immediately
- ✅ Run tests before committing
- ✅ Document deviations from plan

### 13.2 Code Quality

**Quality Standards:**

- ✅ No `any` types (documented exceptions only)
- ✅ Fix type errors immediately
- ✅ Self-documenting code
- ✅ DRY and KISS principles
- ✅ Zero technical debt
- ✅ Production-ready code only

---

## 14. Related Documents

- [`../POC-0-Implementation/project-rules.md`](../POC-0-Implementation/project-rules.md) - POC-0 foundational rules
- [`../References/mfe-poc1-architecture.md`](../References/mfe-poc1-architecture.md) - POC-1 architecture
- [`../References/mfe-poc1-tech-stack.md`](../References/mfe-poc1-tech-stack.md) - POC-1 tech stack
- [`../adr/poc-1/`](../adr/poc-1/) - Architecture Decision Records for POC-1

---

**Last Updated:** 2026-01-XX  
**Status:** Authoritative - POC-1 Implementation Rules
