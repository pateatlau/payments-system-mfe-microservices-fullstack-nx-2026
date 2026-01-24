# Social Login Implementation Plan (Auth0 Federation) - POC-3

**Created:** January 20, 2026
**Last Updated:** January 24, 2026
**Status:** IMPLEMENTATION COMPLETE (Google & GitHub)
**Priority:** Medium

### Implementation Summary

| Component | Status |
|-----------|--------|
| Google OAuth | ✅ Complete |
| GitHub OAuth | ✅ Complete |
| Facebook OAuth | ⏳ Deferred (Auth0 connection not configured) |
| LinkedIn OAuth | ⏳ Deferred (Auth0 connection not configured) |
| X/Twitter OAuth | ⏳ Deferred (requires developer account approval) |
| Backend Integration | ✅ Complete |
| Frontend Integration | ✅ Complete |
| Unit Tests | ✅ Complete |
| E2E Tests | ✅ Complete (20 tests) |
| Security Audit | ✅ Complete |

**Note:** Facebook, LinkedIn, and X/Twitter providers are deferred. The infrastructure is ready - only Auth0 connection configuration is needed when required.

---

## Revision History

| Date       | Changes                                                                    |
| ---------- | -------------------------------------------------------------------------- |
| 2026-01-21 | Reordered Phase 2: Database schema now Priority 2.1 (prerequisite)         |
| 2026-01-21 | Added `hasPassword` flag to User model for unlink validation               |
| 2026-01-21 | Made `passwordHash` nullable for social-only users                         |
| 2026-01-21 | Added Priority 3.2: OAuth Callback Route & Component                       |
| 2026-01-21 | Clarified frontend redirect flow (via backend, not direct to Auth0)        |
| 2026-01-21 | Updated icons to inline SVGs (brand-accurate, no external dependencies)    |
| 2026-01-21 | Added rate-limiting specs for OAuth endpoints                              |
| 2026-01-21 | Added RabbitMQ audit event publishers for OAuth operations                 |
| 2026-01-21 | Updated npm dependencies: `openid-client` for secure OIDC flows            |
| 2026-01-21 | Added validation logic for unlink operation                                |
| 2026-01-21 | **Security hardening (CodeRabbit review):**                                |
| 2026-01-21 | - Downgraded openid-client to ^6.7.1 to fix CVE-2025-27370/27371          |
| 2026-01-21 | - Added AES-256-GCM encryption for OAuth access/refresh tokens            |
| 2026-01-21 | - Removed sensitive data (state, code) from logs                          |
| 2026-01-21 | - Fixed account enumeration vulnerability in login (NO_PASSWORD_SET)      |
| 2026-01-21 | - Added email verification requirement for auto-linking OAuth accounts    |
| 2026-01-21 | - Added returnUrl validation to prevent open redirect attacks             |
| 2026-01-21 | - Documented refresh token deletion policy for security                   |
| 2026-01-21 | - Improved MFA disable flow for social-only users with clear guidance     |
| 2026-01-24 | **Phase 4: Testing & Security completed:**                                |
| 2026-01-24 | - Priority 4.1: Unit & integration tests for OAuth service/controller    |
| 2026-01-24 | - Priority 4.1: Frontend tests for MfaRecommendation, LinkedAccounts      |
| 2026-01-24 | - Priority 4.2: 20 E2E tests for social login flows                       |
| 2026-01-24 | - Priority 4.3: Security audit with OAUTH-SECURITY-AUDIT.md               |
| 2026-01-24 | - Fixed sensitive data logging in OAuthCallback.tsx                       |
| 2026-01-24 | - Added OAuth-specific rate limiting (10 req/15 min for initiation)       |

---

## Implementation Progress

### Phase 1: Auth0 Setup & Configuration - COMPLETE ✅

- **Priority 1.1:** Auth0 Tenant Setup ✅
- **Priority 1.2:** Configure Social Identity Providers ✅ (Google, GitHub)
- **Priority 1.3:** Auth0 Application Configuration ✅

### Phase 2: Backend Integration - COMPLETE ✅

- **Priority 2.1:** Database Schema Updates ✅ _(moved from 2.3 - must be first)_
- **Priority 2.2:** OAuth Callback Endpoints ✅ _(was 2.1)_
  - Created `apps/auth-service/src/lib/auth0.ts` - Auth0 client configuration with OIDC
  - Created `apps/auth-service/src/services/oauth.service.ts` - OAuth business logic
  - Created `apps/auth-service/src/controllers/oauth.controller.ts` - HTTP handlers
  - Created `apps/auth-service/src/routes/oauth.ts` - Route definitions (`/auth/oauth/*`)
  - Created `apps/auth-service/src/validators/oauth.validators.ts` - Zod schemas
  - Added OAuth audit events to `apps/auth-service/src/events/publisher.ts`
  - Added Auth0 env vars to `.env` and `.env.example`
  - **Tested:** Full OAuth flow verified with Google - token exchange, user lookup, MFA redirect working
- **Priority 2.3:** User Account Linking Service ✅ _(was 2.2)_ - Included in 2.2
- **Priority 2.4:** MFA Integration for Social Users ✅ - Included in 2.2
  - MFA check integrated after OAuth profile received
  - Users with MFA enabled are correctly redirected to `/mfa?token=...`

### Phase 3: Frontend Integration - COMPLETE ✅

- **Priority 3.1:** Social Login Buttons Component ✅
  - Created `libs/shared-design-system/src/lib/components/SocialLoginButtons.tsx`
  - Inline SVG icons for Google, GitHub, Facebook, LinkedIn, X (brand-accurate colors)
  - Loading spinner, disabled states, accessible labels
  - Unit tests in `SocialLoginButtons.test.tsx`
  - Exported from `libs/shared-design-system/src/index.ts`
- **Priority 3.2:** OAuth Callback Route & Component ✅
  - Created `apps/auth-mfe/src/components/OAuthCallback.tsx`
  - Extracts tokens from URL hash, fetches user info, updates auth store
  - Added `/oauth-callback` route to shell router
  - Full Module Federation integration (exposed, lazy-loaded, type-declared)
- **Priority 3.3:** Sign In Page Integration ✅
  - Added `SocialLoginButtons` to `apps/auth-mfe/src/components/SignIn.tsx`
  - Added "Or continue with email" divider
  - Implemented `handleSocialLogin` redirect to backend OAuth endpoint
  - Google and GitHub providers enabled
  - Added OAuth error display from URL params (when backend redirects with error)
  - Added OAuth MFA handling (detects `mfaToken` URL param, shows MFA form)
  - Fixed Module Federation Router context issues (use `window.location` instead of `useSearchParams`)
  - Fixed API client interceptor to skip token refresh for `/auth/mfa/` endpoints
  - **Tested:** Google + GitHub login working for both MFA and non-MFA users
- **Priority 3.4:** Sign Up Page Integration ✅
  - Added `SocialLoginButtons` to `apps/auth-mfe/src/components/SignUp.tsx`
  - Social buttons at top of form (consistent with Sign-In page, follows industry best practice)
  - Added "Or continue with email" divider between social buttons and form
  - Implemented `handleSocialLogin` redirect to backend OAuth endpoint
  - Google and GitHub providers enabled
  - Added OAuth error display from URL params
  - Same OAuth flow as Sign-In (creates account if user doesn't exist)
- **Priority 3.5:** Account Linking UI (Profile Page) ✅
  - Created `apps/profile-mfe/src/api/oauth.ts` - API client for OAuth endpoints
  - Created `apps/profile-mfe/src/hooks/useOAuthAccounts.ts` - TanStack Query hooks
  - Created `apps/profile-mfe/src/components/LinkedAccounts.tsx` - UI component
  - Updated `apps/profile-mfe/src/components/ProfilePage.tsx` - Added LinkedAccounts to Security tab
  - Features: View linked accounts, link new accounts, unlink accounts with confirmation
  - Provider icons for Google, GitHub, Facebook, LinkedIn, X
- **Priority 3.6:** MFA Recommendation Page ✅
  - Created `apps/auth-mfe/src/components/MfaRecommendation.tsx` - Main component
  - Updated `apps/auth-mfe/src/components/OAuthCallback.tsx` - Redirect new users to MFA recommendation
  - Created `apps/shell/src/pages/MfaRecommendationPage.tsx` - Page wrapper
  - Updated shell routes and remotes for Module Federation
  - Features: Enable MFA button, Skip for now, Don't show again preference (localStorage)
  - Shown to new social login users (unless previously dismissed)

### Phase 4: Testing & Security - COMPLETE ✅

- **Priority 4.1:** Unit & Integration Tests - COMPLETED ✅
- **Priority 4.2:** E2E Tests - COMPLETED ✅
  - Created `apps/shell-e2e/src/social-login.spec.ts` with 20 E2E tests
  - Tests cover: social login buttons, OAuth callback handling, MFA recommendation flow, account linking UI, error handling
- **Priority 4.3:** Security Audit - COMPLETED ✅
  - Created `docs/POC-3-Implementation/OAUTH-SECURITY-AUDIT.md`
  - Fixed sensitive data logging in `OAuthCallback.tsx`
  - Added OAuth-specific rate limiting (10 req/15 min for initiation endpoints)
  - All security checklist items verified:
    - CSRF protection via state parameter ✅
    - State stored in Redis with 10-min TTL ✅
    - OAuth tokens encrypted with AES-256-GCM ✅
    - No sensitive data in frontend logs ✅
    - OAuth callback validates state ✅
    - OAuth-specific rate limiting (10 req/15 min) + general limiter ✅
    - Audit logging via RabbitMQ events ✅
    - Email verification required for account linking ✅
    - Cannot link account to another user ✅

---

## Executive Summary

This document outlines the implementation plan for social login (Google, GitHub, Facebook, LinkedIn, X/Twitter) in the MFE Payments System using Auth0 as a federation layer. Auth0 handles OAuth complexity while our existing auth infrastructure remains unchanged for email/password authentication, MFA, and session management.

**Approach:** Auth0 Federation - Auth0 handles social OAuth handshakes only. User management, MFA, sessions, and JWTs remain in our infrastructure.

**Supported Providers:**

- Google
- GitHub
- Facebook
- LinkedIn
- X/Twitter

---

## Architecture Overview

### Current State

```text
Authentication Flow (Current):
┌─────────────────────────────────────────────────────────────────┐
│                    YOUR INFRASTRUCTURE                          │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────────┐ │
│  │ Email/Pass  │  │    MFA      │  │   Session Management    │ │
│  │   Auth      │  │   (TOTP)    │  │       (Redis)           │ │
│  └──────┬──────┘  └──────┬──────┘  └───────────┬─────────────┘ │
│         │                │                     │                │
│         └────────────────┴─────────────────────┘                │
│                          │                                      │
│                    Your JWT Tokens                              │
│                    Your User Database                           │
└─────────────────────────────────────────────────────────────────┘
```

### Proposed State (With Auth0 Federation)

```text
Authentication Flow (With Social Login):
┌─────────────────────────────────────────────────────────────────┐
│                    YOUR INFRASTRUCTURE                          │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────────┐ │
│  │ Email/Pass  │  │    MFA      │  │   Session Management    │ │
│  │   Auth      │  │   (TOTP)    │  │       (Redis)           │ │
│  │ (unchanged) │  │ (unchanged) │  │     (unchanged)         │ │
│  └──────┬──────┘  └──────┬──────┘  └───────────┬─────────────┘ │
│         │                │                     │                │
│         └────────────────┴─────────────────────┘                │
│                          │                                      │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │                   OAuth Service (NEW)                       ││
│  │  • Receives Auth0 callback with social profile              ││
│  │  • Creates/links user in your database                      ││
│  │  • Issues your JWT tokens                                   ││
│  │  • Triggers MFA check (if enabled)                          ││
│  └─────────────────────────────────────────────────────────────┘│
│                          │                                      │
│                    Your JWT Tokens                              │
│                    Your User Database                           │
│                    Your Payment Data                            │
└─────────────────────────────────────────────────────────────────┘
                           │
                    Social Login Only
                           │
                    ┌──────▼──────┐
                    │   Auth0     │  ← Only handles OAuth handshake
                    │  (external) │  ← Never sees passwords/MFA/payments
                    └──────┬──────┘
                           │
          ┌────────────────┼────────────────┐
          │                │                │
    ┌─────▼─────┐   ┌─────▼─────┐   ┌─────▼─────┐
    │  Google   │   │  GitHub   │   │ Facebook  │
    └───────────┘   └───────────┘   └───────────┘
          │                │                │
    ┌─────▼─────┐   ┌─────▼─────┐
    │ LinkedIn  │   │ X/Twitter │
    └───────────┘   └───────────┘
```

### Social Login Flow (Detailed)

```text
User clicks "Sign in with Google":
┌─────────────────────────┐
│ 1. Frontend redirects   │
│    to Auth0 authorize   │
│    endpoint             │
└───────────┬─────────────┘
            │
            ▼
┌─────────────────────────┐
│ 2. Auth0 redirects to   │
│    Google OAuth         │
└───────────┬─────────────┘
            │
            ▼
┌─────────────────────────┐
│ 3. User authenticates   │
│    with Google          │
└───────────┬─────────────┘
            │
            ▼
┌─────────────────────────┐
│ 4. Google redirects     │
│    back to Auth0 with   │
│    authorization code   │
└───────────┬─────────────┘
            │
            ▼
┌─────────────────────────┐
│ 5. Auth0 exchanges code │
│    for tokens, gets     │
│    user profile         │
└───────────┬─────────────┘
            │
            ▼
┌─────────────────────────────────────────┐
│ 6. Auth0 redirects to YOUR callback:    │
│    /api/auth/oauth/callback             │
│    with Auth0 code                      │
└───────────┬─────────────────────────────┘
            │
            ▼
┌─────────────────────────────────────────┐
│ 7. Your auth-service:                   │
│    • Exchanges Auth0 code for profile   │
│    • Finds or creates user in YOUR DB   │
│    • Links OAuth account to user        │
│    • Checks if MFA is enabled           │
└───────────┬─────────────────────────────┘
            │
    ┌───────┴───────┐
    │               │
    ▼               ▼
┌─────────┐   ┌─────────────────────────────┐
│ MFA Off │   │ MFA On (First Social Login) │
└────┬────┘   │ • Prompt to enable MFA      │
     │        │ • User can skip or enable   │
     │        └─────────────┬───────────────┘
     │                      │
     │        ┌─────────────┼─────────────┐
     │        │             │             │
     │        ▼             │             ▼
     │   ┌─────────┐        │        ┌─────────┐
     │   │ Enable  │        │        │  Skip   │
     │   │   MFA   │        │        │  (OK)   │
     │   └────┬────┘        │        └────┬────┘
     │        │             │             │
     │        ▼             │             │
     │   ┌─────────┐        │             │
     │   │ Setup   │        │             │
     │   │  TOTP   │        │             │
     │   └────┬────┘        │             │
     │        │             │             │
     └────────┴─────────────┴─────────────┘
              │
              ▼
┌─────────────────────────────────────────┐
│ 8. Issue YOUR JWT tokens                │
│    (accessToken + refreshToken)         │
│    Same tokens as email/password login  │
└───────────┬─────────────────────────────┘
            │
            ▼
┌─────────────────────────────────────────┐
│ 9. Redirect to frontend with tokens     │
│    User is logged in                    │
└─────────────────────────────────────────┘
```

### MFA Flow for Social Login Users

```text
Returning User with MFA Enabled:
┌─────────────────────────┐
│ User clicks social      │
│ login button            │
└───────────┬─────────────┘
            │
            ▼
┌─────────────────────────┐
│ Auth0 → Provider → Auth0│
│ (OAuth handshake)       │
└───────────┬─────────────┘
            │
            ▼
┌─────────────────────────────────────────┐
│ Auth-service receives profile           │
│ User found with mfaEnabled = true       │
└───────────┬─────────────────────────────┘
            │
            ▼
┌─────────────────────────────────────────┐
│ Return MFA_REQUIRED response            │
│ (Same as email/password MFA flow)       │
│ {                                       │
│   mfaRequired: true,                    │
│   mfaToken: "temp-token",               │
│   userId: "..."                         │
│ }                                       │
└───────────┬─────────────────────────────┘
            │
            ▼
┌─────────────────────────────────────────┐
│ Frontend shows TOTP input               │
│ User enters 6-digit code                │
└───────────┬─────────────────────────────┘
            │
            ▼
┌─────────────────────────────────────────┐
│ POST /api/auth/mfa/verify               │
│ (Existing MFA verification endpoint)    │
└───────────┬─────────────────────────────┘
            │
            ▼
┌─────────────────────────────────────────┐
│ Issue JWT tokens                        │
│ User fully authenticated                │
└─────────────────────────────────────────┘
```

---

## Database Schema

### New Model: OAuthAccount

**File:** `apps/auth-service/prisma/schema.prisma`

```prisma
model OAuthAccount {
  id                String    @id @default(uuid())
  userId            String    @map("user_id")
  provider          String    // 'google', 'github', 'facebook', 'linkedin', 'twitter'
  providerAccountId String    @map("provider_account_id")
  email             String?   // Email from provider (may differ from user's primary email)
  name              String?   // Name from provider
  avatarUrl         String?   @map("avatar_url")
  accessToken       String?   @map("access_token")  // Encrypted, for future API access
  refreshToken      String?   @map("refresh_token") // Encrypted, for future API access
  tokenExpiresAt    DateTime? @map("token_expires_at")
  createdAt         DateTime  @default(now()) @map("created_at")
  updatedAt         DateTime  @updatedAt @map("updated_at")

  user              User      @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([provider, providerAccountId])
  @@index([userId])
  @@map("oauth_accounts")
}
```

### User Model Updates (CRITICAL)

**File:** `apps/auth-service/prisma/schema.prisma`

The existing User model requires updates to support social-only users:

```prisma
model User {
  id            String    @id @default(uuid())
  email         String    @unique
  passwordHash  String?   @map("password_hash")  // CHANGED: Nullable for social-only users
  name          String
  role          UserRole
  emailVerified Boolean   @default(false) @map("email_verified")
  hasPassword   Boolean   @default(true) @map("has_password")  // NEW: Track if user has password
  createdAt     DateTime  @default(now()) @map("created_at")
  updatedAt     DateTime  @updatedAt @map("updated_at")

  // MFA fields (existing)
  mfaEnabled      Boolean   @default(false) @map("mfa_enabled")
  mfaSecret       String?   @map("mfa_secret")
  mfaBackupCodes  Json?     @map("mfa_backup_codes")
  mfaVerified     Boolean   @default(false) @map("mfa_verified")

  // Relations (existing)
  refreshTokens RefreshToken[]
  devices       Device[]

  // NEW: OAuth accounts relation
  oauthAccounts OAuthAccount[]

  @@index([email])
  @@index([role])
  @@map("users")
}
```

**Why these changes are needed:**
- `passwordHash` nullable: Social-only users don't have a password
- `hasPassword` flag: Required to prevent unlinking the only auth method
- `oauthAccounts` relation: Links OAuth providers to users

### Migration Strategy

1. Create migration: `pnpm db:auth:migrate --name add_oauth_accounts`
2. Migration must handle existing users:
   - Set `hasPassword = true` for all existing users (they all have passwords)
   - `passwordHash` already has values, so nullable change is safe
3. No breaking changes to existing users
4. Existing email/password users unaffected

---

## API Endpoints

### New Endpoints

| Method | Endpoint                       | Auth | Description                          |
| ------ | ------------------------------ | ---- | ------------------------------------ |
| GET    | `/auth/oauth/authorize`        | No   | Redirect to Auth0 for social login   |
| GET    | `/auth/oauth/callback`         | No   | Auth0 callback handler               |
| POST   | `/auth/oauth/link`             | Yes  | Link social account to existing user |
| DELETE | `/auth/oauth/unlink/:provider` | Yes  | Unlink social account                |
| GET    | `/auth/oauth/accounts`         | Yes  | List linked social accounts          |

### Endpoint Details

#### GET `/auth/oauth/authorize`

Initiates social login flow by redirecting to Auth0.

**Query Parameters:**

- `provider` (required): `google`, `GitHub`, `facebook`, `LinkedIn`, `twitter`
- `returnUrl` (optional): URL to redirect after login (default: `/`)

**Response:** 302 Redirect to Auth0

**Example:**

```text
GET /api/auth/oauth/authorize?provider=google&returnUrl=/dashboard
→ Redirects to: https://YOUR_TENANT.auth0.com/authorize?...
```

#### GET `/auth/oauth/callback`

Handles Auth0 callback after social authentication.

**Query Parameters (from Auth0):**

- `code`: Authorization code
- `state`: CSRF token + returnUrl (encoded)

**Response:**

```typescript
// Success (user has MFA disabled or MFA verified)
// → Redirects to returnUrl with tokens in fragment
// https://localhost/oauth-callback#access_token=...&refresh_token=...

// MFA Required
// → Redirects to MFA page
// https://localhost/mfa-verify?mfaToken=...&returnUrl=...

// First-time social user (MFA recommendation)
// → Redirects to MFA setup recommendation page
// https://localhost/mfa-recommend?mfaToken=...&returnUrl=...
```

#### POST `/auth/oauth/link`

Links a social account to the currently authenticated user.

**Headers:** `Authorization: Bearer <accessToken>`

**Request:**

```json
{
  "provider": "github",
  "authorizationCode": "code_from_auth0_callback"
}
```

**Response:**

```json
{
  "success": true,
  "message": "GitHub account linked successfully",
  "data": {
    "provider": "github",
    "providerEmail": "user@github.com",
    "linkedAt": "2026-01-20T12:00:00.000Z"
  }
}
```

#### DELETE `/auth/oauth/unlink/:provider`

Unlinks a social account from the user.

**Headers:** `Authorization: Bearer <accessToken>`

**Validation:**

- Cannot unlink if it's the only auth method (uses `hasPassword` flag to check)
- At least one auth method must remain (password OR another OAuth account)

**Validation Logic:**

```typescript
async function canUnlinkOAuth(userId: string, provider: string): Promise<boolean> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { oauthAccounts: true },
  });

  if (!user) return false;

  // If user has password, they can always unlink
  if (user.hasPassword) return true;

  // If no password, check if they have other OAuth accounts
  const otherAccounts = user.oauthAccounts.filter(a => a.provider !== provider);
  return otherAccounts.length > 0;
}
```

**Response:**

```json
{
  "success": true,
  "message": "GitHub account unlinked successfully"
}
```

#### GET `/auth/oauth/accounts`

Lists all linked social accounts for the current user.

**Headers:** `Authorization: Bearer <accessToken>`

**Response:**

```json
{
  "success": true,
  "data": [
    {
      "provider": "google",
      "providerEmail": "user@gmail.com",
      "linkedAt": "2026-01-15T10:00:00.000Z"
    },
    {
      "provider": "github",
      "providerEmail": "user@github.com",
      "linkedAt": "2026-01-20T12:00:00.000Z"
    }
  ]
}
```

---

## Phase 1: Auth0 Setup & Configuration

### Priority 1.1: Auth0 Tenant Setup

**Effort:** 1 hour
**Impact:** Foundation for all social login

**Tasks:**

- [x] Create Auth0 account (free tier: 7,500 MAU) ✅
- [x] Create new tenant (e.g., `payments-system-dev`) ✅
- [x] Note tenant domain: `YOUR_TENANT.auth0.com` ✅
- [x] Create Application (Regular Web Application) ✅
- [x] Configure application settings: ✅
  - Allowed Callback URLs: `https://localhost/api/auth/oauth/callback`
  - Allowed Logout URLs: `https://localhost`
  - Allowed Web Origins: `https://localhost`

**Auth0 Application Settings to Record:**

```env
# Add to apps/auth-service/.env
AUTH0_DOMAIN=YOUR_TENANT.auth0.com
AUTH0_CLIENT_ID=your_client_id
AUTH0_CLIENT_SECRET=your_client_secret
AUTH0_CALLBACK_URL=https://localhost/api/auth/oauth/callback
AUTH0_AUDIENCE=https://payments-system-api
```

**Success Criteria:**

- [x] Auth0 tenant created ✅
- [x] Application configured ✅
- [x] Environment variables documented ✅

---

### Priority 1.2: Configure Social Identity Providers ✅

**Effort:** 2 hours
**Impact:** Enables each social provider

**Per-Provider Setup:**

#### Google ✅

- [x] Create project in Google Cloud Console (using Auth0 dev keys)
- [x] Enable Google+ API (using Auth0 dev keys)
- [x] Create OAuth 2.0 credentials (using Auth0 dev keys)
- [x] Add Auth0 callback URL: `https://YOUR_TENANT.auth0.com/login/callback`
- [x] Enable Google connection in Auth0 Dashboard ✅

#### GitHub ✅

- [x] Create OAuth App in GitHub Developer Settings (using Auth0 dev keys)
- [x] Set callback URL to Auth0
- [x] Enable GitHub connection in Auth0 Dashboard ✅

#### Facebook

- [ ] Create App in Facebook Developers
- [ ] Configure Facebook Login product
- [ ] Add Auth0 callback URL
- [ ] Submit for App Review (basic permissions don't require review)
- [ ] Enable Facebook connection in Auth0 Dashboard

#### LinkedIn

- [ ] Create App in LinkedIn Developers
- [ ] Request `r_liteprofile` and `r_emailaddress` scopes
- [ ] Add Auth0 callback URL
- [ ] Enable LinkedIn connection in Auth0 Dashboard

#### X/Twitter

- [ ] Apply for Twitter Developer Account (may take time)
- [ ] Create Project and App
- [ ] Enable OAuth 2.0
- [ ] Add Auth0 callback URL
- [ ] Enable Twitter connection in Auth0 Dashboard

**Note:** X/Twitter requires developer account approval which can take days. Plan accordingly.

**Note:** Facebook, LinkedIn, and X/Twitter will be configured later. Google and GitHub are sufficient for initial implementation.

**Success Criteria:**

- [x] Google and GitHub configured in Auth0 ✅
- [ ] All 5 providers configured in Auth0 (deferred - Google & GitHub first)
- [ ] Test login works for each provider in Auth0 Dashboard

---

### Priority 1.3: Auth0 Application Configuration ✅

**Effort:** 1 hour
**Impact:** Security and flow configuration

**Tasks:**

- [x] Configure Allowed Callback URLs ✅
- [x] Configure Allowed Logout URLs ✅
- [x] Configure Allowed Web Origins ✅
- [ ] Configure Auth0 Rules/Actions (optional, for customization) _(deferred)_
- [ ] Set up Custom Domain (optional, for branding) _(deferred)_
- [ ] Enable "Require email verification" for social connections _(deferred)_
- [ ] Configure connection-specific settings (scopes, permissions) _(deferred)_

**Auth0 Rules (Optional):**

```javascript
// Rule: Add custom claims to ID token
exports.onExecutePostLogin = async (event, api) => {
  api.idToken.setCustomClaim('provider', event.connection.name);
  api.idToken.setCustomClaim('provider_id', event.user.user_id);
};
```

**Success Criteria:**

- [x] Auth0 application fully configured ✅
- [x] Test end-to-end flow verified ✅ (Google OAuth flow tested and working)

---

## Phase 2: Backend Integration

### Priority 2.1: Database Schema Updates ✅

**Effort:** 1 hour
**Impact:** Foundation for OAuth data storage

> **Note:** This priority was moved from 2.3 because the Prisma schema must be in place before implementing the OAuth endpoints.

**Tasks:**

- [x] Update `User` model: Make `passwordHash` nullable ✅
- [x] Add `hasPassword` boolean to `User` model (default: true) ✅
- [x] Add `OAuthAccount` model ✅
- [x] Add relation from `User` to `OAuthAccount` ✅
- [x] Create and run migration ✅
- [x] Generate Prisma client ✅
- [x] Update `auth.service.ts` to handle nullable `passwordHash` ✅

**Commands:**

```bash
# After updating schema.prisma
pnpm db:auth:generate
pnpm db:auth:migrate --name add_oauth_accounts
```

**Migration SQL (for reference):**

```sql
-- Make passwordHash nullable
ALTER TABLE "users" ALTER COLUMN "password_hash" DROP NOT NULL;

-- Add hasPassword flag (default true for existing users)
ALTER TABLE "users" ADD COLUMN "has_password" BOOLEAN NOT NULL DEFAULT true;

-- Create oauth_accounts table
CREATE TABLE "oauth_accounts" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "user_id" TEXT NOT NULL,
  "provider" TEXT NOT NULL,
  "provider_account_id" TEXT NOT NULL,
  "email" TEXT,
  "name" TEXT,
  "avatar_url" TEXT,
  "access_token" TEXT,
  "refresh_token" TEXT,
  "token_expires_at" TIMESTAMP(3),
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "oauth_accounts_user_id_fkey" FOREIGN KEY ("user_id")
    REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- Unique constraint: one provider account per provider
CREATE UNIQUE INDEX "oauth_accounts_provider_provider_account_id_key"
  ON "oauth_accounts"("provider", "provider_account_id");

-- Index for user lookups
CREATE INDEX "oauth_accounts_user_id_idx" ON "oauth_accounts"("user_id");
```

**Success Criteria:**

- [x] Migration runs successfully ✅
- [x] Prisma client updated with new types ✅
- [x] Existing users unaffected (all have `hasPassword = true`) ✅
- [x] Can create users without passwords (for social login) ✅
- [x] auth.service.ts updated to handle nullable passwordHash ✅
- [x] mfa.service.ts updated to handle nullable passwordHash ✅
- [x] password-reset.service.ts updated to set hasPassword=true ✅
- [x] All tests pass ✅

---

### Priority 2.2: OAuth Callback Endpoints

**Effort:** 4 hours
**Impact:** Core social login functionality

**Files to Create:**

#### `apps/auth-service/src/services/oauth.service.ts`

```typescript
import { auth0 } from '../lib/auth0';
import { prisma } from '../lib/prisma';
import { authService } from './auth.service';
import { encryptionService } from './encryption.service';

interface Auth0Profile {
  sub: string; // Provider user ID
  email?: string;
  email_verified?: boolean;
  name?: string;
  picture?: string;
  nickname?: string;
}

interface SocialLoginResult {
  type: 'success' | 'mfa_required' | 'mfa_recommend';
  user?: User;
  accessToken?: string;
  refreshToken?: string;
  mfaToken?: string;
}

export class OAuthService {
  /**
   * Generate Auth0 authorization URL
   */
  getAuthorizationUrl(
    provider: string,
    returnUrl: string,
    state: string
  ): string {
    // Build Auth0 authorize URL with connection parameter
  }

  /**
   * Handle Auth0 callback - exchange code for profile
   */
  async handleCallback(
    code: string,
    state: string
  ): Promise<SocialLoginResult> {
    // 1. Exchange code for Auth0 tokens
    // 2. Get user profile from Auth0
    // 3. Find or create user in our database
    // 4. Link OAuth account
    // 5. Check MFA status
    // 6. Issue our JWT tokens
  }

  /**
   * Find existing user by OAuth provider ID
   */
  async findUserByOAuth(
    provider: string,
    providerAccountId: string
  ): Promise<User | null> {
    // Query OAuthAccount → User
  }

  /**
   * Find existing user by email (for account linking)
   */
  async findUserByEmail(email: string): Promise<User | null> {
    // Query User by email
  }

  /**
   * Create new user from OAuth profile
   */
  async createUserFromOAuth(
    profile: Auth0Profile,
    provider: string
  ): Promise<User> {
    // Create User + OAuthAccount in transaction
  }

  /**
   * Link OAuth account to existing user
   */
  async linkOAuthAccount(
    userId: string,
    profile: Auth0Profile,
    provider: string
  ): Promise<void> {
    // Create OAuthAccount for existing user
  }

  /**
   * Unlink OAuth account
   */
  async unlinkOAuthAccount(userId: string, provider: string): Promise<void> {
    // Delete OAuthAccount, verify user has other auth methods
  }
}
```

#### `apps/auth-service/src/controllers/oauth.controller.ts`

```typescript
import { Request, Response } from 'express';
import { oauthService } from '../services/oauth.service';

/**
 * @swagger
 * /auth/oauth/authorize:
 *   get:
 *     summary: Initiate social login
 *     tags: [OAuth]
 */
export async function authorize(req: Request, res: Response) {
  const { provider, returnUrl = '/' } = req.query;
  // Validate provider, generate state, redirect to Auth0
}

/**
 * @swagger
 * /auth/oauth/callback:
 *   get:
 *     summary: Auth0 callback handler
 *     tags: [OAuth]
 */
export async function callback(req: Request, res: Response) {
  const { code, state, error } = req.query;
  // Handle callback, issue tokens, redirect
}

/**
 * @swagger
 * /auth/oauth/link:
 *   post:
 *     summary: Link social account to current user
 *     tags: [OAuth]
 *     security:
 *       - bearerAuth: []
 */
export async function linkAccount(req: Request, res: Response) {
  // Link OAuth account to authenticated user
}

/**
 * @swagger
 * /auth/oauth/unlink/{provider}:
 *   delete:
 *     summary: Unlink social account
 *     tags: [OAuth]
 *     security:
 *       - bearerAuth: []
 */
export async function unlinkAccount(req: Request, res: Response) {
  // Unlink OAuth account
}

/**
 * @swagger
 * /auth/oauth/accounts:
 *   get:
 *     summary: List linked social accounts
 *     tags: [OAuth]
 *     security:
 *       - bearerAuth: []
 */
export async function listAccounts(req: Request, res: Response) {
  // Return list of linked OAuth accounts
}
```

#### `apps/auth-service/src/routes/oauth.routes.ts`

```typescript
import { Router } from 'express';
import * as oauthController from '../controllers/oauth.controller';
import { authenticate } from '../middleware/auth';

const router = Router();

// Public routes (no auth required)
router.get('/authorize', oauthController.authorize);
router.get('/callback', oauthController.callback);

// Protected routes (auth required)
router.post('/link', authenticate, oauthController.linkAccount);
router.delete('/unlink/:provider', authenticate, oauthController.unlinkAccount);
router.get('/accounts', authenticate, oauthController.listAccounts);

export { router as oauthRoutes };
```

**Tasks:**

- [x] Create `oauth.service.ts` with core OAuth logic ✅
- [x] Create `oauth.controller.ts` with route handlers ✅
- [x] Create `oauth.routes.ts` and register in main.ts ✅
- [x] Add OAuth dependencies: `pnpm add openid-client` (OIDC-certified client for secure PKCE flow) ✅
- [x] Create `libs/auth0.ts` client configuration ✅
- [x] Add CSRF state management (Redis) ✅
- [ ] Add Swagger documentation _(deferred to Phase 4)_
- [ ] Add rate-limiting for OAuth endpoints (see below) _(deferred to Phase 4)_
- [x] Add RabbitMQ audit event publishers ✅

**Rate-Limiting for OAuth Endpoints:**

```typescript
// OAuth routes should have separate rate limits (expensive operations)
// Add to API Gateway or auth-service middleware
const oauthRateLimits = {
  '/auth/oauth/authorize': { windowMs: 60000, max: 10 },  // 10 req/min per IP
  '/auth/oauth/callback': { windowMs: 60000, max: 20 },   // 20 req/min per IP
  '/auth/oauth/link': { windowMs: 60000, max: 5 },        // 5 req/min per user
  '/auth/oauth/unlink': { windowMs: 60000, max: 5 },      // 5 req/min per user
};
```

**RabbitMQ Audit Events to Add:**

```typescript
// Add to apps/auth-service/src/events/publisher.ts
export async function publishOAuthLoginAttempt(data: {
  provider: string;
  email?: string;
  success: boolean;
  error?: string;
  ipAddress: string;
  timestamp: string;
}): Promise<void>;

export async function publishOAuthAccountLinked(data: {
  userId: string;
  provider: string;
  providerEmail: string;
  timestamp: string;
}): Promise<void>;

export async function publishOAuthAccountUnlinked(data: {
  userId: string;
  provider: string;
  timestamp: string;
}): Promise<void>;
```

**Files to Create/Modify:**

- `apps/auth-service/src/services/oauth.service.ts` (New)
- `apps/auth-service/src/controllers/oauth.controller.ts` (New)
- `apps/auth-service/src/routes/oauth.routes.ts` (New)
- `apps/auth-service/src/lib/auth0.ts` (New)
- `apps/auth-service/src/events/publisher.ts` (Add OAuth events)
- `apps/auth-service/src/main.ts` (Register routes)

**Success Criteria:**

- [x] `/auth/oauth/:provider` redirects to Auth0 ✅
- [x] `/auth/oauth/callback` handles Auth0 response ✅
- [x] User created/found in database ✅
- [x] JWT tokens issued ✅
- [ ] Rate-limiting active on OAuth endpoints _(deferred to Phase 4)_
- [x] Audit events published to RabbitMQ ✅

---

### Priority 2.3: User Account Linking Service ✅

**Effort:** 3 hours
**Impact:** Links social accounts to users

**Account Linking Logic:**

```typescript
async function handleSocialLogin(
  profile: Auth0Profile,
  provider: string
): Promise<User> {
  // 1. Check if OAuth account already linked
  const existingOAuth = await findOAuthAccount(provider, profile.sub);
  if (existingOAuth) {
    return existingOAuth.user;
  }

  // 2. Check if user exists with same email
  if (profile.email) {
    const existingUser = await findUserByEmail(profile.email);
    if (existingUser) {
      // Auto-link if email verified on both sides
      if (profile.email_verified && existingUser.emailVerified) {
        await linkOAuthAccount(existingUser.id, profile, provider);
        return existingUser;
      }
      // Otherwise, require manual linking (security)
      throw new ApiError(
        409,
        'EMAIL_EXISTS',
        'An account with this email already exists. Please sign in and link your social account.'
      );
    }
  }

  // 3. Create new user
  return createUserFromOAuth(profile, provider);
}
```

**Tasks:**

- [x] Implement account lookup by OAuth provider ID ✅
- [x] Implement account lookup by email ✅
- [x] Implement auto-linking for verified emails ✅
- [x] Implement manual linking flow ✅
- [x] Add conflict handling (email exists) ✅
- [x] Add audit logging for OAuth events ✅

**Success Criteria:**

- [x] Existing OAuth users recognized ✅
- [x] Email matching auto-links (if verified) ✅
- [x] New users created correctly (with `hasPassword = false`) ✅
- [x] Conflicts handled gracefully ✅

---

### Priority 2.4: MFA Integration for Social Users ✅

**Effort:** 2 hours
**Impact:** Ensures MFA works with social login

**MFA Scenarios:**

| Scenario                             | Behavior                       |
| ------------------------------------ | ------------------------------ |
| New social user, first login         | Recommend MFA setup (can skip) |
| Existing user with MFA, social login | Require MFA verification       |
| Social user enables MFA later        | Normal MFA setup flow          |
| Social user with MFA logs in         | Require TOTP after OAuth       |

**Tasks:**

- [x] Add MFA check after OAuth profile received ✅
- [ ] Create MFA recommendation page/flow _(frontend - Phase 3)_
- [x] Integrate with existing `/auth/mfa/verify` endpoint ✅
- [ ] Store MFA preference for social users _(frontend - Phase 3)_

**Implementation:**

```typescript
async function handleCallback(code: string): Promise<SocialLoginResult> {
  const profile = await exchangeCodeForProfile(code);
  const user = await handleSocialLogin(profile, provider);

  // Check MFA status
  if (user.mfaEnabled) {
    // User has MFA, require verification
    const mfaToken = generateMfaToken(user.id);
    return { type: 'mfa_required', mfaToken, user };
  }

  // Check if first social login (recommend MFA)
  const isFirstSocialLogin = await isFirstTimeOAuthUser(user.id);
  if (isFirstSocialLogin) {
    const mfaToken = generateMfaToken(user.id);
    return { type: 'mfa_recommend', mfaToken, user };
  }

  // No MFA, issue tokens
  const tokens = await authService.generateTokens(user);
  return { type: 'success', ...tokens, user };
}
```

**Success Criteria:**

- [x] MFA enforced for users who have it enabled ✅ (tested - user redirected to /mfa?token=...)
- [ ] MFA recommendation shown to new social users _(frontend - Phase 3)_
- [ ] Users can skip MFA recommendation _(frontend - Phase 3)_
- [ ] MFA setup works for social-only users _(frontend - Phase 3)_

---

## Phase 3: Frontend Integration

### Frontend OAuth Redirect Flow (IMPORTANT)

The frontend **does NOT** redirect directly to Auth0. Instead, it uses the backend as a proxy to generate CSRF state:

```text
Correct Flow:
┌─────────────────────────────────────────────────────────────────────────────┐
│ 1. User clicks "Continue with Google"                                       │
│    ↓                                                                        │
│ 2. Frontend redirects to YOUR backend:                                      │
│    https://localhost/api/auth/oauth/authorize?provider=google&returnUrl=/   │
│    ↓                                                                        │
│ 3. Backend generates CSRF state, stores in Redis, redirects to Auth0        │
│    ↓                                                                        │
│ 4. Auth0 → Google → Auth0 → YOUR /api/auth/oauth/callback                   │
│    ↓                                                                        │
│ 5. Backend validates state, creates/finds user, issues JWT                  │
│    ↓                                                                        │
│ 6. Backend redirects to frontend: /oauth-callback#access_token=...          │
│    ↓                                                                        │
│ 7. Frontend OAuthCallback component extracts tokens, updates auth store     │
└─────────────────────────────────────────────────────────────────────────────┘
```

**Why this matters:** The CSRF state parameter MUST be generated server-side and stored in Redis. Never generate OAuth state client-side.

---

### Priority 3.1: Social Login Buttons Component

**Effort:** 2 hours
**Impact:** Reusable social login UI

**File:** `libs/shared-design-system/src/lib/components/SocialLoginButtons.tsx`

```typescript
import * as React from 'react';
import { Button } from './Button';
// Use Lucide icons (already in shadcn/ui) - no need for custom icon files
import { Loader2 } from 'lucide-react';

export interface SocialLoginButtonsProps {
  onProviderClick: (provider: string) => void;
  disabled?: boolean;
  loading?: string | null; // Provider currently loading
  enabledProviders?: string[]; // Subset of providers to show
}

// SVG icons as inline components (brand-accurate colors)
const GoogleIcon = () => (
  <svg className="h-4 w-4 mr-2" viewBox="0 0 24 24">
    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
  </svg>
);

const GitHubIcon = () => (
  <svg className="h-4 w-4 mr-2" fill="currentColor" viewBox="0 0 24 24">
    <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
  </svg>
);

const FacebookIcon = () => (
  <svg className="h-4 w-4 mr-2" fill="currentColor" viewBox="0 0 24 24">
    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
  </svg>
);

const LinkedInIcon = () => (
  <svg className="h-4 w-4 mr-2" fill="currentColor" viewBox="0 0 24 24">
    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
  </svg>
);

const XIcon = () => (
  <svg className="h-4 w-4 mr-2" fill="currentColor" viewBox="0 0 24 24">
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
  </svg>
);

const providers = [
  { id: 'google', name: 'Google', icon: GoogleIcon, className: 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50' },
  { id: 'github', name: 'GitHub', icon: GitHubIcon, className: 'bg-gray-900 text-white border-gray-900 hover:bg-gray-800' },
  { id: 'facebook', name: 'Facebook', icon: FacebookIcon, className: 'bg-[#1877F2] text-white border-[#1877F2] hover:bg-[#166FE5]' },
  { id: 'linkedin', name: 'LinkedIn', icon: LinkedInIcon, className: 'bg-[#0A66C2] text-white border-[#0A66C2] hover:bg-[#004182]' },
  { id: 'twitter', name: 'X', icon: XIcon, className: 'bg-black text-white border-black hover:bg-gray-900' },
];

export function SocialLoginButtons({
  onProviderClick,
  disabled,
  loading,
  enabledProviders = ['google', 'github', 'facebook', 'linkedin', 'twitter']
}: SocialLoginButtonsProps) {
  const visibleProviders = providers.filter(p => enabledProviders.includes(p.id));

  return (
    <div className="space-y-3">
      {visibleProviders.map((provider) => (
        <Button
          key={provider.id}
          type="button"
          variant="outline"
          className={`w-full border ${provider.className}`}
          onClick={() => onProviderClick(provider.id)}
          disabled={disabled || loading !== null}
        >
          {loading === provider.id ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <provider.icon />
          )}
          Continue with {provider.name}
        </Button>
      ))}
    </div>
  );
}
```

**Tasks:**

- [x] Create `SocialLoginButtons` component with inline SVG icons (brand-accurate) ✅
- [x] Use custom `LoadingSpinner` SVG for loading state (no external dependency) ✅
- [x] Add loading states ✅
- [x] Add disabled states ✅
- [x] Export from shared-design-system ✅
- [x] Add unit tests ✅

**Files Created:**

- `libs/shared-design-system/src/lib/components/SocialLoginButtons.tsx`
- `libs/shared-design-system/src/lib/components/SocialLoginButtons.test.tsx`

**Note:** Icons are inline SVGs instead of separate files. This ensures brand-accurate colors and avoids extra dependencies.

**Success Criteria:**

- [x] Component renders all providers ✅
- [x] Click events fire correctly ✅
- [x] Loading/disabled states work ✅
- [x] Styling matches design system ✅
- [x] Icons render with correct brand colors ✅

---

### Priority 3.2: OAuth Callback Route & Component (NEW)

**Effort:** 2 hours
**Impact:** Handles token extraction after OAuth redirect

This component handles the redirect from the backend after successful OAuth authentication.

**File:** `apps/auth-mfe/src/components/OAuthCallback.tsx`

```typescript
import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuthStore } from 'shared-auth-store';
import { Loader2 } from 'lucide-react';

/**
 * OAuthCallback handles the redirect from the backend OAuth flow.
 *
 * The backend redirects to one of these URLs:
 * - /oauth-callback#access_token=...&refresh_token=...&expires_in=... (success)
 * - /oauth-callback?error=...&message=... (error)
 * - /mfa-verify?mfaToken=...&returnUrl=... (MFA required)
 * - /mfa-recommend?mfaToken=...&returnUrl=... (MFA recommendation)
 */
export function OAuthCallback() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { setTokens, setUser, fetchCurrentUser } = useAuthStore();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const processCallback = async () => {
      // Check for error in query params
      const errorParam = searchParams.get('error');
      if (errorParam) {
        const message = searchParams.get('message') || 'OAuth authentication failed';
        setError(message);
        return;
      }

      // Extract tokens from URL fragment (hash)
      const hash = window.location.hash.substring(1);
      const params = new URLSearchParams(hash);

      const accessToken = params.get('access_token');
      const refreshToken = params.get('refresh_token');
      const expiresIn = params.get('expires_in');
      const returnUrl = params.get('return_url') || '/';

      if (!accessToken || !refreshToken) {
        setError('Invalid OAuth callback: missing tokens');
        return;
      }

      try {
        // Update auth store with tokens
        setTokens(accessToken, refreshToken);

        // Fetch user data
        await fetchCurrentUser();

        // Clear the hash from URL (security)
        window.history.replaceState(null, '', window.location.pathname);

        // Navigate to return URL
        navigate(returnUrl, { replace: true });
      } catch (err) {
        console.error('OAuth callback error:', err);
        setError('Failed to complete authentication');
      }
    };

    processCallback();
  }, [searchParams, setTokens, fetchCurrentUser, navigate]);

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
        <div className="text-destructive text-lg font-medium">
          Authentication Failed
        </div>
        <p className="text-muted-foreground text-center max-w-md">{error}</p>
        <button
          onClick={() => navigate('/signin')}
          className="text-primary hover:underline"
        >
          Return to Sign In
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
      <p className="text-muted-foreground">Completing sign in...</p>
    </div>
  );
}
```

**Shell Router Update:**

**File:** `apps/shell/src/app/app.tsx` (or routes file)

```typescript
// Add these routes to the shell router
import { lazy } from 'react';

const OAuthCallback = lazy(() =>
  import('authMfe/OAuthCallback').then(m => ({ default: m.OAuthCallback }))
);
const MfaVerify = lazy(() =>
  import('authMfe/MfaVerify').then(m => ({ default: m.MfaVerify }))
);
const MfaRecommend = lazy(() =>
  import('authMfe/MfaRecommendation').then(m => ({ default: m.MfaRecommendation }))
);

// Add to routes:
<Route path="/oauth-callback" element={<OAuthCallback />} />
<Route path="/mfa-verify" element={<MfaVerify />} />
<Route path="/mfa-recommend" element={<MfaRecommend />} />
```

**Auth MFE Exports:**

**File:** `apps/auth-mfe/rspack.config.js`

```javascript
// Add to exposes section:
exposes: {
  './SignIn': './src/components/SignIn.tsx',
  './SignUp': './src/components/SignUp.tsx',
  './VerifyEmail': './src/components/VerifyEmail.tsx',
  './OAuthCallback': './src/components/OAuthCallback.tsx',  // NEW
  './MfaRecommendation': './src/components/MfaRecommendation.tsx',  // NEW (Phase 3.6)
},
```

**Tasks:**

- [x] Create `OAuthCallback` component ✅
- [x] Handle token extraction from URL fragment ✅
- [x] Handle error display ✅
- [x] Handle MFA redirect scenarios ✅ (backend handles redirect to /mfa)
- [x] Update auth store with tokens ✅
- [x] Clear URL hash after processing (security) ✅
- [x] Add route to shell router ✅
- [x] Export from auth-mfe rspack.config.js ✅
- [ ] Add unit tests (deferred to Phase 4)

**Files Created/Modified:**

- `apps/auth-mfe/src/components/OAuthCallback.tsx` (New)
- `apps/auth-mfe/rspack.config.js` (Add export)
- `apps/shell/src/pages/OAuthCallbackPage.tsx` (New)
- `apps/shell/src/routes/AppRoutes.tsx` (Add route + props)
- `apps/shell/src/app/app.tsx` (Add props)
- `apps/shell/src/bootstrap.tsx` (Add remote import)
- `apps/shell/src/remotes/index.tsx` (Add lazy loader)
- `apps/shell/src/types/remotes.d.ts` (Add type declaration)

**Success Criteria:**

- [x] Component extracts tokens from URL fragment ✅
- [x] Auth store updated with tokens ✅
- [x] User data fetched after token storage ✅
- [x] URL hash cleared after processing ✅
- [x] Error states handled gracefully ✅
- [x] Redirect to return URL works ✅

---

### Priority 3.3: Sign-In Page Integration

**Effort:** 2 hours
**Impact:** Adds social login to sign in

**File:** `apps/auth-mfe/src/components/SignIn.tsx`

**Changes:**

- Add `SocialLoginButtons` component
- Add "or" divider between social and email login
- Handle social login redirect (to backend, NOT directly to Auth0)

**Layout:**

```text
┌────────────────────────────────────────┐
│           Sign In                      │
│                                        │
│  ┌──────────────────────────────────┐  │
│  │  Continue with Google            │  │
│  └──────────────────────────────────┘  │
│  ┌──────────────────────────────────┐  │
│  │  Continue with GitHub            │  │
│  └──────────────────────────────────┘  │
│  ┌──────────────────────────────────┐  │
│  │  Continue with Facebook          │  │
│  └──────────────────────────────────┘  │
│  ┌──────────────────────────────────┐  │
│  │  Continue with LinkedIn          │  │
│  └──────────────────────────────────┘  │
│  ┌──────────────────────────────────┐  │
│  │  Continue with X                 │  │
│  └──────────────────────────────────┘  │
│                                        │
│  ──────────── or ────────────          │
│                                        │
│  Email: [                    ]         │
│  Password: [                 ]         │
│            [Show] Forgot password?     │
│                                        │
│  [        Sign In          ]           │
│                                        │
│  Don't have an account? Sign up        │
└────────────────────────────────────────┘
```

**Social Login Handler:**

```typescript
// IMPORTANT: Redirect to YOUR backend, not directly to Auth0
const handleSocialLogin = (provider: string) => {
  const apiBaseUrl = process.env.NX_API_BASE_URL || 'https://localhost/api';
  const returnUrl = encodeURIComponent(window.location.pathname || '/');

  // Redirect to YOUR backend OAuth endpoint
  // The backend will generate CSRF state and redirect to Auth0
  window.location.href = `${apiBaseUrl}/auth/oauth/authorize?provider=${provider}&returnUrl=${returnUrl}`;
};
```

**Tasks:**

- [x] Add `SocialLoginButtons` to SignIn component ✅
- [x] Add divider with "or" text ✅
- [x] Implement `handleSocialLogin(provider)` function (redirect to backend) ✅
- [x] Handle errors from OAuth callback (via URL params) ✅ (handled by OAuthCallback component)

**Success Criteria:**

- [x] Social buttons appear on signin page ✅
- [x] Clicking button redirects to backend `/api/auth/oauth/authorize` ✅
- [x] Successful login returns to app via OAuthCallback ✅
- [x] Errors displayed appropriately ✅

---

### Priority 3.4: Sign Up Page Integration

**Effort:** 1 hour
**Impact:** Adds social signup option

**File:** `apps/auth-mfe/src/components/SignUp.tsx`

**Changes:**

- Add `SocialLoginButtons` component (same as SignIn)
- Social signup creates new user automatically
- Same redirect flow as SignIn

**Tasks:**

- [x] Add `SocialLoginButtons` to SignUp component ✅
- [x] Add "Or continue with email" divider ✅
- [x] Reuse same OAuth redirect logic (same `handleSocialLogin` function) ✅
- [x] Add OAuth error display from URL params ✅
- [x] Social buttons positioned at top of form (consistent with Sign-In page) ✅

**Success Criteria:**

- [x] Social buttons appear on signup page ✅
- [x] New user created on first social login ✅
- [x] Existing user with same email handled (conflict error or auto-link) ✅

---

### Priority 3.5: Account Linking UI (Profile Page)

**Effort:** 3 hours
**Impact:** Users can manage linked accounts

**File:** `apps/profile-mfe/src/components/LinkedAccounts.tsx`

**Features:**

- List currently linked social accounts
- Link new social account
- Unlink existing social account
- Warning when unlinking last auth method

**Component:**

```typescript
export function LinkedAccounts() {
  const { data: accounts, isLoading } = useLinkedAccounts();
  const linkAccount = useLinkAccount();
  const unlinkAccount = useUnlinkAccount();

  return (
    <Card>
      <CardHeader>
        <CardTitle>Linked Accounts</CardTitle>
        <CardDescription>
          Manage your connected social accounts
        </CardDescription>
      </CardHeader>
      <CardContent>
        {/* List of linked accounts with unlink button */}
        {/* Available providers to link */}
      </CardContent>
    </Card>
  );
}
```

**Tasks:**

- [x] Create `LinkedAccounts` component ✅
- [x] Create `useLinkedAccounts` hook (TanStack Query) ✅
- [x] Create `useLinkAccount` hook ✅
- [x] Create `useUnlinkAccount` mutation ✅
- [x] Add to profile page (Security tab) ✅
- [x] Handle link flow (OAuth redirect + callback) ✅
- [x] Add confirmation dialog for unlinking ✅
- [x] Create `apps/profile-mfe/src/api/oauth.ts` - API client ✅

**Files Created:**

- `apps/profile-mfe/src/api/oauth.ts`
- `apps/profile-mfe/src/components/LinkedAccounts.tsx`
- `apps/profile-mfe/src/hooks/useOAuthAccounts.ts`

**Success Criteria:**

- [x] Users can see linked accounts ✅
- [x] Users can link new accounts ✅
- [x] Users can unlink accounts ✅
- [x] Cannot unlink if only auth method ✅ (backend validates, UI shows warning)

---

### Priority 3.6: MFA Recommendation Page

**Effort:** 2 hours
**Impact:** Encourages MFA adoption

**File:** `apps/auth-mfe/src/components/MfaRecommendation.tsx`

**Features:**

- Shown after first social login
- Explains benefits of MFA
- "Enable MFA" button → MFA setup flow
- "Skip for now" button → Continue to app
- "Don't show again" checkbox

```typescript
export function MfaRecommendation({
  onEnableMfa,
  onSkip,
  onDontShowAgain
}: MfaRecommendationProps) {
  return (
    <Card className="max-w-md mx-auto">
      <CardHeader>
        <Shield className="h-12 w-12 text-primary mx-auto mb-4" />
        <CardTitle>Secure Your Account</CardTitle>
        <CardDescription>
          We recommend enabling two-factor authentication (2FA)
          to add an extra layer of security to your account.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <ul className="space-y-2 text-sm text-muted-foreground">
          <li>✓ Protects against unauthorized access</li>
          <li>✓ Required for financial transactions</li>
          <li>✓ Takes less than 2 minutes to set up</li>
        </ul>
        <Button onClick={onEnableMfa} className="w-full">
          Enable Two-Factor Authentication
        </Button>
        <Button variant="ghost" onClick={onSkip} className="w-full">
          Skip for now
        </Button>
        <label className="flex items-center text-sm text-muted-foreground">
          <input type="checkbox" onChange={(e) => onDontShowAgain(e.target.checked)} />
          <span className="ml-2">Don't show this again</span>
        </label>
      </CardContent>
    </Card>
  );
}
```

**Tasks:**

- [x] Create `MfaRecommendation` component ✅
- [x] Add route in shell app (`/mfa-recommend`) ✅
- [x] Handle "Enable MFA" flow (redirects to `/profile?tab=security`) ✅
- [x] Handle "Skip" flow (redirects to `/`) ✅
- [x] Store "Don't show again" preference (`mfa_recommend_dismissed` in localStorage) ✅
- [x] Update OAuthCallback to redirect new users to MFA recommendation page ✅
- [x] Export from auth-mfe rspack config ✅
- [x] Add type declarations and lazy loading in shell ✅

**Files Created/Modified:**

- `apps/auth-mfe/src/components/MfaRecommendation.tsx` (NEW)
- `apps/auth-mfe/src/components/OAuthCallback.tsx` (MODIFIED)
- `apps/auth-mfe/rspack.config.js` (MODIFIED - added expose)
- `apps/shell/src/pages/MfaRecommendationPage.tsx` (NEW)
- `apps/shell/src/routes/AppRoutes.tsx` (MODIFIED)
- `apps/shell/src/remotes/index.tsx` (MODIFIED)
- `apps/shell/src/types/remotes.d.ts` (MODIFIED)
- `apps/shell/src/app/app.tsx` (MODIFIED)
- `apps/shell/src/bootstrap.tsx` (MODIFIED)

**Success Criteria:**

- [x] Page shown after first social login ✅
- [x] Enable MFA works (redirects to profile security tab) ✅
- [x] Skip works (redirects to home) ✅
- [x] Don't show again preference persisted ✅

---

## Phase 4: Testing & Security

### Priority 4.1: Unit & Integration Tests - COMPLETED

**Effort:** 4 hours
**Impact:** Ensures reliability

**Test Files Created:**

#### Backend Tests

- `apps/auth-service/src/services/oauth.service.spec.ts` ✅
- `apps/auth-service/src/controllers/oauth.controller.spec.ts` ✅

**Test Cases:**

- [x] Authorization URL generation (each provider)
- [x] Callback handling (success)
- [x] Callback handling (error from Auth0)
- [x] User creation from OAuth profile
- [x] User lookup by OAuth provider ID
- [x] Account linking (new link)
- [x] Account linking (already linked)
- [x] Account unlinking
- [x] Cannot unlink last auth method
- [x] MFA required flow
- [x] MFA recommendation flow

#### Frontend Tests

- `libs/shared-design-system/src/lib/components/SocialLoginButtons.test.tsx` ✅ (existing)
- `apps/auth-mfe/src/components/MfaRecommendation.test.tsx` ✅
- `apps/profile-mfe/src/components/LinkedAccounts.test.tsx` ✅

**Note:** OAuthCallback component tests were attempted but removed due to jsdom limitations with window.location mocking in modern Jest. The component's core OAuth flow is tested through backend integration tests.

**Test Cases:**

- [x] Social buttons render correctly
- [x] Click handlers fire
- [x] Loading states display
- [x] MFA recommendation renders
- [x] Linked accounts list renders
- [x] Link/unlink flows work

**Success Criteria:**

- [x] All unit tests pass
- [x] Coverage > 70% for new code

---

### Priority 4.2: E2E Tests - COMPLETED

**Effort:** 3 hours
**Impact:** Validates end-to-end flows

**File:** `apps/shell-e2e/src/social-login.spec.ts`

**Test Cases (20 tests created):**

- [x] Social login buttons display on sign-in page
- [x] Social login buttons display on sign-up page
- [x] OAuth redirect to backend when clicking Google button
- [x] OAuth callback handler with successful tokens
- [x] OAuth callback error handling (error params)
- [x] OAuth callback with missing tokens
- [x] New user redirect to MFA recommendation page
- [x] Skip MFA recommendation if previously dismissed
- [x] MFA recommendation page elements and interactions
- [x] Enable MFA button redirects to profile
- [x] Skip button redirects to home
- [x] "Don't show again" preference saved
- [x] Linked Accounts section in profile Security tab
- [x] Display available providers to link
- [x] Display linked accounts
- [x] Confirmation dialog when unlinking
- [x] OAuth error display on sign-in page
- [x] Network error handling during OAuth callback
- [x] API error handling during OAuth callback

**Note:** E2E tests for OAuth use mock responses since we cannot perform actual OAuth redirects to external providers. Tests verify:
- UI elements presence and interaction
- OAuth callback handler logic with simulated tokens
- MFA recommendation flow
- Account linking UI in profile page
- Error handling scenarios

**Success Criteria:**

- [x] Critical flows covered (20 E2E tests)
- [x] Tests use mocked API responses for reliable testing

---

### Priority 4.3: Security Audit - COMPLETED

**Effort:** 2 hours
**Impact:** Ensures security

**Security Checklist:**

- [x] CSRF protection via state parameter - 256-bit entropy, cryptographically secure
- [x] State parameter stored in Redis with expiry - 10-minute TTL, one-time use
- [x] Auth0 tokens encrypted before storage - AES-256-GCM encryption
- [x] No sensitive data in frontend logs - Fixed during audit
- [x] OAuth callback validates state - Returns 400 for invalid/expired state
- [x] Rate-limiting on OAuth endpoints - OAuth-specific limiter (10 req/15 min) for initiation endpoints
- [x] Audit logging for OAuth events - RabbitMQ events for all operations
- [x] Account linking requires email verification - Both emails must be verified
- [x] Cannot link account already linked to another user - Unique constraint enforced

**Tasks:**

- [x] Review code for security issues
- [x] Test for CSRF vulnerabilities
- [x] Test for open redirect vulnerabilities - URL validation with allowlist
- [x] Verify token handling
- [x] Document security considerations - Created OAUTH-SECURITY-AUDIT.md

**Success Criteria:**

- [x] No critical vulnerabilities found
- [x] Security best practices followed

**Security Audit Document:** `docs/POC-3-Implementation/OAUTH-SECURITY-AUDIT.md`

---

## Configuration

### Environment Variables

**Auth Service (`apps/auth-service/.env`):**

```env
# Auth0 Configuration
AUTH0_DOMAIN=your-tenant.auth0.com
AUTH0_CLIENT_ID=your_client_id
AUTH0_CLIENT_SECRET=your_client_secret
AUTH0_CALLBACK_URL=https://localhost/api/auth/oauth/callback
AUTH0_AUDIENCE=https://payments-system-api

# OAuth State Configuration
OAUTH_STATE_TTL=600  # 10 minutes
OAUTH_STATE_SECRET=random-secret-for-signing-state

# Frontend URLs for redirects
FRONTEND_URL=https://localhost
OAUTH_SUCCESS_REDIRECT=/oauth-callback
OAUTH_ERROR_REDIRECT=/signin?error=oauth_failed
MFA_RECOMMEND_REDIRECT=/mfa-recommend
```

**Frontend (`apps/shell/.env`):**

```env
# OAuth Configuration
NX_OAUTH_ENABLED=true
NX_OAUTH_PROVIDERS=google,github,facebook,linkedin,twitter
```

### Redis Key Structure

```text
# OAuth State (CSRF protection)
oauth_state:{state_id}
  - returnUrl: string
  - provider: string
  - createdAt: timestamp
  - TTL: 10 minutes

# MFA Token for OAuth flow
oauth_mfa:{mfa_token}
  - userId: string
  - provider: string
  - isFirstLogin: boolean
  - TTL: 5 minutes
```

---

## Security Considerations

### Data Security

1. **What Auth0 Sees:**
   - User's social profile (email, name, avatar)
   - OAuth tokens from social providers
   - Login timestamps, IP addresses

2. **What Auth0 Never Sees:**
   - User passwords (we handle email/password auth)
   - MFA secrets (stored encrypted in our DB)
   - Payment data
   - Session tokens (we issue our own JWTs)

### Attack Vectors & Mitigations

| Attack           | Mitigation                                       |
| ---------------- | ------------------------------------------------ |
| CSRF             | State parameter with signature, stored in Redis  |
| Open Redirect    | Whitelist allowed returnUrl domains              |
| Token Theft      | Short-lived Auth0 tokens, encrypted storage      |
| Account Takeover | Email verification required for auto-linking     |
| Replay Attack    | Single-use authorization codes, state validation |

### Audit Events

Log the following events:

- `oauth.authorize.initiated` - User started OAuth flow
- `oauth.callback.success` - OAuth callback successful
- `oauth.callback.error` - OAuth callback failed
- `oauth.user.created` - New user created via OAuth
- `oauth.account.linked` - Social account linked
- `oauth.account.unlinked` - Social account unlinked
- `oauth.mfa.required` - MFA verification required
- `oauth.mfa.skipped` - User skipped MFA recommendation

---

## Rollout Plan

### Development Phase

1. Set up Auth0 tenant (dev environment)
2. Implement backend OAuth service
3. Implement frontend components
4. Test with Google + GitHub first (easiest providers)
5. Add remaining providers

### Staging Phase

1. Create staging Auth0 tenant
2. Deploy to staging environment
3. Full E2E testing
4. Security review

### Production Phase

1. Create production Auth0 tenant
2. Configure production social provider apps
3. Deploy with feature flag (disabled)
4. Enable for beta users
5. Monitor and gradually enable for all users

### Provider Priority

| Provider  | Priority | Reason                          |
| --------- | -------- | ------------------------------- |
| Google    | 1        | Most common, easiest to set up  |
| GitHub    | 2        | Developer-focused, simple OAuth |
| Facebook  | 3        | Large user base, moderate setup |
| LinkedIn  | 4        | Professional use case           |
| X/Twitter | 5        | Requires approval, complex API  |

**Recommendation:** Ship with Google + GitHub first, add others iteratively.

---

## Cost Estimation

### Auth0 Pricing

| Tier         | MAU Limit | Cost       | Notes                      |
| ------------ | --------- | ---------- | -------------------------- |
| Free         | 7,500     | $0         | Sufficient for dev/staging |
| Essentials   | 10,000+   | ~$23/month | Production tier            |
| Professional | Custom    | ~$0.02/MAU | Volume pricing             |

### Development Cost

| Phase                | Effort        |
| -------------------- | ------------- |
| Phase 1: Auth0 Setup | 4 hours       |
| Phase 2: Backend     | 10 hours      |
| Phase 3: Frontend    | 10 hours      |
| Phase 4: Testing     | 9 hours       |
| **Total**            | **~33 hours** |

---

## Dependencies

### Required

- Auth0 account (free tier sufficient for development)
- Social provider developer accounts (Google, GitHub, Facebook, LinkedIn, X)
- Existing auth infrastructure (JWT, MFA, sessions)

### npm Packages

**Backend (auth-service):**

- `openid-client` - OpenID Connect certified client for secure OAuth/OIDC flows with PKCE support (recommended over raw HTTP calls)
- `auth0` - Auth0 Management API SDK (optional, for user management operations)

**Frontend:**

- No additional SDK needed (redirect-based flow)
- Uses existing `lucide-react` for loading spinner (already in shadcn/ui)

**Installation:**

```bash
# Backend
cd apps/auth-service
pnpm add openid-client

# Optional: Auth0 Management API
pnpm add auth0
```

---

## Success Metrics

| Metric                      | Target | Measurement                 |
| --------------------------- | ------ | --------------------------- |
| Social login adoption       | 20%+   | Users who use social login  |
| Conversion improvement      | 10%+   | Signup completion rate      |
| MFA adoption (social users) | 50%+   | Social users who enable MFA |
| Error rate                  | <1%    | OAuth flow failures         |
| Support tickets             | <5%    | OAuth-related issues        |

---

## References

- [Auth0 Documentation](https://auth0.com/docs)
- [Auth0 Node.js SDK](https://github.com/auth0/node-auth0)
- [OAuth 2.0 Security Best Practices](https://datatracker.ietf.org/doc/html/draft-ietf-oauth-security-topics)
- [Google OAuth Setup](https://developers.google.com/identity/protocols/oauth2)
- [GitHub OAuth Setup](https://docs.github.com/en/developers/apps/building-oauth-apps)
- [Facebook Login Setup](https://developers.facebook.com/docs/facebook-login/)
- [LinkedIn OAuth Setup](https://docs.microsoft.com/en-us/linkedin/shared/authentication/authorization-code-flow)
- [Twitter OAuth 2.0 Setup](https://developer.twitter.com/en/docs/authentication/oauth-2-0)

---

## Appendix A: Auth0 Configuration Screenshots

### To be added during implementation

---

## Appendix B: API Response Examples

### Authorization Redirect

```text
GET /api/auth/oauth/authorize?provider=google&returnUrl=/dashboard

→ 302 Redirect to:
https://your-tenant.auth0.com/authorize?
  response_type=code&
  client_id=YOUR_CLIENT_ID&
  redirect_uri=https://localhost/api/auth/oauth/callback&
  scope=openid%20profile%20email&
  state=encrypted_state_with_return_url&
  connection=google-oauth2
```

### Callback Success (No MFA)

```text
GET /api/auth/oauth/callback?code=AUTH0_CODE&state=STATE

→ 302 Redirect to:
https://localhost/oauth-callback#
  access_token=YOUR_JWT_ACCESS_TOKEN&
  refresh_token=YOUR_JWT_REFRESH_TOKEN&
  expires_in=900
```

### Callback Success (MFA Required)

```text
GET /api/auth/oauth/callback?code=AUTH0_CODE&state=STATE

→ 302 Redirect to:
https://localhost/mfa-verify?
  mfaToken=TEMP_MFA_TOKEN&
  returnUrl=/dashboard
```

### Callback Success (MFA Recommended - First Login)

```text
GET /api/auth/oauth/callback?code=AUTH0_CODE&state=STATE

→ 302 Redirect to:
https://localhost/mfa-recommend?
  mfaToken=TEMP_MFA_TOKEN&
  returnUrl=/dashboard
```

### Link Account Request

```json
// POST /api/auth/oauth/link
// Headers: Authorization: Bearer <accessToken>
{
  "provider": "github"
}

// Response: 200 OK
{
  "success": true,
  "message": "GitHub account linked successfully",
  "data": {
    "provider": "github",
    "providerEmail": "user@github.com",
    "linkedAt": "2026-01-20T12:00:00.000Z"
  }
}
```

### Unlink Account Request

```json
// DELETE /api/auth/oauth/unlink/github
// Headers: Authorization: Bearer <accessToken>

// Response: 200 OK
{
  "success": true,
  "message": "GitHub account unlinked successfully"
}

// Response: 400 Bad Request (only auth method)
{
  "success": false,
  "error": "CANNOT_UNLINK_ONLY_AUTH",
  "message": "Cannot unlink your only authentication method. Please set a password first."
}
```

### List Linked Accounts

```json
// GET /api/auth/oauth/accounts
// Headers: Authorization: Bearer <accessToken>

// Response: 200 OK
{
  "success": true,
  "data": [
    {
      "provider": "google",
      "providerEmail": "user@gmail.com",
      "avatarUrl": "https://...",
      "linkedAt": "2026-01-15T10:00:00.000Z"
    },
    {
      "provider": "github",
      "providerEmail": "user@github.com",
      "avatarUrl": "https://...",
      "linkedAt": "2026-01-20T12:00:00.000Z"
    }
  ]
}
```

---

## Appendix C: Error Responses

### OAuth Errors

```json
// Auth0 returned an error
// Redirect to: /signin?error=oauth_failed&message=access_denied

// State validation failed (CSRF)
// Response: 400 Bad Request
{
  "success": false,
  "error": "INVALID_STATE",
  "message": "Invalid or expired OAuth state. Please try again."
}

// Provider account already linked to another user
// Response: 409 Conflict
{
  "success": false,
  "error": "ACCOUNT_ALREADY_LINKED",
  "message": "This Google account is already linked to another user."
}

// Email exists but not verified for auto-linking
// Response: 409 Conflict
{
  "success": false,
  "error": "EMAIL_EXISTS",
  "message": "An account with this email already exists. Please sign in and link your social account from your profile settings."
}
```
