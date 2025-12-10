# Developer Workflow - Full-Stack

**Status:** ✅ Complete  
**Date:** 2026-12-09  
**Task:** 5.5.1 - Technical Documentation

---

## Overview

This guide explains how to develop, build, and test the complete POC-2 full-stack application (frontend + backend).

**Key Features:**

- Frontend MFEs (Shell, Auth, Payments, Admin)
- Backend microservices (API Gateway, Auth, Payments, Admin, Profile)
- Real JWT authentication
- Database integration
- Event bus communication

---

## Prerequisites

1. **Node.js** 24.11.x LTS and **pnpm** 9.x installed
2. **PostgreSQL** 16.x installed and running
3. **Redis** 7.x installed and running
4. **Docker & Docker Compose** (optional, for infrastructure)
5. **Dependencies installed**: `pnpm install`
6. **Ports available**: 3000-3004 (backend), 4200-4203 (frontend)

---

## Quick Start

### Complete Setup (First Time)

1. **Install dependencies:**

   ```bash
   pnpm install
   ```

2. **Start infrastructure:**

   ```bash
   pnpm infra:start
   ```

3. **Set up database:**

   ```bash
   pnpm backend:setup
   ```

4. **Start all services (frontend + backend):**

   ```bash
   # Terminal 1: Backend services
   pnpm dev:backend

   # Terminal 2: Frontend services
   pnpm dev:mf
   ```

5. **Access the application:**
   - Frontend: http://localhost:4200
   - API Gateway: http://localhost:3000

---

## Development Workflow

### Option 1: Separate Terminals (Recommended)

**Terminal 1 - Infrastructure:**

```bash
pnpm infra:start
```

**Terminal 2 - Backend Services:**

```bash
pnpm dev:backend
```

**Terminal 3 - Frontend Services:**

```bash
pnpm dev:mf
```

### Option 2: Individual Services

**Backend Services (5 terminals):**

```bash
pnpm dev:api-gateway
pnpm dev:auth-service
pnpm dev:payments-service
pnpm dev:admin-service
pnpm dev:profile-service
```

**Frontend Services (4 terminals):**

```bash
pnpm dev:shell
pnpm dev:auth-mfe
pnpm dev:payments-mfe
pnpm dev:admin-mfe
```

---

## Common Commands

### Full-Stack Development

```bash
# Start all backend services
pnpm dev:backend

# Start all frontend services
pnpm dev:mf

# Start infrastructure
pnpm infra:start

# Complete setup (infrastructure + database)
pnpm backend:setup
```

### Full-Stack Testing

```bash
# Run all tests (frontend + backend)
pnpm test
pnpm test:backend

# Run E2E tests (requires both frontend and backend)
pnpm e2e

# Run full-stack integration tests
# (See testing-guide.md for details)
```

### Full-Stack Building

```bash
# Build all projects (frontend + backend)
pnpm build
pnpm build:backend
```

### Health Checks

```bash
# Check all backend services
pnpm test:api:all

# Check frontend (manual)
# Open http://localhost:4200
```

---

## Development Tips

### 1. Start Infrastructure First

Always start infrastructure (PostgreSQL, Redis) before starting services:

```bash
pnpm infra:start
```

### 2. Set Up Database

Run database setup before first development session:

```bash
pnpm backend:setup
```

### 3. Verify Services Are Running

Check health endpoints:

```bash
# Backend health
pnpm test:api:all

# Frontend (manual)
# Open http://localhost:4200
```

### 4. Use HMR for Frontend

Frontend supports HMR - changes reflect instantly without refresh.

### 5. Monitor Logs

Watch service logs for errors:

```bash
# Infrastructure logs
pnpm infra:logs

# Service logs (check terminal output)
```

---

## Testing Full-Stack

### Manual Testing

1. **Start all services:**

   ```bash
   pnpm infra:start
   pnpm dev:backend
   pnpm dev:mf
   ```

2. **Test authentication:**
   - Open http://localhost:4200
   - Sign up a new user
   - Sign in
   - Verify JWT tokens are stored

3. **Test payments:**
   - Sign in as VENDOR
   - Create a payment
   - Verify payment appears in list

4. **Test admin:**
   - Sign in as ADMIN
   - Access /admin route
   - Verify user management works

### Automated Testing

```bash
# Run E2E tests (requires all services running)
pnpm e2e

# Run full-stack integration tests
# (See testing-guide.md)
```

---

## Troubleshooting

### Services Not Starting

**Problem:** Services fail to start

**Solution:**

1. Verify infrastructure is running: `pnpm infra:start`
2. Check database connection: `pnpm db:studio`
3. Check Redis connection: `redis-cli ping`
4. Verify ports are available
5. Check environment variables

### Frontend Can't Connect to Backend

**Problem:** API calls failing

**Solution:**

1. Verify backend services are running: `pnpm test:api:all`
2. Check API base URL in frontend .env
3. Verify CORS is configured correctly
4. Check browser console for errors

### Database Issues

**Problem:** Database errors

**Solution:**

1. Verify PostgreSQL is running
2. Check DATABASE_URL in .env
3. Run migrations: `pnpm db:migrate`
4. Reset database if needed: `pnpm db:reset`

### Module Federation Issues

**Problem:** Remotes not loading

**Solution:**

1. Verify remotes are built: `pnpm build:remotes`
2. Check remote URLs in shell config
3. Verify all frontend services are running
4. Check browser console for errors

---

## Best Practices

1. **Start Infrastructure First** - Always start PostgreSQL and Redis before services
2. **Run Migrations** - Run `pnpm db:migrate` after pulling changes
3. **Test Locally** - Test full-stack locally before committing
4. **Use Health Checks** - Use health check endpoints to verify services
5. **Monitor Logs** - Watch service logs for errors
6. **Write Tests** - Write full-stack integration tests

---

## Related Documentation

- [`developer-workflow-frontend.md`](./developer-workflow-frontend.md) - Frontend development workflow
- [`developer-workflow-backend.md`](./developer-workflow-backend.md) - Backend development workflow
- [`testing-guide.md`](./testing-guide.md) - Testing guide
- [`api-contracts.md`](./api-contracts.md) - API contracts
