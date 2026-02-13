# CD Implementation Checklist

**Created:** February 13, 2026
**Status:** Ready to Start
**Target Platform:** AWS ECS (Fargate)
**Estimated Timeline:** 4-6 weeks

---

## Overview

This checklist provides a step-by-step guide to implement Continuous Deployment for the MFE Payments System. All security prerequisites have been completed (Backend Hardening Phase 1-7).

### Quick Stats

| Metric | Value |
|--------|-------|
| Services to containerize | 11 |
| Databases | 4 (PostgreSQL) |
| Environments | 2 (Staging + Production) |
| Estimated monthly cost | ~$420-470 |

---

## Phase 2: Docker Configuration

**Status:** 🔲 Not Started
**Estimated Time:** 5-7 days
**Dependencies:** None (ready to start)

### 2.1 Create Frontend Dockerfiles

All frontend MFEs use the same multi-stage build pattern.

#### Shell App
- [ ] Create `apps/shell/Dockerfile`
- [ ] Create `apps/shell/.dockerignore`
- [ ] Test build: `docker build -t shell:dev -f apps/shell/Dockerfile .`
- [ ] Verify size < 100MB (static files served by nginx)

#### Auth MFE
- [ ] Create `apps/auth-mfe/Dockerfile`
- [ ] Create `apps/auth-mfe/.dockerignore`
- [ ] Test build: `docker build -t auth-mfe:dev -f apps/auth-mfe/Dockerfile .`
- [ ] Verify size < 100MB

#### Payments MFE
- [ ] Create `apps/payments-mfe/Dockerfile`
- [ ] Create `apps/payments-mfe/.dockerignore`
- [ ] Test build: `docker build -t payments-mfe:dev -f apps/payments-mfe/Dockerfile .`
- [ ] Verify size < 100MB

#### Admin MFE
- [ ] Create `apps/admin-mfe/Dockerfile`
- [ ] Create `apps/admin-mfe/.dockerignore`
- [ ] Test build: `docker build -t admin-mfe:dev -f apps/admin-mfe/Dockerfile .`
- [ ] Verify size < 100MB

#### Profile MFE
- [ ] Create `apps/profile-mfe/Dockerfile`
- [ ] Create `apps/profile-mfe/.dockerignore`
- [ ] Test build: `docker build -t profile-mfe:dev -f apps/profile-mfe/Dockerfile .`
- [ ] Verify size < 100MB

<details>
<summary>Frontend Dockerfile Template</summary>

```dockerfile
# apps/shell/Dockerfile
# Stage 1: Build
FROM node:24-alpine AS builder

WORKDIR /app

# Install pnpm
RUN corepack enable && corepack prepare pnpm@9 --activate

# Copy package files
COPY package.json pnpm-lock.yaml ./
COPY nx.json tsconfig.base.json ./

# Install dependencies
RUN pnpm install --frozen-lockfile

# Copy source code
COPY apps/shell ./apps/shell
COPY libs ./libs

# Build the app
ARG NX_API_BASE_URL
ENV NX_API_BASE_URL=${NX_API_BASE_URL:-https://api.example.com}

RUN pnpm nx build shell --configuration=production

# Stage 2: Serve with nginx
FROM nginx:alpine

# Copy built files
COPY --from=builder /app/dist/apps/shell /usr/share/nginx/html

# Copy nginx config
COPY apps/shell/nginx.conf /etc/nginx/conf.d/default.conf

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:80/health || exit 1

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
```

</details>

### 2.2 Create Backend Dockerfiles

All backend services use Node.js multi-stage builds with Prisma.

#### API Gateway
- [ ] Create `apps/api-gateway/Dockerfile`
- [ ] Create `apps/api-gateway/.dockerignore`
- [ ] Test build: `docker build -t api-gateway:dev -f apps/api-gateway/Dockerfile .`
- [ ] Verify size < 300MB
- [ ] Verify health endpoint works

#### Auth Service
- [ ] Create `apps/auth-service/Dockerfile`
- [ ] Create `apps/auth-service/.dockerignore`
- [ ] Include Prisma schema and migrations
- [ ] Test build: `docker build -t auth-service:dev -f apps/auth-service/Dockerfile .`
- [ ] Verify size < 300MB

#### Payments Service
- [ ] Create `apps/payments-service/Dockerfile`
- [ ] Create `apps/payments-service/.dockerignore`
- [ ] Include Prisma schema and migrations
- [ ] Test build: `docker build -t payments-service:dev -f apps/payments-service/Dockerfile .`
- [ ] Verify size < 300MB

#### Admin Service
- [ ] Create `apps/admin-service/Dockerfile`
- [ ] Create `apps/admin-service/.dockerignore`
- [ ] Include Prisma schema and migrations
- [ ] Test build: `docker build -t admin-service:dev -f apps/admin-service/Dockerfile .`
- [ ] Verify size < 300MB

#### Profile Service
- [ ] Create `apps/profile-service/Dockerfile`
- [ ] Create `apps/profile-service/.dockerignore`
- [ ] Include Prisma schema and migrations
- [ ] Test build: `docker build -t profile-service:dev -f apps/profile-service/Dockerfile .`
- [ ] Verify size < 300MB

<details>
<summary>Backend Dockerfile Template</summary>

```dockerfile
# apps/auth-service/Dockerfile
# Stage 1: Build
FROM node:24-alpine AS builder

WORKDIR /app

# Install pnpm
RUN corepack enable && corepack prepare pnpm@9 --activate

# Copy package files
COPY package.json pnpm-lock.yaml ./
COPY nx.json tsconfig.base.json ./

# Install dependencies
RUN pnpm install --frozen-lockfile

# Copy source code
COPY apps/auth-service ./apps/auth-service
COPY libs ./libs

# Generate Prisma client
RUN pnpm db:auth:generate

# Build the service
RUN pnpm nx build auth-service --configuration=production

# Stage 2: Production
FROM node:24-alpine AS runner

WORKDIR /app

# Install pnpm for production deps
RUN corepack enable && corepack prepare pnpm@9 --activate

# Copy package files
COPY package.json pnpm-lock.yaml ./

# Install production dependencies only
RUN pnpm install --frozen-lockfile --prod

# Copy Prisma schema and migrations
COPY apps/auth-service/prisma ./apps/auth-service/prisma

# Copy built application
COPY --from=builder /app/dist/apps/auth-service ./dist/apps/auth-service
COPY --from=builder /app/apps/auth-service/node_modules/.prisma ./node_modules/.prisma

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3001/health || exit 1

# Run as non-root user
RUN addgroup -g 1001 -S nodejs && adduser -S nodejs -u 1001
USER nodejs

EXPOSE 3001

CMD ["node", "dist/apps/auth-service/main.js"]
```

</details>

### 2.3 Create nginx Dockerfile

- [ ] Create `nginx/Dockerfile`
- [ ] Copy `nginx.conf` for production
- [ ] Configure SSL/TLS (certificates mounted at runtime)
- [ ] Test build: `docker build -t nginx:dev -f nginx/Dockerfile .`
- [ ] Verify reverse proxy routing works

<details>
<summary>nginx Dockerfile</summary>

```dockerfile
# nginx/Dockerfile
FROM nginx:alpine

# Copy production nginx config
COPY nginx/nginx.prod.conf /etc/nginx/nginx.conf

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:80/health || exit 1

EXPOSE 80 443

CMD ["nginx", "-g", "daemon off;"]
```

</details>

### 2.4 Create Docker Compose for Local Testing

- [ ] Create `docker-compose.prod.yml` for production-like local testing
- [ ] Test full stack: `docker-compose -f docker-compose.prod.yml up`
- [ ] Verify all services communicate correctly
- [ ] Verify health checks pass

### 2.5 Optimize Docker Builds

- [ ] Create root `.dockerignore` with common excludes
- [ ] Verify multi-stage builds minimize image sizes
- [ ] Test build caching effectiveness
- [ ] Document build commands in README

**Phase 2 Completion Criteria:**
- [ ] All 11 Dockerfiles created and tested
- [ ] All images build successfully
- [ ] All images < 500MB (frontend < 100MB, backend < 300MB)
- [ ] Health checks working for all services
- [ ] Local Docker Compose stack runs end-to-end

---

## Phase 3: AWS Infrastructure Setup

**Status:** 🔲 Not Started
**Estimated Time:** 7-10 days
**Dependencies:** Phase 2 complete

### 3.1 AWS Account Setup

- [ ] Create or use existing AWS account
- [ ] Set up billing alerts ($100, $200, $500 thresholds)
- [ ] Create IAM user for CI/CD with programmatic access
- [ ] Configure AWS CLI locally: `aws configure`
- [ ] Store credentials securely (AWS credentials file)

### 3.2 Create ECR Repositories

Create one repository per service (11 total):

```bash
# Create ECR repositories
aws ecr create-repository --repository-name mfe-payments/shell
aws ecr create-repository --repository-name mfe-payments/auth-mfe
aws ecr create-repository --repository-name mfe-payments/payments-mfe
aws ecr create-repository --repository-name mfe-payments/admin-mfe
aws ecr create-repository --repository-name mfe-payments/profile-mfe
aws ecr create-repository --repository-name mfe-payments/api-gateway
aws ecr create-repository --repository-name mfe-payments/auth-service
aws ecr create-repository --repository-name mfe-payments/payments-service
aws ecr create-repository --repository-name mfe-payments/admin-service
aws ecr create-repository --repository-name mfe-payments/profile-service
aws ecr create-repository --repository-name mfe-payments/nginx
```

- [ ] Create all 11 ECR repositories
- [ ] Enable image scanning on push
- [ ] Configure lifecycle policy (keep last 10 images)
- [ ] Test push: `docker push <ecr-url>/mfe-payments/shell:test`

### 3.3 Set Up VPC and Networking

- [ ] Create VPC with CIDR 10.0.0.0/16
- [ ] Create 2 public subnets (for ALB)
- [ ] Create 2 private subnets (for ECS tasks)
- [ ] Create Internet Gateway
- [ ] Create NAT Gateway (for private subnet outbound)
- [ ] Configure route tables
- [ ] Create security groups:
  - [ ] ALB security group (80, 443 from internet)
  - [ ] ECS security group (allow from ALB only)
  - [ ] RDS security group (5432 from ECS only)
  - [ ] Redis security group (6379 from ECS only)
  - [ ] RabbitMQ security group (5672 from ECS only)

### 3.4 Create RDS PostgreSQL Instances

Create 4 separate databases (one per service):

- [ ] Create RDS subnet group
- [ ] Create `auth-db` instance (db.t3.micro for staging, db.t3.small for prod)
- [ ] Create `payments-db` instance
- [ ] Create `admin-db` instance
- [ ] Create `profile-db` instance
- [ ] Enable automated backups (7 days retention)
- [ ] Enable encryption at rest
- [ ] Store credentials in AWS Secrets Manager
- [ ] Test connectivity from local machine (via bastion or VPN)

### 3.5 Create ElastiCache Redis

- [ ] Create Redis subnet group
- [ ] Create Redis cluster (cache.t3.micro for staging)
- [ ] Enable encryption in transit
- [ ] Configure security group
- [ ] Test connectivity

### 3.6 Create Amazon MQ (RabbitMQ)

- [ ] Create Amazon MQ broker (mq.t3.micro for staging)
- [ ] Configure security group
- [ ] Store credentials in Secrets Manager
- [ ] Test connectivity

### 3.7 Create Application Load Balancer

- [ ] Create ALB in public subnets
- [ ] Create target groups:
  - [ ] `shell-tg` (port 80)
  - [ ] `auth-mfe-tg` (port 80)
  - [ ] `payments-mfe-tg` (port 80)
  - [ ] `admin-mfe-tg` (port 80)
  - [ ] `profile-mfe-tg` (port 80)
  - [ ] `api-gateway-tg` (port 3000)
- [ ] Configure health checks for each target group
- [ ] Create listener rules for routing
- [ ] Request ACM certificate for domain
- [ ] Configure HTTPS listener (port 443)
- [ ] Redirect HTTP to HTTPS

### 3.8 Create ECS Clusters

- [ ] Create staging ECS cluster
- [ ] Create production ECS cluster
- [ ] Configure cluster settings (Container Insights enabled)

### 3.9 Create ECS Task Definitions

Create task definition for each service:

- [ ] `shell-task` - Frontend shell
- [ ] `auth-mfe-task` - Auth MFE
- [ ] `payments-mfe-task` - Payments MFE
- [ ] `admin-mfe-task` - Admin MFE
- [ ] `profile-mfe-task` - Profile MFE
- [ ] `api-gateway-task` - API Gateway
- [ ] `auth-service-task` - Auth Service
- [ ] `payments-service-task` - Payments Service
- [ ] `admin-service-task` - Admin Service
- [ ] `profile-service-task` - Profile Service

Each task definition should include:
- [ ] Container definitions with resource limits
- [ ] Environment variables (from Secrets Manager)
- [ ] Log configuration (CloudWatch Logs)
- [ ] Health check configuration

### 3.10 Set Up AWS Secrets Manager

Store all sensitive configuration:

- [ ] Database URLs for each service
- [ ] JWT secrets
- [ ] Redis URL
- [ ] RabbitMQ URL
- [ ] Razorpay API keys (placeholder)
- [ ] Sentry DSN

### 3.11 Create IAM Roles

- [ ] ECS task execution role (access ECR, Secrets Manager, CloudWatch)
- [ ] ECS task role (service-specific permissions)
- [ ] CI/CD role (deploy to ECS, push to ECR)

**Phase 3 Completion Criteria:**
- [ ] All AWS resources provisioned
- [ ] Security groups configured correctly
- [ ] Databases accessible from ECS
- [ ] Secrets stored in Secrets Manager
- [ ] ECR repositories accessible
- [ ] Test deployment of one service successful

---

## Phase 4: CD Pipeline - Staging

**Status:** 🔲 Not Started
**Estimated Time:** 5-7 days
**Dependencies:** Phase 3 complete

### 4.1 Create GitHub Secrets

Add to repository settings → Secrets and variables → Actions:

- [ ] `AWS_ACCESS_KEY_ID`
- [ ] `AWS_SECRET_ACCESS_KEY`
- [ ] `AWS_REGION` (e.g., `ap-south-1`)
- [ ] `ECR_REGISTRY` (e.g., `123456789.dkr.ecr.ap-south-1.amazonaws.com`)
- [ ] `ECS_CLUSTER_STAGING`
- [ ] `ECS_CLUSTER_PRODUCTION`

### 4.2 Create CD Staging Workflow

- [ ] Create `.github/workflows/cd-staging.yml`
- [ ] Trigger on push to `main` branch
- [ ] Build all Docker images
- [ ] Push to ECR
- [ ] Update ECS task definitions
- [ ] Deploy to staging cluster
- [ ] Run smoke tests
- [ ] Configure rollback on failure

<details>
<summary>CD Staging Workflow Template</summary>

```yaml
# .github/workflows/cd-staging.yml
name: CD - Staging

on:
  push:
    branches:
      - main

env:
  AWS_REGION: ${{ secrets.AWS_REGION }}
  ECR_REGISTRY: ${{ secrets.ECR_REGISTRY }}
  ECS_CLUSTER: ${{ secrets.ECS_CLUSTER_STAGING }}

jobs:
  build-and-push:
    runs-on: ubuntu-latest
    strategy:
      matrix:
        service:
          - shell
          - auth-mfe
          - payments-mfe
          - admin-mfe
          - profile-mfe
          - api-gateway
          - auth-service
          - payments-service
          - admin-service
          - profile-service
    steps:
      - uses: actions/checkout@v4

      - name: Configure AWS credentials
        uses: aws-actions/configure-aws-credentials@v4
        with:
          aws-access-key-id: ${{ secrets.AWS_ACCESS_KEY_ID }}
          aws-secret-access-key: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
          aws-region: ${{ env.AWS_REGION }}

      - name: Login to ECR
        id: login-ecr
        uses: aws-actions/amazon-ecr-login@v2

      - name: Build and push Docker image
        run: |
          docker build -t ${{ env.ECR_REGISTRY }}/mfe-payments/${{ matrix.service }}:${{ github.sha }} \
            -f apps/${{ matrix.service }}/Dockerfile .
          docker push ${{ env.ECR_REGISTRY }}/mfe-payments/${{ matrix.service }}:${{ github.sha }}

  deploy-staging:
    needs: build-and-push
    runs-on: ubuntu-latest
    steps:
      - name: Configure AWS credentials
        uses: aws-actions/configure-aws-credentials@v4
        with:
          aws-access-key-id: ${{ secrets.AWS_ACCESS_KEY_ID }}
          aws-secret-access-key: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
          aws-region: ${{ env.AWS_REGION }}

      - name: Deploy to ECS
        run: |
          # Update each service (simplified - use task definition files in practice)
          aws ecs update-service --cluster ${{ env.ECS_CLUSTER }} \
            --service shell --force-new-deployment

  smoke-tests:
    needs: deploy-staging
    runs-on: ubuntu-latest
    steps:
      - name: Wait for deployment
        run: sleep 60

      - name: Run smoke tests
        run: |
          curl -f https://staging.example.com/health || exit 1
          curl -f https://staging.example.com/api/health || exit 1
```

</details>

### 4.3 Configure Health Checks

- [ ] Verify `/health` endpoint on all services
- [ ] Configure ECS health check settings
- [ ] Configure ALB health check settings
- [ ] Set appropriate timeouts (start period, interval)

### 4.4 Configure Rollback

- [ ] Set up ECS deployment circuit breaker
- [ ] Configure minimum healthy percent
- [ ] Test rollback by deploying broken image
- [ ] Verify previous version is restored

### 4.5 Test Staging Pipeline

- [ ] Push to `main` and verify deployment
- [ ] Verify all services healthy
- [ ] Test application functionality
- [ ] Verify logs in CloudWatch
- [ ] Verify metrics in CloudWatch

**Phase 4 Completion Criteria:**
- [ ] CD workflow runs on push to `main`
- [ ] All services deploy successfully
- [ ] Health checks pass
- [ ] Rollback works on failure
- [ ] Staging environment accessible

---

## Phase 5: CD Pipeline - Production

**Status:** 🔲 Not Started
**Estimated Time:** 3-5 days
**Dependencies:** Phase 4 complete and tested

### 5.1 Create CD Production Workflow

- [ ] Create `.github/workflows/cd-production.yml`
- [ ] Trigger manually (workflow_dispatch)
- [ ] Require approval via GitHub Environments
- [ ] Blue/green deployment
- [ ] Extended health check period

<details>
<summary>CD Production Workflow Template</summary>

```yaml
# .github/workflows/cd-production.yml
name: CD - Production

on:
  workflow_dispatch:
    inputs:
      version:
        description: 'Image tag to deploy (commit SHA)'
        required: true

env:
  AWS_REGION: ${{ secrets.AWS_REGION }}
  ECR_REGISTRY: ${{ secrets.ECR_REGISTRY }}
  ECS_CLUSTER: ${{ secrets.ECS_CLUSTER_PRODUCTION }}

jobs:
  deploy-production:
    runs-on: ubuntu-latest
    environment: production  # Requires approval
    steps:
      - name: Configure AWS credentials
        uses: aws-actions/configure-aws-credentials@v4
        with:
          aws-access-key-id: ${{ secrets.AWS_ACCESS_KEY_ID }}
          aws-secret-access-key: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
          aws-region: ${{ env.AWS_REGION }}

      - name: Deploy to Production
        run: |
          # Deploy with blue/green strategy
          aws ecs update-service --cluster ${{ env.ECS_CLUSTER }} \
            --service shell --force-new-deployment \
            --deployment-configuration "maximumPercent=200,minimumHealthyPercent=100"

      - name: Wait for deployment
        run: |
          aws ecs wait services-stable --cluster ${{ env.ECS_CLUSTER }} \
            --services shell auth-service payments-service

      - name: Run production smoke tests
        run: |
          curl -f https://app.example.com/health || exit 1
          curl -f https://app.example.com/api/health || exit 1
```

</details>

### 5.2 Configure GitHub Environment

- [ ] Create `production` environment in GitHub settings
- [ ] Add required reviewers
- [ ] Configure deployment branch protection (main only)
- [ ] Test approval workflow

### 5.3 Set Up Blue/Green Deployment

- [ ] Configure ECS deployment type (rolling or blue/green)
- [ ] Set maximum percent to 200%
- [ ] Set minimum healthy percent to 100%
- [ ] Configure deployment circuit breaker

### 5.4 Configure Production Monitoring

- [ ] Set up CloudWatch alarms for:
  - [ ] High CPU usage (> 80%)
  - [ ] High memory usage (> 80%)
  - [ ] 5xx error rate (> 1%)
  - [ ] Health check failures
- [ ] Configure SNS topic for alerts
- [ ] Set up email/Slack notifications

**Phase 5 Completion Criteria:**
- [ ] Production deployment requires manual approval
- [ ] Blue/green deployment working
- [ ] Zero-downtime deployments verified
- [ ] Monitoring and alerts configured
- [ ] Rollback tested and working

---

## Phase 6: Database Migration Automation

**Status:** 🔲 Not Started
**Estimated Time:** 3-5 days
**Dependencies:** Phase 4 complete

### 6.1 Create Migration Task Definition

- [ ] Create ECS task definition for migrations
- [ ] Include Prisma CLI
- [ ] Configure database connection
- [ ] Set up one-shot task (not a service)

### 6.2 Create Pre-Deployment Backup Script

- [ ] Create RDS snapshot before migration
- [ ] Tag snapshot with deployment version
- [ ] Wait for snapshot completion

### 6.3 Create Migration Execution Script

- [ ] Run Prisma migrations for each database
- [ ] Handle migration failures
- [ ] Log migration output

### 6.4 Integrate with CD Pipeline

- [ ] Add backup step before deployment
- [ ] Add migration step after backup
- [ ] Add rollback on migration failure
- [ ] Test full workflow

<details>
<summary>Migration Script Example</summary>

```bash
#!/bin/bash
# scripts/deploy/run-migrations.sh

set -e

# Run migrations for each service
for service in auth payments admin profile; do
  echo "Running migrations for ${service}-service..."

  # Get database URL from Secrets Manager
  DB_URL=$(aws secretsmanager get-secret-value \
    --secret-id "${service}-db-url" \
    --query SecretString --output text)

  # Run Prisma migrate deploy
  DATABASE_URL="$DB_URL" npx prisma migrate deploy \
    --schema=apps/${service}-service/prisma/schema.prisma

  echo "Migrations complete for ${service}-service"
done
```

</details>

**Phase 6 Completion Criteria:**
- [ ] Automated backups before migration
- [ ] Migrations run automatically
- [ ] Rollback works on failure
- [ ] Zero data loss verified

---

## Phase 7: Monitoring and Observability

**Status:** 🔲 Not Started
**Estimated Time:** 3-5 days
**Dependencies:** Phase 5 complete

### 7.1 Configure CloudWatch Logs

- [ ] Create log groups for each service
- [ ] Configure log retention (30 days)
- [ ] Set up log insights queries
- [ ] Create log-based alarms

### 7.2 Configure CloudWatch Metrics

- [ ] Enable Container Insights
- [ ] Create custom dashboards
- [ ] Set up metric filters
- [ ] Configure anomaly detection

### 7.3 Set Up Alerting

- [ ] Create SNS topics for alerts
- [ ] Configure email subscriptions
- [ ] Configure Slack integration (optional)
- [ ] Configure PagerDuty integration (optional)
- [ ] Test alert flow

### 7.4 Integrate with Existing Observability

- [ ] Verify Sentry error tracking
- [ ] Configure Sentry release tracking
- [ ] Verify Prometheus metrics (if using)
- [ ] Configure distributed tracing (optional)

**Phase 7 Completion Criteria:**
- [ ] All logs in CloudWatch
- [ ] Dashboards created
- [ ] Alerts configured and tested
- [ ] On-call workflow documented

---

## Phase 8: Security Hardening

**Status:** 🔲 Not Started
**Estimated Time:** 3-5 days
**Dependencies:** Phase 5 complete

### 8.1 SSL/TLS Configuration

- [ ] Request ACM certificate
- [ ] Validate domain ownership
- [ ] Configure ALB HTTPS listener
- [ ] Enforce HTTPS redirect
- [ ] Verify SSL Labs score (A or better)

### 8.2 Secrets Rotation

- [ ] Configure automatic rotation for:
  - [ ] Database credentials
  - [ ] JWT secrets
  - [ ] API keys
- [ ] Test rotation workflow
- [ ] Document rotation schedule

### 8.3 IAM Hardening

- [ ] Review all IAM roles
- [ ] Apply least privilege principle
- [ ] Enable MFA for console access
- [ ] Remove unused credentials

### 8.4 Network Security

- [ ] Review security group rules
- [ ] Enable VPC Flow Logs
- [ ] Configure AWS WAF (optional)
- [ ] Enable GuardDuty (optional)

### 8.5 Security Scanning

- [ ] Enable ECR image scanning
- [ ] Add Trivy scanning to CD pipeline
- [ ] Review and remediate findings
- [ ] Document security baseline

**Phase 8 Completion Criteria:**
- [ ] HTTPS enforced
- [ ] Secrets rotation configured
- [ ] IAM follows least privilege
- [ ] Security scanning in CI/CD
- [ ] No critical vulnerabilities

---

## Post-Implementation Tasks

### Documentation

- [ ] Update README.md with deployment instructions
- [ ] Create deployment runbook
- [ ] Document rollback procedures
- [ ] Create incident response guide
- [ ] Update CLAUDE.md with deployment info

### Domain and DNS

- [ ] Purchase/configure domain
- [ ] Set up DNS records (Route 53 or external)
- [ ] Configure subdomain for staging
- [ ] Verify DNS propagation

### Testing

- [ ] Perform load testing
- [ ] Perform security testing
- [ ] Test disaster recovery
- [ ] Verify backup restore

---

## Success Criteria Summary

| Phase | Key Metrics |
|-------|-------------|
| **Phase 2** | All images build, < 500MB each |
| **Phase 3** | All AWS resources provisioned, security groups configured |
| **Phase 4** | Auto-deploy to staging on push to main |
| **Phase 5** | Production deployment with approval, zero-downtime |
| **Phase 6** | Automated migrations with backup |
| **Phase 7** | Monitoring active, alerts configured |
| **Phase 8** | HTTPS enforced, security scanning active |

---

## Notes

### Alternative Platforms

If AWS proves too complex or expensive, consider:

1. **Render** (~$118/month) - Fastest setup, good for MVP
2. **DigitalOcean** (~$220/month) - Good balance of simplicity and features
3. **GCP Cloud Run** (~$300/month) - Serverless containers

See `docs/POC-3-Implementation/AWS-ALTERNATIVES-DEPLOYMENT.md` for details.

### Getting Help

- Review `docs/temp/CI-CD-PLANNING.md` for detailed planning notes
- Check `docs/temp/CI-PIPELINE-IMPLEMENTATION.md` for CI troubleshooting
- Refer to AWS documentation for service-specific issues

---

**Document History:**

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | 2026-02-13 | Initial checklist created |
