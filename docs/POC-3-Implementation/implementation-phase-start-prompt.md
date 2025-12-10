# POC-3 Implementation Phase - Start Prompt

**Date:** 2026-12-10  
**Phase:** Implementation (Phase 2+)  
**Status:** Ready to Begin

---

## Context

Planning phase (Phase 1) is 83% complete (10/12 sub-tasks). All strategy documents, migration guides, and ADRs have been created. We are now ready to begin the **implementation phase** starting with Phase 2: Infrastructure Setup.

**Important:** All implementation artifacts from the planning phase have been removed. The repository is clean and ready for step-by-step implementation.

---

## Current State

### Completed (Planning Phase - 83%)

- **Task 1.1:** POC-3 Architecture Finalization (7/7 sub-tasks complete)
  - Database migration strategy
  - Event hub migration strategy
  - API Gateway proxy approach
  - nginx configuration design
  - WebSocket architecture
  - All ADRs created

- **Task 1.2:** Documentation Setup (3/3 sub-tasks complete)
  - Implementation plan document
  - Task list document
  - Migration guide templates

### Not Started

- **Task 1.3:** Environment Preparation (0/2 sub-tasks)
  - Docker Compose updates
  - Environment variable templates

- **Phase 2:** Infrastructure Setup (0/9 sub-tasks)
- **Phase 3:** Backend Infrastructure Migration (0/9 sub-tasks)
- **Phase 4:** WebSocket & Real-Time Features (0/4 sub-tasks)
- **Phase 5:** Advanced Caching & Performance (0/4 sub-tasks)
- **Phase 6:** Observability & Monitoring (0/5 sub-tasks)
- **Phase 7:** Session Management (0/3 sub-tasks)
- **Phase 8:** Integration, Testing & Documentation (0/5 sub-tasks)

---

## Critical Rules to Follow

1. **Follow `.cursorrules` strictly** - All rules apply, especially:
   - NO throw-away code
   - Never use `any` type
   - Always use Tailwind v4 syntax
   - Fix type errors immediately
   - Write tests alongside code (70% coverage minimum)

2. **MANDATORY Documentation Updates:**
   - After EACH task/sub-task completion, update BOTH:
     - `docs/POC-3-Implementation/task-list.md`
     - `docs/POC-3-Implementation/implementation-plan.md`
   - Mark checkboxes `[x]`, set Status "Complete", add date, add notes
   - **NON-NEGOTIABLE** - Must be done immediately

3. **Granular Steps:**
   - Follow `docs/POC-3-Implementation/implementation-plan.md` for detailed step-by-step instructions
   - Each sub-task should be small, testable, and verifiable
   - Ask for confirmation before proceeding to next task

4. **No Automatic Implementation:**
   - Only perform tasks explicitly requested
   - If a related task seems helpful, ask for confirmation with clear description
   - Wait for user approval before moving to next task

5. **Verification:**
   - Complete all verification checklist items
   - Meet all acceptance criteria
   - Test and verify before marking complete

---

## First Task: Complete Task 1.3 (Environment Preparation)

Before starting Phase 2, we should complete the remaining Phase 1 tasks:

### Sub-task 1.3.1: Update Docker Compose for POC-3 Services

**Objective:** Add all POC-3 infrastructure services to Docker Compose

**Reference Documents:**
- `docs/POC-3-Implementation/implementation-plan.md` - Sub-task 1.3.1 (lines ~700-750)
- `docs/POC-3-Implementation/database-migration-strategy.md` - Database schemas
- `docs/POC-3-Implementation/event-hub-migration-strategy.md` - RabbitMQ topology
- `docs/POC-3-Implementation/nginx-configuration-design.md` - nginx configuration

**Services to Add:**
- nginx (ports 80, 443)
- auth_db (PostgreSQL, port 5432)
- payments_db (PostgreSQL, port 5433)
- admin_db (PostgreSQL, port 5434)
- profile_db (PostgreSQL, port 5435)
- rabbitmq (ports 5672, 15672)
- Update redis (port 6379, caching only)
- Keep postgres (legacy, port 5436 for migration compatibility)

**Detailed Steps:**
1. Read current `docker-compose.yml`
2. Add nginx service with volumes for config and SSL
3. Add 4 separate PostgreSQL services (auth_db, payments_db, admin_db, profile_db)
4. Add RabbitMQ service with management UI
5. Update Redis service (caching only, not event hub)
6. Configure volumes for all services
7. Add health checks for all services
8. Configure networks (mfe-network)
9. Add dependencies where needed
10. Test: `docker-compose config` (validate syntax)
11. Update documentation (task-list.md and implementation-plan.md)

**Verification:**
- [ ] All services defined in docker-compose.yml
- [ ] Ports configured correctly
- [ ] Volumes configured
- [ ] Health checks configured
- [ ] Network configured
- [ ] `docker-compose config` passes (syntax validation)
- [ ] Documentation updated

**Acceptance Criteria:**
- All POC-3 services defined in Docker Compose
- Configuration syntax valid
- Ready for `docker-compose up` (verification in Phase 2)

---

## Implementation Workflow

For each task:

1. **Read the task details** in `implementation-plan.md`
2. **Understand the requirements** and verification checklist
3. **Implement the task** step-by-step
4. **Verify completion** using verification checklist
5. **Update documentation** (task-list.md and implementation-plan.md)
6. **Ask for confirmation** before proceeding to next task

---

## Key Reference Documents

- **Implementation Plan:** `docs/POC-3-Implementation/implementation-plan.md`
- **Task List:** `docs/POC-3-Implementation/task-list.md`
- **Project Rules:** `.cursorrules` and `docs/POC-3-Implementation/project-rules-cursor.md`
- **Migration Strategies:**
  - `docs/POC-3-Implementation/database-migration-strategy.md`
  - `docs/POC-3-Implementation/event-hub-migration-strategy.md`
- **Architecture Designs:**
  - `docs/POC-3-Implementation/nginx-configuration-design.md`
  - `docs/POC-3-Implementation/websocket-architecture.md`
- **ADRs:** `docs/adr/backend/poc-3/` and `docs/adr/poc-3/`

---

## Success Criteria

- Each task completed per implementation plan
- All verification checklist items completed
- All acceptance criteria met
- Documentation updated immediately after each task
- Tests written alongside code (70%+ coverage)
- No TypeScript errors
- No `any` types
- Tailwind v4 syntax used
- User confirmation obtained before next task

---

**Ready to begin implementation. Please start with Sub-task 1.3.1: Update Docker Compose for POC-3 Services.**
