# API Gateway

> **⚠️ POC-2 Status:** Health Endpoints Only - Proxy Functionality Disabled

## Overview

The API Gateway is designed to serve as the single entry point for all frontend requests, routing them to appropriate backend microservices. However, for POC-2, **only health check endpoints are active**. Proxy functionality has been disabled and deferred to POC-3.

## Current Status (POC-2)

### ✅ What's Working

- **Health Endpoints:** `/health`, `/health/ready`, `/health/live`
- **CORS Middleware:** Configured for all MFE ports
- **Security Headers:** Helmet middleware active
- **Rate Limiting:** General rate limiter configured
- **Error Handling:** 404 and global error handlers
- **Request Logging:** Structured logging with Winston

### ❌ What's Disabled

- **Proxy Routes:** The `http-proxy-middleware` implementation is disabled
- **API Routing:** No requests are forwarded to backend services

### Frontend Impact

**No functionality is impacted.** Frontend applications communicate directly with backend services:

- Auth Service: `http://localhost:3001`
- Payments Service: `http://localhost:3002`
- Admin Service: `http://localhost:3003`
- Profile Service: `http://localhost:3004`

## Why Proxy is Disabled

During POC-2 implementation, we encountered technical challenges with `http-proxy-middleware` v3.x:

1. Request body streaming issues
2. Path rewriting complications
3. Header forwarding problems
4. Timeout errors

Rather than delay POC-2, we made the strategic decision to use direct service URLs and defer a robust proxy implementation to POC-3.

## Documentation

- **Direct URLs Guide:** `docs/POC-2-Implementation/DIRECT-SERVICE-URLS-README.md`
- **POC-3 Proxy Plan:** `docs/POC-3-Planning/api-gateway-proxy-implementation.md`
- **Manual Testing:** `docs/POC-2-Implementation/manual-testing-guide.md`
- **POC-2 Status Details:** `POC-2-STATUS.md` (in this directory)

## Development

### Starting the Gateway

```bash
# Individual service (optional for POC-2)
pnpm dev:api-gateway

# With all backend services
pnpm backend:dev:with-gateway
```

The gateway runs on **port 3000** by default.

### Health Check

```bash
curl http://localhost:3000/health
```

Expected response:

```json
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

## Building

```bash
nx build api-gateway
```

## Testing

```bash
nx test api-gateway
```

## POC-3 Plans

The proxy functionality will be re-implemented in POC-3 using one of these approaches:

1. Custom HTTP proxy with Node.js native modules
2. Alternative proxy library (express-http-proxy)
3. Production reverse proxy (Nginx, Traefik, Kong)

See `docs/POC-3-Planning/api-gateway-proxy-implementation.md` for detailed analysis and recommendations.
