## CI/CD Prerequisites Checklist

### Repository Setup

- [ ] Repository on GitHub with appropriate access
- [ ] Branch protection rules configured
- [ ] Required reviewers identified

### Secrets Configuration

- [ ] Database URLs for all 4 services
- [ ] JWT secrets (access + refresh)
- [ ] RabbitMQ credentials
- [ ] Redis URL
- [ ] Sentry DSNs (frontend + backend)
- [ ] Container registry credentials
- [ ] Cloud provider credentials (if applicable)

### Infrastructure Decisions

- [ ] Deployment platform chosen (K8s/ECS/Cloud Run/etc.)
- [ ] Database hosting decided (RDS/Cloud SQL/self-hosted)
- [ ] Container registry chosen (GHCR/DockerHub/ECR)
- [ ] CDN strategy for frontend assets
- [ ] SSL certificate strategy decided

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

- [ ] Unit tests passing locally
- [ ] Integration tests configured
- [ ] E2E tests working
- [ ] Test databases configured

### Monitoring

- [ ] Sentry projects created
- [ ] Prometheus targets configured
- [ ] Grafana dashboards ready
- [ ] Alert channels configured

### Production Infrastructure

- [ ] Domain names registered
- [ ] DNS configured
- [ ] SSL certificates obtained
- [ ] Load balancers configured
- [ ] Firewall rules defined
