# Developer Workflow - Backend

**Status:** ✅ Complete  
**Date:** 2026-12-09  
**Task:** 5.5.1 - Technical Documentation

---

## Overview

This guide explains how to develop, build, and test the POC-2 backend microservices.

**Key Features:**

- Microservices architecture (API Gateway, Auth, Payments, Admin, Profile)
- PostgreSQL database with Prisma ORM
- Redis Pub/Sub for inter-service communication
- Real JWT authentication
- API Gateway for routing and authentication

---

## Prerequisites

1. **Node.js** 24.11.x LTS and **pnpm** 9.x installed
2. **PostgreSQL** 16.x installed and running
3. **Redis** 7.x installed and running
4. **Docker & Docker Compose** (optional, for infrastructure)
5. **Dependencies installed**: `pnpm install`

---

## Architecture

- **API Gateway** (Port 3000) - Routing, authentication, rate limiting
- **Auth Service** (Port 3001) - Authentication, user management
- **Payments Service** (Port 3002) - Payment operations
- **Admin Service** (Port 3003) - Admin functionality
- **Profile Service** (Port 3004) - User profiles
- **PostgreSQL** - Database
- **Redis** - Event hub and caching

---

## Development Workflow

### Initial Setup (First Time)

1. **Install dependencies:**

   ```bash
   pnpm install
   ```

2. **Start infrastructure (PostgreSQL, Redis):**

   ```bash
   pnpm infra:start
   # Or manually: docker-compose up -d
   ```

3. **Set up database:**

   ```bash
   pnpm backend:setup
   # This runs: db:generate, db:migrate, db:seed
   ```

4. **Start all backend services:**
   ```bash
   pnpm dev:backend
   ```

### Standard Development Workflow

#### Option 1: Quick Start (Recommended)

**Start All Backend Services:**

```bash
pnpm dev:backend
```

This starts all five services (API Gateway, Auth, Payments, Admin, Profile) in parallel.

**Access the services:**

- API Gateway: http://localhost:3000
- Auth Service: http://localhost:3001
- Payments Service: http://localhost:3002
- Admin Service: http://localhost:3003
- Profile Service: http://localhost:3004

#### Option 2: Individual Service Control

**Terminal 1 - Start API Gateway:**

```bash
pnpm dev:api-gateway
```

**Terminal 2 - Start Auth Service:**

```bash
pnpm dev:auth-service
```

**Terminal 3 - Start Payments Service:**

```bash
pnpm dev:payments-service
```

**Terminal 4 - Start Admin Service:**

```bash
pnpm dev:admin-service
```

**Terminal 5 - Start Profile Service:**

```bash
pnpm dev:profile-service
```

---

## Common Commands

### Development

```bash
# Start all backend services
pnpm dev:backend

# Start individual services
pnpm dev:api-gateway
pnpm dev:auth-service
pnpm dev:payments-service
pnpm dev:admin-service
pnpm dev:profile-service

# Start infrastructure (PostgreSQL, Redis)
pnpm infra:start

# Stop infrastructure
pnpm infra:stop

# View infrastructure logs
pnpm infra:logs
```

### Database Management

```bash
# Generate Prisma client
pnpm db:generate

# Run migrations
pnpm db:migrate

# Deploy migrations (production)
pnpm db:migrate:deploy

# Seed database
pnpm db:seed

# Open Prisma Studio (GUI)
pnpm db:studio

# Reset database (WARNING: deletes all data)
pnpm db:reset

# Format Prisma schema
pnpm db:format

# Validate Prisma schema
pnpm db:validate
```

### Building

```bash
# Build all backend services
pnpm build:backend

# Build specific services
pnpm build:api-gateway
pnpm build:auth-service
pnpm build:payments-service
pnpm build:admin-service
pnpm build:profile-service
```

### Testing

```bash
# Run all backend tests
pnpm test:backend

# Run tests for specific services
pnpm test:api-gateway
pnpm test:auth-service
pnpm test:payments-service
pnpm test:admin-service
pnpm test:profile-service

# Run backend library tests
pnpm test:backend-libs
```

### Health Checks

```bash
# Check all service health
pnpm test:api:all

# Check individual service health
pnpm test:api:health          # API Gateway
pnpm test:api:auth:health      # Auth Service
pnpm test:api:payments:health  # Payments Service
pnpm test:api:admin:health     # Admin Service
pnpm test:api:profile:health   # Profile Service
```

### API Testing

```bash
# Test registration
pnpm test:api:register

# Test login
pnpm test:api:login

# Test payments (requires auth token)
pnpm test:api:payments:list
pnpm test:api:payments:create
```

---

## Database Workflow

### Creating Migrations

```bash
# Create a new migration
pnpm db:migrate

# This will:
# 1. Detect schema changes
# 2. Create migration file
# 3. Apply migration to database
# 4. Regenerate Prisma client
```

### Viewing Database

```bash
# Open Prisma Studio (web GUI)
pnpm db:studio

# Access at: http://localhost:5555
```

### Resetting Database

```bash
# Reset database (WARNING: deletes all data)
pnpm db:reset

# This will:
# 1. Drop all tables
# 2. Recreate schema
# 3. Run seed script
```

---

## Environment Configuration

### Environment Variables

Create `.env` file in project root:

```env
# Database
DATABASE_URL=postgresql://user:password@localhost:5432/payments_db

# Redis
REDIS_URL=redis://localhost:6379

# JWT Secrets
JWT_ACCESS_SECRET=your-access-secret-key
JWT_REFRESH_SECRET=your-refresh-secret-key
JWT_ACCESS_EXPIRY=15m
JWT_REFRESH_EXPIRY=7d

# Service URLs
AUTH_SERVICE_URL=http://localhost:3001
PAYMENTS_SERVICE_URL=http://localhost:3002
ADMIN_SERVICE_URL=http://localhost:3003
PROFILE_SERVICE_URL=http://localhost:3004

# API Gateway
PORT=3000
NODE_ENV=development
```

---

## Troubleshooting

### Database Connection Issues

**Problem:** Cannot connect to PostgreSQL

**Solution:**

1. Verify PostgreSQL is running: `pg_isready`
2. Check DATABASE_URL in .env
3. Verify database exists: `psql -l`
4. Check PostgreSQL logs

### Redis Connection Issues

**Problem:** Cannot connect to Redis

**Solution:**

1. Verify Redis is running: `redis-cli ping`
2. Check REDIS_URL in .env
3. Verify Redis is accessible: `redis-cli -h localhost -p 6379`

### Service Not Starting

**Problem:** Service fails to start

**Solution:**

1. Check service logs
2. Verify port is available: `lsof -i :3000`
3. Check environment variables
4. Verify dependencies are installed

### Migration Issues

**Problem:** Migration fails

**Solution:**

1. Check Prisma schema syntax: `pnpm db:validate`
2. Verify database connection
3. Check migration files for errors
4. Reset database if needed: `pnpm db:reset`

---

## Best Practices

1. **Run Migrations Before Development** - Always run `pnpm db:migrate` after pulling changes
2. **Use Prisma Studio** - Use `pnpm db:studio` to inspect database
3. **Test Locally First** - Test changes locally before committing
4. **Write Tests** - Write tests alongside code (70% coverage minimum)
5. **Follow API Contracts** - Follow API contracts in `api-contracts.md`
6. **Use Environment Variables** - Never hardcode secrets

---

## Related Documentation

- [`developer-workflow-frontend.md`](./developer-workflow-frontend.md) - Frontend development workflow
- [`developer-workflow-fullstack.md`](./developer-workflow-fullstack.md) - Full-stack development workflow
- [`api-contracts.md`](./api-contracts.md) - API contracts
- [`testing-guide.md`](./testing-guide.md) - Testing guide
