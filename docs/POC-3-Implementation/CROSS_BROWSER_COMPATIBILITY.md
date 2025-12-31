# Cross-Browser Compatibility for Module Federation

This document describes the cross-browser compatibility considerations and fixes implemented for Module Federation v2 in the MFE Payments System.

## Supported Browsers

| Browser | Status | Notes |
|---------|--------|-------|
| Chrome | Fully Supported | Primary development browser |
| Firefox | Fully Supported | Required CSP header adjustments |
| Safari | Fully Supported | Requires HTTPS mode + specific configurations (see below) |
| Edge | Fully Supported | Chromium-based, works like Chrome |
| Brave | Fully Supported | Works like Chrome |

## Safari Compatibility - Complete Guide

Safari is the most restrictive browser regarding cross-origin resources, mixed content, and security policies. Multiple configurations are required for full Safari compatibility with Module Federation.

### The Safari Problem

Safari enforces strict security policies that other browsers don't:

1. **Mixed Content Blocking**: Safari blocks ALL HTTP requests from HTTPS pages (no exceptions)
2. **Cross-Origin-Resource-Policy (CORP)**: Safari strictly enforces CORP headers on API responses
3. **Dynamic Script Loading**: Safari requires `crossorigin` attribute on dynamically loaded scripts
4. **Certificate Trust**: Safari requires explicit trust for self-signed certificates

### Complete Safari Fix Checklist

To make Module Federation work in Safari, ALL of the following must be configured:

- [ ] HTTPS mode enabled (`pnpm dev:all` sets `NX_HTTPS_MODE=true`)
- [ ] nginx MFE proxy routes configured
- [ ] `crossOriginLoading: 'anonymous'` in all rspack configs
- [ ] Cross-origin headers in MFE dev servers
- [ ] API client URLs default to HTTPS (not HTTP)
- [ ] Backend helmet configured with `crossOriginResourcePolicy: 'cross-origin'`
- [ ] Self-signed certificate trusted in macOS Keychain

---

## Fix 1: HTTPS Mode (Required)

Safari **strictly blocks ALL mixed content** (HTTP resources loaded on an HTTPS page). Since Module Federation loads remote entries dynamically, all resources must be served over HTTPS.

**Solution**: Run the application in HTTPS mode via nginx proxy:

```bash
# Start in HTTPS mode (Safari-compatible)
pnpm dev:all

# This sets NX_HTTPS_MODE=true which configures:
# - Shell to load remotes from https://localhost/mfe/{name}/remoteEntry.js
# - HMR WebSocket to use wss:// protocol
# - API calls to use https://localhost/api
```

---

## Fix 2: Nginx MFE Proxy Routes

When running in HTTPS mode, nginx proxies MFE remote entries to avoid mixed content. The shell loads remotes from `https://localhost/mfe/{name}/` which nginx proxies to the HTTP dev servers.

**File**: `nginx/nginx.conf`

```nginx
# MFE Proxy Routes (Safari HTTPS Compatibility)
# These routes proxy HTTP MFE dev servers through HTTPS nginx
# Format: /mfe/{name}/* -> http://{name}_mfe/*

# Auth MFE proxy (serves remoteEntry.js and chunks via HTTPS)
# Regex with capture group strips the /mfe/auth prefix
location ~ ^/mfe/auth/(.*)$ {
    proxy_pass http://auth_mfe/$1;
    proxy_http_version 1.1;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;

    # CORS headers for cross-browser support
    add_header 'Access-Control-Allow-Origin' '*' always;
    add_header 'Access-Control-Allow-Methods' 'GET, OPTIONS' always;
    add_header 'Access-Control-Allow-Headers' 'Content-Type' always;

    # No caching for remote entries
    add_header Cache-Control "no-cache, no-store, must-revalidate" always;
}

# Similar configuration for payments, admin, and profile MFEs
location ~ ^/mfe/payments/(.*)$ { ... }
location ~ ^/mfe/admin/(.*)$ { ... }
location ~ ^/mfe/profile/(.*)$ { ... }
```

**Important**: Use regex with capture group (`~ ^/mfe/auth/(.*)$` with `proxy_pass http://auth_mfe/$1`) to properly strip the prefix. Simple prefix matching (`/mfe/auth/`) doesn't work correctly.

---

## Fix 3: Dynamic Remote URL Configuration

The shell app dynamically switches remote URLs based on HTTPS mode:

**File**: `apps/shell/rspack.config.js`

```javascript
// Check if running in HTTPS mode (via nginx proxy)
const isHttpsMode = process.env.NX_HTTPS_MODE === 'true';

/**
 * Get remote MFE URL based on mode
 * - HTTPS mode: Use nginx proxy paths (Safari-compatible, no mixed content)
 * - HTTP mode: Direct access to MFE dev servers
 */
const getRemoteUrl = (mfeName, port) => {
  if (isHttpsMode) {
    // HTTPS mode: proxy through nginx to avoid mixed content (Safari requirement)
    return `https://localhost/mfe/${mfeName}/remoteEntry.js`;
  }
  // HTTP mode: direct access to dev server
  return `http://localhost:${port}/remoteEntry.js`;
};

// In ModuleFederationPlugin:
new rspack.container.ModuleFederationPlugin({
  name: 'shell',
  remotes: {
    authMfe: `authMfe@${getRemoteUrl('auth', 4201)}`,
    paymentsMfe: `paymentsMfe@${getRemoteUrl('payments', 4202)}`,
    adminMfe: `adminMfe@${getRemoteUrl('admin', 4203)}`,
    profileMfe: `profileMfe@${getRemoteUrl('profile', 4204)}`,
  },
  shared: sharedDependencies,
}),
```

---

## Fix 4: Cross-Origin Script Loading (crossOriginLoading)

Safari requires the `crossorigin` attribute on dynamically loaded scripts for proper CORS handling. Without this, Safari may block Module Federation chunk loading.

**Files**: All `rspack.config.js` files (shell, auth-mfe, payments-mfe, admin-mfe, profile-mfe)

```javascript
module.exports = {
  output: {
    path: path.resolve(__dirname, '../../dist/apps/shell'),
    uniqueName: 'shell',
    publicPath: 'auto',
    filename: isProduction ? '[name].[contenthash].js' : '[name].js',
    chunkFilename: isProduction
      ? '[name].[contenthash].chunk.js'
      : '[name].chunk.js',
    clean: true,
    // CRITICAL for Safari: Sets crossorigin="anonymous" on dynamically loaded scripts
    // This allows Module Federation to load remote entries with proper CORS handling
    crossOriginLoading: 'anonymous',
  },
  // ...
};
```

---

## Fix 5: Cross-Origin Headers in Dev Server

All MFE dev servers must include cross-origin headers for Safari compatibility:

**Files**: All `rspack.config.js` files

```javascript
devServer: {
  port: 4201,
  host: '0.0.0.0',
  hot: true,
  historyApiFallback: true,
  allowedHosts: 'all',
  headers: {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, PATCH, OPTIONS',
    'Access-Control-Allow-Headers': 'X-Requested-With, content-type, Authorization',
    // CRITICAL for Safari: Cross-origin isolation headers
    'Cross-Origin-Opener-Policy': 'same-origin-allow-popups',
    'Cross-Origin-Resource-Policy': 'cross-origin',
  },
  // ...
},
```

---

## Fix 6: API Client URLs Must Default to HTTPS

**This is a critical fix that's easy to miss!**

All MFE API clients must default to HTTPS URLs. If they fall back to HTTP, Safari will block the requests as mixed content.

**Problem**: API clients had fallback URLs using `http://localhost:3000/api`:
```javascript
// WRONG - causes mixed content errors in Safari
baseURL: envBaseURL || 'http://localhost:3000/api',
```

**Solution**: Always default to HTTPS through nginx:
```javascript
// CORRECT - Safari compatible
baseURL: envBaseURL || 'https://localhost/api',
```

**Files that needed this fix**:
- `apps/profile-mfe/src/api/profile.ts`
- `apps/admin-mfe/src/api/adminApiClient.ts`
- `apps/admin-mfe/src/api/dashboard.ts`
- `apps/payments-mfe/src/api/payments.ts`

**Example** (`apps/profile-mfe/src/api/profile.ts`):
```typescript
// Access environment variable (replaced by DefinePlugin at build time)
const envBaseURL =
  typeof process !== 'undefined' && process.env
    ? (process.env as { NX_API_BASE_URL?: string }).NX_API_BASE_URL
    : undefined;

const profileApiClient = new ApiClient({
  // Use API Gateway URL
  // Always use HTTPS through nginx proxy (required for Safari compatibility)
  // Direct API Gateway access (http://localhost:3000/api) can be set via NX_API_BASE_URL
  baseURL: envBaseURL || 'https://localhost/api',
  timeout: 30000,
  // ...
});
```

---

## Fix 7: Backend Helmet Configuration (Cross-Origin-Resource-Policy)

Safari strictly enforces the `Cross-Origin-Resource-Policy` header. By default, helmet sets this to `same-origin`, which blocks API responses from being used by cross-origin requests (the MFE frontend).

**Problem**: Default helmet configuration blocks Safari:
```typescript
// WRONG - Safari blocks API responses
app.use(helmet());
```

**Solution**: Configure helmet to allow cross-origin:
```typescript
// CORRECT - Safari compatible
app.use(
  helmet({
    // CRITICAL for Safari: Allow cross-origin requests from MFE frontend
    // Without this, Safari blocks API responses due to strict CORP enforcement
    crossOriginResourcePolicy: { policy: 'cross-origin' },
    // Allow popups for OAuth flows while maintaining security
    crossOriginOpenerPolicy: { policy: 'same-origin-allow-popups' },
  })
);
```

**Files that needed this fix**:
- `apps/api-gateway/src/middleware/security.ts`
- `apps/profile-service/src/main.ts`
- `apps/admin-service/src/main.ts`

---

## Fix 8: Content Security Policy

The CSP header in nginx includes all necessary sources for Module Federation:

**File**: `nginx/nginx.conf`

```nginx
add_header Content-Security-Policy "
  default-src 'self';
  script-src 'self' 'unsafe-inline' 'unsafe-eval'
    http://localhost:4200 http://localhost:4201 http://localhost:4202
    http://localhost:4203 http://localhost:4204;
  connect-src 'self' wss: ws: https:
    http://localhost:4200 http://localhost:4201 http://localhost:4202
    http://localhost:4203 http://localhost:4204;
  style-src 'self' 'unsafe-inline';
  img-src 'self' data: https: http:;
  font-src 'self' data:;
  frame-src 'self';
  frame-ancestors 'self';
" always;
```

---

## Fix 9: HMR WebSocket Configuration

Hot Module Replacement WebSocket connections must be configured to work through nginx in HTTPS mode:

**Files**: All `rspack.config.js` files

```javascript
devServer: {
  client: {
    logging: 'warn',
    overlay: {
      errors: true,
      warnings: false,
    },
    // HMR WebSocket configuration for HTTPS mode
    webSocketURL: process.env.NX_HTTPS_MODE === 'true'
      ? {
          protocol: 'wss',
          hostname: 'localhost',
          port: 443,
          pathname: '/hmr/shell', // or /hmr/auth, /hmr/payments, etc.
        }
      : {
          protocol: 'ws',
          hostname: 'localhost',
          port: 4200, // respective port for each MFE
          pathname: '/ws',
        },
  },
},
```

---

## Fix 10: Self-Signed Certificate Trust

For local development with Safari, the self-signed certificate must be trusted in macOS Keychain:

### Option A: Keychain Access (Recommended)
1. Open **Keychain Access** on macOS
2. Drag `nginx/ssl/self-signed.crt` into the **"login"** keychain
3. Double-click the certificate
4. Expand **"Trust"** section
5. Set **"When using this certificate"** to **"Always Trust"**
6. Close and enter your password

### Option B: Safari Warning Dialog
1. Navigate to `https://localhost` in Safari
2. Click **"Show Details"**
3. Click **"visit this website"**
4. Enter your password to trust the certificate

---

## Troubleshooting Safari Issues

### MFE Remote Entries Not Loading

1. **Verify nginx MFE proxy routes work**:
   ```bash
   curl -s -k -I "https://localhost/mfe/auth/remoteEntry.js"
   # Should return HTTP/2 200

   curl -s -k -I "https://localhost/mfe/profile/remoteEntry.js"
   # Should return HTTP/2 200
   ```

2. **Check Safari Developer Console**:
   - Safari > Develop > Show Web Inspector
   - Network tab: Look for blocked requests or CORS errors
   - Console tab: Look for mixed content or security policy errors

3. **Verify HTTPS mode is active**:
   ```bash
   # In the terminal running pnpm dev:all, look for:
   # [Shell rspack.config.js] NX_HTTPS_MODE: true
   ```

### API Calls Failing After Login

1. **Check Cross-Origin-Resource-Policy header**:
   ```bash
   curl -s -k -I "https://localhost/api/profile" | grep -i "cross-origin"
   # Should show:
   # cross-origin-resource-policy: cross-origin
   # cross-origin-opener-policy: same-origin-allow-popups
   ```

2. **Verify API URL is using HTTPS**:
   - Open Safari Developer Console > Network tab
   - Look at the API request URL - it should be `https://localhost/api/...`
   - If it shows `http://localhost:3000/api/...`, the API client fallback URL needs fixing

### Mixed Content Errors

If you see "Mixed Content" errors in Safari console:
1. Ensure you started with `pnpm dev:all` (not `pnpm dev:mf`)
2. Check that `NX_HTTPS_MODE=true` is set
3. Verify all API client files use `https://localhost/api` as default

### Certificate Errors

1. **Clear Safari cache**: Cmd+Option+E
2. **Remove website data**: Safari > Settings > Privacy > Manage Website Data > Remove localhost
3. **Re-trust certificate**: Follow the Keychain Access steps above

---

## Development Modes

| Mode | Command | Use Case | Safari Compatible |
|------|---------|----------|-------------------|
| HTTPS | `pnpm dev:all` | Cross-browser testing, Safari | Yes |
| HTTP | `pnpm dev:mf` | Quick development in Chrome/Firefox | No |

---

## Architecture Diagram

```
HTTPS Mode (Safari-compatible):

┌─────────────────────────────────────────────────────────────────┐
│                        Browser (Safari)                          │
│  https://localhost/                                              │
│                                                                  │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │ Shell App                                                    ││
│  │   └── import('authMfe/SignIn')                              ││
│  │       └── Loads https://localhost/mfe/auth/remoteEntry.js   ││
│  │           └── Chunks: https://localhost/mfe/auth/*.chunk.js ││
│  │                                                              ││
│  │   └── API calls to https://localhost/api/*                  ││
│  └─────────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                     nginx (HTTPS :443)                           │
│                                                                  │
│  Route Handling:                                                 │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │ /                  → http://shell_app:4200                  ││
│  │ /api/*             → http://api_gateway:3000                ││
│  │ /mfe/auth/*        → http://auth_mfe:4201     (path strip)  ││
│  │ /mfe/payments/*    → http://payments_mfe:4202 (path strip)  ││
│  │ /mfe/admin/*       → http://admin_mfe:4203    (path strip)  ││
│  │ /mfe/profile/*     → http://profile_mfe:4204  (path strip)  ││
│  │ /hmr/shell         → ws://shell_app:4200/ws                 ││
│  │ /hmr/auth          → ws://auth_mfe:4201/ws                  ││
│  └─────────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────────┘
                              │
              ┌───────────────┼───────────────┐
              ▼               ▼               ▼
┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐
│  MFE Dev        │ │  API Gateway    │ │  Backend        │
│  Servers (HTTP) │ │  (HTTP :3000)   │ │  Services       │
│                 │ │                 │ │                 │
│  Shell   :4200  │ │  Routes to:     │ │  Auth    :3001  │
│  Auth    :4201  │ │  - Auth Service │ │  Payments:3002  │
│  Payments:4202  │ │  - Payments Svc │ │  Admin   :3003  │
│  Admin   :4203  │ │  - Admin Svc    │ │  Profile :3004  │
│  Profile :4204  │ │  - Profile Svc  │ │                 │
└─────────────────┘ └─────────────────┘ └─────────────────┘
```

---

## Summary of All Safari Fixes

| Fix | File(s) | Change |
|-----|---------|--------|
| 1. HTTPS Mode | `package.json` scripts | `NX_HTTPS_MODE=true` |
| 2. MFE Proxy Routes | `nginx/nginx.conf` | `/mfe/{name}/*` routes with regex |
| 3. Dynamic Remote URLs | `apps/shell/rspack.config.js` | `getRemoteUrl()` helper |
| 4. crossOriginLoading | All `rspack.config.js` | `crossOriginLoading: 'anonymous'` |
| 5. Dev Server Headers | All `rspack.config.js` | COOP/CORP headers |
| 6. API Client URLs | All MFE `api/*.ts` files | Default to `https://localhost/api` |
| 7. Backend Helmet | API Gateway + Services | `crossOriginResourcePolicy: 'cross-origin'` |
| 8. CSP Headers | `nginx/nginx.conf` | Include localhost ports |
| 9. HMR WebSocket | All `rspack.config.js` | wss:// in HTTPS mode |
| 10. Certificate Trust | macOS Keychain | Trust self-signed cert |

All fixes are required for Safari to work correctly. Missing any single fix can cause Safari to fail while other browsers work fine.
