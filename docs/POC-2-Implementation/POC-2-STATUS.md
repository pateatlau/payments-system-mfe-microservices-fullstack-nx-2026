# API Gateway - POC-2 Status

> **Last Updated:** 2025-12-09  
> **Status:** Health Endpoints Only - Proxy Disabled

---

## Quick Summary

The API Gateway is **partially implemented** for POC-2:

- ✅ **Infrastructure:** Middleware, logging, error handling, rate limiting - all working
- ❌ **Proxy Routes:** Disabled due to technical issues with `http-proxy-middleware` v3.x
- ✅ **Health Endpoints:** Fully functional for monitoring

**Bottom Line:** The gateway works for everything except proxying requests. Frontend uses direct service URLs instead.

---

## What's Working ✅

### 1. Health Endpoints

All health check endpoints are fully functional:

```bash
curl http://localhost:3000/health
curl http://localhost:3000/health/ready
curl http://localhost:3000/health/live
```

### 2. Middleware Stack

All middleware is active and working:

- **CORS:** Configured for all MFE ports (4200-4203)
- **Security Headers:** Helmet middleware with secure defaults
- **Rate Limiting:** General rate limiter (100 req/15min per IP)
- **Request Logging:** Structured logging with Winston
- **Error Handling:** Global error handler with standardized responses

### 3. Server Infrastructure

- ✅ Express server configured and running
- ✅ Port 3000 (configurable via `API_GATEWAY_PORT`)
- ✅ Environment configuration with validation
- ✅ Graceful error handling
- ✅ TypeScript compiled without errors

---

## What's Disabled ❌

### Proxy Routes

The proxy functionality (`http-proxy-middleware`) is completely disabled:

**File:** `apps/api-gateway/src/main.ts`

```typescript
// POC-2: Proxy routes temporarily disabled - frontend uses direct service URLs
// API Gateway proxy implementation deferred to POC-3
// app.use(proxyRoutes);
```

**File:** `apps/api-gateway/src/routes/proxy.ts`

- Replaced with placeholder route (`/proxy-disabled`)
- Returns 501 status with direct service URLs

---

## Why Proxy Was Disabled

During POC-2 implementation, we encountered multiple technical issues:

### Issues Encountered

1. **Request Body Streaming**
   - Express body-parser middleware consumed request body before proxy
   - Resulted in empty bodies being forwarded to backend services
   - Backend services returned "request aborted" errors

2. **Path Rewriting**
   - `http-proxy-middleware` v3.x pathRewrite didn't work as expected
   - Requests forwarded to wrong paths (e.g., `/login` instead of `/auth/login`)
   - Function-based pathRewrite also had issues

3. **Header Forwarding**
   - Authorization headers not properly forwarded
   - Content-Type issues between proxy and backend

4. **Timeout Errors**
   - Frequent `PROXY_ERROR` timeouts
   - Even with extended timeout configurations

### Solutions Attempted

We tried multiple approaches:

1. ✅ Adjusted middleware order (body-parser after proxy)
2. ✅ Modified pathRewrite to use function syntax
3. ✅ Implemented custom axios-based proxy
4. ✅ Added extensive logging and debugging
5. ❌ All attempts resulted in persistent issues

### Decision Made

Rather than delay POC-2 completion, we made the strategic decision to:

- Disable API Gateway proxy for POC-2
- Use direct service URLs in frontend
- Defer robust proxy implementation to POC-3
- Document the issue thoroughly for future reference

---

## Frontend Configuration (POC-2)

Frontend applications are configured to use **direct service URLs**:

### API Client Configuration

**File:** `libs/shared-api-client/src/lib/apiClient.ts`

```typescript
// Default to Auth Service direct URL for POC-2
const baseURL = config.baseURL ?? envBaseURL ?? 'http://localhost:3001';
```

### MFE Rspack Configurations

**Shell MFE:** `apps/shell/rspack.config.js`

```javascript
NX_API_BASE_URL: 'http://localhost:3001'; // Auth Service
```

**Auth MFE:** `apps/auth-mfe/rspack.config.js`

```javascript
NX_API_BASE_URL: 'http://localhost:3001'; // Auth Service
```

**Payments MFE:** `apps/payments-mfe/rspack.config.js`

```javascript
NX_API_BASE_URL: 'http://localhost:3002'; // Payments Service
```

### Direct Service URLs

| Service  | Port | Base URL                | Endpoints     |
| -------- | ---- | ----------------------- | ------------- |
| Auth     | 3001 | `http://localhost:3001` | `/auth/*`     |
| Payments | 3002 | `http://localhost:3002` | `/payments/*` |
| Admin    | 3003 | `http://localhost:3003` | `/admin/*`    |
| Profile  | 3004 | `http://localhost:3004` | `/profile/*`  |

---

## Impact on POC-2

### ✅ No Functionality Lost

All planned POC-2 features work perfectly with direct service URLs:

- ✅ User registration and login
- ✅ JWT authentication and token refresh
- ✅ Protected routes and RBAC
- ✅ Payment creation and history
- ✅ Admin operations
- ✅ User profiles
- ✅ Event bus communication

### 🤔 Trade-offs

**Advantages of Direct URLs:**

- Simpler debugging (no proxy layer)
- Clearer error messages
- Faster response times (no proxy overhead)
- Each service's CORS independently configurable

**Disadvantages:**

- Frontend needs to know all service URLs
- No unified API endpoint
- CORS must be configured on each service
- No centralized authentication/authorization at gateway level

---

## Development Workflow

### Starting Backend Services

```bash
# Option 1: Without API Gateway (Recommended for POC-2)
pnpm backend:dev:all

# Option 2: With API Gateway (for health monitoring)
pnpm backend:dev:with-gateway
```

### Verifying API Gateway Health

```bash
curl http://localhost:3000/health

# Expected output:
{
  "success": true,
  "data": {
    "status": "healthy",
    "timestamp": "2025-12-09T08:00:00.000Z",
    "service": "api-gateway",
    "uptime": 123.456
  }
}
```

### Testing Direct Service Access

```bash
# Auth Service
curl http://localhost:3001/health

# Payments Service
curl http://localhost:3002/health

# Admin Service
curl http://localhost:3003/health

# Profile Service
curl http://localhost:3004/health
```

---

## POC-3 Plans

### Recommended Approaches

The proxy will be re-implemented in POC-3 using one of these approaches:

#### Option 1: Custom Node.js HTTP Proxy ⭐ Recommended

- Use Node.js native `http`/`https` modules
- Full control over request/response streaming
- Proper header and body forwarding
- Clean error handling

#### Option 2: Alternative Proxy Library

- Explore `express-http-proxy` or similar
- Better compatibility with Express 5
- Simpler configuration than `http-proxy-middleware`

#### Option 3: Production Reverse Proxy

- Use Nginx, Traefik, or Kong
- Industry-standard solution
- Better performance and features
- Separate process from Node.js application

### Implementation Plan

See detailed analysis and recommendations in:
`docs/POC-3-Planning/api-gateway-proxy-implementation.md`

---

## Documentation References

- **Direct URLs Setup:** `docs/POC-2-Implementation/DIRECT-SERVICE-URLS-README.md`
- **Manual Testing Guide:** `docs/POC-2-Implementation/manual-testing-guide.md`
- **POC-3 Proxy Plan:** `docs/POC-3-Planning/api-gateway-proxy-implementation.md`
- **API Contracts:** `docs/POC-2-Implementation/api-contracts.md`

---

## Questions?

If you have questions about the API Gateway status or direct service URLs:

1. Check `DIRECT-SERVICE-URLS-README.md` for setup instructions
2. Review `manual-testing-guide.md` for testing procedures
3. See `api-gateway-proxy-implementation.md` for POC-3 planning

**For POC-2, the current setup works perfectly for all planned features!**
