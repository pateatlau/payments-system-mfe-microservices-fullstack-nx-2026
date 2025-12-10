# MFE Microservices Full-Stack Platform

**Status:** POC-2 - Backend Integration Complete  
**Version:** 0.2.0  
**Tech Stack:** React 19 + Nx + Rspack + Module Federation v2 + Node.js + PostgreSQL + Redis

---

## 🚀 Quick Start

### Prerequisites

- **Node.js:** 24.11.x LTS
- **pnpm:** 9.x
- **Git:** Latest

### Verify Environment

```bash
./scripts/verify-environment.sh
```

### Start Implementation

1. **Open Cursor IDE** and open this project
2. **Use first prompt:** See `docs/Prompts/POC-0/first-prompt.md`
3. **Follow implementation plan:** `docs/POC-0-Implementation/implementation-plan.md`

**Quick Start Guide:** [`docs/POC-0-Implementation/QUICK-START.md`](docs/POC-0-Implementation/QUICK-START.md)

---

## 📚 Documentation Structure

### Implementation Documentation

- **📋 Quick Start:** [`docs/POC-0-Implementation/QUICK-START.md`](docs/POC-0-Implementation/QUICK-START.md) - Get started in 10 minutes
- **📝 Implementation Plan:** [`docs/POC-0-Implementation/implementation-plan.md`](docs/POC-0-Implementation/implementation-plan.md) - Detailed step-by-step guide
- **✅ Task List:** [`docs/POC-0-Implementation/task-list.md`](docs/POC-0-Implementation/task-list.md) - Progress tracking
- **📖 Implementation README:** [`docs/POC-0-Implementation/README.md`](docs/POC-0-Implementation/README.md) - How to use implementation docs

### Architecture & Design

- **🏗️ POC-0 Architecture:** [`docs/References/mfe-poc0-architecture.md`](docs/References/mfe-poc0-architecture.md) - Foundation architecture
- **🔧 POC-0 Tech Stack:** [`docs/References/mfe-poc0-tech-stack.md`](docs/References/mfe-poc0-tech-stack.md) - Technology choices
- **🌐 Full-Stack Architecture:** [`docs/References/fullstack-architecture.md`](docs/References/fullstack-architecture.md) - Complete system architecture

### Development Workflow

- **👨‍💻 Developer Workflow:** [`docs/Developer-Workflow/README-FIRST.md`](docs/Developer-Workflow/README-FIRST.md) - Complete workflow guide
- **🔄 Context Persistence:** [`docs/Developer-Workflow/CONTEXT-PERSISTENCE.md`](docs/Developer-Workflow/CONTEXT-PERSISTENCE.md) - Multi-session guide
- **📊 Setup Evaluation:** [`docs/Developer-Workflow/PROJECT-SETUP-EVALUATION.md`](docs/Developer-Workflow/PROJECT-SETUP-EVALUATION.md) - Project assessment

### Prompts & Templates

- **🚀 First Prompt:** [`docs/Prompts/POC-0/first-prompt.md`](docs/Prompts/POC-0/first-prompt.md) - Starting implementation
- **🔄 Continuation Prompt:** [`docs/Prompts/POC-0/continuation-prompt.md`](docs/Prompts/POC-0/continuation-prompt.md) - Resuming work

### Architecture Decision Records (ADRs)

- **📋 ADR Index:** [`docs/adr/README.md`](docs/adr/README.md) - All architectural decisions
- **POC-0 ADRs:** [`docs/adr/poc-0/`](docs/adr/poc-0/) - Foundation decisions

---

## 🎯 Current Phase: POC-2 (Backend Integration Complete)

### Scope

**In Scope (POC-2):**

- ✅ Shell app (host, Port 4200)
- ✅ Auth MFE (remote, Port 4201)
- ✅ Payments MFE (remote, Port 4202)
- ✅ Admin MFE (remote, Port 4203) - NEW
- ✅ Module Federation v2 with HMR
- ✅ Routing (React Router 7)
- ✅ State Management (Zustand + TanStack Query)
- ✅ Real JWT Authentication (backend integration)
- ✅ Backend API Integration (REST API)
- ✅ Design System (shadcn/ui + Tailwind CSS v4)
- ✅ Event Bus (inter-MFE communication)
- ✅ Backend Services (API Gateway, Auth, Payments, Admin, Profile)
- ✅ Database (PostgreSQL + Prisma ORM)
- ✅ Event Hub (Redis Pub/Sub)
- ✅ Testing (380+ tests, 70%+ coverage)

**NOT in Scope (POC-3):**

- ❌ Real PSP Integration (stubbed at backend)
- ❌ Advanced Infrastructure (nginx, advanced observability)
- ❌ Separate Databases per Service
- ❌ WebSocket Real-time Updates
- ❌ Advanced Performance Optimizations

### Progress

- **POC-0:** ✅ Complete
- **POC-1:** ✅ Complete (Rspack migration complete)
- **POC-2:** ✅ Complete (Backend integration, design system, event bus, admin MFE)
- **Rspack Migration:** ✅ Complete
- Check POC-2 progress: [`docs/POC-2-Implementation/task-list.md`](docs/POC-2-Implementation/task-list.md)

---

## 🛠️ Technology Stack

### Frontend (POC-2)

- **React:** 19.2.0
- **Nx:** Latest
- **Rspack:** Latest (migrated from Vite 6.x)
- **Module Federation:** @module-federation/enhanced 0.21.6 (BIMF)
- **Routing:** React Router 7.x
- **State Management:** Zustand 4.5.x + TanStack Query 5.x
- **Design System:** shadcn/ui + Tailwind CSS v4
- **Forms:** React Hook Form 7.52.x + Zod 3.23.x
- **Testing:** Jest 30.x, React Testing Library 16.1.x, Playwright
- **Package Manager:** pnpm 9.x
- **TypeScript:** 5.9.x (strict mode)

### Backend (POC-2)

- **Node.js:** 24.11.x LTS
- **Framework:** Express
- **Database:** PostgreSQL 16.x + Prisma ORM
- **Event Hub:** Redis 7.x (Pub/Sub)
- **Authentication:** JWT (access + refresh tokens)
- **Testing:** Jest
- **TypeScript:** 5.9.x (strict mode)

> **Note:** Migrated from Vite to Rspack to enable HMR with Module Federation v2. See `docs/Rspack-Migration/` for migration details.

### Future Phases

- **POC-3:** Infrastructure improvements, separate databases, WebSocket, RabbitMQ, advanced observability

---

## 📁 Project Structure

```
payments-system-mfe-microservices-fullstack-nx-2026/
├── apps/
│   ├── shell/              # Host (Port 4200)
│   ├── auth-mfe/           # Auth MFE (Port 4201)
│   ├── payments-mfe/       # Payments MFE (Port 4202)
│   ├── admin-mfe/          # Admin MFE (Port 4203) - POC-2
│   ├── shell-e2e/          # E2E tests
│   ├── api-gateway/        # API Gateway (Port 3000) - POC-2
│   ├── auth-service/       # Auth Service (Port 3001) - POC-2
│   ├── payments-service/   # Payments Service (Port 3002) - POC-2
│   ├── admin-service/      # Admin Service (Port 3003) - POC-2
│   └── profile-service/    # Profile Service (Port 3004) - POC-2
├── libs/
│   ├── shared-utils/       # Shared utilities
│   ├── shared-ui/          # Shared UI components
│   ├── shared-types/       # Shared TypeScript types
│   ├── shared-auth-store/  # Auth store (Zustand)
│   ├── shared-header-ui/   # Universal header
│   ├── shared-api-client/  # API client (Axios) - POC-2
│   ├── shared-event-bus/   # Event bus - POC-2
│   ├── shared-design-system/ # Design system (shadcn/ui) - POC-2
│   └── backend/            # Backend shared libraries - POC-2
│       ├── db/             # Prisma schema
│       ├── types/          # Backend types
│       ├── utils/           # Backend utilities
│       └── event-hub/       # Event Hub (Redis) - POC-2
├── docs/                   # Documentation
├── scripts/                # Utility scripts
└── .cursorrules           # Cursor AI rules
```

---

## 🚦 Getting Started

### 1. Verify Environment

```bash
./scripts/verify-environment.sh
```

### 2. Start Infrastructure

```bash
# Start PostgreSQL and Redis
pnpm infra:start

# Set up database
pnpm backend:setup
```

### 3. Start Development

```bash
# Terminal 1: Start backend services
pnpm dev:backend

# Terminal 2: Start frontend services
pnpm dev:mf
```

### 4. Access Application

- **Frontend:** http://localhost:4200
- **API Gateway:** http://localhost:3000

**See:** [`docs/POC-2-Implementation/developer-workflow-fullstack.md`](docs/POC-2-Implementation/developer-workflow-fullstack.md) for complete setup guide.

---

## 📖 Key Documentation

### POC-2 Implementation (Current)

1. **Quick Start:** [`docs/POC-2-Implementation/developer-workflow-fullstack.md`](docs/POC-2-Implementation/developer-workflow-fullstack.md)
2. **Track Progress:** [`docs/POC-2-Implementation/task-list.md`](docs/POC-2-Implementation/task-list.md)
3. **Implementation Plan:** [`docs/POC-2-Implementation/implementation-plan.md`](docs/POC-2-Implementation/implementation-plan.md)

### Developer Workflows

1. **Frontend Workflow:** [`docs/POC-2-Implementation/developer-workflow-frontend.md`](docs/POC-2-Implementation/developer-workflow-frontend.md)
2. **Backend Workflow:** [`docs/POC-2-Implementation/developer-workflow-backend.md`](docs/POC-2-Implementation/developer-workflow-backend.md)
3. **Full-Stack Workflow:** [`docs/POC-2-Implementation/developer-workflow-fullstack.md`](docs/POC-2-Implementation/developer-workflow-fullstack.md)

### Technical Documentation

1. **Design System:** [`docs/POC-2-Implementation/design-system-guide.md`](docs/POC-2-Implementation/design-system-guide.md)
2. **Migration Guide:** [`docs/POC-2-Implementation/migration-guide-poc1-to-poc2.md`](docs/POC-2-Implementation/migration-guide-poc1-to-poc2.md)
3. **Testing Guide:** [`docs/POC-2-Implementation/testing-guide.md`](docs/POC-2-Implementation/testing-guide.md)
4. **API Contracts:** [`docs/POC-2-Implementation/api-contracts.md`](docs/POC-2-Implementation/api-contracts.md)
5. **Event Bus Contract:** [`docs/POC-2-Implementation/event-bus-contract.md`](docs/POC-2-Implementation/event-bus-contract.md)

### Architecture

1. **POC-2 Architecture:** [`docs/References/mfe-poc2-architecture.md`](docs/References/mfe-poc2-architecture.md)
2. **Backend Architecture:** [`docs/References/backend-poc2-architecture.md`](docs/References/backend-poc2-architecture.md)
3. **Full-Stack Architecture:** [`docs/References/fullstack-architecture.md`](docs/References/fullstack-architecture.md)
4. **Architecture Review:** [`docs/POC-2-Implementation/architecture-review.md`](docs/POC-2-Implementation/architecture-review.md)

---

## 🎯 Success Criteria

POC-0 is complete when:

- ✅ Shell app runs on http://localhost:4200
- ✅ Hello Remote app runs on http://localhost:4201
- ✅ Module Federation v2 works (shell loads remote dynamically)
- ✅ Shared dependencies work (no duplicates)
- ✅ HMR works (fast updates)
- ✅ Production builds work (optimized)
- ✅ TypeScript types work across boundaries
- ✅ Tests pass (60% coverage minimum)
- ✅ Shared libraries created and working

---

## 🔧 Development Commands

### After Workspace Setup

```bash
# Serve applications
nx serve shell              # Port 4200
nx serve hello-remote      # Port 4201

# Run both in parallel
nx run-many --target=serve --projects=shell,hello-remote --parallel

# Build
nx build shell
nx build hello-remote

# Test
nx test shell
nx test hello-remote

# Lint
nx lint shell
nx lint hello-remote
```

---

## 📋 Project Rules

### Core Principles

1. **NO throw-away code** - Everything must carry forward to Production
2. **Never use `any` type** - Documented exceptions only
3. **Fix type errors immediately** - Don't work around them
4. **Write tests alongside code** - 60% coverage minimum
5. **POC-0 scope only** - No backend, routing, state management, auth, Tailwind

### Rules Reference

- **Quick Reference:** `.cursorrules` (always included)
- **Detailed Rules:** [`docs/POC-0-Implementation/project-rules-cursor.md`](docs/POC-0-Implementation/project-rules-cursor.md)
- **Full Documentation:** [`docs/POC-0-Implementation/project-rules.md`](docs/POC-0-Implementation/project-rules.md)

---

## 🗺️ Roadmap

### POC-0 (Current) - Foundation

- Shell + Hello Remote + Module Federation v2
- Timeline: 1-2 weeks

### POC-1 - Authentication & Payments

- Auth MFE + Payments MFE + Routing + State Management
- Timeline: 3-4 weeks

### POC-2 - Backend Integration

- Backend API + Design System + Event Bus
- Timeline: 2-3 weeks

### POC-3 - Infrastructure

- nginx + Performance + Enhanced Observability
- Timeline: 4-5 weeks

---

## 📞 Support & Resources

### Documentation

- **Quick Start:** [`docs/POC-0-Implementation/QUICK-START.md`](docs/POC-0-Implementation/QUICK-START.md)
- **Workflow Guide:** [`docs/Developer-Workflow/README-FIRST.md`](docs/Developer-Workflow/README-FIRST.md)
- **Troubleshooting:** See workflow guide troubleshooting section

### Key Files

- **Task List:** `docs/POC-0-Implementation/task-list.md` - Current progress
- **Implementation Plan:** `docs/POC-0-Implementation/implementation-plan.md` - Detailed steps
- **Cursor Rules:** `.cursorrules` - AI assistant rules

---

## 📝 Commit Message Format

This project uses conventional commits with task references:

```
feat(poc-0): [Task 1.1] - Initialize Nx workspace

- Created Nx workspace with React preset
- Configured pnpm as package manager
- Set up basic workspace structure

References: docs/POC-0-Implementation/implementation-plan.md#task-11
```

See: [`.gitmessage`](.gitmessage) for template

---

## 🏗️ Architecture Overview

This is a **microfrontend (MFE) platform** with:

- **Frontend:** React 19 + Nx + Rspack + Module Federation v2 (BIMF)
- **Monorepo:** Single Nx workspace
- **Module Federation:** Runtime code sharing, independent deployments with HMR
- **Production-Ready:** All code must carry forward to Production

> **Note:** Migrated from Vite to Rspack to enable HMR with Module Federation v2. See [`docs/Rspack-Migration/`](docs/Rspack-Migration/) for migration details.

**Full Architecture:** [`docs/References/mfe-poc1-architecture.md`](docs/References/mfe-poc1-architecture.md)

---

## 📊 Project Status

**Current Phase:** POC-0 - Foundation  
**Status:** Ready for Implementation  
**Progress:** See [`docs/POC-0-Implementation/task-list.md`](docs/POC-0-Implementation/task-list.md)

---

## 🔗 Quick Links

- **🚀 Quick Start:** [`docs/POC-0-Implementation/QUICK-START.md`](docs/POC-0-Implementation/QUICK-START.md)
- **✅ Task List:** [`docs/POC-0-Implementation/task-list.md`](docs/POC-0-Implementation/task-list.md)
- **📝 Implementation Plan:** [`docs/POC-0-Implementation/implementation-plan.md`](docs/POC-0-Implementation/implementation-plan.md)
- **👨‍💻 Workflow Guide:** [`docs/Developer-Workflow/README-FIRST.md`](docs/Developer-Workflow/README-FIRST.md)
- **🏗️ Architecture:** [`docs/References/mfe-poc0-architecture.md`](docs/References/mfe-poc0-architecture.md)

---

**Last Updated:** 2026-01-XX  
**Status:** Ready for Implementation  
**Next Step:** Run `./scripts/verify-environment.sh` and start with [`docs/POC-0-Implementation/QUICK-START.md`](docs/POC-0-Implementation/QUICK-START.md)
