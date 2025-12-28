# Implementation Plan v2 — Phase 2 (Ultra-Atomic)
## Frontend & MFE Security Hardening (BLOCKING AFTER GATE 1)

**Phase:** 2 of 5  
**Granularity:** Ultra-Atomic (Infra → Code → Tests)  
**Prerequisite:** Phase 1 completed, Gate 1 PASSED  
**Gate:** 🚦 Gate 2 — Frontend & MFE Security Sign-off  
**Execution Rule:** Execute ONE sub-task at a time. Verify before proceeding.

---

## Scope of Phase 2

This phase hardens the **frontend shell and all MFEs** against:
- XSS
- Supply-chain attacks
- Remote code injection via Module Federation
- CSRF
- Session/token leakage

No CI/CD rollout or production exposure may begin until Phase 2 is complete.

---

# TASK 2.1 — Content Security Policy (CSP) Hardening

## Objective
Eliminate script injection vectors and tighten runtime execution boundaries.

---

## Dimension A — Policy Design

### 2.1.A.1 Inventory Current CSP
1. Locate CSP configuration (nginx / headers middleware).
2. Document current directives.
3. Identify use of `unsafe-inline`.
4. Identify use of `unsafe-eval`.
5. List all script/style/font/image origins currently allowed.

---

### 2.1.A.2 Target CSP Definition
1. Define final CSP without `unsafe-inline`.
2. Define final CSP without `unsafe-eval`.
3. Restrict `script-src` to:
   - self
   - explicit MFE origins
4. Restrict `connect-src` to API + WebSocket endpoints.
5. Document expected CSP violations during rollout.

---

## Dimension B — Code & Config Changes

### 2.1.B.1 Apply Hardened CSP
1. Update CSP config to remove `unsafe-inline`.
2. Update CSP config to remove `unsafe-eval`.
3. Explicitly enumerate allowed origins.
4. Enable CSP report-only mode initially.

---

### 2.1.B.2 Enforce CSP
1. Review CSP violation reports.
2. Fix legitimate violations.
3. Switch CSP from report-only to enforced.

---

## Dimension C — Verification & Tests

### 2.1.C.1 Manual Verification
1. Load shell application.
2. Load each MFE route.
3. Confirm no CSP violations in console.

### 2.1.C.2 Negative Verification
1. Inject inline script in devtools.
2. Confirm script execution blocked.

---

# TASK 2.2 — Module Federation Remote Integrity Verification

## Objective
Prevent execution of tampered remoteEntry.js files.

---

## Dimension A — Design

### 2.2.A.1 Signature Strategy
1. Choose signature mechanism (hash + signature).
2. Decide verification location (shell runtime).
3. Define trusted public key storage strategy.

---

## Dimension B — Code Implementation

### 2.2.B.1 Build-Time Signature Generation
1. Generate hash of remoteEntry.js.
2. Sign hash using private key.
3. Emit signature file alongside bundle.

---

### 2.2.B.2 Runtime Verification
1. Fetch remoteEntry.js.
2. Fetch signature file.
3. Verify hash matches.
4. Verify signature validity.
5. Abort load on failure.

---

## Dimension C — Verification & Tests

### 2.2.C.1 Positive Case
1. Load valid remote.
2. Confirm MFE renders.

### 2.2.C.2 Negative Case
1. Tamper remoteEntry.js.
2. Confirm shell refuses to load MFE.

---

# TASK 2.3 — Subresource Integrity (SRI)

## Objective
Ensure browser-level integrity checks for remote bundles.

---

## Dimension A — Hash Strategy

1. Choose SHA-384.
2. Decide hash generation point (build).
3. Document hash storage.

---

## Dimension B — Code Implementation

1. Generate integrity hashes for bundles.
2. Inject `integrity` attribute into script tags.
3. Add `crossorigin` attribute.

---

## Dimension C — Verification

1. Load MFEs normally.
2. Tamper bundle content.
3. Confirm browser blocks execution.

---

# TASK 2.4 — CSRF Protection

## Objective
Protect authenticated mutation endpoints.

---

## Dimension A — Token Strategy

1. Decide CSRF token format.
2. Decide storage mechanism (cookie).
3. Define token rotation rules.

---

## Dimension B — Code Implementation

1. Create CSRF token issuance endpoint.
2. Set CSRF token cookie.
3. Require CSRF header on mutations.
4. Validate token server-side.

---

## Dimension C — Verification & Tests

1. Mutation without token fails.
2. Mutation with valid token succeeds.
3. Token rotation behaves correctly.

---

# TASK 2.5 — Frontend Authentication Hardening

## Objective
Eliminate token exposure to JavaScript.

---

## Dimension A — Session Model

1. Confirm cookie-based auth model.
2. Define cookie flags.

---

## Dimension B — Code Changes

1. Move access token to HttpOnly cookie.
2. Move refresh token to HttpOnly cookie.
3. Remove all localStorage/sessionStorage token usage.
4. Update API client to rely on cookies.

---

## Dimension C — Verification

1. Verify tokens not accessible via JS.
2. Verify authenticated requests still work.
3. Verify logout clears cookies.

---

# TASK 2.6 — Frontend Supply Chain Security

## Objective
Detect vulnerable or malicious dependencies.

---

## Dimension A — Policy

1. Define dependency scanning threshold.
2. Define build failure rules.

---

## Dimension B — Tooling

1. Enable dependency scanning in CI.
2. Configure alerts for critical vulns.

---

## Dimension C — Verification

1. Introduce known vulnerable dependency.
2. Confirm build fails.

---

## PHASE 2 EXIT CRITERIA

- CSP fully enforced
- MFEs load only when verified
- No frontend tokens accessible to JS
- CSRF enforced on all mutations
- Supply-chain scanning active

🚦 **GATE 2 PASSED**
