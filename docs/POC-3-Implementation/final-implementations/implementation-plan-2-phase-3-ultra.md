# Implementation Plan v2 — Phase 3 (Ultra-Atomic)
## CI/CD, Infrastructure & Deployment Hardening

**Phase:** 3 of 5  
**Granularity:** Ultra-Atomic (Policy / Infra → Code → Verification)  
**Prerequisites:** Phase 1 & Phase 2 completed, Gates 1 and 2 PASSED  
**Gate:** 🚦 Gate 3 — CI/CD & Infrastructure Readiness  
**Execution Rule:** Execute ONE sub-task at a time. Verify before proceeding.

---

## Scope of Phase 3

This phase establishes a **reproducible, secure, and observable delivery pipeline**:
- Deterministic builds
- Automated testing
- Secure containerization
- Cloud infrastructure provisioning
- Safe database migrations
- Controlled deployments

No production traffic may be enabled until Phase 3 is complete.

---

# TASK 3.1 — CI Pipeline Foundation (Nx + GitHub Actions)

## Objective
Ensure every change is built, tested, and validated automatically.

---

## Dimension A — Policy & Design

### 3.1.A.1 CI Scope Definition
1. Define trigger branches (main, release/*).
2. Define PR validation rules.
3. Define required checks for merge.

---

## Dimension B — Code & Configuration

### 3.1.B.1 GitHub Actions Workflow
1. Create `.github/workflows/ci.yml`.
2. Configure Node version matrix.
3. Install dependencies with lockfile enforcement.
4. Enable Nx affected graph.

---

### 3.1.B.2 Test Execution
1. Run unit tests for affected projects.
2. Run integration tests for affected services.
3. Run frontend build for shell + MFEs.

---

## Dimension C — Verification

1. Open PR with intentional failure.
2. Confirm CI blocks merge.
3. Fix failure and confirm CI passes.

---

# TASK 3.2 — Containerization Hardening

## Objective
Produce minimal, secure, reproducible container images.

---

## Dimension A — Container Policy

1. Define base images.
2. Define non-root execution policy.
3. Define image size targets.

---

## Dimension B — Code & Dockerfiles

### 3.2.B.1 Multi-stage Builds
1. Convert service Dockerfiles to multi-stage.
2. Separate build and runtime stages.
3. Remove dev dependencies from runtime.

---

### 3.2.B.2 Runtime Hardening
1. Add non-root user.
2. Drop unnecessary Linux capabilities.
3. Add HEALTHCHECK instruction.

---

## Dimension C — Verification

1. Build images locally.
2. Scan images for vulnerabilities.
3. Verify containers run as non-root.

---

# TASK 3.3 — Cloud Infrastructure Provisioning

## Objective
Provision reproducible cloud infrastructure.

---

## Dimension A — Infrastructure Design

1. Define AWS regions.
2. Define VPC and subnet layout.
3. Define security group rules.

---

## Dimension B — Provisioning

### 3.3.B.1 Compute & Networking
1. Provision ECS cluster (Fargate).
2. Provision Application Load Balancer.
3. Attach TLS certificates.

---

### 3.3.B.2 Storage & Messaging
1. Provision RDS per service.
2. Provision Redis.
3. Provision RabbitMQ.

---

### 3.3.B.3 IAM
1. Define task execution roles.
2. Define least-privilege policies.
3. Attach roles to services.

---

## Dimension C — Verification

1. Deploy sample service.
2. Verify connectivity.
3. Verify IAM permissions.

---

# TASK 3.4 — Database Migration Strategy

## Objective
Ensure safe, repeatable schema migrations.

---

## Dimension A — Migration Policy

1. Define forward-only migrations.
2. Define rollback strategy.
3. Define migration ownership.

---

## Dimension B — Code & Tooling

1. Enable `prisma migrate deploy` in CI.
2. Run migrations on startup (controlled).
3. Block app start on migration failure.

---

## Dimension C — Verification

1. Run migrations in staging.
2. Simulate failed migration.
3. Verify rollback behavior.

---

# TASK 3.5 — Deployment Strategy

## Objective
Enable safe, repeatable deployments.

---

## Dimension A — Deployment Policy

1. Define deployment strategy (rolling).
2. Define health check thresholds.
3. Define rollback triggers.

---

## Dimension B — Code & Config

1. Configure ECS service deployment settings.
2. Configure ALB health checks.
3. Enable zero-downtime deployments.

---

## Dimension C — Verification

1. Deploy new version.
2. Confirm zero downtime.
3. Trigger rollback and verify.

---

## PHASE 3 EXIT CRITERIA

- CI blocks failing changes
- Containers hardened and scanned
- Infrastructure reproducible
- Migrations safe and automated
- Deployments zero-downtime

🚦 **GATE 3 PASSED**
