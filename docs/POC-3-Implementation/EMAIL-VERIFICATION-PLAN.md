# Email Verification Implementation Plan - POC-3

**Created:** January 20, 2026
**Last Updated:** January 21, 2026
**Status:** 📋 **Planning Complete** - Ready for Implementation
**Priority:** Medium-High

---

## 📊 Implementation Progress

### Phase 1: Backend Infrastructure ✅ COMPLETE
- ✅ **Priority 1.1:** Verification Token Generation & Storage (Completed 2026-01-20)
- ✅ **Priority 1.2:** Email Verification Endpoints (Completed 2026-01-20)
- ✅ **Priority 1.3:** Login Flow Modification (Completed 2026-01-20)
- ✅ **Priority 1.4:** Resend Verification Endpoint (Completed in 1.2)
- ✅ **Priority 1.5:** Registration Flow Modification (Completed 2026-01-20)

### Phase 2: Event-Driven Email Integration 📌 TODO (Future)
- 📌 **Priority 2.1:** Publish Email Verification Events - *Requires email service infrastructure*
- 📌 **Priority 2.2:** Email Service Subscriber - *Requires SendGrid/AWS SES/SMTP setup*
- 📌 **Priority 2.3:** Email Templates - *Requires email service*

> **Note:** Phase 2 is deferred until production email infrastructure is in place. The `_dev` token response provides sufficient functionality for development and testing.

### Phase 3: Frontend Integration ⏳ IN PROGRESS
- ✅ **Priority 3.1:** Post-Registration Verification UI (Completed 2026-01-20)
- ✅ **Priority 3.2:** Email Verification Page (Completed 2026-01-21)
- ⏳ **Priority 3.3:** Resend Verification UI
- ⏳ **Priority 3.4:** Login Error Handling for Unverified Users

---

## Executive Summary

This document outlines the implementation plan for email verification in the MFE Payments System. The feature ensures users verify their email addresses before gaining full access to the application, following banking-grade security standards.

**Approach:** Hybrid (Option C) - Backend generates verification tokens and publishes events. Email sending is decoupled via RabbitMQ events, allowing the system to work without an email service during development while being production-ready.

---

## Architecture Overview

### Current State

```
Registration Flow (Current):
┌─────────────────────────┐
│  POST /auth/register    │
│  {email, password, name}│
└───────────┬─────────────┘
            │
            ▼
┌─────────────────────────────┐
│ • Check user exists         │
│ • Hash password             │
│ • Create user               │
│ • Generate access + refresh │
│ • Publish user.created      │
└───────────┬─────────────────┘
            │
            ▼
┌─────────────────────────────┐
│ Return AuthResponse with    │
│ access + refresh tokens     │
│ (Full access immediately)   │
└─────────────────────────────┘
```

### Proposed State

```
Registration Flow (With Email Verification):
┌─────────────────────────┐
│  POST /auth/register    │
│  {email, password, name}│
└───────────┬─────────────┘
            │
            ▼
┌─────────────────────────────────────────┐
│ • Check user exists                     │
│ • Hash password                         │
│ • Create user (emailVerified = false)   │
│ • Generate verification token (JWT)     │
│ • Store token in Redis (24h TTL)        │
│ • Publish user.created event            │
│ • Publish email.verification.requested  │
└───────────┬─────────────────────────────┘
            │
            ▼
┌─────────────────────────────────────────┐
│ Return 201 Created                      │
│ {                                       │
│   message: "Registration successful",   │
│   emailVerificationRequired: true,      │
│   verificationToken: "xxx" (dev only)   │
│ }                                       │
└─────────────────────────────────────────┘
            │
            │ (User receives email with link)
            ▼
┌─────────────────────────────────────────┐
│  POST /auth/verify-email                │
│  { token: "verification_token" }        │
│  -- OR --                               │
│  GET /auth/verify-email/:token          │
│  (Clickable link from email)            │
└───────────┬─────────────────────────────┘
            │
            ▼
┌─────────────────────────────────────────┐
│ • Verify JWT signature                  │
│ • Check token not expired               │
│ • Check token not already used          │
│ • Update user.emailVerified = true      │
│ • Invalidate token in Redis             │
│ • Publish user.email.verified event     │
└───────────┬─────────────────────────────┘
            │
            ▼
┌─────────────────────────────────────────┐
│ Return success + redirect to login      │
│ {                                       │
│   success: true,                        │
│   message: "Email verified"             │
│ }                                       │
└─────────────────────────────────────────┘
```

### Login Flow Modification

```
Login Flow (With Verification Check):
┌─────────────────────────┐
│  POST /auth/login       │
│  {email, password}      │
└───────────┬─────────────┘
            │
            ▼
┌─────────────────────────────────────────┐
│ • Validate credentials                  │
│ • Check account lockout                 │
│ • Check emailVerified status            │
└───────────┬─────────────────────────────┘
            │
    ┌───────┴───────┐
    │               │
    ▼               ▼
┌─────────┐   ┌─────────────────────────────┐
│ Verified│   │ Not Verified                │
└────┬────┘   │ Return 403 Forbidden        │
     │        │ {                           │
     │        │   error: "EMAIL_NOT_VERIFIED│
     │        │   message: "Please verify   │
     │        │            your email"      │
     │        │   canResend: true           │
     │        │ }                           │
     │        └─────────────────────────────┘
     ▼
┌─────────────────────────────────────────┐
│ Continue with normal login flow         │
│ (MFA check, token generation, etc.)     │
└─────────────────────────────────────────┘
```

---

## Database Schema

### Existing Schema (Already Supports Verification)

**File:** `apps/auth-service/prisma/schema.prisma`

```prisma
model User {
  id            String    @id @default(uuid())
  email         String    @unique
  passwordHash  String    @map("password_hash")
  name          String
  role          UserRole
  emailVerified Boolean   @default(false) @map("email_verified")  // ✅ Already exists!
  createdAt     DateTime  @default(now()) @map("created_at")
  updatedAt     DateTime  @updatedAt @map("updated_at")

  // Existing relations...
  mfaSecret          String?   @map("mfa_secret")
  mfaEnabled         Boolean   @default(false) @map("mfa_enabled")
  mfaBackupCodes     String[]  @map("mfa_backup_codes")
  refreshTokens      RefreshToken[]
  trustedDevices     TrustedDevice[]
  sessions           Session[]
}
```

**Note:** The `emailVerified` field already exists in the schema and defaults to `false`. No database migration required!

---

## API Endpoints

### New Endpoints

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/auth/verify-email` | No | Verify email with token (API call) |
| GET | `/auth/verify-email/:token` | No | Verify email (clickable link) |
| POST | `/auth/resend-verification` | No | Resend verification email |

### Modified Endpoints

| Method | Endpoint | Changes |
|--------|----------|---------|
| POST | `/auth/register` | Returns verification info instead of auth tokens |
| POST | `/auth/login` | Checks `emailVerified` status, returns error if false |

---

## Phase 1: Backend Infrastructure

### Priority 1.1: Verification Token Generation & Storage ✅ COMPLETED

**Status:** ✅ Completed 2026-01-20
**File:** `apps/auth-service/src/services/email-verification.service.ts`

**Implementation:**

```typescript
// Token generation using existing JWT infrastructure
interface VerificationTokenPayload {
  userId: string;
  email: string;
  purpose: 'email_verification';
  iat: number;
  exp: number;
}

// Token stored in Redis with structure:
// Key: email_verification:{userId}
// Value: { token, userId, email, createdAt, expiresAt }
// TTL: 24 hours (86400 seconds)
```

**Completed Tasks:**
- [x] Create `email-verification.service.ts` with token generation
- [x] Add Redis storage for verification tokens (24h TTL)
- [x] Add token validation logic (JWT verify + Redis check)
- [x] Add single-use token enforcement (delete after use via `consumeVerificationToken`)
- [x] Add rate limiting for token generation (max 5 per hour using atomic Redis increment)

**Functions Implemented:**
| Function | Description |
|----------|-------------|
| `generateVerificationToken(userId, email)` | Creates JWT token, stores in Redis, enforces rate limit |
| `validateVerificationToken(token)` | Verifies JWT signature, checks Redis for single-use |
| `consumeVerificationToken(userId)` | Deletes token from Redis (call after verification) |
| `getVerificationStatus(userId)` | Check if user has pending verification |
| `getRateLimitStatus(userId)` | Get remaining rate limit info |
| `clearVerificationToken(userId)` | Admin: clear token for user |
| `clearRateLimit(userId)` | Admin: reset rate limit for user |

**Security Features:**
- JWT signed with application secret (`config.jwtSecret`)
- Atomic rate limiting via Redis `INCR` with TTL
- Privacy-safe logging (emails masked as `j*****e@example.com`)
- OpenTelemetry tracing for observability

**Files Created/Modified:**
- `apps/auth-service/src/services/email-verification.service.ts` (New - 350+ lines)

---

### Priority 1.2: Email Verification Endpoints ✅ COMPLETED

**Status:** ✅ Completed 2026-01-20
**File:** `apps/auth-service/src/controllers/email-verification.controller.ts`

**Endpoints Implemented:**

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/auth/verify-email` | Verify email with JWT token (API call) |
| GET | `/auth/verify-email/:token` | Verify via clickable link (supports redirect) |
| POST | `/auth/resend-verification` | Resend verification email |

**Completed Tasks:**
- [x] Create `email-verification.controller.ts`
- [x] Add POST `/auth/verify-email` endpoint
- [x] Add GET `/auth/verify-email/:token` endpoint (for clickable links with ?redirect=true)
- [x] Add POST `/auth/resend-verification` endpoint
- [x] Add proper error responses (TOKEN_EXPIRED, INVALID_TOKEN, TOKEN_ALREADY_USED, ALREADY_VERIFIED)
- [x] Add Swagger/OpenAPI documentation for all endpoints
- [x] Create `email-verification.validators.ts` with Zod schemas

**Error Codes:**
| Code | Description |
|------|-------------|
| `TOKEN_EXPIRED` | Verification link has expired (24h TTL) |
| `INVALID_TOKEN` | Invalid verification link or JWT |
| `TOKEN_ALREADY_USED` | Token was already consumed |
| `RATE_LIMITED` | Too many resend requests (max 5/hour) |

**Security Features:**
- Email enumeration prevention (resend always returns success)
- Development mode token exposure for testing (`_dev` field)
- Privacy-safe logging with masked emails
- Proper cache invalidation on verification

**Files Created/Modified:**
- `apps/auth-service/src/controllers/email-verification.controller.ts` (New - 300+ lines)
- `apps/auth-service/src/validators/email-verification.validators.ts` (New)
- `apps/auth-service/src/routes/auth.ts` (Added 3 routes)

---

### Priority 1.3: Login Flow Modification ✅ COMPLETED

**Status:** ✅ Completed 2026-01-20
**File:** `apps/auth-service/src/services/auth.service.ts`

**Changes to `login()` function:**

```typescript
// After credential validation, before MFA check:
if (!user.emailVerified) {
  throw new ApiError(
    403,
    'EMAIL_NOT_VERIFIED',
    'Please verify your email address before logging in. Check your inbox for the verification link.',
    { canResend: true, email: maskEmailForLog(user.email) }
  );
}
```

**Completed Tasks:**
- [x] Add `emailVerified` check in login flow (after password validation, before MFA)
- [x] Return appropriate error code (`EMAIL_NOT_VERIFIED`) and message
- [x] Include `canResend: true` flag in error response
- [x] Include masked email for privacy (`j*****e@example.com`)
- [x] Add comprehensive Swagger documentation for `/auth/login` endpoint
- [x] Add unit test for unverified user login rejection

**Error Response (403 Forbidden):**
```json
{
  "success": false,
  "error": {
    "code": "EMAIL_NOT_VERIFIED",
    "message": "Please verify your email address before logging in.",
    "data": {
      "canResend": true,
      "email": "j*****e@example.com"
    }
  }
}
```

**Files Modified:**
- `apps/auth-service/src/services/auth.service.ts` (Added check + helper function)
- `apps/auth-service/src/controllers/auth.controller.ts` (Added Swagger docs)
- `apps/auth-service/src/services/auth.service.spec.ts` (Added unit test)

---

### Priority 1.4: Resend Verification Endpoint ✅ COMPLETED (in 1.2)

**Status:** ✅ Completed 2026-01-20 (implemented as part of Priority 1.2)
**File:** `apps/auth-service/src/controllers/email-verification.controller.ts`

**Endpoint:** `POST /auth/resend-verification`

**Completed Tasks:**
- [x] Add POST `/auth/resend-verification` endpoint
- [x] Implement rate limiting (5 per hour per user via token generation)
- [x] Generate new verification token (invalidates previous)
- [x] Email enumeration prevention (always returns success)
- [ ] Publish new verification event (Phase 2)

**Security Features:**
- Always returns success to prevent email enumeration
- Rate limited via `generateVerificationToken()` (max 5/hour)
- Masked email in development response
- Privacy-safe logging

---

### Priority 1.5: Registration Flow Modification ✅ COMPLETED

**Status:** ✅ Completed 2026-01-20
**File:** `apps/auth-service/src/services/auth.service.ts`

**New Registration Response:**

```typescript
interface RegistrationResponse {
  success: true;
  message: string;
  emailVerificationRequired: true;
  email: string;
  // Development mode only:
  _dev?: {
    verificationToken: string;
    userId: string;
    expiresAt: string;
    verifyUrl: string;
  };
}
```

**Completed Tasks:**
- [x] Modify `register()` to not return auth tokens
- [x] Generate verification token on registration automatically
- [x] Store token in Redis (via `generateVerificationToken`)
- [x] Return verification required response
- [x] Include token in `_dev` field for development mode only
- [x] Add comprehensive Swagger documentation for `/auth/register`
- [x] Update unit tests for new registration flow

**Testing Flow:**
1. `POST /auth/register` → Returns `{ emailVerificationRequired: true, _dev: { verificationToken } }`
2. `POST /auth/verify-email` with `{ token }` → Returns `{ success: true }`
3. `POST /auth/login` → Returns auth tokens

**Files Modified:**
- `apps/auth-service/src/services/auth.service.ts` (New `RegistrationResponse` type, modified `register()`)
- `apps/auth-service/src/controllers/auth.controller.ts` (New Swagger docs, updated response format)
- `apps/auth-service/src/services/auth.service.spec.ts` (Updated tests)
- `apps/auth-service/src/controllers/auth.controller.spec.ts` (Updated tests)

---

## Phase 2: Event-Driven Email Integration

### Priority 2.1: Publish Email Verification Events

**File:** `apps/auth-service/src/events/publisher.ts`

**New Event:**

```typescript
interface EmailVerificationRequestedPayload {
  userId: string;
  email: string;
  name: string;
  verificationToken: string;
  verificationUrl: string;
  expiresAt: string;
  requestedAt: string;
}

// Exchange: email.events
// Routing key: email.verification.requested
```

**Tasks:**
- [ ] Define `EmailVerificationRequestedPayload` interface
- [ ] Add `publishEmailVerificationRequested()` function
- [ ] Call on registration
- [ ] Call on resend verification
- [ ] Add to RabbitMQ exchange topology documentation

**Files to Modify:**
- `apps/auth-service/src/events/publisher.ts`
- `libs/shared-types/src/lib/events.ts` (Add event type)

---

### Priority 2.2: Email Service Subscriber (Future Phase)

**Note:** This is optional for Phase 1. The system works without it (verification token returned in API response for development).

**Future Implementation:**
- Create `apps/email-service/` microservice
- Subscribe to `email.verification.requested` events
- Integrate with SendGrid/AWS SES/SMTP
- Send templated verification emails

---

### Priority 2.3: Email Templates (Future Phase)

**Template Variables:**
```html
{{userName}} - User's name
{{verificationUrl}} - Full verification URL
{{expiresIn}} - Human-readable expiry (e.g., "24 hours")
{{supportEmail}} - Support contact
```

---

## Phase 3: Frontend Integration

### Priority 3.1: Post-Registration Verification UI ✅ COMPLETED

**Status:** ✅ Completed 2026-01-20

**Files Modified/Created:**
- `libs/shared-auth-store/src/lib/shared-auth-store.ts` - Added `emailVerificationPending` state
- `libs/shared-auth-store/src/index.ts` - Exported `EmailVerificationPendingState` type
- `apps/auth-mfe/src/components/VerificationPending.tsx` (NEW)
- `apps/auth-mfe/src/components/SignUp.tsx` - Shows `VerificationPending` after registration

**Changes Made:**

1. **Updated Auth Store:**
   - Added `EmailVerificationPendingState` interface
   - Added `emailVerificationPending` state to store
   - Added `clearEmailVerificationPending()` action
   - Modified `signup()` to handle new `RegistrationResponse` format
   - Emits `auth:signup` event (not `auth:login`) when verification required

2. **Created `VerificationPending` Component:**
   - Shows email verification instructions
   - Displays masked email for privacy
   - Resend button with 60-second cooldown timer
   - DEV MODE panel showing verification token/URL for testing
   - "Go to Sign In" and "Use different email" navigation options

3. **Updated `SignUp` Component:**
   - Renders `VerificationPending` when `emailVerificationPending` is set
   - Removed profile update logic (deferred until after email verification)
   - Cleaned up unused state and imports

**Completed Tasks:**
- [x] Create `VerificationPending` component
- [x] Update SignUp to show verification pending state
- [x] Add resend functionality with API call to `/auth/resend-verification`
- [x] Add countdown timer for resend cooldown (60 seconds)

**Testing Flow:**
1. Fill out SignUp form and submit
2. `VerificationPending` component is displayed
3. DEV MODE panel shows verification token and URL
4. Click "Resend Verification Email" - shows success, starts 60s cooldown
5. Click "Go to Sign In" - navigates to login page
6. Click "Use a different email address" - returns to SignUp form

---

### Priority 3.2: Email Verification Page ✅ COMPLETED

**Status:** ✅ Completed 2026-01-21

**Files Created/Modified:**
- `apps/auth-mfe/src/components/VerifyEmail.tsx` (NEW)
- `apps/auth-mfe/rspack.config.js` (Exposed component)
- `apps/shell/src/pages/VerifyEmailPage.tsx` (NEW)
- `apps/shell/src/remotes/index.tsx` (Added VerifyEmailRemote)
- `apps/shell/src/routes/AppRoutes.tsx` (Added `/verify-email` route)
- `apps/shell/src/app/app.tsx` (Added VerifyEmailComponent prop)
- `apps/shell/src/bootstrap.tsx` (Pass VerifyEmailRemote)
- `apps/shell/src/types/remotes.d.ts` (Type declaration)

**Purpose:** Handle verification link clicks from email

**States Implemented:**
1. **Verifying** - Shows spinner while verifying token via API
2. **Success** - Email verified, shows success message + Sign In button
3. **Error** - Token expired/invalid, shows error + resend option with email input
4. **Already Verified** - Email already verified, shows message + Sign In button
5. **Resend** - Form to request new verification link (when no token provided)

**Completed Tasks:**
- [x] Create `VerifyEmail` component with all states
- [x] Handle token from URL parameter (`?token=xxx`)
- [x] Call verification API (`POST /auth/verify-email`)
- [x] Show appropriate UI state based on API response
- [x] Resend functionality with email input
- [x] Expose via Module Federation in `rspack.config.js`
- [x] Add route in shell app (`/verify-email`)
- [x] Create `VerifyEmailPage` wrapper with error boundary
- [x] Add TypeScript type declarations for remote module

**Route:** `/verify-email?token=xxx`

**Testing Flow:**
1. Register new user → Get verification token from DEV panel
2. Navigate to `/verify-email?token=<token>` or use DEV URL
3. Component automatically verifies token
4. On success: Shows "Email Verified!" with Sign In button
5. On error: Shows error message with resend option

---

### Priority 3.3: Resend Verification UI

**Integrated into:**
- `VerificationPending` component (after registration)
- `VerifyEmail` component (when token expired)
- Login error handling (when unverified user tries to login)

**Features:**
- Rate limit feedback (show cooldown timer)
- Success/error toast notifications
- Prevent spam clicking

---

### Priority 3.4: Login Error Handling for Unverified Users

**File:** `apps/auth-mfe/src/components/SignIn.tsx`

**Changes:**
- Detect `EMAIL_NOT_VERIFIED` error code
- Show friendly message with resend option
- Don't show generic "invalid credentials" error

**Tasks:**
- [ ] Add specific handling for EMAIL_NOT_VERIFIED error
- [ ] Show verification pending UI with resend option
- [ ] Integrate with resend verification API

**Files to Modify:**
- `apps/auth-mfe/src/components/SignIn.tsx`
- `libs/shared-auth-store/src/lib/auth-store.ts` (Handle new error type)

---

## Configuration

### Environment Variables

**Auth Service (`apps/auth-service/.env`):**

```env
# Email Verification Configuration
EMAIL_VERIFICATION_TOKEN_EXPIRY=24h
EMAIL_VERIFICATION_RESEND_COOLDOWN=300  # 5 minutes in seconds
EMAIL_VERIFICATION_MAX_RESENDS_PER_HOUR=3
EMAIL_VERIFICATION_BASE_URL=https://localhost/verify-email

# Development mode (returns token in API response)
EMAIL_VERIFICATION_DEV_MODE=true
```

### Redis Key Structure

```
# Verification token storage
email_verification:{userId}
  - token: string (JWT)
  - createdAt: timestamp
  - attempts: number
  - TTL: 24 hours

# Resend rate limiting
email_verification_resend:{email}
  - count: number
  - TTL: 1 hour

email_verification_resend:{ip}
  - count: number
  - TTL: 1 hour
```

---

## Security Considerations

### Token Security

1. **JWT Verification Tokens:**
   - Signed with application secret
   - Contains: userId, email, purpose, expiry
   - Short-lived (24 hours)
   - Single-use (deleted after verification)

2. **Rate Limiting:**
   - Registration: Standard API rate limits apply
   - Resend: 3 per hour per email, 10 per hour per IP
   - Verification attempts: 5 per token

3. **Email Enumeration Prevention:**
   - Resend always returns success
   - Login error doesn't confirm email exists
   - Timing attacks mitigated with constant-time responses

### Error Messages

| Scenario | Public Message | Internal Log |
|----------|---------------|--------------|
| Token expired | "Verification link has expired. Please request a new one." | Token expired for userId: xxx |
| Token invalid | "Invalid verification link. Please request a new one." | Invalid token signature |
| Token already used | "This link has already been used." | Token already consumed |
| User already verified | "Your email is already verified. Please log in." | Verification attempt for verified user |
| Rate limited | "Please wait before requesting another verification email." | Rate limit exceeded for email/IP |

---

## Testing Strategy

### Unit Tests

**Files to Create:**
- `apps/auth-service/src/services/email-verification.service.spec.ts`
- `apps/auth-service/src/controllers/email-verification.controller.spec.ts`
- `apps/auth-mfe/src/components/VerifyEmail.spec.tsx`
- `apps/auth-mfe/src/components/VerificationPending.spec.tsx`

**Test Cases:**
- [ ] Token generation with correct payload
- [ ] Token validation (valid, expired, invalid signature)
- [ ] Single-use enforcement
- [ ] Rate limiting enforcement
- [ ] Login blocked for unverified users
- [ ] Login allowed for verified users
- [ ] Registration returns verification required response
- [ ] Resend generates new token and invalidates old

### Integration Tests

**Test Cases:**
- [ ] Full registration → verification → login flow
- [ ] Resend flow with rate limiting
- [ ] Expired token handling
- [ ] Multiple device verification attempts

### E2E Tests

**File:** `apps/shell-e2e/src/email-verification.spec.ts` (New)

**Test Cases:**
- [ ] User registers and sees verification pending
- [ ] User clicks verification link and succeeds
- [ ] User tries to login before verification (blocked)
- [ ] User requests resend and cooldown works
- [ ] User verifies and can login

---

## Rollout Plan

### Phase 1: Development (Week 1)
- Implement backend infrastructure
- Manual testing with verification token in response
- No email service required

### Phase 2: Frontend Integration (Week 2)
- Implement frontend components
- End-to-end flow testing
- Update documentation

### Phase 3: Email Service (Future)
- Create email microservice
- Integrate with email provider
- Production email templates

### Migration Considerations

**Existing Users:**
- All existing users have `emailVerified = false` (database default)
- Options:
  1. **Auto-verify existing users:** Run migration to set `emailVerified = true` for all existing users
  2. **Require verification:** Force existing users to verify on next login
  3. **Gradual rollout:** Feature flag to enable/disable verification check

**Recommended:** Option 1 (Auto-verify existing users) to avoid disruption.

---

## Success Metrics

| Metric | Target | Measurement |
|--------|--------|-------------|
| Verification completion rate | >90% | Users who verify within 24h |
| Average time to verify | <10 min | From registration to verification |
| Resend requests | <20% | Users needing resend |
| Support tickets | <5% | Verification-related issues |
| False positive blocks | 0% | Verified users blocked incorrectly |

---

## Dependencies

### Required
- ✅ Auth service with user management
- ✅ Redis for token storage
- ✅ RabbitMQ for event publishing
- ✅ JWT infrastructure

### Optional (Future)
- Email service microservice
- SendGrid/AWS SES account
- Email domain verification

---

## References

- [OWASP Email Verification Best Practices](https://cheatsheetseries.owasp.org/cheatsheets/Forgot_Password_Cheat_Sheet.html)
- [JWT Best Practices](https://auth0.com/blog/a-look-at-the-latest-draft-for-jwt-bcp/)
- Existing MFA implementation in auth-service (similar token flow pattern)

---

## Appendix A: API Response Examples

### Registration Response (New)

```json
// POST /auth/register
// Status: 201 Created
{
  "success": true,
  "message": "Registration successful. Please check your email to verify your account.",
  "data": {
    "emailVerificationRequired": true,
    "email": "user@example.com"
  }
}

// Development mode only (EMAIL_VERIFICATION_DEV_MODE=true)
{
  "success": true,
  "message": "Registration successful. Please check your email to verify your account.",
  "data": {
    "emailVerificationRequired": true,
    "email": "user@example.com",
    "verificationToken": "eyJhbGciOiJIUzI1NiIs..."  // Only in dev mode
  }
}
```

### Verification Response

```json
// POST /auth/verify-email
// Status: 200 OK
{
  "success": true,
  "message": "Email verified successfully. You can now log in."
}

// Status: 400 Bad Request (expired)
{
  "success": false,
  "error": "TOKEN_EXPIRED",
  "message": "Verification link has expired. Please request a new one."
}

// Status: 400 Bad Request (invalid)
{
  "success": false,
  "error": "INVALID_TOKEN",
  "message": "Invalid verification link. Please request a new one."
}
```

### Login Response (Unverified User)

```json
// POST /auth/login
// Status: 403 Forbidden
{
  "success": false,
  "error": "EMAIL_NOT_VERIFIED",
  "message": "Please verify your email address before logging in.",
  "data": {
    "canResend": true,
    "email": "u***@example.com"  // Partially masked
  }
}
```

### Resend Response

```json
// POST /auth/resend-verification
// Status: 200 OK (always, for security)
{
  "success": true,
  "message": "If an account exists with this email, a verification link has been sent."
}

// Status: 429 Too Many Requests
{
  "success": false,
  "error": "RATE_LIMITED",
  "message": "Please wait before requesting another verification email.",
  "data": {
    "retryAfter": 300  // seconds
  }
}
```

---

## Appendix B: Event Payloads

### email.verification.requested

```json
{
  "eventType": "email.verification.requested",
  "timestamp": "2026-01-20T12:00:00.000Z",
  "payload": {
    "userId": "550e8400-e29b-41d4-a716-446655440000",
    "email": "user@example.com",
    "name": "John Doe",
    "verificationToken": "eyJhbGciOiJIUzI1NiIs...",
    "verificationUrl": "https://localhost/verify-email?token=eyJhbGciOiJIUzI1NiIs...",
    "expiresAt": "2026-01-21T12:00:00.000Z",
    "requestedAt": "2026-01-20T12:00:00.000Z"
  },
  "metadata": {
    "correlationId": "req-123",
    "source": "auth-service"
  }
}
```

### user.email.verified

```json
{
  "eventType": "user.email.verified",
  "timestamp": "2026-01-20T12:05:00.000Z",
  "payload": {
    "userId": "550e8400-e29b-41d4-a716-446655440000",
    "email": "user@example.com",
    "verifiedAt": "2026-01-20T12:05:00.000Z"
  },
  "metadata": {
    "correlationId": "req-456",
    "source": "auth-service"
  }
}
```
