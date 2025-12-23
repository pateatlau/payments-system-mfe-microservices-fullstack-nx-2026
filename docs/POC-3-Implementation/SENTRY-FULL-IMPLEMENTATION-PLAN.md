# Sentry Full Implementation Plan (POC-3)

Unify error tracking and performance monitoring across frontend MFEs + shell and all backend services. This plan provides granular, testable steps with verification and rollback guidance per step.

## Objectives

- Centralized, privacy-safe error monitoring and performance tracing across all apps/services.
- Consistent user context, tags, and releases for actionable diagnostics.
- CI/CD-managed Sentry releases with uploaded source maps for readable stacks.

## Non-Goals

- Replace existing logging/metrics/tracing stacks (Prometheus, OpenTelemetry) — Sentry complements them.
- Redesign of app architecture; only observability integration.

---

## Approach Summary

- Use shared libs for Sentry init on frontend ([libs/shared-observability/src/lib/sentry.ts]) and backend ([libs/backend/observability/src/lib/sentry.ts]).
- Wire Error Boundaries at app roots; set user context via shared auth store.
- Inject DSNs and release/version at build/run-time.
- Instrument router navigation and network (GraphQL/WebSocket) errors.
- Add CI steps for releases + source map upload.

---

## Task List (Granular)

### A) Frontend Environment Injection (rspack) — DSN + Release + Version

**Implement:** Add Sentry env keys to each MFE + shell `rspack.config.js` `DefinePlugin` (alongside `NX_API_BASE_URL`, `NODE_ENV`).

- [x] apps/auth-mfe/rspack.config.js — inject `NX_SENTRY_DSN`, `NX_SENTRY_RELEASE`, `NX_APP_VERSION`
- [x] apps/payments-mfe/rspack.config.js — same keys
- [x] apps/admin-mfe/rspack.config.js — same keys
- [x] apps/profile-mfe/rspack.config.js — same keys
- [x] apps/shell/rspack.config.js — same keys
- [x] libs/shared-observability/src/lib/sentry.ts — remove `VITE_*` fallbacks (legacy from POC-0 Vite→Rspack migration)

Example payload to merge under `new rspack.DefinePlugin({ 'process.env': JSON.stringify({ ... }) })`:

```js
NX_SENTRY_DSN: process.env.NX_SENTRY_DSN || '',
NX_SENTRY_RELEASE: process.env.NX_SENTRY_RELEASE || '',
NX_APP_VERSION: process.env.NX_APP_VERSION || '0.0.1',
```

**Note:** Using `NX_*` prefix only (Rspack convention). Legacy `VITE_*` fallbacks removed as part of POC-0→POC-1 Vite→Rspack migration cleanup.

**Verify:**

- Start any MFE; confirm the console does NOT show: "[Sentry] DSN not provided...".
- Trigger a smoke error (devtools):
  ```js
  // Frontend smoke
  throw new Error('Sentry smoke test: frontend');
  ```
- Confirm event appears in Sentry under the correct project with app name + version tags.
- TODO (pending quota reset): rerun the frontend smoke ingest once Sentry 429 limits clear. Restore DSNs first:
  ```bash
  export NX_SENTRY_DSN="https://9053f32a2a18ad35eb2e2bff18a1f73a@o4505871833759744.ingest.us.sentry.io/4510521861996544"
  export SENTRY_DSN="https://9053f32a2a18ad35eb2e2bff18a1f73a@o4505871833759744.ingest.us.sentry.io/4510521861996544"
  # Then restart services/MFEs and rerun the browser smoke tests
  ```

**Rollback:** Remove the added env keys from `DefinePlugin` if build issues arise.

---

### B) Backend Environment Provisioning — Services DSN

**Implement:** Provide `SENTRY_DSN` at runtime for all services:

- [x] apps/api-gateway — set `SENTRY_DSN` in `.env`/runtime
- [x] apps/auth-service — set `SENTRY_DSN`
- [x] apps/payments-service — set `SENTRY_DSN`
- [x] apps/admin-service — set `SENTRY_DSN`
- [x] apps/profile-service — set `SENTRY_DSN`

Optionally, add `SENTRY_ENVIRONMENT` and `SENTRY_RELEASE` (release defaults already computed in init).

**Verify:**

- Restart services; hit a 404 route (e.g., `/api/admin/nx`) to generate an error.
- Confirm backend events in Sentry with `serviceName` tags and environment set.

**Rollback:** Unset `SENTRY_DSN`; services continue without Sentry.

---

### C) Router Instrumentation (Frontend Navigation)

**⚠️ Note:** Project uses **React Router v7** (not v6). Sentry's `reactRouterV6Instrumentation` may not be compatible. Need to investigate v7 support or create custom navigation spans.

**Implement:** Enhance router tracing in [libs/shared-observability/src/lib/sentry.ts].

- [ ] **Investigate:** Check if Sentry has React Router v7 instrumentation support or if `reactRouterV6Instrumentation` works with v7.
- [ ] **Option A (if compatible):** Use Sentry's built-in instrumentation with v7 routing.
- [ ] **Option B (if not compatible):** Create custom navigation spans using `Sentry.startSpan()` around route changes, or hook into React Router v7's navigation events.
- [ ] Test with `BrowserRouter`; verify spans are created correctly.

**Verify:**

- Navigate between routes; confirm "navigation" transactions in Sentry Performance with correct route names.
- Check transaction names match actual routes (not generic "pageload").

**Rollback:** Remove `routingInstrumentation` from `Sentry.init` to revert to basic tracing.

**Risk Level:** Medium (65-70% confidence) — v7 is new; Sentry docs may not cover it yet.

---

### D) Network Error Capture — GraphQL & WebSocket

**Implement:**

- [ ] Payments MFE GraphQL: Update `onError` in [apps/payments-mfe/src/bootstrap.tsx] to call `captureException(error, { operationName, variables })` and add breadcrumb with `type: 'http'`, `category: 'graphql'`.
- [ ] Shared WebSocket: In `shared-websocket` provider, add `onError` to `captureException(err, ctx)`; add connect/disconnect message breadcrumbs with `category: 'ws'` and `level: 'info'`.

**Verify:**

- Induce GraphQL error (invalid query); see exceptions with operation tags in Sentry.
- Temporarily break WS URL; see connection errors captured and breadcrumbs for lifecycle.

**Rollback:** Limit capture to severe errors; remove noisy breadcrumbs.

---

### E) Tags, Context, and Sampling

**Implement:**

- [ ] Frontend `initSentry`: call `setTag('app', appName)` and `setTag('version', release)` after init.
- [ ] Confirm existing `setUser()`/`clearUser()` wiring in MFEs and shell remains active.
- [ ] Tune `tracesSampleRate` and profiling; dev: 1.0, prod: 0.1 (already present).

**Verify:**

- Check new events for `app` and `version` tags; ensure user context is set after login.

**Rollback:** Remove extra tags if needed; restore sampling defaults.

---

### F) Ignore Lists & PII Policy

**Implement:** Extend `Sentry.init` options:

- [x] Add `ignoreErrors`: common browser extension/HMR noise, ResizeObserver quirks.
- [x] Add `denyUrls`: extension URLs (chrome-extension:// etc.).
- [x] Strengthen `beforeSend` scrubbers for tokens/passwords in request bodies and query strings.

**Verify:**

- Trigger known noisy errors; verify they’re filtered.
- Inspect event payloads to confirm headers/cookies/tokens are absent.

**Rollback:** Remove overly broad ignores that hide real issues.

---

### G) CI/CD — Releases & Source Map Upload

**Implement:** Configure CI for each frontend app to upload source maps using Sentry CLI.

- [ ] Add Sentry CLI install and auth via `SENTRY_AUTH_TOKEN` secret.
- [ ] Define release: `${appName}@${NX_APP_VERSION}` to match frontend init.
- [ ] Upload source maps from build `dist/apps/<app>` directories; include `--rewrite` and appropriate URL prefix.
- [ ] Finalize release after upload.

Sample CI steps:

```bash
sentry-cli releases new "$RELEASE"
sentry-cli releases files "$RELEASE" upload-sourcemaps dist/apps/admin-mfe --rewrite --url-prefix "~/"
sentry-cli releases finalize "$RELEASE"
```

**Verify:**

- Deploy, trigger a frontend error; confirm de-minified stack traces in Sentry.

**Rollback:** Disable upload steps; events stay minified.

---

### H) Documentation & Smoke Tests

**Implement:**

- [ ] Add a short setup guide under `docs/` (env keys, CI usage, verification commands).
- [ ] Leverage existing [scripts/test-sentry-error-capture.ts] to validate backend capture; add a tiny frontend smoke snippet to docs.

**Verify:**

- Run the test script locally and confirm events in Sentry.

**Rollback:** N/A (documentation only).

---

### I) Alerting & Dashboards

**Implement:**

- [ ] Configure Sentry alert rules for high error rate, new critical issues, and release health regressions.
- [ ] Create saved searches/dashboards by app/service; add ownership rules.

**Verify:**

- Simulate elevated error rate; ensure alert triggers to team channels.

**Rollback:** Tune thresholds or disable rules.

---

### J) Rollout Plan & Environments

**Order:** Backend DSNs → Frontend env injection → Router instrumentation → Network capture → CI releases/maps → Alerting.

- [ ] Dev rollout with verbose sampling; validate noise filters.
- [ ] Staging rollout with production-like sampling.
- [ ] Production rollout with conservative sampling and full CI release management.

**Verify:**

- Track project health and performance tabs across environments; confirm stability and signal quality.

**Rollback:** Disable DSNs per environment selectively; revert instrumentation features if needed.

---

## Acceptance Criteria

- Frontend/backends produce Sentry events with correct `app/service` + `version` tags and user context.
- Navigation transactions recorded in Performance; GraphQL/WS errors captured with breadcrumbs.
- CI uploads source maps; stack traces are readable (de-minified).
- Ignore lists and PII scrubbers prevent noisy or sensitive data leakage.

## Effort Estimate

- Env injection & backend DSNs: 0.5 day
- Router instrumentation (incl. React Router v7 investigation): 0.5–1 day
- Network capture: 0.5 day
- Tags/PII/sampling tuning: 0.5 day
- CI release + source maps: 0.5 day
- Docs, smoke tests, alerting: 0.5 day
- **Total:** ~3–3.5 days

## Risks & Mitigations

- **React Router v7 compatibility:** Sentry may not have official v7 support yet → investigate early; fallback to custom spans if needed.
- **Excessive noise:** Too many events/breadcrumbs → tighten `ignoreErrors`, sampling, and breadcrumbs.
- **PII leakage:** Sensitive data in events → extend `beforeSend` scrubbers; add periodic audits.
- **CI instability:** Source map upload failures → keep upload optional until stable.
- **Version drift:** Inconsistent release formats → standardize `NX_APP_VERSION` envs across apps/services.

## Completion Summary (Target)

- **A–B:** Environment injection complete; DSNs present for all apps/services.
- **C–D:** Router + network instrumentation active; events enriched.
- **E–F:** Tags, sampling, ignore lists, and scrubbers tuned.
- **G:** CI releases and source maps integrated.
- **H–I:** Documentation, smoke tests, and alerting live.
- **J:** Dev → staging → prod rollout executed with verification at each stage.
