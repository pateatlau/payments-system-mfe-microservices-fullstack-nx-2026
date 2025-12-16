# Continuation Prompt - MFE Payments System POC-3

**Project:** MFE Payments System - Production-Ready Microfrontend Platform  
**Status:** POC-3 Complete - Production-Ready Infrastructure  
**Version:** 0.3.0  
**Last Updated:** December 12, 2025

---

## Project Context

This is a production-ready, full-stack microfrontend platform built with React 19, Nx, Rspack, Module Federation v2, Node.js, PostgreSQL, RabbitMQ, and nginx. The system demonstrates enterprise-grade architecture patterns for scalable payment processing applications.

**Repository:** https://github.com/pateatlau/payments-system-mfe-microservices-fullstack-nx-2026

---

## Current State

### Completed Phases
- ✅ **POC-0:** Foundation architecture and project structure
- ✅ **POC-1:** Rspack migration, Module Federation v2, HMR optimization
- ✅ **POC-2:** Backend integration, JWT authentication, design system
- ✅ **POC-3:** Production-ready infrastructure, observability, GraphQL

### Key Features Implemented
- Microfrontend architecture with Module Federation v2
- Microservices backend with separate databases per service
- nginx reverse proxy with HTTPS/TLS
- RabbitMQ event hub (migrated from Redis Pub/Sub)
- WebSocket real-time communication
- Complete observability stack (Prometheus, Grafana, Jaeger, Sentry)
- REST + GraphQL APIs with Swagger UI
- Banking-grade security (JWT, RBAC)

### Recent Changes (December 12, 2025)
- Fixed layout scrolling issues (removed unnecessary scrollbars)
- Made header sticky across all pages
- Temporarily increased rate limits (with TODO comments for restoration)
- Cleaned up documentation (removed 174 non-essential docs from git, kept locally)
- Removed backup/, scripts/, tmp/, .backup/ from git tracking (kept locally)

---

## Essential Documentation

Only these docs are in the remote repository (referenced in README.md):

1. `docs/EXECUTIVE_SUMMARY.md` - High-level architecture overview
2. `docs/POC-3-Implementation/ssl-tls-setup-guide.md` - HTTPS configuration
3. `docs/POC-3-Implementation/OBSERVABILITY_LIVE_SETUP.md` - Observability stack
4. `docs/POC-3-Implementation/testing-guide.md` - Testing instructions
5. `docs/POC-3-Implementation/implementation-plan.md` - Implementation details
6. `docs/POC-3-Implementation/SWAGGER_API_DOCUMENTATION.md` - API docs
7. `docs/POC-3-Implementation/RABBITMQ_IMPLEMENTATION.md` - Event hub guide

**Note:** All other documentation (POC-0, POC-1, POC-2, ADRs, References, etc.) exists locally but is not in git.

---

## Quick Start

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

**Access URLs:**
- Application: https://localhost
- Swagger UI: https://localhost/api-docs
- Grafana: http://localhost:3010 (admin/admin)
- Prometheus: http://localhost:9090
- Jaeger: http://localhost:16686

---

## Important Notes

### Rate Limiting
Rate limits are temporarily set to very high values (10000-100000) with TODO comments. Original values are preserved as comments for easy restoration:
- nginx: API (100 r/m), Auth (10 r/m), Static (1000 r/m)
- API Gateway: General (100 per 15min), Auth (5 per 15min)
- Services: 100 per 15min

**Search for:** `TODO: RESTORE ORIGINAL RATE LIMIT` to find all locations.

### Layout Fixes
All pages now use proper flex layout with `h-full min-h-0` to prevent unnecessary scrollbars. Header is sticky across all pages.

### Git Ignored Folders
These folders are in `.gitignore` and kept locally only:
- `backup/`, `.backup/`, `scripts/`, `tmp/`

---

## Technology Stack

**Frontend:** React 19.2.0, Rspack 1.6.x, Nx 21.x, Tailwind CSS 4.0+, Zustand, TanStack Query  
**Backend:** Node.js 24.11.x LTS, Express 5.x, PostgreSQL 16, Prisma, RabbitMQ 3.x, Redis 7.x  
**Infrastructure:** nginx, Docker, Prometheus, Grafana, Jaeger, Sentry

---

## Next Steps

- **CI/CD Pipeline:** Pending implementation
- **Cloud Deployment:** Pending implementation
- **Internet Live Demo:** Will be available after deployment

---

## Key Files

- `README.md` - Project overview and quick start
- `docs/EXECUTIVE_SUMMARY.md` - Architecture summary for stakeholders
- `docs/POC-3-Implementation/implementation-plan.md` - Detailed implementation
- `package.json` - All available scripts
- `.gitignore` - Ignored folders (backup/, scripts/, tmp/, .backup/)

---

**To continue work:** Review the essential documentation above, check `README.md` for quick start, and refer to `docs/POC-3-Implementation/implementation-plan.md` for detailed context.

