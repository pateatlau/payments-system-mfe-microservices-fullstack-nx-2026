# POC-2 Implementation Planning - New Session Prompt

Use this prompt when starting a new chat session to plan POC-2 implementation.

---

## 📖 How to Use This Prompt

This document provides the implementation planning prompt for POC-2.

### **Current Status: Architecture Review Complete** ✅

The architecture-first approach has been **completed**. Critical documentation is ready:

- ✅ Architecture review complete - see `docs/POC-2-Implementation/architecture-review.md`
- ✅ API contracts defined - see `docs/POC-2-Implementation/api-contracts.md`
- ✅ Event bus contract defined - see `docs/POC-2-Implementation/event-bus-contract.md`
- ✅ Type sharing strategy defined - see `docs/POC-2-Implementation/type-sharing-strategy.md`
- ✅ Environment configuration defined - see `docs/POC-2-Implementation/environment-configuration.md`

**Ready to proceed with Standard POC-2 Implementation Planning Prompt**

---

### **How to Use**

1. **Open a new chat session**
2. **Copy and paste the "Standard POC-2 Implementation Planning Prompt"** section below
3. The prompt will reference the completed architecture documentation
4. Focus on creating implementation plan, task breakdown, and remaining documentation

### **Quick Reference**

| Document                  | Status       | Location                                                 |
| ------------------------- | ------------ | -------------------------------------------------------- |
| Architecture Review       | ✅ Complete  | `docs/POC-2-Implementation/architecture-review.md`       |
| API Contracts             | ✅ Complete  | `docs/POC-2-Implementation/api-contracts.md`             |
| Event Bus Contract        | ✅ Complete  | `docs/POC-2-Implementation/event-bus-contract.md`        |
| Type Sharing Strategy     | ✅ Complete  | `docs/POC-2-Implementation/type-sharing-strategy.md`     |
| Environment Configuration | ✅ Complete  | `docs/POC-2-Implementation/environment-configuration.md` |
| Implementation Plan       | 📋 To Create | `docs/POC-2-Implementation/implementation-plan.md`       |
| Task List                 | 📋 To Create | `docs/POC-2-Implementation/task-list.md`                 |

---

## Context

**Current State (POC-1 Complete):**

- ✅ Microfrontend architecture with Module Federation v2 (Rspack)
- ✅ HMR working correctly with Module Federation v2
- ✅ Mock authentication (Zustand store)
- ✅ Stubbed payment APIs (TanStack Query)
- ✅ Three MFEs: shell (4200), auth-mfe (4201), payments-mfe (4202)
- ✅ React Router 7, Zustand, TanStack Query, Tailwind CSS v4
- ✅ 111+ tests passing (Jest)
- ✅ All POC-1 deliverables complete

**POC-2 Goal:**

- Full-stack integration with real backend APIs
- Real JWT authentication (replace mock auth)
- Event bus for inter-MFE communication (replace shared Zustand stores)
- Admin MFE (new remote for ADMIN role)
- Design system (Tailwind CSS v4 + shadcn/ui)
- Enhanced RBAC (ADMIN role support)
- Backend services (API Gateway, Auth, Payments, Admin, Profile, Event Hub)

---

## Standard POC-2 Implementation Planning Prompt

```
I'm starting a new session to plan POC-2 implementation. Please:

1. **Read Context:**

   **POC-2 Implementation Documents (CRITICAL - Read First):**
   - Read `docs/POC-2-Implementation/architecture-review.md` - Architecture review and recommendations
   - Read `docs/POC-2-Implementation/api-contracts.md` - API endpoint specifications (OpenAPI)
   - Read `docs/POC-2-Implementation/event-bus-contract.md` - Event types and payload schemas
   - Read `docs/POC-2-Implementation/type-sharing-strategy.md` - Type organization approach
   - Read `docs/POC-2-Implementation/environment-configuration.md` - Environment variables

   **Reference Documents:**
   - Read `docs/POC-1-Implementation/post-poc-1.md` - POC-2 scope and transition guidance
   - Read `docs/POC-1-Implementation/poc-1-completion-summary.md` - Current POC-1 state
   - Read `docs/References/mfe-poc2-architecture.md` - POC-2 frontend architecture
   - Read `docs/References/mfe-poc2-tech-stack.md` - POC-2 frontend tech stack
   - Read `docs/References/backend-poc2-architecture.md` - POC-2 backend architecture
   - Read `docs/References/backend-poc2-tech-stack.md` - POC-2 backend tech stack
   - Read `docs/References/fullstack-architecture.md` - Full-stack architecture overview
   - Review existing ADRs in `docs/adr/poc-2/` and `docs/adr/backend/poc-2/`

2. **Understand Current State:**
   - POC-1 is complete with Rspack + Module Federation v2 + HMR
   - Mock authentication in `libs/shared-auth-store`
   - Stubbed payment APIs in `apps/payments-mfe/src/api/stubbedPayments.ts`
   - Shared Zustand stores for inter-MFE communication
   - No backend services (all frontend-only)
   - No design system (inline Tailwind classes)

3. **Analyze POC-2 Requirements:**

   **Frontend Enhancements:**
   - Real backend API integration (replace mock/stubbed APIs)
   - Event bus implementation (replace shared Zustand stores)
   - Admin MFE creation (new remote, port 4203)
   - Design system integration (shadcn/ui + Tailwind CSS v4)
   - Enhanced RBAC (ADMIN role)
   - API client library (shared Axios client with interceptors)

   **Backend Implementation:**
   - API Gateway (routing, authentication, rate limiting)
   - Auth Service (JWT authentication, user management)
   - Payments Service (stubbed operations - no actual PSP)
   - Admin Service (user management, audit logging)
   - Profile Service (user profiles)
   - Event Hub (Redis Pub/Sub for inter-service communication)
   - Database (PostgreSQL - shared database in POC-2)

   **Infrastructure:**
   - PostgreSQL database setup
   - Redis setup (Pub/Sub)
   - Docker Compose for local development
   - Environment configuration

4. **Create Implementation Plan:**

   **Phase 1: Planning & Setup (Week 1)**

   **Review Completed Architecture Documentation:**
   - ✅ `architecture-review.md` - Architecture analysis and recommendations
   - ✅ `api-contracts.md` - API endpoint specifications (OpenAPI)
   - ✅ `event-bus-contract.md` - Event types and payload schemas
   - ✅ `type-sharing-strategy.md` - Type organization approach
   - ✅ `environment-configuration.md` - Environment variables and validation

   **Remaining Planning Tasks:**
   - Create detailed task breakdown and timeline
   - Create database schema (Prisma schema design)
   - Plan design system component structure
   - Set up development environment (Docker Compose, PostgreSQL, Redis)
   - Create project structure for backend services
   - Define security requirements (authentication middleware, RBAC)

   **Phase 2: Backend Foundation (Week 2-3)**
   - Set up backend monorepo structure (if separate)
   - Database setup (PostgreSQL)
   - Redis setup (Pub/Sub)
   - Docker Compose configuration
   - API Gateway implementation
   - Auth Service implementation (JWT)
   - Basic error handling and logging
   - **API contract implementation:** Ensure Auth Service matches API contracts
   - **Integration readiness:** Backend ready for frontend integration testing

   **Phase 3: Backend Services (Week 4-5)**
   - Payments Service (stubbed operations)
   - Admin Service (user management)
   - Profile Service (user profiles)
   - Event Hub integration (Redis Pub/Sub)
   - API documentation (OpenAPI/Swagger)
   - Backend testing
   - **API contract verification:** All services match defined contracts
   - **Integration testing:** Test API Gateway routing and authentication

   **Phase 4: Frontend Integration (Week 6-7)**
   - API client library (shared Axios client with interceptors)
   - Replace mock auth with real JWT authentication
   - Replace stubbed APIs with real backend calls
   - Event bus library implementation
   - Replace shared Zustand stores with event bus
   - Admin MFE implementation
   - Design system integration (shadcn/ui)
   - Update components to use design system
   - **Full-stack integration:** Connect frontend to backend services
   - **Integration testing:** Test frontend-backend communication

   **Phase 5: Testing & Refinement (Week 8)**
   - Backend testing (unit, integration, E2E)
   - Frontend testing updates
   - **Full-stack integration testing (CRITICAL):**
     - End-to-end authentication flow
     - API contract compliance
     - Error handling across stack
     - Data flow verification
   - Event bus communication testing
   - Authentication flow testing
   - Performance testing (frontend-backend integration)
   - Documentation updates

5. **Documentation Structure:**
   Documentation in `docs/POC-2-Implementation/`:

   **Already Created (Reference):**
   - ✅ `architecture-review.md` - Architecture analysis and readiness assessment
   - ✅ `api-contracts.md` - API endpoint definitions (OpenAPI)
   - ✅ `event-bus-contract.md` - Event bus types and schemas
   - ✅ `type-sharing-strategy.md` - Type organization and synchronization
   - ✅ `environment-configuration.md` - Environment variables and validation
   - ✅ `project-rules-cursor.md` - Cursor rules for POC-2
   - ✅ `project-rules.md` - Project rules

   **To Create During Implementation:**
   - `implementation-plan.md` - Detailed step-by-step plan
   - `task-list.md` - Progress tracking with checkboxes
   - `design-system-guide.md` - Design system usage and components
   - `migration-guide-poc1-to-poc2.md` - Migration steps from POC-1
   - `developer-workflow-frontend.md` - Frontend development workflow
   - `developer-workflow-backend.md` - Backend development workflow
   - `developer-workflow-fullstack.md` - Full-stack integration workflow
   - `testing-guide.md` - Testing strategy and examples

6. **Key Considerations:**

   **Full-Stack Integration (CRITICAL):**
   - **API Contracts:** ✅ Defined in `api-contracts.md` - use as implementation reference
   - **Event Bus:** ✅ Defined in `event-bus-contract.md` - use as implementation reference
   - **Type Sharing:** ✅ Defined in `type-sharing-strategy.md` - follow type organization
   - **Environment Config:** ✅ Defined in `environment-configuration.md` - follow variable naming
   - **Authentication Flow:** Implement JWT flow following `api-contracts.md` specifications
   - **Error Handling:** Follow error codes and response formats in `api-contracts.md`
   - **Data Flow:** Plan data flow from backend services → API Gateway → Frontend API client → Components
   - **Development Workflow:** Establish separate but coordinated workflows for frontend and backend development

   **Frontend-Specific:**
   - **Migration from POC-1:** Plan smooth transition from mock to real backend
   - **Event Bus Design:** Decouple MFEs using event bus (replace shared Zustand stores)
   - **API Client:** Shared Axios client with interceptors for auth, error handling
   - **Design System:** shadcn/ui integration with Tailwind CSS v4
   - **Rspack Configuration:** Leverage existing Rspack setup (no changes needed)
   - **Module Federation:** Add Admin MFE as new remote

   **Backend-Specific:**
   - **Microservices Architecture:** Design service boundaries and communication patterns
   - **Database Schema:** Plan shared database schema (POC-2) with clear service ownership
   - **Event Hub:** Redis Pub/Sub for inter-service communication
   - **API Gateway:** Centralized routing, authentication, and rate limiting
   - **Service Communication:** Define service-to-service communication patterns

   **Cross-Cutting:**
   - **Security:** JWT authentication, RBAC, API security, secure headers
   - **Testing:** Update tests for real backend, test event bus, test Admin MFE, full-stack integration tests
   - **Backward Compatibility:** Maintain POC-1 functionality during migration
   - **Documentation:** Document integration patterns, API contracts, and workflows

7. **Define Development Workflows:**

   **Frontend Development Workflow:**
   - Frontend developers work in Nx monorepo with Rspack + Module Federation v2
   - Can develop independently using API contracts (mock/stub backend initially)
   - Use shared API client library for all backend communication
   - Test with real backend APIs once backend services are available
   - Development commands: `nx serve shell`, `nx serve auth-mfe`, etc.
   - Hot Module Replacement (HMR) enabled for fast development

   **Backend Development Workflow:**
   - Backend developers work in backend monorepo (or separate workspace)
   - Can develop independently using API contracts
   - Test services individually with API clients (Postman, curl, Supertest)
   - Use Docker Compose for local infrastructure (PostgreSQL, Redis)
   - Development commands: `nx serve api-gateway`, `nx serve auth-service`, etc.
   - Hot reload enabled for fast development

   **Full-Stack Integration Workflow:**
   - Coordinate frontend and backend development using API contracts
   - Run both frontend and backend services locally for integration testing
   - Use integration tests to verify API contracts are met
   - Test authentication flow end-to-end
   - Verify error handling across the stack
   - Test event bus communication (if backend events affect frontend)

   **Workflow Coordination:**
   - API contracts defined first (enables parallel development)
   - Regular integration checkpoints to verify contracts
   - Shared environment configuration
   - Coordinated testing strategy

8. **Follow Rules:**
   - Follow all rules in `.cursorrules`
   - Create documentation in `docs/POC-2-Implementation/`
   - Ask for confirmation before major decisions
   - Document all findings and decisions
   - Update both `task-list.md` and `implementation-plan.md` after each task
   - Commit after each major phase completion

**Expected Deliverables:**
- Comprehensive implementation plan with phases and tasks
- Task list for progress tracking (with frontend/backend/full-stack labels)
- Architecture documentation (frontend, backend, and integration)
- API contracts specification (frontend-backend contracts)
- Event bus specification
- Design system integration plan
- Migration guide from POC-1 to POC-2
- **Development workflows:**
  - Frontend development workflow
  - Backend development workflow
  - Full-stack integration workflow
- Testing strategy (frontend, backend, integration, E2E)
- Risk assessment and mitigation strategies
- **Integration guide:** How frontend and backend integrate seamlessly

Let's start planning POC-2 implementation!
```

---

## Alternative: Architecture-First Approach (COMPLETED)

> **Note:** This approach has been **completed**. The architecture review document and critical documentation have been created. See `docs/POC-2-Implementation/architecture-review.md` for the results.

The following prompt was used to complete the architecture review:

```
I'm starting a new session to review and finalize POC-2 architecture. Please:

1. **Review Architecture Documents:**
   - Read `docs/References/mfe-poc2-architecture.md` - Frontend architecture
   - Read `docs/References/mfe-poc2-tech-stack.md` - Frontend tech stack
   - Read `docs/References/backend-poc2-architecture.md` - Backend architecture
   - Read `docs/References/backend-poc2-tech-stack.md` - Backend tech stack
   - Read `docs/References/fullstack-architecture.md` - Full-stack overview
   - Review existing ADRs in `docs/adr/poc-2/` and `docs/adr/backend/poc-2/`

2. **Analyze Architecture:**
   - Evaluate frontend architecture (MFEs, event bus, design system)
   - Evaluate backend architecture (services, API Gateway, Event Hub)
   - **Evaluate full-stack integration points:**
     - API contracts between frontend and backend
     - Authentication flow (JWT token exchange)
     - Data flow patterns (request/response, error handling)
     - Event bus integration (if backend events affect frontend)
     - Environment configuration alignment
   - Identify gaps or inconsistencies
   - Assess complexity and feasibility
   - Verify tech stack compatibility between frontend and backend

3. **Document Findings:**
   - Create architecture review document
   - Identify any missing pieces
   - Document recommendations
   - Highlight risks or concerns

4. **Provide Recommendation:**
   - Is architecture ready for implementation?
   - What needs to be clarified or finalized?
   - What are the key risks?
   - What is the estimated effort?

**Context:**
- POC-1 complete with Rspack + Module Federation v2 + HMR
- POC-2 goal: Full-stack integration with backend, event bus, Admin MFE, design system

Let's review the POC-2 architecture!
```

---

## Key Files to Reference

### POC-2 Implementation Documents (CRITICAL - Read First)

1. **Critical Documents (Completed):**
   - `docs/POC-2-Implementation/architecture-review.md` - Architecture analysis and recommendations
   - `docs/POC-2-Implementation/api-contracts.md` - API specifications (OpenAPI)
   - `docs/POC-2-Implementation/event-bus-contract.md` - Event bus contract and schemas
   - `docs/POC-2-Implementation/type-sharing-strategy.md` - Type organization strategy
   - `docs/POC-2-Implementation/environment-configuration.md` - Environment configuration

2. **Project Rules:**
   - `docs/POC-2-Implementation/project-rules-cursor.md` - Cursor rules for POC-2
   - `docs/POC-2-Implementation/project-rules.md` - Project rules

### POC-1 Completion Documentation

1. **Completion Summary:**
   - `docs/POC-1-Implementation/post-poc-1.md` - POC-2 scope and transition
   - `docs/POC-1-Implementation/poc-1-completion-summary.md` - POC-1 deliverables
   - `docs/POC-1-Implementation/developer-workflow.md` - Current workflow

2. **Architecture:**
   - `docs/References/mfe-poc1-architecture.md` - Current POC-1 architecture
   - `docs/References/mfe-poc1-tech-stack.md` - Current tech stack

3. **Rspack Migration:**
   - `docs/Rspack-Migration/rspack-migration-plan.md` - Rspack configuration
   - `docs/Rspack-Migration/task-list.md` - Migration learnings

### POC-2 Reference Documentation

1. **Frontend Architecture:**
   - `docs/References/mfe-poc2-architecture.md` - POC-2 MFE architecture
   - `docs/References/mfe-poc2-tech-stack.md` - POC-2 tech stack

2. **Backend Architecture:**
   - `docs/References/backend-poc2-architecture.md` - Backend services architecture
   - `docs/References/backend-poc2-tech-stack.md` - Backend tech stack
   - `docs/References/backend-architecture.md` - General backend architecture

3. **Full-Stack:**
   - `docs/References/fullstack-architecture.md` - Full-stack architecture overview

4. **ADRs:**
   - `docs/adr/poc-2/` - Frontend architecture decisions
   - `docs/adr/backend/poc-2/` - Backend architecture decisions

### Current Codebase

1. **Frontend Structure:**
   - `apps/shell/` - Shell application (host)
   - `apps/auth-mfe/` - Auth MFE (remote)
   - `apps/payments-mfe/` - Payments MFE (remote)
   - `libs/shared-auth-store/` - Mock authentication store
   - `apps/payments-mfe/src/api/stubbedPayments.ts` - Stubbed payment APIs

2. **Configuration:**
   - `apps/*/rspack.config.js` - Rspack configurations (HMR working)
   - `package.json` - Current dependencies
   - `nx.json` - Nx workspace configuration

---

## Expected Deliverables

After planning session, you should have:

1. **Architecture Documentation:** ✅ COMPLETE
   - ✅ Architecture review - `architecture-review.md`
   - ✅ API contracts specification - `api-contracts.md`
   - ✅ Event bus specification - `event-bus-contract.md`
   - ✅ Type sharing strategy - `type-sharing-strategy.md`
   - ✅ Environment configuration - `environment-configuration.md`

2. **Implementation Plan:** 📋 TO CREATE
   - Detailed phase breakdown (5 phases, 6-8 weeks)
   - Task breakdown for each phase
   - Dependencies and prerequisites
   - Timeline estimates

3. **Migration Guide:** 📋 TO CREATE
   - Step-by-step migration from POC-1 to POC-2
   - Mock to real backend migration
   - Shared Zustand stores to event bus migration
   - Component migration to design system

4. **Task List:** 📋 TO CREATE
   - Progress tracking with checkboxes
   - Task dependencies
   - Acceptance criteria

5. **Testing Strategy:** 📋 TO CREATE
   - Backend testing approach
   - Frontend testing updates
   - Integration testing plan
   - Event bus testing

6. **Risk Assessment:** ✅ INCLUDED IN ARCHITECTURE REVIEW
   - Technical risks documented in `architecture-review.md`
   - Schedule risks documented
   - Mitigation strategies included

---

## Tips

1. **Architecture Review Complete:**
   - ✅ Architecture documents reviewed and validated
   - ✅ API contracts defined in `api-contracts.md`
   - ✅ Event bus design documented in `event-bus-contract.md`
   - ✅ Type sharing strategy in `type-sharing-strategy.md`
   - ✅ Environment configuration in `environment-configuration.md`
   - Focus on implementation planning, not architecture review

2. **Use Completed Documentation:**
   - **API Contracts:** Reference `api-contracts.md` for all endpoint specifications
   - **Event Bus:** Reference `event-bus-contract.md` for event types and schemas
   - **Types:** Reference `type-sharing-strategy.md` for type organization
   - **Environment:** Reference `environment-configuration.md` for variable naming
   - **Architecture:** Reference `architecture-review.md` for implementation guidance

3. **Separate Development Workflows:**
   - **Frontend Workflow:** Frontend developers can work with mock/stubbed backend APIs initially, then integrate with real backend
   - **Backend Workflow:** Backend developers can work independently, testing with API clients (Postman, curl, etc.)
   - **Integration Workflow:** Establish clear integration points and testing procedures for full-stack integration
   - **Parallel Development:** Enable frontend and backend teams to work in parallel using API contracts

4. **Plan Migration Carefully:**
   - Mock to real backend migration needs careful planning
   - Event bus migration should maintain functionality
   - Design system integration should be incremental
   - Coordinate frontend and backend migration steps

5. **Leverage POC-1 Learnings:**
   - Rspack configuration is stable (no changes needed)
   - Module Federation v2 is working correctly
   - Testing patterns are established
   - Frontend patterns can be extended for backend integration

6. **Document Everything:**
   - Implementation decisions and rationale
   - Migration steps
   - Testing strategies (unit, integration, E2E)
   - Development workflows (frontend, backend, full-stack)

7. **Test Early and Often:**
   - Set up backend infrastructure early
   - Test API integration incrementally (start with Auth Service)
   - Verify event bus communication
   - Test authentication flow end-to-end
   - Run full-stack integration tests regularly

---

## Model Recommendation

**For POC-2 Planning:**

- **Recommended:** Opus 4.5 or Sonnet 4.5
- **Reason:** Complex architecture planning, multiple systems integration, comprehensive documentation
- **Alternative:** Auto mode (acceptable but may require more iterations)

**For POC-2 Implementation:**

- **Recommended:** Auto mode
- **Reason:** Implementation tasks are more straightforward, Auto mode is efficient
- **Exception:** Use Opus 4.5 for complex architecture decisions or troubleshooting

---

**Last Updated:** 2026-01-XX  
**Status:** Ready for Implementation Planning (Architecture Review Complete)  
**Recommended Model:** Opus 4.5 or Sonnet 4.5 for planning phase
