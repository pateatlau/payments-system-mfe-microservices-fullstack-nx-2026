# CI/CD Documentation

**Last Updated:** January 16, 2026
**Status:** CI Complete, CD Pending

---

## Quick Reference

### CI Status: COMPLETE ✅

The CI pipeline runs automatically on push/PR to main, develop, feature/*, fix/* branches.

```bash
# Run CI locally before pushing
pnpm lint && pnpm test && pnpm test:backend && pnpm build

# Run E2E tests locally
pnpm build:remotes && pnpm e2e

# Check affected projects only
pnpm nx affected --target=lint,test,build --base=main
```

### CD Status: NOT STARTED ❌

Requires: Dockerfiles (0/11 complete), AWS infrastructure, CD workflows.

---

## Table of Contents

1. [CI Pipeline Overview](#1-ci-pipeline-overview)
2. [CD Pipeline Plan](#2-cd-pipeline-plan)
3. [Prerequisites Checklist](#3-prerequisites-checklist)
4. [Implementation Phases](#4-implementation-phases)
5. [AWS Architecture](#5-aws-architecture)
6. [Troubleshooting](#6-troubleshooting)
7. [Security Considerations](#7-security-considerations)

---

## 1. CI Pipeline Overview

### Pipeline Architecture

```
┌─────────────────────┐     ┌─────────────────────┐     ┌─────────────────────┐
│  lint-and-typecheck │     │   test-frontend     │     │   test-backend      │
│     (parallel)      │     │     (parallel)      │     │     (parallel)      │
└──────────┬──────────┘     └──────────┬──────────┘     └──────────┬──────────┘
           │                           │                           │
           ▼                           │                           │
┌─────────────────────┐                │                           │
│       build         │◄───────────────┴───────────────────────────┘
│   (depends on lint) │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐     ┌─────────────────────┐
│     e2e-tests       │     │   security-scan     │
│ (main/develop only) │     │     (parallel)      │
└─────────────────────┘     └─────────────────────┘
           │
           ▼
┌─────────────────────┐
│     ci-status       │
│   (final check)     │
└─────────────────────┘
```

### Jobs Summary

| Job | Duration | Description |
|-----|----------|-------------|
| **Lint & TypeCheck** | ~3-5 min | ESLint + TypeScript checking |
| **Frontend Tests** | ~5-8 min | Jest tests for MFEs and shared libs |
| **Backend Tests** | ~8-12 min | Jest tests with PostgreSQL, Redis, RabbitMQ containers |
| **Build** | ~8-12 min | Production builds for all 27 projects |
| **E2E Tests** | ~8-15 min | Playwright tests (main/develop only) |
| **Security Scan** | ~5 min | Trivy + npm audit |
| **CI Status** | ~1 min | Final aggregation check |

### Nx Cloud Integration

**Status:** Enabled (50-65% faster builds)

- **Dashboard:** https://cloud.nx.app
- **Workspace ID:** `69524f7134bb55830a5051a9`
- Cache sharing between CI runs and local development

### Workflow File

Location: `.github/workflows/ci.yml`

**Triggers:**
- Push to: main, develop, feature/*, fix/*
- Pull requests to: main, develop

---

## 2. CD Pipeline Plan

### Target Architecture: AWS ECS (Fargate)

**Why ECS Fargate:**
- Docker Compose compatibility
- Managed containers (no EC2 management)
- Auto-scaling, pay-per-use
- Blue/green deployments

### CD Workflow (Planned)

```
CI Pass → Docker Build → Push to ECR → Deploy Staging → Smoke Tests
                                              ↓
Done ← Rollback (if fail) ← Monitor (15m) ← Canary Deploy ← Approve
```

### Environments

| Environment | Trigger | Approval |
|-------------|---------|----------|
| **Staging** | Push to `develop` | Automatic |
| **Production** | Push to `main` | Manual approval required |

---

## 3. Prerequisites Checklist

### Complete ✅

- [x] Repository on GitHub
- [x] CI pipeline working
- [x] Nx Cloud integration
- [x] Unit tests passing
- [x] Integration tests configured
- [x] E2E tests working
- [x] Sentry integration
- [x] Prometheus + Grafana (local)
- [x] Deployment platform decided → AWS ECS Fargate
- [x] Database hosting decided → AWS RDS PostgreSQL
- [x] SSL strategy decided → AWS ACM

### Pending ❌

**Dockerfiles (0/11):**
- [ ] shell
- [ ] auth-mfe
- [ ] payments-mfe
- [ ] admin-mfe
- [ ] profile-mfe
- [ ] api-gateway
- [ ] auth-service
- [ ] payments-service
- [ ] admin-service
- [ ] profile-service
- [ ] nginx (optional)

**AWS Infrastructure:**
- [ ] AWS account with credentials
- [ ] ECR repositories (11)
- [ ] ECS clusters (staging + production)
- [ ] RDS PostgreSQL (4 databases)
- [ ] ElastiCache Redis
- [ ] Application Load Balancer
- [ ] VPC with subnets
- [ ] Security groups
- [ ] AWS Secrets Manager
- [ ] ACM certificates

**CD Workflows:**
- [ ] `.github/workflows/cd-staging.yml`
- [ ] `.github/workflows/cd-production.yml`

**Production:**
- [ ] Domain name
- [ ] DNS configuration
- [ ] Alert channels (PagerDuty/Opsgenie)

---

## 4. Implementation Phases

### Phase 1: CI Pipeline ✅ COMPLETE

- GitHub Actions workflow
- Nx affected builds
- Parallel test execution
- Nx Cloud caching

### Phase 2: Docker Configuration ❌ NEXT

**Tasks:**
1. Create Dockerfiles for all 10 services + nginx
2. Multi-stage builds for optimization
3. Configure `.dockerignore`
4. Test builds locally
5. Target: Images < 500MB each

### Phase 3: AWS Infrastructure ❌

**Tasks:**
1. Set up AWS CDK project (TypeScript)
2. Create VPC with public/private subnets
3. Create ECR repositories
4. Create ECS clusters
5. Set up RDS PostgreSQL (4 databases)
6. Configure ElastiCache Redis
7. Set up Application Load Balancer
8. Configure security groups and IAM roles

### Phase 4: CD Pipeline - Staging ❌

**Tasks:**
1. Create `cd-staging.yml` workflow
2. Build and push Docker images to ECR
3. Create ECS task definitions
4. Deploy to staging cluster
5. Configure health checks
6. Set up rollback mechanism

### Phase 5: CD Pipeline - Production ❌

**Tasks:**
1. Create `cd-production.yml` workflow
2. Add manual approval gate
3. Blue/green deployment
4. Enhanced health checks
5. Database migration automation

### Phase 6-8: Monitoring, Security, Storybook ❌

- CloudWatch integration
- Security scanning in CI
- Storybook deployment (optional)

---

## 5. AWS Architecture

```
                         ┌─────────────────────────────────────────────────────────┐
                         │                    Internet Users                       │
                         └───────────────────────────┬─────────────────────────────┘
                                                     │
                                                     v
                         ┌─────────────────────────────────────────────────────────┐
                         │         Application Load Balancer (ALB)                 │
                         │         - SSL/TLS Termination                           │
                         │         - Health Checks                                 │
                         │         - Routing Rules                                 │
                         └───────────────────────────┬─────────────────────────────┘
                                                     │
                                                     v
                         ┌──────────────────────────────────────────────────────────┐
                         │              ECS Cluster (Fargate)                       │
                         │  ┌────────────────────────────────────────────────────┐  │
                         │  │  Frontend Services                                 │  │
                         │  │  Shell(4200) Auth(4201) Payments(4202)             │  │
                         │  │  Admin(4203) Profile(4204)                         │  │
                         │  └────────────────────────────────────────────────────┘  │
                         │  ┌────────────────────────────────────────────────────┐  │
                         │  │  Backend Services                                  │  │
                         │  │  nginx → API Gateway(3000) →                       │  │
                         │  │    Auth(3001) Payments(3002) Admin(3003)           │  │
                         │  │    Profile(3004)                                   │  │
                         │  └────────────────────────────────────────────────────┘  │
                         └──────────────────────────────┬───────────────────────────┘
                                                        │
                                      ┌─────────────────┼─────────────────┐
                                      │                 │                 │
                                      v                 v                 v
                              ┌────────────────┐ ┌──────────────┐ ┌──────────────┐
                              │     RDS        │ │ ElastiCache  │ │  Amazon MQ   │
                              │  PostgreSQL    │ │    Redis     │ │   RabbitMQ   │
                              │  (4 DBs)       │ │              │ │              │
                              └────────────────┘ └──────────────┘ └──────────────┘
```

### Cost Estimate

| Environment | Monthly Cost |
|-------------|--------------|
| Staging | ~$120 |
| Production | ~$300 |
| **Total** | **~$420** |

---

## 6. Troubleshooting

### Common CI Failures

| Issue | Diagnosis | Solution |
|-------|-----------|----------|
| Lint failed | ESLint errors | `pnpm nx affected --target=lint --fix --base=main` |
| TypeCheck failed | Type errors | Check imports and type definitions |
| Tests failed | Test errors | `pnpm nx affected --target=test --base=main` |
| Build failed | Compilation errors | Check dependencies, run `pnpm install` |
| E2E timeout | Backend not ready | Check health endpoint, increase wait |
| Wrong API URL | Cached build | Add `--skip-nx-cache` flag |
| Prisma error | Missing client | Run `pnpm db:all:generate` |
| Module Federation fail | CORS error | Ensure `--cors` flag on serve |

### Useful Commands

```bash
# Check CI status for PR
gh pr checks

# View workflow runs
gh run list

# Re-run failed jobs
gh run rerun <run-id>

# Download artifacts
gh run download <run-id>

# Skip CI (docs only)
git commit -m "docs: update README [skip ci]"
```

---

## 7. Security Considerations

### CI Security

- **Trivy scanning:** CRITICAL and HIGH vulnerabilities
- **npm audit:** Dependency vulnerability checking
- **Secrets:** Stored in GitHub Secrets, not in code
- **Permissions:** Minimal (`contents: read`, `security-events: write`)

### CD Security (Planned)

- AWS Secrets Manager for production secrets
- IAM roles with least privilege
- Security groups for network isolation
- SSL/TLS via AWS ACM
- No secrets in Docker images

### ⚠️ Backend Hardening Required

Before production deployment, complete backend security fixes:

1. **Rate Limiting** - Currently disabled (100,000 instead of 100)
2. **JWT Rotation** - No refresh token rotation
3. **Account Lockout** - No protection against brute force
4. **Input Validation** - Missing in payments/admin services

See: `docs/POC-3-Implementation/BACKEND-HARDENING-PLAN.md`

---

## File References

| File | Purpose |
|------|---------|
| `.github/workflows/ci.yml` | CI workflow definition |
| `.github/CICD-PREREQUISITES.md` | Prerequisites checklist |
| `docs/POC-3-Implementation/BACKEND-HARDENING-PLAN.md` | Security fixes required |
| `apps/shell-e2e/playwright.config.ts` | E2E test configuration |
| `nx.json` | Nx workspace + cloud configuration |

---

## Next Steps

1. **Immediate:** Create Dockerfiles for all services (Phase 2)
2. **Then:** Set up AWS infrastructure (Phase 3)
3. **Then:** Create CD workflows (Phase 4-5)

**Blocking Issue:** Consider completing Backend Hardening Phase 1-2 before production deployment.
