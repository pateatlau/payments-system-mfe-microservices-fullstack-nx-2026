# MFE Payments System - Executive Summary

**Document Version:** 1.1  
**Date:** December 25, 2025  
**Status:** POC-3 Complete - MVP feature-complete; CI/CD pending  
**Prepared For:** Senior Architecture Review  
**Repository:** [GitHub](https://github.com/pateatlau/payments-system-mfe-microservices-fullstack-nx-2026)

---

## Table of Contents

1. [Executive Overview](#1-executive-overview)
2. [Architecture Overview](#2-architecture-overview)
3. [Technology Stack](#3-technology-stack)
4. [Frontend Architecture](#4-frontend-architecture)
5. [Backend Architecture](#5-backend-architecture)
6. [Infrastructure](#6-infrastructure)
7. [Security](#7-security)
8. [Observability](#8-observability)
9. [API Documentation](#9-api-documentation)
10. [Development Workflow](#10-development-workflow)

---

## 1. Executive Overview

### Project Summary

The MFE Payments System is a production-ready, full-stack microfrontend platform built with modern technologies. It demonstrates enterprise-grade architecture patterns for building scalable, maintainable payment processing applications.

### Key Achievements

| Milestone | Status   | Description                                                                       |
| --------- | -------- | --------------------------------------------------------------------------------- |
| POC-0     | Complete | Foundation architecture and project structure                                     |
| POC-1     | Complete | Rspack migration, Module Federation v2, HMR optimization                          |
| POC-2     | Complete | Backend integration, JWT authentication, design system                            |
| POC-3     | Complete | Production-ready infrastructure, observability, GraphQL; theme system implemented |

### Business Value

- **Scalability:** Independent deployment of frontend modules and backend services
- **Maintainability:** Clear separation of concerns with domain-driven design
- **Performance:** Sub-second page loads with code splitting and caching
- **Security:** Banking-grade authentication with JWT and RBAC
- **Observability:** Full visibility into system health and performance

### Current Status

- **Development Environment:** Fully functional with HTTPS/TLS, observability stack, and production-ready infrastructure
- **Live Demo:** Available locally at https://localhost with complete feature set
- **CI/CD & Deployment:** Pending implementation (planned for next phase)
- **Internet Live Demo:** Will be available once deployment pipeline is implemented

---

## 2. Architecture Overview

### High-Level Architecture

```
                                    [Internet]
                                        |
                                        v
                              +------------------+
                              |   nginx Proxy    |
                              |  (SSL/TLS, LB)   |
                              +------------------+
                                        |
              +-------------------------+-------------------------+
              |                         |                         |
              v                         v                         v
    +------------------+      +------------------+      +------------------+
    |   Shell App      |      |   API Gateway    |      |   WebSocket      |
    |   (Port 4200)    |      |   (Port 3000)    |      |   Server         |
    +------------------+      +------------------+      +------------------+
              |                         |
    +---------+---------+---------+     +---------+---------+---------+
    |         |         |         |     |         |         |         |
    v         v         v         v     v         v         v         v
 +------+ +------+ +------+ +------+ +------+ +------+ +------+ +------+
 | Auth | | Pay  | |Admin | |Profile| | Auth | | Pay  | |Admin | |Profile|
 | MFE  | | MFE  | | MFE  | | MFE  | | Svc  | | Svc  | | Svc  | | Svc  |
 +------+ +------+ +------+ +------+ +------+ +------+ +------+ +------+
                                |         |         |         |
                                v         v         v         v
                           +------+  +------+  +------+  +------+
                           |Auth  |  |Pay   |  |Admin |  |Profile|
                           |  DB  |  |  DB  |  |  DB  |  |  DB  |
                           +------+  +------+  +------+  +------+
```

### Architecture Principles

1. **Microfrontend Architecture:** Independent, deployable frontend modules
2. **Microservices Backend:** Domain-driven service decomposition
3. **API Gateway Pattern:** Single entry point for all backend requests
4. **Event-Driven Communication:** Asynchronous messaging via RabbitMQ
5. **Database per Service:** Data isolation and independent scaling

---

## 3. Technology Stack

### Frontend Technologies

| Category      | Technology            | Version         | Purpose                                      |
| ------------- | --------------------- | --------------- | -------------------------------------------- |
| Framework     | React                 | 18.3.1          | UI components and state management           |
| Build Tool    | Rspack                | 1.6.x           | Fast bundling with Module Federation         |
| Monorepo      | Nx                    | 22.1.x          | Workspace management and build orchestration |
| Styling       | Tailwind CSS          | 4.0.0           | Utility-first CSS framework                  |
| State         | Zustand               | 4.5.x           | Client-side state management                 |
| Server State  | TanStack Query        | 5.x             | Server state and caching                     |
| Forms         | React Hook Form + Zod | 7.52.x / 3.25.x | Form handling and validation                 |
| Design System | shadcn/ui             | Latest          | Accessible component library                 |

### Backend Technologies

| Category       | Technology     | Version | Purpose                     |
| -------------- | -------------- | ------- | --------------------------- |
| Runtime        | Node.js        | 20.x    | Server-side JavaScript      |
| Framework      | Express        | 5.x     | HTTP server framework       |
| Database       | PostgreSQL     | 16      | Relational data storage     |
| ORM            | Prisma         | 5.x     | Type-safe database access   |
| Cache          | Redis          | 7.x     | Caching and session storage |
| Message Broker | RabbitMQ       | 3.x     | Event-driven messaging      |
| API            | REST + GraphQL | -       | Dual API support            |

### Infrastructure Technologies

| Category         | Technology     | Purpose                                        |
| ---------------- | -------------- | ---------------------------------------------- |
| Reverse Proxy    | nginx          | SSL termination, load balancing, rate limiting |
| Containerization | Docker         | Service isolation and deployment               |
| Orchestration    | Docker Compose | Local development environment                  |
| Metrics          | Prometheus     | Metrics collection and alerting                |
| Dashboards       | Grafana        | Visualization and monitoring                   |
| Tracing          | Jaeger         | Distributed tracing                            |
| Error Tracking   | Sentry         | Error monitoring and alerting                  |

---

## 4. Frontend Architecture

### Module Federation Strategy

The frontend uses Webpack Module Federation v2 (via Rspack) to enable independent deployment of microfrontends.

**Shell Application (Host)**

- Orchestrates microfrontend loading
- Manages routing and navigation
- Provides shared context and authentication

**Remote Microfrontends**

| MFE          | Port | Exposed Modules | Responsibility            |
| ------------ | ---- | --------------- | ------------------------- |
| Auth MFE     | 4201 | SignIn, SignUp  | User authentication flows |
| Payments MFE | 4202 | PaymentsPage    | Payment processing UI     |
| Admin MFE    | 4203 | AdminDashboard  | Administrative functions  |
| Profile MFE  | 4204 | ProfilePage     | User profile management   |

### Shared Libraries

```
libs/
├── shared-types/          # TypeScript interfaces and types
├── shared-utils/          # Common utility functions
├── shared-ui/             # Base UI components
├── shared-design-system/  # shadcn/ui components
├── shared-auth-store/     # Authentication state (Zustand)
├── shared-api-client/     # HTTP client with interceptors
├── shared-event-bus/      # Inter-MFE communication
├── shared-header-ui/      # Shared header component
├── shared-websocket/      # WebSocket client
├── shared-session-sync/   # Cross-tab/device session sync
└── shared-theme-store/    # Theme management (dark/light mode)
```

### State Management Strategy

| State Type   | Solution        | Use Case                              |
| ------------ | --------------- | ------------------------------------- |
| Client State | Zustand         | Authentication, UI preferences, theme |
| Server State | TanStack Query  | API data, caching, background sync    |
| Form State   | React Hook Form | Form inputs, validation               |
| Cross-MFE    | Event Bus       | Inter-module communication            |

### Theme System (Dark Mode / Light Mode)

The application supports system-aware theme switching with user preference persistence.

**Features:**

- Light and dark mode support
- System preference detection (follows OS theme)
- User preference override (stored in Zustand with localStorage persistence)
- Cross-tab synchronization via BroadcastChannel
- Design system integration (Tailwind CSS v4 with CSS variables)
- Smooth theme transitions

**Implementation:**

- Theme state managed via Zustand (`shared-theme-store`)
- CSS variables for theme colors (light/dark variants)
- Automatic theme application to DOM
- Profile MFE integration (planned) for user preference management

**Status:** Planned - Implementation in progress
**Update (Dec 2025):** Implemented across Shell and MFEs; user preference persistence, system detection, and cross-tab sync verified. Profile MFE preference storage remains in progress.

---

## 5. Backend Architecture

### Service Decomposition

| Service          | Port | Database    | Responsibility                                 |
| ---------------- | ---- | ----------- | ---------------------------------------------- |
| API Gateway      | 3000 | -           | Request routing, authentication, rate limiting |
| Auth Service     | 3001 | auth_db     | User management, JWT tokens, RBAC              |
| Payments Service | 3002 | payments_db | Payment processing, transaction history        |
| Admin Service    | 3003 | admin_db    | User administration, system management         |
| Profile Service  | 3004 | profile_db  | User profiles, preferences                     |

### API Gateway Features

- **Request Routing:** Path-based routing to backend services
- **Authentication:** JWT validation and user context injection
- **Rate Limiting:** Configurable limits per endpoint
- **CORS:** Cross-origin request handling
- **Streaming Proxy:** Zero-buffering request/response streaming
- **GraphQL:** Apollo Server with schema stitching
- **WebSocket:** Real-time bidirectional communication

### Event-Driven Architecture

RabbitMQ provides reliable, persistent messaging between services.

**Exchange Topology**

| Exchange       | Type   | Purpose                   |
| -------------- | ------ | ------------------------- |
| user.events    | topic  | User-related events       |
| payment.events | topic  | Payment processing events |
| admin.events   | topic  | Administrative events     |
| system.events  | fanout | System-wide notifications |

**Event Flow Example**

```
[Auth Service] ---> [user.events] ---> [Payments Service]
     |                   |                    |
     |                   |                    v
     |                   |            Update user context
     |                   |
     |                   +-----------> [Admin Service]
     |                                       |
     v                                       v
 user.created                        Log audit event
```

---

## 6. Infrastructure

### nginx Configuration

nginx serves as the primary entry point with the following capabilities:

| Feature                 | Configuration                                  |
| ----------------------- | ---------------------------------------------- |
| SSL/TLS                 | TLS 1.2+ with modern cipher suites             |
| HTTP/2                  | Enabled for improved performance               |
| Rate Limiting           | API: 100 req/min, Auth: 10 req/min             |
| Compression             | gzip for text, JSON, JavaScript                |
| Caching                 | Static assets cached for 1 year                |
| WebSocket               | Upgrade support for real-time features         |
| Frontend Load Balancing | least_conn for HTTP, ip_hash for WebSocket/HMR |

### Frontend Load Balancing

nginx provides load balancing for all frontend MFEs to enable horizontal scaling and high availability.

**Configuration:**

- **Algorithm:** `least_conn` for regular HTTP traffic (better load distribution)
- **Sticky Sessions:** `ip_hash` for WebSocket and HMR endpoints (required for persistent connections)
- **Instances:** Multiple instances per MFE (2-3 instances recommended)
- **Health Checks:** Basic nginx (no built-in health checks, relies on container orchestration)

**Supported MFEs:**

- Shell App (port 4200+)
- Auth MFE (port 4201+)
- Payments MFE (port 4202+)
- Admin MFE (port 4203+)
- Profile MFE (port 4204+)

**Requirements:**

- All instances must serve identical builds (especially remoteEntry.js for Module Federation)
- Stateless architecture (all state is client-side) - simplifies load balancing
- WebSocket connections require sticky sessions to maintain connection state

**Status:** Planned - Part of Profile MFE Phase 6 implementation

### Database Architecture

Each service maintains its own PostgreSQL database for data isolation:

| Database    | Port | Service          | Tables                  |
| ----------- | ---- | ---------------- | ----------------------- |
| auth_db     | 5432 | Auth Service     | users, sessions, tokens |
| payments_db | 5433 | Payments Service | payments, transactions  |
| admin_db    | 5434 | Admin Service    | audit_logs, settings    |
| profile_db  | 5435 | Profile Service  | profiles, preferences   |

### Caching Strategy

| Layer    | Technology     | TTL      | Use Case                       |
| -------- | -------------- | -------- | ------------------------------ |
| Browser  | Service Worker | Varies   | Static assets, offline support |
| CDN      | nginx          | 1 year   | Immutable assets               |
| API      | Redis          | 5-60 min | Query results, sessions        |
| Database | Prisma         | -        | Connection pooling             |

---

## 7. Security

### Authentication Flow

```
[Client] --> [API Gateway] --> [Auth Service]
    |              |                 |
    |              |                 v
    |              |          Validate credentials
    |              |                 |
    |              |                 v
    |              |          Generate JWT tokens
    |              |                 |
    |              <-----------------+
    |              |
    |              v
    |        Set HTTP-only cookies
    |              |
    <--------------+
```

### JWT Token Strategy

| Token         | Lifetime   | Storage          | Purpose            |
| ------------- | ---------- | ---------------- | ------------------ |
| Access Token  | 15 minutes | Memory           | API authentication |
| Refresh Token | 7 days     | HTTP-only cookie | Token renewal      |

### Role-Based Access Control (RBAC)

| Role     | Permissions                                     |
| -------- | ----------------------------------------------- |
| ADMIN    | Full system access, user management, audit logs |
| CUSTOMER | View/create payments, manage own profile        |
| VENDOR   | Initiate payments, view reports, limited admin  |

### Security Headers

```
X-Frame-Options: SAMEORIGIN
X-Content-Type-Options: nosniff
X-XSS-Protection: 1; mode=block
Referrer-Policy: strict-origin-when-cross-origin
Content-Security-Policy: default-src 'self'; ...
```

---

## 8. Observability

### Metrics (Prometheus)

**Key Metrics Collected**

| Metric                        | Type      | Description                             |
| ----------------------------- | --------- | --------------------------------------- |
| http_requests_total           | Counter   | Total requests by method, route, status |
| http_request_duration_seconds | Histogram | Request latency distribution            |
| http_active_connections       | Gauge     | Current active connections              |
| http_errors_total             | Counter   | Error count by type                     |

**Scrape Targets**

All backend services expose metrics at `/metrics` endpoint, scraped every 10-15 seconds.

### Dashboards (Grafana)

Two pre-configured dashboards are provided:

**Services Overview Dashboard**

- Service health status (UP/DOWN indicators)
- Request rate comparison across services
- P95 latency comparison

**API Gateway Dashboard**

- Request rate (requests/second)
- Response time percentiles (p50, p90, p95, p99)
- Error rate percentage
- Active connections
- Request breakdown by method, status, route

### Distributed Tracing (Jaeger)

OpenTelemetry instrumentation provides end-to-end request tracing:

- Automatic span creation for HTTP requests
- Database query tracing
- Cross-service correlation
- Latency breakdown analysis

### Error Tracking (Sentry)

Sentry integration captures and aggregates errors:

- Automatic exception capture
- User context association
- Release tracking
- Performance monitoring

---

## 9. API Documentation

### REST API

Interactive API documentation available via Swagger UI:

| Endpoint       | Description                      |
| -------------- | -------------------------------- |
| /api-docs      | Swagger UI interface             |
| /api-docs.json | OpenAPI 3.0 specification (JSON) |
| /api-docs.yaml | OpenAPI 3.0 specification (YAML) |

**API Endpoints Summary**

| Category | Endpoints        | Authentication           |
| -------- | ---------------- | ------------------------ |
| Auth     | /api/auth/\*     | Public (login, register) |
| Payments | /api/payments/\* | JWT required             |
| Admin    | /api/admin/\*    | JWT + ADMIN role         |
| Profile  | /api/profile/\*  | JWT required             |
| Health   | /health/\*       | Public                   |

### GraphQL API

Apollo Server provides a GraphQL API alongside REST:

| Endpoint | Method | Description                   |
| -------- | ------ | ----------------------------- |
| /graphql | POST   | GraphQL queries and mutations |
| /graphql | GET    | API information               |

**Schema Features**

- Custom directives (@auth, @admin) for authorization
- Type-safe resolvers with TypeScript
- Automatic schema documentation

---

## 10. Development Workflow

### Quick Start

```bash
# 1. Install dependencies
pnpm install

# 2. Generate SSL certificates (first time)
pnpm ssl:generate

# 3. Start infrastructure
pnpm infra:start

# 4. Start backend services
pnpm dev:backend

# 5. Start frontend
pnpm dev:all

# 6. Access application
open https://localhost
```

### Available Scripts

| Script                   | Description                       |
| ------------------------ | --------------------------------- |
| pnpm dev:all             | Start all frontend MFEs           |
| pnpm dev:backend         | Start all backend services        |
| pnpm infra:start         | Start Docker infrastructure       |
| pnpm test                | Run all tests                     |
| pnpm build               | Build all projects                |
| pnpm observability:start | Start Prometheus, Grafana, Jaeger |

### Access URLs

| Service     | URL                        | Credentials |
| ----------- | -------------------------- | ----------- |
| Application | https://localhost          | -           |
| Swagger UI  | https://localhost/api-docs | -           |
| GraphQL     | https://localhost/graphql  | -           |
| Prometheus  | http://localhost:9090      | -           |
| Grafana     | http://localhost:3010      | admin/admin |
| Jaeger      | http://localhost:16686     | -           |
| RabbitMQ    | http://localhost:15672     | admin/admin |

### Testing Strategy

| Test Type   | Framework      | Coverage Target       |
| ----------- | -------------- | --------------------- |
| Unit        | Jest + RTL     | 70%+                  |
| Integration | Jest           | Key flows             |
| E2E         | Playwright     | Critical paths        |
| Load        | Custom scripts | Performance baselines |

---

## Appendix: Project Structure

```
payments-system-mfe/
├── apps/
│   ├── shell/                 # Host application
│   ├── auth-mfe/              # Authentication microfrontend
│   ├── payments-mfe/          # Payments microfrontend
│   ├── admin-mfe/             # Admin microfrontend
│   ├── api-gateway/           # API Gateway service
│   ├── auth-service/          # Authentication service
│   ├── payments-service/      # Payments service
│   ├── admin-service/         # Admin service
│   └── profile-service/       # Profile service
├── libs/
│   ├── shared-*/              # Shared frontend libraries
│   └── backend/               # Shared backend libraries
├── nginx/                     # nginx configuration
├── prometheus/                # Prometheus configuration
├── grafana/                   # Grafana dashboards
├── rabbitmq/                  # RabbitMQ definitions
└── docs/                      # Documentation
```

---

## Future Roadmap

### Planned for Next Phase

**CI/CD Pipeline**

- Automated build and deployment workflows
- Multi-environment deployment (dev, staging, production)
- Automated testing in CI pipeline
- Container registry integration
- Infrastructure as Code (IaC)

**Cloud Deployment**

- Cloud provider selection and configuration
- Kubernetes orchestration
- Auto-scaling configuration
- CDN integration
- Production-grade SSL certificates

**User Experience Enhancements**

| Dark mode theme system (implemented)

- Theme preference management in Profile MFE
- Enhanced accessibility features

**Internet Live Demo**

- Public-facing demo environment
- Sample data and test accounts
- Interactive feature showcase
- Performance benchmarks

---

**Document End**

_This document provides a high-level overview of the MFE Payments System architecture. For detailed implementation guides, refer to the documentation in the `docs/` directory._

**Note:** The system is production-ready from an architectural standpoint. CI/CD and cloud deployment infrastructure are the final steps for public availability.
