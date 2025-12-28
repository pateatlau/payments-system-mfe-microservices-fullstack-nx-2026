# Implementation Plan v2 — Phase 4 (Ultra-Atomic)
## Observability, Monitoring & Incident Readiness

**Phase:** 4 of 5  
**Granularity:** Ultra-Atomic (Policy / Infra → Code → Verification)  
**Prerequisites:** Phases 1–3 completed, Gates 1–3 PASSED  
**Gate:** 🚦 Gate 4 — Full Observability Readiness  
**Execution Rule:** Execute ONE sub-task at a time. Verify before proceeding.

---

## Scope of Phase 4

This phase ensures the system is **fully observable in production**:
- Errors are captured with context
- Metrics reflect system health
- Traces allow end-to-end debugging
- Alerts fire before users complain
- Incidents are diagnosable and actionable

No production traffic should be enabled without Phase 4.

---

# TASK 4.1 — Error Tracking (Sentry) Hardening

## Objective
Ensure all frontend and backend errors are captured with sufficient context.

---

## Dimension A — Policy & Design

1. Define environments (dev, staging, prod).
2. Define sampling strategy per environment.
3. Define PII scrubbing rules.
4. Define error ownership and escalation.

---

## Dimension B — Code & Configuration

### 4.1.B.1 Backend Sentry Setup
1. Add Sentry SDK to backend services.
2. Initialize Sentry at process startup.
3. Configure DSN via environment.
4. Attach environment and release tags.
5. Enable stack trace source context.

---

### 4.1.B.2 Frontend Sentry Setup
1. Add Sentry SDK to shell.
2. Add Sentry SDK to MFEs.
3. Initialize Sentry before app bootstrap.
4. Configure DSN and release version.
5. Enable browser tracing (if used).

---

## Dimension C — Verification & Tests

1. Throw test error in backend.
2. Confirm error appears in Sentry.
3. Throw test error in frontend.
4. Confirm error appears in Sentry.
5. Verify PII is scrubbed.

---

# TASK 4.2 — Distributed Tracing

## Objective
Enable request-level visibility across services.

---

## Dimension A — Tracing Design

1. Choose tracing standard (OpenTelemetry).
2. Define trace propagation headers.
3. Define services to be instrumented.

---

## Dimension B — Code Implementation

1. Add OpenTelemetry SDK to services.
2. Instrument HTTP servers.
3. Instrument HTTP clients.
4. Propagate trace context across services.
5. Export traces to collector.

---

## Dimension C — Verification

1. Trigger request across services.
2. Confirm single trace spans multiple services.
3. Verify trace IDs in logs.

---

# TASK 4.3 — Metrics Collection

## Objective
Track system health and performance.

---

## Dimension A — Metrics Design

1. Define RED metrics per service.
2. Define business metrics (payments, auth).
3. Define SLO targets.

---

## Dimension B — Code & Tooling

1. Add Prometheus client to services.
2. Expose /metrics endpoint.
3. Register HTTP latency metrics.
4. Register error rate metrics.
5. Register custom business metrics.

---

## Dimension C — Verification

1. Scrape metrics locally.
2. Verify metric names and labels.
3. Confirm metrics update under load.

---

# TASK 4.4 — Logging Standardization

## Objective
Make logs structured, searchable, and correlated.

---

## Dimension A — Logging Policy

1. Define log levels.
2. Define log format (JSON).
3. Define mandatory fields (traceId, service).

---

## Dimension B — Code Implementation

1. Replace console logs with logger.
2. Add traceId to all logs.
3. Ensure errors include stack traces.
4. Mask sensitive fields.

---

## Dimension C — Verification

1. Generate logs across services.
2. Confirm logs are structured.
3. Confirm traceId correlation.

---

# TASK 4.5 — Alerting & Dashboards

## Objective
Detect and respond to issues proactively.

---

## Dimension A — Alerting Design

1. Define alert severity levels.
2. Define alert thresholds.
3. Define on-call escalation path.

---

## Dimension B — Tooling & Config

1. Create Grafana dashboards.
2. Configure Prometheus alerts.
3. Configure Sentry alerts.
4. Route alerts to notification channels.

---

## Dimension C — Verification

1. Trigger synthetic error.
2. Confirm alert fires.
3. Confirm notification received.

---

# TASK 4.6 — Incident Readiness

## Objective
Ensure team can respond effectively to incidents.

---

## Dimension A — Process Design

1. Define incident severity levels.
2. Define response playbooks.
3. Define communication channels.

---

## Dimension B — Documentation

1. Create incident runbooks.
2. Document rollback procedures.
3. Document escalation contacts.

---

## Dimension C — Verification

1. Run incident simulation.
2. Execute runbook.
3. Review response effectiveness.

---

## PHASE 4 EXIT CRITERIA

- Errors visible across frontend and backend
- Traces available end-to-end
- Metrics reflect system health
- Alerts fire correctly
- Incident response documented and tested

🚦 **GATE 4 PASSED**
