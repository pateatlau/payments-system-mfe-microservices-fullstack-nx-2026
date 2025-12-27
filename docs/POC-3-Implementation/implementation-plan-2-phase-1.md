# Implementation Plan v2 — Phase 1
## Backend Security Hardening (BLOCKING)

**Phase:** 1 of 5  
**Gate:** 🚦 Gate 1 — Security Sign-off  
**Execution Rule:** Execute ONE task at a time. Verify before moving forward.

---

## Scope of Phase 1

This phase hardens **backend security fundamentals**.  
No CI/CD, frontend hardening, or infra rollout may begin until Phase 1 is fully complete and verified.

---

# Task 1.1 — Restore API Gateway Rate Limiting

### Objective
Prevent brute-force, credential stuffing, scraping, and volumetric abuse.

---

### Sub-task 1.1.1 — Redis Foundation for Rate Limiting

**Atomic Steps**
1. Verify Redis is running and reachable from API Gateway.
2. Create file `libs/security/rate-limit/redisClient.ts`.
3. Initialize Redis client with env-based config.
4. Add connection retry + timeout configuration.
5. Export singleton Redis client.
6. Add startup health check for Redis connectivity.

**Verification**
- API Gateway boots with Redis connected.
- Startup fails fast if Redis unavailable.

---

### Sub-task 1.1.2 — Redis Rate Limit Store

**Atomic Steps**
1. Create `libs/security/rate-limit/redisStore.ts`.
2. Implement `increment(key, ttl)` function.
3. Implement `get(key)` function.
4. Implement automatic TTL expiry.
5. Add unit test: counter increments correctly.
6. Add unit test: key expires after TTL.

---

### Sub-task 1.1.3 — Global Rate Limiter Middleware

**Atomic Steps**
1. Create `apps/api-gateway/src/middleware/rateLimitGlobal.ts`.
2. Define window: 15 minutes.
3. Define max requests: 100.
4. Use IP-based key generator.
5. Attach Redis store.
6. Add response headers:
   - `X-RateLimit-Limit`
   - `X-RateLimit-Remaining`
   - `Retry-After`
7. Export middleware.

**Verification**
- 101st request returns HTTP 429.
- Headers are present.

---

### Sub-task 1.1.4 — Auth-Specific Rate Limiter

**Atomic Steps**
1. Create `rateLimitAuth.ts` middleware.
2. Set limit to 5 requests / 15 min.
3. Scope to routes:
   - `/auth/login`
   - `/auth/register`
   - `/auth/refresh`
4. Attach middleware before controllers.
5. Add test: 6th login attempt blocked.

---

### Sub-task 1.1.5 — Route Exemptions

**Atomic Steps**
1. Identify internal routes:
   - `/health`
   - `/metrics`
2. Explicitly bypass rate limiting.
3. Add regression test ensuring no 429.

---

### Task 1.1 Verification Checklist

- [ ] Global abuse blocked
- [ ] Auth abuse blocked
- [ ] Health endpoints unaffected

---

# Task 1.2 — JWT Refresh Token Rotation

### Objective
Eliminate replay attacks and session fixation.

---

### Sub-task 1.2.1 — Database Schema

**Atomic Steps**
1. Update Prisma schema: add `RefreshToken` model.
2. Fields:
   - `id`
   - `userId`
   - `tokenHash`
   - `revokedAt`
   - `createdAt`
3. Add unique index on `tokenHash`.
4. Add FK to User.
5. Generate migration.
6. Apply migration locally.

---

### Sub-task 1.2.2 — Token Hashing

**Atomic Steps**
1. Create `libs/security/tokens/hashRefreshToken.ts`.
2. Use SHA-256 or bcrypt.
3. Ensure constant-time comparison.
4. Add unit test: same token → same hash.
5. Add unit test: different tokens → different hash.

---

### Sub-task 1.2.3 — Issue Refresh Token

**Atomic Steps**
1. Generate refresh token on login.
2. Hash token before storage.
3. Persist token hash in DB.
4. Return raw token to client.
5. Ensure token never logged.

---

### Sub-task 1.2.4 — Rotation Logic

**Atomic Steps**
1. Validate incoming refresh token.
2. Hash and lookup token.
3. Reject if revoked.
4. Generate new refresh token.
5. Persist new token hash.
6. Mark previous token revoked.
7. Return new token pair.

---

### Sub-task 1.2.5 — Reuse Detection

**Atomic Steps**
1. Detect use of revoked token.
2. Revoke all active refresh tokens for user.
3. Emit security audit log.
4. Return forced logout response.

---

### Sub-task 1.2.6 — Tests

**Atomic Steps**
1. Test normal rotation.
2. Test reuse rejection.
3. Test parallel refresh attempts.
4. Test logout revocation.

---

# Task 1.3 — Account Lockout Protection

### Objective
Block brute-force password attacks.

---

### Atomic Steps
1. Create Redis key pattern `auth:fail:{userId}`.
2. Increment on failed login.
3. Set TTL = 15 minutes.
4. Lock account after 5 failures.
5. Reject login with explicit error.
6. Reset counter on success.
7. Add unit tests for all cases.

---

# Task 1.4 — Input Validation Hardening

### Objective
Ensure all inbound data is validated.

---

### Atomic Steps
1. Create Zod schemas for Payments endpoints.
2. Attach schema validation middleware.
3. Reject unknown fields.
4. Normalize validation error responses.
5. Repeat for Admin Service.
6. Add negative tests per endpoint.

---

# Task 1.5 — Secrets & Config Hardening

### Objective
Eliminate insecure defaults and leaks.

---

### Atomic Steps
1. Remove default JWT secrets.
2. Rotate access + refresh secrets.
3. Enforce env-only secret loading.
4. Mask secrets in logs.
5. Fail startup if secrets missing.

---

# Task 1.6 — Database Security

### Objective
Prevent DB abuse and exhaustion.

---

### Atomic Steps
1. Set Prisma connection pool limits.
2. Configure query timeout.
3. Disable verbose query logging in prod.
4. Verify TLS / encryption settings.
5. Load test pool exhaustion behavior.

---

# Task 1.7 — Service Resilience

### Objective
Prevent cascading failures.

---

### Atomic Steps
1. Add request timeouts.
2. Add retry logic (idempotent calls only).
3. Define circuit breaker thresholds.
4. Return fail-fast errors on open circuit.

---

# Task 1.8 — Security Validation (Gate 1)

### Atomic Steps
1. Run OWASP ZAP scan.
2. Review all findings.
3. Fix HIGH issues.
4. Fix CRITICAL issues.
5. Re-run scan.
6. Document security sign-off.

---

## Phase 1 Exit Criteria

- All tasks completed
- All verification checklists passed
- No critical or high vulnerabilities remain

🚦 **Gate 1 PASSED**
