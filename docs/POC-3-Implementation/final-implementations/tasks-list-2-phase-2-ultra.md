# Task List v2 — Phase 2 (Ultra-Atomic)
## Frontend & MFE Security Hardening

**Phase:** 2 of 5  
**Prerequisite:** Phase 1 complete, Gate 1 PASSED  
**Gate:** 🚦 Gate 2 — Frontend & MFE Security Sign-off  
**Tracking Rule:** Check items only after verification passes.

---

# TASK 2.1 — Content Security Policy (CSP) Hardening

## Policy Design
- [ ] Current CSP located
- [ ] Current directives inventoried
- [ ] unsafe-inline identified
- [ ] unsafe-eval identified
- [ ] Allowed origins documented

## Code & Config
- [ ] unsafe-inline removed
- [ ] unsafe-eval removed
- [ ] script-src restricted
- [ ] connect-src restricted
- [ ] CSP report-only enabled
- [ ] CSP enforced

## Verification
- [ ] Shell loads without CSP errors
- [ ] All MFEs load successfully
- [ ] Inline script blocked

---

# TASK 2.2 — Module Federation Remote Integrity Verification

## Design
- [ ] Signature mechanism chosen
- [ ] Verification location defined
- [ ] Trusted public keys strategy defined

## Code Implementation
- [ ] remoteEntry hash generated
- [ ] remoteEntry signed at build
- [ ] Signature artifact emitted
- [ ] Runtime verification implemented
- [ ] Fail-closed behavior enforced

## Verification
- [ ] Valid remote loads
- [ ] Tampered remote blocked

---

# TASK 2.3 — Subresource Integrity (SRI)

## Hash Strategy
- [ ] Hash algorithm selected
- [ ] Hash generation point defined
- [ ] Hash storage documented

## Code Implementation
- [ ] Integrity hashes generated
- [ ] integrity attribute injected
- [ ] crossorigin attribute added

## Verification
- [ ] MFEs load normally
- [ ] Tampered bundle blocked by browser

---

# TASK 2.4 — CSRF Protection

## Token Strategy
- [ ] CSRF token format defined
- [ ] Storage mechanism chosen
- [ ] Rotation rules defined

## Code Implementation
- [ ] CSRF issuance endpoint created
- [ ] CSRF cookie set
- [ ] CSRF header required
- [ ] Server-side validation implemented

## Verification
- [ ] Mutation without token fails
- [ ] Mutation with token succeeds
- [ ] Token rotation verified

---

# TASK 2.5 — Frontend Authentication Hardening

## Session Model
- [ ] Cookie-based auth confirmed
- [ ] Cookie flags defined

## Code Changes
- [ ] Access token moved to HttpOnly cookie
- [ ] Refresh token moved to HttpOnly cookie
- [ ] localStorage token usage removed
- [ ] API client updated

## Verification
- [ ] Tokens inaccessible to JS
- [ ] Authenticated requests succeed
- [ ] Logout clears cookies

---

# TASK 2.6 — Frontend Supply Chain Security

## Policy
- [ ] Dependency scanning thresholds defined
- [ ] Build failure rules defined

## Tooling
- [ ] Dependency scanning enabled in CI
- [ ] Alerts configured

## Verification
- [ ] Vulnerable dependency introduced
- [ ] Build fails as expected

---

## PHASE 2 COMPLETION

- [ ] All Phase 2 tasks complete
- [ ] All verification steps passed
- [ ] No frontend critical vulnerabilities

🚦 **GATE 2 PASSED**
