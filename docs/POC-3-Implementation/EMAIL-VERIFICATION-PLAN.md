# Email Verification Implementation Plan - POC-3

**Created:** January 20, 2026
**Last Updated:** January 20, 2026
**Status:** 📋 **Planning Complete** - Ready for Implementation
**Priority:** Medium-High

---

## 📊 Implementation Progress

### Phase 1: Backend Infrastructure ⏳ PENDING
- ⏳ **Priority 1.1:** Verification Token Generation & Storage
- ⏳ **Priority 1.2:** Email Verification Endpoints
- ⏳ **Priority 1.3:** Login Flow Modification (Block Unverified Users)
- ⏳ **Priority 1.4:** Resend Verification Endpoint

### Phase 2: Event-Driven Email Integration ⏳ PENDING
- ⏳ **Priority 2.1:** Publish Email Verification Events
- ⏳ **Priority 2.2:** Email Service Subscriber (Optional - Future)
- ⏳ **Priority 2.3:** Email Templates (Optional - Future)

### Phase 3: Frontend Integration ⏳ PENDING
- ⏳ **Priority 3.1:** Post-Registration Verification UI
- ⏳ **Priority 3.2:** Email Verification Page
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

### Priority 1.1: Verification Token Generation & Storage

**File:** `apps/auth-service/src/services/email-verification.service.ts` (New)

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
// Value: { token, createdAt, attempts }
// TTL: 24 hours
```

**Tasks:**
- [ ] Create `email-verification.service.ts` with token generation
- [ ] Add Redis storage for verification tokens (24h TTL)
- [ ] Add token validation logic
- [ ] Add single-use token enforcement (delete after use)
- [ ] Add rate limiting for token generation (max 5 per hour)

**Files to Create/Modify:**
- `apps/auth-service/src/services/email-verification.service.ts` (New)
- `apps/auth-service/src/lib/cache.ts` (Add verification token methods)

---

### Priority 1.2: Email Verification Endpoints

**File:** `apps/auth-service/src/controllers/email-verification.controller.ts` (New)

**Endpoints:**

```typescript
// POST /auth/verify-email
// Body: { token: string }
// Response: { success: true, message: "Email verified successfully" }

// GET /auth/verify-email/:token
// Query params: ?redirect=true (optional)
// Response: Redirect to frontend or JSON response
```

**Tasks:**
- [ ] Create `email-verification.controller.ts`
- [ ] Add POST `/auth/verify-email` endpoint
- [ ] Add GET `/auth/verify-email/:token` endpoint (for clickable links)
- [ ] Add proper error responses (expired, invalid, already verified)
- [ ] Add Swagger/OpenAPI documentation

**Files to Create/Modify:**
- `apps/auth-service/src/controllers/email-verification.controller.ts` (New)
- `apps/auth-service/src/routes/auth.ts` (Add routes)
- `apps/auth-service/src/validators/email-verification.validators.ts` (New)

---

### Priority 1.3: Login Flow Modification

**File:** `apps/auth-service/src/services/auth.service.ts`

**Changes to `login()` function:**

```typescript
// After credential validation, before token generation:
if (!user.emailVerified) {
  throw new ApiError(
    403,
    'EMAIL_NOT_VERIFIED',
    'Please verify your email address before logging in. Check your inbox for the verification link.',
    { canResend: true, email: user.email }
  );
}
```

**Tasks:**
- [ ] Add `emailVerified` check in login flow
- [ ] Return appropriate error code and message
- [ ] Include `canResend` flag in error response
- [ ] Update Swagger documentation

**Files to Modify:**
- `apps/auth-service/src/services/auth.service.ts`

---

### Priority 1.4: Resend Verification Endpoint

**File:** `apps/auth-service/src/controllers/email-verification.controller.ts`

**Endpoint:**

```typescript
// POST /auth/resend-verification
// Body: { email: string }
// Rate limited: 3 requests per hour per email
// Response: { success: true, message: "If account exists, verification email sent" }
```

**Security Considerations:**
- Always return success (prevent email enumeration)
- Rate limit by email AND IP
- Don't reveal if email exists in system

**Tasks:**
- [ ] Add POST `/auth/resend-verification` endpoint
- [ ] Implement rate limiting (3 per hour per email)
- [ ] Generate new verification token
- [ ] Invalidate old token
- [ ] Publish new verification event

**Files to Modify:**
- `apps/auth-service/src/controllers/email-verification.controller.ts`
- `apps/auth-service/src/routes/auth.ts`

---

### Priority 1.5: Registration Flow Modification

**File:** `apps/auth-service/src/services/auth.service.ts`

**Changes to `register()` function:**

```typescript
// Current: Returns auth tokens immediately
// New: Returns verification required response

interface RegistrationResponse {
  success: true;
  message: string;
  emailVerificationRequired: true;
  // Only in development mode:
  verificationToken?: string;
}
```

**Tasks:**
- [ ] Modify `register()` to not return auth tokens
- [ ] Generate verification token on registration
- [ ] Store token in Redis
- [ ] Return verification required response
- [ ] Include token in response for development mode only

**Files to Modify:**
- `apps/auth-service/src/services/auth.service.ts`
- `apps/auth-service/src/controllers/auth.controller.ts`

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

### Priority 3.1: Post-Registration Verification UI

**File:** `apps/auth-mfe/src/components/SignUp.tsx`

**Changes:**
- After successful registration, show verification message
- Display "Check your email" UI instead of redirecting to dashboard
- Provide "Resend verification" button

**New Component:** `apps/auth-mfe/src/components/VerificationPending.tsx`

```typescript
interface VerificationPendingProps {
  email: string;
  onResendClick: () => void;
  onBackToLogin: () => void;
}
```

**Tasks:**
- [ ] Create `VerificationPending` component
- [ ] Update SignUp to show verification pending state
- [ ] Add resend functionality
- [ ] Add countdown timer for resend cooldown

**Files to Create/Modify:**
- `apps/auth-mfe/src/components/VerificationPending.tsx` (New)
- `apps/auth-mfe/src/components/SignUp.tsx`

---

### Priority 3.2: Email Verification Page

**File:** `apps/auth-mfe/src/components/VerifyEmail.tsx` (New)

**Purpose:** Handle verification link clicks from email

**States:**
1. **Verifying** - Showing spinner while verifying token
2. **Success** - Email verified, show success message + login button
3. **Error** - Token expired/invalid, show error + resend option
4. **Already Verified** - Email already verified, redirect to login

**Tasks:**
- [ ] Create `VerifyEmail` component
- [ ] Handle token from URL parameter
- [ ] Call verification API
- [ ] Show appropriate state
- [ ] Expose via Module Federation
- [ ] Add route in shell app

**Files to Create/Modify:**
- `apps/auth-mfe/src/components/VerifyEmail.tsx` (New)
- `apps/auth-mfe/rspack.config.js` (Expose component)
- `apps/shell/src/routes/AppRoutes.tsx` (Add route)

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
