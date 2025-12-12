# Observability Live Setup Guide - POC-3

**Status:** Complete  
**Version:** 1.0  
**Date:** 2026-12-12  
**Purpose:** Guide for setting up live observability with Prometheus, Grafana, Jaeger, and Sentry

---

## Overview

POC-3 includes a complete observability stack:

| Tool | Purpose | URL |
|------|---------|-----|
| **Prometheus** | Metrics collection | http://localhost:9090 |
| **Grafana** | Metrics visualization | http://localhost:3010 |
| **Jaeger** | Distributed tracing | http://localhost:16686 |
| **Sentry** | Error tracking | https://sentry.io (cloud) |

---

## Quick Start

### 1. Start Observability Stack

```bash
# Start Prometheus, Grafana, and Jaeger
pnpm observability:start

# Or start with all infrastructure
pnpm infra:start
```

### 2. Open Dashboards

```bash
# Open Prometheus UI
pnpm prometheus:ui

# Open Grafana dashboards
pnpm grafana:ui

# Open Jaeger tracing UI
pnpm jaeger:ui
```

### 3. View Metrics

```bash
# View API Gateway metrics
pnpm metrics:api-gateway

# Or via curl
curl http://localhost:3000/metrics
```

---

## Grafana Setup

### Access

- **URL:** http://localhost:3010
- **Username:** admin
- **Password:** admin

### Pre-configured Dashboards

Two dashboards are automatically provisioned:

1. **Services Overview** - Health status and request rates for all services
2. **API Gateway Dashboard** - Detailed metrics for the API Gateway

### Dashboard Features

**Services Overview:**
- Service health status (UP/DOWN)
- Request rate by service
- P95 latency by service

**API Gateway Dashboard:**
- Request rate (req/sec)
- P95 latency
- Error rate percentage
- Active connections
- Request rate by HTTP method
- Response time percentiles (p50, p90, p99)
- Request rate by status code
- Request rate by route

---

## Prometheus Setup

### Access

- **URL:** http://localhost:9090

### Configured Scrape Targets

| Job | Target | Interval |
|-----|--------|----------|
| prometheus | localhost:9090 | 15s |
| api-gateway | host.docker.internal:3000 | 10s |
| auth-service | host.docker.internal:3001 | 15s |
| payments-service | host.docker.internal:3002 | 15s |
| admin-service | host.docker.internal:3003 | 15s |
| profile-service | host.docker.internal:3004 | 15s |
| rabbitmq | host.docker.internal:15692 | 30s |

### Useful Queries

```promql
# Request rate (last 5 minutes)
sum(rate(http_requests_total[5m])) by (job)

# P95 latency
histogram_quantile(0.95, sum(rate(http_request_duration_seconds_bucket[5m])) by (le, job))

# Error rate percentage
sum(rate(http_errors_total[5m])) / sum(rate(http_requests_total[5m])) * 100

# Active connections
sum(http_active_connections) by (job)
```

---

## Jaeger Setup

### Access

- **URL:** http://localhost:16686

### OTLP Configuration

Services send traces to Jaeger via OTLP:

```bash
# Environment variables for backend services
OTEL_ENABLED=true
OTEL_EXPORTER_OTLP_ENDPOINT=http://localhost:4318
OTEL_SERVICE_NAME=api-gateway
```

### Viewing Traces

1. Open Jaeger UI at http://localhost:16686
2. Select a service from the dropdown
3. Click "Find Traces"
4. Click on a trace to see the full span tree

---

## Sentry Setup (Cloud)

### Step 1: Create Sentry Account

1. Go to https://sentry.io and sign up (free tier: 5K errors/month)
2. Create a new project (Node.js for backend, React for frontend)
3. Copy the DSN from project settings

### Step 2: Configure Environment

```bash
# Backend services
export SENTRY_DSN=https://your-key@o123456.ingest.sentry.io/1234567
export SENTRY_ENVIRONMENT=development

# Frontend (in .env or rspack config)
NX_SENTRY_DSN=https://your-key@o123456.ingest.sentry.io/1234567
```

### Step 3: Start Services with Sentry

```bash
# Start backend with Sentry DSN
SENTRY_DSN=https://your-key@sentry.io/123 pnpm dev:backend
```

### Step 4: Test Error Capture

```bash
# Trigger a test error
curl -k -X POST https://localhost/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"invalid"}'
```

Check your Sentry dashboard - errors should appear within seconds.

---

## Files Reference

### Configuration Files

| File | Purpose |
|------|---------|
| `prometheus/prometheus.yml` | Prometheus scrape configuration |
| `grafana/provisioning/datasources/datasources.yml` | Grafana data sources |
| `grafana/provisioning/dashboards/dashboards.yml` | Dashboard provisioning |
| `grafana/dashboards/api-gateway.json` | API Gateway dashboard |
| `grafana/dashboards/services-overview.json` | Services overview dashboard |

### Docker Services

| Service | Container | Ports |
|---------|-----------|-------|
| Prometheus | mfe-prometheus | 9090 |
| Grafana | mfe-grafana | 3010 |
| Jaeger | mfe-jaeger | 16686, 4317, 4318 |

---

## Scripts Reference

| Script | Description |
|--------|-------------|
| `pnpm observability:start` | Start Prometheus, Grafana, Jaeger |
| `pnpm observability:stop` | Stop observability services |
| `pnpm observability:logs` | View observability service logs |
| `pnpm prometheus:ui` | Open Prometheus UI |
| `pnpm grafana:ui` | Open Grafana UI |
| `pnpm jaeger:ui` | Open Jaeger UI |
| `pnpm metrics:api-gateway` | View API Gateway metrics |

---

## Troubleshooting

### Prometheus Not Scraping Services

**Symptoms:** Targets show as DOWN in Prometheus

**Solutions:**
1. Ensure backend services are running: `pnpm dev:backend`
2. Check service exposes `/metrics` endpoint
3. Verify `host.docker.internal` resolves correctly

```bash
# Test from inside Prometheus container
docker exec mfe-prometheus wget -q -O - http://host.docker.internal:3000/metrics
```

### Grafana Dashboards Empty

**Symptoms:** Dashboards show "No data"

**Solutions:**
1. Check Prometheus is scraping: http://localhost:9090/targets
2. Verify data source is configured: Grafana → Configuration → Data Sources
3. Check time range in Grafana (top right)

### Jaeger No Traces

**Symptoms:** No traces appearing in Jaeger UI

**Solutions:**
1. Verify `OTEL_ENABLED=true` in backend services
2. Check OTLP endpoint: `OTEL_EXPORTER_OTLP_ENDPOINT=http://localhost:4318`
3. Restart backend services after setting environment variables

### Sentry Not Capturing Errors

**Symptoms:** No errors in Sentry dashboard

**Solutions:**
1. Verify `SENTRY_DSN` is set correctly
2. Check DSN format: `https://key@org.ingest.sentry.io/project`
3. Restart services after setting DSN

---

## Production Considerations

### Prometheus

- Configure remote storage (Thanos, Cortex) for long-term retention
- Set up alerting rules
- Use service discovery instead of static configs

### Grafana

- Enable authentication (LDAP, OAuth)
- Configure backup for dashboards
- Set up alerting channels (Slack, PagerDuty)

### Jaeger

- Use Elasticsearch or Cassandra backend for production
- Configure sampling rates (0.1 for production)
- Set up retention policies

### Sentry

- Configure release tracking
- Set up source maps for frontend
- Configure issue assignment rules

---

## Related Documentation

- [Observability Setup Guide](./observability-setup-guide.md) - Code-level integration
- [Testing Guide](./testing-guide.md) - Testing observability
- [Implementation Plan](./implementation-plan.md) - POC-3 overview

---

**Last Updated:** 2026-12-12  
**Status:** Complete

