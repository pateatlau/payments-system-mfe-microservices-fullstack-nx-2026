# MFE POC-3 Tech Stack - Production-Ready & Scalable

**Status:** Authoritative  
**Version:** 1.0  
**Date:** 2026-01-XX

---

## 1. Philosophy & Principles

### 1.1 Core Principles

**No Throw-Away Code:**

- Every technology choice must be production-ready
- All code written in POC-3 must carry forward to MVP and Production
- Avoid temporary solutions or "quick fixes"
- Choose technologies with long-term support and active development

**Scalability First:**

- Technologies must scale from POC to Production
- Architecture must support enterprise-level requirements
- Performance optimizations built-in, not bolted-on
- Production-ready infrastructure

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

| Category              | Technology                  | Version     | Platform | Production-Ready                     | Notes |
| --------------------- | --------------------------- | ----------- | -------- | ------------------------------------ | ----- |
| **Core Framework**    |
| React                 | 19.2.0                      | Web         | ✅       | Latest stable, future-proof          |
| React DOM             | 19.2.0                      | Web         | ✅       | Must match React version             |
| **Monorepo**          |
| Nx                    | Latest                      | All         | ✅       | Scalable, build caching              |
| **Bundling & Build**  |
| Vite                  | 6.x                         | Web         | ✅       | Fast dev server, excellent DX        |
| TypeScript            | 5.9.x                       | All         | ✅       | React 19 support                     |
| **Module Federation** |
| @module-federation/enhanced | 0.21.6              | Web         | ✅       | BIMF (Module Federation v2)          |
| **Routing**           |
| React Router          | 7.x                         | Web         | ✅       | Latest, production-ready             |
| **State Management (Client)** |
| Zustand               | 4.5.x                       | Web         | ✅       | Client state (auth, UI, theme)       |
| **State Management (Server)** |
| TanStack Query        | 5.x                         | Web         | ✅       | Server state (API data, caching)     |
| **Event Bus**         |
| Custom Event Bus      | -                           | Web         | ✅       | Inter-MFE communication (POC-2+)    |
| **Styling**           |
| Tailwind CSS          | 4.0+                        | Web         | ✅       | Latest, 5x faster builds, modern CSS |
| **Design System**     |
| shadcn/ui             | Latest                      | Web         | ✅       | Production-ready component library  |
| **Form Handling**     |
| React Hook Form       | 7.52.x                      | Web         | ✅       | Industry standard, performant        |
| **Validation**        |
| Zod                   | 3.23.x                      | Web         | ✅       | TypeScript-first, runtime validation |
| **Storage**           |
| localStorage          | Native                      | Web         | ✅       | Browser API                          |
| **HTTP Client**       |
| Axios                 | 1.7.x                       | Web         | ✅       | Production-ready, interceptors       |
| **API (GraphQL)**    |
| Apollo Client / urql  | Latest                      | Web         | ✅       | GraphQL client (optional)            |
| **WebSocket**         |
| Native WebSocket API  | Native                      | Web         | ✅       | Real-time updates                     |
| **Caching**           |
| Service Worker / Workbox | Latest                  | Web         | ✅       | Advanced caching strategies          |
| **Infrastructure**    |
| nginx                 | Latest                      | All         | ✅       | Reverse proxy, load balancing, SSL    |
| **Monitoring**        |
| Sentry                | Latest                      | Web         | ✅       | Error tracking, performance monitoring |
| **Error Handling**    |
| react-error-boundary  | 4.0.13                      | Web         | ✅       | React 19 compatible                   |
| **Testing**           |
| Vitest                | 2.0.x                       | Web         | ✅       | Fast, Vite-native                    |
| React Testing Library | 16.1.x                      | Web         | ✅       | Works with Vitest                    |
| **E2E Testing**       |
| Playwright            | Latest                      | Web         | ✅       | Modern, fast, reliable               |
| **Code Quality**      |
| ESLint                | 9.x                         | All         | ✅       | Latest, flat config                  |
| Prettier              | 3.3.x                       | All         | ✅       | Code formatting                      |
| TypeScript ESLint     | 8.x                         | All         | ✅       | TS-specific linting                  |
| **SAST**              |
| SonarQube             | Latest                      | All         | ✅       | Code quality, security analysis      |
| **CI/CD**             |
| GitHub Actions        | Native                      | All         | ✅       | Free, scalable                       |
| **Package Management** |
| pnpm                  | 9.x                         | All         | ✅       | Recommended for Nx                   |
| **Node.js**           |
| Node.js               | 24.11.x LTS                 | All         | ✅       | Latest LTS, SWC support              |

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

---

### 3.6 State Management

#### Architecture: Client State + Server State + Inter-MFE Communication

**Three-Tier State Management:**

- **Zustand** - Client-side state (auth, UI, theme) - MFE-local only
- **TanStack Query** - Server-side state (API data, caching)
- **Event Bus** - Inter-MFE communication (decoupled)

**POC-3 Implementation:**

- ✅ Event bus for inter-MFE communication (decouples MFEs)
- ✅ Zustand only for state within single MFEs (no shared stores)
- ✅ TanStack Query for server state (with real backend)

---

#### Zustand 4.5.x (Client State)

**Rationale:**

- Lightweight and performant
- Excellent TypeScript support
- No provider wrapping needed
- Scales well to complex state

**POC-3 Usage:**

- ✅ Zustand only for state within single MFEs (decoupled)
- ❌ No shared Zustand stores across MFEs
- ✅ Event bus for inter-MFE communication

**Carry Forward:** ✅ Yes - Production-ready, scales to complex state

---

#### TanStack Query 5.x (Server State)

**Rationale:**

- Server state management - Designed for API data, caching, synchronization
- Works with real backend API
- Production-ready - Industry standard for server state
- Excellent TypeScript support - Type-safe queries and mutations

**POC-3 Implementation:**

- Real backend API integration
- Advanced caching strategies
- Background updates
- Optimistic updates

**Carry Forward:** ✅ Yes - Production-ready, patterns carry forward

---

#### Event Bus (Inter-MFE Communication)

**Rationale:**

- **Decouples MFEs** - MFEs communicate via events, not shared state
- **Loose coupling** - MFEs don't need to know about each other
- **Scalability** - Easy to add/remove MFEs without breaking others
- **Production-ready pattern** - Industry standard for microfrontend communication

**POC-3 Implementation:**

- ✅ Event bus for inter-MFE communication
- ✅ Zustand only for state within single MFEs
- ✅ MFEs publish/subscribe to events

**Carry Forward:** ✅ Yes - Event bus is production-ready pattern for microfrontend communication

---

### 3.7 Styling

#### Tailwind CSS 4.0+

**Rationale:**

- **Latest version** - Released January 2025, production-ready
- **5x faster full builds, 100x+ faster incremental builds** - Massive performance improvement
- **Modern CSS features** - Cascade layers, `color-mix()`, container queries
- **Simplified setup** - Zero configuration, fewer dependencies
- **Future-proof** - Latest version with long-term support

**POC-3 Implementation:**

- Design system using Tailwind + shadcn/ui
- Reusable component library
- Consistent design tokens
- Shared component patterns

**Carry Forward:** ✅ Yes - Latest version, better performance, future-proof

---

#### shadcn/ui (Design System)

**Rationale:**

- Production-ready component library
- Built on Tailwind CSS v4
- Accessible by default
- TypeScript-first
- Customizable

**Features:**

- Reusable components
- Design tokens
- Consistent styling
- Accessibility built-in

**Carry Forward:** ✅ Yes - Production-ready design system

---

### 3.8 Infrastructure

#### nginx

**Reference:** See `docs/adr/poc-3/0001-nginx-reverse-proxy.md` for decision rationale, alternatives considered, and trade-offs.

**Rationale:**

- Production-ready reverse proxy
- Load balancing
- SSL/TLS termination
- Rate limiting
- Security headers

**POC-3 Implementation:**

- Reverse proxy for API Gateway
- Load balancing for MFEs
- SSL/TLS termination (self-signed certificates)
- Rate limiting
- Security headers

**Carry Forward:** ✅ Yes - Production-ready infrastructure

---

### 3.9 Real-Time Communication

#### WebSocket (Native API)

**Reference:** See `docs/adr/poc-3/0002-websocket-for-realtime.md` for decision rationale, alternatives considered, and trade-offs.

**Rationale:**

- Real-time updates
- Low latency
- Bidirectional communication
- Native browser API

**POC-3 Implementation:**

- WebSocket client library
- Connection management
- Reconnection logic
- Message handling
- Integration with event bus

**Carry Forward:** ✅ Yes - Production-ready real-time communication

---

### 3.10 Caching

#### Service Worker / Workbox

**Rationale:**

- Advanced caching strategies
- Offline support
- Performance optimization
- Production-ready

**POC-3 Implementation:**

- Browser caching
- CDN caching
- Service Worker caching
- Application-level caching

**Carry Forward:** ✅ Yes - Production-ready caching strategies

---

### 3.11 Monitoring

#### Sentry

**Rationale:**

- Error tracking
- Performance monitoring
- User session replay
- Production-ready

**POC-3 Implementation:**

- Error tracking
- Performance monitoring
- Infrastructure monitoring
- Basic analytics

**Carry Forward:** ✅ Yes - Production-ready monitoring

---

### 3.12 Testing

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

---

### 3.13 Code Quality & SAST

#### ESLint 9.x

**Rationale:**

- Latest version with flat config
- Production-ready
- Large ecosystem
- TypeScript support
- React rules
- Security rules (POC-3)

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

#### SonarQube

**Rationale:**

- Code quality analysis
- Security vulnerability detection
- Code coverage tracking
- Technical debt measurement
- Production-ready

**POC-3 Implementation:**

- Comprehensive code analysis
- Security hotspot detection
- Quality gates
- Coverage tracking (>= 80%)

**Carry Forward:** ✅ Yes - Production-ready code quality tool

---

## 4. Version Compatibility Matrix

| Technology             | Version | React 19 | Vite 6 | Module Federation v2 | Notes |
| ---------------------- | ------- | -------- | ------ | -------------------- | ----- |
| React                  | 19.2.0  | ✅       | ✅     | ✅                   | Core  |
| React Router           | 7.x     | ✅       | ✅     | ✅                   | Web   |
| Zustand                | 4.5.x   | ✅       | ✅     | ✅                   | All   |
| TanStack Query         | 5.x     | ✅       | ✅     | ✅                   | All   |
| Tailwind CSS           | 4.0+    | ✅       | ✅     | ✅                   | Web   |
| shadcn/ui              | Latest  | ✅       | ✅     | ✅                   | Web   |
| React Hook Form        | 7.52.x  | ✅       | ✅     | ✅                   | All   |
| Zod                    | 3.23.x  | ✅       | ✅     | ✅                   | All   |
| Axios                  | 1.7.x   | ✅       | ✅     | ✅                   | All   |
| Vitest                 | 2.0.x   | ✅       | ✅     | ✅                   | Web   |
| Playwright             | Latest  | ✅       | ✅     | ✅                   | Web   |
| nginx                  | Latest  | ✅       | ✅     | ✅                   | Infra |
| Sentry                 | Latest  | ✅       | ✅     | ✅                   | Monitor|

---

## 5. Implementation Phases

### Phase 1: Infrastructure & nginx (POC-3)

- Setup nginx
- Configure reverse proxy
- Setup SSL/TLS (self-signed certificates)
- Configure load balancing
- Setup rate limiting

### Phase 2: GraphQL (Optional, POC-3)

- Setup GraphQL server (if implementing)
- Configure Apollo Client or urql
- Create GraphQL schema
- Test GraphQL queries

### Phase 3: WebSocket (POC-3)

- Create WebSocket client library
- Implement connection management
- Add reconnection logic
- Integrate with event bus

### Phase 4: Caching & Performance (POC-3)

- Setup Service Worker
- Configure browser caching
- Setup CDN caching (if applicable)
- Implement code splitting
- Optimize bundle sizes

### Phase 5: Observability & Analytics (POC-3)

- Integrate Sentry
- Setup error tracking
- Setup performance monitoring
- Implement infrastructure monitoring
- Create basic analytics library

### Phase 6: Session Management (POC-3)

- Implement cross-tab sync
- Implement cross-device sync (basic)
- Setup session timeout
- Test session synchronization

---

## 6. Future Enhancements (Post-POC-3)

### MVP Phase

- Real SSL certificates (replacing self-signed)
- Enhanced security monitoring
- Advanced analytics
- Performance optimizations
- Real PSP integration (payment processing)

### Production Phase

- Advanced monitoring (Datadog, etc.)
- Advanced analytics integration
- A/B testing framework
- Advanced caching strategies
- CDN integration
- Advanced security (MFA, etc.)

---

## 7. Migration Path

**All technologies chosen have clear upgrade paths:**

- React 19 → React 20 (when available)
- Vite 6 → 7 (when available)
- Module Federation v2 → Latest (continuous updates)
- Vitest 2.0 → 3.0 (when available)
- Playwright → Latest (continuous updates)
- nginx → Latest (continuous updates)
- Sentry → Latest (continuous updates)

**No breaking changes expected in POC-3 → MVP → Production transition.**

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

**Everything carries forward from POC-3 through Production.**

---

## 9. Related Documents

- `docs/mfe-poc3-architecture.md` - POC-3 architecture and implementation plan
- `docs/mfe-poc0-architecture.md` - POC-0 foundation
- `docs/mfe-poc1-architecture.md` - POC-1 authentication & payments
- `docs/mfe-poc2-architecture.md` - POC-2 backend integration, design system & basic observability
- `docs/backend-architecture.md` - Backend architecture
- `docs/backend-event-hub-implementation-plan.md` - Event hub implementation plan
- `docs/session-management-strategy.md` - Session management details
- `docs/observability-analytics-phasing.md` - Observability and analytics phasing strategy
- `docs/testing-strategy-poc-phases.md` - Comprehensive testing strategy
- `docs/sast-implementation-plan.md` - SAST implementation plan (Git hooks & CI/CD)

---

**Last Updated:** 2026-01-XX  
**Status:** Authoritative Tech Stack

