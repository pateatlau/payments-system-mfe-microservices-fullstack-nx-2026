# Task List v2 — Phase 3 (Ultra-Atomic)
## CI/CD, Infrastructure & Deployment Hardening

**Phase:** 3 of 5  
**Prerequisites:** Phase 1 & Phase 2 complete (Gates 1 and 2 PASSED)  
**Gate:** 🚦 Gate 3 — CI/CD & Infrastructure Readiness  
**Tracking Rule:** Check items only after verification passes.

---

# TASK 3.1 — CI Pipeline Foundation (Nx + GitHub Actions)

## Policy & Design
- [ ] Trigger branches defined
- [ ] PR validation rules defined
- [ ] Required checks enforced

## Code & Configuration
- [ ] GitHub Actions workflow created
- [ ] Node versions configured
- [ ] Dependency install locked
- [ ] Nx affected enabled

## Verification
- [ ] PR fails on intentional error
- [ ] PR passes after fix

---

# TASK 3.2 — Containerization Hardening

## Container Policy
- [ ] Base images selected
- [ ] Non-root execution policy defined
- [ ] Image size targets defined

## Code & Dockerfiles
- [ ] Multi-stage builds implemented
- [ ] Build/runtime stages separated
- [ ] Dev dependencies removed
- [ ] Non-root user added
- [ ] Linux capabilities reduced
- [ ] HEALTHCHECK added

## Verification
- [ ] Images build successfully
- [ ] Vulnerability scan performed
- [ ] Containers run as non-root

---

# TASK 3.3 — Cloud Infrastructure Provisioning

## Infrastructure Design
- [ ] AWS region selected
- [ ] VPC and subnet layout defined
- [ ] Security groups defined

## Provisioning
- [ ] ECS cluster provisioned
- [ ] Application Load Balancer provisioned
- [ ] TLS certificates attached
- [ ] RDS provisioned per service
- [ ] Redis provisioned
- [ ] RabbitMQ provisioned
- [ ] IAM roles defined
- [ ] Least-privilege policies attached

## Verification
- [ ] Sample service deployed
- [ ] Network connectivity verified
- [ ] IAM permissions verified

---

# TASK 3.4 — Database Migration Strategy

## Migration Policy
- [ ] Forward-only migration policy defined
- [ ] Rollback strategy defined
- [ ] Migration ownership assigned

## Code & Tooling
- [ ] prisma migrate deploy enabled in CI
- [ ] Startup migration execution controlled
- [ ] App blocks on migration failure

## Verification
- [ ] Migrations run in staging
- [ ] Failed migration simulated
- [ ] Rollback behavior verified

---

# TASK 3.5 — Deployment Strategy

## Deployment Policy
- [ ] Deployment strategy selected
- [ ] Health check thresholds defined
- [ ] Rollback triggers defined

## Code & Configuration
- [ ] ECS service deployment settings configured
- [ ] ALB health checks configured
- [ ] Zero-downtime deployment enabled

## Verification
- [ ] New version deployed successfully
- [ ] No downtime observed
- [ ] Rollback tested and verified

---

## PHASE 3 COMPLETION

- [ ] All Phase 3 tasks complete
- [ ] All verification steps passed
- [ ] CI/CD and infrastructure stable

🚦 **GATE 3 PASSED**
