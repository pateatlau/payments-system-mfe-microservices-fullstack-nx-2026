# Sentry Setup & Verification Guide

Complete guide for configuring and verifying Sentry error tracking and performance monitoring in the POC-3 monorepo.

## Prerequisites

- Sentry account with a project created (single project for both frontend + backend)
- Sentry DSN from project settings

## Environment Setup

### 1. Frontend Environment Variables (Build-Time)

Add these variables to your `.env` file (or set inline when running dev servers):

```bash
# Sentry DSN (reuse same DSN for frontend and backend)
NX_SENTRY_DSN=https://your-key@organization.ingest.sentry.io/project-id

# Release version (use semantic versioning)
NX_SENTRY_RELEASE=shell@1.0.0

# App version (for tagging events)
NX_APP_VERSION=1.0.0
```

**Note:** These are injected at build time via Rspack DefinePlugin. Restart dev servers after changing.

### 2. Backend Environment Variables (Runtime)

Add these variables to your `.env` file:

```bash
# Sentry DSN (same as frontend)
SENTRY_DSN=https://your-key@organization.ingest.sentry.io/project-id

# Environment (development, staging, production)
SENTRY_ENVIRONMENT=development

# Release version (use semantic versioning)
SENTRY_RELEASE=api-gateway@1.0.0
```

**Note:** Backend reads these at runtime. Restart services after changing.

## Verification

### Frontend Smoke Test

1. Start any MFE or shell:

   ```bash
   pnpm dev:shell
   # OR
   pnpm dev:admin-mfe
   ```

2. Open browser DevTools console

3. Trigger test errors:

   ```javascript
   // Test captured exception
   window.dispatchEvent(
     new ErrorEvent('error', {
       error: new Error('Sentry frontend smoke test'),
     })
   );

   // Test unhandled promise rejection
   Promise.reject(new Error('Sentry unhandled rejection test'));
   ```

4. Check Sentry dashboard:
   - Navigate to Issues
   - Confirm two events appear
   - Verify tags: `app`, `version`
   - Verify breadcrumbs and context

### Backend Smoke Test (Mock)

Run integration tests with mock DSNs (no actual Sentry traffic):

```bash
# All-in-one comprehensive test
pnpm tsx scripts/test-sentry-comprehensive.ts

# Individual tests
pnpm tsx scripts/test-sentry-integration.ts
pnpm tsx scripts/test-sentry-error-capture.ts
```

Expected output: All tests pass with "✅" indicators.

### Backend Smoke Test (Live)

Send a real error to Sentry using your DSN:

```bash
SENTRY_DSN="$(grep '^SENTRY_DSN=' .env | cut -d= -f2-)" node -e "const Sentry=require('@sentry/node'); Sentry.init({dsn: process.env.SENTRY_DSN, environment:'development', release:'api-gateway@1.0.0'}); Sentry.captureException(new Error('Backend smoke test')); setTimeout(()=>process.exit(0),1500);"
```

Check Sentry dashboard for the "Backend smoke test" error event.

## Features Verified

### ✅ Phase A: Frontend Environment Injection

- [x] NX_SENTRY_DSN, NX_SENTRY_RELEASE, NX_APP_VERSION injected via Rspack
- [x] All MFEs (auth, payments, admin, profile) + shell configured

### ✅ Phase B: Backend DSN Provisioning

- [x] SENTRY_DSN set for all services (api-gateway, auth, payments, admin, profile)
- [x] Backend Sentry init verified via test scripts

### ✅ Phase E: Tags, Context, and Sampling

- [x] App-level tags (`app`, `version`) set after init
- [x] User context (`setUser`/`clearUser`) wired in all apps
- [x] Sampling rates configured (dev: 1.0, prod: 0.1)

### ✅ Phase F: Ignore Lists & PII Scrubbing

- [x] Ignore common noise (ResizeObserver, extensions, network errors)
- [x] Deny URLs from browser extensions
- [x] Scrub sensitive data (tokens, passwords, auth headers) from events

## Common Issues

### DSN Not Found Warning

**Symptom:** Console shows `[Sentry] DSN not provided for <app>, skipping initialization`

**Fix:**

- Ensure `NX_SENTRY_DSN` is set in `.env` or inline
- Restart dev server after adding env var
- Verify DefinePlugin includes Sentry vars in rspack config

### 429 Rate Limit Errors

**Symptom:** Console shows `429 (Too Many Requests)` from Sentry ingest

**Fix:**

- Sentry quota exceeded; wait for reset or upgrade plan
- Temporarily unset DSNs: `unset NX_SENTRY_DSN SENTRY_DSN`
- Restart services without DSNs (graceful degradation)

### Events Not Appearing

**Symptom:** No events in Sentry dashboard after triggering errors

**Fix:**

1. Verify DSN is correct and matches your Sentry project
2. Check browser Network tab for successful Sentry requests
3. Confirm environment (dev/staging/prod) matches Sentry filters
4. Check ignore lists aren't filtering your test errors

### "express is not instrumented" Warning (Backend)

**Symptom:** Warning during Sentry init in backend services

**Fix:** This is expected when Express is imported before `Sentry.init()`. Our services call init early, so this can be ignored. For production, ensure `initSentry()` is the first call in your service entry point.

## Next Steps (Pending Implementation)

### Phase C: Router Instrumentation (React Router v7)

- [ ] Investigate React Router v7 compatibility with Sentry
- [ ] Add navigation transaction tracking

### Phase D: Network Error Capture

- [ ] GraphQL error capture in payments-mfe
- [ ] WebSocket error capture in shared-websocket

### Phase G: CI/CD Source Maps

- [ ] Upload source maps to Sentry during CI builds
- [ ] Verify de-minified stack traces in production

### Phase I: Alerting & Dashboards

- [ ] Configure alert rules for error rates and critical issues
- [ ] Create saved searches and dashboards by app/service

## Useful Commands

```bash
# Start all frontend MFEs
pnpm dev:mf

# Start all backend services
pnpm dev:backend

# Kill all dev servers
pnpm kill:all
pnpm backend:kill

# Check backend service health
pnpm backend:status

# Clear Sentry events (in Sentry UI only; no local command)
```

## Reference

- [Sentry Docs](https://docs.sentry.io/)
- [Sentry React Integration](https://docs.sentry.io/platforms/javascript/guides/react/)
- [Sentry Node Integration](https://docs.sentry.io/platforms/node/)
- [Implementation Plan](./SENTRY-FULL-IMPLEMENTATION-PLAN.md)
