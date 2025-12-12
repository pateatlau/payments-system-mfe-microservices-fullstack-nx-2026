# Swagger API Documentation - POC-3

**Status:** Complete  
**Version:** 1.0  
**Date:** 2026-12-12  
**Purpose:** Interactive API documentation with Swagger UI

---

## Overview

POC-3 includes Swagger UI for interactive API documentation and testing. Swagger UI provides a visual interface to explore, understand, and test all API endpoints directly from the browser.

### Access URLs

| Environment | Swagger UI | OpenAPI JSON | OpenAPI YAML |
|-------------|------------|--------------|--------------|
| HTTP (direct) | http://localhost:3000/api-docs | http://localhost:3000/api-docs.json | http://localhost:3000/api-docs.yaml |
| HTTPS (nginx) | https://localhost/api-docs | https://localhost/api-docs.json | https://localhost/api-docs.yaml |

---

## Quick Start

### 1. Start the Backend Services

```bash
# Start infrastructure (databases, RabbitMQ, Redis, nginx)
pnpm infra:start

# Start all backend services
pnpm dev:backend
```

### 2. Open Swagger UI

```bash
# Open in browser (HTTP mode)
pnpm swagger:ui

# Or for HTTPS mode
pnpm swagger:ui:https

# Or navigate directly to:
# http://localhost:3000/api-docs
# https://localhost/api-docs
```

### 3. Authenticate (for protected endpoints)

1. Click the **"Authorize"** button (lock icon) in the top right
2. Enter your JWT token in the format: `<your-access-token>`
3. Click **"Authorize"** to save
4. The token will persist across page refreshes

**To get a token:**

1. Use the `POST /api/auth/login` endpoint in Swagger UI
2. Click "Try it out"
3. Enter credentials:
   ```json
   {
     "email": "admin@example.com",
     "password": "Admin123!@#"
   }
   ```
4. Click "Execute"
5. Copy the `accessToken` from the response
6. Use it in the Authorize dialog

---

## Features

### Interactive Testing

- **Try it out:** Test any endpoint directly from the browser
- **Request builder:** Automatically generates request bodies from schemas
- **Response viewer:** See formatted responses with status codes
- **Request duration:** Shows how long each request takes

### Documentation

- **Endpoint descriptions:** Clear descriptions of what each endpoint does
- **Request/response schemas:** Full documentation of data structures
- **Authentication requirements:** Shows which endpoints need auth
- **Role-based access:** Documents required roles (ADMIN, VENDOR, CUSTOMER)

### Developer Experience

- **Persistent authorization:** Token saved across page refreshes
- **Filtering:** Filter endpoints by tag or search
- **Expandable sections:** Collapse/expand endpoint groups
- **Dark mode support:** Follows system theme

---

## API Endpoints Overview

### Health Endpoints (No Auth)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/health` | Basic health check |
| GET | `/health/ready` | Readiness probe |
| GET | `/health/live` | Liveness probe |

### Auth Endpoints

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/auth/register` | No | Register new user |
| POST | `/api/auth/login` | No | User login |
| POST | `/api/auth/logout` | Yes | User logout |
| POST | `/api/auth/refresh` | No | Refresh access token |
| GET | `/api/auth/me` | Yes | Get current user |
| PUT | `/api/auth/password` | Yes | Change password |

### Payments Endpoints

| Method | Endpoint | Auth | Roles | Description |
|--------|----------|------|-------|-------------|
| GET | `/api/payments` | Yes | All | List payments |
| POST | `/api/payments` | Yes | All | Create payment |
| GET | `/api/payments/{id}` | Yes | All | Get payment by ID |
| PUT | `/api/payments/{id}` | Yes | VENDOR, ADMIN | Update payment |
| DELETE | `/api/payments/{id}` | Yes | VENDOR, ADMIN | Cancel payment |
| POST | `/api/payments/{id}/status` | Yes | VENDOR, ADMIN | Update status |

### Admin Endpoints (ADMIN only)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/admin/users` | List all users |
| POST | `/api/admin/users` | Create user |
| GET | `/api/admin/users/{id}` | Get user by ID |
| PUT | `/api/admin/users/{id}` | Update user |
| DELETE | `/api/admin/users/{id}` | Delete user |
| PUT | `/api/admin/users/{id}/role` | Update user role |
| GET | `/api/admin/health` | System health |

### Profile Endpoints

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/profile` | Yes | Get current profile |
| PUT | `/api/profile` | Yes | Update profile |
| GET | `/api/profile/preferences` | Yes | Get preferences |
| PUT | `/api/profile/preferences` | Yes | Update preferences |

---

## Testing Workflow

### 1. Public Endpoints (No Auth)

```bash
# Test health endpoint
GET /health
# Expected: 200 OK with status "healthy"

# Register a new user
POST /api/auth/register
{
  "email": "test@example.com",
  "password": "SecurePassword123!",
  "name": "Test User"
}
# Expected: 201 Created with user and tokens

# Login
POST /api/auth/login
{
  "email": "admin@example.com",
  "password": "Admin123!@#"
}
# Expected: 200 OK with user and tokens
```

### 2. Protected Endpoints (With Auth)

After logging in, copy the `accessToken` and authorize:

```bash
# Get current user
GET /api/auth/me
# Expected: 200 OK with user info

# List payments
GET /api/payments
# Expected: 200 OK with paginated payments

# Create payment
POST /api/payments
{
  "amount": 100.00,
  "currency": "USD",
  "description": "Test payment"
}
# Expected: 201 Created with payment
```

### 3. Admin Endpoints (ADMIN role)

Login as admin user first:

```bash
# List all users
GET /api/admin/users
# Expected: 200 OK with paginated users

# Get system health
GET /api/admin/health
# Expected: 200 OK with service status
```

---

## Rate Limiting

Swagger UI requests are subject to rate limiting:

| Endpoint Type | Limit | Window |
|---------------|-------|--------|
| General API | 100 requests | 15 minutes |
| Auth endpoints | 5 requests | 15 minutes |
| Admin endpoints | 50 requests | 15 minutes |

If you hit the rate limit, you'll see a `429 Too Many Requests` response.

---

## Troubleshooting

### Swagger UI Not Loading

1. Ensure API Gateway is running:
   ```bash
   pnpm dev:api-gateway
   ```

2. Check the console for errors:
   ```bash
   # API Gateway logs will show if Swagger initialized
   # Look for: "Swagger UI initialized"
   ```

### CORS Errors

If testing via HTTPS (nginx proxy), ensure:
1. nginx is running: `pnpm infra:status`
2. Frontend CORS is configured for `https://localhost`

### Authentication Errors

1. Ensure token is valid (not expired)
2. Check token format in Authorize dialog (no "Bearer " prefix needed)
3. Try logging in again to get a fresh token

### 502 Bad Gateway (HTTPS mode)

1. Ensure API Gateway is running on port 3000
2. Check nginx configuration is correct
3. Verify nginx can reach `host.docker.internal:3000`

---

## OpenAPI Specification

The full OpenAPI 3.0 specification is available at:

- **JSON:** `/api-docs.json`
- **YAML:** `/api-docs.yaml`

### Import to Postman

1. Open Postman
2. Click "Import"
3. Enter URL: `http://localhost:3000/api-docs.json`
4. Click "Import"
5. All endpoints will be imported with schemas

### Import to Insomnia

1. Open Insomnia
2. Click "Import/Export" -> "Import Data"
3. Choose "From URL"
4. Enter: `http://localhost:3000/api-docs.json`
5. Click "Fetch and Import"

### Generate TypeScript Types

```bash
# Install openapi-typescript
pnpm add -D openapi-typescript

# Generate types from spec
npx openapi-typescript http://localhost:3000/api-docs.json -o src/types/api.ts
```

---

## Files Reference

| File | Purpose |
|------|---------|
| `apps/api-gateway/src/swagger/index.ts` | Swagger setup and middleware |
| `apps/api-gateway/src/swagger/openapi-spec.ts` | OpenAPI specification |
| `apps/api-gateway/src/main.ts` | Integration point |

---

## Related Documentation

- [API Contracts](../POC-2-Implementation/api-contracts.md) - Detailed API contracts
- [GraphQL Implementation](./GRAPHQL_IMPLEMENTATION.md) - GraphQL API (alternative to REST)
- [Testing Guide](./testing-guide.md) - API testing instructions
- [SSL/TLS Setup](./ssl-tls-setup-guide.md) - HTTPS configuration

---

**Last Updated:** 2026-12-12  
**Status:** Complete

