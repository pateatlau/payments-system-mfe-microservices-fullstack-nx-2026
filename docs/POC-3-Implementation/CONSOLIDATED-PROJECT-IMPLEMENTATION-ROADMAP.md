# Consolidated Project Implementation Roadmap (Single Source of Truth)

**Status:** Authoritative / Actionable  
**Audience:** Architect + Cursor (implementation agent)  
**Principle:** Security-first, production-grade, no parallel shortcuts

---

## 0. Purpose of This Document

This file consolidates **all implemented features**, **all confirmed gaps**, and a **single, linear implementation roadmap** derived from previously segmented documents.

It replaces all prior planning, hardening, CI/CD, database, observability, and quick-reference documents.

This is the **only file** that should be followed to complete the project.

---

## 1. Current State — What Is Already Implemented

### 1.1 Frontend (Web + MFEs)

**Architecture (DONE)**
- Shell + 4 remotes (auth, payments, admin, profile)
- Module Federation v2 (Rspack)
- Shared singleton libs (auth store, API client, session sync, websocket)
- Central routing in shell

**State & Data (DONE)**
- React Query for server state
- Zustand for auth/session state
- BroadcastChannel-based cross-tab sync

**WebSocket (DONE)**
- Single WebSocketProvider in shell
- JWT-authenticated WebSocket via API Gateway
- RabbitMQ → WebSocket event bridge
- Hooks for real-time updates in MFEs

**Observability (PARTIAL – ~70%)**
- Sentry SDK integrated (frontend + backend)
- Prometheus, Grafana, Jaeger running locally
- Shared observability libs implemented

---

### 1.2 Backend (Microservices)

**Services (DONE)**
- API Gateway
- Auth Service
- Payments Service
- Admin Service
- Profile Service

**Auth (PARTIAL)**
- JWT access + refresh tokens
- RBAC middleware
- Password hashing + validation

**Known Gaps**
- No refresh token rotation
- Tokens stored client-side
- No account lockout
- Weak secrets management

**Infrastructure (LOCAL ONLY)**
- Docker Compose
- PostgreSQL (4 DBs)
- Redis
- RabbitMQ

---

### 1.3 Database

**DONE**
- One PostgreSQL database per service
- Prisma ORM + schemas
- Local migrations

**NOT DONE**
- Production migrations
- Backups
- Connection pooling
- Disaster recovery

---

## 2. Non-Negotiable Constraints (Hard Rules)

1. Security before deployment — no internet exposure with known vulnerabilities
2. No coupling between MFEs — shared libs only
3. Backend owns all invariants — frontend stays thin
4. No CI/CD before critical security fixes
5. This document is the single source of truth

---

## 3. Production Readiness Pillars

```
PILLAR 1: SECURITY        (BLOCKING)
PILLAR 2: INFRASTRUCTURE (CRITICAL PATH)
PILLAR 3: OBSERVABILITY  (PARALLEL)
```

---

## 4. PILLAR 1 — Security Hardening (BLOCKING)

**Timeline:** 2–3 weeks  
**Gate:** Zero critical vulnerabilities

### 4.1 Backend Security — Phase 1

1. Restore rate limiting
   - 100 req / 15 min (general)
   - 5 req / 15 min (auth)
   - Redis-backed

2. JWT refresh token rotation
   - Rotate on every refresh
   - Invalidate previous token
   - Persist in DB

3. Account lockout
   - 5 failed attempts → 15 min lock
   - Reset on successful login

4. Input validation
   - Zod schemas for Payments service
   - Zod schemas for Admin service

---

### 4.2 Frontend Auth & Session Hardening

1. Move auth to HttpOnly cookies
   - access + refresh tokens
   - Secure, SameSite=Strict

2. Switch API client to cookie-based auth

3. CSRF protection
   - CSRF token endpoint
   - Header validation

4. Remove token persistence from localStorage

---

### 4.3 MFE Security Hardening

1. Harden CSP (remove unsafe-inline / unsafe-eval)
2. Restore frontend rate limiting
3. Subresource Integrity (SRI) for MFEs
4. Module Federation remote signature verification
5. Event bus validation

---

### 4.4 Security Validation — GATE 1

- OWASP ZAP scan
- Auth abuse simulation
- Input injection testing

**Gate 1:** Security sign-off

---

## 5. PILLAR 2 — Infrastructure & CI/CD (CRITICAL PATH)

**Timeline:** 3–4 weeks

### 5.1 CI Pipeline

1. Nx affected builds
2. Unit + e2e tests
3. Docker image builds
4. Artifact caching

---

### 5.2 Cloud Infrastructure (AWS)

Provision:
- ECR
- ECS (Fargate)
- ALB
- RDS (4 DBs)
- ElastiCache (Redis)
- Amazon MQ (RabbitMQ)

---

### 5.3 Database Hardening

1. Prisma migrate deploy (staging → prod)
2. Automated backups
3. Connection pooling
4. Monitoring + slow query logs

**Gate 2:** Infrastructure ready

---

## 6. PILLAR 3 — Observability (PARALLEL)

**Timeline:** 1–2 weeks

### Mandatory

1. Frontend DSN injection
2. Production sampling rates
3. PII scrubbing
4. Source map upload via CI

### Enhancements

- Alerting rules
- Dashboard customization
- Optional router instrumentation

**Gate 3:** Full visibility confirmed

---

## 7. Final Timeline

```
Week 1–2  Security Hardening (BLOCKING)
Week 3    Security Validation (Gate 1)
Week 4    CI Pipeline
Week 5–6  Cloud + Database (Gate 2)
Week 6–7  Observability (Parallel)
Week 8    Production Launch
```

---

## 8. Definition of Done

- No critical security findings
- Fully automated CI/CD
- Production databases hardened
- Observability live with alerts
- MFEs securely loaded
- Single source of truth respected

---

## 9. Cursor Usage Rules

- Treat each task list as atomic
- Do not reorder pillars
- Stop at gates until explicitly passed
