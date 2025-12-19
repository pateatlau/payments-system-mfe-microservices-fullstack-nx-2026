# Backend Deployment Guide

**Status:** Authoritative  
**Version:** 1.0  
**Date:** 2026-01-XX  
**Context:** Comprehensive guide for deploying backend services

---

## Executive Summary

This document provides a comprehensive guide for deploying backend services across different environments (development, staging, production). It covers Docker containerization, Docker Compose setup, environment configuration, database migrations, health checks, monitoring, and deployment strategies.

**Target Audience:**

- DevOps engineers
- Backend developers deploying services
- System administrators

---

## 1. Deployment Overview

### 1.1 Deployment Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Production Environment                    │
│                                                              │
│  ┌──────────────┐                                            │
│  │    nginx     │  (Reverse Proxy, Load Balancing, SSL/TLS) │
│  └──────┬───────┘                                            │
│         │                                                    │
│         ▼                                                    │
│  ┌──────────────┐                                            │
│  │ API Gateway  │  (Port 3000)                              │
│  └──────┬───────┘                                            │
│         │                                                    │
│    ┌────┴────┬──────────┬──────────┐                        │
│    ▼         ▼          ▼          ▼                        │
│  Auth     Payments   Admin    Profile                       │
│ Service   Service    Service  Service                       │
│ (3001)    (3002)     (3003)   (3004)                         │
│                                                              │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐ │
│  │  auth_db     │  │ payments_db  │  │  admin_db    │  │ profile_db   │ │
│  │(PostgreSQL)  │  │(PostgreSQL)  │  │(PostgreSQL)  │  │(PostgreSQL) │ │
│  └──────────────┘  └──────────────┘  └──────────────┘  └──────────────┘ │
│                                                                          │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐                  │
│  │   RabbitMQ   │  │    Redis     │  │    nginx     │                  │
│  │  (Event Hub) │  │  (Caching)   │  │(Reverse Proxy)│                  │
│  └──────────────┘  └──────────────┘  └──────────────┘                  │
└─────────────────────────────────────────────────────────────┘
```

### 1.2 Deployment Environments

| Environment | Purpose | URL | Database | Notes |
|-------------|---------|-----|---------|-------|
| **Development** | Local development | `localhost:3000` | POC-2: `universal_mfe_dev`<br>POC-3: `auth_db`, `payments_db`, `admin_db`, `profile_db` | Docker Compose |
| **Staging** | Pre-production testing | `staging-api.example.com` | POC-2: `universal_mfe_staging`<br>POC-3: Separate databases per service | Production-like |
| **Production** | Live system | `api.example.com` | POC-3: Separate databases per service | High availability |

---

## 2. Local Development Deployment

### 2.1 Docker Compose Setup

**File:** `docker-compose.yml`

```yaml
version: '3.8'

services:
  # Database
  postgres:
    image: postgres:16
    container_name: universal-mfe-postgres
    environment:
      POSTGRES_DB: universal_mfe_dev
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgres
    ports:
      - '5432:5432'
    volumes:
      - postgres_data:/var/lib/postgresql/data
    healthcheck:
      test: ['CMD-SHELL', 'pg_isready -U postgres']
      interval: 10s
      timeout: 5s
      retries: 5

  # Redis (POC-2: Event Hub, POC-3: Caching)
  redis:
    image: redis:7-alpine
    container_name: universal-mfe-redis
    ports:
      - '6379:6379'
    volumes:
      - redis_data:/data
    healthcheck:
      test: ['CMD', 'redis-cli', 'ping']
      interval: 10s
      timeout: 5s
      retries: 5

  # RabbitMQ (POC-3: Event Hub)
  rabbitmq:
    image: rabbitmq:3-management-alpine
    container_name: universal-mfe-rabbitmq
    ports:
      - '5672:5672'   # AMQP port
      - '15672:15672' # Management UI
    environment:
      RABBITMQ_DEFAULT_USER: admin
      RABBITMQ_DEFAULT_PASS: admin
    volumes:
      - rabbitmq_data:/var/lib/rabbitmq
    healthcheck:
      test: ['CMD', 'rabbitmq-diagnostics', 'ping']
      interval: 10s
      timeout: 5s
      retries: 5

  # API Gateway
  api-gateway:
    build:
      context: .
      dockerfile: packages/api-gateway/Dockerfile
    container_name: universal-mfe-api-gateway
    ports:
      - '3000:3000'
    environment:
      DATABASE_URL: postgresql://postgres:postgres@postgres:5432/universal_mfe_dev
      REDIS_URL: redis://redis:6379
      RABBITMQ_URL: amqp://admin:admin@rabbitmq:5672
      JWT_SECRET: ${JWT_SECRET:-dev-secret-key}
      NODE_ENV: development
    depends_on:
      postgres:
        condition: service_healthy
      redis:
        condition: service_healthy
      rabbitmq:
        condition: service_healthy
    volumes:
      - ./packages:/app/packages
      - /app/packages/node_modules
    command: pnpm --filter @backend/api-gateway dev

  # Auth Service
  auth-service:
    build:
      context: .
      dockerfile: packages/auth-service/Dockerfile
    container_name: universal-mfe-auth-service
    ports:
      - '3001:3001'
    environment:
      DATABASE_URL: postgresql://postgres:postgres@postgres:5432/universal_mfe_dev
      REDIS_URL: redis://redis:6379
      RABBITMQ_URL: amqp://admin:admin@rabbitmq:5672
      JWT_SECRET: ${JWT_SECRET:-dev-secret-key}
      NODE_ENV: development
    depends_on:
      postgres:
        condition: service_healthy
      redis:
        condition: service_healthy
    volumes:
      - ./packages:/app/packages
      - /app/packages/node_modules
    command: pnpm --filter @backend/auth-service dev

  # Payments Service
  payments-service:
    build:
      context: .
      dockerfile: packages/payments-service/Dockerfile
    container_name: universal-mfe-payments-service
    ports:
      - '3002:3002'
    environment:
      DATABASE_URL: postgresql://postgres:postgres@postgres:5432/universal_mfe_dev
      REDIS_URL: redis://redis:6379
      RABBITMQ_URL: amqp://admin:admin@rabbitmq:5672
      NODE_ENV: development
    depends_on:
      postgres:
        condition: service_healthy
      redis:
        condition: service_healthy
    volumes:
      - ./packages:/app/packages
      - /app/packages/node_modules
    command: pnpm --filter @backend/payments-service dev

  # Admin Service
  admin-service:
    build:
      context: .
      dockerfile: packages/admin-service/Dockerfile
    container_name: universal-mfe-admin-service
    ports:
      - '3003:3003'
    environment:
      DATABASE_URL: postgresql://postgres:postgres@postgres:5432/universal_mfe_dev
      REDIS_URL: redis://redis:6379
      RABBITMQ_URL: amqp://admin:admin@rabbitmq:5672
      NODE_ENV: development
    depends_on:
      postgres:
        condition: service_healthy
      redis:
        condition: service_healthy
    volumes:
      - ./packages:/app/packages
      - /app/packages/node_modules
    command: pnpm --filter @backend/admin-service dev

  # Profile Service
  profile-service:
    build:
      context: .
      dockerfile: packages/profile-service/Dockerfile
    container_name: universal-mfe-profile-service
    ports:
      - '3004:3004'
    environment:
      DATABASE_URL: postgresql://postgres:postgres@postgres:5432/universal_mfe_dev
      REDIS_URL: redis://redis:6379
      NODE_ENV: development
    depends_on:
      postgres:
        condition: service_healthy
      redis:
        condition: service_healthy
    volumes:
      - ./packages:/app/packages
      - /app/packages/node_modules
    command: pnpm --filter @backend/profile-service dev

volumes:
  postgres_data:
  redis_data:
  rabbitmq_data:
```

### 2.2 Running Local Development

```bash
# Start all services
docker-compose up

# Start in background
docker-compose up -d

# View logs
docker-compose logs -f

# Stop all services
docker-compose down

# Stop and remove volumes (WARNING: Deletes data)
docker-compose down -v
```

### 2.3 Database Migrations (Local)

```bash
# Run migrations
docker-compose exec api-gateway pnpm --filter @backend/shared-db prisma migrate deploy

# Or run from host
cd packages/shared-db
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/universal_mfe_dev pnpm prisma migrate deploy
```

---

## 3. Staging Deployment

### 3.1 Docker Compose for Staging

**File:** `docker-compose.staging.yml`

```yaml
version: '3.8'

services:
  postgres:
    image: postgres:16
    environment:
      POSTGRES_DB: universal_mfe_staging
      POSTGRES_USER: ${DB_USER}
      POSTGRES_PASSWORD: ${DB_PASSWORD}
    volumes:
      - postgres_staging_data:/var/lib/postgresql/data
    # No port exposure (internal only)

  redis:
    image: redis:7-alpine
    volumes:
      - redis_staging_data:/data
    # No port exposure (internal only)

  rabbitmq:
    image: rabbitmq:3-management-alpine
    environment:
      RABBITMQ_DEFAULT_USER: ${RABBITMQ_USER}
      RABBITMQ_DEFAULT_PASS: ${RABBITMQ_PASSWORD}
    volumes:
      - rabbitmq_staging_data:/var/lib/rabbitmq
    # No port exposure (internal only)

  api-gateway:
    build:
      context: .
      dockerfile: packages/api-gateway/Dockerfile
    environment:
      DATABASE_URL: ${DATABASE_URL}
      REDIS_URL: ${REDIS_URL}
      RABBITMQ_URL: ${RABBITMQ_URL}
      JWT_SECRET: ${JWT_SECRET}
      NODE_ENV: staging
    depends_on:
      - postgres
      - redis
      - rabbitmq
    restart: unless-stopped

  # ... (other services similar)
```

### 3.2 Environment Variables (Staging)

**File:** `.env.staging`

```bash
# Database
DATABASE_URL=postgresql://user:password@postgres:5432/universal_mfe_staging

# JWT
JWT_SECRET=${STAGING_JWT_SECRET}
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d

# Redis
REDIS_URL=redis://redis:6379

# RabbitMQ
RABBITMQ_URL=amqp://admin:password@rabbitmq:5672

# API
API_PORT=3000
NODE_ENV=staging

# CORS
CORS_ORIGIN=https://staging.example.com

# Monitoring
SENTRY_DSN=${STAGING_SENTRY_DSN}
```

### 3.3 Deploy to Staging

```bash
# Build and deploy
docker-compose -f docker-compose.staging.yml up -d --build

# Run migrations
docker-compose -f docker-compose.staging.yml exec api-gateway \
  pnpm --filter @backend/shared-db prisma migrate deploy

# Check health
curl https://staging-api.example.com/health
```

---

## 4. Production Deployment

### 4.1 Production Dockerfile

**File:** `packages/api-gateway/Dockerfile`

```dockerfile
# Multi-stage build
FROM node:24.11-alpine AS builder

WORKDIR /app

# Copy package files
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY packages/shared-*/package.json ./packages/shared-*/
COPY packages/api-gateway/package.json ./packages/api-gateway/

# Install dependencies
RUN pnpm install --frozen-lockfile

# Copy source code
COPY packages ./packages

# Build
RUN pnpm --filter @backend/api-gateway build

# Production image
FROM node:24.11-alpine AS production

WORKDIR /app

# Copy package files
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY packages/shared-*/package.json ./packages/shared-*/
COPY packages/api-gateway/package.json ./packages/api-gateway/

# Install production dependencies only
RUN pnpm install --frozen-lockfile --prod

# Copy built files
COPY --from=builder /app/packages ./packages

# Generate Prisma Client
RUN pnpm --filter @backend/shared-db prisma generate

WORKDIR /app/packages/api-gateway

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=40s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# Start service
CMD ["node", "dist/index.js"]
```

### 4.2 Production Docker Compose

**File:** `docker-compose.prod.yml`

```yaml
version: '3.8'

services:
  postgres:
    image: postgres:16
    environment:
      POSTGRES_DB: ${DB_NAME}
      POSTGRES_USER: ${DB_USER}
      POSTGRES_PASSWORD: ${DB_PASSWORD}
    volumes:
      - postgres_prod_data:/var/lib/postgresql/data
      - ./backups:/backups
    restart: always
    healthcheck:
      test: ['CMD-SHELL', 'pg_isready -U ${DB_USER}']
      interval: 10s
      timeout: 5s
      retries: 5

  redis:
    image: redis:7-alpine
    command: redis-server --appendonly yes
    volumes:
      - redis_prod_data:/data
    restart: always
    healthcheck:
      test: ['CMD', 'redis-cli', 'ping']
      interval: 10s
      timeout: 5s
      retries: 5

  rabbitmq:
    image: rabbitmq:3-management-alpine
    environment:
      RABBITMQ_DEFAULT_USER: ${RABBITMQ_USER}
      RABBITMQ_DEFAULT_PASS: ${RABBITMQ_PASSWORD}
    volumes:
      - rabbitmq_prod_data:/var/lib/rabbitmq
    restart: always
    healthcheck:
      test: ['CMD', 'rabbitmq-diagnostics', 'ping']
      interval: 10s
      timeout: 5s
      retries: 5

  api-gateway:
    image: universal-mfe-api-gateway:latest
    environment:
      DATABASE_URL: ${DATABASE_URL}
      REDIS_URL: ${REDIS_URL}
      RABBITMQ_URL: ${RABBITMQ_URL}
      JWT_SECRET: ${JWT_SECRET}
      NODE_ENV: production
    depends_on:
      postgres:
        condition: service_healthy
      redis:
        condition: service_healthy
      rabbitmq:
        condition: service_healthy
    restart: always
    deploy:
      replicas: 2
      update_config:
        parallelism: 1
        delay: 10s
      restart_policy:
        condition: on-failure

  # ... (other services similar)
```

### 4.3 nginx Configuration (POC-3)

**File:** `nginx/nginx.conf`

```nginx
upstream api_gateway {
    least_conn;
    server api-gateway-1:3000;
    server api-gateway-2:3000;
    keepalive 32;
}

server {
    listen 443 ssl http2;
    server_name api.example.com;

    # SSL Configuration (self-signed in POC-3, real certs in MVP)
    ssl_certificate /etc/nginx/ssl/cert.pem;
    ssl_certificate_key /etc/nginx/ssl/key.pem;
    ssl_protocols TLSv1.2 TLSv1.3;

    # Security Headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;

    # Rate Limiting
    limit_req_zone $binary_remote_addr zone=api_limit:10m rate=100r/m;
    limit_req zone=api_limit burst=20 nodelay;

    location /api/ {
        proxy_pass http://api_gateway;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    location /health {
        proxy_pass http://api_gateway;
        access_log off;
    }
}
```

---

## 5. Database Migrations

### 5.1 Migration Strategy

**Development:**
```bash
# Create and apply migration
pnpm --filter @backend/shared-db prisma migrate dev --name migration_name
```

**Staging/Production:**
```bash
# Apply migrations only (no prompts)
pnpm --filter @backend/shared-db prisma migrate deploy
```

### 5.2 Migration Best Practices

- ✅ **Test migrations** - Test on staging first
- ✅ **Backup database** - Always backup before migration
- ✅ **Review SQL** - Review generated SQL
- ✅ **Rollback plan** - Have rollback plan ready
- ✅ **Zero-downtime** - Use backward-compatible migrations

---

## 6. Health Checks

### 6.1 Health Check Endpoint

```typescript
// packages/api-gateway/src/routes/health.ts
import express from 'express';
import { prisma } from '@backend/shared-db';
import Redis from 'ioredis';

const router = express.Router();
const redis = new Redis(process.env.REDIS_URL!);

router.get('/health', async (req, res) => {
  const checks = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    services: {
      database: 'unknown',
      redis: 'unknown',
      rabbitmq: 'unknown',
    },
  };

  // Check database
  try {
    await prisma.$queryRaw`SELECT 1`;
    checks.services.database = 'healthy';
  } catch (error) {
    checks.services.database = 'unhealthy';
    checks.status = 'unhealthy';
  }

  // Check Redis
  try {
    await redis.ping();
    checks.services.redis = 'healthy';
  } catch (error) {
    checks.services.redis = 'unhealthy';
    checks.status = 'unhealthy';
  }

  // Check RabbitMQ (POC-3)
  // ... (implementation)

  const statusCode = checks.status === 'healthy' ? 200 : 503;
  res.status(statusCode).json(checks);
});

export default router;
```

### 6.2 Docker Health Checks

```yaml
healthcheck:
  test: ['CMD', 'node', '-e', "require('http').get('http://localhost:3000/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"]
  interval: 30s
  timeout: 3s
  start_period: 40s
  retries: 3
```

---

## 7. Monitoring & Logging

### 7.1 Logging Setup

```typescript
// packages/shared-utils/src/logger.ts
import winston from 'winston';

export const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.Console(),
    new winston.transports.File({ filename: 'error.log', level: 'error' }),
    new winston.transports.File({ filename: 'combined.log' }),
  ],
});
```

### 7.2 Sentry Integration (POC-3)

```typescript
import * as Sentry from '@sentry/node';

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV,
  tracesSampleRate: 1.0,
});
```

---

## 8. Backup & Recovery

### 8.1 Database Backup

```bash
# Manual backup
docker-compose exec postgres pg_dump -U postgres universal_mfe_prod > backup_$(date +%Y%m%d_%H%M%S).sql

# Automated backup (cron)
0 2 * * * docker-compose exec -T postgres pg_dump -U postgres universal_mfe_prod | gzip > /backups/backup_$(date +\%Y\%m\%d).sql.gz
```

### 8.2 Database Recovery

```bash
# Restore from backup
docker-compose exec -T postgres psql -U postgres universal_mfe_prod < backup.sql
```

---

## 9. Rollback Procedures

### 9.1 Service Rollback

```bash
# Rollback to previous version
docker-compose pull api-gateway:previous-version
docker-compose up -d api-gateway

# Or use Docker tags
docker tag universal-mfe-api-gateway:previous universal-mfe-api-gateway:latest
docker-compose up -d api-gateway
```

### 9.2 Database Rollback

```bash
# Rollback migration
pnpm --filter @backend/shared-db prisma migrate resolve --rolled-back migration_name
```

---

## 10. Security Considerations

### 10.1 Environment Variables

- ✅ Use secrets management (AWS Secrets Manager, HashiCorp Vault)
- ✅ Never commit secrets to git
- ✅ Rotate secrets regularly
- ✅ Use different secrets per environment

### 10.2 Network Security

- ✅ Use internal networks for service communication
- ✅ Expose only necessary ports
- ✅ Use nginx for SSL/TLS termination
- ✅ Implement rate limiting

---

## 11. Related Documents

- `docs/backend-architecture.md` - High-level backend architecture
- `docs/backend-poc2-architecture.md` - POC-2 architecture
- `docs/backend-poc3-architecture.md` - POC-3 architecture (includes nginx)
- `docs/backend-development-setup.md` - Development setup
- `docs/backend-database-implementation.md` - Database implementation
- `docs/cicd-deployment-recommendation.md` - CI/CD strategy

---

**Last Updated:** 2026-01-XX  
**Status:** Authoritative - Ready for Deployment

