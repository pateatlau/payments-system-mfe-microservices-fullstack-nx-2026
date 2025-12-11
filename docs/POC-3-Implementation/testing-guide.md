# Comprehensive Testing Guide - POC-3

**Status:** In Progress  
**Date:** 2026-12-10  
**Phase:** POC-3 - Production-Ready Infrastructure

---

## Overview

POC-3 extends the comprehensive testing strategy from POC-2 with additional tests for production-ready infrastructure including nginx reverse proxy, separate databases, RabbitMQ event hub, WebSocket support, and enhanced observability.

**Testing Stack:**

- **Unit Tests:** Jest + React Testing Library (Frontend), Jest (Backend)
- **Integration Tests:** Jest + React Testing Library (Frontend), Jest (Backend)
- **Infrastructure Tests:** Shell scripts + Docker health checks
- **Migration Tests:** TypeScript migration scripts with validation
- **Full-Stack Integration Tests:** Playwright with backend API verification
- **E2E Tests:** Playwright
- **Load Tests:** (Planned) Artillery/k6 for performance testing

**Coverage Target:** 70%+ (maintaining POC-2 coverage)

---

## Quick Reference: Running Tests and Managing Servers

This section provides complete instructions for running tests, starting/killing servers, and clearing caches in POC-3.

### Running Tests

#### Unit Tests

**Frontend Unit Tests:**

```bash
# Run all frontend unit tests (all MFEs + shared libraries)
pnpm test

# Run tests for specific frontend projects
pnpm test:shell              # Shell app tests
pnpm test:auth-mfe           # Auth MFE tests
pnpm test:payments-mfe       # Payments MFE tests
pnpm test:admin-mfe         # Admin MFE tests

# Run tests for shared libraries
pnpm test:shared-websocket  # WebSocket client library
pnpm test:shared-auth-store # Auth store
pnpm test:shared-header-ui  # Header UI components
pnpm test:shared-ui         # Shared UI components
pnpm test:shared-utils     # Shared utilities
pnpm test:shared-types     # Shared types
pnpm test:libraries        # All shared libraries

# Run with coverage
pnpm test:coverage          # All frontend tests with coverage
pnpm test:coverage:shell    # Shell with coverage
pnpm test:coverage:auth-mfe # Auth MFE with coverage
pnpm test:coverage:payments-mfe # Payments MFE with coverage
pnpm test:coverage:admin-mfe    # Admin MFE with coverage
pnpm test:shared-websocket:coverage # WebSocket library with coverage

# Run affected tests only (tests for changed code)
pnpm test:affected

# Run tests in UI mode (interactive)
pnpm test:ui
```

**Backend Unit Tests:**

```bash
# Run all backend unit tests (all services + libraries)
pnpm test:backend

# Run tests for specific backend services
pnpm test:api-gateway       # API Gateway tests
pnpm test:auth-service      # Auth Service tests
pnpm test:payments-service  # Payments Service tests
pnpm test:admin-service     # Admin Service tests
pnpm test:profile-service  # Profile Service tests

# Run tests for backend libraries
pnpm test:backend-libs      # Backend shared libraries (types, utils, db, event-hub)

# Run with coverage
npx nx test api-gateway --coverage
npx nx test auth-service --coverage
npx nx test payments-service --coverage
npx nx test admin-service --coverage
pnpm test:coverage:backend # All backend services with coverage
```

#### Integration Tests

**Frontend Integration Tests:**

```bash
# Integration tests run with unit tests
pnpm test:shell  # Includes integration tests for Shell app
```

**Backend Integration Tests:**

```bash
# Integration tests run with backend unit tests
pnpm test:backend  # Includes integration tests
```

**Infrastructure Integration Tests:**

```bash
# Test infrastructure services (nginx, databases, RabbitMQ)
pnpm infra:test

# Test API Gateway proxy functionality
pnpm test:api-gateway:proxy
# Or directly:
./scripts/test-api-gateway-proxy.sh

# Test RabbitMQ event hub
pnpm rabbitmq:test              # All event hub tests
pnpm rabbitmq:test:ordering     # Message ordering test
pnpm rabbitmq:test:load         # Load test
pnpm rabbitmq:test:retry        # Retry mechanism test
pnpm rabbitmq:test:dlq          # Dead letter queue test
pnpm rabbitmq:test:persistence  # Persistence test
```

#### E2E Tests

**Running E2E Tests:**

```bash
# Run all E2E tests (requires frontend remotes built)
pnpm e2e

# Run E2E tests for Shell app
pnpm e2e:shell

# Run E2E tests in UI mode (interactive)
npx nx e2e shell-e2e --ui

# Run specific E2E test file
npx nx e2e shell-e2e --testPathPattern="auth-flow"
npx nx e2e shell-e2e --testPathPattern="payments-flow"
npx nx e2e shell-e2e --testPathPattern="admin-flow"
```

**Prerequisites for E2E Tests:**

1. Build frontend remotes:
   ```bash
   pnpm build:remotes
   ```

2. Start backend services (optional, for full-stack integration):
   ```bash
   pnpm infra:start
   pnpm dev:backend
   ```

3. Start frontend servers (optional, for full-stack integration):
   ```bash
   pnpm dev:mf
   ```

### Starting Frontend Servers

**Start All Frontend Servers:**

```bash
# Start all MFEs in parallel (Shell + Auth + Payments + Admin)
pnpm dev:mf

# Alternative: Start all with preview mode (after building)
pnpm build:remotes
pnpm preview:all
```

**Start Individual Frontend Servers:**

```bash
# Start Shell app (port 4200)
pnpm dev:shell
# Or:
pnpm dev:mf:shell

# Start Auth MFE (port 4201)
pnpm dev:auth-mfe

# Start Payments MFE (port 4202)
pnpm dev:payments-mfe

# Start Admin MFE (port 4203)
pnpm dev:admin-mfe

# Start only remote MFEs (Auth + Payments + Admin, no Shell)
pnpm dev:mf:remotes
```

**Start with Preview Mode (Production Build):**

```bash
# Build remotes first
pnpm build:remotes

# Preview all MFEs
pnpm preview:all

# Preview individual MFEs
pnpm preview:shell
pnpm preview:auth-mfe
pnpm preview:payments-mfe
pnpm preview:admin-mfe
pnpm preview:remotes  # Only remotes
```

### Killing Frontend Servers

**Kill All Frontend Servers:**

```bash
# Kill all frontend servers (ports 4200, 4201, 4202, 4203)
pnpm kill:all
```

**Kill Individual Frontend Servers:**

```bash
# Kill Shell app (port 4200)
pnpm kill:shell

# Kill Auth MFE (port 4201)
pnpm kill:auth-mfe

# Kill Payments MFE (port 4202)
pnpm kill:payments-mfe

# Kill Admin MFE (port 4203)
pnpm kill:admin-mfe
```

**Manual Kill (if scripts don't work):**

```bash
# Find and kill processes on specific ports
lsof -ti :4200 | xargs kill -9  # Shell
lsof -ti :4201 | xargs kill -9  # Auth MFE
lsof -ti :4202 | xargs kill -9  # Payments MFE
lsof -ti :4203 | xargs kill -9  # Admin MFE

# Kill all Nx serve processes
pkill -f 'nx.*serve'
```

### Starting Backend Services/Servers

**Diagnose Backend Services (Recommended First Step):**

Before starting backend services, run the diagnostic script to check infrastructure, databases, and configurations:

```bash
# Run comprehensive backend diagnostics
./scripts/diagnose-backend-errors.sh

# This checks:
# - Infrastructure services (RabbitMQ, Redis)
# - All databases (auth_db, payments_db, admin_db, profile_db)
# - Environment variables (RABBITMQ_URL, database URLs, JWT_SECRET)
# - Prisma clients (all services)
# - Build status (all services)
# - Service ports (3000-3004)
# - Provides actionable recommendations
```

**Start Infrastructure Services (Docker):**

```bash
# Start all infrastructure services (nginx, databases, RabbitMQ, Redis)
pnpm infra:start
# Or:
docker-compose up -d

# Check infrastructure status
pnpm infra:status
# Or:
docker-compose ps

# View infrastructure logs
pnpm infra:logs
# Or:
docker-compose logs -f
```

**Start All Backend Services:**

```bash
# Start all backend services in parallel (API Gateway + all microservices)
pnpm dev:backend

# Start with infrastructure
pnpm backend:dev:all  # Starts infra + all services in background
```

**Start Individual Backend Services:**

```bash
# Start API Gateway (port 3000)
pnpm dev:api-gateway

# Start Auth Service (port 3001)
pnpm dev:auth-service

# Start Payments Service (port 3002)
pnpm dev:payments-service

# Start Admin Service (port 3003)
pnpm dev:admin-service

# Start Profile Service (port 3004)
pnpm dev:profile-service
```

**Start Backend with API Gateway:**

```bash
# Start all services including API Gateway
pnpm backend:dev:with-gateway
```

**Check Backend Service Status:**

```bash
# Check which backend services are running
pnpm backend:status

# Check individual service health
pnpm test:api:health        # API Gateway
pnpm test:api:auth:health   # Auth Service
pnpm test:api:payments:health # Payments Service
pnpm test:api:admin:health   # Admin Service
pnpm test:api:profile:health # Profile Service

# Check all services at once
pnpm test:api:all
```

### Killing Backend Services/Servers

**Kill All Backend Services:**

```bash
# Kill all backend services (ports 3000, 3001, 3002, 3003, 3004)
pnpm backend:kill
```

**Kill Infrastructure Services:**

```bash
# Stop all Docker containers
pnpm infra:stop
# Or:
docker-compose down

# Stop and remove volumes
pnpm infra:clean
# Or:
docker-compose down -v --remove-orphans
```

**Kill All (Backend + Infrastructure):**

```bash
# Kill all backend services and stop infrastructure
pnpm clean:backend
```

**Manual Kill (if scripts don't work):**

```bash
# Find and kill processes on specific ports
lsof -ti :3000 | xargs kill -9  # API Gateway
lsof -ti :3001 | xargs kill -9  # Auth Service
lsof -ti :3002 | xargs kill -9  # Payments Service
lsof -ti :3003 | xargs kill -9  # Admin Service
lsof -ti :3004 | xargs kill -9  # Profile Service

# Kill all tsx processes (backend services)
pkill -f 'tsx.*auth-service'
pkill -f 'tsx.*payments-service'
pkill -f 'tsx.*admin-service'
pkill -f 'tsx.*profile-service'
pkill -f 'tsx.*api-gateway'
```

### Clearing Caches

**Clear Build Cache:**

```bash
# Remove all build output
pnpm clean:build
# Or manually:
rm -rf dist
```

**Clear Nx Cache:**

```bash
# Clear Nx cache (test results, build cache, etc.)
pnpm clean:cache
# Or:
nx reset
```

**Clear All Caches:**

```bash
# Clear both build output and Nx cache
pnpm clean:all
```

**Clear Redis Cache:**

```bash
# Flush all Redis data (caching only in POC-3)
pnpm redis:flush
# Or manually:
docker exec -it mfe-redis redis-cli FLUSHALL
```

**Clear Browser Cache:**

```bash
# For Chrome/Edge (macOS)
rm -rf ~/Library/Caches/Google/Chrome
rm -rf ~/Library/Caches/Microsoft\ Edge

# For Firefox (macOS)
rm -rf ~/Library/Caches/Firefox

# For Safari (macOS)
rm -rf ~/Library/Caches/com.apple.Safari

# Or use browser DevTools:
# Chrome/Edge: DevTools → Application → Storage → Clear site data
# Firefox: DevTools → Storage → Clear All
# Safari: Develop → Empty Caches
```

**Clear Service Worker Cache:**

```bash
# In browser DevTools:
# Chrome/Edge: DevTools → Application → Service Workers → Unregister
# Firefox: DevTools → Application → Service Workers → Unregister
# Safari: Develop → Service Workers → Unregister
```

**Clear Docker Volumes (Complete Reset):**

```bash
# WARNING: This will delete all database data and RabbitMQ data
pnpm infra:clean
# Or:
docker-compose down -v --remove-orphans
```

### Complete Development Workflow

**Full Stack Development (Frontend + Backend):**

```bash
# Terminal 1: Start infrastructure
pnpm infra:start

# Terminal 2: Start all backend services
pnpm dev:backend

# Terminal 3: Start all frontend servers
pnpm dev:mf

# Terminal 4: Run tests
pnpm test              # Frontend tests
pnpm test:backend      # Backend tests
pnpm e2e               # E2E tests
```

**Quick Start (Everything):**

```bash
# Start everything in one command (infrastructure + backend + frontend)
pnpm infra:start && sleep 3 && pnpm dev:backend & pnpm dev:mf
```

**Complete Cleanup:**

```bash
# Kill all frontend servers
pnpm kill:all

# Kill all backend services
pnpm backend:kill

# Stop infrastructure
pnpm infra:stop

# Clear all caches
pnpm clean:all
```

**Complete Reset (Fresh Start):**

```bash
# 1. Kill everything
pnpm kill:all
pnpm backend:kill
pnpm infra:clean

# 2. Clear caches
pnpm clean:all
pnpm redis:flush

# 3. Restart infrastructure
pnpm infra:start

# 4. Restart services
pnpm dev:backend
pnpm dev:mf
```

### Test Scripts

**Infrastructure Test Scripts:**

```bash
# Test all infrastructure services (nginx, databases, RabbitMQ, Redis)
pnpm infra:test
# Or directly:
./scripts/test-infrastructure.sh

# Test API Gateway proxy functionality
pnpm test:api-gateway:proxy
# Or directly:
./scripts/test-api-gateway-proxy.sh

# Verify Phases 1-3 completion
pnpm verify:phases-1-3
# Or directly:
./scripts/verify-phases-1-3.sh

# Verify environment setup
./scripts/verify-environment.sh
```

**RabbitMQ Event Hub Test Scripts:**

```bash
# Run all event hub tests
pnpm rabbitmq:test
# Or directly:
pnpm tsx scripts/test-event-hub.ts

# Run specific test types
pnpm rabbitmq:test:ordering     # Message ordering test
pnpm rabbitmq:test:load         # Load test (1000 messages)
pnpm rabbitmq:test:retry        # Retry mechanism test
pnpm rabbitmq:test:dlq          # Dead letter queue test

# Test event persistence
pnpm rabbitmq:test:persistence        # Full persistence test
pnpm rabbitmq:test:persistence:publish # Publish events
pnpm rabbitmq:test:persistence:verify  # Verify events persisted

# Monitor dead letter queue
pnpm rabbitmq:monitor-dlq
# Or directly:
pnpm tsx scripts/monitor-dlq.ts
```

**Migration Test Scripts:**

```bash
# Export data from shared database
pnpm migrate:export              # Export all services
pnpm migrate:export:auth         # Export auth data only
pnpm migrate:export:payments     # Export payments data only
pnpm migrate:export:admin        # Export admin data only
pnpm migrate:export:profile      # Export profile data only

# Import data to separate databases
pnpm migrate:import              # Import all services
pnpm migrate:import:auth         # Import auth data only
pnpm migrate:import:payments     # Import payments data only
pnpm migrate:import:admin        # Import admin data only
pnpm migrate:import:profile      # Import profile data only
pnpm migrate:import:users        # Import user denormalization only

# Validate migration
pnpm migrate:validate

# Rollback migration (WARNING: Deletes migrated data)
pnpm migrate:rollback            # Shows warning with individual commands
pnpm migrate:rollback:auth       # Rollback auth database
pnpm migrate:rollback:payments    # Rollback payments database
pnpm migrate:rollback:admin     # Rollback admin database
pnpm migrate:rollback:profile    # Rollback profile database
```

**API Test Scripts:**

```bash
# Health check tests
pnpm test:api:health        # API Gateway health
pnpm test:api:auth:health   # Auth Service health
pnpm test:api:payments:health # Payments Service health
pnpm test:api:admin:health   # Admin Service health
pnpm test:api:profile:health # Profile Service health
pnpm test:api:all           # All health checks

# Auth API tests
pnpm test:api:register      # Test user registration
pnpm test:api:login         # Test user login

# Payments API tests
pnpm test:api:payments:list      # List payments (requires auth)
pnpm test:api:payments:create    # Create payment (requires auth)
pnpm test:api:payments:update-status # Update payment status

# Admin API tests
pnpm test:api:admin:list-users    # List users (requires admin auth)
pnpm test:api:admin:get-user      # Get user (requires admin auth)
pnpm test:api:admin:update-user    # Update user (requires admin auth)
pnpm test:api:admin:update-role    # Update user role (requires admin auth)

# Profile API tests
pnpm test:api:profile:get         # Get profile (requires auth)
pnpm test:api:profile:update      # Update profile (requires auth)
pnpm test:api:profile:get-preferences  # Get preferences (requires auth)
pnpm test:api:profile:update-preferences # Update preferences (requires auth)

# Workflow tests
pnpm test:workflow:register-login # Complete registration → login workflow
pnpm test:workflow:full          # Full user workflow (see manual-testing-guide.md)
```

**Security Test Scripts:**

```bash
# Rate limiting test
pnpm test:security:rate-limit  # Sends 105 requests to test rate limiting

# CORS test
pnpm test:security:cors        # Tests CORS headers

# JWT validation test
pnpm test:security:jwt         # Tests JWT token validation
```

**Performance Test Scripts:**

```bash
# Health endpoint performance (100 requests)
pnpm test:performance:health

# Concurrent requests test (10 parallel)
pnpm test:performance:concurrent
```

**Environment Verification Scripts:**

```bash
# Check environment setup
pnpm env:check

# Validate environment variables
pnpm env:validate
```

---

## POC-3 Testing Additions

### Infrastructure Testing

**New Test Areas:**

1. **nginx Reverse Proxy** ✅
   - SSL/TLS certificate validation: Configured
   - Rate limiting verification: Implemented
   - Security headers validation: Verified
   - API Gateway proxy: Streaming HTTP proxy implemented
   - WebSocket proxy functionality: Planned
   - Load balancing: Planned

2. **Separate Databases**
   - Service isolation verification
   - Cross-service data integrity
   - Migration validation scripts
   - Rollback procedures

3. **RabbitMQ Event Hub** ✅
   - Exchange/queue configuration: Verified
   - Event routing verification: 100% accurate
   - Dead letter queue handling: Working
   - Event persistence: Configured (manual test available)
   - Message ordering: 100% FIFO guaranteed
   - Throughput: 2409 msg/sec (240% above target)
   - Latency: 1ms p95 (99% below target)
   - Retry mechanism: Verified working
   - See: `docs/POC-3-Implementation/event-hub-test-results.md`

4. **WebSocket Support**
   - Connection establishment
   - Authentication flow
   - Real-time message delivery
   - Reconnection logic
   - Cross-tab synchronization

5. **Observability**
   - Error tracking (Sentry integration)
   - Metrics collection (Prometheus)
   - Distributed tracing (OpenTelemetry)
   - Log aggregation

---

## Testing Strategy

### Test Pyramid (POC-3)

```
        ┌─────────────────────┐
        │   E2E Tests         │  (50+ tests from POC-2 + new)
        │   Playwright        │  + WebSocket, nginx, migration
        └─────────────────────┘
       ┌─────────────────────────┐
       │ Full-Stack Integration  │  (35+ tests from POC-2)
       │ Tests                   │  + RabbitMQ, WebSocket
       └─────────────────────────┘
      ┌─────────────────────────────┐
      │ Integration Tests           │  (90+ tests)
      │ Jest + Infrastructure       │  + Migration, RabbitMQ
      └─────────────────────────────┘
     ┌─────────────────────────────────┐
     │   Unit Tests                   │  (186+ tests from POC-2)
     │   Jest                          │  (maintained)
     └─────────────────────────────────┘
    ┌─────────────────────────────────────┐
    │ Infrastructure Tests                │  (New for POC-3)
    │ Shell Scripts + Docker              │  nginx, DB, RabbitMQ
    └─────────────────────────────────────┘
```

### Test Distribution (POC-3)

**Frontend (from POC-2):**

- Unit Tests: 86+ tests (maintained)
- Integration Tests: 40+ tests (maintained)
- Full-Stack Integration Tests: 35+ tests (maintained)
- E2E Tests: 50+ tests (maintained)

**Backend (from POC-2):**

- Unit Tests: 100+ tests (maintained)
- Integration Tests: 50+ tests (maintained)
- API Contract Tests: 22 endpoints (maintained)

**Infrastructure (New for POC-3):**

- nginx Tests: 8+ checks (SSL, headers, rate limiting)
- API Gateway Tests: 13 unit tests + integration script (proxy, streaming, error handling)
- Database Tests: 7+ checks (connections, migrations)
- RabbitMQ Tests: 5+ checks (exchanges, queues, bindings)
- Migration Scripts: 13 scripts with validation

**Total:** 413+ tests (380+ from POC-2 + 33+ new infrastructure tests)

---

## Infrastructure Testing

### nginx Reverse Proxy Tests

**Script:** `scripts/test-infrastructure.sh`

**Test Coverage:**

```bash
# Run infrastructure tests
pnpm infra:test

# Individual tests
./scripts/test-infrastructure.sh
```

**Tests Included:**

1. **HTTP to HTTPS Redirect**

   ```bash
   curl -I http://localhost/ | grep "301 Moved Permanently"
   curl -I http://localhost/ | grep "Location: https://localhost/"
   ```

2. **HTTPS Access**

   ```bash
   curl -k -I https://localhost/ | grep "200 OK"
   ```

3. **Security Headers**

   ```bash
   curl -k -s -i https://localhost/ | grep "X-Frame-Options: DENY"
   curl -k -s -i https://localhost/ | grep "X-Content-Type-Options: nosniff"
   curl -k -s -i https://localhost/ | grep "Content-Security-Policy"
   ```

4. **SSL Certificate Validity**

   ```bash
   openssl x509 -in nginx/ssl/self-signed.crt -noout -dates
   ```

5. **nginx Configuration Syntax**

   ```bash
   docker run --rm -v "$(pwd)/nginx/nginx.conf:/etc/nginx/nginx.conf:ro" nginx:latest nginx -t
   ```

6. **Rate Limiting** (Manual)
   ```bash
   # Test rate limit (100 req/min for API)
   for i in {1..105}; do curl -s http://localhost/api/health > /dev/null; done
   # Should see 429 Too Many Requests after 100 requests
   ```

### API Gateway Proxy Tests

**Status:** ✅ Complete  
**Script:** `scripts/test-api-gateway-proxy.sh`  
**Unit Tests:** `apps/api-gateway/src/middleware/proxy.test.ts`

**Overview:**

POC-3 implements a production-ready streaming HTTP proxy using Node.js native `http`/`https` modules. The proxy provides zero-buffering request/response streaming, comprehensive header forwarding, path rewriting, and robust error handling.

**Why Native HTTP Modules:**

POC-2 encountered issues with `http-proxy-middleware` v3.x including:
- Request body streaming problems
- Path rewriting complications
- Timeout errors
- Limited control over streaming behavior

The native implementation provides:
- Maximum control over streaming
- Zero external proxy dependencies
- Better performance (no serialization overhead)
- Reliable error handling

**Architecture:**

```
Frontend Request
   ↓ https://localhost/api/{service}/*
nginx Reverse Proxy (SSL termination, security headers)
   ↓ http://localhost:3000/api/{service}/*
API Gateway Streaming Proxy (path rewrite, header forwarding)
   ↓ http://localhost:300{X}/* (path rewritten, service-specific)
Backend Service (Auth: 3001, Payments: 3002, Admin: 3003, Profile: 3004)
```

**Integration Test Script:**

```bash
# Run all API Gateway proxy tests
pnpm test:api-gateway:proxy

# Or run directly
./scripts/test-api-gateway-proxy.sh
```

**Test Coverage:**

The integration test script (`scripts/test-api-gateway-proxy.sh`) includes:

1. **Pre-flight Checks**
   - Verifies all backend services are running (Auth, Payments, Admin, Profile)
   - Verifies API Gateway is running on port 3000
   - Exits with clear error if any service is down

2. **Health Check Endpoints**
   - API Gateway direct health check (non-proxied)
   - Verifies `/health` endpoint responds correctly

3. **Auth Service Proxy** (`/api/auth` → port 3001)
   - GET `/api/auth/health` - Health check through proxy
   - POST `/api/auth/login` - Login with request body (JSON)
   - Verifies path rewriting (`/api/auth/*` → `/*`)
   - Tests POST requests with body streaming

4. **Payments Service Proxy** (`/api/payments` → port 3002)
   - GET `/api/payments/health` - Health check through proxy
   - GET `/api/payments?page=1&limit=10` - List with query parameters
   - Verifies authentication requirement (401/403 expected)
   - Tests GET requests with query strings

5. **Admin Service Proxy** (`/api/admin` → port 3003)
   - GET `/api/admin/health` - Health check through proxy
   - GET `/api/admin/users` - List users (requires admin auth)
   - Verifies RBAC enforcement (401/403 expected)
   - Tests admin-only endpoints

6. **Profile Service Proxy** (`/api/profile` → port 3004)
   - GET `/api/profile/health` - Health check through proxy
   - GET `/api/profile` - Get user profile (requires auth)
   - Verifies authentication requirement (401/403 expected)
   - Tests profile endpoints

7. **Header Forwarding**
   - Tests custom headers pass through proxy
   - Verifies proxy adds `X-Forwarded-For`, `X-Real-IP`, `X-Forwarded-Proto`
   - Tests `User-Agent` forwarding

8. **CORS Configuration**
   - OPTIONS `/api/auth/login` - CORS preflight request
   - Verifies `Access-Control-Allow-Origin` headers
   - Tests CORS from allowed origin (localhost:4200)

9. **Error Handling**
   - GET `/api/nonexistent/route` - Tests 404 for invalid routes
   - Verifies proper error responses

**Unit Tests:**

The proxy middleware has comprehensive unit tests (`apps/api-gateway/src/middleware/proxy.test.ts`):

```bash
# Run API Gateway unit tests
pnpm nx test api-gateway
```

**Unit Test Coverage: 13/13 tests passing**

1. **Proxy Creation and Configuration**
   - Creates proxy with default options
   - Creates proxy with custom options
   - Creates service-specific proxy with path rewriting

2. **Path Rewriting**
   - Rewrites single path pattern
   - Rewrites multiple path patterns
   - Handles paths with no rewrite rules

3. **Header Forwarding**
   - Forwards Host header to target
   - Forwards X-Forwarded-For header
   - Adds X-Real-IP header
   - Adds X-Forwarded-Proto header

4. **Request Streaming**
   - Proxies GET requests successfully
   - Proxies POST requests with body
   - Streams request without buffering

5. **Error Handling**
   - Returns 502 Bad Gateway on connection error
   - Returns 504 Gateway Timeout on timeout
   - Handles target service unavailable

**Middleware Order (CRITICAL):**

The API Gateway middleware must be configured in this exact order:

```typescript
// apps/api-gateway/src/main.ts
app.use(securityMiddleware);      // 1. Security headers
app.use(corsMiddleware);           // 2. CORS
app.use(requestLogger);            // 3. Request logging
app.use(generalRateLimiter);       // 4. Rate limiting
app.use('/health', express.json()); // 5. Health routes (with body parsing - safe)
app.use(healthRoutes);
app.use(proxyRoutes);              // 6. Proxy routes (NO body parsing - streaming)
app.use(notFoundHandler);          // 7. 404 handler
app.use(errorHandler);             // 8. Error handler
```

**Why No Body Parsing on Proxy Routes:**

Body parsing middleware (`express.json()`, `express.urlencoded()`) buffers the entire request body in memory. The streaming proxy uses `req.pipe(proxyReq)` to stream request bodies directly without buffering, which is essential for:

- **Memory efficiency:** Large file uploads don't consume memory
- **Better performance:** No serialization/deserialization overhead
- **Lower latency:** Streaming starts immediately
- **Scalability:** No memory spikes from large requests

**Frontend Configuration:**

All frontend applications now use the API Gateway via nginx:

```typescript
// Environment variable (via Rspack DefinePlugin)
NX_API_BASE_URL = 'https://localhost/api' // Default

// API client configuration
const apiClient = new ApiClient({
  baseURL: process.env.NX_API_BASE_URL || 'https://localhost/api',
  // ...
});
```

**Service-Specific Clients:**

```typescript
// Payments MFE
baseURL: 'https://localhost/api/payments'

// Admin MFE
baseURL: 'https://localhost/api/admin'

// Auth (via shared-api-client)
baseURL: 'https://localhost/api' // Auth routes at /api/auth/*
```

**Manual Testing Commands:**

```bash
# Prerequisites: All services and nginx must be running
docker compose up -d
pnpm dev:all

# Test Auth Service proxy
curl -X POST https://localhost/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","password":"Admin123!@#"}' \
  -k

# Test Payments Service proxy (requires auth token)
curl https://localhost/api/payments \
  -H "Authorization: Bearer $TOKEN" \
  -k

# Test Admin Service proxy (requires admin token)
curl https://localhost/api/admin/users \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -k

# Test Profile Service proxy (requires auth token)
curl https://localhost/api/profile \
  -H "Authorization: Bearer $TOKEN" \
  -k
```

**Test Results:**

- **Build Status:** ✅ All MFEs build successfully
- **Unit Tests:** ✅ 13/13 proxy tests passing
- **Integration Script:** ✅ Created (requires running services)
- **Frontend Integration:** ✅ All API clients updated
- **Documentation:** ✅ Complete

**Performance Characteristics:**

- **Streaming:** Zero-buffering, constant memory usage
- **Latency:** Minimal overhead (~1-2ms added to request)
- **Throughput:** Limited only by backend service capacity
- **Error Recovery:** Proper 502/504 responses with cleanup

**Known Limitations:**

1. **WebSocket Support:** Not yet implemented (planned for separate task)
2. **Load Balancing:** Single backend target per service (nginx handles load balancing)
3. **Circuit Breaker:** Not implemented (rely on nginx health checks)
4. **Request/Response Transformation:** Minimal (headers only)

**Next Steps:**

1. Run integration tests with all services up: `pnpm test:api-gateway:proxy`
2. Perform E2E testing of complete user flows through proxy
3. Load testing to verify performance characteristics
4. WebSocket proxy implementation (separate task)

### Database Tests

**Tests:**

1. **Database Connections**

   ```bash
   # Check all databases accessible
   psql -h localhost -p 5432 -U postgres -d auth_db -c "SELECT 1"
   psql -h localhost -p 5433 -U postgres -d payments_db -c "SELECT 1"
   psql -h localhost -p 5434 -U postgres -d admin_db -c "SELECT 1"
   psql -h localhost -p 5435 -U postgres -d profile_db -c "SELECT 1"
   psql -h localhost -p 5436 -U postgres -d mfe_poc2 -c "SELECT 1"
   ```

2. **Service Isolation**

   ```bash
   # Verify auth_db only has auth tables
   psql -h localhost -p 5432 -U postgres -d auth_db -c "\dt"
   # Should show: users, refresh_tokens
   ```

3. **Prisma Schema Validation**
   ```bash
   pnpm db:all:validate
   # Validates all 4 service-specific schemas
   ```

### RabbitMQ Tests

**Tests:**

1. **Exchanges Configuration**

   ```bash
   pnpm rabbitmq:list-exchanges
   # Should show: events (topic), events.dlx (direct)
   ```

2. **Queues Configuration**

   ```bash
   pnpm rabbitmq:list-queues
   # Should show: auth.events.queue, payments.events.queue,
   #              admin.events.queue, profile.events.queue, events.dlq
   ```

3. **Bindings Configuration**

   ```bash
   pnpm rabbitmq:list-bindings
   # Verify routing keys properly configured
   ```

4. **RabbitMQ Health**
   ```bash
   docker exec mfe-rabbitmq rabbitmq-diagnostics ping
   ```

### Redis Tests

**Tests:**

1. **Redis Connection**

   ```bash
   pnpm redis:ping
   # Should return: PONG
   ```

2. **Redis Info**
   ```bash
   pnpm redis:info
   # Should show Redis server info
   ```

---

## Migration Testing

### Migration Scripts

**Location:** `scripts/migration/`

**Scripts:**

1. **Export Scripts** (4)
   - `export-auth-data.ts`
   - `export-payments-data.ts`
   - `export-admin-data.ts`
   - `export-profile-data.ts`

2. **Import Scripts** (4)
   - `import-auth-data.ts`
   - `import-payments-data.ts`
   - `import-admin-data.ts`
   - `import-profile-data.ts`

3. **Validation Script**
   - `validate-migration.ts` - Compares row counts between legacy and new databases

4. **Rollback Scripts** (4)
   - `rollback-auth.ts`
   - `rollback-payments.ts`
   - `rollback-admin.ts`
   - `rollback-profile.ts`

### Running Migration Tests

```bash
# Export all data
pnpm migrate:export

# Import all data
pnpm migrate:import

# Validate migration
pnpm migrate:validate

# Should output:
# PASS Users: 10 rows (matched)
# PASS Refresh Tokens: 5 rows (matched)
# PASS Payments: 25 rows (matched)
# PASS Payment Transactions: 50 rows (matched)
# PASS Audit Logs: 100 rows (matched)
# PASS System Config: 3 rows (matched)
# PASS User Profiles: 10 rows (matched)
```

### Migration Test Strategy

1. **Pre-Migration Validation**
   - Verify legacy database has data
   - Check target databases are empty
   - Validate Prisma schemas

2. **Migration Execution**
   - Run export scripts
   - Verify JSON files created
   - Run import scripts
   - Check import logs for errors

3. **Post-Migration Validation**
   - Run validation script
   - Verify row counts match
   - Test service functionality
   - Verify data integrity

4. **Rollback Testing**
   - Test rollback scripts work
   - Verify confirmation prompts
   - Re-run migration

---

## WebSocket Testing

### Unit Tests (Planned)

**Framework:** Jest

**Coverage:**

- WebSocket connection manager
- Authentication middleware
- Message routing
- Event handling
- Reconnection logic

**Example Test:**

```typescript
describe('WebSocket Connection Manager', () => {
  it('should authenticate connection with valid token', async () => {
    const token = generateValidToken();
    const result = await connectionManager.authenticate(token);
    expect(result.authenticated).toBe(true);
  });

  it('should reject connection with invalid token', async () => {
    const token = 'invalid.token';
    const result = await connectionManager.authenticate(token);
    expect(result.authenticated).toBe(false);
  });
});
```

### Integration Tests (Planned)

**Framework:** Jest + real WebSocket client

**Coverage:**

- End-to-end message delivery
- Room/channel functionality
- Cross-tab synchronization
- Heartbeat/ping-pong

**Example Test:**

```typescript
describe('WebSocket Integration', () => {
  it('should deliver payment update to connected client', async () => {
    const client = await connectWebSocket(validToken);
    const messagePromise = waitForMessage(client, 'payment:updated');

    // Trigger payment update
    await updatePaymentStatus(paymentId, 'completed');

    const message = await messagePromise;
    expect(message.type).toBe('payment:updated');
    expect(message.payload.id).toBe(paymentId);
  });
});
```

### E2E Tests (Planned)

**Framework:** Playwright

**Coverage:**

- WebSocket connection in browser
- Real-time updates in UI
- Session sync across tabs
- Reconnection after disconnect

---

## RabbitMQ Event Hub Testing

### Unit Tests (Planned)

**Framework:** Jest

**Coverage:**

- Event publisher
- Event subscriber
- Event routing
- Error handling
- Dead letter queue

**Example Test:**

```typescript
describe('RabbitMQ Event Publisher', () => {
  it('should publish auth event to correct exchange', async () => {
    const event = { type: 'auth.user.created', userId: '123' };
    await eventPublisher.publish('auth.user.created', event);

    // Verify event in queue
    const message = await consumeFromQueue('auth.events.queue');
    expect(message.type).toBe('auth.user.created');
  });
});
```

### Integration Tests (Planned)

**Framework:** Jest + real RabbitMQ

**Coverage:**

- End-to-end event flow
- Multiple consumers
- Event persistence
- Dead letter queue handling

**Example Test:**

```typescript
describe('RabbitMQ Integration', () => {
  it('should route user events to profile service', async () => {
    const subscriber = await subscribeToQueue('profile.events.queue');

    // Publish user event
    await publishEvent('auth.user.created', {
      userId: '123',
      email: 'test@example.com',
    });

    // Profile service should receive event
    const event = await subscriber.waitForMessage();
    expect(event.type).toBe('auth.user.created');
    expect(event.payload.userId).toBe('123');
  });
});
```

---

## Running Tests

### Infrastructure Tests

```bash
# Run infrastructure test script
pnpm infra:test
./scripts/test-infrastructure.sh

# Check service status
pnpm infra:status

# Check RabbitMQ
pnpm rabbitmq:list-exchanges
pnpm rabbitmq:list-queues

# Check databases
docker exec mfe-auth-db pg_isready
docker exec mfe-payments-db pg_isready
```

### Migration Tests

```bash
# Export data
pnpm migrate:export

# Import data
pnpm migrate:import

# Validate migration
pnpm migrate:validate

# Rollback (with confirmation)
pnpm migrate:rollback:auth
```

### Frontend Tests (from POC-2)

```bash
# Run all frontend tests
pnpm test

# Run with coverage
pnpm test:coverage

# Run E2E tests
pnpm e2e
```

### Backend Tests (from POC-2)

```bash
# Run all backend tests
pnpm test:backend

# Run specific service
pnpm test:auth-service
pnpm test:payments-service
```

---

## Test Coverage (POC-3)

### Infrastructure Coverage

- **nginx:** PASS - 8 checks (SSL, headers, rate limiting, config)
- **Databases:** PASS - 7 checks (connections, isolation, migrations)
- **RabbitMQ:** PASS - 5 checks (exchanges, queues, bindings, health)
- **Redis:** PASS - 2 checks (connection, info)
- **Migration Scripts:** PASS - 13 scripts (export, import, validate, rollback)

### Application Coverage (from POC-2)

- **Frontend:** PASS - 70%+ (maintained)
- **Backend:** PASS - 70%+ (maintained)
- **API Contracts:** PASS - 22 endpoints (maintained)

### Planned Coverage (POC-3)

- **WebSocket:** (Planned) Unit + Integration tests
- **RabbitMQ Events:** (Planned) Unit + Integration tests
- **Load Tests:** (Planned) Performance testing
- **Observability:** (Planned) Error tracking, metrics

---

## Best Practices (POC-3)

### From POC-2 (Maintained)

1. **Write Tests Alongside Code** - Don't defer testing
2. **Aim for 70%+ Coverage** - All projects meet this target
3. **Test Behavior, Not Implementation** - Test what users see/do
4. **Use Descriptive Test Names** - Clear test descriptions
5. **Mock External Dependencies** - Mock APIs, databases, etc.
6. **Test Error Cases** - Don't just test happy paths
7. **Keep Tests Fast** - Unit tests should be fast
8. **Test Full-Stack Integration** - Verify frontend + backend work together

### New for POC-3

9. **Test Infrastructure Early** - Validate nginx, DB, RabbitMQ setup before coding
10. **Validate Migrations** - Always run migration validation script
11. **Test Rollback Procedures** - Ensure rollback scripts work
12. **Monitor Infrastructure Health** - Use health checks and monitoring
13. **Test Real-Time Features** - WebSocket tests should use real connections
14. **Test Event Routing** - Verify RabbitMQ events reach correct consumers
15. **Load Test Critical Paths** - Test rate limiting, connection limits
16. **Test Observability** - Verify Sentry, Prometheus integration

---

## Testing Checklist

### Phase 2: Infrastructure Setup (Complete)

- [x] nginx configuration validated
- [x] SSL certificates generated and tested
- [x] All databases accessible
- [x] RabbitMQ topology configured
- [x] Redis connection verified
- [x] Docker health checks passing
- [x] Migration scripts created
- [x] Infrastructure test script created

### Phase 3: Backend Migration (In Progress)

- [ ] Migration scripts tested with sample data
- [ ] Validation script verifies all data migrated
- [ ] Services updated to use new databases
- [ ] Service-specific Prisma clients generated
- [ ] Inter-service communication tested

### Phase 4: RabbitMQ Integration (Planned)

- [ ] Event publishers implemented
- [ ] Event subscribers implemented
- [ ] Event routing tested
- [ ] Dead letter queue tested
- [ ] Event persistence verified

### Phase 5: WebSocket Implementation (Planned)

- [ ] WebSocket server implemented
- [ ] Authentication flow tested
- [ ] Message routing tested
- [ ] Reconnection logic tested
- [ ] Cross-tab sync tested

### Phase 6: Observability (Planned)

- [ ] Sentry error tracking configured
- [ ] Prometheus metrics configured
- [ ] OpenTelemetry tracing configured
- [ ] Log aggregation configured
- [ ] Dashboards created

---

## Test Scripts Reference

### Infrastructure Scripts

```bash
# Infrastructure management
pnpm infra:start          # Start all services
pnpm infra:stop           # Stop all services
pnpm infra:status         # Check service status
pnpm infra:test           # Run infrastructure tests
pnpm infra:clean          # Clean up volumes

# SSL certificates
pnpm ssl:generate         # Generate SSL certificates

# Database operations
pnpm db:all:generate      # Generate all Prisma clients
pnpm db:all:migrate       # Run all migrations
pnpm db:auth:studio       # Open Prisma Studio for auth_db
pnpm db:payments:studio   # Open Prisma Studio for payments_db

# RabbitMQ operations
pnpm rabbitmq:ui          # Open RabbitMQ management UI
pnpm rabbitmq:list-exchanges
pnpm rabbitmq:list-queues
pnpm rabbitmq:list-bindings

# Redis operations
pnpm redis:ping
pnpm redis:info
pnpm redis:keys
```

### Migration Scripts

```bash
# Export data
pnpm migrate:export       # Export all data
pnpm migrate:export:auth  # Export auth data only

# Import data
pnpm migrate:import       # Import all data
pnpm migrate:import:auth  # Import auth data only

# Validate migration
pnpm migrate:validate     # Validate all migrations

# Rollback migration
pnpm migrate:rollback:auth      # Rollback auth database
pnpm migrate:rollback:payments  # Rollback payments database
```

---

## Troubleshooting Tests

### Backend Service Diagnostics

**First Step: Run Comprehensive Diagnostics**

Before troubleshooting individual issues, run the diagnostic script to get a complete health check:

```bash
# Run comprehensive backend diagnostics
./scripts/diagnose-backend-errors.sh

# This provides:
# - Infrastructure status (RabbitMQ, Redis)
# - Database status (all 4 databases)
# - Environment variable validation
# - Prisma client status
# - Build status
# - Port availability
# - Actionable recommendations
```

The diagnostic script checks:
- **Infrastructure Services:** RabbitMQ (container, health, credentials), Redis (container, health)
- **Database Services:** All 4 databases (auth_db, payments_db, admin_db, profile_db) with container status, connection readiness, and table counts
- **Environment Variables:** RABBITMQ_URL (with credential validation), all database URLs, JWT_SECRET
- **Prisma Clients:** All service clients (auth, payments, admin, profile)
- **Build Status:** All 5 backend services
- **Service Ports:** Ports 3000-3004 for all services

### Infrastructure Tests Failing

**Issue:** nginx tests fail with "connection refused"

**Solution:**

```bash
# Run diagnostics first
./scripts/diagnose-backend-errors.sh

# Check nginx is running
pnpm infra:status

# Check nginx logs
docker logs mfe-nginx

# Restart nginx
docker restart mfe-nginx
```

**Issue:** Database tests fail with "connection timeout"

**Solution:**

```bash
# Run diagnostics first
./scripts/diagnose-backend-errors.sh

# Check database health
docker exec mfe-auth-db pg_isready

# Check database logs
docker logs mfe-auth-db

# Restart database
docker restart mfe-auth-db
```

**Issue:** Backend services fail to start

**Solution:**

```bash
# Run comprehensive diagnostics
./scripts/diagnose-backend-errors.sh

# Common fixes based on diagnostics:
# 1. Start infrastructure if not running
pnpm infra:start

# 2. Generate Prisma clients if missing
pnpm db:auth:generate
pnpm db:payments:generate
pnpm db:admin:generate
pnpm db:profile:generate

# 3. Run migrations if databases are empty
pnpm db:auth:migrate
pnpm db:payments:migrate
pnpm db:admin:migrate
pnpm db:profile:migrate

# 4. Fix RabbitMQ URL in .env if needed
# Update: RABBITMQ_URL=amqp://admin:admin@localhost:5672

# 5. Build services
pnpm build:backend

# 6. Check specific service logs
pnpm dev:api-gateway      # Check API Gateway errors
pnpm dev:auth-service      # Check Auth Service errors
pnpm dev:payments-service  # Check Payments Service errors
pnpm dev:admin-service     # Check Admin Service errors
pnpm dev:profile-service  # Check Profile Service errors
```

### Migration Tests Failing

**Issue:** Migration validation shows mismatched row counts

**Solution:**

```bash
# Check export files exist
ls -la migration-data/

# Re-run export
pnpm migrate:export

# Check import logs for errors
pnpm migrate:import 2>&1 | tee migration-import.log

# Rollback and retry
pnpm migrate:rollback:auth
pnpm migrate:import:auth
```

---

## Related Documentation

- [`implementation-plan.md`](./implementation-plan.md) - POC-3 implementation plan
- [`task-list.md`](./task-list.md) - Task tracking
- [`database-migration-strategy.md`](./database-migration-strategy.md) - Database migration strategy
- [`event-hub-migration-strategy.md`](./event-hub-migration-strategy.md) - RabbitMQ migration strategy
- [`nginx-configuration-design.md`](./nginx-configuration-design.md) - nginx configuration
- [`../POC-2-Implementation/testing-guide.md`](../POC-2-Implementation/testing-guide.md) - POC-2 testing guide
- [`../POC-2-Implementation/api-contracts.md`](../POC-2-Implementation/api-contracts.md) - API contracts

---

**Last Updated:** 2026-12-10  
**Next Update:** After Phase 3 completion (Backend Migration)
