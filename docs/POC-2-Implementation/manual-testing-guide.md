# Manual Testing Guide

> **Status:** POC-2 - Using Direct Service URLs  
> **Last Updated:** 2025-12-09 (Phase 4 - Direct Service URLs)

## ⚠️ IMPORTANT: POC-2 Configuration Change

**API Gateway Proxy Disabled for POC-2**

Due to technical challenges with `http-proxy-middleware` v3.x, the API Gateway proxy has been **temporarily disabled** for POC-2. Frontend applications now communicate **directly** with backend services.

**Current Service URLs (POC-2):**

- 🔑 **Auth Service:** `http://localhost:3001`
- 💳 **Payments Service:** `http://localhost:3002`
- 👥 **Admin Service:** `http://localhost:3003`
- 👤 **Profile Service:** `http://localhost:3004`

**What This Means:**

- Replace all `http://localhost:3000/api/*` URLs with direct service URLs
- Auth endpoints: `http://localhost:3001/auth/*` (not `/api/auth/*`)
- Payments endpoints: `http://localhost:3002/payments/*` (not `/api/payments/*`)
- Admin endpoints: `http://localhost:3003/admin/*` (not `/api/admin/*`)
- Profile endpoints: `http://localhost:3004/profile/*` (not `/api/profile/*`)

**POC-3:** API Gateway proxy will be re-implemented with a more robust solution. See `docs/POC-3-Planning/api-gateway-proxy-implementation.md` for details.

---

This guide provides step-by-step instructions for manually testing the implemented features. It will be updated incrementally as we progress through each phase.

---

## Table of Contents

- [Prerequisites](#prerequisites)
- [Initial Setup](#initial-setup)
- [Phase 2: Backend Foundation](#phase-2-backend-foundation)
  - [Infrastructure Setup](#infrastructure-setup)
  - [API Gateway Testing](#api-gateway-testing)
  - [Auth Service Testing](#auth-service-testing)
  - [Event Hub Testing](#event-hub-testing)
- [Phase 3: Backend Services](#phase-3-backend-services)
  - [Payments Service Testing](#payments-service-testing)
  - [Admin Service Testing](#admin-service-testing)
  - [Profile Service Testing](#profile-service-testing)
- [Additional Testing Scenarios](#additional-testing-scenarios)
  - [Complete User Workflow Testing](#complete-user-workflow-testing)
  - [Database Inspection](#database-inspection)
  - [Redis Inspection](#redis-inspection)
  - [Security Testing](#security-testing)
  - [Performance Testing](#performance-testing)
  - [Service Status Checking](#service-status-checking)
  - [Debugging Tips](#debugging-tips)
  - [Common Workflows](#common-workflows)
- [Quick Reference](#quick-reference)
- [Troubleshooting](#troubleshooting)

---

## Prerequisites

### Required Software

- **Node.js:** 24.11.x LTS
- **pnpm:** 9.x
- **Docker & Docker Compose:** Latest
- **PostgreSQL:** 16+ (via Docker)
- **Redis:** 7+ (via Docker)
- **curl:** For API testing (or use Postman/Insomnia)
- **jq:** Optional, for pretty JSON output (`brew install jq` on macOS)

### Environment Variables

Create a `.env` file in the project root (copy from `.env.example`):

```bash
# Database
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/payments_db?schema=public"

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379

# JWT Secrets (change in production!)
JWT_SECRET=your-secret-key-change-in-production
JWT_REFRESH_SECRET=your-refresh-secret-change-in-production

# Service Ports
API_GATEWAY_PORT=3000
AUTH_SERVICE_PORT=3001

# CORS Origins
CORS_ORIGINS=http://localhost:4200,http://localhost:4201,http://localhost:4202,http://localhost:4203
```

---

## Initial Setup

### 1. Install Dependencies

```bash
pnpm install
```

### 2. Start Infrastructure (PostgreSQL & Redis)

```bash
# Start Docker containers
pnpm docker:up

# Verify containers are running
pnpm docker:ps

# View logs (optional)
pnpm docker:logs
```

**Expected Output:**

```
✅ Infrastructure started (PostgreSQL, Redis)
```

**Verify:**

- PostgreSQL should be accessible on `localhost:5432`
- Redis should be accessible on `localhost:6379`

### 3. Setup Database

```bash
# Generate Prisma client
pnpm db:generate

# Run migrations
pnpm db:migrate

# Seed database with test data
pnpm db:seed
```

**Expected Output:**

```
✅ Prisma client generated
✅ Migrations applied
✅ Database seeded with test users
```

**Test Users Created:**

- **Admin:** `admin@example.com` / `Admin123!@#Password`
- **Customer:** `customer@example.com` / `Customer123!@#Password`
- **Vendor:** `vendor@example.com` / `Vendor123!@#Password`

### 4. Build Backend Services

```bash
# Build all backend services
pnpm build:backend

# Or build individually
pnpm build:api-gateway
pnpm build:auth-service
```

---

## Phase 2: Backend Foundation

### Infrastructure Setup

#### Start Infrastructure

```bash
pnpm infra:start
```

**Verify Services:**

```bash
# Check PostgreSQL
docker exec -it payments-db psql -U postgres -d payments_db -c "SELECT version();"

# Check Redis
docker exec -it payments-redis redis-cli ping
# Should return: PONG
```

#### Stop Infrastructure

```bash
pnpm infra:stop
```

---

### API Gateway Testing

#### Start API Gateway

```bash
# Terminal 1: Start API Gateway
pnpm dev:api-gateway
```

**Expected Output:**

```
API Gateway started on port 3000
```

#### Test Health Check Endpoints

```bash
# Basic health check
pnpm test:api:health

# Or manually:
curl http://localhost:3000/health

# Expected Response:
{
  "success": true,
  "data": {
    "status": "healthy",
    "timestamp": "2026-01-XX...",
    "service": "api-gateway",
    "uptime": 123.45
  }
}
```

**Test All Health Endpoints:**

```bash
# Health check
curl http://localhost:3000/health | jq .

# Readiness check
curl http://localhost:3000/health/ready | jq .

# Liveness check
curl http://localhost:3000/health/live | jq .
```

#### Test CORS

```bash
# Test CORS headers
curl -H "Origin: http://localhost:4200" \
     -H "Access-Control-Request-Method: POST" \
     -H "Access-Control-Request-Headers: Content-Type" \
     -X OPTIONS \
     http://localhost:3001/auth/login \
     -v

# Should include CORS headers in response
```

#### Test Rate Limiting

```bash
# Make multiple requests quickly (should hit rate limit after 100 requests in 15 minutes)
for i in {1..105}; do
  curl -s http://localhost:3000/health > /dev/null
  echo "Request $i"
done

# After 100 requests, should get:
# {
#   "success": false,
#   "error": {
#     "code": "RATE_LIMIT_EXCEEDED",
#     "message": "Too many requests, please try again later"
#   }
# }
```

#### Test 404 Handler

```bash
curl http://localhost:3000/nonexistent

# Expected Response:
{
  "success": false,
  "error": {
    "code": "NOT_FOUND",
    "message": "Route GET /nonexistent not found"
  }
}
```

---

### Auth Service Testing

#### Start Auth Service

```bash
# Terminal 2: Start Auth Service
pnpm dev:auth-service
```

**Expected Output:**

```
Auth Service started on port 3001
```

#### Test Auth Service Health

```bash
pnpm test:api:auth:health

# Or manually:
curl http://localhost:3001/health | jq .

# Expected Response:
{
  "success": true,
  "data": {
    "status": "healthy",
    "timestamp": "2026-01-XX...",
    "service": "auth-service",
    "uptime": 123.45,
    "database": "connected"
  }
}
```

#### Test User Registration

```bash
# Register a new user
pnpm test:api:register

# Or manually:
curl -X POST http://localhost:3001/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "newuser@example.com",
    "password": "NewUser123!@#Password",
    "name": "New User",
    "role": "CUSTOMER"
  }' | jq .

# Expected Response:
{
  "success": true,
  "data": {
    "user": {
      "id": "uuid",
      "email": "newuser@example.com",
      "name": "New User",
      "role": "CUSTOMER",
      "createdAt": "2026-01-XX...",
      "updatedAt": "2026-01-XX..."
    },
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "expiresIn": "15m"
  }
}
```

**Test Registration Validation:**

```bash
# Test invalid email
curl -X POST http://localhost:3001/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "invalid-email",
    "password": "Test123!@#Password",
    "name": "Test User"
  }' | jq .

# Expected: 400 with validation error

# Test weak password
curl -X POST http://localhost:3001/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "weak",
    "name": "Test User"
  }' | jq .

# Expected: 400 with password validation error

# Test duplicate email
curl -X POST http://localhost:3001/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@example.com",
    "password": "Test123!@#Password",
    "name": "Test User"
  }' | jq .

# Expected: 409 with EMAIL_EXISTS error
```

#### Test User Login

```bash
# Login with seeded user
pnpm test:api:login

# Or manually:
curl -X POST http://localhost:3001/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "customer@example.com",
    "password": "Customer123!@#Password"
  }' | jq .

# Expected Response:
{
  "success": true,
  "data": {
    "user": {
      "id": "uuid",
      "email": "customer@example.com",
      "name": "Customer User",
      "role": "CUSTOMER",
      ...
    },
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "expiresIn": "15m"
  }
}
```

**Save Token for Next Tests:**

```bash
# Save access token to variable (bash/zsh)
export ACCESS_TOKEN="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."

# Save refresh token
export REFRESH_TOKEN="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

**Test Invalid Credentials:**

```bash
# Wrong password
curl -X POST http://localhost:3001/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "customer@example.com",
    "password": "WrongPassword123!"
  }' | jq .

# Expected: 401 with INVALID_CREDENTIALS

# Non-existent user
curl -X POST http://localhost:3001/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "nonexistent@example.com",
    "password": "Password123!@#"
  }' | jq .

# Expected: 401 with INVALID_CREDENTIALS
```

#### Test Token Refresh

```bash
# Refresh access token
curl -X POST http://localhost:3001/auth/refresh \
  -H "Content-Type: application/json" \
  -d "{
    \"refreshToken\": \"$REFRESH_TOKEN\"
  }" | jq .

# Expected Response:
{
  "success": true,
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "expiresIn": "15m"
  }
}
```

**Test Invalid Refresh Token:**

```bash
curl -X POST http://localhost:3001/auth/refresh \
  -H "Content-Type: application/json" \
  -d '{
    "refreshToken": "invalid-token"
  }' | jq .

# Expected: 401 with INVALID_TOKEN
```

#### Test Get Current User (Protected Route)

```bash
# Get current user (requires authentication)
curl http://localhost:3001/auth/me \
  -H "Authorization: Bearer $ACCESS_TOKEN" | jq .

# Expected Response:
{
  "success": true,
  "data": {
    "id": "uuid",
    "email": "customer@example.com",
    "name": "Customer User",
    "role": "CUSTOMER",
    ...
  }
}
```

**Test Without Token:**

```bash
curl http://localhost:3001/auth/me | jq .

# Expected: 401 with UNAUTHORIZED
```

**Test With Expired Token:**

```bash
# Use an expired token (wait 15+ minutes or use an old token)
curl http://localhost:3001/auth/me \
  -H "Authorization: Bearer expired-token" | jq .

# Expected: 401 with TOKEN_EXPIRED or TOKEN_INVALID
```

#### Test Logout

```bash
# Logout (invalidates refresh token)
curl -X POST http://localhost:3001/auth/logout \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d "{
    \"refreshToken\": \"$REFRESH_TOKEN\"
  }" | jq .

# Expected Response:
{
  "success": true,
  "data": {
    "message": "Logged out successfully"
  }
}

# Try to refresh after logout
curl -X POST http://localhost:3001/auth/refresh \
  -H "Content-Type: application/json" \
  -d "{
    \"refreshToken\": \"$REFRESH_TOKEN\"
  }" | jq .

# Expected: 401 with INVALID_TOKEN (token was deleted)
```

#### Test Change Password

```bash
# Change password (requires authentication)
curl -X POST http://localhost:3001/auth/password \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "currentPassword": "Customer123!@#Password",
    "newPassword": "NewPassword123!@#"
  }' | jq .

# Expected Response:
{
  "success": true,
  "data": {
    "message": "Password changed successfully"
  }
}

# Try to login with old password (should fail)
curl -X POST http://localhost:3001/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "customer@example.com",
    "password": "Customer123!@#Password"
  }' | jq .

# Expected: 401 with INVALID_CREDENTIALS

# Login with new password (should succeed)
curl -X POST http://localhost:3001/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "customer@example.com",
    "password": "NewPassword123!@#"
  }' | jq .

# Expected: 200 with tokens
```

#### Test RBAC (Role-Based Access Control)

```bash
# Login as ADMIN
ADMIN_RESPONSE=$(curl -s -X POST http://localhost:3001/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@example.com",
    "password": "Admin123!@#Password"
  }')

ADMIN_TOKEN=$(echo $ADMIN_RESPONSE | jq -r '.data.accessToken')

# Login as CUSTOMER
CUSTOMER_RESPONSE=$(curl -s -X POST http://localhost:3001/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "customer@example.com",
    "password": "Customer123!@#Password"
  }')

CUSTOMER_TOKEN=$(echo $CUSTOMER_RESPONSE | jq -r '.data.accessToken')

# Try to access admin route with customer token (should fail)
curl http://localhost:3003/admin/users \
  -H "Authorization: Bearer $CUSTOMER_TOKEN" | jq .

# Expected: 403 with FORBIDDEN

# Access admin route with admin token (should succeed - once admin routes are implemented)
curl http://localhost:3003/admin/users \
  -H "Authorization: Bearer $ADMIN_TOKEN" | jq .

# Expected: 200 (when admin service is implemented)
```

---

### Event Hub Testing

> **Note:** Event Hub is currently a library. Full testing will be available when services start publishing/subscribing to events.

#### Test Redis Connection

```bash
# Check Redis is running
docker exec -it payments-redis redis-cli ping

# Should return: PONG

# Test Redis Pub/Sub manually
docker exec -it payments-redis redis-cli

# In Redis CLI:
SUBSCRIBE test:event
# (Leave this running in one terminal)

# In another terminal:
docker exec -it payments-redis redis-cli PUBLISH test:event "Hello World"

# Should see message in subscriber terminal
```

---

## Troubleshooting

### Services Won't Start

**Check if ports are in use:**

```bash
# Check port 3000 (API Gateway)
lsof -i :3000

# Check port 3001 (Auth Service)
lsof -i :3001

# Kill processes if needed
pnpm backend:kill
```

### Database Connection Issues

**Check PostgreSQL is running:**

```bash
docker ps | grep postgres
```

**Check connection:**

```bash
docker exec -it payments-db psql -U postgres -d payments_db -c "SELECT 1;"
```

**Reset database:**

```bash
pnpm db:reset
pnpm db:seed
```

### Redis Connection Issues

**Check Redis is running:**

```bash
docker ps | grep redis
```

**Test Redis connection:**

```bash
docker exec -it payments-redis redis-cli ping
```

### JWT Token Issues

**Decode JWT token (for debugging):**

```bash
# Install jwt-cli if needed: npm install -g @tsndr/cloudflare-worker-jwt
# Or use online tool: https://jwt.io

# Check token expiry
echo $ACCESS_TOKEN | cut -d. -f2 | base64 -d | jq .
```

### CORS Issues

**Check CORS headers:**

```bash
curl -H "Origin: http://localhost:4200" \
     -X OPTIONS \
     http://localhost:3001/auth/login \
     -v
```

---

## Quick Reference

### Essential Commands

#### Setup & Start

```bash
# Complete setup (infrastructure + database)
pnpm setup:complete

# Start infrastructure only
pnpm infra:start

# Start backend services
pnpm backend:dev

# Check everything is running
pnpm backend:status
```

#### Testing

```bash
# Run all health checks
pnpm test:api:all

# Test complete workflow
pnpm test:workflow:register-login

# Test security features
pnpm test:security:rate-limit
pnpm test:security:cors
```

#### Database

```bash
# View users
pnpm db:users

# View tokens
pnpm db:tokens

# View statistics
pnpm db:count

# Open Prisma Studio (GUI)
pnpm db:studio
```

#### Redis

```bash
# Check Redis info
pnpm redis:info

# View all keys
pnpm redis:keys

# Monitor commands
pnpm redis:monitor

# Flush cache
pnpm redis:flush
```

#### Cleanup & Restart

```bash
# Stop everything
pnpm clean:backend

# Restart infrastructure
pnpm restart:backend

# Kill all backend services
pnpm backend:kill
```

### API Endpoints Quick Reference

#### Public Endpoints

- `GET /health` - API Gateway health check
- `GET /health/ready` - Readiness check
- `GET /health/live` - Liveness check
- `POST /api/auth/register` - Register user
- `POST /api/auth/login` - Login user
- `POST /api/auth/refresh` - Refresh token

#### Protected Endpoints (Require JWT)

**Auth Service:**

- `GET /api/auth/me` - Get current user
- `POST /api/auth/logout` - Logout user
- `POST /api/auth/password` - Change password

**Payments Service (Port 3002):**

- `GET /api/payments` - List payments (paginated, filtered)
- `GET /api/payments/:id` - Get payment by ID
- `POST /api/payments` - Create payment
- `PATCH /api/payments/:id/status` - Update payment status
- `POST /api/payments/webhook` - Webhook handler

**Admin Service (Port 3003) - ADMIN Only:**

- `GET /api/admin/users` - List users (paginated, filtered, sorted)
- `GET /api/admin/users/:id` - Get user by ID (with payment counts)
- `PUT /api/admin/users/:id` - Update user
- `PATCH /api/admin/users/:id/role` - Update user role
- `PATCH /api/admin/users/:id/status` - Update user status (placeholder)

**Profile Service (Port 3004):**

- `GET /api/profile` - Get user profile (auto-creates if not exists)
- `PUT /api/profile` - Update profile
- `GET /api/profile/preferences` - Get preferences
- `PUT /api/profile/preferences` - Update preferences

### Environment Variables

```bash
# Check environment setup (infrastructure + .env file)
pnpm env:check

# Validate required variables in .env file
pnpm env:validate
```

### Test Users (Seeded)

- **Admin:** `admin@example.com` / `Admin123!@#Password`
- **Customer:** `customer@example.com` / `Customer123!@#Password`
- **Vendor:** `vendor@example.com` / `Vendor123!@#Password`

### Port Reference

- **3000** - API Gateway
- **3001** - Auth Service
- **3002** - Payments Service (Phase 3)
- **3003** - Admin Service (Phase 3)
- **3004** - Profile Service (Phase 3)
- **5432** - PostgreSQL
- **6379** - Redis

---

## Phase 3: Backend Services

### Payments Service Testing

#### Start Payments Service

```bash
# Terminal: Start Payments Service
pnpm dev:payments-service

# Or start all backend services
pnpm dev:backend
```

**Expected Output:**

```
Payments Service started on port 3002
```

#### Test Payments Service Health

```bash
pnpm test:api:payments:health

# Or manually:
curl http://localhost:3002/health | jq .

# Expected Response:
{
  "status": "ok",
  "service": "payments-service",
  "timestamp": "2026-12-09T..."
}
```

#### Get Authentication Token

```bash
# First, get a token (use admin or customer user)
TOKEN=$(curl -s -X POST http://localhost:3001/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","password":"Admin123!@#"}' \
  | jq -r '.data.accessToken')

echo "Token: ${TOKEN:0:50}..."
```

#### List Payments

```bash
pnpm test:api:payments:list

# Or manually:
curl -X GET "http://localhost:3002/api/payments?page=1&limit=10" \
  -H "Authorization: Bearer $TOKEN" | jq .

# With filters:
curl -X GET "http://localhost:3002/api/payments?page=1&limit=10&status=PENDING&type=PAYMENT" \
  -H "Authorization: Bearer $TOKEN" | jq .
```

#### Create Payment

```bash
pnpm test:api:payments:create

# Or manually:
curl -X POST http://localhost:3002/api/payments \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "amount": "100.00",
    "currency": "USD",
    "type": "PAYMENT",
    "description": "Test payment",
    "recipientEmail": "customer@example.com"
  }' | jq .

# Expected Response:
{
  "success": true,
  "data": {
    "id": "uuid",
    "amount": "100.00",
    "currency": "USD",
    "status": "PENDING",
    "type": "PAYMENT",
    ...
  }
}
```

#### Get Payment by ID

```bash
# Extract payment ID from create response
PAYMENT_ID="<payment-id-from-create>"

curl -X GET "http://localhost:3002/api/payments/$PAYMENT_ID" \
  -H "Authorization: Bearer $TOKEN" | jq .
```

#### Update Payment Status

```bash
pnpm test:api:payments:update-status

# Or manually:
curl -X PATCH "http://localhost:3002/api/payments/$PAYMENT_ID/status" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "status": "COMPLETED"
  }' | jq .
```

#### Test Payment Validation

```bash
# Test invalid amount
curl -X POST http://localhost:3002/api/payments \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "amount": "-100.00",
    "currency": "USD",
    "type": "PAYMENT"
  }' | jq .

# Should return validation error
```

---

### Admin Service Testing

#### Start Admin Service

```bash
# Terminal: Start Admin Service
pnpm dev:admin-service
```

**Expected Output:**

```
Admin Service started on port 3003
```

#### Test Admin Service Health

```bash
pnpm test:api:admin:health

# Or manually:
curl http://localhost:3003/health | jq .
```

#### Get Admin Token

```bash
# Admin token required for all Admin Service endpoints
ADMIN_TOKEN=$(curl -s -X POST http://localhost:3001/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","password":"Admin123!@#"}' \
  | jq -r '.data.accessToken')
```

#### List Users

```bash
pnpm test:api:admin:list-users

# Or manually:
curl -X GET "http://localhost:3003/api/admin/users?page=1&limit=10" \
  -H "Authorization: Bearer $ADMIN_TOKEN" | jq .

# With filters:
curl -X GET "http://localhost:3003/api/admin/users?page=1&limit=10&role=CUSTOMER&search=test" \
  -H "Authorization: Bearer $ADMIN_TOKEN" | jq .

# With sorting:
curl -X GET "http://localhost:3003/api/admin/users?page=1&limit=10&sort=createdAt&order=desc" \
  -H "Authorization: Bearer $ADMIN_TOKEN" | jq .
```

#### Get User by ID

```bash
# Extract user ID from list response
USER_ID="<user-id-from-list>"

pnpm test:api:admin:get-user

# Or manually:
curl -X GET "http://localhost:3003/api/admin/users/$USER_ID" \
  -H "Authorization: Bearer $ADMIN_TOKEN" | jq .

# Expected Response includes payment counts:
{
  "success": true,
  "data": {
    "id": "uuid",
    "email": "user@example.com",
    "name": "User Name",
    "role": "CUSTOMER",
    "_count": {
      "sentPayments": 5,
      "receivedPayments": 3
    }
  }
}
```

#### Update User

```bash
pnpm test:api:admin:update-user

# Or manually:
curl -X PUT "http://localhost:3003/api/admin/users/$USER_ID" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Updated Name",
    "email": "updated@example.com"
  }' | jq .
```

#### Update User Role

```bash
pnpm test:api:admin:update-role

# Or manually:
curl -X PATCH "http://localhost:3003/api/admin/users/$USER_ID/role" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "role": "VENDOR"
  }' | jq .
```

#### Test ADMIN-Only Access

```bash
# Try with customer token (should fail)
CUSTOMER_TOKEN=$(curl -s -X POST http://localhost:3001/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"customer@example.com","password":"Customer123!@#"}' \
  | jq -r '.data.accessToken')

curl -X GET "http://localhost:3003/api/admin/users" \
  -H "Authorization: Bearer $CUSTOMER_TOKEN" | jq .

# Expected: 403 Forbidden
```

---

### Profile Service Testing

#### Start Profile Service

```bash
# Terminal: Start Profile Service
pnpm dev:profile-service
```

**Expected Output:**

```
Profile Service started on port 3004
```

#### Test Profile Service Health

```bash
pnpm test:api:profile:health

# Or manually:
curl http://localhost:3004/health | jq .
```

#### Get Profile (Auto-Creates if Not Exists)

```bash
# Use any authenticated token
TOKEN=$(curl -s -X POST http://localhost:3001/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","password":"Admin123!@#"}' \
  | jq -r '.data.accessToken')

pnpm test:api:profile:get

# Or manually:
curl -X GET http://localhost:3004/api/profile \
  -H "Authorization: Bearer $TOKEN" | jq .

# Expected Response (auto-creates profile if not exists):
{
  "success": true,
  "data": {
    "id": "uuid",
    "userId": "uuid",
    "phone": null,
    "address": null,
    "bio": null,
    "avatarUrl": null,
    "preferences": null,
    "user": {
      "id": "uuid",
      "email": "admin@example.com",
      "name": "Admin User",
      "role": "ADMIN"
    }
  }
}
```

#### Update Profile

```bash
pnpm test:api:profile:update

# Or manually:
curl -X PUT http://localhost:3004/api/profile \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "phoneNumber": "+1234567890",
    "address": "123 Main St",
    "bio": "Test bio",
    "avatarUrl": "https://example.com/avatar.jpg"
  }' | jq .
```

#### Get Preferences

```bash
pnpm test:api:profile:get-preferences

# Or manually:
curl -X GET http://localhost:3004/api/profile/preferences \
  -H "Authorization: Bearer $TOKEN" | jq .

# Expected Response (empty initially):
{
  "success": true,
  "data": {}
}
```

#### Update Preferences

```bash
pnpm test:api:profile:update-preferences

# Or manually:
curl -X PUT http://localhost:3004/api/profile/preferences \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "theme": "dark",
    "language": "en-US",
    "currency": "USD",
    "notifications": {
      "email": true,
      "push": false,
      "sms": true
    },
    "timezone": "America/New_York"
  }' | jq .

# Verify update:
curl -X GET http://localhost:3004/api/profile/preferences \
  -H "Authorization: Bearer $TOKEN" | jq .
```

---

## Quick Test Checklist

### Phase 2 Complete ✅

- [ ] Infrastructure started (PostgreSQL, Redis)
- [ ] Database migrated and seeded
- [ ] API Gateway health check works
- [ ] Auth Service health check works
- [ ] User registration works
- [ ] User login works
- [ ] Token refresh works
- [ ] Get current user works (protected route)
- [ ] Logout works
- [ ] Change password works
- [ ] RBAC works (admin vs customer access)
- [ ] Rate limiting works
- [ ] CORS works
- [ ] Error handling works (404, 401, 403, 400)

### Phase 3 Complete ✅

- [ ] Payments Service health check works
- [ ] List payments works (with pagination)
- [ ] Create payment works
- [ ] Get payment by ID works
- [ ] Update payment status works
- [ ] Payment validation works
- [ ] Admin Service health check works
- [ ] List users works (with pagination, filtering, sorting)
- [ ] Get user by ID works (with payment counts)
- [ ] Update user works
- [ ] Update user role works
- [ ] ADMIN-only access enforced
- [ ] Profile Service health check works
- [ ] Get profile works (auto-creates if not exists)
- [ ] Update profile works
- [ ] Get preferences works
- [ ] Update preferences works
- [ ] All services running and accessible

- [ ] Infrastructure started (PostgreSQL, Redis)
- [ ] Database migrated and seeded
- [ ] API Gateway health check works
- [ ] Auth Service health check works
- [ ] User registration works
- [ ] User login works
- [ ] Token refresh works
- [ ] Get current user works (protected route)
- [ ] Logout works
- [ ] Change password works
- [ ] RBAC works (admin vs customer access)
- [ ] Rate limiting works
- [ ] CORS works
- [ ] Error handling works (404, 401, 403, 400)

---

## Additional Testing Scenarios

### Complete User Workflow Testing

#### Full Registration → Login → Profile → Logout Flow

```bash
# 1. Register a new user
REGISTER_RESPONSE=$(curl -s -X POST http://localhost:3001/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "workflow@example.com",
    "password": "Workflow123!@#Password",
    "name": "Workflow User"
  }')

echo "Registration Response:"
echo $REGISTER_RESPONSE | jq .

# Extract tokens
ACCESS_TOKEN=$(echo $REGISTER_RESPONSE | jq -r '.data.accessToken')
REFRESH_TOKEN=$(echo $REGISTER_RESPONSE | jq -r '.data.refreshToken')
USER_ID=$(echo $REGISTER_RESPONSE | jq -r '.data.user.id')

echo "Access Token: $ACCESS_TOKEN"
echo "User ID: $USER_ID"

# 2. Get current user (verify token works)
echo -e "\n2. Getting current user..."
curl -s http://localhost:3001/auth/me \
  -H "Authorization: Bearer $ACCESS_TOKEN" | jq .

# 3. Refresh token
echo -e "\n3. Refreshing token..."
REFRESH_RESPONSE=$(curl -s -X POST http://localhost:3001/auth/refresh \
  -H "Content-Type: application/json" \
  -d "{\"refreshToken\": \"$REFRESH_TOKEN\"}")

NEW_ACCESS_TOKEN=$(echo $REFRESH_RESPONSE | jq -r '.data.accessToken')
echo "New Access Token: $NEW_ACCESS_TOKEN"

# 4. Use new token to get user
echo -e "\n4. Using new token to get user..."
curl -s http://localhost:3001/auth/me \
  -H "Authorization: Bearer $NEW_ACCESS_TOKEN" | jq .

# 5. Change password
echo -e "\n5. Changing password..."
curl -s -X POST http://localhost:3001/auth/password \
  -H "Authorization: Bearer $NEW_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "currentPassword": "Workflow123!@#Password",
    "newPassword": "NewWorkflow123!@#"
  }' | jq .

# 6. Login with new password
echo -e "\n6. Logging in with new password..."
curl -s -X POST http://localhost:3001/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "workflow@example.com",
    "password": "NewWorkflow123!@#"
  }' | jq .

# 7. Logout
echo -e "\n7. Logging out..."
NEW_LOGIN_RESPONSE=$(curl -s -X POST http://localhost:3001/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "workflow@example.com",
    "password": "NewWorkflow123!@#"
  }')

FINAL_REFRESH_TOKEN=$(echo $NEW_LOGIN_RESPONSE | jq -r '.data.refreshToken')
FINAL_ACCESS_TOKEN=$(echo $NEW_LOGIN_RESPONSE | jq -r '.data.accessToken')

curl -s -X POST http://localhost:3001/auth/logout \
  -H "Authorization: Bearer $FINAL_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"refreshToken\": \"$FINAL_REFRESH_TOKEN\"}" | jq .

# 8. Verify token is invalidated
echo -e "\n8. Verifying token is invalidated..."
curl -s http://localhost:3001/auth/me \
  -H "Authorization: Bearer $FINAL_ACCESS_TOKEN" | jq .

echo -e "\n✅ Complete workflow test finished!"
```

### Database Inspection

#### View Users

```bash
# Quick command
pnpm db:users

# Or manually:
docker exec -it payments-db psql -U postgres -d payments_db -c \
  "SELECT id, email, name, role, \"createdAt\" FROM \"User\" ORDER BY \"createdAt\" DESC LIMIT 10;"
```

#### View Refresh Tokens

```bash
# Quick command
pnpm db:tokens

# Or manually:
docker exec -it payments-db psql -U postgres -d payments_db -c \
  "SELECT id, \"userId\", \"expiresAt\", \"createdAt\" FROM \"RefreshToken\" ORDER BY \"createdAt\" DESC LIMIT 10;"
```

#### Database Statistics

```bash
# Quick command
pnpm db:count

# Or manually:
docker exec -it payments-db psql -U postgres -d payments_db -c \
  "SELECT
    (SELECT COUNT(*) FROM \"User\") as users,
    (SELECT COUNT(*) FROM \"RefreshToken\") as tokens,
    (SELECT COUNT(*) FROM \"Payment\") as payments,
    (SELECT COUNT(*) FROM \"UserProfile\") as profiles;"
```

#### Advanced Database Queries

```bash
# Find users by role
docker exec -it payments-db psql -U postgres -d payments_db -c \
  "SELECT role, COUNT(*) as count FROM \"User\" GROUP BY role;"

# Find active refresh tokens (not expired)
docker exec -it payments-db psql -U postgres -d payments_db -c \
  "SELECT COUNT(*) as active_tokens FROM \"RefreshToken\" WHERE \"expiresAt\" > NOW();"

# Find expired refresh tokens
docker exec -it payments-db psql -U postgres -d payments_db -c \
  "SELECT COUNT(*) as expired_tokens FROM \"RefreshToken\" WHERE \"expiresAt\" <= NOW();"

# View user with their profile
docker exec -it payments-db psql -U postgres -d payments_db -c \
  "SELECT u.id, u.email, u.name, u.role, up.phone, up.address FROM \"User\" u LEFT JOIN \"UserProfile\" up ON u.id = up.\"userId\" LIMIT 5;"
```

### Redis Inspection

#### Redis Information

```bash
# Quick command
pnpm redis:info

# Or manually:
docker exec -it payments-redis redis-cli INFO
```

#### View All Keys

```bash
# Quick command
pnpm redis:keys

# Or manually:
docker exec -it payments-redis redis-cli KEYS '*'
```

#### Monitor Redis Commands (Real-time)

```bash
# Monitor all Redis commands in real-time
docker exec -it payments-redis redis-cli MONITOR
```

#### Test Pub/Sub Manually

```bash
# Terminal 1: Subscribe to a channel
docker exec -it payments-redis redis-cli SUBSCRIBE test:event

# Terminal 2: Publish a message
docker exec -it payments-redis redis-cli PUBLISH test:event "Hello from Redis!"

# Terminal 1 should receive the message
```

#### Flush Redis Cache

```bash
# Quick command
pnpm redis:flush

# Or manually:
docker exec -it payments-redis redis-cli FLUSHALL
```

### Security Testing

#### Test Rate Limiting

```bash
# Quick command (tests 105 requests)
pnpm test:security:rate-limit

# Or manually test auth rate limiting (5 requests per 15 min)
for i in {1..6}; do
  echo "Request $i:"
  curl -X POST http://localhost:3001/auth/login \
    -H "Content-Type: application/json" \
    -d '{"email":"test@example.com","password":"wrong"}' \
    -w "\nHTTP Status: %{http_code}\n\n"
  sleep 1
done

# After 5 requests, should get rate limit error
```

#### Test CORS

```bash
# Quick command
pnpm test:security:cors

# Or manually test CORS preflight
curl -H "Origin: http://localhost:4200" \
     -H "Access-Control-Request-Method: POST" \
     -H "Access-Control-Request-Headers: Content-Type,Authorization" \
     -X OPTIONS \
     http://localhost:3001/auth/login \
     -v

# Should see:
# < Access-Control-Allow-Origin: http://localhost:4200
# < Access-Control-Allow-Methods: GET, POST, PUT, PATCH, DELETE, OPTIONS
# < Access-Control-Allow-Headers: Content-Type, Authorization, X-Request-ID
```

#### Test Invalid JWT Tokens

```bash
# Test with malformed token
curl http://localhost:3001/auth/me \
  -H "Authorization: Bearer invalid.token.here" | jq .

# Expected: 401 with TOKEN_INVALID

# Test with missing Bearer prefix
curl http://localhost:3001/auth/me \
  -H "Authorization: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." | jq .

# Expected: 401 with UNAUTHORIZED

# Test with no Authorization header
curl http://localhost:3001/auth/me | jq .

# Expected: 401 with UNAUTHORIZED
```

#### Test SQL Injection Protection

```bash
# Test email field (should be sanitized by Prisma)
curl -X POST http://localhost:3001/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@example.com\"; DROP TABLE \"User\"; --",
    "password": "test"
  }' | jq .

# Should return validation error, not execute SQL
```

### Performance Testing

#### Load Test Health Endpoint

```bash
# Test 1000 requests
time for i in {1..1000}; do
  curl -s http://localhost:3000/health > /dev/null
done

# Check response time
curl -w "\nTime: %{time_total}s\n" -o /dev/null -s http://localhost:3000/health
```

#### Concurrent Request Testing

```bash
# Test 10 concurrent requests
for i in {1..10}; do
  (curl -s http://localhost:3000/health > /dev/null && echo "Request $i: OK") &
done
wait
echo "All requests completed"
```

### Service Status Checking

#### Check All Services

```bash
# Quick command
pnpm backend:status

# Or manually check each service:
echo "API Gateway:" && curl -s http://localhost:3000/health > /dev/null && echo "✅ Running" || echo "❌ Not running"
echo "Auth Service:" && curl -s http://localhost:3001/health > /dev/null && echo "✅ Running" || echo "❌ Not running"
```

#### Check Environment Setup

```bash
# Quick command
pnpm env:check

# Or manually:
echo "Checking environment..."
[ -f .env ] && echo "✅ .env file exists" || echo "❌ .env file missing"
docker ps | grep -q postgres && echo "✅ PostgreSQL running" || echo "❌ PostgreSQL not running"
docker ps | grep -q redis && echo "✅ Redis running" || echo "❌ Redis not running"
```

### Debugging Tips

#### View Service Logs

```bash
# API Gateway logs (if logging to file)
pnpm backend:logs:api-gateway

# Auth Service logs (if logging to file)
pnpm backend:logs:auth-service

# Docker logs
pnpm docker:logs

# Follow specific service logs
docker-compose logs -f api-gateway
docker-compose logs -f auth-service
```

#### Decode JWT Token

```bash
# Install jwt-cli if needed
npm install -g @tsndr/cloudflare-worker-jwt

# Decode token (replace with actual token)
echo "YOUR_TOKEN_HERE" | jwt decode

# Or use online tool: https://jwt.io
# Or decode manually:
echo "YOUR_TOKEN_HERE" | cut -d. -f2 | base64 -d | jq .
```

#### Test Database Connection Directly

```bash
# Test PostgreSQL connection
docker exec -it payments-db psql -U postgres -d payments_db -c "SELECT version();"

# Test Redis connection
docker exec -it payments-redis redis-cli PING

# Should return: PONG
```

#### Check Port Usage

```bash
# Check which process is using a port
lsof -i :3000  # API Gateway
lsof -i :3001  # Auth Service
lsof -i :5432  # PostgreSQL
lsof -i :6379  # Redis
```

### Common Workflows

#### Complete Setup from Scratch

```bash
# 1. Start infrastructure
pnpm infra:start

# 2. Setup database
pnpm backend:setup

# 3. Build services
pnpm build:api-gateway
pnpm build:auth-service

# 4. Start services (in separate terminals)
pnpm dev:api-gateway
pnpm dev:auth-service

# 5. Verify everything works
pnpm test:api:all
```

#### Reset Everything

```bash
# Quick command
pnpm clean:backend

# Or step by step:
# 1. Stop all services
pnpm backend:kill

# 2. Stop infrastructure
pnpm infra:stop

# 3. Remove Docker volumes (if needed)
docker-compose down -v

# 4. Restart
pnpm restart:backend
```

#### Quick Test Everything

```bash
# Run all health checks
pnpm test:api:all

# Test complete workflow
pnpm test:workflow:register-login

# Check service status
pnpm backend:status

# Check environment
pnpm env:check
```

## Next Steps

As we progress through Phase 3, this guide will be updated with:

- Payments Service testing
- Admin Service testing
- Profile Service testing
- End-to-end workflow testing
- Frontend integration testing
- Event Hub integration testing
- Performance benchmarking
- Load testing scenarios

---

**Last Updated:** Phase 3 Complete (2026-12-09)
