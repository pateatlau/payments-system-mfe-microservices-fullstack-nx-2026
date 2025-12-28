# Implementation Plan v2 — Consolidated, Security-First, Production-Grade

**Status:** ACTIVE  
**Audience:** Architect + Cursor  
**Rule:** Follow phases strictly in order. No skipping gates.  
**Source of Truth:** This document supersedes all previous plans.

---

## Executive Summary

This document is the **complete, authoritative implementation plan** for bringing the system from its current POC-3 state to **internet-facing, production-grade readiness**.

It consolidates and normalizes work from:
- Backend Hardening Plan
- Frontend MFE Hardening Plan
- CI/CD Planning
- Observability Comprehensive Analysis
- Complete Production Readiness Roadmap
- Original implementation-plan.md

This plan is intentionally **long, explicit, and executable**.

---

## GLOBAL NON-NEGOTIABLE RULES

1. Security fixes are BLOCKING for deployment
2. No CI/CD until Gate 1 is passed
3. Backend invariants always enforced server-side
4. MFEs must remain zero-coupled
5. All production changes must be observable
6. Gates must be explicitly validated before proceeding

---

# PHASE 1 — BACKEND SECURITY HARDENING (BLOCKING)

**Duration:** 2–3 weeks  
**Gate:** 🚦 Gate 1 — Security Sign-Off

---

## Task 1.1 — Restore Rate Limiting (CRITICAL)

### Objective
Prevent brute force, abuse, and DoS attacks.

### Steps
1. Restore API Gateway rate limits:
   - General API: 100 requests / 15 minutes / IP
   - Auth endpoints: 5 requests / 15 minutes / IP
2. Restore per-service rate limits:
   - Admin Service: 100 req / 15 min
   - Profile Service: 100 req / 15 min
3. Implement Redis-backed distributed limiter
4. Add rate-limit headers (X-RateLimit-*)
5. Exempt health checks and internal service calls
6. Add automated tests for 429 responses

### Verification
- Burst traffic blocked
- Legitimate traffic unaffected
- Headers present

---

## Task 1.2 — JWT Refresh Token Rotation

### Objective
Eliminate token replay attacks.

### Steps
1. Persist refresh tokens in database
2. Rotate refresh token on every use
3. Invalidate previous token on rotation
4. Add Redis blacklist for revoked tokens
5. Enforce single active refresh token per session
6. Add expiry + rotation tests

### Acceptance Criteria
- Reuse of token fails
- Only latest token valid

---

## Task 1.3 — Account Lockout Protection

### Steps
1. Track failed login attempts (Redis)
2. Lock account after 5 failures
3. Lock duration: 15 minutes
4. Reset on successful login
5. Emit security audit events

---

## Task 1.4 — Input Validation Expansion

### Steps
1. Add Zod schemas to Payments Service
2. Add Zod schemas to Admin Service
3. Enforce strict parsing on all controllers
4. Normalize validation error responses
5. Add negative tests

---

## Task 1.5 — Secrets Management

### Steps
1. Remove all default secrets
2. Rotate JWT secrets
3. Move secrets to environment-only
4. Prepare Secrets Manager integration
5. Prevent secrets from appearing in logs

---

## Task 1.6 — Database Security Hardening

### Steps
1. Set connection pool limits
2. Enforce query timeouts
3. Disable sensitive query logging in prod
4. Enable encryption at rest (config-level)
5. Validate Prisma configuration

---

## Task 1.7 — Service Resilience

### Steps
1. Implement request timeouts
2. Add retry policies for inter-service calls
3. Define circuit breaker strategy
4. Fail fast on downstream outages

---

## Task 1.8 — Security Validation (Gate 1)

### Steps
1. Run OWASP ZAP scans
2. Perform auth abuse simulation
3. Validate injection resistance
4. Fix all HIGH / CRITICAL issues

🚦 **Gate 1 Pass Criteria**
- Zero critical vulns
- Security sign-off documented

---

# PHASE 2 — FRONTEND & MFE SECURITY HARDENING

**Duration:** 2 weeks  
**Depends on:** Gate 1

---

## Task 2.1 — CSP Hardening

### Steps
1. Remove unsafe-inline
2. Remove unsafe-eval
3. Lock script-src to known origins
4. Validate MF loading still works

---

## Task 2.2 — Module Federation Security

### Steps
1. Implement remoteEntry signature verification
2. Enforce checksum validation
3. Fail closed on invalid remotes

---

## Task 2.3 — Subresource Integrity (SRI)

### Steps
1. Generate hashes for remote bundles
2. Inject integrity attributes
3. Validate enforcement

---

## Task 2.4 — CSRF Protection

### Steps
1. Issue CSRF tokens
2. Enforce token on mutations
3. Add server-side validation

---

## Task 2.5 — Supply Chain Security

### Steps
1. Enable dependency scanning (CI)
2. Lock dependency versions
3. Fail builds on critical vulns

---

## Task 2.6 — Frontend Auth Hardening

### Steps
1. Move auth to HttpOnly cookies
2. Enforce SameSite=Strict
3. Remove localStorage token usage

---

# PHASE 3 — CI/CD PIPELINE (CRITICAL PATH)

**Duration:** 2–3 weeks  
**Depends on:** Gate 1

---

## Task 3.1 — CI Foundation

### Steps
1. Configure GitHub Actions
2. Enable Nx affected builds
3. Cache dependencies
4. Run unit + e2e tests

---

## Task 3.2 — Dockerization

### Steps
1. Harden Dockerfiles
2. Multi-stage builds
3. Reduce image size
4. Validate healthchecks

---

## Task 3.3 — Cloud Infrastructure

### Steps
1. Provision ECR
2. Provision ECS (Fargate)
3. Provision ALB + TLS
4. Provision RDS (per service)
5. Provision Redis + RabbitMQ
6. Configure IAM roles

---

## Task 3.4 — Database Migration

### Steps
1. Enable prisma migrate deploy
2. Run staging migrations
3. Validate rollback strategy
4. Promote to production

🚦 **Gate 2 — Infrastructure Ready**

---

# PHASE 4 — OBSERVABILITY COMPLETION (PARALLEL)

**Duration:** 1–2 weeks

---

## Task 4.1 — Sentry Production Config

### Steps
1. Inject frontend DSN
2. Configure sampling
3. Enable PII scrubbing

---

## Task 4.2 — Source Maps

### Steps
1. Upload via CI
2. Validate stack traces

---

## Task 4.3 — Alerting

### Steps
1. Configure Grafana alerts
2. Configure Sentry alerts
3. Validate notifications

🚦 **Gate 3 — Full Visibility**

---

# PHASE 5 — PRODUCTION LAUNCH

### Steps
1. Final regression tests
2. Dry-run deployment
3. Enable traffic
4. Monitor 24–48h

---

## Definition of Done

- Security hardened
- CI/CD automated
- Infra reproducible
- Observability live
- Production traffic stable