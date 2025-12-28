# Implementation Plan v2 — Phase 1 (Ultra-Atomic)
## Backend Security Hardening (BLOCKING)

**Phase:** 1 of 5  
**Granularity:** Ultra-Atomic (Infra → Code → Tests)  
**Gate:** 🚦 Gate 1 — Security Sign-off  
**Execution Rule:** Execute ONE sub-task at a time. Verify before proceeding.

---

## How to Use This Document

- Treat **each numbered item** as an atomic step.
- Never combine steps.
- Do not proceed until verification for the current section passes.
- Infra, Code, and Tests are **never mixed**.

---

# TASK 1.1 — RESTORE API GATEWAY RATE LIMITING

## Objective
Prevent brute-force, credential stuffing, scraping, and DoS-style abuse.

---

## Dimension A — Infrastructure Preconditions

### 1.1.A.1 Redis Availability & Connectivity
1. Verify Redis service/container is running.
2. Verify Redis port is exposed internally.
3. Verify API Gateway network can reach Redis.
4. Verify Redis AUTH configuration (if enabled).
5. Document Redis host, port, and auth mode.

**Verification**
- `redis-cli ping` succeeds from API Gateway container.
- Application fails fast if Redis unavailable.

---

## Dimension B — Code Implementation

### 1.1.B.1 Redis Client (Rate Limiting Only)
1. Create file `libs/security/rate-limit/redisClient.ts`.
2. Read Redis host from environment variables.
3. Read Redis port from environment variables.
4. Configure connection timeout.
5. Configure retry/backoff strategy.
6. Export a singleton Redis client.
7. Add explicit connection error logging.
8. Abort startup on permanent connection failure.

---

### 1.1.B.2 Redis Rate Limit Store
1. Create file `libs/security/rate-limit/redisRateStore.ts`.
2. Implement `increment(key, ttlSeconds)` using atomic `INCR`.
3. Apply `EXPIRE` on first increment only.
4. Implement `getCount(key)` method.
5. Handle Redis failure by throwing explicit error.
6. Ensure no silent fallbacks.

---

### 1.1.B.3 Global Rate Limiter Middleware
1. Create `apps/api-gateway/src/middleware/rateLimitGlobal.ts`.
2. Define time window = 15 minutes.
3. Define max requests = 100.
4. Implement IP-based key generator.
5. Attach Redis rate store.
6. Add headers:
   - X-RateLimit-Limit
   - X-RateLimit-Remaining
   - Retry-After
7. Return HTTP 429 on limit breach.
8. Export middleware.

---

### 1.1.B.4 Auth-Specific Rate Limiter
1. Create `rateLimitAuth.ts` middleware.
2. Define max requests = 5.
3. Define window = 15 minutes.
4. Scope middleware to:
   - /auth/login
   - /auth/register
   - /auth/refresh
5. Attach middleware before controllers.

---

### 1.1.B.5 Route Exemptions
1. Identify internal routes:
   - /health
   - /metrics
2. Explicitly bypass rate limiting.
3. Add inline documentation explaining exemption.

---

## Dimension C — Verification & Tests

### 1.1.C.1 Unit Tests
1. Test Redis store increment.
2. Test TTL expiry behavior.
3. Test Redis failure handling.

### 1.1.C.2 Integration Tests
1. Simulate 101 requests from same IP.
2. Assert HTTP 429 response.
3. Assert rate-limit headers correctness.

### 1.1.C.3 Regression Tests
1. Call /health endpoint repeatedly.
2. Confirm no rate limiting applied.

---

# TASK 1.2 — JWT REFRESH TOKEN ROTATION

## Objective
Eliminate refresh-token replay and session fixation attacks.

---

## Dimension A — Data Model

### 1.2.A.1 Prisma Schema
1. Add `RefreshToken` model.
2. Fields:
   - id
   - userId
   - tokenHash
   - revokedAt
   - createdAt
3. Add unique index on tokenHash.
4. Add FK to User.
5. Generate migration.
6. Apply migration locally.

---

## Dimension B — Code Implementation

### 1.2.B.1 Token Hashing Utility
1. Create `libs/security/tokens/hashRefreshToken.ts`.
2. Use SHA-256 or bcrypt.
3. Use constant-time comparison.
4. Prevent logging of raw tokens.

---

### 1.2.B.2 Token Issuance
1. Generate refresh token on login.
2. Hash token before persistence.
3. Persist hash in database.
4. Return raw token once.

---

### 1.2.B.3 Rotation Logic
1. Validate incoming refresh token.
2. Hash and lookup token.
3. Reject if revoked.
4. Generate new refresh token.
5. Persist new token hash.
6. Mark old token revoked.

---

### 1.2.B.4 Reuse Detection
1. Detect usage of revoked token.
2. Revoke all tokens for user.
3. Emit security audit log.
4. Force logout response.

---

## Dimension C — Verification & Tests

### 1.2.C.1 Unit Tests
1. Hash determinism test.
2. Hash uniqueness test.

### 1.2.C.2 Integration Tests
1. Normal refresh succeeds.
2. Old token fails.
3. Parallel refresh behavior verified.

---

# TASK 1.3 — ACCOUNT LOCKOUT PROTECTION

## Objective
Block brute-force password attacks.

---

## Dimension A — Cache Model
1. Define Redis key pattern `auth:fail:{userId}`.
2. Define TTL = 15 minutes.
3. Define threshold = 5 attempts.

---

## Dimension B — Code
1. Increment counter on auth failure.
2. Enforce lockout at threshold.
3. Return explicit lockout error.
4. Reset counter on success.

---

## Dimension C — Tests
1. 5 failures → lock.
2. TTL expiry unlocks.
3. Successful login resets counter.

---

# TASK 1.4 — INPUT VALIDATION HARDENING

## Dimension A — Schema Definition
1. Enumerate Payments endpoints.
2. Enumerate Admin endpoints.
3. Define Zod schemas.

## Dimension B — Middleware Wiring
1. Attach validators.
2. Reject unknown fields.
3. Normalize error responses.

## Dimension C — Tests
1. Invalid payload rejected.
2. Extra fields rejected.
3. Error format consistent.

---

# TASK 1.5 — SECRETS HARDENING

## Dimension A — Inventory
1. Inventory all secrets.
2. Identify defaults.

## Dimension B — Code
1. Remove defaults.
2. Rotate secrets.
3. Enforce env-only loading.
4. Mask logs.

## Dimension C — Verification
1. Startup fails without secrets.
2. Logs contain no secrets.

---

# TASK 1.6 — DATABASE SECURITY

## Dimension A — Configuration
1. Set connection pool limits.
2. Set query timeouts.

## Dimension B — Code
1. Apply Prisma config.
2. Disable verbose logging.

## Dimension C — Validation
1. Load-test exhaustion.
2. Confirm graceful failure.

---

# TASK 1.7 — SERVICE RESILIENCE

## Dimension A — Policy
1. Define timeout values.
2. Define retry policy.
3. Define circuit thresholds.

## Dimension B — Code
1. Apply timeouts.
2. Apply retries.
3. Implement circuit breaker.

## Dimension C — Tests
1. Downstream failure tests.
2. Circuit-open behavior verified.

---

# TASK 1.8 — SECURITY VALIDATION (GATE 1)

## Dimension A — Scanning
1. Run OWASP ZAP.
2. Export report.

## Dimension B — Remediation
1. Fix HIGH findings.
2. Fix CRITICAL findings.

## Dimension C — Sign-off
1. Re-run scan.
2. Archive report.
3. Record security sign-off.

---

## PHASE 1 EXIT CRITERIA

- All tasks completed
- All verification steps passed
- No high or critical vulnerabilities remain

🚦 **GATE 1 PASSED**
