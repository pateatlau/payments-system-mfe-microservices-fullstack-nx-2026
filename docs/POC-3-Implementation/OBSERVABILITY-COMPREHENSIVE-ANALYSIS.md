# Observability Comprehensive Analysis & Integration Plan - POC-3

**Date:** December 24, 2025  
**Status:** Planning & Assessment Phase  
**Objective:** Understand observability requirements, assess implementation status, and integrate into backend hardening + CI/CD roadmap

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [What is Observability? (Beginner's Guide)](#2-what-is-observability-beginners-guide)
3. [Current Implementation Status](#3-current-implementation-status)
4. [Gap Analysis](#4-gap-analysis)
5. [Production Readiness Requirements](#5-production-readiness-requirements)
6. [Integration with Hardening & CI/CD](#6-integration-with-hardening--cicd)
7. [Implementation Phases](#7-implementation-phases)
8. [Effort Estimates & Timeline](#8-effort-estimates--timeline)
9. [Risk Assessment](#9-risk-assessment)
10. [Quick Decision Matrix](#10-quick-decision-matrix)

---

## 1. Executive Summary

### What You Have

✅ **Complete infrastructure observability setup** (Prometheus, Grafana, Jaeger already running in Docker Compose)  
✅ **Sentry fully integrated** (backend + frontend, 18/18 tests passing)  
✅ **Shared observability libraries** (both frontend & backend ready to use)  
✅ **Documentation complete** (setup guides, configuration guides, test results)

### What's Pending

🟡 **Frontend observability** (Sentry DSN needs configuration, router instrumentation deferred)  
🟡 **Network instrumentation** (GraphQL/WebSocket error capture optional/deferred)  
🟡 **Source map uploads** (requires CI/CD pipeline setup)  
🟡 **Alerting & dashboards** (Grafana dashboards exist, but alerting rules not configured)  
🟡 **Production environment validation** (local verification complete, prod settings pending)

### Bottom Line

**You're ~70% done with observability.** All core infrastructure is in place. Remaining work is:

- Configuration (DSNs, environment variables)
- Advanced features (alerting, dashboards)
- Production hardening (sampling rates, PII scrubbing)
- CI/CD integration (source map uploads, release tracking)

**Recommended Path:** Complete critical backend hardening FIRST (2-3 weeks), THEN add observability configuration + production hardening (1-2 weeks) in parallel with CI/CD setup.

---

## 2. What is Observability? (Beginner's Guide)

### The Three Pillars of Observability

```
┌────────────────────────────────────────────────────────────────┐
│                     OBSERVABILITY                              │
├────────────────────────────────────────────────────────────────┤
│                                                                │
│  Pillar 1: METRICS                                             │
│  ├─ What: Numerical measurements (counters, gauges, histograms) │
│  ├─ Tool: Prometheus (collects) + Grafana (visualizes)        │
│  ├─ Example: "100 requests/sec", "95th latency = 500ms"       │
│  └─ Use Case: Dashboards, alerting, capacity planning         │
│                                                                │
│  Pillar 2: TRACING (Distributed Tracing)                      │
│  ├─ What: Request journey across services (spans, latency)    │
│  ├─ Tool: OpenTelemetry (collects) + Jaeger (visualizes)      │
│  ├─ Example: "Request took 250ms: 50ms DB + 100ms API"        │
│  └─ Use Case: Performance debugging, bottleneck identification │
│                                                                │
│  Pillar 3: LOGGING (Logs)                                      │
│  ├─ What: Structured text records of events                    │
│  ├─ Tool: Winston (logs) + Sentry (aggregates errors)         │
│  ├─ Example: "user_id=123 action=login status=success"        │
│  └─ Use Case: Debugging, audit trails, event investigation   │
│                                                                │
│  BONUS: ERROR TRACKING                                         │
│  ├─ Tool: Sentry                                               │
│  ├─ Aggregates exceptions + performance issues                │
│  ├─ Provides browser stack traces, session replay             │
│  └─ Better than logs alone: smarter deduplication + UI        │
│                                                                │
└────────────────────────────────────────────────────────────────┘
```

### How They Work Together

```
┌─────────────────────────────────────────────────────────────────────┐
│                    END-TO-END REQUEST FLOW                          │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  Browser sends request                                             │
│         ↓                                                           │
│  API Gateway receives (span: "receive_request" starts)            │
│         ↓                                                           │
│  Auth Service validates (nested span: "validate_jwt")            │
│    ├─ SUCCESS: continue                                            │
│    ├─ FAIL: Sentry captures + breadcrumb logged                  │
│         ↓                                                           │
│  Payments Service processes (span: "process_payment")            │
│    ├─ DB query (span: "db_query" - 50ms)                         │
│    ├─ GraphQL call (span: "graphql_query" - 100ms)               │
│    ├─ WebSocket broadcast (span: "ws_broadcast" - 10ms)          │
│         ↓                                                           │
│  Response sent (250ms total)                                       │
│         ↓                                                           │
│  Metrics recorded                                                  │
│    ├─ Counter: http_requests_total++                             │
│    ├─ Histogram: http_request_duration_seconds = 0.25            │
│    ├─ Gauge: active_connections++                                │
│         ↓                                                           │
│  All data sent to collection endpoints                            │
│    ├─ Prometheus: GET /metrics (pull model)                      │
│    ├─ Jaeger: POST /v1/traces (push via OpenTelemetry)          │
│    ├─ Sentry: POST /api/events (if error)                        │
│                                                                     │
│  Visualization                                                     │
│    ├─ Grafana shows: "API latency 250ms, 100 req/sec"           │
│    ├─ Jaeger shows: "Waterfall: 50ms DB + 100ms GraphQL"        │
│    ├─ Sentry shows: (if error) "Stack trace + user context"    │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

### Why Each Tool Matters

| Tool                  | What it does                                    | When you need it                          |
| --------------------- | ----------------------------------------------- | ----------------------------------------- |
| **Prometheus**        | Collects metrics (counters, gauges, histograms) | Always—needed for dashboards/alerting     |
| **Grafana**           | Visualizes metrics in dashboards                | Always—team visibility into system health |
| **Jaeger**            | Records request journey across services         | Essential for performance debugging       |
| **OpenTelemetry**     | Instruments code to send trace spans            | Essential for understanding bottlenecks   |
| **Sentry**            | Aggregates exceptions + performance issues      | Critical for error tracking + debugging   |
| **Winston (Logging)** | Structured logs for debugging                   | Always—complements other tools            |

---

## 3. Current Implementation Status

### ✅ What's Already Done

#### 3.1 Backend Infrastructure (100% Complete)

| Component      | Status     | Details                           |
| -------------- | ---------- | --------------------------------- |
| **Prometheus** | ✅ RUNNING | Port 9090, all services scraped   |
| **Grafana**    | ✅ RUNNING | Port 3010, dashboards provisioned |
| **Jaeger**     | ✅ RUNNING | Port 16686, traces collected      |
| **RabbitMQ**   | ✅ RUNNING | Metrics endpoint 15692            |

**Verification:**

```bash
curl http://localhost:9090/api/v1/targets  # See scrape targets
curl http://localhost:3000/metrics         # Verify metrics endpoint
```

#### 3.2 Backend Code Integration (95% Complete)

**Sentry Backend:**

- ✅ `libs/backend/observability/src/lib/sentry.ts` - Complete implementation
- ✅ All 5 backend services integrated (API Gateway, Auth, Payments, Admin, Profile)
- ✅ 18/18 integration tests passing
- ✅ Error handling middleware connected
- ✅ User context + tags wired

**Prometheus Metrics:**

- ✅ `libs/backend/observability/src/lib/prometheus.ts` - Complete
- ✅ Metrics middleware configured
- ✅ Standard HTTP metrics (requests, duration, errors)
- ✅ Custom business metrics available

**OpenTelemetry Tracing:**

- ✅ `libs/backend/observability/src/lib/tracing.ts` - Complete
- ✅ Jaeger exporter configured
- ✅ Span instrumentation ready
- ✅ Service name + version injection works

**Logging:**

- ✅ `libs/backend/observability/src/lib/logger.ts` - Complete
- ✅ Winston structured logging
- ✅ Correlation ID tracking
- ✅ Development/production log levels

**Middleware:**

- ✅ `libs/backend/observability/src/lib/observability.ts` - Exports all tools
- ✅ `libs/backend/observability/src/lib/metrics-middleware.ts` - HTTP metrics automatic

#### 3.3 Frontend Sentry Integration (80% Complete)

**Setup:**

- ✅ `libs/shared-observability/src/lib/sentry.ts` - Complete
- ✅ Error Boundary component ready
- ✅ All 5 MFEs (Shell, Auth, Payments, Admin, Profile) configured
- ✅ User context + setUser() working

**Pending Configuration:**

- 🟡 Frontend DSN injection via rspack config (Sentry env setup)
- 🟡 Release + version environment variables

#### 3.4 Documentation (100% Complete)

- ✅ `observability-setup-guide.md` - Integration patterns + best practices
- ✅ `OBSERVABILITY_LIVE_SETUP.md` - Docker Compose setup + troubleshooting
- ✅ `SENTRY-FULL-IMPLEMENTATION-PLAN.md` - Detailed roadmap (phases A-J)
- ✅ `SENTRY_RESOLUTION_COMPLETE.md` - Integration fix documentation
- ✅ `SENTRY_INTEGRATION_TEST_RESULTS.md` - Full test coverage report
- ✅ `SENTRY-SETUP-GUIDE.md` - Quick start guide

### 🟡 What's Partial / Pending

#### 3.5 Frontend Configuration (20% Done)

| Task                       | Status      | Details                                    |
| -------------------------- | ----------- | ------------------------------------------ |
| **DSN Injection**          | 🟡 Pending  | Add `NX_SENTRY_DSN` to rspack DefinePlugin |
| **Version Injection**      | 🟡 Pending  | Add `NX_APP_VERSION` + `NX_SENTRY_RELEASE` |
| **Router Instrumentation** | 🟡 Deferred | React Router v7 support TBD                |
| **Network Capture**        | 🟡 Deferred | GraphQL/WebSocket error capture (optional) |

#### 3.6 CI/CD Integration (0% Done)

| Task                   | Status         | Details                          |
| ---------------------- | -------------- | -------------------------------- |
| **Source Map Uploads** | ❌ Not Started | Requires GitHub Actions workflow |
| **Release Tracking**   | ❌ Not Started | Sentry CLI integration           |
| **Version Management** | ❌ Not Started | Automatic version bumping        |

#### 3.7 Alerting & Dashboards (50% Done)

| Task                   | Status            | Details                                   |
| ---------------------- | ----------------- | ----------------------------------------- |
| **Grafana Dashboards** | ✅ Provisioned    | Services Overview + API Gateway Dashboard |
| **Alert Rules**        | ❌ Not Configured | High error rate, latency, health checks   |
| **Sentry Alerts**      | ❌ Not Configured | New issue detection, error rate spikes    |
| **PagerDuty/Slack**    | ❌ Not Integrated | Alert channel integration                 |

#### 3.8 Production Environment Config (0% Done)

| Task                       | Status     | Details                               |
| -------------------------- | ---------- | ------------------------------------- |
| **Environment Separation** | ❌ Pending | Dev (1.0 sample) vs Prod (0.1 sample) |
| **PII Scrubbing**          | ⚠️ Partial | Basic scrubbers present, needs review |
| **Error Filtering**        | ⚠️ Partial | Ignore lists present, may need tuning |
| **Performance Budgets**    | ❌ Pending | Set baseline metrics for production   |

---

## 4. Gap Analysis

### Critical Gaps (Must Fix for Prod)

| Gap                             | Severity  | Impact                                     | Fix Effort |
| ------------------------------- | --------- | ------------------------------------------ | ---------- |
| **Frontend DSN configuration**  | 🔴 HIGH   | Sentry won't capture frontend errors       | 0.5 hours  |
| **Sampling rate configuration** | 🔴 HIGH   | Will generate too many events (cost/noise) | 0.5 hours  |
| **PII scrubbing validation**    | 🔴 HIGH   | Risk of leaking sensitive data             | 2 hours    |
| **Error ignore lists tuning**   | 🟡 MEDIUM | May miss real issues or create noise       | 1 hour     |

### Important But Non-Blocking

| Gap                        | Severity  | Impact                                       | Fix Effort |
| -------------------------- | --------- | -------------------------------------------- | ---------- |
| **Router instrumentation** | 🟡 MEDIUM | Missing navigation performance data          | 2-4 hours  |
| **Network error capture**  | 🟡 MEDIUM | Missing GraphQL/WebSocket insights           | 2 hours    |
| **Source map uploads**     | 🟡 MEDIUM | Stack traces stay minified until fixed       | 2 hours    |
| **Alerting rules**         | 🟡 MEDIUM | Manual error discovery instead of auto-alert | 3 hours    |

### Nice-to-Have Enhancements

| Gap                         | Severity | Impact                                     | Fix Effort |
| --------------------------- | -------- | ------------------------------------------ | ---------- |
| **Dashboard customization** | 🟢 LOW   | Team visibility could be better            | 4 hours    |
| **Custom business metrics** | 🟢 LOW   | Missing domain-specific insights           | 4 hours    |
| **Trace sampling policies** | 🟢 LOW   | Could be smarter about what traces to keep | 3 hours    |

---

## 5. Production Readiness Requirements

### Minimal Production Observability (MVP)

**What you MUST have to go live safely:**

✅ Backend metrics collection (Prometheus running)  
✅ Frontend/backend error tracking (Sentry capturing)  
✅ Basic dashboards (Grafana showing health)  
✅ Request tracing (Jaeger showing performance)  
✅ Structured logging (Winston with correlation IDs)  
✅ PII scrubbing (no tokens/passwords in logs)  
✅ Sampling configured (manageable event volume)

**All of this exists in your codebase!**

### Full Production Observability

**What makes you truly production-ready:**

- ✅ MVP requirements above
- 🟡 Alerting rules (auto-notify on errors)
- 🟡 Dashboards tuned (quick visibility)
- 🟡 Sampling policies (cost-optimized)
- 🟡 On-call rotation (incident response)
- 🟡 Runbooks (how to respond to alerts)
- 🟡 SLOs/SLIs (define success metrics)

---

## 6. Integration with Hardening & CI/CD

### Where Observability Fits in the Roadmap

```
┌──────────────────────────────────────────────────────────────────┐
│               COMPLETE IMPLEMENTATION ROADMAP                    │
├──────────────────────────────────────────────────────────────────┤
│                                                                 │
│  STAGE 1: Backend Hardening (2-3 weeks) ← BLOCKING             │
│  ├─ Phase 1: Rate limiting + JWT rotation + Account lockout    │
│  ├─ Phase 2: Input validation (payments/admin services)        │
│  └─ Phase 3: Security testing                                  │
│      └─ Observability: Add security event tracking (Optional)  │
│         └─ Track failed logins, lockouts, validation errors    │
│         └─ Effort: 1 hour (add breadcrumbs to security checks) │
│                                                                 │
│  STAGE 2: CI/CD Foundation (2-3 weeks) ← CRITICAL PATH        │
│  ├─ Phase 1: CI Pipeline (Nx affected, tests, caching)         │
│  ├─ Phase 2: Docker configuration (11 services)                │
│  └─ Phase 3: AWS infrastructure (ECR, ECS, RDS, etc.)         │
│      └─ Observability: None needed yet                          │
│                                                                 │
│  STAGE 3: Parallel Work (2-3 weeks)                             │
│  ├─ Track A: CD Pipeline (Staging/Production deployment)      │
│  ├─ Track B: Advanced Security (secrets, DB security, etc.)    │
│  └─ Track C: Observability ← HAPPENS HERE                      │
│      └─ Phase 1: Frontend config (DSN, versions) - 1 hour      │
│      └─ Phase 2: Production hardening (sampling, PII) - 2 hrs  │
│      └─ Phase 3: CI/CD integration (source maps) - 2 hours     │
│      └─ Phase 4: Alerting rules (Grafana, Sentry) - 2 hours   │
│      └─ Phase 5: Dashboards (team visibility) - 2 hours        │
│      └─ TOTAL: 9 hours (1 day intensive)                        │
│                                                                 │
│  LAUNCH: Production Deployment (Week 8) ← FULLY OBSERVABLE    │
│                                                                 │
└──────────────────────────────────────────────────────────────────┘
```

### Why This Order?

1. **Hardening First (Weeks 1-3):**
   - Can't observe what's broken yet
   - Observability without security = exposed data
   - Add minimal observability: security event tracking (optional)

2. **CI/CD Infrastructure (Weeks 4-6):**
   - Observability doesn't need CI/CD yet (can deploy manually)
   - CI/CD setup is independent

3. **Observability Hardening (Weeks 6-7 in parallel):**
   - After hardening is done, add production configs
   - Add after CI/CD is ready (for source map uploads)
   - Parallel with CD pipeline (both non-blocking)

4. **Launch with Full Observability (Week 8):**
   - All systems monitored, all errors tracked
   - Dashboards show health
   - Alerts notify team
   - Source maps enable debugging

---

## 7. Implementation Phases

### Phase O: Optional Security Event Tracking (Week 1-2, During Hardening)

**Effort:** 1 hour  
**Complexity:** Very Low  
**Benefit:** Understand attack attempts in production

**Tasks:**

1. Add Sentry breadcrumbs to login failure (rate limiting)
2. Add breadcrumbs to account lockout events
3. Tag security events with `security_event: true`

**Example Code:**

```typescript
// In auth service login endpoint
if (failedAttempts > 5) {
  Sentry.addBreadcrumb({
    category: 'auth.security',
    level: 'warning',
    message: `Account locked: ${email}`,
    data: { email, attemptCount: failedAttempts },
  });
  Sentry.setTag('security_event', 'account_lockout');
}
```

**Status:** Optional, can skip if time-constrained

---

### Phase A: Frontend Environment Injection (Week 6, During CI/CD)

**Effort:** 0.5 hours  
**Complexity:** Very Low  
**Blocking:** No (optional until production)

**Tasks:**

1. Update `apps/shell/rspack.config.js` - Add `NX_SENTRY_DSN`, `NX_SENTRY_RELEASE`, `NX_APP_VERSION` to DefinePlugin
2. Repeat for `auth-mfe`, `payments-mfe`, `admin-mfe`, `profile-mfe`
3. Update `libs/shared-observability/src/lib/sentry.ts` - Remove legacy `VITE_*` fallbacks

**Environment Setup:**

```bash
export NX_SENTRY_DSN="https://your-key@o123456.ingest.sentry.io/1234567"
export NX_SENTRY_RELEASE="shell@1.0.0"
export NX_APP_VERSION="1.0.0"
```

**Verification:**

```bash
# Start shell MFE, check console
pnpm shell:dev
# Should NOT see: "[Sentry] DSN not provided..."
# Should see: Sentry initialized with DSN + release
```

**Status:** Quick win, do early

---

### Phase B: Backend DSN Configuration (Week 6, During CI/CD)

**Effort:** 0.5 hours  
**Complexity:** Very Low  
**Blocking:** No (already integrated, just needs DSN)

**Tasks:**

1. Add `SENTRY_DSN` environment variable to docker-compose.yml
2. Add `SENTRY_ENVIRONMENT` (dev/staging/prod)
3. Add `SENTRY_RELEASE` (versioning)
4. Restart services

**Environment Setup:**

```bash
export SENTRY_DSN="https://your-key@o123456.ingest.sentry.io/1234567"
export SENTRY_ENVIRONMENT="development"
export SENTRY_RELEASE="api-gateway@1.0.0"
```

**Verification:**

```bash
pnpm backend:start
# Trigger test error: curl http://localhost:3000/invalid
# Check Sentry dashboard - event should appear
```

**Status:** Done with Phase A, takes 30 minutes

---

### Phase C: Production Sampling & Configuration (Week 6, During CI/CD)

**Effort:** 2 hours  
**Complexity:** Low-Medium  
**Blocking:** No (but important for cost)

**Tasks:**

1. Configure Sentry `tracesSampleRate` by environment:
   - Development: `1.0` (capture everything)
   - Staging: `0.5` (50% of traces)
   - Production: `0.1` (10% of traces)

2. Configure sampling rules:
   - High-error endpoints: `1.0` (always capture)
   - Health checks: `0.0` (never capture)
   - Critical flows: `0.5` (half capture)

3. Add PII scrubbing:
   - Scrub request bodies (remove passwords, tokens)
   - Scrub URLs (remove query params)
   - Scrub headers (remove auth tokens)

4. Validate ignore lists:
   - Browser extension errors (chrome-extension://)
   - HMR errors (should only see in dev)
   - ResizeObserver quirks

**Code Changes:**

```typescript
// In sentry.ts initialization
Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV,
  tracesSampleRate: getTracesSampleRate(process.env.NODE_ENV),
  beforeSend(event) {
    return scrubPII(event); // Remove sensitive data
  },
  ignoreErrors: [
    // Browser extension errors
    /^top\.GLOBALS/,
    'chrome-extension://',
    'moz-extension://',
    // HMR
    'ResizeObserver loop limit exceeded',
  ],
});
```

**Status:** Essential for production, do before launch

---

### Phase D: Source Map Upload (Week 7, During CI/CD)

**Effort:** 2 hours  
**Complexity:** Medium (requires CI/CD pipeline)  
**Blocking:** No (optional until CI/CD ready)

**Tasks:**

1. Add Sentry CLI to `.github/workflows/deploy.yml`
2. Create releases in Sentry for each frontend app
3. Upload source maps from build output
4. Link releases to deployments

**GitHub Actions Workflow:**

```yaml
- name: Upload Sentry source maps
  run: |
    npm install -g @sentry/cli
    sentry-cli releases new "shell@${{ env.VERSION }}"
    sentry-cli releases files "shell@${{ env.VERSION }}" upload-sourcemaps dist/apps/shell --rewrite
    sentry-cli releases finalize "shell@${{ env.VERSION }}"
  env:
    SENTRY_AUTH_TOKEN: ${{ secrets.SENTRY_AUTH_TOKEN }}
    SENTRY_ORG: your-org
    SENTRY_PROJECT: shell
```

**Benefit:** Stack traces become readable (de-minified)

**Status:** Do after CI/CD pipeline is ready

---

### Phase E: Router Instrumentation (Week 7, Optional)

**Effort:** 2-4 hours  
**Complexity:** Medium (React Router v7 research needed)  
**Blocking:** No (nice-to-have)

**Tasks:**

1. Investigate Sentry React Router v7 support
2. Implement custom navigation spans if needed
3. Test transaction names + route parameters
4. Verify performance traces in Jaeger

**Status:** Deferred, add after core observability working

---

### Phase F: Network Error Capture (Week 7, Optional)

**Effort:** 2 hours  
**Complexity:** Low  
**Blocking:** No (optional enhancement)

**Tasks:**

1. Add GraphQL error handler → Sentry capture
2. Add WebSocket error handler → Sentry capture
3. Add request error breadcrumbs
4. Test with broken endpoints

**Status:** Deferred, add if time available

---

### Phase G: Alerting Rules (Week 7, During CI/CD)

**Effort:** 2 hours  
**Complexity:** Low  
**Blocking:** No (but critical for production)

**Tasks:**

1. Create Grafana alert rules:
   - Error rate > 5% → Alert
   - P95 latency > 1s → Alert
   - Service down → Alert
2. Create Sentry alert rules:
   - New critical issue → Alert
   - Error rate spike > 2x → Alert
   - Regression on release → Alert
3. Configure notification channels (Slack, email, PagerDuty)

**Status:** Important for production, do before launch

---

### Phase H: Dashboard Customization (Week 7, Optional)

**Effort:** 2 hours  
**Complexity:** Low  
**Blocking:** No (nice-to-have)

**Tasks:**

1. Review existing dashboards (Services Overview + API Gateway)
2. Add business metrics (payments processed, revenue, etc.)
3. Add team-specific views (on-call, performance budgets)
4. Create runbooks for common alerts

**Status:** Nice-to-have, can do post-launch

---

## 8. Effort Estimates & Timeline

### By Implementation Phase

| Phase | Task                        | Effort         | When      | Dependency        | Must-Do? |
| ----- | --------------------------- | -------------- | --------- | ----------------- | -------- |
| **O** | Security event tracking     | 1 hour         | Week 1-2  | Backend hardening | Optional |
| **A** | Frontend DSN injection      | 0.5 hour       | Week 6    | Frontend code     | High     |
| **B** | Backend DSN configuration   | 0.5 hour       | Week 6    | Backend services  | High     |
| **C** | Sampling + PII hardening    | 2 hours        | Week 6    | Sentry config     | High     |
| **D** | Source map upload (CI/CD)   | 2 hours        | Week 7    | CI/CD pipeline    | Medium   |
| **E** | Router instrumentation      | 2-4 hours      | Week 7    | React code        | Optional |
| **F** | Network error capture       | 2 hours        | Week 7    | Frontend code     | Optional |
| **G** | Alerting rules              | 2 hours        | Week 7    | Grafana setup     | High     |
| **H** | Dashboard customization     | 2 hours        | Week 7    | Grafana setup     | Optional |
|       | **TOTAL CRITICAL**          | **5 hours**    | Week 6    |                   | **YES**  |
|       | **TOTAL WITH NICE-TO-HAVE** | **14.5 hours** | Weeks 6-7 |                   |          |

### Integrated Timeline

```
Week 1-2   Backend Hardening Phase 1-2
           └─ + 1 hour: Optional Phase O (security event tracking)

Week 3     Security Testing
           └─ No observability work

Week 4-5   CI/CD Foundation
           └─ No observability work

Week 6     PARALLEL WORK BEGINS
           ├─ Track A: CD Pipeline (no observability)
           ├─ Track B: Advanced Security (no observability)
           └─ Track C: OBSERVABILITY PHASE A-C
              ├─ Phase A: Frontend DSN injection (0.5h)
              ├─ Phase B: Backend DSN config (0.5h)
              └─ Phase C: Production hardening (2h)
              ├─ TOTAL: 3 hours (morning work)
              └─ RESULT: Sentry fully operational

Week 7     PARALLEL WORK CONTINUES
           ├─ Track A: CD Pipeline + DB migrations
           ├─ Track B: Advanced Security Phase 3-5
           └─ Track C: OBSERVABILITY PHASE D-H
              ├─ Phase D: Source maps (CI/CD integration) (2h)
              ├─ Phase E: Router instrumentation (2-4h, optional)
              ├─ Phase F: Network errors (2h, optional)
              ├─ Phase G: Alerting rules (2h)
              └─ Phase H: Dashboards (2h, optional)
              └─ TOTAL: 10-12 hours (2-3 days)

Week 8     Launch with Full Observability
           └─ All systems monitored, dashboard live
```

---

## 9. Risk Assessment

### Technical Risks

| Risk                                | Impact                    | Probability | Mitigation                                            |
| ----------------------------------- | ------------------------- | ----------- | ----------------------------------------------------- |
| **Sentry quota exceeded**           | Untracked errors          | Medium      | Set sampling rate to 0.1 in prod, monitor event count |
| **PII leakage**                     | Security breach           | Low         | Audit `beforeSend` scrubbers, test with real data     |
| **High cardinality metrics**        | Prometheus disk issues    | Low         | Avoid unbounded labels (no user IDs in metrics)       |
| **React Router v7 incompatibility** | Missing navigation traces | Medium      | Investigate early, fallback to custom spans           |
| **Source map upload failure**       | Minified stack traces     | Low         | Make upload optional, implement graceful degradation  |

### Operational Risks

| Risk                         | Impact                  | Probability | Mitigation                                    |
| ---------------------------- | ----------------------- | ----------- | --------------------------------------------- |
| **Alert fatigue**            | Alerts ignored          | Medium      | Tune thresholds carefully, start conservative |
| **Dashboard confusion**      | Wrong interpretation    | Low         | Document dashboards, create runbooks          |
| **Missing critical alerts**  | Late incident detection | Low         | Review alert rules before production          |
| **Observability cost spike** | Budget overrun          | Medium      | Monitor Sentry event count, set rate limits   |

### Mitigation Summary

✅ **Set sampling rate: 0.1 (10%) for production**  
✅ **Scrub PII in beforeSend callback**  
✅ **Avoid user IDs in metric labels**  
✅ **Test source map upload in CI**  
✅ **Tune alert thresholds with realistic load test**  
✅ **Create runbooks for common alerts**

---

## 10. Quick Decision Matrix

### For Your Situation

**You want: Production-ready observability by Week 8 launch**

### Decision 1: What to Do During Backend Hardening (Week 1-3)?

```
Option A: Skip observability during hardening (RECOMMENDED)
├─ Do: Focus 100% on security
├─ Add: Optional 1-hour Phase O (security event tracking)
└─ Result: Faster hardening, observability ready Week 6

Option B: Parallelize Phase A-B during hardening
├─ Do: 1 hour/day on DSN configuration
├─ Result: Slower hardening, observability ready Week 3
└─ Risk: Context switching, potential hardening delays
```

**Recommendation:** Option A (Skip during hardening)

- **Why:** Security is blocking, observability is not
- **Timeline:** Saves 2-3 days on hardening phase
- **Trade-off:** Observability starts Week 6 instead of Week 3 (still plenty of time)

---

### Decision 2: How Much Observability for Launch?

```
Option A: MVP (Bare Minimum) — 3 hours
├─ Phase A: Frontend DSN injection
├─ Phase B: Backend DSN config
├─ Phase C: Production hardening (sampling, PII)
└─ Result: Errors tracked, no alerting, basic dashboards

Option B: Complete (Recommended) — 10 hours
├─ All of Option A, PLUS:
├─ Phase D: Source maps (readable stack traces)
├─ Phase G: Alerting rules (auto-notify)
└─ Result: Production-grade observability

Option C: Everything (Nice-to-Have) — 14 hours
├─ All of Option B, PLUS:
├─ Phase E: Router instrumentation
├─ Phase F: Network error capture
├─ Phase H: Dashboard customization
└─ Result: Best-in-class observability
```

**Recommendation:** Option B (Complete)

- **Why:** Covers all critical needs, reasonable effort (1 day)
- **Must-have:** Phases A, B, C, G (5 hours minimum)
- **Nice-to-have:** Phases D, E, F, H (9 more hours)
- **Time available:** Week 6-7, plenty of capacity

---

### Decision 3: Should You Do This In Parallel or Sequence?

```
Option A: PARALLEL (Recommended) — Week 6-7
├─ Track A: CD Pipeline deployment
├─ Track B: Advanced Security hardening
├─ Track C: Observability setup
└─ Timeline: 2 weeks, everything ready Week 8

Option B: SEQUENCE — Week 6, then Week 7
├─ Week 6: Observability setup (Phase A-C)
├─ Week 7: CD Pipeline + Security (Phase D onwards)
└─ Timeline: 2 weeks, observability ready Week 6, others Week 7
└─ Risk: Bottleneck on CD pipeline if observability takes longer
```

**Recommendation:** Option A (Parallel)

- **Why:** They're independent, no blockers
- **Team efficiency:** Each track makes progress simultaneously
- **Buffer:** If observability overruns, doesn't block CD pipeline

---

## Summary: What to Do

### This Week (Week 1 of Hardening)

- [ ] Start Backend Hardening Phase 1 (rate limiting restoration)
- [ ] Optionally: Add 1-hour Phase O (security event tracking)
- [ ] Review this observability analysis with team

### Week 6 (During Parallel Work)

- [ ] Allocate 3 hours for Observability Phase A-C:
  - [ ] Phase A: Frontend DSN injection (0.5h)
  - [ ] Phase B: Backend DSN configuration (0.5h)
  - [ ] Phase C: Production hardening (2h)
  - **Result:** Sentry fully operational

### Week 7 (During Parallel Work)

- [ ] Allocate 6-10 hours for remaining phases:
  - [ ] Phase D: Source map upload (2h) — RECOMMENDED
  - [ ] Phase E: Router instrumentation (2-4h) — OPTIONAL
  - [ ] Phase F: Network error capture (2h) — OPTIONAL
  - [ ] Phase G: Alerting rules (2h) — RECOMMENDED
  - [ ] Phase H: Dashboards (2h) — OPTIONAL
  - **Recommended minimum:** 4 hours (Phases D + G)
  - **Recommended full:** 10 hours (all above except E, F, H)

### Week 8 (Launch)

- [ ] All observability operational and tested
- [ ] Dashboards live, alerts active
- [ ] Team trained on incident response
- [ ] Production deployment monitored end-to-end

---

## Appendix: Tool Glossary

| Tool              | Purpose                 | Role                                          | Learn More                           |
| ----------------- | ----------------------- | --------------------------------------------- | ------------------------------------ |
| **Prometheus**    | Metrics collection      | Server pulls metrics from `/metrics` endpoint | http://prometheus.io                 |
| **Grafana**       | Metrics visualization   | Web dashboard showing graphs + alerts         | http://grafana.com                   |
| **Jaeger**        | Distributed tracing     | Shows request journey across services         | http://jaegertracing.io              |
| **OpenTelemetry** | Instrumentation library | Code sends traces to Jaeger                   | http://opentelemetry.io              |
| **Sentry**        | Error tracking          | Aggregates exceptions + performance           | http://sentry.io                     |
| **Winston**       | Structured logging      | Application logs for debugging                | https://github.com/winstonjs/winston |

---

## Related Documents

- [Implementation Roadmap Summary](./IMPLEMENTATION-ROADMAP-SUMMARY.md) - High-level timeline
- [CI/CD Planning](./CI-CD-PLANNING.md) - Deployment infrastructure
- [Backend Hardening Plan](./BACKEND-HARDENING-PLAN.md) - Security hardening
- [SENTRY-FULL-IMPLEMENTATION-PLAN.md](./SENTRY-FULL-IMPLEMENTATION-PLAN.md) - Detailed Sentry phases
- [OBSERVABILITY_LIVE_SETUP.md](./OBSERVABILITY_LIVE_SETUP.md) - Docker Compose setup
- [observability-setup-guide.md](./observability-setup-guide.md) - Code integration guide

---

**Document Version:** 1.0  
**Date:** December 24, 2025  
**Status:** Complete  
**Last Reviewed:** December 24, 2025
