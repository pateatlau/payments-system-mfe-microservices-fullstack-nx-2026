# Frontend Auth & Session Security Analysis

**Date:** December 25, 2025  
**Role:** Web Security Review  
**Scope:** MFE auth/session flows (frontend + auth-service)  
**Goal:** Harden tokens, sessions, and cookies; estimate effort for HTTPS-only HttpOnly cookies (session-only cookies)

---

## Executive Summary

### Current Implementation

- **Tokens in localStorage (Zustand persist)**: `accessToken` + `refreshToken` stored client-side (`shared-auth-store`).
- **Bearer strategy**: Axios interceptors attach `Authorization: Bearer <accessToken>` to all requests.
- **Refresh flow**: `/auth/refresh` returns **access token only** (refresh not rotated), refresh token stays in localStorage.
- **Logout**: Invalidates refresh token in DB when provided; otherwise wipes all user refresh tokens.
- **Cross-tab sync**: BroadcastChannel/localStorage sync propagates login/logout/token refresh across tabs.
- **CORS**: `credentials: true`, allowed origins = localhost ports + https://localhost (nginx).
- **Session storage**: No cookies used; no HttpOnly/Secure/SameSite protection; CSRF tokens absent.

### High-Risk Gaps

- **XSS → Token theft**: Tokens in localStorage are readable by injected script (no HttpOnly cookies).
- **No refresh rotation**: Refresh token reused indefinitely until expiry; replayable if stolen.
- **No CSRF defense**: When cookies are introduced, CSRF tokens and SameSite must be enforced.
- **No device binding**: Refresh tokens not bound to device/user-agent/IP; theft undetected.
- **MFEs trust shared store blindly**: Any compromised remote can read/write tokens from shared store/event bus.

### HTTPS-Only HttpOnly Cookies (Session-Only Cookies) – Effort & Plan

- **Effort:** ~6-8 hours total (backend 3-4h, frontend 2-3h, tests 1h)
- **What changes:**
  - Move **access + refresh tokens to HttpOnly, Secure, SameSite=Strict cookies** (session-only if desired via `maxAge` omitted).
  - Switch API client to **cookie-based auth** (`withCredentials=true`), stop persisting tokens in localStorage.
  - Add **CSRF token endpoint + header** for state-changing requests when cookies are used.
  - Update CORS to allow credentials from approved origins and block others.
  - Rotate refresh token on **every refresh** and set new cookie pair; invalidate old refresh tokens in DB.

---

## Findings (Code References)

- **Auth store persists tokens in localStorage**: [libs/shared-auth-store/src/lib/shared-auth-store.ts](../../libs/shared-auth-store/src/lib/shared-auth-store.ts#L21-L140)
- **Access/refresh tokens shared via event bus**: [libs/shared-auth-store/src/lib/shared-auth-store.ts](../../libs/shared-auth-store/src/lib/shared-auth-store.ts#L58-L135)
- **Refresh endpoint returns only access token**: [apps/auth-service/src/services/auth.service.ts](../../apps/auth-service/src/services/auth.service.ts#L247-L284)
- **Logout invalidates refresh in DB but relies on client body**: [apps/auth-service/src/controllers/auth.controller.ts](../../apps/auth-service/src/controllers/auth.controller.ts#L76-L119)
- **Axios interceptors attach Bearer token from memory/localStorage**: [libs/shared-api-client/src/lib/interceptors.ts](../../libs/shared-api-client/src/lib/interceptors.ts#L24-L180)
- **No cookies set; CORS allows credentials**: [apps/auth-service/src/main.ts](../../apps/auth-service/src/main.ts#L35-L92)
- **Session sync uses BroadcastChannel/localStorage**: [libs/shared-session-sync/src/lib/session-sync.ts](../../libs/shared-session-sync/src/lib/session-sync.ts#L1-L170)

---

## Risk Assessment

| Risk                               | Current Impact                           | Severity    | Fix Priority             |
| ---------------------------------- | ---------------------------------------- | ----------- | ------------------------ |
| XSS → token theft (localStorage)   | Full account takeover if script injected | 🔴 Critical | Week 1                   |
| Refresh token replay (no rotation) | Stolen refresh valid until expiry        | 🔴 Critical | Week 1                   |
| CSRF once cookies are added        | State changes without user intent        | 🔴 Critical | Week 1 (with cookies)    |
| MITM of remote MFEs                | Malicious MFE can read/write auth store  | 🔴 Critical | Parallel (MFE hardening) |
| No device/user-agent binding       | Stolen token works anywhere              | 🟠 Medium   | Week 2                   |

---

## HTTPS-Only HttpOnly Cookies – Implementation Plan

### Backend (Auth Service) – 3-4h

1. **Issue cookies instead of JSON tokens** in `/auth/login`, `/auth/register`, `/auth/refresh`:
   - `Set-Cookie: accessToken=...; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=900` (15m)
   - `Set-Cookie: refreshToken=...; HttpOnly; Secure; SameSite=Strict; Path=/auth; Max-Age=604800` (7d) or session-only by omitting Max-Age.
2. **Rotate refresh token on every refresh**; delete old refresh token rows.
3. **Add CSRF token endpoint** (`/auth/csrf-token`) returning a nonce; expect `X-CSRF-Token` on unsafe methods.
4. **CORS**: `credentials: true`; restrict `origin` to known hosts; block `*`.
5. **Logout**: Clear cookies (`Set-Cookie ... Max-Age=0`) and delete refresh token in DB.

### Frontend MFEs – 2-3h

1. **Stop persisting tokens in localStorage**; remove `persist` middleware for tokens or limit to user profile only.
2. **API client**: enable `withCredentials` and remove Authorization header injection when cookies are present.
3. **CSRF**: fetch token once, store in memory, attach `X-CSRF-Token` on POST/PUT/PATCH/DELETE.
4. **Session sync**: broadcast only `isAuthenticated` + user profile; do **not** broadcast tokens.

### Optional Hardening – +2h

- **Device binding**: include `X-Device-ID` in login; store hash of device+UA; verify on refresh.
- **User-agent/IP binding**: store and compare; invalidate on mismatch.

### Effort Summary

- Backend: 3-4h
- Frontend: 2-3h
- Testing (Cypress/API + CSRF/XSS regression): 1h
- **Total:** 6-8h

---

## Minimal Change Set (Cookie-Based Auth)

1. **Backend**

```ts
// After successful login/refresh
res
  .cookie('accessToken', accessToken, {
    httpOnly: true,
    secure: true,
    sameSite: 'strict',
    path: '/',
    maxAge: 15 * 60 * 1000,
  })
  .cookie('refreshToken', refreshToken, {
    httpOnly: true,
    secure: true,
    sameSite: 'strict',
    path: '/auth',
    maxAge: 7 * 24 * 60 * 60 * 1000, // or omit for session-only
  })
  .json({ success: true, data: { user } });
```

2. **Frontend**

```ts
// Axios default
axios.defaults.withCredentials = true;

// Remove Authorization header injection when cookies are enabled
// Keep optional header for server-to-server if needed
```

3. **CSRF Token**

```ts
// Fetch once per session
const { csrfToken } = await fetch('/auth/csrf-token', {
  credentials: 'include',
}).then(r => r.json());
// Attach on mutations
fetch('/api/payments', {
  method: 'POST',
  credentials: 'include',
  headers: { 'Content-Type': 'application/json', 'X-CSRF-Token': csrfToken },
  body: JSON.stringify(payload),
});
```

4. **Rotate Refresh Token on Refresh**

- Endpoint returns **new access + new refresh cookies** every time.
- Invalidate previous refresh token in DB.

5. **Session-Only Cookie Option**

- Omit `maxAge` to make cookies session-only; aligns with request for “session-only cookies.”

---

## Testing Checklist

- ✅ Login sets HttpOnly, Secure, SameSite cookies
- ✅ Refresh rotates tokens and sets new cookies
- ✅ Logout clears cookies and refresh token in DB
- ✅ CSRF token required on POST/PUT/PATCH/DELETE (403 on missing/invalid)
- ✅ No tokens in localStorage/sessionStorage
- ✅ XSS attempt cannot read tokens (HttpOnly)
- ✅ Cross-tab sync works without exposing tokens

---

## Recommendations

1. **Move to HttpOnly Secure SameSite cookies immediately** to eliminate XSS token theft.
2. **Enable refresh rotation** on every refresh; invalidate old tokens.
3. **Add CSRF tokens** concurrently with cookie rollout.
4. **Remove token persistence from localStorage**; rely on cookies + short-lived access tokens.
5. **Tighten CORS origins** to exact hostnames; require credentials.
6. **Plan device binding** post-launch for additional assurance.

---

## Next Actions (Sequenced)

- Day 1: Backend cookie issuance + CORS tightening + refresh rotation.
- Day 2: Frontend switch to cookie auth, remove token persistence, add CSRF header.
- Day 2: Tests (login, refresh, logout, CSRF negative tests, XSS token access attempt).

---

**Status:** Proposed  
**Owner:** Security/Platform  
**Blocking:** Production readiness (tokens in localStorage = critical risk)
