# Project Rules - POC-2 Implementation

**Status:** Authoritative  
**Version:** 1.0  
**Date:** 2026-01-XX  
**Phase:** POC-2 - Backend Integration & Enhanced Features

> **📋 Base Rules:** These rules extend the POC-1 rules. See [`../POC-1-Implementation/project-rules.md`](../POC-1-Implementation/project-rules.md) for foundational rules.

---

## 1. POC-2 Scope & Constraints

### 1.1 In Scope

**POC-2 includes:**

- ✅ Real backend API integration (REST API with backend services)
- ✅ Real JWT authentication (replace mock auth with backend Auth Service)
- ✅ Event bus for inter-MFE communication (replace shared Zustand stores)
- ✅ Admin MFE (new remote, Port 4203) for ADMIN role functionality
- ✅ Design system (Tailwind CSS v4 + shadcn/ui components)
- ✅ Enhanced RBAC (ADMIN, CUSTOMER, VENDOR roles)
- ✅ API client library (shared Axios client with interceptors)
- ✅ Backend services (API Gateway, Auth, Payments, Admin, Profile, Event Hub)
- ✅ Database integration (PostgreSQL with Prisma ORM)
- ✅ Redis Pub/Sub for inter-service communication
- ✅ Enhanced error handling and error boundaries
- ✅ Basic observability (error logging, API logging, health checks, basic metrics)
- ✅ React Router 7 for routing
- ✅ Zustand for client-side state management (within MFEs only)
- ✅ TanStack Query for server-side state management
- ✅ Form validation (React Hook Form + Zod)
- ✅ Route protection

### 1.2 Out of Scope

**POC-2 does NOT include:**

- ❌ Real payment processing with PSP integration (all POC phases use stubbed payments)
- ❌ Advanced infrastructure (nginx, advanced observability) - POC-3
- ❌ Separate databases per service (shared database in POC-2) - POC-3
- ❌ WebSocket real-time updates - POC-3
- ❌ Advanced performance optimizations - POC-3
- ❌ GraphQL (optional in POC-3)
- ❌ RabbitMQ event hub (Redis Pub/Sub in POC-2) - POC-3

---

## 2. POC-2 Technology Stack

### 2.1 Frontend Dependencies (POC-2)

**New Dependencies (POC-2):**

**Design System:**

- `shadcn/ui` (latest) - Production-ready component library
- `@radix-ui/*` - UI primitives (installed via shadcn/ui)

**Event Bus:**

- Custom event bus implementation (`libs/shared-event-bus`)

**API Client:**

- `axios@1.7.x` - HTTP client with interceptors (already in POC-1, now actively used)

**Existing Dependencies (from POC-1):**

- `react-router@7.x` - Routing
- `zustand@4.5.x` - Client-side state (within MFEs only)
- `@tanstack/react-query@5.x` - Server-side state
- `react-hook-form@7.52.x` - Form handling
- `zod@3.23.x` - Validation
- `tailwindcss@4.0+` - **CRITICAL: Always use v4 syntax, never v3**
- `react-error-boundary@4.0.13` - Error handling
- `jest@30.x` - Testing (Rspack-compatible)
- `@testing-library/react@16.1.x` - React testing utilities
- `playwright` - E2E testing

**Bundler:**

- `@rspack/core` (latest) - Fast builds, HMR with Module Federation v2

### 2.2 Backend Dependencies (POC-2)

**Runtime & Framework:**

- `node@24.11.x LTS` - Runtime
- `express@4.x` - Web framework
- `typescript@5.9.x` - Type safety

**Database:**

- `postgresql@16.x` - Database
- `prisma@5.x` - ORM
- `@prisma/client@5.x` - Prisma client

**Authentication:**

- `jsonwebtoken@9.x` - JWT tokens
- `bcrypt@5.x` - Password hashing

**Event Hub:**

- `redis@7.x` - Redis Pub/Sub
- `ioredis@5.x` - Redis client

**Validation:**

- `zod@3.23.x` - Type-safe validation

**Logging:**

- `winston@3.x` - Structured logging

**Testing:**

- `vitest@2.0.x` - Unit testing
- `supertest@7.x` - API testing

### 2.3 Version Compatibility

All POC-2 dependencies must be compatible with:

- React 19.2.0
- Rspack (latest)
- Module Federation v2 (@module-federation/enhanced 0.21.6)
- TypeScript 5.9.x
- Node.js 24.11.x LTS

---

## 3. Authentication & Authorization Rules

### 3.1 Real JWT Authentication

**POC-2 uses real JWT authentication:**

- ✅ Backend Auth Service integration
- ✅ JWT token generation and validation
- ✅ Refresh token mechanism
- ✅ Token storage (localStorage with httpOnly cookie consideration for production)
- ✅ Token refresh on API calls
- ✅ Secure token handling
- ✅ Session management

**User Roles:**

- `ADMIN` - Full system access, admin dashboard (Admin MFE)
- `CUSTOMER` - Can make payments, view own history
- `VENDOR` - Can initiate payments, view reports

### 3.2 Auth Store Rules

**Zustand Auth Store (`libs/shared-auth-store`):**

- ✅ Updated for real JWT authentication
- ✅ Persistence middleware (localStorage)
- ✅ RBAC helpers (hasRole, hasAnyRole)
- ✅ Type-safe with TypeScript
- ✅ Real authentication functions (backend API calls)
- ✅ Token management (access token, refresh token)
- ✅ Token refresh logic

**Store Structure:**

```typescript
interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  accessToken: string | null;
  refreshToken: string | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  signup: (email: string, password: string) => Promise<void>;
  refreshAccessToken: () => Promise<void>;
  hasRole: (role: UserRole) => boolean;
  hasAnyRole: (roles: UserRole[]) => boolean;
}
```

### 3.3 API Client Rules

**Shared API Client (`libs/shared-api-client`):**

- ✅ Axios-based HTTP client
- ✅ JWT token interceptors (automatic token injection)
- ✅ Token refresh interceptors (automatic token refresh)
- ✅ Error handling interceptors
- ✅ Base URL configuration (environment variables)
- ✅ Request/response logging
- ✅ Retry logic for failed requests

### 3.4 Route Protection Rules

**Protected Routes:**

- ✅ Use `ProtectedRoute` component
- ✅ Check auth state from Zustand store
- ✅ Verify JWT token validity
- ✅ Redirect to `/signin` if not authenticated
- ✅ Redirect authenticated users away from auth pages
- ✅ Role-based route protection (ADMIN routes)

**Route Structure:**

- `/` - Redirect based on auth state
- `/signin` - Sign-in page (unauthenticated)
- `/signup` - Sign-up page (unauthenticated)
- `/payments` - Payments page (authenticated, protected)
- `/admin` - Admin dashboard (authenticated, ADMIN role only)

---

## 4. Payments System Rules

### 4.1 Backend API Integration

**CRITICAL: Payment operations are stubbed at backend level (no actual PSP integration):**

- ✅ Real backend Payments Service API integration
- ✅ No frontend stubbed APIs (all calls go to backend)
- ✅ TanStack Query hooks work with real backend APIs
- ✅ Payment operations simulate the flow (backend stubs, no actual PSP)
- ✅ Same patterns as real PSP integration (which will come in MVP/Production)
- ✅ Backend API returns stubbed payment data

**Backend Operations:**

- `GET /api/payments` - Returns payment list (stubbed)
- `POST /api/payments` - Creates payment (stubbed, no actual PSP)
- `PUT /api/payments/:id` - Updates payment (stubbed, no actual PSP)
- `DELETE /api/payments/:id` - Deletes payment (stubbed)

### 4.2 Role-Based Access Control (RBAC)

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
- ✅ Analytics and reports

### 4.3 TanStack Query Rules

**Server State Management:**

- ✅ Use TanStack Query for all payment operations
- ✅ Query hooks for data fetching (backend API)
- ✅ Mutation hooks for data mutations (backend API)
- ✅ Query options configured (staleTime, cacheTime)
- ✅ Works with real backend APIs (stubbed at backend level, no actual PSP)
- ✅ Error handling for API failures
- ✅ Retry logic for failed requests

**Query Hooks:**

- `usePayments()` - Fetch payments list (backend API)
- `useCreatePayment()` - Create payment (backend API, stubbed)
- `useUpdatePayment()` - Update payment (backend API, stubbed)
- `useDeletePayment()` - Delete payment (backend API, stubbed)

---

## 5. Event Bus Rules

### 5.1 Event Bus Architecture

**POC-2 uses event bus for inter-MFE communication:**

- ✅ Decoupled MFE communication
- ✅ Replace shared Zustand stores with event bus
- ✅ Event bus library (`libs/shared-event-bus`)
- ✅ Type-safe event definitions
- ✅ Event subscription/unsubscription
- ✅ Event publishing
- ✅ Event filtering and routing

**Event Bus Pattern:**

- ✅ Publish/subscribe pattern
- ✅ Event-driven architecture
- ✅ Decoupled MFEs (no direct dependencies)
- ✅ Type-safe events with TypeScript
- ✅ Event history (optional, for debugging)

### 5.2 Event Types

**Authentication Events:**

- `auth:login` - User logged in
- `auth:logout` - User logged out
- `auth:token-refreshed` - Access token refreshed
- `auth:session-expired` - Session expired

**User Events:**

- `user:updated` - User profile updated
- `user:role-changed` - User role changed

**Payment Events:**

- `payment:created` - Payment created
- `payment:updated` - Payment updated
- `payment:deleted` - Payment deleted

### 5.3 Zustand Usage (POC-2)

**Zustand for Client State (within MFEs only):**

- ✅ Use Zustand for state within single MFEs
- ✅ MFE-local stores for component state
- ❌ No shared Zustand stores across MFEs
- ✅ Event bus for inter-MFE communication

---

## 6. Design System Rules

### 6.1 shadcn/ui Integration

**POC-2 uses shadcn/ui design system:**

- ✅ shadcn/ui component library
- ✅ Tailwind CSS v4 for styling
- ✅ Radix UI primitives
- ✅ Design system library (`libs/shared-design-system`)
- ✅ Reusable component patterns
- ✅ Consistent design tokens
- ✅ Accessibility (a11y) built-in

**Design System Components:**

- ✅ Button, Input, Form, Card, Dialog, Dropdown, etc.
- ✅ Replace inline components with design system components
- ✅ Customizable via Tailwind classes
- ✅ Type-safe component props

### 6.2 Component Migration

**Migration from POC-1:**

- ✅ Replace inline Tailwind components with design system components
- ✅ Maintain existing functionality
- ✅ Improve consistency and accessibility
- ✅ Follow design system patterns

### 6.3 Styling Rules

**Tailwind CSS v4:**

- ✅ **CRITICAL: Always use Tailwind v4 syntax, never v3**
- ✅ Use design system components for common patterns
- ✅ Custom Tailwind classes for unique styling
- ✅ Responsive design with Tailwind utilities
- ✅ Modern CSS features (cascade layers, `color-mix()`)

---

## 7. Admin MFE Rules

### 7.1 Admin MFE Structure

**Admin MFE (Port 4203):**

- ✅ New remote MFE
- ✅ Exposes `./AdminDashboard` component
- ✅ ADMIN role only access
- ✅ User management functionality
- ✅ System configuration
- ✅ Analytics and reports
- ✅ Audit logging

### 7.2 Admin Features

**Admin Dashboard:**

- ✅ User management (CRUD operations)
- ✅ Role management
- ✅ System configuration
- ✅ Analytics dashboard
- ✅ Audit logs
- ✅ System health monitoring

---

## 8. Backend Integration Rules

### 8.1 Backend Services

**API Gateway:**

- ✅ Routing to microservices
- ✅ Authentication middleware (JWT validation)
- ✅ Rate limiting
- ✅ CORS configuration
- ✅ Request logging

**Auth Service:**

- ✅ User authentication (login, signup)
- ✅ JWT token generation
- ✅ Token refresh
- ✅ Password hashing (bcrypt)
- ✅ User management

**Payments Service:**

- ✅ Payment CRUD operations (stubbed, no actual PSP)
- ✅ Payment history
- ✅ Payment status management

**Admin Service:**

- ✅ User management
- ✅ Role management
- ✅ Audit logging
- ✅ System configuration

**Profile Service:**

- ✅ User profile management
- ✅ Profile updates

**Event Hub:**

- ✅ Redis Pub/Sub
- ✅ Inter-service communication
- ✅ Event publishing/subscribing

### 8.2 Database Rules

**PostgreSQL with Prisma:**

- ✅ Shared database (POC-2)
- ✅ Prisma ORM for type-safe database access
- ✅ Database migrations
- ✅ Schema management
- ✅ Connection pooling

---

## 9. Form Validation Rules

### 9.1 React Hook Form + Zod

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
  password: z.string().min(12, 'Password must be at least 12 characters'),
});

type SignInForm = z.infer<typeof signInSchema>;
```

### 9.2 Password Requirements

**Security Rules:**

- ✅ Minimum 12 characters (banking-grade)
- ✅ Complexity requirements (uppercase, lowercase, numbers, symbols)
- ✅ Password strength validation
- ✅ Confirm password validation
- ✅ Never log passwords
- ✅ Secure storage (backend hashing with bcrypt)

---

## 10. Module Federation v2 Rules

### 10.1 Remote Configuration

**Auth MFE (Port 4201):**

- ✅ Exposes `./SignIn` component
- ✅ Exposes `./SignUp` component
- ✅ Shared dependencies configured
- ✅ Updated for real JWT authentication

**Payments MFE (Port 4202):**

- ✅ Exposes `./PaymentsPage` component
- ✅ Shared dependencies configured
- ✅ Updated for backend API integration

**Admin MFE (Port 4203) - NEW:**

- ✅ Exposes `./AdminDashboard` component
- ✅ Shared dependencies configured
- ✅ ADMIN role only access

**Shell (Port 4200):**

- ✅ Configured as host
- ✅ Loads `authMfe` remote
- ✅ Loads `paymentsMfe` remote
- ✅ Loads `adminMfe` remote (NEW)
- ✅ Shared dependencies configured
- ✅ Event bus initialization

### 10.2 Shared Dependencies

**Shared Dependencies:**

- ✅ React 19.2.0 (singleton)
- ✅ React DOM 19.2.0 (singleton)
- ✅ Zustand 4.5.x (shared)
- ✅ TanStack Query 5.x (shared)
- ✅ React Router 7.x (shared)
- ✅ Event bus (shared)
- ✅ API client (shared)
- ✅ Design system (shared)

---

## 11. Testing Rules

### 11.1 Unit Testing

**Coverage Requirements:**

- ✅ 70%+ test coverage target
- ✅ All components have unit tests
- ✅ All stores have unit tests
- ✅ All hooks have unit tests
- ✅ All API clients have unit tests
- ✅ All event bus functions have unit tests
- ✅ Form validation tested
- ✅ RBAC helpers tested

**Testing Tools:**

- Jest 30.x (Rspack-compatible)
- React Testing Library 16.1.x
- @testing-library/user-event 14.6.1

### 11.2 Integration Testing

**Integration Test Coverage:**

- ✅ Authentication flow tested (with backend)
- ✅ Payments flow tested (with backend)
- ✅ Route protection tested
- ✅ Event bus communication tested
- ✅ Role-based access tested
- ✅ API client interceptors tested
- ✅ Token refresh tested

### 11.3 E2E Testing

**E2E Test Coverage:**

- ✅ Sign-in flow tested (with backend)
- ✅ Sign-up flow tested (with backend)
- ✅ Payments flow tested (with backend)
- ✅ Logout flow tested
- ✅ Role-based access tested
- ✅ Admin MFE tested
- ✅ Event bus communication tested

**Testing Tools:**

- Playwright (latest)

### 11.4 Backend Testing

**Backend Test Coverage:**

- ✅ Unit tests for all services
- ✅ Integration tests for API endpoints
- ✅ Database tests with Prisma
- ✅ Event hub tests
- ✅ Authentication flow tests
- ✅ RBAC tests

**Testing Tools:**

- Vitest 2.0.x
- Supertest 7.x

---

## 12. Code Organization Rules

### 12.1 Shared Libraries

**New Shared Libraries (POC-2):**

- `libs/shared-api-client` - API client with interceptors
- `libs/shared-event-bus` - Event bus for inter-MFE communication
- `libs/shared-design-system` - Design system & shadcn/ui components
- `libs/shared-logging` - Basic logging utilities
- `libs/shared-metrics` - Basic metrics utilities

**Updated Shared Libraries (from POC-1):**

- `libs/shared-auth-store` - Updated for real JWT authentication
- `libs/shared-types` - Extended with new types

**Existing Shared Libraries (from POC-1):**

- `libs/shared-utils` - Utility functions
- `libs/shared-ui` - Shared UI components
- `libs/shared-header-ui` - Universal header component

### 12.2 Application Structure

**Applications:**

- `apps/shell` - Host application (updated with event bus, Admin MFE)
- `apps/auth-mfe` - Auth remote (updated for real JWT auth)
- `apps/payments-mfe` - Payments remote (updated for backend API)
- `apps/admin-mfe` - Admin remote (NEW)

### 12.3 Backend Structure

**Backend Services:**

- `apps/api-gateway` - API Gateway service
- `apps/auth-service` - Auth Service
- `apps/payments-service` - Payments Service
- `apps/admin-service` - Admin Service
- `apps/profile-service` - Profile Service
- `apps/event-hub` - Event Hub service

**Backend Libraries:**

- `libs/shared-backend-types` - Shared backend types
- `libs/shared-backend-utils` - Shared backend utilities
- `libs/shared-backend-auth` - Shared authentication utilities
- `libs/shared-backend-db` - Shared database utilities

---

## 13. Security Rules (Banking-Grade)

### 13.1 POC-2 Security Features

**Security Foundation:**

- ✅ Real JWT authentication
- ✅ Secure password handling (bcrypt hashing)
- ✅ Session management
- ✅ Role-based access control (RBAC)
- ✅ Secure storage (localStorage with httpOnly cookie consideration)
- ✅ Input validation (Zod schemas)
- ✅ Input sanitization (XSS prevention)
- ✅ Strong password requirements (12+ chars, complexity)
- ✅ Type-safe validation (Zod)
- ✅ Generic error messages (no sensitive data)
- ✅ Secure error logging
- ✅ API security (rate limiting, CORS)
- ✅ JWT token security (expiration, refresh)
- ✅ Secure headers (CSP, XSS protection)
- ✅ Audit logging

### 13.2 Security Considerations

**Not Yet Implemented (Future Phases):**

- ⚠️ HTTPS with real certificates (HTTP for POC-2, HTTPS with self-signed certificates in POC-3)
- ⚠️ Advanced security headers (POC-3)
- ⚠️ Real certificates (MVP)

---

## 14. Documentation Rules

### 14.1 Required Documentation

**POC-2 Documentation:**

- ✅ Implementation plan (`implementation-plan.md`)
- ✅ Task list (`task-list.md`)
- ✅ Success criteria validation (`success-criteria-validation.md`)
- ✅ Project rules (`project-rules.md`)
- ✅ Development guide (updated)
- ✅ Testing guide (updated)
- ✅ Architecture documentation (updated)
- ✅ API contracts documentation
- ✅ Event bus specification
- ✅ Design system guide
- ✅ Migration guide (POC-1 to POC-2)

### 14.2 Code Documentation

**Code Comments:**

- ✅ Document complex logic
- ✅ Document why, not what
- ✅ Document security considerations
- ✅ Document stubbed operations (no actual PSP)
- ✅ Document event bus events
- ✅ Document API contracts

---

## 15. Migration Path

### 15.1 POC-1 → POC-2

**Migration Considerations:**

- ✅ Mock authentication → Real JWT authentication
- ✅ Shared Zustand stores → Event bus for inter-MFE communication
- ✅ Stubbed payment APIs → Backend API calls (still stubbed, no PSP)
- ✅ Inline Tailwind → Design system (shadcn/ui)
- ✅ No backend → Backend integration
- ✅ Vite → Rspack (already done in POC-1)
- ✅ Vitest → Jest (already done in POC-1)

**No Throw-Away Code:**

- ✅ All POC-1 code carries forward
- ✅ Same patterns used in POC-2
- ✅ Easy migration path
- ✅ Incremental updates

---

## 16. Best Practices

### 16.1 Development Workflow

**Workflow Rules:**

- ✅ Follow implementation plan step-by-step
- ✅ Update task list after each task
- ✅ Write tests alongside code
- ✅ Fix type errors immediately
- ✅ Run tests before committing
- ✅ Document deviations from plan

### 16.2 Code Quality

**Quality Standards:**

- ✅ No `any` types (documented exceptions only)
- ✅ Fix type errors immediately
- ✅ Self-documenting code
- ✅ DRY and KISS principles
- ✅ Zero technical debt
- ✅ Production-ready code only

### 16.3 Backend Development

**Backend Standards:**

- ✅ RESTful API design
- ✅ Type-safe API contracts
- ✅ Comprehensive error handling
- ✅ Structured logging
- ✅ Database migrations
- ✅ API documentation

---

## 17. Related Documents

- [`../POC-1-Implementation/project-rules.md`](../POC-1-Implementation/project-rules.md) - POC-1 foundational rules
- [`../References/mfe-poc2-architecture.md`](../References/mfe-poc2-architecture.md) - POC-2 frontend architecture
- [`../References/backend-poc2-architecture.md`](../References/backend-poc2-architecture.md) - POC-2 backend architecture
- [`../References/fullstack-architecture.md`](../References/fullstack-architecture.md) - Full-stack architecture
- [`../adr/poc-2/`](../adr/poc-2/) - Architecture Decision Records for POC-2
- [`../adr/backend/poc-2/`](../adr/backend/poc-2/) - Backend Architecture Decision Records for POC-2

---

**Last Updated:** 2026-01-XX  
**Status:** Authoritative - POC-2 Implementation Rules
