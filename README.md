# MFE Payments System - Production-Ready Microfrontend Platform

**Version:** 0.3.0  
**Status:** POC-3 Complete – Production-Ready Infrastructure + UI/UX Enhancements  
**Tech Stack:** React 19 + Nx + Rspack + Module Federation v2 + Node.js + PostgreSQL + RabbitMQ + nginx

---

## Overview

A production-ready, full-stack microfrontend platform demonstrating enterprise-grade architecture patterns for building scalable payment processing applications. Features independent deployment of frontend modules and backend microservices, complete observability stack, and banking-grade security.

### Key Features

- **Microfrontend Architecture:** Module Federation v2 with independent deployments
- **Microservices Backend:** Domain-driven service decomposition with separate databases
- **Production Infrastructure:** nginx reverse proxy, HTTPS/TLS, rate limiting, load balancing
- **Event-Driven:** RabbitMQ for reliable asynchronous messaging
- **Real-Time:** WebSocket server for bidirectional communication
- **Dual API:** REST (Swagger UI) + GraphQL (Apollo Server)
- **Full Observability:** Prometheus metrics, Grafana dashboards, Jaeger tracing, Sentry errors
- **Banking-Grade Security:** JWT authentication, RBAC, secure session management

### Architecture

```
[nginx Proxy] → [API Gateway] → [Auth, Payments, Admin, Profile Services]
                      ↓                           ↓
                [WebSocket]                 [Separate DBs]
                      ↓                           ↓
            [Shell + 3 MFEs]              [RabbitMQ Events]
```

---

## Quick Start

### Prerequisites

- **Node.js:** 24.11.x LTS
- **pnpm:** 9.x
- **Docker & Docker Compose:** Latest
- **Git:** Latest
- **Docker resources:** Allocate at least 4 GB RAM

### 1. Clone Repository

```bash
git clone <repository-url>
cd payments-system-mfe-microservices-fullstack-nx-2026
```

### 2. Install Dependencies

```bash
pnpm install
```

### 3. Set Up Environment Files

```bash
cp .env.example .env
# If present, also copy: cp .env.required .env.required.local
```

Fill in (or keep defaults):
- Database URLs for auth/payments/admin/profile services
- RabbitMQ credentials and host
- nginx host/ports
- Sentry DSN (or leave blank for local)

### 4. Prepare Databases

```bash
pnpm backend:setup
# (Runs Prisma generate + migrations for all services)
```

### 5. Generate SSL Certificates

```bash
pnpm ssl:generate
```

To trust the self-signed cert:
- macOS: open `nginx/ssl/self-signed.crt` in Keychain Access → set to Always Trust
- Windows: import into Trusted Root Certification Authorities
- If you prefer HTTP-only dev, you can later start the frontend via `pnpm dev:mf` (HTTP mode).

### 6. Start Infrastructure

```bash
# Start nginx, PostgreSQL databases, RabbitMQ, Redis, Prometheus, Grafana, Jaeger
pnpm infra:start
```

### 7. Start Backend Services

```bash
# Starts API Gateway, Auth, Payments, Admin, Profile services
pnpm dev:backend
```

### 8. Start Frontend

```bash
# Starts Shell app and all MFEs (Auth, Payments, Admin, Profile)
pnpm dev:all

# If HTTPS causes issues, use HTTP mode (no cert trust needed):
pnpm dev:mf
```

### 9. Access Application

Open your browser and navigate to:

| Service         | URL                        | Credentials |
| --------------- | -------------------------- | ----------- |
| **Application** | https://localhost          | -           |
| **Swagger UI**  | https://localhost/api-docs | -           |
| **Grafana**     | http://localhost:3010      | admin/admin |
| **Prometheus**  | http://localhost:9090      | -           |
| **Jaeger**      | http://localhost:16686     | -           |

**Note:** Accept the self-signed certificate warning in your browser.

### 10. Run Tests

```bash
# Run all tests
pnpm test

# Run backend tests
pnpm test:backend

# Run E2E tests (requires services running)
pnpm test:e2e
```

### Quick Troubleshooting

- If services fail to start: ensure Docker is running, then rerun `pnpm backend:setup` and `pnpm infra:start`.
- If HTTPS shows cert errors: trust the generated cert (above) or use HTTP mode via `pnpm dev:mf`.
- If ports are occupied: check 3000–3004, 4200–4204, 443/80, 9090, 3010, 16686, 5672/15672, 6379.

---

## Project Structure

```
payments-system-mfe/
├── apps/
│   ├── Frontend MFEs
│   │   ├── shell/              # Host application (4200)
│   │   ├── auth-mfe/           # Authentication (4201)
│   │   ├── payments-mfe/       # Payments (4202)
│   │   ├── admin-mfe/          # Admin (4203)
│   │   └── profile-mfe/        # Profile (4204)
│   └── Backend Services
│       ├── api-gateway/        # API Gateway (3000)
│       ├── auth-service/       # Auth (3001)
│       ├── payments-service/   # Payments (3002)
│       ├── admin-service/      # Admin (3003)
│       └── profile-service/    # Profile (3004)
├── libs/
│   ├── Frontend Libraries
│   │   ├── shared-types/
│   │   ├── shared-auth-store/
│   │   ├── shared-api-client/
│   │   ├── shared-event-bus/
│   │   └── shared-design-system/
│   └── Backend Libraries
│       └── backend/
│           ├── observability/
│           └── rabbitmq-event-hub/
├── nginx/                      # Reverse proxy configuration
├── prometheus/                 # Metrics configuration
├── grafana/                    # Dashboards
└── docs/                       # Documentation
```

---

## Technology Stack

### Frontend

- React 19.2.0 with TypeScript 5.9.x
- Rspack 1.6.x with Module Federation v2
- Nx 21.x monorepo
- Tailwind CSS 4.0+ and shadcn/ui
- Zustand + TanStack Query for state management
- React Hook Form + Zod for forms

### Backend

- Node.js 24.11.x LTS with Express 5.x
- PostgreSQL 16 with Prisma ORM
- RabbitMQ 3.x for event-driven messaging
- Redis 7.x for caching
- REST + GraphQL APIs

### Infrastructure

- nginx reverse proxy with SSL/TLS
- Docker + Docker Compose
- Prometheus + Grafana + Jaeger
- Sentry error tracking

---

## Development Commands

```bash
# Infrastructure
pnpm infra:start              # Start all Docker services
pnpm infra:stop               # Stop all Docker services
pnpm observability:start      # Start Prometheus, Grafana, Jaeger

# Backend
pnpm dev:backend              # Start all backend services
pnpm test:backend             # Run backend tests
pnpm backend:setup            # Setup databases with Prisma

# Frontend
pnpm dev:all                  # Start all frontend MFEs
pnpm dev:mf                   # Start frontend (HTTP mode)
pnpm test                     # Run all frontend tests
pnpm test:coverage            # Run tests with coverage

# Build
pnpm build                    # Build all projects
pnpm build:backend            # Build backend services only

# Testing
pnpm test:e2e                 # Run E2E tests with Playwright
pnpm test:affected            # Run tests for changed code

# Utilities
pnpm ssl:generate             # Generate SSL certificates
pnpm swagger:ui               # Open Swagger API docs
pnpm grafana:ui               # Open Grafana dashboards
```

---

## Key Features Implemented

### POC-0: Foundation

- Nx monorepo with React + TypeScript
- Module Federation v2 with Rspack
- Shared component libraries

### POC-1: Rspack Migration

- Migrated from Vite to Rspack
- Module Federation with HMR
- Performance optimizations

### POC-2: Backend Integration

- Full-stack microservices architecture
- JWT authentication with RBAC
- Design system (shadcn/ui + Tailwind v4)
- Event bus for inter-service communication

### POC-3: Production Infrastructure

- nginx reverse proxy with HTTPS/TLS
- Separate databases per service
- RabbitMQ event hub
- WebSocket real-time communication
- Complete observability stack
- GraphQL API alongside REST
- Interactive API documentation (Swagger)
- Advanced caching strategies
- Cross-tab/device session sync

---

## Testing

The project includes comprehensive testing:

- **Unit Tests:** Jest + React Testing Library (70%+ coverage)
- **Integration Tests:** Full-stack integration scenarios
- **E2E Tests:** Playwright for critical user journeys
- **Load Tests:** Performance and stress testing
- **Security Tests:** Authentication, authorization, CORS

Run tests with:

```bash
pnpm test                     # All tests
pnpm test:coverage            # With coverage report
pnpm test:e2e                 # End-to-end tests
```

---

## Documentation

### Key Resources (Start Here)

- [Executive Summary](docs/EXECUTIVE_SUMMARY.md) – High-level overview for stakeholders
- [Implementation Journey](docs/IMPLEMENTATION-JOURNEY.md) – Evolution from POC-0 → POC-3
- [POC-3 Implementation Plan](docs/POC-3-Implementation/implementation-plan.md) – Phases 1–9, current status
- [POC-3 Task List](docs/POC-3-Implementation/task-list.md) – Progress tracking checklist
- [Dark Mode – Full Plan](docs/POC-3-Implementation/DARK-MODE-FULL-IMPLEMENTATION-PLAN.md) – Steps A–I, tests, guardrails
- [Theme Guardrails](docs/POC-3-Implementation/THEME-GUARDRAILS.md) – ESLint rules and patterns
- [SSL/TLS Setup Guide](docs/POC-3-Implementation/ssl-tls-setup-guide.md) – HTTPS config + troubleshooting
- [Observability Setup](docs/POC-3-Implementation/OBSERVABILITY_LIVE_SETUP.md) – Prometheus/Grafana/Jaeger
- [Swagger API Docs](docs/POC-3-Implementation/SWAGGER_API_DOCUMENTATION.md) – REST endpoints and auth

### Reference (As Needed)

- [ADR Index](docs/adr/) – Architecture decisions across POC-3
- [Developer Workflow](docs/Developer-Workflow/) – Local dev and conventions
- [Rspack Migration Notes](docs/Rspack-Migration/) – Rspack + Module Federation details
- [Payments MFE Notes](docs/POC-3-Implementation/PAYMENT-DETAILS-INTEGRATION.md) – Key implementation details
- For everything else, see [docs/](docs/) — many files are historical/temporary. The links above are the authoritative references.

### Payments MFE – Main Flow Highlights

- Status badges with tooltips/icons via shared `StatusBadge`
- Toast notifications for create/update/cancel success and errors
- Role-aware empty states in list and reports
- Accessibility: modal dialog semantics and focus management

---

## Current Status

- **Development Environment:** Fully functional with HTTPS/TLS, observability stack, and production-ready infrastructure
- **Live Demo:** Available locally at https://localhost with complete feature set
- **CI/CD & Deployment:** Pending implementation (planned for next phase)
- **Internet Live Demo:** Will be available once deployment pipeline is implemented

---

## Support

For detailed setup instructions, troubleshooting, and development workflows, refer to the documentation links above.

---

**Last Updated:** December 23, 2025  
**Status:** Production-Ready Architecture + UI/UX Polished (Dark Mode, Mobile, Navigation)  
**Next Phase:** CI/CD Pipeline + Cloud Deployment
