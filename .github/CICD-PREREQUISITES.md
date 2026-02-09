## CI/CD Prerequisites Checklist

**Last Updated:** February 9, 2026
**Branching Strategy:** Trunk-Based Development

### Repository Setup

- [x] Repository on GitHub with appropriate access
- [ ] Branch protection rules configured for `main`:
  - [ ] Require pull request reviews (1+ reviewers)
  - [ ] Dismiss stale reviews on new commits
  - [ ] Require status checks to pass (use GitHub check names: "CI Status Check", "E2E Tests")
  - [ ] Require branches to be up to date
  - [ ] Require linear history (squash merges recommended)
- [ ] Required reviewers identified

### Trunk-Based Development Notes

- All work merges directly to `main` via short-lived feature branches (< 2 days)
- PRs run full CI including E2E tests before merge
- Main branch will deploy to staging automatically (when CD is implemented)
- Production deployment will require manual approval (when CD is implemented)
- See `docs/POC-3-Implementation/TRUNK-BASED-BRANCHING-PLAN.md` for details

### Secrets Configuration (for CI - hardcoded test values)

- [x] Database URLs for all 4 services (CI uses test containers)
- [x] JWT secrets (access + refresh) (CI uses test secrets)
- [x] RabbitMQ credentials (CI uses test containers)
- [x] Redis URL (CI uses test containers)
- [x] Sentry DSNs (frontend + backend) (configured in codebase)
- [ ] Container registry credentials (needed for CD)
- [ ] Cloud provider credentials (needed for CD)

### Infrastructure Decisions

- [x] Deployment platform chosen (K8s/ECS/Cloud Run/etc.) → **AWS ECS (Fargate)**
- [x] Database hosting decided (RDS/Cloud SQL/self-hosted) → **AWS RDS PostgreSQL**
- [ ] Container registry chosen (GHCR/DockerHub/ECR) → Planned: **AWS ECR**
- [ ] CDN strategy for frontend assets → Planned: **CloudFront**
- [x] SSL certificate strategy decided → **AWS ACM for production, self-signed for local**

### Dockerfiles

- [ ] Dockerfile for shell
- [ ] Dockerfile for auth-mfe
- [ ] Dockerfile for payments-mfe
- [ ] Dockerfile for admin-mfe
- [ ] Dockerfile for profile-mfe
- [ ] Dockerfile for api-gateway
- [ ] Dockerfile for auth-service
- [ ] Dockerfile for payments-service
- [ ] Dockerfile for admin-service
- [ ] Dockerfile for profile-service
- [ ] Dockerfile for nginx (optional)

### Testing Setup

- [x] Unit tests passing locally
- [x] Integration tests configured
- [x] E2E tests working
- [x] Test databases configured (Docker Compose + CI service containers)

### Monitoring (Local Development Complete)

- [x] Sentry projects created
- [x] Prometheus targets configured
- [x] Grafana dashboards ready
- [ ] Alert channels configured (needed for production)

### Production Infrastructure

- [ ] Domain names registered
- [ ] DNS configured
- [ ] SSL certificates obtained (AWS ACM)
- [ ] Load balancers configured (AWS ALB)
- [ ] Firewall rules defined (AWS Security Groups)

---

### Summary

| Category | Complete | Remaining |
|----------|----------|-----------|
| Repository Setup | 1/3 | 2 |
| Secrets (CI) | 5/7 | 2 (CD-specific) |
| Infrastructure Decisions | 3/5 | 2 |
| Dockerfiles | 0/11 | 11 |
| Testing Setup | 4/4 | 0 |
| Monitoring | 3/4 | 1 |
| Production Infrastructure | 0/5 | 5 |

**Next Priority:** Create Dockerfiles for all services (Phase 2 of CI/CD plan)
