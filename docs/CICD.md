# CI/CD Documentation

**Last Updated:** March 17, 2026
**Status:** CI Complete ✅ | CD In Progress (Backend Deployed ✅)
**Branching Strategy:** Trunk-Based Development

---

## Quick Reference

### CI Status: COMPLETE ✅

The CI pipeline runs automatically on push to `main` and on pull requests.

```bash
# Run CI locally before pushing
pnpm lint && pnpm test && pnpm test:backend && pnpm build

# Run E2E tests locally
pnpm build:remotes && pnpm e2e

# Check affected projects only
pnpm nx affected --target=lint,test,build --base=main
```

### CD Status: IN PROGRESS 🔄

**Backend Deployment: COMPLETE ✅**
- ✅ All 5 backend services deployed to Railway (March 17, 2026)
- ✅ Auto-deploy configured for all services
- ✅ Health endpoints verified
- ✅ API Gateway accessible via public URL

**Frontend Deployment: READY TO START ⏳**
- Ready to deploy 5 frontend apps to Vercel
- API Gateway URL available for configuration

**Deployment Options:**

| Option | Use Case | Monthly Cost | Status |
|--------|----------|--------------|--------|
| **POC Demo** | Stakeholder presentation | ~$20-40 | Backend ✅ Frontend ⏳ |
| **Production** | After approval | ~$420-470 | Not Started |

**Next Step:**
- **Current:** [CD-POC-RAILWAY-VERCEL.md](./CD-POC-RAILWAY-VERCEL.md) - Phase 3: Deploy frontend to Vercel
- **Later:** [CD-IMPLEMENTATION-CHECKLIST.md](./CD-IMPLEMENTATION-CHECKLIST.md) (AWS ECS after stakeholder approval)

---

## Table of Contents

1. [CI Pipeline Overview](#1-ci-pipeline-overview)
2. [CD Pipeline Plan](#2-cd-pipeline-plan)
3. [Implementation Status](#3-implementation-status)
4. [AWS Architecture](#4-aws-architecture)
5. [Cost Estimate](#5-cost-estimate)
6. [Quick Start Guide](#6-quick-start-guide)
7. [Troubleshooting](#7-troubleshooting)
8. [Related Documentation](#8-related-documentation)

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
│   (main + PRs)      │     │     (parallel)      │
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
| **Frontend Tests** | ~5-8 min | Jest tests for MFEs and shared libs (357 accessibility tests) |
| **Backend Tests** | ~8-12 min | Jest tests with PostgreSQL, Redis, RabbitMQ containers |
| **Build** | ~8-12 min | Production builds for all 27 projects |
| **E2E Tests** | ~8-15 min | Playwright tests (main + PRs) |
| **Security Scan** | ~5 min | Trivy + npm audit + OWASP ZAP |
| **CI Status** | ~1 min | Final aggregation check |

### Nx Cloud Integration

**Status:** Enabled (50-65% faster builds)

- **Dashboard:** https://cloud.nx.app
- **Workspace ID:** `69524f7134bb55830a5051a9`
- Cache sharing between CI runs and local development

### Workflow Files

| File | Purpose |
|------|---------|
| `.github/workflows/ci.yml` | Main CI workflow |
| `.github/workflows/security-scan.yml` | OWASP ZAP security scanning |

---

## 2. CD Pipeline Plan

### Target Architecture: AWS ECS (Fargate)

**Why ECS Fargate:**
- Docker Compose compatibility (easy migration from local)
- Managed containers (no EC2 management)
- Auto-scaling, pay-per-use
- Blue/green deployments

### CD Workflow

```
CI Pass → Docker Build → Push to ECR → Deploy Staging → Smoke Tests
                                              ↓
Done ← Rollback (if fail) ← Monitor (15m) ← Canary Deploy ← Approve
```

### Environments (Trunk-Based Development)

| Environment | Trigger | Approval |
|-------------|---------|----------|
| **Staging** | Push to `main` | Automatic |
| **Production** | Manual promotion | Manual approval required |

---

## 3. Implementation Status

### Phase Overview

| Phase | Status | Description |
|-------|--------|-------------|
| Phase 1: CI Pipeline | ✅ Complete | GitHub Actions, Nx affected, parallel tests |
| **Phase 2: Docker Configuration** | 🔲 **NEXT** | Dockerfiles for 11 services |
| Phase 3: AWS Infrastructure | 🔲 Pending | VPC, ECR, ECS, RDS, Redis, ALB |
| Phase 4: CD Pipeline - Staging | 🔲 Pending | Auto-deploy, health checks, rollback |
| Phase 5: CD Pipeline - Production | 🔲 Pending | Manual approval, blue/green deployment |
| Phase 6: Database Migration | 🔲 Pending | Automated Prisma migrations |
| Phase 7: Monitoring | 🔲 Pending | CloudWatch, alerting |
| Phase 8: Security Hardening | 🔲 Pending | ACM certificates, secrets rotation |

### Prerequisites Status

**Complete ✅**
- [x] Repository on GitHub
- [x] CI pipeline working
- [x] Nx Cloud integration
- [x] Unit tests passing (357 accessibility tests)
- [x] E2E tests working
- [x] Sentry integration
- [x] Prometheus + Grafana (local)
- [x] **Backend Hardening Phase 1-7** (all security fixes)
- [x] Security testing scripts (`pnpm security:test`, `pnpm security:pentest`)
- [x] Deployment platform decided → AWS ECS Fargate
- [x] Database hosting decided → AWS RDS PostgreSQL
- [x] SSL strategy decided → AWS ACM

**Pending ❌**
- [ ] Dockerfiles (0/11)
- [ ] AWS account with credentials
- [ ] ECR repositories (11)
- [ ] ECS clusters (staging + production)
- [ ] RDS PostgreSQL (4 databases)
- [ ] ElastiCache Redis
- [ ] Application Load Balancer
- [ ] CD workflow files

---

## 4. AWS Architecture

```
                         ┌─────────────────────────────────────────────────────────┐
                         │                    Internet Users                       │
                         └───────────────────────────┬─────────────────────────────┘
                                                     │
                                                     v
                         ┌─────────────────────────────────────────────────────────┐
                         │         Application Load Balancer (ALB)                 │
                         │         - SSL/TLS Termination (ACM)                     │
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

### Services to Deploy (11 total)

**Frontend (5):**
- `shell` - Host application (port 4200)
- `auth-mfe` - Authentication MFE (port 4201)
- `payments-mfe` - Payments MFE (port 4202)
- `admin-mfe` - Admin MFE (port 4203)
- `profile-mfe` - Profile MFE (port 4204)

**Backend (5):**
- `api-gateway` - API Gateway + WebSocket (port 3000)
- `auth-service` - Auth service (port 3001)
- `payments-service` - Payments service (port 3002)
- `admin-service` - Admin service (port 3003)
- `profile-service` - Profile service (port 3004)

**Infrastructure (1):**
- `nginx` - Reverse proxy (ports 80, 443)

---

## 5. Cost Estimate

### Monthly AWS Costs

| Component | Staging | Production | Total |
|-----------|---------|------------|-------|
| **ECS Fargate** | $36 | $146 | $182 |
| **RDS PostgreSQL** | $50 | $99 | $149 |
| **ElastiCache Redis** | $12 | $25 | $37 |
| **Amazon MQ** | - | $37 | $37 |
| **ALB** | - | $26 | $26 |
| **CloudWatch** | - | $25 | $25 |
| **Data Transfer** | - | $9 | $9 |
| **ECR** | - | $1 | $1 |
| **Total** | **~$98** | **~$368** | **~$466** |

**Cost Optimization:**
- First year: ~$50-100/month savings with AWS free tier
- Reserved instances: 30-40% savings on RDS
- Right-sizing: Start small, scale up as needed

### Platform Alternatives

| Platform | Monthly Cost | Setup Complexity | Notes |
|----------|--------------|------------------|-------|
| **AWS ECS (Fargate)** | ~$421 | Medium-High | Enterprise-grade, full control |
| **GCP Cloud Run** | ~$300 | Medium | Serverless containers |
| **DigitalOcean** | ~$220 | Low-Medium | Simple, cost-effective |
| **Render** | ~$118 | Low | Fastest setup, good for startups |
| **Railway** | ~$60-425 | Low | Usage-based, unpredictable |

See: `docs/POC-3-Implementation/AWS-ALTERNATIVES-DEPLOYMENT.md` for full comparison.

---

## 6. Quick Start Guide

### Phase 2: Docker Configuration (Next Step)

```bash
# 1. Create Dockerfiles for all services
# See CD-IMPLEMENTATION-CHECKLIST.md for detailed steps

# 2. Test builds locally
docker build -t shell:dev -f apps/shell/Dockerfile .
docker build -t api-gateway:dev -f apps/api-gateway/Dockerfile .

# 3. Verify image sizes (target: < 500MB each)
docker images | grep -E "(shell|api-gateway|auth)"
```

### Phase 3: AWS Infrastructure

```bash
# 1. Install AWS CDK
npm install -g aws-cdk

# 2. Configure AWS credentials
aws configure

# 3. Bootstrap CDK (one-time)
cdk bootstrap aws://ACCOUNT_ID/REGION

# 4. Deploy infrastructure
cd infrastructure
cdk deploy --all
```

### GitHub Secrets Required

| Secret | Description |
|--------|-------------|
| `AWS_ACCESS_KEY_ID` | AWS access key |
| `AWS_SECRET_ACCESS_KEY` | AWS secret key |
| `AWS_REGION` | AWS region (e.g., `ap-south-1`) |
| `ECR_REGISTRY` | ECR registry URL |

---

## 7. Troubleshooting

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

# Run security tests
pnpm security:test
pnpm security:pentest
```

---

## 8. Related Documentation

### Primary References

| Document | Location | Description |
|----------|----------|-------------|
| **POC Deployment (Railway + Vercel)** | `docs/CD-POC-RAILWAY-VERCEL.md` | Low-cost POC demo deployment |
| **CD Implementation Checklist** | `docs/CD-IMPLEMENTATION-CHECKLIST.md` | AWS production deployment guide |
| **CI Pipeline Details** | `docs/temp/CI-PIPELINE-IMPLEMENTATION.md` | Detailed CI implementation notes |
| **AWS Alternatives** | `docs/POC-3-Implementation/AWS-ALTERNATIVES-DEPLOYMENT.md` | Platform comparison |
| **Backend Hardening** | `docs/POC-3-Implementation/BACKEND-HARDENING-PLAN.md` | Security fixes (all complete) |

### Security Documentation

| Document | Description |
|----------|-------------|
| `scripts/security/security-test.sh` | Automated security tests |
| `scripts/security/manual-pentest.sh` | Manual penetration testing |
| `.github/workflows/security-scan.yml` | OWASP ZAP CI integration |

### Architecture Documentation

| Document | Location |
|----------|----------|
| Executive Summary | `docs/EXECUTIVE_SUMMARY.md` |
| Implementation Journey | `docs/IMPLEMENTATION-JOURNEY.md` |
| Trunk-Based Development | `docs/POC-3-Implementation/TRUNK-BASED-BRANCHING-PLAN.md` |

---

## Document History

| Version | Date | Changes |
|---------|------|---------|
| 3.1 | 2026-02-13 | Added POC deployment option (Railway + Vercel) |
| 3.0 | 2026-02-13 | Updated status: Backend hardening complete, CD ready to start |
| 2.0 | 2026-02-09 | Consolidated CI/CD documentation |
| 1.0 | 2025-12-12 | Initial CI/CD planning |

---

**Next Action:** Start [Phase 2: Docker Configuration](./CD-IMPLEMENTATION-CHECKLIST.md#phase-2-docker-configuration)
