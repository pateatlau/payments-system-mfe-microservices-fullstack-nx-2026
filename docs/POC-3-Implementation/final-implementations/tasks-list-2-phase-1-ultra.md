# Task List v2 — Phase 1 (Ultra-Atomic)
## Backend Security Hardening (BLOCKING)

**Phase:** 1 of 5  
**Gate:** 🚦 Gate 1 — Security Sign-off  
**Tracking Rule:** Check off items only after verification passes.

---

# TASK 1.1 — Restore API Gateway Rate Limiting

## Infrastructure Preconditions
- [ ] Redis service running
- [ ] Redis reachable from API Gateway
- [ ] Redis auth validated
- [ ] Redis connection documented

## Code Implementation
- [ ] Redis client implemented
- [ ] Redis rate store implemented
- [ ] Global rate limiter middleware
- [ ] Auth-specific rate limiter middleware
- [ ] Route exemptions configured

## Verification & Tests
- [ ] Unit tests: Redis store
- [ ] Integration tests: rate limit enforced
- [ ] Regression tests: health endpoints unaffected

---

# TASK 1.2 — JWT Refresh Token Rotation

## Data Model
- [ ] RefreshToken Prisma model added
- [ ] Token hash unique index
- [ ] Migration applied

## Code Implementation
- [ ] Token hashing utility
- [ ] Token issuance logic
- [ ] Rotation logic
- [ ] Reuse detection logic

## Verification & Tests
- [ ] Unit tests: hashing
- [ ] Integration tests: rotation
- [ ] Integration tests: reuse rejection

---

# TASK 1.3 — Account Lockout Protection

## Cache Model
- [ ] Redis key pattern defined
- [ ] TTL configured
- [ ] Threshold defined

## Code Implementation
- [ ] Failure counter increment
- [ ] Lockout enforced
- [ ] Reset on success

## Verification & Tests
- [ ] Lockout after failures
- [ ] TTL expiry unlocks
- [ ] Successful login resets counter

---

# TASK 1.4 — Input Validation Hardening

## Schema Definition
- [ ] Payments schemas defined
- [ ] Admin schemas defined

## Middleware Wiring
- [ ] Validators attached
- [ ] Unknown fields rejected
- [ ] Error format normalized

## Verification & Tests
- [ ] Invalid payload rejected
- [ ] Extra fields rejected
- [ ] Error format consistent

---

# TASK 1.5 — Secrets Hardening

## Inventory
- [ ] All secrets inventoried
- [ ] Defaults identified

## Code Implementation
- [ ] Default secrets removed
- [ ] Secrets rotated
- [ ] Env-only loading enforced
- [ ] Logs masked

## Verification
- [ ] Startup fails without secrets
- [ ] Logs contain no secrets

---

# TASK 1.6 — Database Security

## Configuration
- [ ] Connection pool limits set
- [ ] Query timeouts set

## Code Implementation
- [ ] Prisma config applied
- [ ] Verbose logging disabled

## Validation
- [ ] Pool exhaustion tested
- [ ] Graceful failure confirmed

---

# TASK 1.7 — Service Resilience

## Policy
- [ ] Timeout values defined
- [ ] Retry policy defined
- [ ] Circuit thresholds defined

## Code Implementation
- [ ] Timeouts applied
- [ ] Retries applied
- [ ] Circuit breaker implemented

## Verification & Tests
- [ ] Downstream failure tests
- [ ] Circuit-open behavior verified

---

# TASK 1.8 — Security Validation (Gate 1)

## Scanning
- [ ] OWASP ZAP scan executed
- [ ] Report exported

## Remediation
- [ ] HIGH findings fixed
- [ ] CRITICAL findings fixed

## Sign-off
- [ ] Scan re-run clean
- [ ] Report archived
- [ ] Security sign-off recorded

---

## PHASE 1 COMPLETION

- [ ] All Phase 1 tasks complete
- [ ] All verification steps passed
- [ ] No high/critical vulnerabilities

🚦 **GATE 1 PASSED**
