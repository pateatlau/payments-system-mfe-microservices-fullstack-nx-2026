# Task List v2 — Phase 4 (Ultra-Atomic)
## Observability, Monitoring & Incident Readiness

**Phase:** 4 of 5  
**Prerequisites:** Phases 1–3 completed (Gates 1–3 PASSED)  
**Gate:** 🚦 Gate 4 — Full Observability Readiness  
**Tracking Rule:** Check items only after verification passes.

---

# TASK 4.1 — Error Tracking (Sentry) Hardening

## Policy & Design
- [ ] Environments defined (dev/staging/prod)
- [ ] Sampling strategy defined per environment
- [ ] PII scrubbing rules defined
- [ ] Error ownership & escalation defined

## Code & Configuration
- [ ] Backend Sentry SDK added
- [ ] Backend Sentry initialized at startup
- [ ] Backend DSN configured via env
- [ ] Backend environment & release tags set
- [ ] Backend source context enabled
- [ ] Frontend Sentry SDK added to shell
- [ ] Frontend Sentry SDK added to MFEs
- [ ] Frontend Sentry initialized pre-bootstrap
- [ ] Frontend DSN & release configured
- [ ] Browser tracing enabled (if applicable)

## Verification
- [ ] Backend test error captured
- [ ] Frontend test error captured
- [ ] PII successfully scrubbed

---

# TASK 4.2 — Distributed Tracing

## Tracing Design
- [ ] Tracing standard selected (OpenTelemetry)
- [ ] Trace propagation headers defined
- [ ] Services to instrument listed

## Code Implementation
- [ ] OpenTelemetry SDK added to services
- [ ] HTTP server instrumentation enabled
- [ ] HTTP client instrumentation enabled
- [ ] Trace context propagated
- [ ] Traces exported to collector

## Verification
- [ ] Cross-service request produces single trace
- [ ] Trace IDs appear in logs

---

# TASK 4.3 — Metrics Collection

## Metrics Design
- [ ] RED metrics defined per service
- [ ] Business metrics defined
- [ ] SLO targets defined

## Code & Tooling
- [ ] Prometheus client added
- [ ] /metrics endpoint exposed
- [ ] HTTP latency metrics registered
- [ ] Error rate metrics registered
- [ ] Business metrics registered

## Verification
- [ ] Metrics scrape succeeds
- [ ] Metric labels verified
- [ ] Metrics change under load

---

# TASK 4.4 — Logging Standardization

## Logging Policy
- [ ] Log levels defined
- [ ] JSON log format defined
- [ ] Mandatory log fields defined

## Code Implementation
- [ ] Console logs replaced with logger
- [ ] traceId added to logs
- [ ] Stack traces included for errors
- [ ] Sensitive fields masked

## Verification
- [ ] Logs structured correctly
- [ ] traceId correlation confirmed

---

# TASK 4.5 — Alerting & Dashboards

## Alerting Design
- [ ] Alert severity levels defined
- [ ] Alert thresholds defined
- [ ] On-call escalation path defined

## Tooling & Configuration
- [ ] Grafana dashboards created
- [ ] Prometheus alerts configured
- [ ] Sentry alerts configured
- [ ] Notification routing configured

## Verification
- [ ] Synthetic error triggers alert
- [ ] Notification received

---

# TASK 4.6 — Incident Readiness

## Process Design
- [ ] Incident severity levels defined
- [ ] Response playbooks defined
- [ ] Communication channels defined

## Documentation
- [ ] Incident runbooks created
- [ ] Rollback procedures documented
- [ ] Escalation contacts documented

## Verification
- [ ] Incident simulation run
- [ ] Runbook executed successfully
- [ ] Response reviewed

---

## PHASE 4 COMPLETION

- [ ] All Phase 4 tasks complete
- [ ] All verification steps passed
- [ ] Observability fully functional

🚦 **GATE 4 PASSED**
