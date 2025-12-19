# Project Rules for Cursor AI

> **Optimized for Cursor Settings → Rules**  
> **Version:** 2.0 (Improved)  
> **Reference:** See `project-rules.md` for detailed documentation

---

## 🚨 Critical Rules (Must Follow)

1. **NO throw-away code** - Everything must carry forward to Production
2. **Never use `any` type** - Documented exceptions only
3. **Always use Tailwind v4 syntax** - Never v3
4. **Fix type errors immediately** - Don't work around them
5. **Write tests alongside code** - Not after

---

## Core Principles

### Production-Ready Code

- **MUST:** All code must carry forward to POC-1, POC-2, POC-3, MVP, and Production
- **MUST NOT:** Create temporary solutions, quick fixes, or "just for POC" code
- **MUST:** Choose production-ready technologies from day one

### Type Safety

- **MUST:** Use TypeScript throughout (no JavaScript unless absolutely necessary)
- **MUST NOT:** Use `any` type (documented exceptions only)
- **MUST:** Fix type errors immediately (don't work around them)
- **MUST:** Use `libs/frontend/shared-types` and `libs/backend/shared-types` for cross-boundary types
- **MUST:** Use Zod schemas for runtime validation

**Example:**

```typescript
// ✅ GOOD
interface User {
  id: string;
  email: string;
}

// ❌ BAD
const user: any = { id: '1', email: 'test@example.com' };
```

### Code Quality

- **DRY:** Eliminate redundant code
- **KISS:** Prefer simple solutions over complex ones
- **Self-documenting:** Use descriptive naming and clear structure
- **Zero technical debt:** Address issues immediately

---

## Technology Stack (Exact Versions)

### Frontend

- **React:** 19.2.0 (must match React DOM 19.2.0)
- **Nx:** Latest
- **Vite:** 6.x
- **Module Federation:** @module-federation/enhanced 0.21.6 (BIMF)
- **Routing:** React Router 7.x (POC-1+)
- **State:** Zustand 4.5.x (client), TanStack Query 5.x (server) (POC-1+)
- **Styling:** Tailwind CSS 4.0+ - **CRITICAL: Always use v4 syntax, never v3**
- **Forms:** React Hook Form 7.52.x + Zod 3.23.x (POC-1+)
- **HTTP:** Axios 1.7.x (POC-2+)
- **Testing:** Vitest 2.0.x, React Testing Library 16.1.x, Playwright

### Backend

- **Node.js:** 24.11.x LTS
- **Framework:** Express 4.x
- **Database:** PostgreSQL 16.x
- **ORM:** Prisma 5.x
- **Auth:** JWT 9.x
- **Event Hub:** Redis Pub/Sub (POC-2) → RabbitMQ (POC-3)
- **Testing:** Vitest 2.0.x, Supertest 7.x

### Infrastructure

- **Package Manager:** pnpm 9.x (unified across frontend and backend)
- **Monorepo:** Nx (single workspace)
- **Reverse Proxy:** nginx (POC-3)
- **CI/CD:** GitHub Actions

---

## Code Style & Conventions

### TypeScript Rules

- **MUST:** Enable strict mode (no exceptions)
- **MUST NOT:** Use `any` type (documented exceptions only)
- **MUST:** Use `interface` for object shapes
- **MUST:** Use `type` for unions/intersections
- **MUST:** Prefer `const` over `let`, avoid `var`
- **MUST:** Add explicit return types for public/exported functions

**Example:**

```typescript
// ✅ GOOD
export function getUserData(id: string): Promise<User> {
  // ...
}

// ❌ BAD
export function getUserData(id) {
  // ...
}
```

### React Rules

- **MUST:** Use functional components only (no class components)
- **MUST:** Use hooks for state (not class state)
- **MUST:** Define props interfaces explicitly
- **MUST:** Use PascalCase for component files (`UserProfile.tsx`)
- **MUST:** Use camelCase with `use` prefix for hook files (`useAuth.ts`)

**Example:**

```typescript
// ✅ GOOD
interface UserProfileProps {
  userId: string;
  onUpdate: (user: User) => void;
}

export function UserProfile({ userId, onUpdate }: UserProfileProps) {
  // ...
}

// ❌ BAD
export class UserProfile extends React.Component {
  // ...
}
```

### File Organization

- **MUST:** Co-locate related files
- **MUST:** One component per file
- **MUST:** Use index files for public exports
- **MUST:** Place tests alongside source: `*.test.tsx` or `*.spec.tsx`

**Structure:**

```
components/
├── UserProfile.tsx
├── UserProfile.test.tsx
└── index.ts
```

### Naming Conventions

- **Components:** PascalCase (`UserProfile`, `PaymentForm`)
- **Hooks:** camelCase with `use` prefix (`useAuth`, `usePayments`)
- **Functions:** camelCase (`getUserData`, `formatCurrency`)
- **Constants:** UPPER_SNAKE_CASE (`API_BASE_URL`, `MAX_RETRIES`)
- **Types/Interfaces:** PascalCase (`User`, `ApiResponse`, `PaymentStatus`)
- **Files:** Match export (component files = PascalCase, utility files = camelCase)

### Tailwind CSS v4 (CRITICAL)

- **MUST:** Always use v4 syntax - Refer to Tailwind v4 documentation
- **MUST NOT:** Use v3 syntax - This is a hard requirement
- **MUST:** Use inline utility classes (POC-1)
- **MUST:** Use design system components (POC-2+)

**Example:**

```tsx
// ✅ GOOD (Tailwind v4)
<div className="flex items-center gap-4 p-6 bg-white rounded-lg">

// ❌ BAD (Tailwind v3 - don't use)
<div className="flex items-center gap-4 p-6 bg-white rounded-lg">
```

---

## Project Structure

```
web-mfe-fullstack-workspace/
├── apps/
│   ├── frontend/
│   │   ├── shell/              # Host (Port 4200)
│   │   ├── auth-mfe/           # Remote (Port 4201)
│   │   ├── payments-mfe/       # Remote (Port 4202)
│   │   └── admin-mfe/          # Remote (Port 4203)
│   └── backend/
│       ├── api-gateway/        # Gateway (Port 3000)
│       ├── auth-service/       # Service (Port 3001)
│       ├── payments-service/   # Service (Port 3002)
│       ├── admin-service/      # Service (Port 3003)
│       └── profile-service/    # Service (Port 3004)
├── libs/
│   ├── frontend/shared-*       # Frontend shared libraries
│   └── backend/shared-*        # Backend shared libraries
└── docs/
```

### Structure Rules

- **Apps:** Application entry points (shell, auth-mfe, etc.)
- **Libs:** Reusable libraries (`libs/frontend/shared-*`, `libs/backend/shared-*`)
- **MUST NOT:** Create circular dependencies (use dependency graph to verify)

---

## Testing Requirements

### Test Types & Tools

- **Unit Tests:** Vitest + React Testing Library (60-70% coverage target)
- **Integration Tests:** Vitest + Supertest for API endpoints
- **E2E Tests:** Playwright for critical user flows
- **MUST:** Write tests alongside code (not after)
- **MUST:** Maintain coverage (60% POC-0, 70% POC-2, 75% POC-3+)

### Test Organization

- **MUST:** Place tests alongside source: `*.test.tsx` or `*.spec.tsx`
- **MUST:** Match test file to source: `Component.tsx` → `Component.test.tsx`

**Example:**

```typescript
// UserProfile.tsx
export function UserProfile({ userId }: Props) { ... }

// UserProfile.test.tsx
import { render, screen } from '@testing-library/react';
import { UserProfile } from './UserProfile';

describe('UserProfile', () => {
  it('renders user data', () => {
    // ...
  });
});
```

---

## Security Rules

### Authentication & Authorization

- **MUST:** Use JWT tokens (stateless)
- **MUST NOT:** Store sensitive tokens in localStorage (use httpOnly cookies or secure storage)
- **MUST:** Implement RBAC: ADMIN, CUSTOMER, VENDOR roles
- **MUST:** Protect routes in shell app
- **MUST:** Add authentication middleware at API Gateway

### Input Validation

- **MUST:** Validate all inputs with Zod schemas
- **MUST:** Use React Hook Form + Zod (frontend)
- **MUST:** Use Zod schemas in validators (backend)
- **MUST:** Combine TypeScript + runtime validation

**Example:**

```typescript
// ✅ GOOD
const userSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

type User = z.infer<typeof userSchema>;
```

### Security Headers

- **MUST:** Use Helmet middleware (backend)
- **MUST:** Configure CORS properly
- **MUST:** Use React's built-in XSS protection
- **MUST:** Implement CSRF protection (token-based)
- **MUST:** Add rate limiting at API Gateway

---

## Error Handling

### Frontend

- **MUST:** Use React Error Boundaries for component errors
- **MUST:** Use TanStack Query error handling for API errors
- **MUST:** Implement global error handler for unhandled errors
- **MUST:** Show user-friendly messages (no technical details exposed)

### Backend

- **MUST:** Use Express error middleware (centralized)
- **MUST:** Return structured error responses (consistent format)
- **MUST:** Log errors with Winston
- **MUST:** Use proper HTTP status codes

---

## Documentation

- **MUST:** Create ADRs (Architecture Decision Records) in `docs/adr/`
- **MUST:** Write code comments explaining "why" not "what"
- **MUST:** Add README to each app/lib
- **MUST:** Make type definitions self-documenting with TypeScript
- **MUST:** Follow API documentation standards (POC-2+)

---

## Performance

### Frontend

- **MUST:** Use code splitting (Module Federation enables dynamic loading)
- **MUST:** Use lazy loading (route-based code splitting)
- **MUST:** Use caching (TanStack Query)
- **MUST:** Optimize bundles (Vite)

### Backend

- **MUST:** Add database indexes (proper indexes for queries)
- **MUST:** Use connection pooling (Prisma)
- **MUST:** Use caching (Redis query result caching - POC-3)
- **MUST:** Use load balancing (nginx - POC-3)

---

## Development Workflow

### Nx Commands

- `nx serve <project-name>` - Start dev server
- `nx build <project-name>` - Build project
- `nx test <project-name>` - Run tests
- `nx lint <project-name>` - Lint code
- `nx run-many --target=serve --projects=shell,auth-mfe --parallel` - Run multiple
- `nx affected:test` - Test affected projects
- `nx affected:build` - Build affected projects

### Code Generation

- **MUST:** Use Nx generators: `nx generate @nx/react:application shell`
- **MUST:** Follow project structure
- **MUST:** Follow naming conventions

---

## POC Phase Rules

### POC-0 (Current Phase)

- **Scope:** Shell + Hello Remote + Module Federation v2
- **MUST NOT:** Add backend (comes in POC-2)
- **MUST NOT:** Add routing (comes in POC-1)
- **MUST NOT:** Add state management (comes in POC-1)

### POC-1

- **Scope:** Auth MFE + Payments MFE + Routing + State Management
- **MUST:** Use mock APIs (no real backend)
- **MUST:** Use Tailwind v4 syntax (not v3)

### POC-2

- **Scope:** Backend integration + Design System + Event Bus
- **MUST:** Use shared database (POC-3 separates)

### POC-3

- **Scope:** Infrastructure + Performance + Enhanced Observability
- **MUST:** Use separate databases (each service has its own database)

---

## Before Committing Code

**MUST verify:**

1. ✅ TypeScript compiles without errors
2. ✅ ESLint passes (`nx lint <project-name>`)
3. ✅ Tests pass (`nx test <project-name>`)
4. ✅ Production build works (`nx build <project-name>`)
5. ✅ No `any` types (unless documented)
6. ✅ No throw-away code
7. ✅ Tests written alongside code
8. ✅ Follows naming conventions
9. ✅ Follows project structure

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

---

## Quick Reference

### Creating a New Component

```typescript
// 1. Create component file: UserProfile.tsx
interface UserProfileProps {
  userId: string;
}

export function UserProfile({ userId }: UserProfileProps): JSX.Element {
  return <div>...</div>;
}

// 2. Create test file: UserProfile.test.tsx
// 3. Export from index.ts if needed
```

### Creating a New Hook

```typescript
// 1. Create hook file: useAuth.ts
export function useAuth() {
  // ...
}

// 2. Create test file: useAuth.test.ts
```

### Creating a Shared Library

```bash
# Frontend library
nx generate @nx/react:library shared-ui --bundler=vite

# Backend library
nx generate @nx/js:library shared-utils --bundler=tsc
```

---

## References

- Architecture: `docs/mfe-poc0-architecture.md`, `docs/fullstack-architecture.md`
- Tech Stack: `docs/mfe-poc0-tech-stack.md`
- ADRs: `docs/adr/README.md`
- Testing: `docs/testing-strategy-poc-phases.md`
- Security: `docs/security-strategy-banking.md`
- Implementation: `docs/POC-0-Implementation/implementation-plan.md`
- Task List: `docs/POC-0-Implementation/task-list.md`

---

**Remember:** Production-ready code only. No shortcuts, no throw-away code. Everything must carry forward to Production.
