# POC-2: Direct Service URLs Configuration

> **Date:** 2025-12-09  
> **Status:** Active for POC-2  
> **Deferred:** API Gateway proxy to POC-3

---

## Overview

For POC-2, frontend applications communicate **directly** with backend microservices, bypassing the API Gateway proxy. This decision was made due to technical challenges with `http-proxy-middleware` v3.x that would have delayed POC-2 completion.

**Important:** The API Gateway itself is **fully functional** for health monitoring, CORS, security headers, rate limiting, and error handling. Only the proxy functionality is disabled. All other infrastructure works perfectly.

## Service URLs

### Backend Services (Direct Access)

| Service              | Port | Base URL                | Purpose                              |
| -------------------- | ---- | ----------------------- | ------------------------------------ |
| **Auth Service**     | 3001 | `http://localhost:3001` | Authentication, JWT, user management |
| **Payments Service** | 3002 | `http://localhost:3002` | Payment creation, history            |
| **Admin Service**    | 3003 | `http://localhost:3003` | Admin operations, user management    |
| **Profile Service**  | 3004 | `http://localhost:3004` | User profiles, preferences           |

### API Endpoints

**Auth Service** (`http://localhost:3001`):

- `POST /auth/register` - Register new user
- `POST /auth/login` - Login
- `POST /auth/refresh` - Refresh access token
- `POST /auth/logout` - Logout
- `GET /auth/me` - Get current user
- `POST /auth/password` - Change password

**Payments Service** (`http://localhost:3002`):

- `POST /payments` - Create payment
- `GET /payments` - Get payment history
- `GET /payments/:id` - Get payment by ID
- `PATCH /payments/:id` - Update payment
- `DELETE /payments/:id` - Delete payment

**Admin Service** (`http://localhost:3003`):

- `GET /admin/users` - List all users (ADMIN only)
- `PATCH /admin/users/:id/status` - Update user status (ADMIN only)

**Profile Service** (`http://localhost:3004`):

- `GET /profile/:userId` - Get user profile
- `PATCH /profile/:userId` - Update user profile

## Configuration Changes

### 1. API Client Default URL

**File:** `libs/shared-api-client/src/lib/apiClient.ts`

```typescript
// Default to Auth Service for POC-2
const baseURL = config.baseURL ?? envBaseURL ?? 'http://localhost:3001';
```

### 2. MFE Rspack Configurations

**Shell MFE** (`apps/shell/rspack.config.js`):

```javascript
NX_API_BASE_URL: process.env.NX_API_BASE_URL || 'http://localhost:3001';
```

**Auth MFE** (`apps/auth-mfe/rspack.config.js`):

```javascript
NX_API_BASE_URL: process.env.NX_API_BASE_URL || 'http://localhost:3001';
```

**Payments MFE** (`apps/payments-mfe/rspack.config.js`):

```javascript
NX_API_BASE_URL: process.env.NX_API_BASE_URL || 'http://localhost:3002';
```

### 3. API Gateway Proxy Disabled

**File:** `apps/api-gateway/src/main.ts`

```typescript
// API proxy routes to backend services
// POC-2: Proxy routes temporarily disabled - frontend uses direct service URLs
// API Gateway proxy implementation deferred to POC-3
// app.use(proxyRoutes);
```

## Starting Backend Services

### Quick Start

```bash
# Terminal 1: Infrastructure
pnpm infra:start

# Terminal 2: All backend services (recommended)
pnpm backend:dev:all

# OR individual services in separate terminals:
pnpm dev:auth-service     # Port 3001
pnpm dev:payments-service # Port 3002
pnpm dev:admin-service    # Port 3003
pnpm dev:profile-service  # Port 3004

# Optional: Start API Gateway for health monitoring
pnpm dev:api-gateway      # Port 3000 (health endpoints only)
```

**Note:** API Gateway is optional for POC-2. It only provides health endpoints.

### Verify Services

```bash
# Health checks
curl http://localhost:3001/health  # Auth
curl http://localhost:3002/health  # Payments
curl http://localhost:3003/health  # Admin
curl http://localhost:3004/health  # Profile
```

## Testing Examples

### Complete User Flow

```bash
# 1. Register
REGISTER_RESPONSE=$(curl -s -X POST http://localhost:3001/auth/register \
  -H 'Content-Type: application/json' \
  -d '{"email":"test@example.com","password":"Test123!@#Password","name":"Test User"}')

# Extract tokens
ACCESS_TOKEN=$(echo $REGISTER_RESPONSE | jq -r '.data.accessToken')
USER_ID=$(echo $REGISTER_RESPONSE | jq -r '.data.user.id')

# 2. Create payment
curl -X POST http://localhost:3002/payments \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -H 'Content-Type: application/json' \
  -d '{"amount":100.00,"currency":"USD","description":"Test payment"}'

# 3. Get payments
curl http://localhost:3002/payments \
  -H "Authorization: Bearer $ACCESS_TOKEN"

# 4. Get profile
curl http://localhost:3004/profile/$USER_ID \
  -H "Authorization: Bearer $ACCESS_TOKEN"

# 5. Logout
curl -X POST http://localhost:3001/auth/logout \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -H 'Content-Type: application/json' \
  -d '{"refreshToken":"..."}'
```

## Frontend Configuration

### Environment Variables

Each MFE has its base URL configured via `NX_API_BASE_URL`:

```bash
# Not needed - already configured in rspack.config.js
# But you can override:
export NX_API_BASE_URL=http://localhost:3001  # For auth/shell MFEs
export NX_API_BASE_URL=http://localhost:3002  # For payments MFE
```

### CORS Configuration

Backend services are configured to allow requests from frontend MFE ports:

```typescript
// apps/auth-service/src/config/index.ts
corsOrigins: [
  'http://localhost:4200', // Shell
  'http://localhost:4201', // Auth MFE
  'http://localhost:4202', // Payments MFE
  'http://localhost:4203', // Admin MFE
];
```

## What Works in POC-2

✅ **Authentication Flow:**

- Register → Login → Token storage → Logout
- JWT token generation and validation
- Token refresh mechanism
- Password validation and hashing

✅ **Payments Flow:**

- Create payment with authenticated user
- Get payment history
- Payment status management

✅ **Profile Management:**

- Get user profile
- Update profile information

✅ **Admin Features:**

- RBAC enforcement (ADMIN vs CUSTOMER vs VENDOR)
- Admin-only endpoints protected

✅ **Security:**

- JWT authentication on all protected endpoints
- Role-based access control
- Rate limiting on auth endpoints
- CORS properly configured

## Known Limitations (POC-2)

❌ **API Gateway Proxy:**

- Frontend cannot use unified `http://localhost:3000/api/*` endpoint
- Each service must be accessed directly
- CORS must be configured on each service

⚠️ **CORS Preflight:**

- Each service handles CORS independently
- Might need to configure CORS on all services

⚠️ **Service Discovery:**

- Frontend must know specific service URLs
- No dynamic service routing

## POC-3 Plans

The API Gateway proxy will be re-implemented in POC-3 with one of these approaches:

1. **Custom HTTP Proxy** using Node.js native modules (streaming)
2. **Alternative Proxy Library** (express-http-proxy, etc.)
3. **Production Reverse Proxy** (Nginx, Traefik, Kong)

See `docs/POC-3-Planning/api-gateway-proxy-implementation.md` for detailed analysis and implementation plan.

## Troubleshooting

### Service Not Responding

```bash
# Check if service is running
lsof -i :3001  # Auth
lsof -i :3002  # Payments

# Check logs
tail -f /tmp/auth-*.log
tail -f /tmp/payments-*.log
```

### CORS Errors

If you see CORS errors in the browser console:

1. Verify backend service CORS origins include your frontend URL
2. Check that OPTIONS preflight requests return 200

### Authentication Errors

```bash
# Verify token is being sent
curl -v http://localhost:3002/payments \
  -H "Authorization: Bearer YOUR_TOKEN"

# Check if token is valid
curl http://localhost:3001/auth/me \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

**For detailed testing procedures, see:** `docs/POC-2-Implementation/manual-testing-guide.md`
