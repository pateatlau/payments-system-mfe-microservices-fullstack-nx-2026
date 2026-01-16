# Backend Hardening Phase 1 - Continuation Prompt

**Created:** January 16, 2026
**Context:** Starting Backend Hardening Phase 1 implementation
**Working Directory:** `/Users/patea/2026/projects/payments-system-mfe-microservices-fullstack-nx-2026`

---

## Current Status

### Application State
- ✅ All infrastructure running (`pnpm infra:start`)
- ✅ All backend services running (`pnpm dev:backend`)
- ✅ Frontend running in HTTPS mode (`pnpm dev:mf:https`)
- ✅ Application accessible at https://localhost/signin
- ✅ Login functionality verified and working

### Git Status
- **Branch:** `develop`
- **Last Commits:**
  - `a2c6826` - docs: update README to reference consolidated CI/CD documentation
  - `56d8ed7` - docs: consolidate CI/CD documentation into single file

### What's Been Decided
- **Approach:** Backend Hardening Phase 1 FIRST, then CD implementation
- **Rationale:** Fix critical security vulnerabilities before production deployment
- **Timeline:** Phase 1 = 2-3 days (9 hours development work)

---

## Implementation Plan

### Phase 1: Critical Security Fixes (3 Priorities)

#### Priority 1.1: Restore Rate Limiting ⏱️ 2 hours
**Status:** NOT STARTED

**Current Issue:**
- Rate limits intentionally disabled (set to 100,000 req/15min instead of 100)
- Auth endpoints at 100,000 req/15min (should be 5)

**Tasks:**
1. Restore rate limits in API Gateway:
   - General API: 100 requests per 15 minutes
   - Auth endpoints: 5 requests per 15 minutes
2. Restore rate limits in Admin Service (100 req/15min)
3. Restore rate limits in Profile Service (100 req/15min)
4. Add per-user rate limiting (not just per-IP)
5. Implement rate limit headers (X-RateLimit-*)
6. Use Redis for distributed rate limiting

**Files to Modify:**
- `apps/api-gateway/src/middleware/rateLimit.ts`
- `apps/api-gateway/src/config/index.ts`
- `apps/admin-service/src/main.ts`
- `apps/profile-service/src/main.ts`

**Prerequisites:**
- Redis already running in Docker ✅
- Need to install: `pnpm add ioredis` (if not already installed)

**Success Criteria:**
- Rate limits enforced on all endpoints
- Proper 429 responses with Retry-After header
- Rate limit bypass for health checks
- Can still login (5 attempts within 15min work)

---

#### Priority 1.2: JWT Refresh Token Rotation ⏱️ 4 hours
**Status:** NOT STARTED

**Current Issue:**
- No refresh token rotation
- Stolen refresh tokens valid for 7 days with no revocation

**Tasks:**
1. Implement refresh token rotation:
   - Generate new refresh token on each refresh request
   - Invalidate old refresh token
2. Add token revocation mechanism:
   - Create blacklist/revocation list in Redis
   - Check revoked tokens on auth
3. Add token fingerprinting (user agent + IP hash)
4. Implement session management:
   - Track active sessions per user
   - Allow users to revoke sessions
   - Auto-revoke on password change

**Files to Modify:**
- `apps/auth-service/src/controllers/auth.controller.ts`
- `apps/auth-service/src/utils/token.ts`
- `apps/api-gateway/src/middleware/auth.ts`

**New Files to Create:**
- `libs/backend/redis-client/src/lib/token-blacklist.ts`
- `apps/auth-service/src/services/session.service.ts`

**Success Criteria:**
- Refresh tokens rotate on use
- Old refresh tokens invalid after rotation
- Token revocation works across all services
- Users can view/revoke active sessions

---

#### Priority 1.3: Account Lockout & Brute Force Protection ⏱️ 3 hours
**Status:** NOT STARTED

**Current Issue:**
- No account lockout after failed login attempts
- Vulnerable to brute force attacks

**Tasks:**
1. Implement failed login attempt tracking:
   - Track failed attempts by email + IP in Redis
   - Lockout after 5 failed attempts
   - Auto-unlock after 15 minutes
2. Add exponential backoff for repeated failures
3. Add suspicious activity logging to Sentry
4. Add email notifications for lockouts (optional)

**Files to Modify:**
- `apps/auth-service/src/controllers/auth.controller.ts`

**New Files to Create:**
- `libs/backend/redis-client/src/lib/login-attempts.ts`
- `apps/auth-service/src/middleware/brute-force-protection.ts`

**Success Criteria:**
- Accounts lock after 5 failed attempts
- Lockout duration configurable
- Admin can unlock accounts
- Suspicious activity logged to Sentry

---

## Working Process

### For Each Priority:

1. **Implement** - Make code changes for that priority only
2. **Test** - Verify:
   - All services still running (check terminals)
   - Application still accessible (https://localhost)
   - Login still works
   - New security feature works as expected
   - No regressions
3. **Commit** - Git commit with descriptive message
4. **Ask for Confirmation** - Wait for user approval before next priority

### Testing Checklist (After Each Priority):

```bash
# 1. Check all services are running
pnpm backend:status  # or check terminals

# 2. Access application
# Open: https://localhost/signin

# 3. Test login
# Username: admin@example.com / Password: (check test data)

# 4. Test specific feature implemented
# (Priority-specific tests)

# 5. Check logs for errors
# Review terminal outputs for any errors
```

---

## Reference Documentation

**Main Planning Doc:** `docs/POC-3-Implementation/BACKEND-HARDENING-PLAN.md`
- Complete implementation details for all 7 phases
- Code examples and patterns
- Success criteria for each phase

**CI/CD Docs:** `docs/CICD.md`
- Current CI/CD status (CI complete, CD pending)
- Shows why security hardening is prerequisite

**Prerequisites Checklist:** `.github/CICD-PREREQUISITES.md`
- Shows what's complete vs pending

---

## Important Notes

- **One priority at a time** - No combining tasks
- **Test after each change** - Don't accumulate untested code
- **Redis is ready** - Already running in docker-compose
- **No AWS needed yet** - Phase 1 is local code changes only
- **Commit frequently** - After each verified priority
- **Current branch:** `develop` (all work on this branch)

---

## Commands Reference

```bash
# Infrastructure
pnpm infra:start              # Start Docker services
pnpm infra:status             # Check Docker status

# Backend
pnpm dev:backend              # Start all backend services
pnpm backend:status           # Check backend services

# Frontend
pnpm dev:mf:https             # Start frontend (HTTPS mode)

# Testing
pnpm test                     # Run frontend tests
pnpm test:backend             # Run backend tests

# Database
pnpm db:all:generate          # Regenerate Prisma clients (if schema changes)
pnpm db:all:migrate           # Run migrations (if schema changes)
```

---

## Next Action

**Start with Priority 1.1: Restore Rate Limiting**

1. Check if `ioredis` is installed (may already be installed)
2. Review current rate limit configuration in API Gateway
3. Implement rate limit restoration
4. Test thoroughly
5. Commit
6. Ask for confirmation to proceed to Priority 1.2

---

**Ready to begin!**
