# SSL/TLS Setup Guide - POC-3

**Date:** 2025-12-12  
**Status:** Complete  
**Version:** 1.1  
**Last Updated:** 2025-12-12 (Added CORS configuration, HMR setup, known limitations)

---

## Overview

This guide explains how to use HTTPS/TLS with self-signed certificates in the POC-3 payments system. SSL/TLS termination happens at nginx, providing encrypted connections from the browser while keeping internal services (API Gateway, MFEs, backend services) as HTTP for simplicity.

**Architecture:**
- Browser → nginx (HTTPS/WSS)
- nginx → API Gateway (HTTP)
- nginx → MFE dev servers (HTTP)
- Backend services → RabbitMQ (AMQP, no TLS)
- Backend services → PostgreSQL (TCP, no TLS)

---

## Prerequisites

- Docker and Docker Compose installed
- openssl installed (for certificate generation)
- nginx running in Docker (`docker-compose up -d nginx`)
- All POC-3 infrastructure services running

---

## Quick Start

### 1. Generate SSL Certificates

```bash
# Run certificate generation script
pnpm ssl:generate

# Verify certificates exist
ls -la nginx/ssl/
# Should show: self-signed.crt, self-signed.key, dhparam.pem
```

### 2. Start Infrastructure

```bash
# Start all infrastructure services (nginx, databases, RabbitMQ, Redis)
pnpm infra:start

# Verify nginx is running and healthy
docker-compose ps nginx
```

### 3. Start Backend Services

```bash
# Start all backend services (API Gateway, Auth, Payments, Admin, Profile)
pnpm dev:backend
```

### 4. Start Frontend

```bash
# Start all MFEs with HTTPS mode (recommended)
pnpm dev:mf:https

# Or start everything together
pnpm start:https
```

### 5. Access Application

Open browser to: **https://localhost**

**Note:** You'll see a certificate warning (expected for self-signed certs). Click "Advanced" > "Proceed to localhost (unsafe)" or trust the certificate system-wide.

---

## Certificate Details

### Generated Files

Located in `nginx/ssl/`:

1. **self-signed.crt** - SSL certificate (public key)
   - Valid for 365 days
   - Subject: CN=localhost
   - SAN: localhost, *.localhost, 127.0.0.1

2. **self-signed.key** - Private key (600 permissions)
   - 2048-bit RSA
   - Keep secure, never commit

3. **dhparam.pem** - Diffie-Hellman parameters
   - 2048-bit
   - For forward secrecy

### Certificate Information

```bash
# View certificate details
openssl x509 -in nginx/ssl/self-signed.crt -text -noout

# Check validity dates
openssl x509 -in nginx/ssl/self-signed.crt -noout -dates

# Verify SAN includes localhost
openssl x509 -in nginx/ssl/self-signed.crt -noout -ext subjectAltName
```

---

## Trust Certificate (macOS)

To avoid browser warnings:

```bash
# Trust certificate system-wide
sudo security add-trusted-cert -d -r trustRoot \
  -k /Library/Keychains/System.keychain nginx/ssl/self-signed.crt

# Restart browser
```

**Chrome:** Also enable `chrome://flags/#allow-insecure-localhost`

**Firefox:** Click "Advanced" > "Accept the Risk and Continue" once per domain

---

## Configuration

### Frontend (MFEs)

All MFE Rspack configs now default to HTTPS via nginx:

```javascript
// apps/shell/rspack.config.js (and auth-mfe, payments-mfe, admin-mfe)
NX_API_BASE_URL: process.env.NX_API_BASE_URL || 'https://localhost/api',
NX_WS_URL: process.env.NX_WS_URL || 'wss://localhost/ws',
```

### API Client

The shared API client (`libs/shared-api-client`) defaults to HTTPS:

```typescript
// libs/shared-api-client/src/lib/apiClient.ts
const baseURL = config.baseURL ?? envBaseURL ?? 'https://localhost/api';
```

### CORS Configuration (Critical)

All backend services must allow `https://localhost` as a CORS origin. This is configured in:

**API Gateway:**
```typescript
// apps/api-gateway/src/config/index.ts
corsOrigins: (
  process.env['CORS_ORIGINS'] ??
  'http://localhost:4200,http://localhost:4201,http://localhost:4202,http://localhost:4203,https://localhost'
).split(','),
```

**Backend Services (Auth, Admin, Payments, Profile):**
```typescript
// apps/{service}/src/main.ts
const allowedOrigins = [
  'http://localhost:4200',
  'http://localhost:4201',
  'http://localhost:4202',
  'http://localhost:4203',
  'https://localhost', // nginx proxy
];
```

**Important:** If you add new services or change ports, update CORS origins in all affected services.

### nginx Configuration

Located at `nginx/nginx.conf`:

**SSL/TLS Settings:**
- Listen on port 443 with SSL
- TLS 1.2 and 1.3 only
- Modern cipher suites
- Session caching (50MB shared cache)
- DH parameters for forward secrecy

**HTTP to HTTPS Redirect:**
- Port 80 redirects to 443 (301)

**Proxy Configuration:**
- `/api/*` → API Gateway (http://host.docker.internal:3000)
- `/ws` → WebSocket server (http://host.docker.internal:3000)
- `/` → Shell app (http://host.docker.internal:4200)
- MFE remotes proxied to respective ports
- `/hmr/*` → HMR WebSocket endpoints for each MFE (development only)

**HMR WebSocket Proxy (Development):**
- `/hmr/shell` → Shell dev server WebSocket (port 4200)
- `/hmr/auth` → Auth MFE dev server WebSocket (port 4201)
- `/hmr/payments` → Payments MFE dev server WebSocket (port 4202)
- `/hmr/admin` → Admin MFE dev server WebSocket (port 4203)

**Security Headers:**
- X-Frame-Options: SAMEORIGIN
- X-Content-Type-Options: nosniff
- X-XSS-Protection: 1; mode=block
- Referrer-Policy: strict-origin-when-cross-origin
- Content-Security-Policy (relaxed for dev)

---

## Testing

### 1. Certificate Verification

```bash
# Test nginx can read certificates
docker-compose exec nginx ls -la /etc/nginx/ssl/

# Expected output:
# -rw-r--r-- self-signed.crt
# -rw------- self-signed.key
# -rw-r--r-- dhparam.pem
```

### 2. HTTPS Connection

```bash
# Test HTTP to HTTPS redirect
curl -I http://localhost/
# Expected: 301 redirect to https://localhost/

# Test HTTPS connection (ignore self-signed cert warning)
curl -k https://localhost/health
# Expected: 200 OK or 502 (if API Gateway not running)
```

### 3. API Gateway Proxy

```bash
# Test API through nginx
curl -k https://localhost/api/health
# Expected: {"status":"ok","timestamp":"..."}
```

### 4. WebSocket Connection

```bash
# Check browser console after login
# Should see: WebSocket connection to wss://localhost/ws
# Status: Connected
```

### 5. Security Headers

```bash
# Verify security headers present
curl -k -I https://localhost/
# Should include all security headers listed above
```

---

## Switching Between HTTP and HTTPS

### Use HTTPS (via nginx) - Recommended

```bash
# Start MFEs with HTTPS mode
pnpm dev:mf:https

# Or start everything (infrastructure + backend + frontend)
pnpm start:https
```

**URLs:**
- Frontend: https://localhost
- API: https://localhost/api
- WebSocket: wss://localhost/ws
- GraphQL: https://localhost/graphql
- HMR: wss://localhost/hmr/{shell,auth,payments,admin}

**Environment Variables Set:**
```bash
NX_API_BASE_URL=https://localhost/api
NX_WS_URL=wss://localhost/ws
NX_HTTPS_MODE=true  # Enables HMR via nginx proxy
```

### Use HTTP (direct to API Gateway) - For Debugging

```bash
# Start MFEs with HTTP mode (bypass nginx)
pnpm dev:mf

# Or with explicit environment variables
pnpm start:http
```

**URLs:**
- Frontend: http://localhost:4200
- API: http://localhost:3000/api (direct to API Gateway)
- WebSocket: ws://localhost:3000/ws
- GraphQL: http://localhost:3000/graphql
- HMR: ws://localhost:{port}/ws (direct to each MFE)

**Note:** Direct HTTP access skips nginx, so no rate limiting, security headers, or SSL/TLS.

### Comparison Table

| Feature | HTTPS Mode | HTTP Mode |
|---------|------------|-----------|
| **Command** | `pnpm dev:mf:https` | `pnpm dev:mf` |
| **Frontend URL** | https://localhost | http://localhost:4200 |
| **API URL** | https://localhost/api | http://localhost:3000/api |
| **WebSocket** | wss://localhost/ws | ws://localhost:3000/ws |
| **HMR** | Via nginx proxy | Direct to dev server |
| **Rate Limiting** | Yes (nginx) | No |
| **Security Headers** | Yes (nginx) | No |
| **SSL/TLS** | Yes | No |
| **HMR Behavior** | Full page reload | Full page reload |

---

## Troubleshooting

### Issue: Browser Shows "Connection Not Private"

**Cause:** Self-signed certificate not trusted

**Solutions:**
1. Click "Advanced" > "Proceed to localhost"
2. Trust certificate system-wide (see Trust Certificate section)
3. Enable Chrome flag: `chrome://flags/#allow-insecure-localhost`

### Issue: Mixed Content Warnings

**Cause:** HTTPS page trying to load HTTP resources

**Solution:**
- Check browser console for mixed content errors
- Ensure all URLs use HTTPS or relative paths
- Verify WebSocket uses `wss://` not `ws://`

### Issue: WebSocket Connection Fails

**Symptoms:** WebSocket status shows "Disconnected" or "Error"

**Debugging:**
```bash
# Check nginx WebSocket proxy
docker-compose logs nginx | grep ws

# Check API Gateway WebSocket server
# Should see: "WebSocket server listening on port 3000"

# Test direct WebSocket connection (requires JWT token)
wscat -c ws://localhost:3000/ws?token=<your-jwt-token>

# Test via nginx (ignore cert)
wscat -c wss://localhost/ws?token=<your-jwt-token> --no-check
```

**Common Causes:**
- Token not provided in query string
- Token expired or invalid
- nginx not forwarding Upgrade headers (check config)
- API Gateway not running

### Issue: 502 Bad Gateway

**Cause:** nginx cannot connect to upstream (API Gateway, MFEs)

**Solution:**
```bash
# Check if API Gateway is running
curl http://localhost:3000/health

# Check if MFEs are running
curl http://localhost:4200

# Check nginx logs
docker-compose logs nginx

# Verify upstreams in nginx config
docker-compose exec nginx cat /etc/nginx/nginx.conf | grep upstream
```

### Issue: HMR Not Working Over HTTPS

**Symptoms:** Changes not reflected, console shows HMR errors

**Solution:**
- Use `pnpm dev:mf:https` which sets `NX_HTTPS_MODE=true`
- HMR WebSocket connects via nginx: `wss://localhost/hmr/{app}`
- nginx proxies HMR to respective dev server `/ws` endpoints
- Check browser console for HMR connection status
- Restart dev servers if needed

### Issue: HMR Does Full Page Reload Instead of Hot Update

**Symptoms:** Changes trigger full page reload instead of component hot reload

**Cause:** This is a **known limitation** of Module Federation with async boundary pattern.

**Explanation:**
- Module Federation requires an async boundary (`import('./bootstrap')`) for shared dependencies
- This async boundary breaks React Fast Refresh's module tracking
- The HMR system detects changes but cannot hot-replace modules, so it falls back to full reload

**Affected:**
- All component changes (Shell, Auth MFE, Payments MFE, Admin MFE)
- Shared library changes
- CSS/Tailwind class changes

**Workaround:**
- Full page reload is fast with Rspack (typically < 1 second)
- This is acceptable for development workflow
- Future optimization possible but not critical for POC-3

**Note:** This behavior is the same for both HTTP and HTTPS modes - it's not an HTTPS-specific issue.

### Issue: Certificate Expired

**Symptoms:** Browser shows "Certificate Expired" error

**Solution:**
```bash
# Check certificate expiry
openssl x509 -in nginx/ssl/self-signed.crt -noout -dates

# Regenerate certificate
rm nginx/ssl/*
pnpm ssl:generate

# Restart nginx
docker-compose restart nginx
```

---

## RabbitMQ and PostgreSQL

### Do They Need TLS?

**No, for local development:**

Both RabbitMQ (AMQP) and PostgreSQL run without TLS because:
1. Only accessible within Docker network or localhost
2. Not exposed to external networks
3. Have their own authentication (username/password)
4. nginx provides TLS for all external-facing endpoints

**Yes, for production:**

Enable TLS for RabbitMQ and PostgreSQL in production environments:
- RabbitMQ: Use `amqps://` protocol with SSL certificates
- PostgreSQL: Use `sslmode=require` in connection strings
- Mount certificates into containers
- Update connection URLs in all services

### RabbitMQ TLS (If Needed)

See `docs/POC-3-Implementation/rabbitmq-tls-setup.md` (future documentation)

### PostgreSQL TLS (If Needed)

See `docs/POC-3-Implementation/postgresql-tls-setup.md` (future documentation)

---

## Production Considerations

### Certificate Management

For production, replace self-signed certificates with:

1. **Let's Encrypt** (Free, automated)
   - Use certbot for automated renewal
   - 90-day validity, auto-renews
   - Widely trusted

2. **Commercial CA** (DigiCert, Sectigo, etc.)
   - Extended validation options
   - Longer validity periods
   - Corporate requirements

### HSTS Header

Enable HSTS in production (currently commented out):

```nginx
# In nginx/nginx.conf, uncomment:
add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
```

**Warning:** Don't enable HSTS in development - it makes HTTP access difficult.

### Certificate Monitoring

Add Prometheus metrics for certificate expiry:

```typescript
// In observability library
const certExpiryGauge = new promClient.Gauge({
  name: 'ssl_certificate_expiry_days',
  help: 'Days until SSL certificate expires',
});

// Update periodically
certExpiryGauge.set(daysUntilExpiry);
```

### Rate Limiting

nginx already has rate limiting configured:
- Auth endpoints: 10 req/min
- API endpoints: 100 req/min
- Static assets: 1000 req/min

Adjust limits for production load in `nginx/nginx.conf`.

---

## Environment Variables

Create `.env.local` (gitignored) to override defaults:

```bash
# HTTPS via nginx (default)
NX_API_BASE_URL=https://localhost/api
NX_WS_URL=wss://localhost/ws

# HTTP direct (for debugging)
# NX_API_BASE_URL=http://localhost:3000/api
# NX_WS_URL=ws://localhost:3000/ws

# Observability (optional)
# NX_SENTRY_DSN=your-sentry-dsn
# SENTRY_DSN=your-sentry-dsn

# Backend database URLs
AUTH_DATABASE_URL=postgresql://postgres:postgres@localhost:5432/auth_db
PAYMENTS_DATABASE_URL=postgresql://postgres:postgres@localhost:5433/payments_db
ADMIN_DATABASE_URL=postgresql://postgres:postgres@localhost:5434/admin_db
PROFILE_DATABASE_URL=postgresql://postgres:postgres@localhost:5435/profile_db

# RabbitMQ (no TLS for dev)
RABBITMQ_URL=amqp://admin:admin@localhost:5672

# Redis cache
REDIS_URL=redis://localhost:6379

# Environment
NODE_ENV=development
```

---

## Package.json Scripts

**HTTPS Scripts (via nginx):**
```bash
pnpm start:https     # Start infrastructure + MFEs with HTTPS
pnpm dev:mf:https    # Start MFEs only with HTTPS (NX_HTTPS_MODE=true)
```

**HTTP Scripts (direct, bypass nginx):**
```bash
pnpm start:http      # Start MFEs with HTTP URLs (bypass nginx)
pnpm dev:mf          # Start MFEs only with HTTP (default)
```

**Backend Scripts:**
```bash
pnpm dev:backend     # Start all backend services (includes CORS_ORIGINS env var)
```

**SSL Management:**
```bash
pnpm ssl:generate    # Generate/regenerate SSL certificates
```

**Infrastructure:**
```bash
pnpm infra:start     # Start Docker services (nginx, databases, RabbitMQ, Redis)
pnpm infra:stop      # Stop Docker services
pnpm infra:restart   # Restart Docker services
pnpm infra:logs      # View infrastructure logs
```

---

## Security Best Practices

### Development

1. **Use HTTPS by default** - Tests real-world behavior
2. **Trust certificate locally** - Reduces warnings, improves UX
3. **Never commit private keys** - `.gitignore` already configured
4. **Rotate certificates** - Regenerate every 3-6 months
5. **Use environment variables** - Keep URLs configurable

### Production

1. **Use real certificates** - Let's Encrypt or commercial CA
2. **Enable HSTS** - Force HTTPS, prevent downgrade attacks
3. **Update cipher suites** - Use modern, secure ciphers only
4. **Enable TLS 1.3 only** - Disable TLS 1.2 if possible
5. **Monitor certificate expiry** - Set up alerts
6. **Use certificate pinning** - For mobile apps
7. **Enable RabbitMQ TLS** - `amqps://` protocol
8. **Enable PostgreSQL TLS** - `sslmode=require`
9. **Restrict origins** - Update CORS to production domains
10. **Review rate limits** - Adjust for production load

---

## Files Modified for HTTPS Support

The following files were modified to enable HTTPS/TLS support:

### Backend CORS Configuration

| File | Change |
|------|--------|
| `apps/api-gateway/src/config/index.ts` | Added `https://localhost` to CORS origins |
| `apps/auth-service/src/main.ts` | Added `https://localhost` to allowedOrigins |
| `apps/admin-service/src/main.ts` | Added `https://localhost` to allowedOrigins |
| `apps/payments-service/src/main.ts` | Added `https://localhost` to allowedOrigins |
| `apps/profile-service/src/main.ts` | Added `https://localhost` to allowedOrigins |

### Frontend Configuration

| File | Change |
|------|--------|
| `libs/shared-api-client/src/lib/apiClient.ts` | Default baseURL changed to `https://localhost/api` |
| `apps/shell/rspack.config.js` | Added HMR WebSocket config for HTTPS mode |
| `apps/auth-mfe/rspack.config.js` | Added HMR WebSocket config for HTTPS mode |
| `apps/payments-mfe/rspack.config.js` | Added HMR WebSocket config for HTTPS mode |
| `apps/admin-mfe/rspack.config.js` | Added HMR WebSocket config for HTTPS mode |
| `apps/shell/src/main.tsx` | Added module.hot.accept for HMR |
| `apps/shell/src/types/module-federation.d.ts` | Added HMR type declarations |

### nginx Configuration

| File | Change |
|------|--------|
| `nginx/nginx.conf` | Added HMR WebSocket proxy endpoints (`/hmr/*`) |

### Package Scripts

| File | Change |
|------|--------|
| `package.json` | Added `dev:mf:https` script with `NX_HTTPS_MODE=true` |
| `package.json` | Updated `dev:backend` to include `CORS_ORIGINS` env var |
| `package.json` | Updated `start:https` and `start:http` scripts |

---

## Known Limitations

### 1. HMR Full Page Reload

**Issue:** Hot Module Replacement triggers full page reload instead of component hot update.

**Cause:** Module Federation's async boundary pattern (`import('./bootstrap')`) breaks React Fast Refresh's module tracking.

**Impact:** All code changes (components, CSS, shared libraries) cause full page reload.

**Workaround:** Full page reload is fast with Rspack (< 1 second). Acceptable for development.

**Future Optimization:** Could potentially be improved with:
- Custom HMR boundary handling
- Module Federation 2.0 features
- Alternative async boundary patterns

### 2. Self-Signed Certificate Warnings

**Issue:** Browsers show security warnings for self-signed certificates.

**Workaround:** 
- Click "Advanced" > "Proceed to localhost"
- Trust certificate system-wide (see Trust Certificate section)
- Enable Chrome flag: `chrome://flags/#allow-insecure-localhost`

### 3. RabbitMQ TLS Not Implemented

**Issue:** RabbitMQ runs without TLS in development.

**Note:** This is intentional for local development. Enable TLS for production deployments.

---

## Additional Resources

### External Documentation

- [nginx SSL/TLS Configuration](https://nginx.org/en/docs/http/configuring_https_servers.html)
- [Let's Encrypt Documentation](https://letsencrypt.org/docs/)
- [Mozilla SSL Configuration Generator](https://ssl-config.mozilla.org/)
- [SSL Labs Server Test](https://www.ssllabs.com/ssltest/)

### Related POC-3 Documentation

- [Implementation Plan](./implementation-plan.md) - Overall POC-3 progress
- [Task List](./task-list.md) - Detailed task tracking
- [Testing Guide](./testing-guide.md) - Comprehensive testing instructions
- [Swagger API Documentation](./SWAGGER_API_DOCUMENTATION.md) - Interactive API docs
- [Observability Live Setup](./OBSERVABILITY_LIVE_SETUP.md) - Prometheus, Grafana, Jaeger
- [RabbitMQ Implementation](./RABBITMQ_IMPLEMENTATION.md) - Event hub setup

---

**Last Updated:** 2025-12-12  
**Author:** AI Assistant  
**Status:** Production-Ready for Development
