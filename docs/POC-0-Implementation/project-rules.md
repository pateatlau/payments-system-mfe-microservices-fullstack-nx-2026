# Project Rules - MFE Microservices Full-Stack Platform

**Status:** Authoritative  
**Version:** 1.0  
**Date:** 2026-01-XX  
**Phase:** POC-0

---

## 1. Core Development Principles

### 1.1 Production-Ready Code

- **NO throw-away code** - All code must be production-ready and carry forward to POC-1, POC-2, POC-3, MVP, and Production
- Avoid temporary solutions, quick fixes, or "just for POC" code
- Every technology choice must be production-ready from day one
- Code quality standards apply from the first commit

### 1.2 Type Safety First

- **TypeScript throughout** - No JavaScript unless absolutely necessary
- **Never use `any` type** - Unless absolutely necessary with documented justification
- **Fix type errors immediately** - Don't work around them, fix them
- **Shared types** - Use `libs/frontend/shared-types` and `libs/backend/shared-types` for cross-boundary types
- **Runtime validation** - Use Zod schemas where runtime validation is needed

### 1.3 Code Quality Standards

- **DRY (Don't Repeat Yourself)** - Eliminate redundant code
- **KISS (Keep It Simple, Stupid)** - Prefer simple solutions over complex ones
- **Self-Documenting Code** - Descriptive naming, clear structure
- **Clean Code** - Readable, maintainable, testable
- **Zero Technical Debt** - Address issues immediately, don't accumulate debt

### 1.4 Architecture Patterns

- **Microfrontends** - Shell (host) + Remote MFEs (Auth, Payments, Admin)
- **Module Federation v2** - Runtime code sharing, independent deployments
- **Microservices** - API Gateway + Services (Auth, Payments, Admin, Profile)
- **Event-Driven** - Event bus (frontend) and Event hub (backend) for decoupling
- **Shared Libraries** - Reusable code in `libs/` directory

---

## 2. Technology Stack Rules

### 2.1 Frontend Stack

- **React:** 19.2.0 (latest stable) - Must match React DOM version
- **Nx:** Latest - Monorepo management, build caching
- **Vite:** 6.x - Bundler, dev server
- **Module Federation:** @module-federation/enhanced 0.21.6 (BIMF)
- **Routing:** React Router 7.x (POC-1+)
- **State:** Zustand 4.5.x (client), TanStack Query 5.x (server) (POC-1+)
- **Styling:** Tailwind CSS 4.0+ - **CRITICAL: Always use v4 syntax, never v3**
- **Forms:** React Hook Form 7.52.x + Zod 3.23.x (POC-1+)
- **HTTP:** Axios 1.7.x (POC-2+)
- **Testing:** Vitest 2.0.x, React Testing Library 16.1.x, Playwright

### 2.2 Backend Stack

- **Node.js:** 24.11.x LTS - Latest LTS version
- **Framework:** Express 4.x - Web framework
- **Database:** PostgreSQL 16.x - Relational database
- **ORM:** Prisma 5.x - Database ORM
- **Auth:** JWT 9.x - Stateless authentication
- **Event Hub:** Redis Pub/Sub (POC-2) → RabbitMQ (POC-3)
- **Testing:** Vitest 2.0.x, Supertest 7.x

### 2.3 Infrastructure

- **Package Manager:** pnpm 9.x - Unified across frontend and backend
- **Monorepo:** Nx - Single workspace for frontend and backend
- **Reverse Proxy:** nginx (POC-3)
- **CI/CD:** GitHub Actions

### 2.4 Version Compatibility

- All versions must be compatible with each other
- Check version compatibility matrix before upgrading
- Use exact versions in package.json (no `^` or `~` for critical dependencies)
- Document version upgrade decisions in ADRs

---

## 3. Code Style & Conventions

### 3.1 TypeScript Rules

- **Strict mode enabled** - No exceptions
- **No `any` types** - Documented exceptions only
- **Interfaces for object shapes** - Use `interface` for object types
- **Types for unions/intersections** - Use `type` for complex types
- **Const over let** - Prefer `const`, avoid `var`
- **Explicit return types** - For public functions and exported functions

### 3.2 React Rules

- **Functional components only** - No class components
- **Hooks for state** - Use hooks, not class state
- **Props interfaces** - Define props interfaces explicitly
- **Component files:** PascalCase (e.g., `UserProfile.tsx`)
- **Hook files:** camelCase with `use` prefix (e.g., `useAuth.ts`)

### 3.3 File Organization

- **Co-locate related files** - Keep related files together
- **One component per file** - Don't export multiple components from one file
- **Index files for exports** - Use index.ts for public API
- **Tests alongside source** - `*.test.tsx` or `*.spec.tsx` next to source files

### 3.4 Naming Conventions

- **Components:** PascalCase (`UserProfile`)
- **Hooks:** camelCase with `use` prefix (`useAuth`)
- **Functions:** camelCase (`getUserData`)
- **Constants:** UPPER_SNAKE_CASE (`API_BASE_URL`)
- **Types/Interfaces:** PascalCase (`User`, `ApiResponse`)
- **Files:** Match export (component files = PascalCase, utility files = camelCase)

### 3.5 Tailwind CSS v4 Rules

- **CRITICAL: Always use v4 syntax** - Refer to Tailwind v4 documentation
- **Never use v3 syntax** - This is a hard requirement
- **Inline utility classes** - For POC-1 (no design system yet)
- **Design system components** - For POC-2+ (shadcn/ui)

---

## 4. Project Structure Rules

### 4.1 Monorepo Structure

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
│   ├── frontend/
│   │   ├── shared-utils/
│   │   ├── shared-types/
│   │   ├── shared-auth-store/
│   │   ├── shared-api-client/
│   │   ├── shared-event-bus/
│   │   └── shared-design-system/
│   └── backend/
│       ├── shared-types/
│       ├── shared-utils/
│       └── shared-event-hub/
└── docs/
```

### 4.2 Package Organization

- **Apps:** Application entry points (shell, auth-mfe, etc.)
- **Libs:** Reusable libraries (shared-utils, shared-types, etc.)
- **Tools:** Nx generators, executors
- **Docs:** Documentation, ADRs

### 4.3 Shared Libraries Rules

- **Frontend libs:** `libs/frontend/shared-*`
- **Backend libs:** `libs/backend/shared-*`
- **Cross-boundary types:** Can be in both or consolidated
- **No circular dependencies** - Use dependency graph to verify

---

## 5. Testing Rules

### 5.1 Testing Requirements

- **Unit Tests:** Vitest + React Testing Library (60-70% coverage target)
- **Integration Tests:** Vitest + Supertest for API endpoints
- **E2E Tests:** Playwright for critical user flows
- **Write tests alongside code** - Not after, alongside
- **Maintain coverage** - Don't let coverage drop

### 5.2 Test Organization

- **Tests alongside source** - `*.test.tsx` or `*.spec.tsx` next to source
- **Test files match source** - `Component.tsx` → `Component.test.tsx`
- **Test utilities** - Shared test utilities in `libs/shared-test-utils` (if needed)

### 5.3 Coverage Targets

- **POC-0:** 60% coverage
- **POC-2:** 70% coverage
- **POC-3+:** 75% coverage

---

## 6. Security Rules

### 6.1 Authentication & Authorization

- **JWT tokens** - Stateless authentication
- **Secure token storage** - No localStorage for sensitive tokens (use httpOnly cookies or secure storage)
- **RBAC** - Role-Based Access Control (ADMIN, CUSTOMER, VENDOR)
- **Protected routes** - Route protection in shell app
- **API Gateway auth** - Authentication middleware at gateway

### 6.2 Input Validation

- **Zod schemas** - All inputs must be validated with Zod
- **Frontend validation** - React Hook Form + Zod
- **Backend validation** - Zod schemas in validators
- **Type safety** - TypeScript + runtime validation

### 6.3 Security Headers

- **Helmet middleware** - Security headers on backend
- **CORS configuration** - Proper CORS setup
- **XSS protection** - React's built-in escaping
- **CSRF protection** - Token-based protection

### 6.4 Rate Limiting

- **API Gateway level** - Rate limiting at gateway
- **Per-route limits** - Different limits for different routes
- **User-based limits** - Per-user rate limiting

---

## 7. Error Handling Rules

### 7.1 Frontend Error Handling

- **React Error Boundaries** - For component errors
- **TanStack Query error handling** - For API errors
- **Global error handler** - For unhandled errors
- **User-friendly messages** - Don't expose technical details to users

### 7.2 Backend Error Handling

- **Express error middleware** - Centralized error handling
- **Structured error responses** - Consistent error format
- **Winston logging** - Error logging
- **Proper HTTP status codes** - Use appropriate status codes

---

## 8. Documentation Rules

### 8.1 Code Documentation

- **ADRs** - Architecture Decision Records in `docs/adr/`
- **Code comments** - Explain "why" not "what"
- **README files** - Each app/lib should have a README
- **Type definitions** - Self-documenting with TypeScript

### 8.2 API Documentation

- **Backend API docs** - Follow API documentation standards
- **OpenAPI/Swagger** - API specification (POC-2+)
- **Type definitions** - Shared types for API contracts

---

## 9. Performance Rules

### 9.1 Frontend Performance

- **Code splitting** - Module Federation enables dynamic loading
- **Lazy loading** - Route-based code splitting
- **Caching** - TanStack Query caching
- **Bundle optimization** - Vite optimizations

### 9.2 Backend Performance

- **Database indexing** - Proper indexes for queries
- **Connection pooling** - Prisma connection pooling
- **Caching** - Redis query result caching (POC-3)
- **Load balancing** - nginx load balancing (POC-3)

---

## 10. Development Workflow Rules

### 10.1 Nx Commands

- **Serve:** `nx serve <project-name>`
- **Build:** `nx build <project-name>`
- **Test:** `nx test <project-name>`
- **Lint:** `nx lint <project-name>`
- **Run many:** `nx run-many --target=serve --projects=shell,auth-mfe --parallel`
- **Affected:** `nx affected:test`, `nx affected:build`

### 10.2 Code Generation

- **Use Nx generators** - `nx generate @nx/react:application shell`
- **Follow structure** - Maintain consistent project structure
- **Naming conventions** - Follow naming conventions

### 10.3 Git Workflow

- **Feature branches** - Create feature branches for new features
- **Commit messages** - Clear, descriptive commit messages
- **Pull requests** - Code review required
- **CI/CD** - Automated testing and builds

---

## 11. POC Phase Rules

### 11.1 POC-0 Rules

- **Scope:** Foundation - Shell + Hello Remote + Module Federation v2
- **Focus:** Architecture validation, Module Federation setup
- **No backend** - Backend comes in POC-2
- **No routing** - Routing comes in POC-1
- **No state management** - State management comes in POC-1

### 11.2 POC-1 Rules

- **Scope:** Auth MFE + Payments MFE + Routing + State Management
- **Focus:** Authentication flow, payment operations (stubbed)
- **Mock APIs** - No real backend, use mock APIs
- **Tailwind v4** - Use Tailwind v4 syntax (not v3)

### 11.3 POC-2 Rules

- **Scope:** Backend integration + Design System + Event Bus
- **Focus:** Real API integration, JWT auth, inter-MFE communication
- **Shared database** - POC-2 uses shared database (POC-3 separates)

### 11.4 POC-3 Rules

- **Scope:** Infrastructure + Performance + Enhanced Observability
- **Focus:** nginx, WebSocket, GraphQL (optional), caching, monitoring
- **Separate databases** - Each service has its own database

---

## 12. Common Pitfalls to Avoid

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

## 13. When Making Changes

1. **Read existing code** - Understand patterns before changing
2. **Follow project structure** - Maintain consistency
3. **Write tests** - Test alongside code
4. **Update documentation** - Keep docs in sync
5. **Check types** - Ensure TypeScript compiles
6. **Run linter** - Fix ESLint errors
7. **Verify builds** - Ensure production builds work
8. **Test locally** - Verify changes work locally
9. **Update ADRs** - Document architectural decisions

---

## 14. References

- **Architecture:** `docs/mfe-poc0-architecture.md`, `docs/fullstack-architecture.md`
- **Tech Stack:** `docs/mfe-poc0-tech-stack.md`
- **ADRs:** `docs/adr/README.md`
- **Testing:** `docs/testing-strategy-poc-phases.md`
- **Security:** `docs/security-strategy-banking.md`
- **Implementation Plan:** `docs/POC-0-Implementation/implementation-plan.md`

---

**Remember:** These rules ensure consistency, quality, and maintainability. Follow them strictly to maintain a production-ready codebase that scales from POC to Production.
