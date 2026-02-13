# CD Implementation Plan - POC Demo (Railway + Vercel)

**Created:** February 13, 2026
**Updated:** February 13, 2026
**Status:** Ready to Start 🚀
**Purpose:** Low-cost deployment for stakeholder demo
**Estimated Monthly Cost:** $20-40
**Quality Score:** 9.4/10 (Principal Architect Review - Round 2)

---

## Overview

This document provides a complete implementation guide for deploying the MFE Payments System to **Railway** (backend) and **Vercel** (frontend) for POC demonstration purposes.

### Why This Setup?

| Factor                | Benefit                             |
| --------------------- | ----------------------------------- |
| **Cost**              | ~$20-40/mo vs ~$420/mo (AWS)        |
| **Setup Time**        | Hours, not weeks                    |
| **No Sleep Delays**   | Backend always responsive for demos |
| **Familiar Frontend** | You already know Vercel             |
| **Full Architecture** | All 11 services + 4 databases       |
| **Easy Migration**    | Can move to AWS after approval      |

### What's NOT Included in This POC

This POC deployment is optimized for demo purposes. The following production features are intentionally excluded:

| Feature                  | Status | Notes                           |
| ------------------------ | ------ | ------------------------------- |
| Autoscaling              | ❌     | Manual scaling only             |
| WAF/DDoS Protection      | ❌     | Basic platform protection only  |
| Multi-Region             | ❌     | Single region deployment        |
| HA Database              | ❌     | Single instance per DB          |
| Blue/Green Deploy        | ❌     | Rolling updates only            |
| Zero-Downtime Deploy     | ❌     | Brief downtime during deploys   |
| Service Mesh             | ❌     | Direct service-to-service calls |
| Production Observability | ❌     | Basic metrics only              |

These features will be implemented in the AWS production deployment after stakeholder approval.

### Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              VERCEL (Frontend)                              │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌─────────────┐           │
│  │    Shell    │ │  Auth MFE   │ │Payments MFE │ │  Admin MFE  │ ...       │
│  │   (Host)    │ │  (Remote)   │ │  (Remote)   │ │  (Remote)   │           │
│  └─────────────┘ └─────────────┘ └─────────────┘ └─────────────┘           │
└───────────────────────────────────┬─────────────────────────────────────────┘
                                    │ HTTPS API calls
                                    ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                             RAILWAY (Backend)                               │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                         API Gateway (3000)                          │   │
│  └───────────────────────────────────┬─────────────────────────────────┘   │
│                                      │                                      │
│  ┌───────────────┐ ┌───────────────┐ ┌───────────────┐ ┌───────────────┐   │
│  │ Auth Service  │ │Payments Svc   │ │ Admin Service │ │Profile Service│   │
│  │    (3001)     │ │    (3002)     │ │    (3003)     │ │    (3004)     │   │
│  └───────┬───────┘ └───────┬───────┘ └───────┬───────┘ └───────┬───────┘   │
│          │                 │                 │                 │            │
│  ┌───────▼───────┐ ┌───────▼───────┐ ┌───────▼───────┐ ┌───────▼───────┐   │
│  │   auth_db     │ │  payments_db  │ │   admin_db    │ │  profile_db   │   │
│  │ (PostgreSQL)  │ │ (PostgreSQL)  │ │ (PostgreSQL)  │ │ (PostgreSQL)  │   │
│  └───────────────┘ └───────────────┘ └───────────────┘ └───────────────┘   │
│                                                                             │
│  ┌───────────────────────────────┐ ┌───────────────────────────────────┐   │
│  │            Redis              │ │           RabbitMQ                │   │
│  │        (Rate Limiting)        │ │        (Event Bus)                │   │
│  └───────────────────────────────┘ └───────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Services Summary

| Type         | Service          | Platform | Notes                         |
| ------------ | ---------------- | -------- | ----------------------------- |
| **Frontend** | Shell            | Vercel   | Host app, loads remotes       |
| **Frontend** | Auth MFE         | Vercel   | Separate project              |
| **Frontend** | Payments MFE     | Vercel   | Separate project              |
| **Frontend** | Admin MFE        | Vercel   | Separate project              |
| **Frontend** | Profile MFE      | Vercel   | Separate project              |
| **Backend**  | API Gateway      | Railway  | Entry point for all API calls |
| **Backend**  | Auth Service     | Railway  | + PostgreSQL database         |
| **Backend**  | Payments Service | Railway  | + PostgreSQL database         |
| **Backend**  | Admin Service    | Railway  | + PostgreSQL database         |
| **Backend**  | Profile Service  | Railway  | + PostgreSQL database         |
| **Infra**    | Redis            | Railway  | Rate limiting, caching        |
| **Infra**    | RabbitMQ         | Railway  | Event-driven messaging        |

---

## Prerequisites

Before starting, ensure you have:

- [ ] GitHub repository access
- [ ] Railway account (https://railway.app) - sign up with GitHub
- [ ] Vercel account (https://vercel.com) - you already have this
- [ ] Local development environment working (`pnpm dev:frontend` or `pnpm dev:frontend:https` runs successfully)

---

## Phase 1: Railway Account Setup

**Status:** 🔲 Not Started
**Estimated Time:** 30 minutes

### 1.1 Create Railway Account

- [ ] Go to https://railway.app
- [ ] Sign up with GitHub (recommended for easy repo access)
- [ ] Verify email
- [ ] You'll get $5 trial credit automatically

### 1.2 Install Railway CLI (Optional but Recommended)

```bash
# macOS
brew install railway

# Or via npm
npm install -g @railway/cli

# Login
railway login
```

- [ ] Install Railway CLI
- [ ] Run `railway login` to authenticate

### 1.3 Create Railway Project

- [ ] Click "New Project" in Railway dashboard
- [ ] Select "Empty Project"
- [ ] Name it: `mfe-payments-poc`

**Phase 1 Completion Criteria:**

- [ ] Railway account created
- [ ] CLI installed and authenticated
- [ ] Empty project created

---

## Phase 2: Railway Backend Deployment

**Status:** 🔲 Not Started
**Estimated Time:** 2-3 hours

### 2.1 Create PostgreSQL Databases

Railway provides PostgreSQL as a service. Create 4 databases:

- [ ] In Railway project, click "New" → "Database" → "PostgreSQL"
- [ ] Name: `auth-db`
- [ ] Repeat for `payments-db`, `admin-db`, `profile-db`

For each database, note the connection details:

- `DATABASE_URL` (automatically provided by Railway)

### 2.2 Create Redis Instance

- [ ] Click "New" → "Database" → "Redis"
- [ ] Name: `redis`
- [ ] Note the `REDIS_URL` variable

### 2.3 Create RabbitMQ Instance

Railway doesn't have native RabbitMQ, so we'll use CloudAMQP add-on:

**CloudAMQP (Free tier - Required)**

> ⚠️ **Important:** Do NOT skip RabbitMQ. The event bus is critical for maintaining architectural integrity and service decoupling. Removing it creates drift between POC and production.

- [ ] Go to https://www.cloudamqp.com/
- [ ] Create free account (Little Lemur plan - free)
- [ ] Create instance in region closest to Railway (likely US)
- [ ] Copy the AMQP URL

**If demo doesn't require event-driven features:**

- Keep RabbitMQ connected
- Reduce event topics if needed
- Stub consumers (log only) if needed
- Keep event publishing path active

This ensures the POC architecture matches production.

### 2.4 Deploy Backend Services

For each backend service, we'll deploy from GitHub:

#### API Gateway

- [ ] In Railway project, click "New" → "GitHub Repo"
- [ ] Select your repository
- [ ] Click "Add Service"
- [ ] Configure:
  - **Root Directory:** `apps/api-gateway`
  - **Build Command:** `pnpm install --frozen-lockfile && pnpm nx build api-gateway --configuration=production`
  - **Start Command:** `node dist/apps/api-gateway/main.js`

> **Note:** Using `--frozen-lockfile` ensures reproducible builds and faster dependency resolution.

- [ ] Add environment variables (click on service → Variables):

```
PORT=3000
NODE_ENV=production
JWT_SECRET=<generate-secure-random-string>
JWT_EXPIRES_IN=15m
REFRESH_TOKEN_EXPIRES_IN=7d
REDIS_URL=${{redis.REDIS_URL}}
CORS_ORIGINS=https://your-vercel-domain.vercel.app
AUTH_SERVICE_URL=http://auth-service.railway.internal:3001
PAYMENTS_SERVICE_URL=http://payments-service.railway.internal:3002
ADMIN_SERVICE_URL=http://admin-service.railway.internal:3003
PROFILE_SERVICE_URL=http://profile-service.railway.internal:3004
REQUEST_TIMEOUT_MS=5000
RETRY_ATTEMPTS=1
```

> **Timeout/Retry Policy:** Gateway uses 5-second timeout and 1 retry attempt to prevent cascading failures during demo.

> **Contract Validation:** Gateway enforces OpenAPI/schema validation for downstream service responses (POC-level validation enabled). This provides contract safety and schema drift detection.

- [ ] Generate domain: Settings → Generate Domain
- [ ] Note the public URL (e.g., `api-gateway-production-xxxx.up.railway.app`)

#### Auth Service

- [ ] Click "New" → "GitHub Repo" → Select same repo
- [ ] Configure:
  - **Root Directory:** `apps/auth-service`
  - **Build Command:** `pnpm install --frozen-lockfile && pnpm db:auth:generate && pnpm nx build auth-service --configuration=production`
  - **Start Command:** `npx prisma migrate deploy --schema=apps/auth-service/prisma/schema.prisma && node dist/apps/auth-service/main.js`

- [ ] Add environment variables:

```
PORT=3001
NODE_ENV=production
DATABASE_URL=${{auth-db.DATABASE_URL}}
JWT_SECRET=<same-as-api-gateway>
```

#### Payments Service

- [ ] Click "New" → "GitHub Repo" → Select same repo
- [ ] Configure:
  - **Root Directory:** `apps/payments-service`
  - **Build Command:** `pnpm install --frozen-lockfile && pnpm db:payments:generate && pnpm nx build payments-service --configuration=production`
  - **Start Command:** `npx prisma migrate deploy --schema=apps/payments-service/prisma/schema.prisma && node dist/apps/payments-service/main.js`

- [ ] Add environment variables:

```
PORT=3002
NODE_ENV=production
DATABASE_URL=${{payments-db.DATABASE_URL}}
RAZORPAY_KEY_ID=<your-razorpay-test-key>
RAZORPAY_KEY_SECRET=<your-razorpay-test-secret>
```

#### Admin Service

- [ ] Click "New" → "GitHub Repo" → Select same repo
- [ ] Configure:
  - **Root Directory:** `apps/admin-service`
  - **Build Command:** `pnpm install --frozen-lockfile && pnpm db:admin:generate && pnpm nx build admin-service --configuration=production`
  - **Start Command:** `npx prisma migrate deploy --schema=apps/admin-service/prisma/schema.prisma && node dist/apps/admin-service/main.js`

- [ ] Add environment variables:

```
PORT=3003
NODE_ENV=production
DATABASE_URL=${{admin-db.DATABASE_URL}}
```

#### Profile Service

- [ ] Click "New" → "GitHub Repo" → Select same repo
- [ ] Configure:
  - **Root Directory:** `apps/profile-service`
  - **Build Command:** `pnpm install --frozen-lockfile && pnpm db:profile:generate && pnpm nx build profile-service --configuration=production`
  - **Start Command:** `npx prisma migrate deploy --schema=apps/profile-service/prisma/schema.prisma && node dist/apps/profile-service/main.js`

- [ ] Add environment variables:

```
PORT=3004
NODE_ENV=production
DATABASE_URL=${{profile-db.DATABASE_URL}}
```

### 2.5 Configure Private Networking

Railway services can communicate via internal DNS:

- [ ] Update API Gateway service URLs to use Railway internal networking:

```
AUTH_SERVICE_URL=http://auth-service.railway.internal:3001
PAYMENTS_SERVICE_URL=http://payments-service.railway.internal:3002
ADMIN_SERVICE_URL=http://admin-service.railway.internal:3003
PROFILE_SERVICE_URL=http://profile-service.railway.internal:3004
```

### 2.6 Verify Health Endpoints

Each service exposes standardized health endpoints:

| Endpoint  | Purpose                              |
| --------- | ------------------------------------ |
| `/health` | Process alive check                  |
| `/ready`  | Dependencies ready (DB, Redis, etc.) |
| `/live`   | Service responsive                   |

- [ ] Test each service's health endpoints:

```bash
# API Gateway
curl https://<api-gateway-url>/health
curl https://<api-gateway-url>/ready

# Each backend service (via internal network from gateway)
# These are verified by the gateway's health aggregation
```

### 2.7 Test Backend Deployment

- [ ] Open API Gateway URL in browser
- [ ] Test health endpoint: `https://<api-gateway-url>/health`
- [ ] Test API docs: `https://<api-gateway-url>/api-docs`
- [ ] Verify all services are running (check Railway dashboard)

**Phase 2 Completion Criteria:**

- [ ] All 4 PostgreSQL databases created and running
- [ ] Redis instance running
- [ ] RabbitMQ configured via CloudAMQP
- [ ] All 5 backend services deployed and healthy
- [ ] API Gateway accessible via public URL
- [ ] Health endpoints responding (/health, /ready, /live)

---

## Phase 3: Vercel Frontend Deployment

**Status:** 🔲 Not Started
**Estimated Time:** 1-2 hours

### 3.1 Prepare Frontend for Production

Before deploying, update the API base URL in the frontend:

- [ ] Create/update environment variables for production

### 3.2 Deploy Shell App (Host)

The Shell app is the main entry point that loads remote MFEs.

- [ ] Go to https://vercel.com/new
- [ ] Import your GitHub repository
- [ ] Configure project:
  - **Framework Preset:** Other
  - **Root Directory:** `apps/shell`
  - **Build Command:** `cd ../.. && pnpm install --frozen-lockfile && pnpm build:remotes && pnpm nx build shell --configuration=production`
  - **Output Directory:** `dist/apps/shell`
  - **Install Command:** `pnpm install --frozen-lockfile`

- [ ] Add environment variables:

```
NX_API_BASE_URL=https://<api-gateway-url>.up.railway.app/api
NX_AUTH_MFE_URL=https://<auth-mfe-vercel-url>
NX_PAYMENTS_MFE_URL=https://<payments-mfe-vercel-url>
NX_ADMIN_MFE_URL=https://<admin-mfe-vercel-url>
NX_PROFILE_MFE_URL=https://<profile-mfe-vercel-url>
```

- [ ] Deploy

**MFE Architecture Rules:**

- Shell (host) controls all navigation - MFEs must not route directly to each other
- No cross-MFE imports allowed - only shared libraries
- All inter-MFE communication goes through the host or shared event bus

**Note:** Shell depends on remote MFEs being deployed first. You may need to:

1. Deploy MFEs first (without complete URLs)
2. Get their URLs
3. Update Shell environment variables
4. Redeploy Shell

### 3.3 Deploy Auth MFE

- [ ] Go to https://vercel.com/new
- [ ] Import same repository
- [ ] Configure:
  - **Root Directory:** `apps/auth-mfe`
  - **Build Command:** `cd ../.. && pnpm install --frozen-lockfile && pnpm nx build auth-mfe --configuration=production`
  - **Output Directory:** `dist/apps/auth-mfe`

- [ ] Add environment variables:

```
NX_API_BASE_URL=https://<api-gateway-url>.up.railway.app/api
```

- [ ] Deploy
- [ ] Note the deployment URL

### 3.4 Deploy Payments MFE

- [ ] Go to https://vercel.com/new
- [ ] Import same repository
- [ ] Configure:
  - **Root Directory:** `apps/payments-mfe`
  - **Build Command:** `cd ../.. && pnpm install --frozen-lockfile && pnpm nx build payments-mfe --configuration=production`
  - **Output Directory:** `dist/apps/payments-mfe`

- [ ] Add environment variables:

```
NX_API_BASE_URL=https://<api-gateway-url>.up.railway.app/api
```

- [ ] Deploy
- [ ] Note the deployment URL

### 3.5 Deploy Admin MFE

- [ ] Go to https://vercel.com/new
- [ ] Import same repository
- [ ] Configure:
  - **Root Directory:** `apps/admin-mfe`
  - **Build Command:** `cd ../.. && pnpm install --frozen-lockfile && pnpm nx build admin-mfe --configuration=production`
  - **Output Directory:** `dist/apps/admin-mfe`

- [ ] Add environment variables:

```
NX_API_BASE_URL=https://<api-gateway-url>.up.railway.app/api
```

- [ ] Deploy
- [ ] Note the deployment URL

### 3.6 Deploy Profile MFE

- [ ] Go to https://vercel.com/new
- [ ] Import same repository
- [ ] Configure:
  - **Root Directory:** `apps/profile-mfe`
  - **Build Command:** `cd ../.. && pnpm install --frozen-lockfile && pnpm nx build profile-mfe --configuration=production`
  - **Output Directory:** `dist/apps/profile-mfe`

- [ ] Add environment variables:

```
NX_API_BASE_URL=https://<api-gateway-url>.up.railway.app/api
```

- [ ] Deploy
- [ ] Note the deployment URL

### 3.7 Configure MFE Manifest for Dynamic Remote Resolution

Instead of hardcoding MFE URLs in environment variables, use a manifest file for better rollback flexibility and version control.

#### Create MFE Manifest

- [ ] Create `public/mfe-manifest.json` in the Shell app:

```json
{
  "version": "1.0.0",
  "updated": "2026-02-13T00:00:00Z",
  "remotes": {
    "auth": {
      "url": "https://auth-mfe-xxx.vercel.app/remoteEntry.js",
      "version": "1.0.0"
    },
    "payments": {
      "url": "https://payments-mfe-xxx.vercel.app/remoteEntry.js",
      "version": "1.0.0"
    },
    "admin": {
      "url": "https://admin-mfe-xxx.vercel.app/remoteEntry.js",
      "version": "1.0.0"
    },
    "profile": {
      "url": "https://profile-mfe-xxx.vercel.app/remoteEntry.js",
      "version": "1.0.0"
    }
  }
}
```

#### Why Manifest-Based Resolution?

| Benefit                   | Description                                            |
| ------------------------- | ------------------------------------------------------ |
| **Version Pinning**       | Each MFE version is tracked in the manifest            |
| **Runtime Swap**          | Update manifest to switch MFE versions without rebuild |
| **Easier Rollback**       | Revert manifest to previous MFE versions instantly     |
| **Reduced Coupling**      | Shell doesn't need rebuild when MFE URLs change        |
| **Platform Alignment**    | Follows MFE best practices for remote resolution       |
| **Audit Trail**           | Manifest history shows what versions were deployed     |

#### Shell Loads Manifest at Runtime

The Shell app should load the manifest at startup and resolve remote URLs dynamically:

```typescript
// apps/shell/src/bootstrap.ts
async function loadMfeManifest() {
  const response = await fetch('/mfe-manifest.json');
  const manifest = await response.json();
  return manifest.remotes;
}
```

> **Note:** For the initial POC, you can still use environment variables as a fallback. The manifest approach can be adopted incrementally.

### 3.8 Update Shell with MFE URLs (Fallback Method)

If not using the manifest approach yet, update Shell's environment variables:

- [ ] Go to Shell project in Vercel
- [ ] Settings → Environment Variables
- [ ] Update:

```
NX_AUTH_MFE_URL=https://auth-mfe-xxx.vercel.app
NX_PAYMENTS_MFE_URL=https://payments-mfe-xxx.vercel.app
NX_ADMIN_MFE_URL=https://admin-mfe-xxx.vercel.app
NX_PROFILE_MFE_URL=https://profile-mfe-xxx.vercel.app
```

- [ ] Trigger redeploy: Deployments → Redeploy

### 3.9 Update CORS on Backend

- [ ] Go to Railway → API Gateway → Variables
- [ ] Update `CORS_ORIGINS` with all Vercel URLs:

```
CORS_ORIGINS=https://shell-xxx.vercel.app,https://auth-mfe-xxx.vercel.app,https://payments-mfe-xxx.vercel.app,https://admin-mfe-xxx.vercel.app,https://profile-mfe-xxx.vercel.app
```

- [ ] Service will auto-redeploy

### 3.10 Configure Cache Headers (Important)

Vercel caching can serve stale `remoteEntry.js` files. Configure cache headers:

- [ ] Create `vercel.json` in each MFE root directory:

```json
{
  "headers": [
    {
      "source": "/remoteEntry.js",
      "headers": [
        {
          "key": "Cache-Control",
          "value": "no-cache, no-store, must-revalidate"
        }
      ]
    },
    {
      "source": "/(.*)",
      "headers": [
        {
          "key": "Cache-Control",
          "value": "public, max-age=31536000, immutable"
        }
      ]
    }
  ]
}
```

This ensures:

- `remoteEntry.js` is always fresh (MFE manifest)
- Other assets use long-term caching with content hashes

### 3.11 Test Frontend Deployment

- [ ] Open Shell URL in browser
- [ ] Verify all MFEs load (check Network tab for remoteEntry.js)
- [ ] Test login flow
- [ ] Test navigation between MFEs
- [ ] Test API calls
- [ ] Verify remoteEntry.js has no-cache headers (Network tab → Headers)

**Phase 3 Completion Criteria:**

- [ ] All 5 frontend projects deployed to Vercel
- [ ] Shell loads all remote MFEs successfully
- [ ] Module Federation working (check console for errors)
- [ ] API calls succeed (check Network tab)
- [ ] CORS configured correctly
- [ ] Cache headers configured for remoteEntry.js

---

## Phase 4: Configure Automatic Deployments

**Status:** 🔲 Not Started
**Estimated Time:** 30 minutes

### 4.1 Railway Auto-Deploy

Railway automatically deploys on push to main by default.

- [ ] Verify auto-deploy is enabled for all services:
  - Go to each service → Settings → Source
  - Confirm "Automatic Deploys" is ON
  - Confirm branch is `main`

### 4.2 Vercel Auto-Deploy

Vercel also auto-deploys by default.

- [ ] Verify for each project:
  - Go to Project → Settings → Git
  - Confirm Production Branch is `main`
  - Confirm Auto-Deploy is ON

### 4.3 Test Auto-Deploy

- [ ] Make a small change to a backend service
- [ ] Push to `main`
- [ ] Verify Railway redeploys the affected service
- [ ] Make a small change to a frontend MFE
- [ ] Push to `main`
- [ ] Verify Vercel redeploys the affected project

**Phase 4 Completion Criteria:**

- [ ] Push to `main` triggers Railway deployments
- [ ] Push to `main` triggers Vercel deployments
- [ ] Deployments complete without manual intervention

---

## Phase 5: Monitoring and Debugging

**Status:** 🔲 Not Started
**Estimated Time:** 30 minutes

### 5.1 Railway Monitoring

- [ ] View logs: Click service → "Logs" tab
- [ ] View metrics: Click service → "Metrics" tab
- [ ] Set up alerts (optional):
  - Click project → Settings → Integrations
  - Connect Slack/Discord for deployment notifications

### 5.2 Vercel Monitoring

- [ ] View deployment logs: Project → Deployments → Click deployment
- [ ] View function logs: Project → Logs
- [ ] Enable Vercel Analytics (optional): Project → Analytics

### 5.3 Error Tracking (Optional)

If you have Sentry configured:

- [ ] Update `SENTRY_DSN` in Railway environment variables
- [ ] Update `NX_SENTRY_DSN` in Vercel environment variables
- [ ] Verify errors appear in Sentry dashboard

**Phase 5 Completion Criteria:**

- [ ] Can view logs for all services
- [ ] Can view basic metrics
- [ ] Know how to debug deployment issues

---

## Phase 6: Demo Preparation

**Status:** 🔲 Not Started
**Estimated Time:** 1 hour

### 6.1 Create Demo User Accounts

- [ ] Access the deployed application
- [ ] Register test accounts:
  - Admin user (for admin panel demo)
  - Customer user (for payment flow demo)
  - Vendor user (if applicable)

### 6.2 Seed Demo Data (Optional)

If your backend supports seeding:

- [ ] SSH/exec into auth-service: `railway run --service auth-service pnpm db:auth:seed`
- [ ] Or use the API to create demo data

### 6.3 Prepare Demo Script

Document the demo flow:

- [ ] Login as customer
- [ ] View dashboard
- [ ] Make a payment (test mode)
- [ ] View payment history
- [ ] Switch to admin
- [ ] View admin dashboard
- [ ] Show user management

### 6.4 Pre-Demo Warmup Checklist

Cold starts can affect demo experience. Run this warmup 10-15 minutes before the demo:

- [ ] **Hit each MFE route once:**
  - Visit Shell app home page
  - Navigate to Auth (login page)
  - Navigate to Payments
  - Navigate to Admin
  - Navigate to Profile

- [ ] **Trigger each major API endpoint once:**
  - `GET /api/health` (Gateway health)
  - `GET /api/auth/me` (with valid token)
  - `GET /api/payments` (list payments)
  - `GET /api/admin/users` (admin endpoint)

- [ ] **Warm backend connections:**
  - Verify all DB connections are active (check `/ready` endpoints)
  - Warm Redis cache with a few operations
  - Verify RabbitMQ connection is active

- [ ] **Perform dry run:**
  - One complete login → logout flow
  - One complete payment creation flow
  - One admin panel navigation

> **Why Warmup Matters:**
> - Eliminates cold-start latency (Railway services may sleep)
> - Warms database connection pools
> - Populates Redis cache with common queries
> - Improves perceived performance during demo

### 6.5 Test Full Demo Flow

- [ ] Run through entire demo script
- [ ] Note any issues or slow responses
- [ ] Verify all features work as expected

**Phase 6 Completion Criteria:**

- [ ] Demo accounts created
- [ ] Demo data seeded
- [ ] Pre-demo warmup completed
- [ ] Full demo flow tested and working
- [ ] Demo script prepared

---

## Rollback Procedures

If something goes wrong during the demo, use these rollback procedures:

### Railway Rollback

1. Go to the affected service in Railway dashboard
2. Click "Deployments" tab
3. Find the last working deployment
4. Click the "..." menu → "Redeploy"
5. Wait for deployment to complete

```bash
# Or via CLI
railway rollback --service <service-name>
```

### Vercel Rollback

1. Go to the affected project in Vercel dashboard
2. Click "Deployments" tab
3. Find the last working deployment
4. Click "..." menu → "Promote to Production"
5. Deployment is instant

```bash
# Or via CLI
vercel rollback <deployment-url>
```

### Database Rollback

If a migration caused issues:

```bash
# Connect to Railway service
railway run --service <service-name> npx prisma migrate reset --force

# Re-run migrations
railway run --service <service-name> npx prisma migrate deploy
```

> 🚨 **DATA DESTRUCTIVE — USE ONLY IF POC DATA LOSS IS ACCEPTABLE**
>
> Database reset will **permanently DELETE all data** in the target database. This operation is irreversible. Only use in POC/demo environments where data loss is acceptable. Never run in production.

---

## Secret Management Policy

### Principles

1. **Never commit secrets** - All secrets stored only in platform environment variables
2. **Use platform references** - Railway: `${{service.VAR}}`, Vercel: Environment Variables UI
3. **Rotate after POC** - Change all secrets before production migration
4. **Designated owner** - One person manages secrets for the POC

### Secret Inventory

| Secret        | Location                 | Owner    |
| ------------- | ------------------------ | -------- |
| JWT_SECRET    | Railway                  | Operator |
| DATABASE_URLs | Railway (auto-generated) | Platform |
| REDIS_URL     | Railway (auto-generated) | Platform |
| RABBITMQ_URL  | CloudAMQP                | Operator |
| RAZORPAY\_\*  | Railway                  | Operator |
| SENTRY_DSN    | Railway + Vercel         | Operator |

### Rotation Procedure (Post-POC)

1. Generate new JWT_SECRET
2. Update all services simultaneously
3. Invalidate existing sessions
4. Update RAZORPAY keys to production keys
5. Document changes

---

## Rate Limiting Configuration

The API Gateway implements rate limiting using Redis:

### Default Limits

| Endpoint                   | Limit        | Window     |
| -------------------------- | ------------ | ---------- |
| `/api/auth/login`          | 10 requests  | 15 minutes |
| `/api/auth/register`       | 5 requests   | 15 minutes |
| `/api/auth/refresh`        | 20 requests  | 15 minutes |
| `/api/*` (authenticated)   | 100 requests | 1 minute   |
| `/api/*` (unauthenticated) | 30 requests  | 1 minute   |

### Environment Variables

Add to API Gateway:

```
RATE_LIMIT_WINDOW_MS=60000
RATE_LIMIT_MAX_REQUESTS=100
AUTH_RATE_LIMIT_WINDOW_MS=900000
AUTH_RATE_LIMIT_MAX_REQUESTS=10
```

### Why Rate Limiting Matters for POC

- Prevents demo abuse
- Stops brute-force login attempts
- Handles accidental load spikes
- Demonstrates production-readiness to stakeholders

---

## Environment Variables Reference

### Railway - API Gateway

```bash
PORT=3000
NODE_ENV=production
JWT_SECRET=<secure-random-64-char-string>
JWT_EXPIRES_IN=15m
REFRESH_TOKEN_EXPIRES_IN=7d
REDIS_URL=${{redis.REDIS_URL}}
CORS_ORIGINS=<comma-separated-vercel-urls>
AUTH_SERVICE_URL=http://auth-service.railway.internal:3001
PAYMENTS_SERVICE_URL=http://payments-service.railway.internal:3002
ADMIN_SERVICE_URL=http://admin-service.railway.internal:3003
PROFILE_SERVICE_URL=http://profile-service.railway.internal:3004
RABBITMQ_URL=<cloudamqp-url-or-empty>
SENTRY_DSN=<optional>
```

### Railway - Backend Services

Each service needs:

```bash
PORT=<3001-3004>
NODE_ENV=production
DATABASE_URL=${{<service>-db.DATABASE_URL}}
JWT_SECRET=<same-as-api-gateway>
SENTRY_DSN=<optional>
```

### Vercel - Frontend

Each MFE needs:

```bash
NX_API_BASE_URL=https://<api-gateway>.up.railway.app/api
NX_SENTRY_DSN=<optional>
```

Shell additionally needs:

```bash
NX_AUTH_MFE_URL=https://<auth-mfe>.vercel.app
NX_PAYMENTS_MFE_URL=https://<payments-mfe>.vercel.app
NX_ADMIN_MFE_URL=https://<admin-mfe>.vercel.app
NX_PROFILE_MFE_URL=https://<profile-mfe>.vercel.app
```

---

## Troubleshooting

### Common Issues

| Issue                          | Diagnosis             | Solution                                                 |
| ------------------------------ | --------------------- | -------------------------------------------------------- |
| **Service won't start**        | Check logs in Railway | Fix build/start command, check env vars                  |
| **Database connection failed** | Wrong DATABASE_URL    | Use Railway's variable reference: `${{db.DATABASE_URL}}` |
| **CORS errors**                | Missing origin        | Add Vercel URLs to CORS_ORIGINS                          |
| **MFE won't load**             | Wrong remoteEntry URL | Check NX\_\*\_MFE_URL environment variables              |
| **API calls fail**             | Wrong API URL         | Check NX_API_BASE_URL in Vercel                          |
| **Prisma migration fails**     | Missing schema        | Ensure build command runs `db:generate`                  |
| **Module not found**           | Build issue           | Check root directory and build command                   |

### Useful Commands

```bash
# Railway CLI - View logs
railway logs --service api-gateway

# Railway CLI - Run command in service
railway run --service auth-service npx prisma studio

# Railway CLI - Get service URL
railway open

# Vercel CLI - View deployments
vercel ls

# Vercel CLI - View logs
vercel logs <deployment-url>
```

### Getting Help

- **Railway:** https://docs.railway.app
- **Vercel:** https://vercel.com/docs
- **Railway Discord:** https://discord.gg/railway
- **Vercel Support:** support.vercel.com

---

## Cost Tracking

### Railway Usage Dashboard

- Go to Railway project → Usage
- Monitor CPU hours, memory, egress
- Set spending limit in Settings → Billing

### Estimated Costs

| Resource                 | Estimated Monthly Cost |
| ------------------------ | ---------------------- |
| **5 Backend Services**   | $10-20 (usage-based)   |
| **4 PostgreSQL DBs**     | $5-10 (usage-based)    |
| **Redis**                | $2-5 (usage-based)     |
| **RabbitMQ (CloudAMQP)** | Free (Little Lemur)    |
| **Vercel (5 projects)**  | Free                   |
| **Total**                | **$17-35/month**       |

---

## Platform Rule Alignment

This POC deployment adheres to the established platform architecture rules:

| Rule                              | Status | Implementation                                      |
| --------------------------------- | ------ | --------------------------------------------------- |
| Host controls navigation          | ✅     | Shell orchestrates all routing, MFEs expose pages   |
| No cross-MFE imports              | ✅     | Only shared libraries allowed                       |
| Event bus present                 | ✅     | RabbitMQ via CloudAMQP (required, not optional)     |
| Service isolation                 | ✅     | Each service runs independently on Railway          |
| Separate DB per service           | ✅     | 4 PostgreSQL instances for bounded contexts         |
| Gateway orchestration             | ✅     | API Gateway handles routing, auth, rate limiting    |
| Rate limiting                     | ✅     | Redis-backed rate limits per endpoint               |
| Health endpoints                  | ✅     | `/health`, `/ready`, `/live` for each service       |
| Contract validation               | ✅     | Gateway validates OpenAPI schemas                   |
| Manifest-based remote resolution  | ✅     | MFE manifest for dynamic remote URL resolution      |

---

## Post-Demo: Migration to AWS

After stakeholder approval, migrate to AWS using the full production setup:

1. Keep Railway running during migration
2. Follow `docs/CD-IMPLEMENTATION-CHECKLIST.md` for AWS setup
3. Test AWS deployment alongside Railway
4. Switch DNS/URLs when ready
5. Decommission Railway

See: [CD-IMPLEMENTATION-CHECKLIST.md](./CD-IMPLEMENTATION-CHECKLIST.md) for AWS implementation details.

---

## Document History

| Version | Date       | Changes                                                                                                                                                                                           |
| ------- | ---------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1.2     | 2026-02-13 | Round 2 expert review: MFE manifest-based remote resolution, gateway contract validation, --configuration=production flag, pre-demo warmup checklist, platform rule alignment table, stronger DB reset warning |
| 1.1     | 2026-02-13 | Round 1 expert review: rollback procedures, secret management, rate limiting, health endpoints, cache busting, MFE architecture rules, POC exclusions                                            |
| 1.0     | 2026-02-13 | Initial POC deployment guide                                                                                                                                                                      |

---

**Next Action:** Start [Phase 1: Railway Account Setup](#phase-1-railway-account-setup)
