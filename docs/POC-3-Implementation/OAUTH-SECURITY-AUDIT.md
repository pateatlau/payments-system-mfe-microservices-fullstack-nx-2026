# OAuth Social Login Security Audit

**Date:** 2026-01-24
**Phase:** 4.3 Security Audit
**Status:** COMPLETED

## Executive Summary

This security audit reviewed the OAuth/Social Login implementation using Auth0 as a federation layer. The implementation follows security best practices and addresses common OAuth vulnerabilities.

**Overall Assessment:** ✅ SECURE - No critical vulnerabilities found

---

## Security Checklist Results

### 1. CSRF Protection via State Parameter ✅

**Implementation:** `apps/auth-service/src/services/oauth.service.ts`

```typescript
// Line 114-116: Cryptographically secure state generation
function generateState(): string {
  return crypto.randomBytes(32).toString('hex');
}
```

- State parameter is a 64-character hex string (256 bits of entropy)
- Generated using Node.js `crypto.randomBytes()` - cryptographically secure
- Stored in Redis with TTL for one-time use validation

### 2. State Parameter Stored in Redis with Expiry ✅

**Implementation:** `apps/auth-service/src/services/oauth.service.ts`

```typescript
// Lines 156-158: Redis storage with 10-minute TTL
await cache.set(`${OAUTH_STATE_PREFIX}${state}`, stateData, {
  ttl: OAUTH_STATE_TTL, // 600 seconds = 10 minutes
});
```

- State stored in Redis cache with `oauth:state:` prefix
- 10-minute TTL prevents stale state attacks
- State is deleted after use (one-time use)

### 3. Auth0 Tokens Encrypted Before Storage ✅

**Implementation:** `apps/auth-service/src/utils/encryption.ts`

```typescript
// AES-256-GCM encryption for sensitive data
const ENCRYPTION_CONFIG = {
  algorithm: 'aes-256-gcm' as const,
  ivLength: 16,
  authTagLength: 16,
  keyLength: 32, // 256 bits
};
```

**OAuth tokens encrypted at storage:**
- `apps/auth-service/src/services/oauth.service.ts` line 266, 301, 389, 487:
  ```typescript
  accessToken: encryptOptional(providerAccessToken),
  refreshToken: encryptOptional(providerRefreshToken),
  ```

- Uses AES-256-GCM with authenticated encryption
- Random IV for each encryption operation
- Auth tag prevents tampering
- Production requires `MFA_ENCRYPTION_KEY` environment variable

### 4. No Sensitive Data in Frontend Logs ✅

**Implementation:** `apps/auth-mfe/src/components/OAuthCallback.tsx`

**Fixed during audit (previously logged full URL with tokens):**
```typescript
// SECURITY: Log only non-sensitive info (hash contains tokens)
console.log('[OAuthCallback] Processing callback...');
console.log('[OAuthCallback] Pathname:', window.location.pathname);
console.log('[OAuthCallback] Has hash:', window.location.hash.length > 0);
console.log('[OAuthCallback] Has search params:', window.location.search.length > 0);
```

**Token logging uses boolean checks only:**
```typescript
console.log('[OAuthCallback] Extracted tokens:', {
  hasAccessToken: !!accessToken,  // boolean, not actual token
  hasRefreshToken: !!refreshToken,
  isNewUser,
  hashLength: hash.length
});
```

### 5. OAuth Callback Validates State ✅

**Implementation:** `apps/auth-service/src/services/oauth.service.ts`

```typescript
// Lines 191-203: State validation in handleOAuthCallback
const stateKey = `${OAUTH_STATE_PREFIX}${state}`;
const stateData = await cache.get<OAuthStateData>(stateKey);

if (!stateData) {
  throw new ApiError(
    400,
    'INVALID_STATE',
    'OAuth state is invalid or expired. Please try again.'
  );
}

// Delete state (one-time use)
await cache.delete(stateKey);
```

- State retrieved from Redis
- Invalid/expired state returns 400 error
- State immediately deleted after retrieval (prevents replay attacks)

### 6. Rate-Limiting on OAuth Endpoints ✅

**Implementation:** `apps/api-gateway/src/middleware/rateLimit.ts` + `apps/api-gateway/src/routes/proxy-routes.ts`

```typescript
// OAuth-specific rate limiter: 10 requests per 15 minutes per IP
export const oauthRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // 10 OAuth initiations per 15 minutes
  message: {
    success: false,
    error: {
      code: 'RATE_LIMIT_EXCEEDED',
      message: 'Too many OAuth requests, please try again later',
    },
  },
  keyGenerator: (req) => `oauth:${req.ip}`,
});
```

**Rate limiting applied to:**
- `GET /api/auth/oauth/:provider` - OAuth initiation (stricter: 10/15min)
- `POST /api/auth/oauth/link/:provider` - Account linking (stricter: 10/15min)

**Rate limiting NOT applied to (uses general limiter):**
- `GET /api/auth/oauth/callback` - Provider callback (not user-initiated)
- `GET /api/auth/oauth/providers` - Public info endpoint
- `GET /api/auth/oauth/accounts` - Authenticated endpoint
- `DELETE /api/auth/oauth/:provider` - Authenticated unlink

### 7. Audit Logging for OAuth Events ✅

**Implementation:** RabbitMQ events published for all OAuth operations

```typescript
// User created via OAuth
await publishUserCreated({ userId, email, name, role, emailVerified, createdAt });

// User login via OAuth
await publishUserLogin({ userId, email, loginAt, ipAddress });

// OAuth account linked
await publishOAuthLinked({ userId, provider, providerAccountId, linkedAt });

// OAuth account unlinked
await publishOAuthUnlinked({ userId, provider, unlinkedAt });
```

- Events published to RabbitMQ for async processing
- Includes user ID, provider, timestamps, and IP addresses
- Suitable for security monitoring and compliance

### 8. Account Linking Requires Email Verification ✅

**Implementation:** `apps/auth-service/src/services/oauth.service.ts`

```typescript
// Lines 284-328: Auto-linking only when BOTH emails verified
if (profile.emailVerified && existingUser.emailVerified) {
  // Both emails verified - safe to auto-link
  oauthAccount = await prisma.oAuthAccount.create({...});
} else {
  // SECURITY: Email not verified - require manual linking
  throw new ApiError(
    409,
    'EMAIL_EXISTS_UNVERIFIED',
    'An account with this email already exists. Please sign in with your password and link your social account from your profile settings.'
  );
}
```

- Auto-linking only occurs when BOTH provider email AND database email are verified
- Unverified emails require manual account linking via profile settings
- Prevents account takeover via unverified email addresses

### 9. Cannot Link Account Already Linked to Another User ✅

**Implementation:** `apps/auth-service/src/services/oauth.service.ts`

```typescript
// Lines 437-460: Check for existing links
const existingOAuth = await prisma.oAuthAccount.findUnique({
  where: {
    provider_providerAccountId: {
      provider: profile.provider,
      providerAccountId: profile.providerAccountId,
    },
  },
});

if (existingOAuth) {
  if (existingOAuth.userId === userId) {
    throw new ApiError(400, 'ALREADY_LINKED', '...');
  } else {
    throw new ApiError(400, 'ACCOUNT_LINKED_TO_ANOTHER_USER', '...');
  }
}
```

- Unique constraint on `(provider, providerAccountId)` prevents duplicate links
- Service layer validation provides clear error messages
- Also checks if user already has a different account from same provider linked

---

## Security Tasks Completed

### Code Review for Security Issues ✅

- Reviewed OAuth service, controller, Auth0 client
- Reviewed input validators and encryption utilities
- Reviewed frontend callback handler
- Fixed sensitive data logging issue in OAuthCallback.tsx

### CSRF Vulnerability Testing ✅

- State parameter properly validated
- State stored in Redis with TTL
- State deleted after use (one-time)
- Missing/invalid state returns 400 error

### Open Redirect Vulnerability Testing ✅

**Implementation:** `apps/auth-service/src/validators/oauth.validators.ts`

```typescript
// Lines 47-87: Comprehensive return URL validation
function isValidReturnUrl(url: string): boolean {
  // Empty or default is safe
  if (!url || url === '/') return true;

  // Check for protocol-relative URLs (//evil.com)
  if (trimmed.startsWith('//')) return false;

  // Check for dangerous protocols
  if (lowerUrl.startsWith('javascript:') ||
      lowerUrl.startsWith('data:') ||
      lowerUrl.startsWith('vbscript:') ||
      lowerUrl.startsWith('file:')) {
    return false;
  }

  // Check for relative paths (safe)
  if (trimmed.startsWith('/') && !trimmed.startsWith('//')) {
    if (/[\r\n]/.test(trimmed)) return false;
    return true;
  }

  // Check for absolute URLs - must be from allowed origins
  const parsed = new URL(trimmed);
  const origin = `${parsed.protocol}//${parsed.host}`;
  return ALLOWED_ORIGINS.some(allowed =>
    origin.toLowerCase() === allowed.toLowerCase()
  );
}
```

Protections:
- Protocol-relative URLs blocked (`//evil.com`)
- Dangerous protocols blocked (javascript:, data:, vbscript:, file:)
- Newline characters blocked (header injection)
- Absolute URLs validated against allowlist
- Relative paths allowed (safe)

### Token Handling Verification ✅

**Access Token (Frontend):**
- Stored in Zustand store (memory only)
- Passed via URL fragment (not sent to server, not in browser history after clearing)
- Hash cleared from URL after processing

**Refresh Token (Backend):**
- Stored in database with hashing
- HTTP-only cookie for browser storage
- 7-day expiration

**OAuth Provider Tokens:**
- Encrypted with AES-256-GCM before database storage
- Never exposed to frontend
- Used only for backend API calls to provider if needed

---

## Security Considerations Documented

### 1. Token Security

| Token Type | Storage Location | Expiration | Protection |
|------------|-----------------|------------|------------|
| Access Token | Memory (Zustand) | 15 minutes | JWT signature |
| Refresh Token | HTTP-only cookie + DB | 7 days | Encrypted, fingerprinted |
| OAuth Access Token | Database | Provider-defined | AES-256-GCM encrypted |
| OAuth Refresh Token | Database | Provider-defined | AES-256-GCM encrypted |
| MFA Token | Memory (temporary) | 5 minutes | JWT signature |

### 2. Session Management

- OAuth login invalidates all existing refresh tokens (single session policy)
- Token family tracking prevents refresh token reuse
- Fingerprinting detects stolen tokens from different devices

### 3. Account Security

- Social-only users have `hasPassword: false` flag
- Cannot unlink last authentication method (must have password OR another OAuth)
- Email verification required for sensitive operations

### 4. Error Handling

- Errors logged to console with stack traces (backend only)
- User-facing errors are generic (no internal details leaked)
- OAuth errors from provider displayed with message

---

## Recommendations

### Implemented During Audit

1. ✅ **Fixed sensitive data logging** in `OAuthCallback.tsx`
   - Changed from logging full URL/hash to logging boolean indicators only

2. ✅ **Added stricter OAuth rate limiting**
   - Created `oauthRateLimiter` (10 requests per 15 minutes per IP)
   - Applied to OAuth initiation and account linking endpoints
   - Prevents OAuth abuse while allowing legitimate use

### Future Enhancements (Not Critical)

1. **OAuth State in Encrypted Cookies**
   - Alternative to Redis for state storage
   - Would work without Redis dependency

3. **Account Compromise Detection**
   - Alert user when new OAuth provider linked
   - Email notification on OAuth login from new location

---

## Conclusion

The OAuth/Social Login implementation follows industry best practices:

✅ CSRF protection with cryptographically secure state parameter
✅ State parameter validated and single-use
✅ OAuth tokens encrypted at rest with AES-256-GCM
✅ No sensitive data in frontend logs (fixed during audit)
✅ Open redirect prevention with URL validation
✅ OAuth-specific rate limiting (10 req/15min for initiation endpoints)
✅ Comprehensive audit logging via RabbitMQ events
✅ Email verification required for account linking
✅ Prevents linking to accounts owned by other users

**Security Rating:** SECURE - Ready for production deployment

---

## Files Reviewed

### Backend
- `apps/auth-service/src/services/oauth.service.ts`
- `apps/auth-service/src/controllers/oauth.controller.ts`
- `apps/auth-service/src/lib/auth0.ts`
- `apps/auth-service/src/validators/oauth.validators.ts`
- `apps/auth-service/src/utils/encryption.ts`
- `apps/auth-service/src/routes/oauth.ts`

### Frontend
- `apps/auth-mfe/src/components/OAuthCallback.tsx`
- `apps/auth-mfe/src/components/SignIn.tsx`
- `apps/auth-mfe/src/components/SocialLoginButtons.tsx`
- `apps/auth-mfe/src/components/MfaRecommendation.tsx`
- `apps/profile-mfe/src/components/LinkedAccounts.tsx`

### Infrastructure
- `apps/api-gateway/src/middleware/rateLimit.ts`
- `apps/api-gateway/src/routes/proxy-routes.ts`
