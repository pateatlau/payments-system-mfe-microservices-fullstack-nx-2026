# Backend Development Setup Guide

**Status:** Authoritative  
**Version:** 1.0  
**Date:** 2026-01-XX  
**Context:** Step-by-step guide for setting up backend development environment

---

## Executive Summary

This guide provides step-by-step instructions for setting up the backend development environment for the microfrontend platform. It covers prerequisites, installation, database setup, service configuration, and running the backend locally.

**Target Audience:**

- New developers joining the backend team
- Frontend developers needing to run backend locally
- DevOps engineers setting up development environments

---

## 1. Prerequisites

### 1.1 System Requirements

- **Operating System:** macOS, Linux, or Windows (with WSL2)
- **Node.js:** 24.11.x LTS (must match frontend)
- **Package Manager:** pnpm v9.x (must match frontend)
- **TypeScript:** 5.9.x
- **PostgreSQL:** 16.x
- **Redis:** 7.x (for POC-2 event hub and caching)
- **RabbitMQ:** 3.x (for POC-3 event hub - optional for POC-2)
- **Docker & Docker Compose:** Latest (optional, for containerized setup)

### 1.2 Verify Prerequisites

```bash
# Check Node.js version
node -v
# Expected: v24.11.x

# Check pnpm version
pnpm -v
# Expected: 9.x

# Check TypeScript version
tsc -v
# Expected: Version 5.9.x

# Check PostgreSQL version
psql --version
# Expected: psql (PostgreSQL) 16.x

# Check Redis version
redis-cli --version
# Expected: redis-cli 7.x

# Check Docker (optional)
docker --version
docker-compose --version
```

---

## 2. Repository Setup

### 2.1 Clone Repository

```bash
git clone <repository-url>
cd <repository-name>
```

### 2.2 Install Dependencies

```bash
# Install all dependencies (frontend + backend)
pnpm install
```

**Note:** This installs dependencies for both frontend and backend since we use a unified monorepo with pnpm workspaces.

---

## 3. Database Setup

### 3.1 Install PostgreSQL

**macOS (Homebrew):**

```bash
brew install postgresql@16
brew services start postgresql@16
```

**Linux (Ubuntu/Debian):**

```bash
sudo apt-get update
sudo apt-get install postgresql-16
sudo systemctl start postgresql
```

**Windows (WSL2):**

```bash
sudo apt-get update
sudo apt-get install postgresql-16
sudo service postgresql start
```

### 3.2 Create Database

```bash
# Connect to PostgreSQL
psql postgres

# Create database
CREATE DATABASE universal_mfe_dev;

# Create user (optional, or use default postgres user)
CREATE USER mfe_user WITH PASSWORD 'mfe_password';
GRANT ALL PRIVILEGES ON DATABASE universal_mfe_dev TO mfe_user;

# Exit psql
\q
```

### 3.3 Setup Prisma

```bash
# POC-2: Shared Database
# Navigate to shared database package
cd packages/shared-db
pnpm prisma generate

# POC-3: Separate Databases
# Each service has its own Prisma schema
cd apps/backend/auth-service
pnpm prisma generate

cd apps/backend/payments-service
pnpm prisma generate

# ... (repeat for admin-service and profile-service)

# Run migrations
pnpm prisma migrate dev

# (Optional) Seed database with test data
pnpm prisma db seed
```

---

## 4. Redis Setup

### 4.1 Install Redis

**macOS (Homebrew):**

```bash
brew install redis
brew services start redis
```

**Linux (Ubuntu/Debian):**

```bash
sudo apt-get install redis-server
sudo systemctl start redis-server
```

**Windows (WSL2):**

```bash
sudo apt-get install redis-server
sudo service redis-server start
```

### 4.2 Verify Redis

```bash
# Test Redis connection
redis-cli ping
# Expected: PONG
```

---

## 5. RabbitMQ Setup (POC-3)

### 5.1 Install RabbitMQ

**macOS (Homebrew):**

```bash
brew install rabbitmq
brew services start rabbitmq
```

**Linux (Ubuntu/Debian):**

```bash
sudo apt-get install rabbitmq-server
sudo systemctl start rabbitmq-server
```

**Windows (WSL2):**

```bash
sudo apt-get install rabbitmq-server
sudo service rabbitmq-server start
```

### 5.2 Access RabbitMQ Management UI

```bash
# Enable management plugin
rabbitmq-plugins enable rabbitmq_management

# Access UI at http://localhost:15672
# Default credentials: guest / guest
```

**Note:** RabbitMQ is only needed for POC-3. For POC-2, Redis Pub/Sub is sufficient.

---

## 6. Environment Configuration

### 6.1 Create Environment Files

Create `.env` files in each service directory:

**Root `.env` (shared):**

```bash
# Database
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/universal_mfe_dev

# JWT
JWT_SECRET=your-development-secret-key-change-in-production
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d
JWT_REFRESH_SECRET=your-development-refresh-secret-key

# Redis (POC-2)
REDIS_URL=redis://localhost:6379

# RabbitMQ (POC-3)
RABBITMQ_URL=amqp://localhost:5672

# API Gateway
API_PORT=3000
NODE_ENV=development

# CORS
CORS_ORIGIN=http://localhost:4200

# Logging
LOG_LEVEL=debug

# Sentry (POC-3 - optional)
SENTRY_DSN=your-sentry-dsn
```

**Service-specific `.env` files:**

Each service can have its own `.env` file for service-specific configuration.

### 6.2 Environment File Template

Create `.env.example` files in each service directory as templates:

```bash
# Copy example to .env
cp .env.example .env
# Edit .env with your local values
```

---

## 7. Project Structure

### 7.1 Backend Monorepo Structure

```
backend/
├── packages/
│   ├── api-gateway/          # API Gateway service
│   │   ├── src/
│   │   │   ├── routes/       # Route definitions
│   │   │   ├── middleware/   # Auth, rate limiting, etc.
│   │   │   └── index.ts      # Entry point
│   │   ├── package.json
│   │   └── .env
│   ├── auth-service/         # Auth microservice
│   │   ├── src/
│   │   │   ├── controllers/  # Request handlers
│   │   │   ├── services/     # Business logic
│   │   │   ├── routes/       # Express routes
│   │   │   └── index.ts      # Entry point
│   │   ├── package.json
│   │   └── .env
│   ├── payments-service/     # Payments microservice
│   ├── admin-service/        # Admin microservice
│   ├── profile-service/      # Profile microservice
│   ├── shared-types/         # Shared TypeScript types
│   ├── shared-utils/         # Shared utilities
│   ├── shared-db/            # POC-2: Shared database schema (Prisma)
│   │   ├── prisma/          # POC-3: Each service has its own prisma/ directory
│   │   │   └── schema.prisma
│   │   └── package.json
│   └── shared-event-hub/     # Event hub (Redis/RabbitMQ)
├── docker-compose.yml        # Local development (optional)
├── package.json              # Root workspace config
├── pnpm-lock.yaml            # pnpm lockfile
└── tsconfig.json             # TypeScript config
```

---

## 8. Running Services Locally

### 8.1 Development Workflow

**Option 1: Run Services Individually (Recommended for Development)**

```bash
# Terminal 1: API Gateway
cd packages/api-gateway
pnpm dev

# Terminal 2: Auth Service
cd packages/auth-service
pnpm dev

# Terminal 3: Payments Service
cd packages/payments-service
pnpm dev

# Terminal 4: Admin Service
cd packages/admin-service
pnpm dev

# Terminal 5: Profile Service
cd packages/profile-service
pnpm dev
```

**Option 2: Docker Compose (Recommended for Quick Start)**

```bash
# Start all services with Docker Compose
docker-compose up

# Or run in background
docker-compose up -d

# View logs
docker-compose logs -f

# Stop all services
docker-compose down
```

### 8.2 Service Ports

| Service          | Port | URL                          |
| ---------------- | ---- | ---------------------------- |
| API Gateway      | 3000 | http://localhost:3000        |
| Auth Service     | 3001 | http://localhost:3001        |
| Payments Service | 3002 | http://localhost:3002        |
| Admin Service    | 3003 | http://localhost:3003        |
| Profile Service  | 3004 | http://localhost:3004         |

**Note:** In production, only API Gateway is exposed. Other services are internal.

---

## 9. Database Migrations

### 9.1 Running Migrations

```bash
# Navigate to shared database package
cd packages/shared-db

# Create a new migration
pnpm prisma migrate dev --name migration_name

# Apply migrations
pnpm prisma migrate deploy

# Reset database (WARNING: Deletes all data)
pnpm prisma migrate reset
```

### 9.2 Prisma Studio (Database GUI)

```bash
# POC-2: Shared Database
# Navigate to shared database package
cd packages/shared-db
pnpm prisma studio

# POC-3: Separate Databases
# Open Prisma Studio for each service
cd apps/backend/auth-service
pnpm prisma studio --port 5555

cd apps/backend/payments-service
pnpm prisma studio --port 5556

# ... (repeat for admin-service and profile-service with different ports)

# Access at http://localhost:5555
```

---

## 10. Testing Setup

### 10.1 Run Tests

```bash
# Run all tests
pnpm test

# Run tests for specific service
pnpm --filter @backend/auth-service test

# Run tests with coverage
pnpm test:coverage

# Run tests in watch mode
pnpm test:watch
```

### 10.2 Test Database Setup

```bash
# Create test database
psql postgres -c "CREATE DATABASE universal_mfe_test;"

# Set test database URL
export DATABASE_URL=postgresql://postgres:postgres@localhost:5432/universal_mfe_test

# Run migrations on test database
cd packages/shared-db
pnpm prisma migrate deploy
```

---

## 11. Common Development Tasks

### 11.1 Adding a New Service

```bash
# 1. Create service directory
mkdir -p packages/new-service/src

# 2. Initialize package.json
cd packages/new-service
pnpm init

# 3. Add dependencies
pnpm add express
pnpm add -D typescript @types/express

# 4. Create TypeScript config
# (Copy from existing service)

# 5. Add service to workspace
# (Update root package.json workspaces)
```

### 11.2 Adding a New Database Table

```bash
# 1. Update Prisma schema
cd packages/shared-db
# Edit prisma/schema.prisma

# 2. Create migration
pnpm prisma migrate dev --name add_new_table

# 3. Generate Prisma Client
pnpm prisma generate
```

### 11.3 Adding a New API Endpoint

```bash
# 1. Add route in service
# Edit packages/<service>/src/routes/<resource>.ts

# 2. Add controller
# Edit packages/<service>/src/controllers/<resource>Controller.ts

# 3. Add service logic
# Edit packages/<service>/src/services/<resource>Service.ts

# 4. Add validation
# Edit packages/<service>/src/validators/<resource>Validator.ts

# 5. Register route in API Gateway
# Edit packages/api-gateway/src/routes.ts
```

---

## 12. Debugging

### 12.1 VS Code Debugging

Create `.vscode/launch.json`:

```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "type": "node",
      "request": "launch",
      "name": "Debug API Gateway",
      "runtimeExecutable": "pnpm",
      "runtimeArgs": ["--filter", "@backend/api-gateway", "dev"],
      "skipFiles": ["<node_internals>/**"],
      "env": {
        "NODE_ENV": "development"
      }
    }
  ]
}
```

### 12.2 Logging

```typescript
// Use Winston logger
import { logger } from '@backend/shared-utils';

logger.info('Service started');
logger.error('Error occurred', { error });
logger.debug('Debug information', { data });
```

### 12.3 Database Query Debugging

```typescript
// Enable Prisma query logging
const prisma = new PrismaClient({
  log: ['query', 'info', 'warn', 'error'],
});
```

---

## 13. Common Issues & Solutions

### 13.1 Database Connection Issues

**Issue:** Cannot connect to PostgreSQL

**Solution:**

```bash
# Check PostgreSQL is running
brew services list  # macOS
sudo systemctl status postgresql  # Linux

# Check connection
psql -U postgres -d universal_mfe_dev

# Verify DATABASE_URL in .env
echo $DATABASE_URL
```

---

### 13.2 Port Already in Use

**Issue:** Port 3000 (or other port) is already in use

**Solution:**

```bash
# Find process using port
lsof -i :3000

# Kill process
kill -9 <PID>

# Or change port in .env
API_PORT=3001
```

---

### 13.3 Prisma Client Not Generated

**Issue:** `PrismaClient` is not found

**Solution:**

```bash
# Generate Prisma Client
cd packages/shared-db
pnpm prisma generate

# Verify generation
ls node_modules/.prisma/client
```

---

### 13.4 Redis Connection Issues

**Issue:** Cannot connect to Redis

**Solution:**

```bash
# Check Redis is running
redis-cli ping  # Should return PONG

# Check Redis URL in .env
echo $REDIS_URL

# Test connection
redis-cli -u $REDIS_URL ping
```

---

### 13.5 pnpm Workspace Issues

**Issue:** Cannot find workspace package

**Solution:**

```bash
# Reinstall dependencies
pnpm install

# Verify workspace configuration
cat pnpm-workspace.yaml

# Check workspace package exists
ls packages/<package-name>
```

---

## 14. Development Best Practices

### 14.1 Code Style

- Use ESLint and Prettier (configured in root)
- Follow TypeScript best practices
- Use consistent naming conventions
- Write self-documenting code

### 14.2 Git Workflow

```bash
# Create feature branch
git checkout -b feature/your-feature-name

# Commit changes
git add .
git commit -m "feat: your feature description"

# Push to remote
git push origin feature/your-feature-name
```

### 14.3 Testing

- Write tests for new features
- Maintain test coverage above 70%
- Run tests before committing
- Use descriptive test names

### 14.4 Documentation

- Document API endpoints
- Update OpenAPI spec
- Add JSDoc comments
- Update README files

---

## 15. Quick Start Checklist

Use this checklist for first-time setup:

- [ ] Install Node.js 24.11.x LTS
- [ ] Install pnpm v9.x
- [ ] Install PostgreSQL 16.x
- [ ] Install Redis 7.x
- [ ] Clone repository
- [ ] Run `pnpm install`
- [ ] Create database (`universal_mfe_dev`)
- [ ] Setup Prisma (generate, migrate)
- [ ] Create `.env` files
- [ ] Start PostgreSQL
- [ ] Start Redis
- [ ] Run `pnpm prisma migrate dev`
- [ ] Start API Gateway (`pnpm --filter @backend/api-gateway dev`)
- [ ] Verify API Gateway is running (http://localhost:3000/health)
- [ ] Start Auth Service
- [ ] Test login endpoint

---

## 16. Next Steps

After completing setup:

1. **Read Architecture Docs:**
   - `docs/backend-architecture.md` - High-level architecture
   - `docs/backend-poc2-architecture.md` - POC-2 architecture
   - `docs/backend-poc3-architecture.md` - POC-3 architecture

2. **Read Tech Stack Docs:**
   - `docs/backend-poc2-tech-stack.md` - POC-2 tech stack
   - `docs/backend-poc3-tech-stack.md` - POC-3 tech stack

3. **Read Implementation Guides:**
   - `docs/backend-testing-strategy.md` - Testing strategy
   - `docs/backend-api-documentation-standards.md` - API documentation

4. **Explore Codebase:**
   - Start with API Gateway
   - Explore Auth Service
   - Review shared libraries

---

## 17. Related Documents

- `docs/backend-architecture.md` - High-level backend architecture
- `docs/backend-poc2-architecture.md` - POC-2 architecture
- `docs/backend-poc3-architecture.md` - POC-3 architecture
- `docs/backend-poc2-tech-stack.md` - POC-2 tech stack
- `docs/backend-poc3-tech-stack.md` - POC-3 tech stack
- `docs/backend-testing-strategy.md` - Testing strategy
- `docs/backend-api-documentation-standards.md` - API documentation standards

---

**Last Updated:** 2026-01-XX  
**Status:** Authoritative - Ready for Developer Onboarding

