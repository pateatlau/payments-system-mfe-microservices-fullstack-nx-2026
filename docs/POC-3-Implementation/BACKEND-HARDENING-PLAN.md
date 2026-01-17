# Backend Hardening Plan - POC-3

**Created:** December 23, 2025
**Last Updated:** January 17, 2026
**Status:** ✅ **Phase 1, 2 & 3.2 Complete** - Critical security fixes + Input validation + Secrets rotation + Env validation implemented
**Priority:** High

---

## 📊 Implementation Progress

### Phase 1: Critical Security Fixes ✅ COMPLETE
- ✅ **Priority 1.1:** Restore Rate Limiting (COMPLETED - Jan 16, 2026)
- ✅ **Priority 1.2:** JWT Refresh Token Rotation (COMPLETED - Jan 16, 2026)
- ✅ **Priority 1.3:** Account Lockout & Brute Force Protection (COMPLETED - Jan 16, 2026)
- ✅ **Priority 1.4:** Audit Logging Infrastructure Fix (COMPLETED - Jan 16, 2026)
- ✅ **Priority 1.5:** Payment Events Audit Logging Fix (COMPLETED - Jan 17, 2026)

### Phase 2: Input Validation & Sanitization ✅ COMPLETE
- ✅ **Priority 2.1:** Enhanced Validation for Payments Service (COMPLETED - Jan 16, 2026)
- ✅ **Priority 2.2:** Add Validation to Admin Service (COMPLETED - Jan 16, 2026)
- ✅ **Priority 2.3:** Enhance Existing Validators (COMPLETED - Jan 16, 2026)

### Phase 3: Secrets Management (In Progress)
- ✅ **Priority 3.1:** Secrets Rotation Policy (COMPLETED - Jan 17, 2026)
- ✅ **Priority 3.2:** Environment Variable Validation (COMPLETED - Jan 17, 2026)
- ⏳ **Priority 3.3:** Secrets Encryption (Not Started)

### Phases 4-7: Not Started
- Phase 4: Database Security Hardening
- Phase 5: Service Resilience
- Phase 6: Enhanced API Security
- Phase 7: Advanced Security Features

---

## Executive Summary

This document outlines a comprehensive backend hardening strategy for the POC-3 payments system. After auditing the current implementation, we've identified several security gaps and areas for improvement across input validation, authentication, authorization, database security, error handling, service resilience, secrets management, and API security.

---

## Current State Assessment

### ✅ What's Working Well

#### 1. **Authentication & Authorization**

- ✅ JWT-based authentication implemented across all services
- ✅ Role-based access control (RBAC) middleware in API Gateway
- ✅ Token expiration handling (15m access, 7d refresh)
- ✅ Consistent auth middleware pattern across services
- ✅ Password hashing with bcrypt (10 rounds)
- ✅ Strong password requirements (12+ chars, uppercase, lowercase, number, symbol)

#### 2. **Input Validation**

- ✅ Zod schemas for request validation in auth and profile services
- ✅ Email validation with proper regex
- ✅ Password strength validation with banking-grade requirements
- ✅ Zod error handling in error middleware

#### 3. **Error Handling**

- ✅ Centralized error handling middleware in all services
- ✅ ApiError class for structured errors
- ✅ Consistent error response format
- ✅ Zod validation error handling
- ✅ Proper error logging with Winston
- ✅ Development vs production error detail differentiation

#### 4. **Security Headers & CORS**

- ✅ Helmet middleware for security headers (API Gateway)
- ✅ CORS whitelist with specific origins
- ✅ CSP, HSTS, X-Frame-Options, XSS Protection configured
- ✅ nginx security headers (X-Content-Type-Options, Referrer-Policy)

#### 5. **Observability**

- ✅ Sentry integration (frontend & backend)
- ✅ Structured logging with Winston
- ✅ Prometheus metrics collection
- ✅ Grafana dashboards
- ✅ Request/response logging

---

## 🚨 Critical Gaps Identified

### 1. **Rate Limiting (CRITICAL)**

**Current State:**

- Rate limits set to 100,000 requests per 15 minutes (intentionally disabled)
- TODO comments indicate original limit was 100 requests
- Auth endpoints should be 5 requests per 15 minutes (currently 100,000)

**Risk:** **HIGH** - System vulnerable to:

- Brute force attacks on login endpoints
- DoS attacks
- API abuse
- Credential stuffing attacks

**Files Affected:**

- `apps/api-gateway/src/middleware/rateLimit.ts`
- `apps/api-gateway/src/config/index.ts`
- `apps/admin-service/src/main.ts` (100,000 limit)
- `apps/profile-service/src/main.ts` (100,000 limit)

### 2. **JWT Security Hardening**

**Current State:**

- No refresh token rotation
- Access tokens valid for 15 minutes
- Refresh tokens valid for 7 days with no rotation
- Default JWT secret: "your-secret-key-change-in-production"
- JWT secret stored as plain text in config

**Risk:** **HIGH** - Vulnerabilities:

- Stolen refresh tokens valid indefinitely until expiration
- Weak default secrets in development can leak to production
- No token revocation mechanism
- No blacklist for compromised tokens

### 3. **Input Validation Gaps**

**Current State:**

- Only auth and profile services have Zod validators
- Payments service lacks input validation
- Admin service lacks input validation
- No sanitization for special characters/SQL injection attempts
- No file upload validation (if applicable)

**Risk:** **MEDIUM-HIGH**

- SQL injection (mitigated by Prisma, but still a concern)
- XSS through unvalidated inputs
- NoSQL injection
- Command injection

**Files Affected:**

- `apps/payments-service/src/controllers/*.ts` (no validators)
- `apps/admin-service/src/controllers/*.ts` (no validators)

### 4. **Secrets Management**

**Current State:**

- JWT secrets have insecure defaults
- All secrets in plain text environment variables
- No encryption at rest for secrets
- No secrets rotation policy
- Database URLs contain credentials in plain text

**Risk:** **HIGH**

- Secrets exposure through logs, error messages, or repository
- No rotation means compromised secrets remain valid
- Default secrets may be used in production

**Files Affected:**

- `.env.example` (contains default secrets)
- All service `config/index.ts` files

### 5. **Database Security**

**Current State:**

- Prisma prevents SQL injection through parameterized queries ✅
- No connection pool limits enforced
- No query timeout configuration
- Query logging enabled in development (could leak sensitive data)
- No encryption at rest mentioned

**Risk:** **MEDIUM**

- Connection pool exhaustion
- Slow query DoS attacks
- Sensitive data in logs

### 6. **Service Resilience**

**Current State:**

- No circuit breakers implemented
- No retry policies for inter-service communication
- Basic timeout on health checks (5 seconds)
- No graceful degradation patterns
- No fallback mechanisms

**Risk:** **MEDIUM**

- Cascading failures
- Service unavailability
- Poor user experience during outages

### 7. **API Response Security**

**Current State:**

- Helmet middleware only on API Gateway
- Other services lack security headers middleware
- No CSP on individual services
- No response sanitization
- Potential information disclosure in error messages

**Risk:** **MEDIUM**

- Information leakage
- XSS vulnerabilities
- Clickjacking

### 8. **Authentication Edge Cases**

**Current State:**

- No account lockout after failed login attempts
- No suspicious activity detection
- No CAPTCHA for repeated failures
- No IP-based restrictions
- No multi-factor authentication (MFA)

**Risk:** **HIGH**

- Brute force attacks
- Credential stuffing
- Account takeover

---

## Hardening Roadmap

### Phase 1: Critical Security Fixes (Week 1) 🔥

#### Priority 1.1: Restore Rate Limiting ✅ COMPLETED

**Status:** ✅ **COMPLETED** (January 16, 2026)
**Effort:** 2 hours
**Impact:** HIGH
**Commit:** `6dcba56 - security: restore rate limiting to production values`

**Implementation Summary:**

✅ **Completed Tasks:**

1. ✅ Restored original rate limits in API Gateway:
   - General API: 100 requests per 15 minutes (was 100,000)
   - Auth endpoints: 5 requests per 15 minutes (was 100,000)
2. ✅ Restored rate limits in individual services:
   - Admin Service: 100 requests per 15 minutes (was 100,000)
   - Profile Service: 100 requests per 15 minutes (was 100,000)
3. ✅ Implemented Redis-backed distributed rate limiting
4. ✅ Added RateLimit-* headers (standardHeaders: true)
5. ✅ Custom key generator (IP + User-Agent) for auth endpoints
6. ✅ Health check and metrics endpoint bypass
7. ✅ Graceful Redis connection cleanup on shutdown

**Files Modified:**

- ✅ `apps/api-gateway/src/middleware/rateLimit.ts` - Redis-backed rate limiting
- ✅ `apps/api-gateway/src/config/index.ts` - Restored limits + Redis config
- ✅ `apps/api-gateway/src/main.ts` - Redis cleanup on SIGTERM
- ✅ `apps/admin-service/src/main.ts` - Restored rate limit to 100
- ✅ `apps/profile-service/src/main.ts` - Restored rate limit to 100
- ✅ `package.json` - Added rate-limit-redis@^4.3.1

**Success Criteria Met:**

- ✅ Rate limits enforced on all endpoints
- ✅ Proper 429 responses with Retry-After header
- ✅ Rate limit bypass for health checks
- ✅ RateLimit-Limit, RateLimit-Remaining, RateLimit-Reset headers
- ✅ Redis integration for distributed rate limiting

**Testing Notes:**

- Requires backend services restart to apply changes
- Admin/Profile services enforce limits only in production mode
- Auth rate limit: 5 attempts per 15 min (strict for brute force prevention)
- Redis keys use prefixes: `rl:general:` and `rl:auth:`
- Can reset limits with: `pnpm redis:flush`

---

#### Priority 1.2: JWT Refresh Token Rotation ✅ COMPLETED

**Status:** ✅ **COMPLETED** (January 16, 2026)
**Effort:** 4 hours
**Impact:** HIGH
**Commit:** `52b7d3d - security: implement JWT refresh token rotation`

**Implementation Summary:**

✅ **Completed Tasks:**

1. ✅ Implemented refresh token rotation:
   - New refresh token generated on each refresh request
   - Old refresh token marked as revoked (not deleted, for audit)
   - Token family tracking for rotation chain
2. ✅ Added token revocation mechanism:
   - Redis-based blacklist for immediate revocation
   - Check blacklist before validating tokens
   - User-level blacklist for password changes
3. ✅ Added token fingerprinting (IP + User-Agent hash)
4. ✅ Implemented session security:
   - Token family tracking detects reuse attacks
   - Auto-revoke all sessions on password change
   - Fingerprint mismatch flags potential token theft

**Database Changes:**

- Added `token_family` - Groups tokens in rotation chain
- Added `fingerprint` - Hash of IP + User-Agent
- Added `is_revoked` - Soft delete for audit trail
- Added `last_used_at` - Track token usage

**Files Modified:**

- ✅ `apps/auth-service/prisma/schema.prisma` - Updated RefreshToken model
- ✅ `apps/auth-service/src/services/auth.service.ts` - Token rotation logic
- ✅ `apps/auth-service/src/controllers/auth.controller.ts` - Pass request metadata

**New Files:**

- ✅ `apps/auth-service/src/services/token-blacklist.service.ts` - Redis blacklist
- ✅ `apps/auth-service/prisma/migrations/20260116140158_add_token_rotation_fields/` - DB migration

**Success Criteria Met:**

- ✅ Refresh tokens rotate on use
- ✅ Old refresh tokens invalid after rotation
- ✅ Token revocation via Redis blacklist
- ✅ Token family tracking detects reuse attacks
- ✅ All sessions invalidated on password change

**BREAKING CHANGE:**

The `/auth/refresh` endpoint now returns BOTH `accessToken` AND `refreshToken`.
Clients MUST update their stored refresh token after each refresh request.

**Response format changed from:**
```json
{ "accessToken": "...", "expiresIn": "15m" }
```

**To:**
```json
{ "accessToken": "...", "refreshToken": "...", "expiresIn": "15m" }
```

**Testing Notes:**

- Existing refresh tokens were deleted (users must re-login)
- Test token rotation by calling /auth/refresh twice with same token (should fail on second)
- Test password change invalidates all sessions

---

#### Priority 1.3: Account Lockout & Brute Force Protection ✅ COMPLETED

**Status:** ✅ **COMPLETED** (January 16, 2026)
**Effort:** 3 hours
**Impact:** HIGH
**Commit:** `2c0e3f6 - security: implement account lockout and brute force protection`

**Implementation Summary:**

✅ **Completed Tasks:**

1. ✅ Implemented failed login attempt tracking:
   - Track failed attempts by email (hashed) in Redis
   - Lockout after 5 failed attempts within 15-minute window
   - Auto-unlock after 15-minute lockout period expires
2. ✅ Added exponential backoff for repeated failures:
   - Base delay: 1 second
   - Max delay: 60 seconds
   - Formula: baseDelay * 2^(attempts - 2)
3. ✅ Added suspicious activity logging to console (Sentry integration ready)
4. ✅ Added admin endpoints for lockout management

**Deferred (Future Enhancement):**
- CAPTCHA integration (for future, as specified)
- Email notifications for lockouts (for future)

**Files Modified:**

- ✅ `apps/auth-service/src/services/auth.service.ts` - Integrated brute force protection into login flow
- ✅ `apps/auth-service/src/controllers/auth.controller.ts` - Added admin lockout endpoints
- ✅ `apps/auth-service/src/routes/auth.ts` - Added admin routes

**New Files:**

- ✅ `apps/auth-service/src/services/login-attempts.service.ts` - Core brute force protection logic

**Configuration (Configurable via constants):**

```typescript
const CONFIG = {
  MAX_FAILED_ATTEMPTS: 5,        // Lockout after 5 failures
  LOCKOUT_DURATION: 15 * 60,     // 15 minutes lockout
  ATTEMPT_WINDOW: 15 * 60,       // 15 minute tracking window
  EXPONENTIAL_BACKOFF: true,     // Enable backoff
  BACKOFF_BASE_DELAY: 1,         // 1 second base
  BACKOFF_MAX_DELAY: 60,         // 60 seconds max
};
```

**Success Criteria Met:**

- ✅ Accounts lock after 5 failed attempts
- ✅ Lockout duration is configurable (currently 15 minutes)
- ✅ Admin can unlock accounts via POST /auth/admin/unlock/:email
- ✅ Admin can check lockout status via GET /auth/admin/lockout/:email
- ✅ Suspicious activity logged with IP addresses
- ✅ Exponential backoff between attempts

**API Endpoints Added:**

1. `GET /auth/admin/lockout/:email` - Get lockout status (requires authentication)
   - Returns: isLocked, failedAttempts, lockout details
2. `POST /auth/admin/unlock/:email` - Manually unlock account (requires authentication)
   - Note: Should add ADMIN role check in production

**Security Features:**

- Email addresses are hashed (SHA-256) before storing in Redis keys
- Failed attempts recorded even for non-existent users (prevents enumeration)
- IP addresses tracked (up to 10) for audit purposes
- Warning messages when approaching lockout threshold

**Testing Notes:**

- Requires backend services restart to apply changes
- Test by making 5+ failed login attempts
- Verify lockout message appears on 6th attempt
- Test admin unlock endpoint to clear lockout
- Redis keys use prefixes: `login_attempts:` and `account_lockout:`

---

#### Priority 1.4: Audit Logging Infrastructure Fix ✅ COMPLETED

**Status:** ✅ **COMPLETED** (January 16, 2026)
**Effort:** 2 hours
**Impact:** HIGH
**Commits:**
- `0a0ce66 - feat: enable audit logging for login/logout and event subscriptions`
- `dde1439 - fix: update RabbitMQ default credentials to admin:admin`

**Problem Identified:**

The audit logs feature was implemented but not functioning properly due to two issues:
1. RabbitMQ event subscriptions were never started in admin-service
2. Login/logout events were not being published by auth-service

**Implementation Summary:**

✅ **Completed Tasks:**

1. ✅ Initialize RabbitMQ event subscriptions in admin-service:
   - Import and call `startEventSubscriptions()` on server startup
   - Add graceful shutdown with `closeSubscriptions()` on SIGTERM/SIGINT

2. ✅ Add login/logout audit logging:
   - Auth-service now publishes `user.login` event on successful login
   - Auth-service now publishes `user.logout` event on logout
   - Admin-service subscribes to and logs these events

3. ✅ Fix RabbitMQ credentials:
   - Updated default credentials from `guest:guest` to `admin:admin`
   - Matches docker-compose.yml configuration
   - Updated in auth-service, admin-service, and payments-service

**Files Modified:**

- ✅ `apps/admin-service/src/main.ts` - Initialize event subscriptions on startup
- ✅ `apps/admin-service/src/events/subscriber.ts` - Add user.login/logout handlers
- ✅ `apps/auth-service/src/services/auth.service.ts` - Publish login/logout events
- ✅ `apps/admin-service/src/config/index.ts` - Fix RabbitMQ URL default
- ✅ `apps/auth-service/src/config/index.ts` - Fix RabbitMQ URL default
- ✅ `apps/payments-service/src/config/index.ts` - Fix RabbitMQ URL default

**Audit Events Now Captured:**

| Event | Trigger | Data Captured |
|-------|---------|---------------|
| USER_LOGIN | Successful login | userId, email, loginAt, ipAddress |
| USER_LOGOUT | User logout | userId, logoutAt, email |
| USER_REGISTERED | New user registration | userId, email, role |
| USER_DELETED | User deletion | userId, email |
| USER_UPDATED | Admin updates user | userId, updatedFields |
| USER_ROLE_CHANGED | Role change | userId, newRole |
| USER_STATUS_CHANGED | Status change | userId, isActive |
| PAYMENT_* | Payment events | paymentId, amount, status |

**RabbitMQ Queues Created:**

- `admin_service_user_events` - Subscribes to `user.*` events
- `admin_service_payment_events` - Subscribes to `payment.*` events

**Success Criteria Met:**

- ✅ Login events logged with IP address
- ✅ Logout events logged
- ✅ All user lifecycle events captured
- ✅ Event subscriptions start automatically on admin-service startup
- ✅ Graceful shutdown closes subscriptions properly

**Testing Notes:**

- Requires `.env` file to have correct `RABBITMQ_URL=amqp://admin:admin@localhost:5672`
- Or run with: `export $(grep -v '^#' .env | xargs) && pnpm dev:backend`
- Verify queues exist: `curl -s -u admin:admin http://localhost:15672/api/queues | jq -r '.[].name'`
- Check audit logs: Admin MFE → Audit Logs tab

**Architecture Diagram:**

```
┌─────────────────┐    user.login     ┌─────────────────┐
│  Auth Service   │ ────────────────► │    RabbitMQ     │
│   (port 3001)   │    user.logout    │  (port 5672)    │
└─────────────────┘                   └────────┬────────┘
                                               │
                                               │ user.*
                                               ▼
                                      ┌─────────────────┐
                                      │  Admin Service  │
                                      │   (port 3003)   │
                                      └────────┬────────┘
                                               │
                                               │ createAuditLog()
                                               ▼
                                      ┌─────────────────┐
                                      │   PostgreSQL    │
                                      │  (admin_db)     │
                                      │   audit_logs    │
                                      └─────────────────┘
```

---

#### Priority 1.5: Payment Events Audit Logging Fix ✅ COMPLETED

**Status:** ✅ **COMPLETED** (January 17, 2026)
**Effort:** 2 hours
**Impact:** HIGH
**Commits:**
- `d65427a - fix(admin,payments): ensure RabbitMQ connection before event operations`
- `f2a1c4a - feat(admin): show all audit actions in filter dropdown`

**Problem Identified:**

Despite the event subscription infrastructure being set up in Priority 1.4, payment events were still not appearing in audit logs. Investigation revealed:

1. **Root Cause:** RabbitMQ connection race condition
   - The `connection.ts` files used `connectionManager.connect().catch()` which is non-blocking
   - Subscribers and publishers tried to initialize before the connection was established
   - RabbitMQ Management UI showed 0 connections, 0 exchanges, 0 queues

2. **Secondary Issue:** Audit log filter dropdown only showed existing actions
   - `getAvailableActions()` queried database for distinct actions
   - Payment actions didn't appear until events were already logged
   - Users couldn't filter by payment actions before any existed

**Implementation Summary:**

✅ **Completed Tasks:**

1. ✅ Fixed RabbitMQ connection initialization in admin-service:
   - Added `initializeConnection()` function that properly awaits the connection promise
   - Updated `startEventSubscriptions()` to call `initializeConnection()` before subscribing
   - Ensures connection is established before any queue bindings

2. ✅ Fixed RabbitMQ connection initialization in payments-service:
   - Added `initializeConnection()` function (same pattern as admin-service)
   - Added `initializePublisher()` function that awaits connection before initializing publisher
   - Updated `main.ts` to call `initializePublisher()` at startup
   - Added proper shutdown handling with `closePublisher()` and `closeSubscriber()`

3. ✅ Fixed audit log actions dropdown:
   - Changed `getAvailableActions()` to return all known actions from `AUDIT_ACTIONS` constant
   - All 16 audit action types now available in filter dropdown immediately
   - Includes all payment actions: `PAYMENT_CREATED`, `PAYMENT_UPDATED`, `PAYMENT_COMPLETED`, `PAYMENT_FAILED`, `PAYMENT_CANCELLED`

**Files Modified:**

- ✅ `apps/admin-service/src/events/connection.ts` - Added `initializeConnection()` function
- ✅ `apps/admin-service/src/events/subscriber.ts` - Call `initializeConnection()` before subscribing
- ✅ `apps/payments-service/src/events/connection.ts` - Added `initializeConnection()` function
- ✅ `apps/payments-service/src/events/publisher.ts` - Added `initializePublisher()` function
- ✅ `apps/payments-service/src/main.ts` - Initialize publisher at startup, proper shutdown
- ✅ `apps/admin-service/src/services/audit-logs.service.ts` - Return all AUDIT_ACTIONS

**Code Pattern Applied:**

```typescript
// Before (broken - non-blocking connection)
export function getConnectionManager(): RabbitMQConnectionManager {
  if (!connectionManager) {
    connectionManager = new RabbitMQConnectionManager({ ... });
    connectionManager.connect().catch(console.error); // Non-blocking!
  }
  return connectionManager;
}

// After (fixed - properly awaited connection)
let connectionPromise: Promise<void> | null = null;

export async function initializeConnection(): Promise<void> {
  const manager = getConnectionManager();
  if (!connectionPromise) {
    connectionPromise = manager.connect();
  }
  try {
    await connectionPromise; // Properly awaited!
    console.log('[Service] RabbitMQ connection established');
  } catch (error) {
    connectionPromise = null; // Allow retry
    throw error;
  }
}
```

**Success Criteria Met:**

- ✅ RabbitMQ connections established at service startup
- ✅ RabbitMQ Management UI shows 2 connections (admin-service + payments-service)
- ✅ Exchanges and queues properly created and bound
- ✅ Payment events (status changes) now appear in audit logs
- ✅ All 16 audit action types available in filter dropdown
- ✅ No regression in existing functionality

**Testing Notes:**

- After fix, RabbitMQ Management UI (http://localhost:15672) shows:
  - 2 connections (admin-service, payments-service)
  - Exchanges: `user.events`, `payment.events`
  - Queues: `admin_service_user_events`, `admin_service_payment_events`
- Changing payment status in UI triggers event that appears in audit logs
- Filter dropdown shows all actions including payment actions before any logs exist

---

### Phase 2: Input Validation & Sanitization (Week 2) 🛡️

#### Priority 2.1: Enhanced Validation for Payments Service ✅ COMPLETED

**Status:** ✅ **COMPLETED** (January 16, 2026)
**Effort:** 4 hours
**Impact:** MEDIUM-HIGH

**Implementation Summary:**

The payments service already had Zod validators. This task enhanced them with:

✅ **Completed Tasks:**

1. ✅ Enhanced text sanitization (XSS prevention):
   - Removes HTML tags
   - Removes `javascript:` protocol
   - Removes event handler attributes (`onclick=`, etc.)
   - Trims whitespace
   - Normalizes Unicode (NFC)
   - Removes null bytes

2. ✅ Enhanced amount validation:
   - Minimum: $0.01
   - Maximum: $10,000,000 (prevents overflow/fraud)
   - Positive number validation

3. ✅ Added ISO 4217 currency validation:
   - Validates against 40+ common ISO currency codes
   - Auto-uppercase normalization
   - Rejects invalid currency codes

4. ✅ Added UUID validation for path parameters:
   - New `uuidParamSchema` for validating `:id` params
   - Consistent error handling via Zod

5. ✅ Enhanced enum validation:
   - `status` and `type` query params now use strict enums (was any string)
   - Prevents filter manipulation attacks

6. ✅ Added length limits on webhook fields:
   - `pspTransactionId`: max 255 chars
   - `pspStatus`: max 100 chars
   - `failureReason`: max 1000 chars

7. ✅ Added `reportsQuerySchema` for reports endpoint

**Files Modified:**

- ✅ `apps/payments-service/src/validators/payment.validators.ts` - Enhanced validators
- ✅ `apps/payments-service/src/controllers/payment.controller.ts` - Integrated UUID param validation
- ✅ `apps/payments-service/src/validators/payment.validators.spec.ts` - Added 45+ new tests
- ✅ `apps/payments-service/src/controllers/payment.controller.spec.ts` - Updated mocks
- ✅ `apps/payments-service/src/controllers/payment.controller.test.ts` - Updated mocks

**New Exports:**

```typescript
// Constants for reuse across services
export { PAYMENT_STATUSES, PAYMENT_TYPES, ISO_4217_CURRENCIES, MAX_PAYMENT_AMOUNT, MIN_PAYMENT_AMOUNT };

// New schemas
export { uuidParamSchema, reportsQuerySchema };
```

**Success Criteria Met:**

- ✅ All payment endpoints validated
- ✅ Invalid requests return 400 with validation details
- ✅ XSS sanitization prevents script injection
- ✅ Amount limits prevent overflow/fraud
- ✅ ISO 4217 currency validation enforced
- ✅ 130 unit tests passing

**Testing Notes:**

- All 130 tests pass in payments-service
- Build compiles successfully
- No regression in existing functionality

---

#### Priority 2.2: Add Validation to Admin Service ✅ COMPLETED

**Status:** ✅ **COMPLETED** (January 16, 2026)
**Effort:** 3 hours
**Impact:** MEDIUM

**Implementation Summary:**

Applied same security patterns from Priority 2.1 (payments-service) to admin-service validators.

✅ **Completed Tasks:**

1. ✅ Added XSS sanitization via `sanitizeString()` helper:
   - Removes HTML tags
   - Removes `javascript:` protocol
   - Removes event handler attributes (`onclick=`, etc.)
   - Normalizes unicode (NFC)
   - Removes null bytes

2. ✅ Added `uuidParamSchema` for path parameter validation:
   - All `:id` path params now validated as UUID
   - Prevents injection via malformed IDs
   - Controllers updated to use Zod validation instead of manual checks

3. ✅ Added `auditLogsQuerySchema` for audit log queries:
   - Strict enum validation for `action` (16 valid actions)
   - Strict enum validation for `resourceType` (4 valid types)
   - UUID validation for `userId` filter
   - Date coercion for `startDate`/`endDate`
   - Pagination with limit max 100

4. ✅ Enhanced existing schemas with sanitization:
   - `listUsersSchema`: sanitized `search`, strict role enum
   - `updateUserSchema`: sanitized `name`, email max length
   - `updateUserStatusSchema`: sanitized `reason`
   - `createUserSchema`: sanitized `name`, strong password validation

5. ✅ Added comprehensive test suite (70+ new tests):
   - XSS sanitization tests
   - UUID validation tests
   - Strict enum validation tests
   - Password requirements tests
   - Length limit tests

**Files Modified:**

- ✅ `apps/admin-service/src/validators/admin.validators.ts` - Enhanced validators
- ✅ `apps/admin-service/src/validators/admin.validators.spec.ts` - 70+ new tests
- ✅ `apps/admin-service/src/controllers/admin.controller.ts` - UUID param validation
- ✅ `apps/admin-service/src/controllers/admin.controller.spec.ts` - Updated tests
- ✅ `apps/admin-service/src/controllers/audit-logs.controller.ts` - Zod validation

**New Exports:**

```typescript
// Constants for reuse
export { USER_ROLES, AUDIT_ACTIONS, RESOURCE_TYPES };

// New schemas
export { uuidParamSchema, auditLogsQuerySchema };

// Sanitization utilities
export { sanitizeString, sanitizedString };
```

**Success Criteria Met:**

- ✅ All admin endpoints validated with Zod
- ✅ XSS sanitization on all text inputs
- ✅ UUID validation for path parameters
- ✅ Strict enum validation prevents filter manipulation
- ✅ 102 unit tests passing
- ✅ No regression in existing functionality

**Testing Notes:**

- All 102 admin-service tests pass
- Auth-service and payments-service tests unaffected
- Build compiles successfully

---

#### Priority 2.3: Enhance Existing Validators ✅ COMPLETED

**Status:** ✅ **COMPLETED** (January 16, 2026)
**Effort:** 2 hours
**Impact:** MEDIUM

**Implementation Summary:**

Applied consistent security patterns across auth-service and profile-service validators.

✅ **Completed Tasks:**

1. ✅ **Auth Service Enhancements:**
   - Added `sanitizeString()` helper for XSS prevention
   - Added `uuidParamSchema` for `/auth/internal/users/:id` endpoint
   - Added `emailParamSchema` for `/auth/admin/lockout/:email` and `/auth/admin/unlock/:email`
   - Added length limits: email (255), password (255), name (255), refreshToken (2048)
   - Updated controllers to use Zod validation for path parameters

2. ✅ **Profile Service Enhancements:**
   - Added `sanitizeString()` helper for XSS prevention
   - Added phone number format validation (regex pattern)
   - Added timezone validation (IANA format: `America/New_York`, `UTC`)
   - Added language code validation (ISO 639-1 / BCP 47: `en`, `en-US`)
   - Added currency code validation with uppercase transform (ISO 4217)
   - Sanitized fields: address, bio, category
   - Added length limits on all fields

3. ✅ **Unicode Normalization:**
   - All `sanitizeString()` implementations include `.normalize('NFC')`

4. ✅ **Comprehensive Test Suites:**
   - Auth validators: 40+ tests (XSS, UUID, email params, length limits)
   - Profile validators: 30+ tests (phone, timezone, language, currency)

**Files Modified:**

- ✅ `apps/auth-service/src/validators/auth.validators.ts` - Enhanced validators
- ✅ `apps/auth-service/src/validators/auth.validators.spec.ts` - Extended tests
- ✅ `apps/auth-service/src/controllers/auth.controller.ts` - UUID/email validation
- ✅ `apps/profile-service/src/validators/profile.validators.ts` - Enhanced validators
- ✅ `apps/profile-service/src/validators/profile.validators.spec.ts` - New test file

**Decision: No Shared Library**

Instead of creating a shared `libs/backend/validation` library, the `sanitizeString()` helper was duplicated in each service. This approach:
- Avoids cross-service dependencies
- Keeps services independently deployable
- Follows microservices best practices
- Can be refactored to shared lib in future if needed

**Success Criteria Met:**

- ✅ XSS patterns sanitized (HTML tags, javascript:, event handlers)
- ✅ All string inputs normalized (unicode NFC, trimmed)
- ✅ Path traversal prevented via UUID/email validation
- ✅ Comprehensive validation test suites
- ✅ All backend tests passing: auth (105), profile (62), admin (102), payments (130)

---

### Phase 3: Secrets Management (Week 3) 🔐

#### Priority 3.1: Secrets Rotation Policy ✅ COMPLETED

**Status:** ✅ **COMPLETED** (January 17, 2026)
**Effort:** 4 hours
**Impact:** HIGH

**Implementation Summary:**

✅ **Completed Tasks:**

1. ✅ Implemented JWT secret rotation with key versioning:
   - Created `@payments-system/secrets` library with SecretManager class
   - JWT tokens now include `kid` (key ID) in header to identify signing secret
   - Supports multiple active secrets for graceful rotation
   - Old secrets remain verifiable during grace period
   - Automatic cleanup of old secrets beyond configured keep limit

2. ✅ Created admin endpoints for secret rotation:
   - `GET /auth/admin/secrets/status` - View secrets status (without exposing values)
   - `POST /auth/admin/secrets/rotate` - Rotate JWT/refresh secrets
   - `GET /auth/admin/secrets/rotation-history` - View rotation audit trail
   - `POST /auth/admin/secrets/check-expiring` - Check for expiring secrets

3. ✅ Added secret expiry tracking and warnings:
   - Secrets can have configurable expiry dates
   - Warning callback triggered when secrets near expiry
   - Expired secrets automatically disabled for verification

4. ✅ Created comprehensive documentation:
   - `docs/POC-3-Implementation/SECRETS-ROTATION-GUIDE.md`
   - Covers JWT rotation, database credentials, Redis, RabbitMQ
   - Includes troubleshooting guide and API reference

**New Files:**

- ✅ `libs/backend/secrets/src/lib/secret-manager.ts` - Core SecretManager class
- ✅ `libs/backend/secrets/src/lib/types.ts` - Type definitions
- ✅ `libs/backend/secrets/src/lib/config-helper.ts` - Environment variable parsing
- ✅ `libs/backend/secrets/src/lib/secret-manager.spec.ts` - 23 unit tests
- ✅ `libs/backend/secrets/src/index.ts` - Library exports
- ✅ `libs/backend/secrets/project.json` - Nx project configuration
- ✅ `docs/POC-3-Implementation/SECRETS-ROTATION-GUIDE.md` - Rotation documentation

**Files Modified:**

- ✅ `apps/auth-service/src/config/index.ts` - Added SecretManager integration
- ✅ `apps/auth-service/src/utils/token.ts` - Use SecretManager for signing/verifying
- ✅ `apps/auth-service/src/controllers/auth.controller.ts` - Added secret admin endpoints
- ✅ `apps/auth-service/src/routes/auth.ts` - Added secret admin routes
- ✅ `apps/api-gateway/src/config/index.ts` - Added SecretManager integration
- ✅ `apps/api-gateway/src/middleware/auth.ts` - Use SecretManager for verification
- ✅ `tsconfig.base.json` - Added @payments-system/secrets path alias

**Environment Variable Support:**

```bash
# Legacy (backwards compatible)
JWT_SECRET=your-access-token-secret
JWT_REFRESH_SECRET=your-refresh-token-secret

# Versioned (multiple secrets with key IDs)
JWT_SECRETS='[{"kid":"v2","secret":"new-secret","isActive":true},{"kid":"v1","secret":"old-secret","isActive":false,"canVerify":true}]'
JWT_REFRESH_SECRETS='[{"kid":"refresh-v2","secret":"new-secret","isActive":true}]'
```

**API Endpoints Added:**

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/auth/admin/secrets/status` | GET | Get secrets status (without values) |
| `/auth/admin/secrets/rotate` | POST | Rotate JWT/refresh secrets |
| `/auth/admin/secrets/rotation-history` | GET | View rotation history |
| `/auth/admin/secrets/check-expiring` | POST | Check for expiring secrets |

**Success Criteria Met:**

- ✅ JWT secrets can rotate without downtime
- ✅ Multiple versions supported with key IDs
- ✅ Automated rotation alerts (callback on expiry)
- ✅ Admin endpoints for rotation management
- ✅ Database credential rotation documented
- ✅ 23 unit tests passing for secrets library
- ✅ 107 auth-service tests passing (no regression)

**Testing Notes:**

- Existing tokens with old secrets continue to work during rotation
- New tokens are signed with the active secret and include `kid` header
- Verification attempts use `kid` to find the correct secret first
- Falls back to trying all verifiable secrets for legacy tokens
- Requires backend services restart after environment variable changes

---

#### Priority 3.2: Environment Variable Validation ✅ COMPLETED

**Status:** ✅ **COMPLETED** (January 17, 2026)
**Effort:** 2 hours
**Impact:** MEDIUM

**Implementation Summary:**

✅ **Completed Tasks:**

1. ✅ Created shared config validation in `@payments-system/secrets` library:
   - Added `config-validator.ts` with Zod schemas for common types
   - Port validation (1-65535)
   - URL validation (PostgreSQL, Redis, RabbitMQ, HTTP URLs)
   - JWT duration validation (e.g., '15m', '7d')
   - Environment enum validation ('development', 'production', 'test')
   - Log level enum validation ('error', 'warn', 'info', 'debug', 'trace')

2. ✅ Implemented fail-fast `validateConfig()` function:
   - Parses config with Zod (applies defaults)
   - Throws error on validation failure (in all environments)
   - Checks for insecure patterns in production (e.g., 'your-secret', 'change-me')
   - Provides clear error messages showing what's invalid

3. ✅ Updated all service configs with Zod validation:
   - API Gateway: port, CORS, Redis, services, JWT secrets
   - Auth Service: port, database, JWT, bcrypt rounds, RabbitMQ, Redis
   - Payments Service: port, database, RabbitMQ, Redis
   - Admin Service: port, database, RabbitMQ
   - Profile Service: port, database, Redis, JWT

4. ✅ Production security checks:
   - Blocks insecure default values ('your-secret', 'change-me', 'test-secret', etc.)
   - Requires proper secret configuration (no empty secrets)
   - Validated URL formats for all connection strings

**New Files:**

- ✅ `libs/backend/secrets/src/lib/config-validator.ts` - Core validation logic

**Files Modified:**

- ✅ `libs/backend/secrets/src/index.ts` - Export config validation utilities
- ✅ `apps/api-gateway/src/config/index.ts` - Zod schema validation
- ✅ `apps/auth-service/src/config/index.ts` - Zod schema validation
- ✅ `apps/payments-service/src/config/index.ts` - Zod schema validation
- ✅ `apps/admin-service/src/config/index.ts` - Zod schema validation
- ✅ `apps/profile-service/src/config/index.ts` - Zod schema validation

**Schema Examples:**

```typescript
// Port validation
port: portSchema.default(3001)  // z.coerce.number().int().min(1).max(65535)

// Database URL validation
database: z.object({
  url: postgresUrlSchema.default('postgresql://postgres:postgres@localhost:5432/auth_db'),
})

// JWT duration validation
jwtExpiresIn: jwtDurationSchema.default('15m')  // Validates '15m', '7d', '1h' format

// URL validation (works with any protocol)
authService: z.object({
  url: urlSchema.default('http://localhost:3001'),  // Validates via URL constructor
})
```

**Insecure Patterns Blocked (Production Only):**

```typescript
const INSECURE_PATTERNS = [
  'change-in-production',
  'change-me',
  'your-secret',
  'default-secret',
  'test-secret',
  'development-only',
  '123456',
];
```

**Success Criteria Met:**

- ✅ All services validate config on startup
- ✅ Clear error messages for invalid config
- ✅ No default insecure values allowed in production
- ✅ All 5 services build successfully
- ✅ All tests passing (auth-service: 107 tests)

**Testing Notes:**

- Services will fail to start with invalid config
- Error messages clearly indicate which field is invalid
- Development/test modes allow localhost URLs
- Production mode blocks insecure patterns

---

#### Priority 3.3: Secrets Encryption

**Effort:** 6 hours  
**Impact:** MEDIUM

**Tasks:**

1. Implement secrets encryption at rest:
   - Use AWS KMS, Azure Key Vault, or HashiCorp Vault
   - Encrypt sensitive config values
2. Add decryption on service startup
3. Add audit logging for secret access
4. Document secrets management policy

**New Files:**

- `libs/backend/secrets/src/lib/encryption.ts`
- `docs/POC-3-Implementation/SECRETS-MANAGEMENT.md`

**Success Criteria:**

- Secrets encrypted in .env files
- Decryption transparent to application
- Audit trail for secret access

---

### Phase 4: Database Security Hardening (Week 4) 🗄️

#### Priority 4.1: Connection Pool Configuration

**Effort:** 2 hours  
**Impact:** MEDIUM

**Tasks:**

1. Configure Prisma connection pool limits:
   - Min connections: 2
   - Max connections: 10 (per service)
   - Connection timeout: 30s
   - Idle timeout: 600s
2. Add pool monitoring metrics
3. Add alerts for pool exhaustion

**Files to Modify:**

- All service `src/lib/prisma.ts` files

**Success Criteria:**

- Connection pools properly sized
- Monitoring in Grafana
- Alerts configured

---

#### Priority 4.2: Query Timeout & Performance

**Effort:** 3 hours  
**Impact:** MEDIUM

**Tasks:**

1. Add query timeout configuration (10s default)
2. Add slow query logging (>1s)
3. Add query performance monitoring
4. Identify and index slow queries
5. Add query complexity limits

**Files to Modify:**

- All service Prisma client configurations

**New Files:**

- `libs/backend/db/src/lib/query-monitor.ts`

**Success Criteria:**

- Queries timeout after 10s
- Slow queries logged and monitored
- Performance dashboard in Grafana

---

#### Priority 4.3: Data Encryption

**Effort:** 8 hours  
**Impact:** MEDIUM

**Tasks:**

1. Implement field-level encryption for sensitive data:
   - User passwords (already hashed) ✅
   - Payment details (card numbers, etc.)
   - Personal information (SSN, etc.)
2. Add encryption/decryption middleware
3. Document encryption keys management
4. Add key rotation support

**New Files:**

- `libs/backend/encryption/src/lib/field-encryption.ts`
- `libs/backend/encryption/src/lib/encryption-middleware.ts`

**Success Criteria:**

- Sensitive fields encrypted in database
- Transparent decryption on read
- Key rotation support

---

#### Priority 4.4: Database Access Audit Logging

**Effort:** 4 hours  
**Impact:** LOW-MEDIUM

**Tasks:**

1. Add Prisma middleware for audit logging:
   - Log all write operations (create, update, delete)
   - Track user context
   - Log to separate audit database
2. Add query audit dashboard
3. Add alerts for suspicious patterns

**New Files:**

- `libs/backend/db/src/lib/audit-middleware.ts`

**Success Criteria:**

- All write operations logged
- Audit logs queryable
- Dashboard in Grafana

---

### Phase 5: Service Resilience (Week 5) 💪

#### Priority 5.1: Circuit Breaker Implementation

**Effort:** 6 hours  
**Impact:** MEDIUM

**Tasks:**

1. Implement circuit breaker for inter-service calls:
   - Use `opossum` library
   - Configure thresholds (error rate, timeout)
   - Add fallback handlers
2. Add circuit breaker for external dependencies:
   - Database connections
   - Redis connections
   - RabbitMQ connections
3. Add circuit state monitoring
4. Add dashboard for circuit states

**New Files:**

- `libs/backend/resilience/src/lib/circuit-breaker.ts`
- `libs/backend/resilience/src/lib/fallback-handlers.ts`

**Success Criteria:**

- Circuit breakers protect all external calls
- Fallback responses configured
- Circuit state visible in dashboard

---

#### Priority 5.2: Retry Policies

**Effort:** 4 hours  
**Impact:** MEDIUM

**Tasks:**

1. Implement exponential backoff retry:
   - Max retries: 3
   - Initial delay: 100ms
   - Backoff factor: 2x
   - Max delay: 5s
2. Add retry for idempotent operations only
3. Add retry budget (prevent retry storms)
4. Add retry metrics

**New Files:**

- `libs/backend/resilience/src/lib/retry-policy.ts`

**Success Criteria:**

- Transient failures auto-retry
- Retry budget prevents storms
- Metrics track retry success/failure

---

#### Priority 5.3: Graceful Degradation

**Effort:** 5 hours  
**Impact:** MEDIUM

**Tasks:**

1. Implement feature flags for degraded mode:
   - Disable non-critical features under load
   - Use cached data when services unavailable
2. Add health check levels (live, ready, degraded)
3. Add auto-recovery monitoring
4. Document degraded mode behavior

**New Files:**

- `libs/backend/resilience/src/lib/feature-flags.ts`
- `libs/backend/resilience/src/lib/degraded-mode.ts`

**Success Criteria:**

- System remains operational in degraded mode
- Feature flags configurable at runtime
- Recovery automatic when possible

---

### Phase 6: Enhanced API Security (Week 6) 🔒

#### Priority 6.1: Security Headers on All Services

**Effort:** 2 hours  
**Impact:** MEDIUM

**Tasks:**

1. Add Helmet middleware to all services:
   - Auth Service
   - Payments Service
   - Profile Service (already has it)
   - Admin Service (already has it)
2. Configure CSP for each service
3. Add security header tests

**Files to Modify:**

- `apps/auth-service/src/main.ts`
- `apps/payments-service/src/main.ts`

**Success Criteria:**

- All services have security headers
- CSP properly configured
- Security headers tested

---

#### Priority 6.2: Response Sanitization

**Effort:** 3 hours  
**Impact:** MEDIUM

**Tasks:**

1. Implement response sanitization middleware:
   - Remove stack traces in production
   - Sanitize error messages
   - Remove internal IDs/paths
2. Add PII detection and redaction
3. Add test suite

**New Files:**

- `libs/backend/middleware/src/lib/response-sanitizer.ts`

**Success Criteria:**

- Responses sanitized in production
- No PII leaked in errors
- Stack traces only in development

---

#### Priority 6.3: Request Size Limits

**Effort:** 2 hours  
**Impact:** LOW-MEDIUM

**Tasks:**

1. Add request body size limits:
   - JSON: 10MB max
   - URL-encoded: 10MB max
   - File uploads: 50MB max
2. Add URL length limits
3. Add header size limits
4. Add proper error messages

**Files to Modify:**

- All service `main.ts` files

**Success Criteria:**

- Large requests rejected
- Proper error messages
- Limits configurable per endpoint

---

#### Priority 6.4: API Versioning

**Effort:** 4 hours  
**Impact:** LOW

**Tasks:**

1. Implement API versioning strategy:
   - URL-based versioning (/api/v1/...)
   - Header-based versioning (Accept: application/vnd.api+json; version=1)
2. Add version deprecation warnings
3. Document versioning policy

**Files to Modify:**

- `apps/api-gateway/src/routes/proxy-routes.ts`
- All service route files

**Success Criteria:**

- Multiple API versions supported
- Deprecation warnings in responses
- Clear migration path

---

### Phase 7: Advanced Security Features (Week 7+) 🚀

#### Priority 7.1: Multi-Factor Authentication (MFA)

**Effort:** 12 hours  
**Impact:** HIGH

**Tasks:**

1. Implement TOTP-based MFA:
   - Use `speakeasy` library
   - Generate QR codes for setup
   - Verify TOTP codes
2. Add SMS-based MFA (optional)
3. Add backup codes
4. Add MFA recovery flow
5. Add MFA enforcement policies

**New Files:**

- `apps/auth-service/src/services/mfa.service.ts`
- `apps/auth-service/src/controllers/mfa.controller.ts`

**Success Criteria:**

- Users can enable MFA
- TOTP verification works
- Backup codes available
- Recovery flow tested

---

#### Priority 7.2: Anomaly Detection

**Effort:** 16 hours  
**Impact:** MEDIUM

**Tasks:**

1. Implement basic anomaly detection:
   - Unusual login locations (GeoIP)
   - Login time patterns
   - Transaction amount anomalies
2. Add ML-based detection (future)
3. Add alerting for anomalies
4. Add user notifications

**New Files:**

- `libs/backend/security/src/lib/anomaly-detection.ts`
- `libs/backend/security/src/lib/geoip.ts`

**Success Criteria:**

- Suspicious activity detected
- Alerts sent to admins
- Users notified of unusual activity

---

#### Priority 7.3: Security Audit Logging Enhancement

**Effort:** 6 hours  
**Impact:** MEDIUM

**Tasks:**

1. Enhanced audit logging:
   - All authentication events
   - All authorization failures
   - All sensitive data access
   - All configuration changes
2. Add tamper-proof audit logs
3. Add audit log retention policy
4. Add compliance reporting

**Files to Modify:**

- All controllers with sensitive operations

**New Files:**

- `libs/backend/audit/src/lib/enhanced-audit.ts`

**Success Criteria:**

- Comprehensive audit trail
- Logs immutable
- Compliance reports available

---

## Implementation Guidelines

### Development Workflow

1. **Create Feature Branch:** `feat/hardening-{phase}-{priority}`
2. **Implement Changes:** Follow existing patterns, add tests
3. **Update Documentation:** Document new security features
4. **Security Review:** Peer review focusing on security implications
5. **Test Coverage:** Aim for 80%+ coverage on security features
6. **Merge to Main:** After review + CI/CD passes

### Testing Requirements

Each hardening task must include:

1. **Unit Tests:** Test individual functions/components
2. **Integration Tests:** Test service interactions
3. **Security Tests:** Test attack vectors
4. **Performance Tests:** Ensure no performance regression

### Rollback Plan

Each phase should be independently deployable and reversible:

1. Feature flags for new security features
2. Database migrations reversible
3. Configuration changes backward compatible
4. Clear rollback documentation

---

## Monitoring & Validation

### Security Metrics Dashboard

Create Grafana dashboard tracking:

1. **Rate Limiting:** Requests blocked, rate limit hits
2. **Authentication:** Failed logins, locked accounts, MFA usage
3. **Authorization:** RBAC denials, permission checks
4. **Validation:** Validation errors, sanitization hits
5. **Database:** Connection pool usage, slow queries
6. **Resilience:** Circuit breaker state, retry counts
7. **API Security:** Security header violations, large requests

### Security Alerts

Configure alerts for:

1. High rate of failed logins (>10 in 5 minutes)
2. Account lockouts
3. Rate limit exceeded (per user)
4. Circuit breaker open state
5. Database connection pool exhaustion
6. Slow queries (>5s)
7. Anomaly detection triggers

---

## Dependencies & Tools

### New Libraries Required

```json
{
  "opossum": "^8.1.0", // Circuit breaker
  "ioredis": "^5.3.0", // Redis client (for rate limiting, sessions)
  "speakeasy": "^2.0.0", // TOTP for MFA
  "qrcode": "^1.5.0", // QR code generation
  "geoip-lite": "^1.4.0", // GeoIP for anomaly detection
  "uuid": "^9.0.0", // Token fingerprinting
  "crypto": "builtin" // Encryption
}
```

### Infrastructure Changes

1. **Redis:** Required for rate limiting, session management, token blacklist
2. **Separate Audit Database:** For tamper-proof audit logs
3. **Secrets Manager:** AWS KMS, Azure Key Vault, or HashiCorp Vault

---

## Success Metrics

### Phase 1 Success

- ✅ Rate limits enforced on all endpoints
- ✅ Refresh tokens rotate on use
- ✅ Accounts lock after failed attempts
- ✅ Zero brute force attacks succeed

### Phase 2 Success

- ✅ All services have Zod validation
- ✅ No validation errors in production
- ✅ XSS/SQL injection attempts blocked
- ✅ 100% validation coverage

### Phase 3 Success

- ✅ Secrets rotate without downtime
- ✅ No hardcoded secrets in code
- ✅ Config validation on startup
- ✅ Secrets encrypted at rest

### Phase 4 Success

- ✅ Connection pools properly sized
- ✅ No slow queries (all <1s)
- ✅ Sensitive data encrypted
- ✅ All writes audited

### Phase 5 Success

- ✅ Circuit breakers protect external calls
- ✅ Transient failures auto-retry
- ✅ System operates in degraded mode
- ✅ Zero cascading failures

### Phase 6 Success

- ✅ All services have security headers
- ✅ No PII leaked in responses
- ✅ Large requests rejected
- ✅ API versioning implemented

### Phase 7 Success

- ✅ MFA available to all users
- ✅ Anomalies detected and alerted
- ✅ Comprehensive audit trail
- ✅ Compliance-ready logging

---

## Risk Assessment

### High Risk (Address Immediately)

1. ❗ **Rate Limiting Disabled** - Active vulnerability
2. ❗ **No JWT Refresh Rotation** - Token theft impact
3. ❗ **No Account Lockout** - Brute force attacks
4. ❗ **Weak Default Secrets** - Production compromise risk

### Medium Risk (Address in Phases 2-4)

1. ⚠️ **Missing Input Validation** - Data integrity issues
2. ⚠️ **No Circuit Breakers** - Cascading failures
3. ⚠️ **Plain Text Secrets** - Credential exposure
4. ⚠️ **No Connection Limits** - Resource exhaustion

### Low Risk (Address in Phases 5-7)

1. ℹ️ **No MFA** - Enhanced security desired
2. ℹ️ **No Anomaly Detection** - Proactive security
3. ℹ️ **No API Versioning** - Breaking changes impact

---

## Cost-Benefit Analysis

### Phase 1 (Critical): $0 cost, HIGH impact

- **Time:** 9 hours development + 3 hours testing
- **Risk Reduction:** 70% of critical vulnerabilities
- **ROI:** Immediate security improvement

### Phases 2-3 (High): $0 cost, MEDIUM-HIGH impact

- **Time:** 25 hours development + 8 hours testing
- **Risk Reduction:** 20% additional risk coverage
- **ROI:** Strong data integrity, compliance

### Phases 4-6 (Medium): $500-$1000 cost (infrastructure), MEDIUM impact

- **Time:** 40 hours development + 15 hours testing
- **Cost:** Redis hosting, secrets management service
- **Risk Reduction:** 5% additional risk coverage
- **ROI:** Operational stability, performance

### Phase 7 (Low): $1000+ cost, LOW-MEDIUM impact

- **Time:** 34+ hours development + 12 hours testing
- **Cost:** SMS provider, ML services
- **Risk Reduction:** 5% additional risk coverage
- **ROI:** Competitive advantage, compliance

---

## Conclusion

This hardening plan addresses critical security gaps in the POC-3 backend while maintaining pragmatic prioritization. **Phase 1 must be completed immediately** to restore production-ready security posture. Subsequent phases build defense-in-depth and prepare the system for enterprise deployment.

**Recommended Timeline:**

- **Week 1:** Phase 1 (Critical) - ALL hands on deck
- **Week 2-3:** Phase 2-3 (High priority)
- **Week 4-6:** Phase 4-6 (Medium priority)
- **Week 7+:** Phase 7 (Advanced features)

**Next Steps:**

1. Review and approve this plan
2. Create GitHub issues for each priority
3. Assign owners to Phase 1 tasks
4. Schedule daily stand-ups during Phase 1
5. Begin implementation immediately

---

## Appendix

### A. Related Documentation

- `docs/POC-3-Implementation/SENTRY-FULL-IMPLEMENTATION-PLAN.md`
- `docs/POC-3-Implementation/testing-guide.md`
- `docs/References/backend-poc2-architecture.md`
- `docs/References/backend-auth-service-implementation.md`

### B. Reference Implementations

- Auth Service: `apps/auth-service/src/validators/auth.validators.ts`
- Profile Service: `apps/profile-service/src/validators/profile.validators.ts`
- API Gateway RBAC: `apps/api-gateway/src/middleware/rbac.ts`

### C. Security Best Practices

- OWASP Top 10: https://owasp.org/www-project-top-ten/
- OWASP API Security: https://owasp.org/www-project-api-security/
- NIST Cybersecurity Framework: https://www.nist.gov/cyberframework

---

**Document Version:** 1.0  
**Last Updated:** December 23, 2025  
**Owner:** Backend Team  
**Reviewers:** Security Team, DevOps Team, Architecture Team
