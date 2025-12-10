# POC-3 Implementation Planning - New Session Prompt

Use this prompt when starting a new chat session to plan POC-3 implementation.

---

## 📖 How to Use This Prompt

This document provides the implementation planning prompt for POC-3.

### **Current Status: POC-2 Complete** ✅

POC-2 has been **completed** with all deliverables:

- ✅ Real backend API integration (REST API)
- ✅ Real JWT authentication (backend Auth Service)
- ✅ Event bus for inter-MFE communication (Redis Pub/Sub)
- ✅ Admin MFE (port 4203, ADMIN role)
- ✅ Design system (shadcn/ui + Tailwind CSS v4)
- ✅ Backend services (API Gateway, Auth, Payments, Admin, Profile)
- ✅ Database (PostgreSQL + Prisma ORM - shared database)
- ✅ Event Hub (Redis Pub/Sub for inter-service communication)
- ✅ API client library (shared Axios client with interceptors)
- ✅ Testing (380+ tests, 70%+ coverage)
- ✅ System health monitoring (including Redis health check)

**Ready to proceed with POC-3 Implementation Planning**

---

### **How to Use**

1. **Open a new chat session**
2. **Copy and paste the "POC-3 Implementation Planning Prompt"** section below
3. The prompt will reference POC-2 completion and POC-3 architecture documentation
4. Focus on creating implementation plan, task breakdown, and documentation

### **Quick Reference**

| Document                     | Status       | Location                                                  |
| ---------------------------- | ------------ | --------------------------------------------------------- |
| POC-2 Implementation Plan    | ✅ Complete  | `docs/POC-2-Implementation/implementation-plan.md`        |
| POC-2 Task List              | ✅ Complete  | `docs/POC-2-Implementation/task-list.md`                  |
| POC-2 Completion Summary     | ✅ Complete  | `docs/POC-2-Implementation/poc-2-completion-summary.md`   |
| Frontend POC-3 Architecture  | 📋 Reference | `docs/References/mfe-poc3-architecture.md`                |
| Frontend POC-3 Tech Stack    | 📋 Reference | `docs/References/mfe-poc3-tech-stack.md`                  |
| Backend POC-3 Architecture   | 📋 Reference | `docs/References/backend-poc3-architecture.md`            |
| Backend POC-3 Tech Stack     | 📋 Reference | `docs/References/backend-poc3-tech-stack.md`              |
| Full-Stack Architecture      | 📋 Reference | `docs/References/fullstack-architecture.md`               |
| API Gateway Proxy (Deferred) | 📋 Reference | `docs/POC-3-Planning/api-gateway-proxy-implementation.md` |
| POC-3 Implementation Plan    | 📋 To Create | `docs/POC-3-Implementation/implementation-plan.md`        |
| POC-3 Task List              | 📋 To Create | `docs/POC-3-Implementation/task-list.md`                  |

---

## Context

**Current State (POC-2 Complete):**

- ✅ Microfrontend architecture with Module Federation v2 (Rspack + HMR)
- ✅ Real JWT authentication (backend Auth Service)
- ✅ Real backend API integration (REST API, all services)
- ✅ Event bus for inter-MFE communication (Redis Pub/Sub)
- ✅ Four MFEs: shell (4200), auth-mfe (4201), payments-mfe (4202), admin-mfe (4203)
- ✅ Design system (shadcn/ui + Tailwind CSS v4)
- ✅ Backend services (API Gateway, Auth, Payments, Admin, Profile)
- ✅ Database (PostgreSQL + Prisma ORM - shared database in POC-2)
- ✅ Event Hub (Redis Pub/Sub for inter-service communication)
- ✅ API client library (shared Axios client with interceptors)
- ✅ 380+ tests passing (Jest + React Testing Library + Playwright)
- ✅ 70%+ test coverage
- ✅ System health monitoring (all services including Redis)
- ⚠️ API Gateway proxy middleware deferred (direct service URLs used)

**POC-3 Goal:**

- Production-ready infrastructure (nginx reverse proxy, load balancing, SSL/TLS)
- Separate databases per service (migrate from shared database)
- Production-ready event hub (RabbitMQ migration from Redis Pub/Sub)
- WebSocket support (real-time updates, session sync)
- Advanced caching strategies (browser, CDN, service worker, Redis)
- Enhanced observability (Sentry, Prometheus, OpenTelemetry)
- Basic analytics (architecture-focused: MFE metrics, API patterns)
- Session management (cross-tab sync, cross-device sync)
- Performance optimizations (code splitting, lazy loading, bundle optimization)
- Optional GraphQL API (alongside REST)
- API Gateway proxy implementation (fix deferred from POC-2)

---

## POC-3 Implementation Planning Prompt

```
I'm starting a new session to plan POC-3 implementation. Please:

1. **Read Context:**

   **POC-2 Completion Documents (CRITICAL - Read First):**
   - Read `docs/POC-2-Implementation/implementation-plan.md` - POC-2 implementation details
   - Read `docs/POC-2-Implementation/task-list.md` - POC-2 completed tasks
   - Read `docs/POC-2-Implementation/poc-2-completion-summary.md` - POC-2 completion summary (if exists)
   - Review `docs/POC-2-Implementation/poc-3-house-cleaning-prompt.md` - House-cleaning activities completed

   **POC-3 Architecture Documents (CRITICAL - Read First):**
   - Read `docs/References/mfe-poc3-architecture.md` - POC-3 frontend architecture
   - Read `docs/References/mfe-poc3-tech-stack.md` - POC-3 frontend tech stack (versions, rationale)
   - Read `docs/References/backend-poc3-architecture.md` - POC-3 backend architecture
   - Read `docs/References/backend-poc3-tech-stack.md` - POC-3 backend tech stack (versions, rationale)
   - Read `docs/References/fullstack-architecture.md` - Full-stack architecture overview (integration patterns)
   - Read `docs/POC-3-Planning/api-gateway-proxy-implementation.md` - API Gateway proxy deferred issue
   - Review existing ADRs in `docs/adr/poc-3/` and `docs/adr/backend/poc-3/` (if any)

   **Reference Documents:**
   - Read `docs/References/mfe-poc2-architecture.md` - POC-2 frontend architecture (baseline)
   - Read `docs/References/backend-poc2-architecture.md` - POC-2 backend architecture (baseline)
   - Read `README.md` - Project overview and current phase
   - Review existing ADRs in `docs/adr/poc-2/` and `docs/adr/backend/poc-2/`

2. **Understand Current State:**
   - POC-2 is complete with real backend integration
   - Shared PostgreSQL database (all services use same database)
   - Redis Pub/Sub for event hub (inter-service communication)
   - Direct service URLs (API Gateway proxy deferred)
   - All backend services implemented and working
   - Frontend fully integrated with backend APIs
   - Design system implemented (shadcn/ui + Tailwind CSS v4)
   - Event bus working for inter-MFE communication

3. **Analyze POC-3 Requirements:**

   **Infrastructure Enhancements:**
   - nginx reverse proxy (load balancing, SSL/TLS termination, request routing)
   - Separate databases per service (migrate from shared PostgreSQL)
   - Production-ready event hub (RabbitMQ migration from Redis Pub/Sub)
   - API Gateway proxy implementation (fix deferred from POC-2)
   - Docker deployment configuration
   - SSL/TLS setup (self-signed certificates for POC-3)

   **Frontend Enhancements:**
   - WebSocket client library (real-time updates)
   - Advanced caching strategies (service worker, browser caching, CDN)
   - Performance optimizations (code splitting, lazy loading, bundle optimization)
   - Session management (cross-tab sync, cross-device sync)
   - Basic analytics (architecture-focused: MFE metrics, API patterns)
   - Optional GraphQL client (if GraphQL API is implemented)
   - Enhanced observability integration (Sentry frontend)

   **Backend Enhancements:**
   - Separate databases per service (migration from shared database)
   - RabbitMQ event hub (migration from Redis Pub/Sub)
   - WebSocket server (real-time updates, session sync)
   - Advanced Redis caching (query result caching, session caching)
   - Optional GraphQL API (alongside REST)
   - Enhanced observability (Sentry, Prometheus, OpenTelemetry)
   - Performance optimizations (database indexing, query optimization, connection pooling)
   - Session management backend (cross-device session sync)

   **Cross-Cutting:**
   - Enhanced observability (error tracking, metrics, tracing)
   - Basic analytics (architecture-focused metrics)
   - Security enhancements (nginx security, WebSocket security, session security)
   - Performance testing and optimization
   - Infrastructure deployment documentation

4. **Create Implementation Plan:**

   **Phase 1: Planning & Architecture Review (Week 1)**
   - Review POC-2 completion and identify migration points
   - Review POC-3 architecture documents
   - Plan database separation strategy (migration from shared to per-service)
   - Plan RabbitMQ migration strategy (from Redis Pub/Sub)
   - Plan nginx configuration and deployment
   - Plan API Gateway proxy implementation (fix deferred issue)
   - Plan WebSocket implementation (frontend and backend)
   - Plan caching strategies (browser, service worker, Redis)
   - Plan observability setup (Sentry, Prometheus, OpenTelemetry)
   - Plan session management architecture
   - Create database migration scripts
   - Create event hub migration scripts
   - Define performance optimization targets
   - Define analytics requirements (architecture-focused)

   **Phase 2: Infrastructure Setup (Week 2-3)**
   - Set up nginx reverse proxy configuration
   - Set up SSL/TLS certificates (self-signed for POC-3)
   - Configure load balancing
   - Set up separate PostgreSQL databases per service
   - Migrate database schemas to separate databases
   - Set up RabbitMQ (replacement for Redis Pub/Sub)
   - Migrate event hub from Redis Pub/Sub to RabbitMQ
   - Update Docker Compose configuration
   - Set up Redis for caching (separate from event hub)
   - Infrastructure testing and validation

   **Phase 3: Backend Enhancements (Week 4-5)**
   - Implement API Gateway proxy (fix deferred from POC-2)
   - Update services to use separate databases
   - Migrate event hub to RabbitMQ
   - Implement WebSocket server
   - Implement advanced Redis caching
   - Implement optional GraphQL API
   - Implement session management backend
   - Set up Sentry error tracking
   - Set up Prometheus metrics
   - Set up OpenTelemetry tracing
   - Update API documentation
   - Backend testing updates

   **Phase 4: Frontend Enhancements (Week 6-7)**
   - Implement WebSocket client library
   - Implement service worker for advanced caching
   - Implement performance optimizations (code splitting, lazy loading)
   - Implement session management (cross-tab, cross-device)
   - Implement basic analytics (architecture-focused)
   - Implement optional GraphQL client (if GraphQL API implemented)
   - Integrate Sentry frontend
   - Update components for WebSocket real-time updates
   - Update API client to use nginx proxy (instead of direct URLs)
   - Frontend testing updates

   **Phase 5: Integration & Testing (Week 8)**
   - Full-stack integration testing
   - WebSocket communication testing
   - Session management testing (cross-tab, cross-device)
   - Performance testing and optimization
   - Load testing (nginx load balancing)
   - Caching strategy validation
   - Observability validation (Sentry, Prometheus, OpenTelemetry)
   - Analytics validation
   - Security testing (nginx, WebSocket, session)
   - Documentation updates
   - Migration guide from POC-2 to POC-3

5. **Documentation Structure:**
   **IMPORTANT:** All documentation created during POC-3 implementation must be saved in `docs/POC-3-Implementation/` folder.

   **To Create During Implementation:**
   - `implementation-plan.md` - Detailed step-by-step plan
   - `task-list.md` - Progress tracking with checkboxes
   - `database-migration-guide.md` - Database separation migration
   - `event-hub-migration-guide.md` - RabbitMQ migration from Redis Pub/Sub
   - `nginx-configuration-guide.md` - nginx setup and configuration
   - `websocket-implementation-guide.md` - WebSocket setup and usage
   - `caching-strategy-guide.md` - Caching patterns and implementation
   - `observability-setup-guide.md` - Sentry, Prometheus, OpenTelemetry setup
   - `session-management-guide.md` - Session sync implementation
   - `performance-optimization-guide.md` - Performance improvements
   - `analytics-implementation-guide.md` - Basic analytics setup
   - `migration-guide-poc2-to-poc3.md` - Migration steps from POC-2
   - `api-gateway-proxy-fix.md` - API Gateway proxy implementation details
   - `developer-workflow-poc3.md` - POC-3 development workflow
   - `testing-guide-poc3.md` - Testing strategy and examples

6. **Key Considerations:**

   **Infrastructure (CRITICAL):**
   - **Database Migration:** Plan careful migration from shared database to separate databases per service
   - **Event Hub Migration:** Migrate from Redis Pub/Sub to RabbitMQ (production-ready)
   - **nginx Configuration:** Production-ready reverse proxy, load balancing, SSL/TLS
   - **API Gateway Proxy:** Fix deferred issue from POC-2 (request body forwarding)
   - **Docker Deployment:** Update Docker Compose for new infrastructure
   - **Environment Configuration:** Update environment variables for new services

   **Frontend-Specific:**
   - **WebSocket Integration:** Real-time updates, session sync
   - **Caching Strategies:** Service worker, browser caching, CDN
   - **Performance:** Code splitting, lazy loading, bundle optimization
   - **Session Management:** Cross-tab and cross-device sync
   - **Analytics:** Architecture-focused metrics (MFE metrics, API patterns)
   - **API Client:** Update to use nginx proxy instead of direct service URLs
   - **GraphQL Client:** Optional implementation if GraphQL API is added

   **Backend-Specific:**
   - **Database Separation:** Migrate to one database per service
   - **Event Hub:** RabbitMQ migration from Redis Pub/Sub
   - **WebSocket Server:** Real-time communication support
   - **Caching:** Advanced Redis caching patterns
   - **Observability:** Sentry, Prometheus, OpenTelemetry integration
   - **Session Management:** Backend support for cross-device sync
   - **GraphQL API:** Optional alongside REST API

   **Cross-Cutting:**
   - **Security:** nginx security, WebSocket security, session security
   - **Testing:** Update tests for new infrastructure, WebSocket, session management
   - **Performance:** Performance testing and optimization across stack
   - **Observability:** Error tracking, metrics, tracing across frontend and backend
   - **Documentation:** Comprehensive documentation for all new features

7. **Migration Strategy:**

   **Database Migration:**
   - Create separate database schemas for each service
   - Migrate data from shared database to separate databases
   - Update Prisma schemas and migrations
   - Update service configurations
   - Test data integrity and service isolation

   **Event Hub Migration:**
   - Set up RabbitMQ infrastructure
   - Migrate event types and handlers from Redis Pub/Sub
   - Update service event publishing and subscribing
   - Test event delivery and reliability
   - Maintain backward compatibility during migration

   **API Gateway Proxy:**
   - Research and select best proxy approach (see `api-gateway-proxy-implementation.md`)
   - Implement proxy with request body streaming
   - Test with all HTTP methods
   - Update frontend to use API Gateway URL
   - Verify authentication token forwarding

   **Infrastructure Migration:**
   - Set up nginx configuration
   - Update Docker Compose for new services
   - Update environment variables
   - Test load balancing and SSL/TLS
   - Update deployment documentation

8. **Follow Rules:**
   - Follow all rules in `.cursorrules`
   - **All documentation must be saved in `docs/POC-3-Implementation/` folder**
   - Reference `docs/POC-3-Implementation/model-selection-strategy.md` for model selection guidance
   - Ask for confirmation before major decisions
   - Document all findings and decisions
   - Update both `task-list.md` and `implementation-plan.md` after each task
   - Commit after each major phase completion
   - Maintain backward compatibility where possible during migrations

**Expected Deliverables:**
- Comprehensive implementation plan with phases and tasks
- Task list for progress tracking (with frontend/backend/infrastructure labels)
- Architecture documentation (infrastructure, frontend, backend, and integration)
- Migration guides (database, event hub, infrastructure)
- nginx configuration guide
- WebSocket implementation guide
- Caching strategy guide
- Observability setup guide
- Session management guide
- Performance optimization guide
- Analytics implementation guide
- API Gateway proxy fix documentation
- Testing strategy (frontend, backend, infrastructure, integration, E2E)
- Risk assessment and mitigation strategies
- **Migration guide:** How to migrate from POC-2 to POC-3

Let's start planning POC-3 implementation!
```

---

## Key Files to Reference

### POC-2 Completion Documentation

1. **Implementation Documents:**
   - `docs/POC-2-Implementation/implementation-plan.md` - POC-2 implementation plan
   - `docs/POC-2-Implementation/task-list.md` - POC-2 task list
   - `docs/POC-2-Implementation/poc-2-completion-summary.md` - Completion summary (if exists)

2. **House-Cleaning:**
   - `docs/POC-2-Implementation/poc-3-house-cleaning-prompt.md` - House-cleaning activities

3. **Project Rules:**
   - `docs/POC-2-Implementation/project-rules-cursor.md` - Cursor rules for POC-2
   - `.cursorrules` - Current workspace rules

### POC-3 Architecture Documentation

1. **Frontend Architecture:**
   - `docs/References/mfe-poc3-architecture.md` - POC-3 MFE architecture
   - `docs/References/mfe-poc3-tech-stack.md` - POC-3 frontend tech stack (versions, rationale)

2. **Backend Architecture:**
   - `docs/References/backend-poc3-architecture.md` - POC-3 backend architecture
   - `docs/References/backend-poc3-tech-stack.md` - POC-3 backend tech stack (versions, rationale)

3. **Full-Stack Integration:**
   - `docs/References/fullstack-architecture.md` - Full-stack architecture overview (integration patterns)

4. **Deferred Issues:**
   - `docs/POC-3-Planning/api-gateway-proxy-implementation.md` - API Gateway proxy deferred issue

5. **Model Selection Strategy:**
   - `docs/POC-3-Implementation/model-selection-strategy.md` - Strategic model selection guide (Opus 4.5, Sonnet 4.5, Auto)

6. **ADRs:**
   - `docs/adr/poc-3/` - Frontend architecture decisions (if any)
   - `docs/adr/backend/poc-3/` - Backend architecture decisions (if any)

### POC-2 Baseline Documentation

1. **Architecture:**
   - `docs/References/mfe-poc2-architecture.md` - POC-2 MFE architecture (baseline)
   - `docs/References/backend-poc2-architecture.md` - POC-2 backend architecture (baseline)

2. **ADRs:**
   - `docs/adr/poc-2/` - Frontend architecture decisions
   - `docs/adr/backend/poc-2/` - Backend architecture decisions

### Current Codebase

1. **Frontend Structure:**
   - `apps/shell/` - Shell application (host)
   - `apps/auth-mfe/` - Auth MFE (remote)
   - `apps/payments-mfe/` - Payments MFE (remote)
   - `apps/admin-mfe/` - Admin MFE (remote)
   - `libs/shared-api-client/` - API client library
   - `libs/shared-event-bus/` - Event bus library
   - `libs/shared-design-system/` - Design system

2. **Backend Structure:**
   - `apps/api-gateway/` - API Gateway (proxy deferred)
   - `apps/auth-service/` - Auth Service
   - `apps/payments-service/` - Payments Service
   - `apps/admin-service/` - Admin Service
   - `apps/profile-service/` - Profile Service
   - `libs/backend/event-hub/` - Event Hub (Redis Pub/Sub)

3. **Configuration:**
   - `docker-compose.yml` - Docker Compose configuration
   - `package.json` - Current dependencies
   - `nx.json` - Nx workspace configuration

---

## Expected Deliverables

After planning session, you should have:

1. **Implementation Plan:** 📋 TO CREATE
   - Detailed phase breakdown (5 phases, 6-8 weeks)
   - Task breakdown for each phase
   - Dependencies and prerequisites
   - Timeline estimates
   - Migration strategies

2. **Task List:** 📋 TO CREATE
   - Progress tracking with checkboxes
   - Task dependencies
   - Acceptance criteria
   - Frontend/backend/infrastructure labels

3. **Migration Guides:** 📋 TO CREATE
   - Database separation migration guide
   - Event hub migration guide (Redis Pub/Sub to RabbitMQ)
   - Infrastructure migration guide
   - API Gateway proxy fix guide
   - POC-2 to POC-3 migration guide

4. **Configuration Guides:** 📋 TO CREATE
   - nginx configuration guide
   - WebSocket implementation guide
   - Caching strategy guide
   - Observability setup guide
   - Session management guide

5. **Testing Strategy:** 📋 TO CREATE
   - Infrastructure testing approach
   - Backend testing updates
   - Frontend testing updates
   - Integration testing plan
   - WebSocket testing
   - Session management testing
   - Performance testing plan

6. **Risk Assessment:** 📋 TO CREATE
   - Technical risks (database migration, event hub migration, infrastructure)
   - Schedule risks
   - Mitigation strategies

---

## Tips

1. **Leverage POC-2 Completion:**
   - All POC-2 features are working and tested
   - Use POC-2 as stable baseline for POC-3 enhancements
   - Plan migrations carefully to maintain functionality

2. **Focus on Infrastructure:**
   - POC-3 is infrastructure-heavy (nginx, databases, RabbitMQ)
   - Plan infrastructure setup early
   - Test infrastructure thoroughly before service migrations

3. **Migration Strategy:**
   - Database separation requires careful data migration
   - Event hub migration needs backward compatibility
   - API Gateway proxy fix needs thorough testing
   - Plan rollback strategies

4. **Performance Focus:**
   - POC-3 includes significant performance optimizations
   - Plan performance testing early
   - Set performance targets and measure against them

5. **Observability:**
   - Enhanced observability is a key POC-3 feature
   - Plan Sentry, Prometheus, and OpenTelemetry setup early
   - Integrate observability into development workflow

6. **Document Everything:**
   - Migration steps and rationale
   - Infrastructure configuration
   - Performance optimizations
   - Testing strategies
   - Development workflows

7. **Test Early and Often:**
   - Set up infrastructure early
   - Test migrations incrementally
   - Verify WebSocket communication
   - Test session management
   - Run performance tests regularly

---

## Model Selection Strategy

Given POC-3's high complexity (infrastructure setup, migrations, new technologies), use a **hybrid model approach** to balance quality, cost, and efficiency.

### Strategic Model Selection

**Use Opus 4.5 for (Critical/Complex Tasks):**

1. **Planning Phase:**
   - Initial implementation plan creation
   - Architecture decisions
   - Migration strategy design

2. **Infrastructure Setup:**
   - nginx configuration design
   - SSL/TLS setup
   - Docker Compose orchestration
   - Load balancing configuration

3. **Database Migration:**
   - Migration strategy design
   - Data migration scripts
   - Schema separation design
   - Rollback planning

4. **Event Hub Migration:**
   - RabbitMQ migration strategy
   - Event type migration
   - Reliability patterns
   - Backward compatibility

5. **API Gateway Proxy Fix:**
   - Root cause analysis
   - Solution design
   - Request body streaming implementation

6. **Complex Troubleshooting:**
   - When Auto mode gets stuck
   - Multi-system debugging
   - Performance issues

**Use Sonnet 4.5 for (Moderate Complexity):**

1. **WebSocket Implementation:**
   - Frontend WebSocket client
   - Backend WebSocket server
   - Real-time update patterns

2. **Observability Setup:**
   - Sentry integration
   - Prometheus metrics
   - OpenTelemetry tracing

3. **Advanced Caching:**
   - Service worker implementation
   - Redis caching patterns
   - Cache invalidation strategies

4. **Session Management:**
   - Cross-tab sync
   - Cross-device sync
   - Session storage patterns

5. **Performance Optimizations:**
   - Code splitting strategies
   - Bundle optimization
   - Database query optimization

6. **Testing Strategy:**
   - Integration test design
   - Migration test scenarios
   - Performance test planning

**Use Auto Mode for (Straightforward Tasks):**

1. **Standard CRUD Operations:**
   - Adding new API endpoints
   - Database queries
   - Standard component updates

2. **Documentation Updates:**
   - Updating docs after implementation
   - Adding comments
   - Formatting documentation

3. **Test Writing:**
   - Unit tests for new code
   - Standard integration tests
   - Test utilities

4. **Configuration Updates:**
   - Environment variable updates
   - Package.json updates
   - Standard config changes

5. **Refactoring:**
   - Code cleanup
   - Type improvements
   - Standard refactoring

6. **Bug Fixes:**
   - Simple bug fixes
   - Type errors
   - Linter fixes

### Recommended Workflow by Phase

**Phase 1: Planning & Architecture Review (Week 1)**

- **Opus 4.5:** Initial planning, architecture decisions
- **Sonnet 4.5:** Detailed task breakdown
- **Auto:** Documentation formatting

**Phase 2: Infrastructure Setup (Week 2-3)**

- **Opus 4.5:** nginx config design, SSL/TLS setup
- **Sonnet 4.5:** Docker Compose updates, service configuration
- **Auto:** Standard config updates

**Phase 3: Backend Enhancements (Week 4-5)**

- **Opus 4.5:** Database migration strategy, Event hub migration
- **Sonnet 4.5:** Migration scripts, service updates
- **Auto:** Standard code updates, tests

**Phase 4: Frontend Enhancements (Week 6-7)**

- **Sonnet 4.5:** WebSocket client, caching, session management
- **Auto:** Component updates, standard features

**Phase 5: Integration & Testing (Week 8)**

- **Opus 4.5:** Complex integration issues, performance tuning
- **Sonnet 4.5:** Integration tests, observability validation
- **Auto:** Standard tests, documentation

### Cost Optimization Strategy

**Hybrid Approach (Recommended):**

```
Planning Phase:        Opus 4.5 (critical decisions)
Infrastructure Setup:  Opus 4.5 (complex config)
Migrations:            Opus 4.5 (high risk)
New Features:          Sonnet 4.5 (moderate complexity)
Standard Tasks:        Auto mode (efficient)
Troubleshooting:       Opus 4.5 (when stuck)
```

**Estimated Model Usage Breakdown:**

| Model          | Usage % | Tasks                                                 |
| -------------- | ------- | ----------------------------------------------------- |
| **Opus 4.5**   | 30-40%  | Planning, migrations, infrastructure, complex issues  |
| **Sonnet 4.5** | 40-50%  | WebSocket, observability, caching, session management |
| **Auto**       | 10-20%  | Standard tasks, tests, documentation                  |

### Decision Tree

Use this when choosing a model:

```
Is it a critical decision or high-risk migration?
├─ YES → Opus 4.5
└─ NO → Is it a new technology or complex feature?
    ├─ YES → Sonnet 4.5
    └─ NO → Is it straightforward implementation?
        ├─ YES → Auto mode
        └─ NO → Sonnet 4.5 (safe default)
```

### Cost Impact

- **Using Opus 4.5 for everything:** ~$400-500 (overkill, not recommended)
- **Using Sonnet 4.5 for everything:** ~$300-400 (good quality, higher cost)
- **Hybrid approach (recommended):** ~$250-350 (optimal balance)

**The hybrid approach can save $50-150 while maintaining quality on critical tasks.**

### Recommendation

**Use a hybrid approach:**

1. **Opus 4.5** for planning, migrations, and infrastructure (critical/high-risk)
2. **Sonnet 4.5** for new features and moderate complexity (good balance)
3. **Auto mode** for standard tasks (cost-efficient)

This balances quality, cost, and speed. Start with **Opus 4.5** for planning, then switch based on task complexity.

---

**Last Updated:** 2026-12-09  
**Status:** Ready for Implementation Planning (POC-2 Complete)  
**Recommended Model Strategy:** Hybrid approach (Opus 4.5 for critical tasks, Sonnet 4.5 for moderate complexity, Auto for standard tasks)
