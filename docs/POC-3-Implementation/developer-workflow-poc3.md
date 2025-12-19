# Developer Workflow Guide - POC-3

**Status:** Complete  
**Version:** 1.0  
**Date:** 2026-12-11  
**Purpose:** Complete guide for POC-3 development workflow

---

## Overview

This guide covers the complete developer workflow for POC-3, including setup, running services, testing, debugging, and deployment.

---

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Initial Setup](#initial-setup)
3. [Running Services](#running-services)
4. [Development Workflow](#development-workflow)
5. [Testing](#testing)
6. [Debugging](#debugging)
7. [Deployment](#deployment)
8. [Troubleshooting](#troubleshooting)

---

## Prerequisites

### Required Software

- **Node.js** - v24.11.x LTS
- **pnpm** - v9.x
- **Docker Desktop** - Latest version
- **Git** - Latest version
- **VS Code** or **Cursor** - Recommended IDE

### Required Ports

- **80, 443** - nginx
- **3000** - API Gateway
- **3001-3004** - Backend services
- **4200-4203** - Frontend MFEs
- **5432-5435** - PostgreSQL databases
- **5672, 15672** - RabbitMQ
- **6379** - Redis

---

## Initial Setup

### 1. Clone Repository

```bash
git clone <repository-url>
cd payments-system-mfe-microservices-fullstack-nx-2026
```

### 2. Install Dependencies

```bash
# Install all dependencies
pnpm install
```

### 3. Generate Prisma Clients

```bash
# Generate Prisma clients for all services
pnpm db:generate:all
```

### 4. Setup Environment Variables

```bash
# Copy example environment files
cp .env.example .env

# Edit .env with your configuration
# Required variables:
# - DATABASE_URL (for migrations)
# - JWT_SECRET
# - SENTRY_DSN (optional)
# - REDIS_URL
# - RABBITMQ_URL
```

### 5. Start Infrastructure

```bash
# Start Docker Compose services
docker-compose up -d

# Verify services are running
docker-compose ps
```

### 6. Run Database Migrations

```bash
# Run migrations for all services
pnpm db:migrate:all

# Or individually
pnpm db:auth:migrate
pnpm db:payments:migrate
pnpm db:admin:migrate
pnpm db:profile:migrate
```

### 7. Seed Database (Optional)

```bash
# Seed all databases
pnpm db:seed
```

---

## Running Services

### Start All Services

```bash
# Start all backend services
pnpm dev:backend

# Start all frontend MFEs
pnpm dev:mf

# Or start everything
pnpm dev:all
```

### Start Individual Services

```bash
# Backend services
pnpm dev:api-gateway
pnpm dev:auth-service
pnpm dev:payments-service
pnpm dev:admin-service
pnpm dev:profile-service

# Frontend MFEs
pnpm dev:shell
pnpm dev:auth-mfe
pnpm dev:payments-mfe
pnpm dev:admin-mfe
```

### Start nginx

```bash
# Start nginx (if not in Docker Compose)
docker-compose up -d nginx

# Or manually
docker run -d \
  -p 80:80 -p 443:443 \
  -v $(pwd)/nginx/nginx.conf:/etc/nginx/nginx.conf:ro \
  -v $(pwd)/nginx/ssl:/etc/nginx/ssl:ro \
  nginx:alpine
```

### Verify Services

```bash
# Check service health
curl http://localhost:3000/api/health
curl http://localhost:3001/health
curl http://localhost:3002/health
curl http://localhost:3003/health
curl http://localhost:3004/health

# Check frontend
open http://localhost:4200
open https://localhost
```

---

## Development Workflow

### 1. Create Feature Branch

```bash
git checkout -b feature/your-feature-name
```

### 2. Make Changes

- Edit code in your IDE
- Follow TypeScript strict mode
- Use Tailwind v4 syntax (not v3)
- Write tests alongside code

### 3. Run Tests

```bash
# Run all tests
pnpm test

# Run specific tests
pnpm test:shell
pnpm test:api-gateway

# Run with coverage
pnpm test:coverage
```

### 4. Check Types

```bash
# Type check all projects
pnpm typecheck

# Type check specific project
pnpm typecheck:shell
```

### 5. Lint Code

```bash
# Lint all projects
pnpm lint

# Lint specific project
pnpm lint:shell
```

### 6. Build

```bash
# Build all projects
pnpm build

# Build specific project
pnpm build:shell
pnpm build:api-gateway
```

### 7. Commit Changes

```bash
# Stage changes
git add .

# Commit with descriptive message
git commit -m "feat(component): Add feature description"

# Push to remote
git push origin feature/your-feature-name
```

---

## Testing

### Unit Tests

```bash
# Run all unit tests
pnpm test

# Run specific project tests
pnpm test:shell
pnpm test:shared-websocket
```

### Integration Tests

```bash
# Infrastructure integration tests
pnpm test:integration:infrastructure

# Performance tests
pnpm test:performance:load

# Security tests
pnpm test:security:validation
```

### E2E Tests

```bash
# Run E2E tests
pnpm e2e

# Run specific E2E suite
pnpm e2e:shell
```

### Test Coverage

```bash
# Generate coverage report
pnpm test:coverage

# View coverage report
open coverage/index.html
```

---

## Debugging

### Backend Debugging

```typescript
// Use logger for debugging
import { logger } from '../utils/logger';

logger.debug('Debug message', { data: someData });
logger.info('Info message', { context: contextData });
logger.error('Error message', { error: error.message });
```

### Frontend Debugging

```typescript
// Use console in development
if (process.env.NODE_ENV === 'development') {
  console.log('Debug info', data);
}

// Use React DevTools
// Install React DevTools browser extension
```

### Database Debugging

```bash
# Connect to database
psql -h localhost -p 5432 -U postgres -d auth_db

# View logs
docker-compose logs -f postgres
```

### nginx Debugging

```bash
# Check nginx configuration
docker-compose exec nginx nginx -t

# View nginx logs
docker-compose logs -f nginx

# Test specific endpoint
curl -v https://localhost/api/health
```

### WebSocket Debugging

```bash
# Test WebSocket connection
wscat -c wss://localhost/ws?token=YOUR_JWT_TOKEN

# Check WebSocket logs
docker-compose logs -f api-gateway | grep -i websocket
```

---

## Deployment

### Build for Production

```bash
# Build all projects
pnpm build

# Build backend
pnpm build:backend

# Build frontend
pnpm build:remotes
pnpm build:shell
```

### Docker Build

```bash
# Build Docker images
docker-compose build

# Or build specific service
docker-compose build api-gateway
```

### Deploy

```bash
# Deploy with Docker Compose
docker-compose up -d

# Or deploy to production server
# (Follow production deployment guide)
```

---

## Troubleshooting

### Services Not Starting

**Possible Causes:**

- Port conflicts
- Database not running
- Missing environment variables

**Solutions:**

1. Check port availability: `lsof -i :3000`
2. Verify Docker services: `docker-compose ps`
3. Check environment variables: `cat .env`

### Database Connection Errors

**Possible Causes:**

- Database not running
- Wrong connection string
- Migration not run

**Solutions:**

1. Start database: `docker-compose up -d postgres`
2. Verify connection string in `.env`
3. Run migrations: `pnpm db:migrate:all`

### Module Federation Errors

**Possible Causes:**

- Remote MFEs not built
- Wrong remote URLs
- CORS issues

**Solutions:**

1. Build remotes: `pnpm build:remotes`
2. Verify remote URLs in shell app
3. Check CORS configuration

### nginx Errors

**Possible Causes:**

- Configuration syntax error
- SSL certificates missing
- Upstream services not running

**Solutions:**

1. Test configuration: `docker-compose exec nginx nginx -t`
2. Generate SSL certificates: `./scripts/generate-ssl-certs.sh`
3. Verify upstream services are running

---

## Additional Resources

- **Testing Guide:** `docs/POC-3-Implementation/testing-guide-poc3.md`
- **API Gateway Proxy:** `docs/POC-3-Implementation/api-gateway-proxy-fix.md`
- **WebSocket Guide:** `docs/POC-3-Implementation/websocket-implementation-guide.md`
- **nginx Guide:** `docs/POC-3-Implementation/nginx-configuration-guide.md`

---

## Quick Reference

### Common Commands

```bash
# Start everything
pnpm dev:all

# Run tests
pnpm test

# Build everything
pnpm build

# Check types
pnpm typecheck

# Lint code
pnpm lint

# Stop all services
pnpm kill:all

# Clean build
pnpm clean:build
```

### Service URLs

- **Frontend:** https://localhost
- **API Gateway:** http://localhost:3000/api
- **Auth Service:** http://localhost:3001
- **Payments Service:** http://localhost:3002
- **Admin Service:** http://localhost:3003
- **Profile Service:** http://localhost:3004
- **RabbitMQ UI:** http://localhost:15672
- **WebSocket:** wss://localhost/ws

---

**Last Updated:** 2026-12-11  
**Status:** Complete
