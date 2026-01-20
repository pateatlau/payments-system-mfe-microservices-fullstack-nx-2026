# Social Login Implementation Plan (Auth0 Federation) - POC-3

**Created:** January 20, 2026
**Last Updated:** January 20, 2026
**Status:** Planning Complete - Ready for Implementation
**Priority:** Medium

---

## Implementation Progress

### Phase 1: Auth0 Setup & Configuration - PENDING

- **Priority 1.1:** Auth0 Tenant Setup
- **Priority 1.2:** Configure Social Identity Providers
- **Priority 1.3:** Auth0 Application Configuration

### Phase 2: Backend Integration - PENDING

- **Priority 2.1:** OAuth Callback Endpoints
- **Priority 2.2:** User Account Linking Service
- **Priority 2.3:** Database Schema Updates
- **Priority 2.4:** MFA Integration for Social Users

### Phase 3: Frontend Integration - PENDING

- **Priority 3.1:** Social Login Buttons Component
- **Priority 3.2:** Sign In Page Integration
- **Priority 3.3:** Sign Up Page Integration
- **Priority 3.4:** Account Linking UI (Profile Page)

### Phase 4: Testing & Security - PENDING

- **Priority 4.1:** Unit & Integration Tests
- **Priority 4.2:** E2E Tests
- **Priority 4.3:** Security Audit

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

```
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

```
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

```
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

```
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

// Update existing User model
model User {
  // ... existing fields ...

  // Add relation
  oauthAccounts     OAuthAccount[]
}
```

### Migration Strategy

1. Create migration: `pnpm db:auth:migrate --name add_oauth_accounts`
2. No breaking changes to existing users
3. Existing email/password users unaffected

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

- `provider` (required): `google`, `github`, `facebook`, `linkedin`, `twitter`
- `returnUrl` (optional): URL to redirect after login (default: `/`)

**Response:** 302 Redirect to Auth0

**Example:**

```
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

- Cannot unlink if it's the only auth method (no password set)
- At least one auth method must remain

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

- [ ] Create Auth0 account (free tier: 7,500 MAU)
- [ ] Create new tenant (e.g., `payments-system-dev`)
- [ ] Note tenant domain: `YOUR_TENANT.auth0.com`
- [ ] Create Application (Regular Web Application)
- [ ] Configure application settings:
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

- [ ] Auth0 tenant created
- [ ] Application configured
- [ ] Environment variables documented

---

### Priority 1.2: Configure Social Identity Providers

**Effort:** 2 hours
**Impact:** Enables each social provider

**Per-Provider Setup:**

#### Google

- [ ] Create project in Google Cloud Console
- [ ] Enable Google+ API
- [ ] Create OAuth 2.0 credentials
- [ ] Add Auth0 callback URL: `https://YOUR_TENANT.auth0.com/login/callback`
- [ ] Enable Google connection in Auth0 Dashboard

#### GitHub

- [ ] Create OAuth App in GitHub Developer Settings
- [ ] Set callback URL to Auth0
- [ ] Enable GitHub connection in Auth0 Dashboard

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

**Success Criteria:**

- [ ] All 5 providers configured in Auth0
- [ ] Test login works for each provider in Auth0 Dashboard

---

### Priority 1.3: Auth0 Application Configuration

**Effort:** 1 hour
**Impact:** Security and flow configuration

**Tasks:**

- [ ] Configure Auth0 Rules/Actions (optional, for customization)
- [ ] Set up Custom Domain (optional, for branding)
- [ ] Configure logout URLs
- [ ] Enable "Require email verification" for social connections
- [ ] Configure connection-specific settings (scopes, permissions)

**Auth0 Rules (Optional):**

```javascript
// Rule: Add custom claims to ID token
exports.onExecutePostLogin = async (event, api) => {
  api.idToken.setCustomClaim('provider', event.connection.name);
  api.idToken.setCustomClaim('provider_id', event.user.user_id);
};
```

**Success Criteria:**

- [ ] Auth0 application fully configured
- [ ] Test end-to-end flow in Auth0 Dashboard

---

## Phase 2: Backend Integration

### Priority 2.1: OAuth Callback Endpoints

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

- [ ] Create `oauth.service.ts` with core OAuth logic
- [ ] Create `oauth.controller.ts` with route handlers
- [ ] Create `oauth.routes.ts` and register in main.ts
- [ ] Add Auth0 SDK: `pnpm add auth0`
- [ ] Create `libs/auth0.ts` client configuration
- [ ] Add CSRF state management (Redis)
- [ ] Add Swagger documentation

**Files to Create/Modify:**

- `apps/auth-service/src/services/oauth.service.ts` (New)
- `apps/auth-service/src/controllers/oauth.controller.ts` (New)
- `apps/auth-service/src/routes/oauth.routes.ts` (New)
- `apps/auth-service/src/lib/auth0.ts` (New)
- `apps/auth-service/src/main.ts` (Register routes)

**Success Criteria:**

- [ ] `/auth/oauth/authorize` redirects to Auth0
- [ ] `/auth/oauth/callback` handles Auth0 response
- [ ] User created/found in database
- [ ] JWT tokens issued

---

### Priority 2.2: User Account Linking Service

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

- [ ] Implement account lookup by OAuth provider ID
- [ ] Implement account lookup by email
- [ ] Implement auto-linking for verified emails
- [ ] Implement manual linking flow
- [ ] Add conflict handling (email exists)
- [ ] Add audit logging for OAuth events

**Success Criteria:**

- [ ] Existing OAuth users recognized
- [ ] Email matching auto-links (if verified)
- [ ] New users created correctly
- [ ] Conflicts handled gracefully

---

### Priority 2.3: Database Schema Updates

**Effort:** 1 hour
**Impact:** Stores OAuth account data

**Tasks:**

- [ ] Add `OAuthAccount` model to schema.prisma
- [ ] Add relation to `User` model
- [ ] Create and run migration
- [ ] Generate Prisma client

**Commands:**

```bash
# After updating schema.prisma
pnpm db:auth:generate
pnpm db:auth:migrate --name add_oauth_accounts
```

**Success Criteria:**

- [ ] Migration runs successfully
- [ ] Prisma client updated
- [ ] No breaking changes to existing data

---

### Priority 2.4: MFA Integration for Social Users

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

- [ ] Add MFA check after OAuth profile received
- [ ] Create MFA recommendation page/flow
- [ ] Integrate with existing `/auth/mfa/verify` endpoint
- [ ] Store MFA preference for social users

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

- [ ] MFA enforced for users who have it enabled
- [ ] MFA recommendation shown to new social users
- [ ] Users can skip MFA recommendation
- [ ] MFA setup works for social-only users

---

## Phase 3: Frontend Integration

### Priority 3.1: Social Login Buttons Component

**Effort:** 2 hours
**Impact:** Reusable social login UI

**File:** `libs/shared-design-system/src/lib/components/SocialLoginButtons.tsx`

```typescript
import * as React from 'react';
import { Button } from './Button';
import {
  GoogleIcon,
  GitHubIcon,
  FacebookIcon,
  LinkedInIcon,
  TwitterIcon
} from './icons/social';

export interface SocialLoginButtonsProps {
  onProviderClick: (provider: string) => void;
  disabled?: boolean;
  loading?: string | null; // Provider currently loading
  enabledProviders?: string[]; // Subset of providers to show
}

const providers = [
  { id: 'google', name: 'Google', icon: GoogleIcon, bgColor: 'bg-white', textColor: 'text-gray-700', borderColor: 'border-gray-300' },
  { id: 'github', name: 'GitHub', icon: GitHubIcon, bgColor: 'bg-gray-900', textColor: 'text-white', borderColor: 'border-gray-900' },
  { id: 'facebook', name: 'Facebook', icon: FacebookIcon, bgColor: 'bg-blue-600', textColor: 'text-white', borderColor: 'border-blue-600' },
  { id: 'linkedin', name: 'LinkedIn', icon: LinkedInIcon, bgColor: 'bg-blue-700', textColor: 'text-white', borderColor: 'border-blue-700' },
  { id: 'twitter', name: 'X', icon: TwitterIcon, bgColor: 'bg-black', textColor: 'text-white', borderColor: 'border-black' },
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
          className={`w-full ${provider.bgColor} ${provider.textColor} border ${provider.borderColor} hover:opacity-90`}
          onClick={() => onProviderClick(provider.id)}
          disabled={disabled || loading !== null}
        >
          {loading === provider.id ? (
            <Spinner className="mr-2 h-4 w-4" />
          ) : (
            <provider.icon className="mr-2 h-4 w-4" />
          )}
          Continue with {provider.name}
        </Button>
      ))}
    </div>
  );
}
```

**Tasks:**

- [ ] Create `SocialLoginButtons` component
- [ ] Create social provider icons (Google, GitHub, Facebook, LinkedIn, X)
- [ ] Add loading states
- [ ] Add disabled states
- [ ] Export from shared-design-system
- [ ] Add unit tests

**Files to Create:**

- `libs/shared-design-system/src/lib/components/SocialLoginButtons.tsx`
- `libs/shared-design-system/src/lib/components/icons/social/` (icon components)

**Success Criteria:**

- [ ] Component renders all providers
- [ ] Click events fire correctly
- [ ] Loading/disabled states work
- [ ] Styling matches design system

---

### Priority 3.2: Sign In Page Integration

**Effort:** 2 hours
**Impact:** Adds social login to signin

**File:** `apps/auth-mfe/src/components/SignIn.tsx`

**Changes:**

- Add `SocialLoginButtons` component
- Add "or" divider between social and email login
- Handle social login redirect
- Handle OAuth callback redirect

**Layout:**

```
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

**Tasks:**

- [ ] Add `SocialLoginButtons` to SignIn component
- [ ] Add divider with "or" text
- [ ] Implement `handleSocialLogin(provider)` function
- [ ] Add API base URL configuration for OAuth redirect
- [ ] Handle errors from OAuth callback

**Success Criteria:**

- [ ] Social buttons appear on signin page
- [ ] Clicking button redirects to Auth0
- [ ] Successful login returns to app
- [ ] Errors displayed appropriately

---

### Priority 3.3: Sign Up Page Integration

**Effort:** 1 hour
**Impact:** Adds social signup option

**File:** `apps/auth-mfe/src/components/SignUp.tsx`

**Changes:**

- Add `SocialLoginButtons` component (same as SignIn)
- Social signup creates new user automatically
- Same redirect flow as SignIn

**Tasks:**

- [ ] Add `SocialLoginButtons` to SignUp component
- [ ] Add "or" divider
- [ ] Reuse same OAuth redirect logic

**Success Criteria:**

- [ ] Social buttons appear on signup page
- [ ] New user created on first social login
- [ ] Existing user with same email handled

---

### Priority 3.4: Account Linking UI (Profile Page)

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

- [ ] Create `LinkedAccounts` component
- [ ] Create `useLinkedAccounts` hook (TanStack Query)
- [ ] Create `useLinkAccount` mutation
- [ ] Create `useUnlinkAccount` mutation
- [ ] Add to profile page
- [ ] Handle link flow (OAuth redirect + callback)
- [ ] Add confirmation dialog for unlinking

**Files to Create:**

- `apps/profile-mfe/src/components/LinkedAccounts.tsx`
- `apps/profile-mfe/src/hooks/useOAuthAccounts.ts`

**Success Criteria:**

- [ ] Users can see linked accounts
- [ ] Users can link new accounts
- [ ] Users can unlink accounts
- [ ] Cannot unlink if only auth method

---

### Priority 3.5: MFA Recommendation Page

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

- [ ] Create `MfaRecommendation` component
- [ ] Add route in shell app
- [ ] Handle "Enable MFA" flow
- [ ] Handle "Skip" flow
- [ ] Store "Don't show again" preference

**Success Criteria:**

- [ ] Page shown after first social login
- [ ] Enable MFA works
- [ ] Skip works
- [ ] Don't show again preference persisted

---

## Phase 4: Testing & Security

### Priority 4.1: Unit & Integration Tests

**Effort:** 4 hours
**Impact:** Ensures reliability

**Test Files to Create:**

#### Backend Tests

- `apps/auth-service/src/services/oauth.service.spec.ts`
- `apps/auth-service/src/controllers/oauth.controller.spec.ts`

**Test Cases:**

- [ ] Authorization URL generation (each provider)
- [ ] Callback handling (success)
- [ ] Callback handling (error from Auth0)
- [ ] User creation from OAuth profile
- [ ] User lookup by OAuth provider ID
- [ ] Account linking (new link)
- [ ] Account linking (already linked)
- [ ] Account unlinking
- [ ] Cannot unlink last auth method
- [ ] MFA required flow
- [ ] MFA recommendation flow

#### Frontend Tests

- `libs/shared-design-system/src/lib/components/SocialLoginButtons.spec.tsx`
- `apps/auth-mfe/src/components/MfaRecommendation.spec.tsx`
- `apps/profile-mfe/src/components/LinkedAccounts.spec.tsx`

**Test Cases:**

- [ ] Social buttons render correctly
- [ ] Click handlers fire
- [ ] Loading states display
- [ ] MFA recommendation renders
- [ ] Linked accounts list renders
- [ ] Link/unlink flows work

**Success Criteria:**

- [ ] All unit tests pass
- [ ] Coverage > 70% for new code

---

### Priority 4.2: E2E Tests

**Effort:** 3 hours
**Impact:** Validates end-to-end flows

**File:** `apps/shell-e2e/src/social-login.spec.ts`

**Test Cases:**

- [ ] New user signs up with Google
- [ ] Existing user signs in with Google
- [ ] User with MFA signs in with Google (MFA required)
- [ ] User links GitHub to existing account
- [ ] User unlinks social account
- [ ] Error handling (Auth0 error, user cancels)

**Note:** E2E tests for OAuth are tricky. Consider:

- Mock Auth0 responses in test environment
- Use Auth0's test users feature
- Or skip OAuth redirect, test callback handler directly

**Success Criteria:**

- [ ] Critical flows covered
- [ ] Tests run in CI

---

### Priority 4.3: Security Audit

**Effort:** 2 hours
**Impact:** Ensures security

**Security Checklist:**

- [ ] CSRF protection via state parameter
- [ ] State parameter stored in Redis with expiry
- [ ] Auth0 tokens encrypted before storage
- [ ] No sensitive data in frontend logs
- [ ] OAuth callback validates state
- [ ] Rate limiting on OAuth endpoints
- [ ] Audit logging for OAuth events
- [ ] Account linking requires email verification
- [ ] Cannot link account already linked to another user

**Tasks:**

- [ ] Review code for security issues
- [ ] Test for CSRF vulnerabilities
- [ ] Test for open redirect vulnerabilities
- [ ] Verify token handling
- [ ] Document security considerations

**Success Criteria:**

- [ ] No critical vulnerabilities
- [ ] Security best practices followed

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

```
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

- `auth0` - Auth0 SDK for Node.js
- No frontend SDK needed (redirect-based flow)

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

_To be added during implementation_

---

## Appendix B: API Response Examples

### Authorization Redirect

```
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

```
GET /api/auth/oauth/callback?code=AUTH0_CODE&state=STATE

→ 302 Redirect to:
https://localhost/oauth-callback#
  access_token=YOUR_JWT_ACCESS_TOKEN&
  refresh_token=YOUR_JWT_REFRESH_TOKEN&
  expires_in=900
```

### Callback Success (MFA Required)

```
GET /api/auth/oauth/callback?code=AUTH0_CODE&state=STATE

→ 302 Redirect to:
https://localhost/mfa-verify?
  mfaToken=TEMP_MFA_TOKEN&
  returnUrl=/dashboard
```

### Callback Success (MFA Recommended - First Login)

```
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
