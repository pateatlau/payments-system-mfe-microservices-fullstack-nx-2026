# MFE Microservices Full-Stack Platform

**Status:** POC-0 - Foundation Implementation  
**Version:** 0.1.0  
**Tech Stack:** React 19 + Nx + Vite + Module Federation v2

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

## 🎯 Current Phase: POC-0

### Scope

**In Scope:**

- ✅ Shell app (host, Port 4200)
- ✅ Hello Remote app (remote, Port 4201)
- ✅ Module Federation v2 configuration
- ✅ Shared libraries (utils, ui, types)
- ✅ Basic testing setup

**NOT in Scope:**

- ❌ Backend (POC-2)
- ❌ Routing (POC-1)
- ❌ State Management (POC-1)
- ❌ Authentication (POC-1)
- ❌ Tailwind CSS (POC-1)

### Progress

Check current progress: [`docs/POC-0-Implementation/task-list.md`](docs/POC-0-Implementation/task-list.md)

---

## 🛠️ Technology Stack

### Frontend (POC-0)

- **React:** 19.2.0
- **Nx:** Latest
- **Vite:** 6.x
- **Module Federation:** @module-federation/enhanced 0.21.6 (BIMF)
- **Testing:** Vitest 2.0.x, React Testing Library 16.1.x
- **Package Manager:** pnpm 9.x
- **TypeScript:** 5.9.x (strict mode)

### Future Phases

- **POC-1:** Routing, State Management, Tailwind CSS v4
- **POC-2:** Backend Integration, Design System
- **POC-3:** Infrastructure, Performance, Enhanced Observability

---

## 📁 Project Structure

```
web-mfe-workspace/
├── apps/
│   ├── shell/              # Host (Port 4200) - POC-0
│   └── hello-remote/      # Remote (Port 4201) - POC-0
├── libs/
│   ├── shared-utils/      # Shared utilities - POC-0
│   ├── shared-ui/          # Shared UI components - POC-0
│   └── shared-types/       # Shared TypeScript types - POC-0
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

### 2. Read Quick Start Guide

See: [`docs/POC-0-Implementation/QUICK-START.md`](docs/POC-0-Implementation/QUICK-START.md)

### 3. Start Implementation

Open Cursor and use the first prompt from [`docs/Prompts/POC-0/first-prompt.md`](docs/Prompts/POC-0/first-prompt.md)

---

## 📖 Key Documentation

### For Implementation

1. **Start Here:** [`docs/POC-0-Implementation/QUICK-START.md`](docs/POC-0-Implementation/QUICK-START.md)
2. **Track Progress:** [`docs/POC-0-Implementation/task-list.md`](docs/POC-0-Implementation/task-list.md)
3. **Follow Plan:** [`docs/POC-0-Implementation/implementation-plan.md`](docs/POC-0-Implementation/implementation-plan.md)

### For Understanding

1. **Architecture:** [`docs/References/mfe-poc0-architecture.md`](docs/References/mfe-poc0-architecture.md)
2. **Tech Stack:** [`docs/References/mfe-poc0-tech-stack.md`](docs/References/mfe-poc0-tech-stack.md)
3. **ADRs:** [`docs/adr/poc-0/`](docs/adr/poc-0/)

### For Workflow

1. **Workflow Guide:** [`docs/Developer-Workflow/README-FIRST.md`](docs/Developer-Workflow/README-FIRST.md)
2. **Resuming Work:** [`docs/Prompts/POC-0/continuation-prompt.md`](docs/Prompts/POC-0/continuation-prompt.md)

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

- **Frontend:** React 19 + Nx + Vite + Module Federation v2 (BIMF)
- **Monorepo:** Single Nx workspace
- **Module Federation:** Runtime code sharing, independent deployments
- **Production-Ready:** All code must carry forward to Production

**Full Architecture:** [`docs/References/mfe-poc0-architecture.md`](docs/References/mfe-poc0-architecture.md)

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
