# CD Implementation Plan - POC Demo (Railway + Vercel)

**Created:** February 13, 2026
**Updated:** March 17, 2026
**Status:** Phase 2 Complete ✅ - Phase 3 Ready
**Purpose:** Low-cost deployment for stakeholder demo
**Estimated Monthly Cost:** $20-40
**Quality Score:** 9.4/10 (Principal Architect Review - Round 2)

---

## 📊 Current Progress Summary

| Phase | Status | Completion |
|-------|--------|------------|
| **Phase 1: Railway Account Setup** | ✅ Complete | 100% |
| **Phase 2: Railway Backend Deployment** | ✅ Complete | 100% |
| **Phase 3: Vercel Frontend Deployment** | ⏳ Ready to Start | 0% |
| **Phase 4: GitHub Actions CI/CD** | ⏳ Not Started | 0% |
| **Phase 5: Monitoring & Observability** | ⏳ Not Started | 0% |
| **Phase 6: Demo Preparation** | ⏳ Not Started | 0% |
| **Phase 7: Demo Video Recording** | ⏳ Not Started | 0% |

### ✅ Completed (March 17, 2026)

**Phase 1:**
- ✅ Railway Hobby plan activated
- ✅ Railway CLI installed and authenticated
- ✅ Project created: `payments-poc`
- ✅ CloudAMQP instance created (RabbitMQ)

**Phase 2 - Infrastructure:**
- ✅ PostgreSQL database: `auth-db`
- ✅ PostgreSQL database: `payments-db`
- ✅ PostgreSQL database: `admin-db`
- ✅ PostgreSQL database: `profile-db`
- ✅ Redis instance: `redis`
- ✅ All databases renamed and properly configured

**Phase 2 - Backend Services:**
- ✅ Auth Service deployed and running
- ✅ Payments Service deployed and running
- ✅ Admin Service deployed and running
- ✅ Profile Service deployed and running
- ✅ API Gateway deployed and running
- ✅ Auto-deploy configured (all services)
- ✅ Health endpoints verified

**Deployment Guide:** `docs/temp/RAILWAY-BACKEND-DEPLOYMENT-GUIDE.md` (✅ All services deployed)

### ⏳ Next Steps

**Phase 3 - Frontend Deployment:**
- Ready to deploy 5 frontend apps to Vercel
- API Gateway URL available for frontend configuration
- CORS will be updated after Vercel deployment

**Deployment Guide:** `docs/temp/VERCEL-FRONTEND-DEPLOYMENT-GUIDE.md`

### 📚 Documentation Ready

- ✅ Phase 2 deployment guide created
- ✅ Phase 3 deployment guide created
- ✅ Quick reference cheat sheet created
- ✅ Progress tracker created

---

## Overview

This document provides a complete implementation guide for deploying the MFE Payments System to **Railway** (backend) and **Vercel** (frontend) for POC demonstration purposes.

### Why This Setup?

| Factor                | Benefit                                             |
| --------------------- | --------------------------------------------------- |
| **Cost**              | ~$20-40/mo vs ~$420/mo (AWS)                        |
| **Setup Time**        | Hours, not weeks                                    |
| **Minimal Sleep**     | Configured to avoid sleep delays for demo workloads |
| **Familiar Frontend** | You already know Vercel                             |
| **Full Architecture** | All 11 services + 4 databases                       |
| **Easy Migration**    | Can move to AWS after approval                      |

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

```text
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

**Status:** ✅ Complete
**Completed:** March 16, 2026
**Time Taken:** 30 minutes (across multiple sessions)

### 1.1 Create Railway Account

- [x] Go to https://railway.app
- [x] Sign up with GitHub (recommended for easy repo access)
- [x] Verify email
- [x] Upgraded to Hobby plan (~$5/month)

### 1.2 Install Railway CLI (Optional but Recommended)

```bash
# Via npm (used for this project)
npm install -g @railway/cli

# Login
railway login
```

- [x] Install Railway CLI via npm
- [x] Run `railway login` to authenticate
- [x] Linked to project: `payments-poc`

### 1.3 Create Railway Project

- [x] Click "New Project" in Railway dashboard
- [x] Select "Empty Project"
- [x] Named: `payments-poc`

**Phase 1 Completion Criteria:**

- [x] Railway account created
- [x] CLI installed and authenticated
- [x] Empty project created
- [x] **Bonus:** CloudAMQP RabbitMQ instance created

---

## Phase 2: Railway Backend Deployment

**Status:** ✅ Complete
**Started:** March 16, 2026
**Completed:** March 17, 2026
**Time Taken:** ~1 day (including troubleshooting and fixes)

**Detailed Guide:** See `docs/temp/RAILWAY-BACKEND-DEPLOYMENT-GUIDE.md` for complete deployment reference.

### 2.1 Create PostgreSQL Databases ✅ COMPLETE

Railway provides PostgreSQL as a service. Create 4 databases:

- [x] In Railway project, click "New" → "Database" → "PostgreSQL"
- [x] Created and renamed: `auth-db`
- [x] Created and renamed: `payments-db`
- [x] Created and renamed: `admin-db`
- [x] Created and renamed: `profile-db`

All databases configured with:
- `DATABASE_URL` (automatically provided by Railway)
- PostgreSQL 17 with SSL
- 500MB volume per database

### 2.2 Create Redis Instance ✅ COMPLETE

- [x] Click "New" → "Database" → "Redis"
- [x] Created and renamed: `redis`
- [x] `REDIS_URL` variable available for API Gateway

### 2.3 Create RabbitMQ Instance ✅ COMPLETE

Railway doesn't have native RabbitMQ, so we'll use CloudAMQP add-on:

**CloudAMQP (Free tier - Required)**

> ⚠️ **Important:** Do NOT skip RabbitMQ. The event bus is critical for maintaining architectural integrity and service decoupling. Removing it creates drift between POC and production.

- [x] Go to https://www.cloudamqp.com/
- [x] Create free account (Little Lemur plan - free)
- [x] Create instance in region closest to Railway (US)
- [x] Copy the AMQP URL

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

```bash
PORT=3000
NODE_ENV=production
JWT_SECRET=<generate-secure-random-string>
JWT_EXPIRES_IN=15m
REFRESH_TOKEN_EXPIRES_IN=7d
REDIS_URL=${{redis.REDIS_URL}}
RABBITMQ_URL=<your-cloudamqp-url>
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
> **RabbitMQ:** Get your CloudAMQP URL from [Phase 2.3](#23-create-rabbitmq-instance).

- [ ] Generate domain: Settings → Generate Domain
- [ ] Note the public URL (e.g., `api-gateway-production-xxxx.up.railway.app`)

#### Auth Service

- [ ] Click "New" → "GitHub Repo" → Select same repo
- [ ] Configure:
  - **Root Directory:** `apps/auth-service`
  - **Build Command:** `pnpm install --frozen-lockfile && pnpm db:auth:generate && pnpm nx build auth-service --configuration=production`
  - **Start Command:** `npx prisma migrate deploy --schema=apps/auth-service/prisma/schema.prisma && node dist/apps/auth-service/main.js`

- [ ] Add environment variables:

```bash
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

```bash
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

```bash
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

```bash
PORT=3004
NODE_ENV=production
DATABASE_URL=${{profile-db.DATABASE_URL}}
```

### 2.5 Configure Private Networking

Railway services can communicate via internal DNS:

- [ ] Update API Gateway service URLs to use Railway internal networking:

```bash
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

**Infrastructure (✅ Complete):**
- [x] All 4 PostgreSQL databases created and running
- [x] Redis instance running
- [x] RabbitMQ configured via CloudAMQP

**Services (✅ Complete):**
- [x] All 5 backend services deployed and healthy
- [x] API Gateway accessible via public URL
- [x] Health endpoints responding (/health, /ready, /live)
- [x] Auto-deploy configured for all services
- [x] All services show SUCCESS status in Railway dashboard

**🎉 Phase 2 Complete!** All backend services are running successfully on Railway.

**📋 Next Action:** Proceed to Phase 3 - Deploy frontend to Vercel using `docs/temp/VERCEL-FRONTEND-DEPLOYMENT-GUIDE.md`.

---

## Phase 3: Vercel Frontend Deployment

**Status:** ⏳ Ready to Start
**Estimated Time:** 1-2 hours

**Detailed Guide:** See `docs/temp/VERCEL-FRONTEND-DEPLOYMENT-GUIDE.md` for complete step-by-step instructions.

**Prerequisites:**
- ✅ Phase 2 complete (all backend services deployed)
- ✅ API Gateway public URL available
- ✅ All health endpoints verified
- ✅ Auto-deploy configured on Railway

### 3.1 Prepare Frontend for Production

Before deploying, update the API base URL in the frontend:

- [ ] Create/update environment variables for production

### 3.2 Deploy Shell App (Host)

The Shell app is the main entry point that loads remote MFEs.

- [ ] Go to https://vercel.com/new
- [ ] Import your GitHub repository
- [ ] Configure project:
  - **Framework Preset:** Other
  - **Root Directory:** _(leave blank — do NOT set this)_
  - **Build Command:** `pnpm install --frozen-lockfile --ignore-scripts && pnpm exec nx run-many --target=build --projects=auth-mfe,payments-mfe,admin-mfe,profile-mfe --configuration=production --parallel && pnpm exec nx build shell --configuration=production`
  - **Output Directory:** `dist/apps/shell`
  - **Install Command:** _(leave blank)_

- [ ] Add environment variables:

```bash
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
  - **Root Directory:** _(leave blank)_
  - **Build Command:** `pnpm install --frozen-lockfile --ignore-scripts && pnpm exec nx build auth-mfe --configuration=production`
  - **Output Directory:** `dist/apps/auth-mfe`
  - **Install Command:** _(leave blank)_

- [ ] Add environment variables:

```bash
NX_API_BASE_URL=https://<api-gateway-url>.up.railway.app/api
```

- [ ] Deploy
- [ ] Note the deployment URL

### 3.4 Deploy Payments MFE

- [ ] Go to https://vercel.com/new
- [ ] Import same repository
- [ ] Configure:
  - **Root Directory:** _(leave blank)_
  - **Build Command:** `pnpm install --frozen-lockfile --ignore-scripts && pnpm exec nx build payments-mfe --configuration=production`
  - **Output Directory:** `dist/apps/payments-mfe`
  - **Install Command:** _(leave blank)_

- [ ] Add environment variables:

```bash
NX_API_BASE_URL=https://<api-gateway-url>.up.railway.app/api
```

- [ ] Deploy
- [ ] Note the deployment URL

### 3.5 Deploy Admin MFE

- [ ] Go to https://vercel.com/new
- [ ] Import same repository
- [ ] Configure:
  - **Root Directory:** _(leave blank)_
  - **Build Command:** `pnpm install --frozen-lockfile --ignore-scripts && pnpm exec nx build admin-mfe --configuration=production`
  - **Output Directory:** `dist/apps/admin-mfe`
  - **Install Command:** _(leave blank)_

- [ ] Add environment variables:

```bash
NX_API_BASE_URL=https://<api-gateway-url>.up.railway.app/api
```

- [ ] Deploy
- [ ] Note the deployment URL

### 3.6 Deploy Profile MFE

- [ ] Go to https://vercel.com/new
- [ ] Import same repository
- [ ] Configure:
  - **Root Directory:** _(leave blank)_
  - **Build Command:** `pnpm install --frozen-lockfile --ignore-scripts && pnpm exec nx build profile-mfe --configuration=production`
  - **Output Directory:** `dist/apps/profile-mfe`
  - **Install Command:** _(leave blank)_

- [ ] Add environment variables:

```bash
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

> **Hosting Path:** The manifest file is served by Vercel static hosting at `/mfe-manifest.json` and is fetched by the Shell at runtime using a relative path (`fetch('/mfe-manifest.json')`).

#### Why Manifest-Based Resolution?

| Benefit                | Description                                            |
| ---------------------- | ------------------------------------------------------ |
| **Version Pinning**    | Each MFE version is tracked in the manifest            |
| **Runtime Swap**       | Update manifest to switch MFE versions without rebuild |
| **Easier Rollback**    | Revert manifest to previous MFE versions instantly     |
| **Reduced Coupling**   | Shell doesn't need rebuild when MFE URLs change        |
| **Platform Alignment** | Follows MFE best practices for remote resolution       |
| **Audit Trail**        | Manifest history shows what versions were deployed     |

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

```bash
NX_AUTH_MFE_URL=https://auth-mfe-xxx.vercel.app
NX_PAYMENTS_MFE_URL=https://payments-mfe-xxx.vercel.app
NX_ADMIN_MFE_URL=https://admin-mfe-xxx.vercel.app
NX_PROFILE_MFE_URL=https://profile-mfe-xxx.vercel.app
```

- [ ] Trigger redeploy: Deployments → Redeploy

### 3.9 Update CORS on Backend

- [ ] Go to Railway → API Gateway → Variables
- [ ] Update `CORS_ORIGINS` with all Vercel URLs:

```bash
CORS_ORIGINS=https://shell-xxx.vercel.app,https://auth-mfe-xxx.vercel.app,https://payments-mfe-xxx.vercel.app,https://admin-mfe-xxx.vercel.app,https://profile-mfe-xxx.vercel.app
```

- [ ] Service will auto-redeploy

### 3.10 Configure Cache Headers (Important)

Vercel caching can serve stale `remoteEntry.js` and `mfe-manifest.json` files. Configure cache headers:

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

- [ ] Create `vercel.json` in the Shell app root directory (includes manifest rule):

```json
{
  "headers": [
    {
      "source": "/mfe-manifest.json",
      "headers": [
        {
          "key": "Cache-Control",
          "value": "no-cache, no-store, must-revalidate"
        }
      ]
    },
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

- `mfe-manifest.json` is always fresh (enables instant rollback)
- `remoteEntry.js` is always fresh (MFE entry points)
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
>
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

**Option 1: Check Migration Status First (Recommended)**

```bash
# Check current migration status
railway run --service <service-name> npx prisma migrate status

# Review what migrations have been applied
railway run --service <service-name> npx prisma migrate diff
```

**Option 2: Reset Database (Data Destructive)**

> 🚨 **PRE-RESET CHECKLIST — Complete before running reset:**
>
> - [ ] Verified this is a POC/demo environment (NOT production)
> - [ ] Confirmed data loss is acceptable for this environment
> - [ ] Documented current database state if needed
> - [ ] No active demo or stakeholder session in progress

```bash
# Interactive reset (requires manual confirmation)
railway run --service <service-name> npx prisma migrate reset

# Force reset (skips confirmation - use with extreme caution)
railway run --service <service-name> npx prisma migrate reset --force

# Re-run migrations after reset
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

## Rate-Limiting Configuration

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

```bash
RATE_LIMIT_WINDOW_MS=60000
RATE_LIMIT_MAX_REQUESTS=100
AUTH_RATE_LIMIT_WINDOW_MS=900000
AUTH_RATE_LIMIT_MAX_REQUESTS=10
```

### Why Rate-Limiting Matters for POC

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
RABBITMQ_URL=<your-cloudamqp-url>
REQUEST_TIMEOUT_MS=5000
RETRY_ATTEMPTS=1
SENTRY_DSN=<optional>
```

> **Note:** `RABBITMQ_URL` is required. Get your CloudAMQP URL from [Phase 2.3: Create RabbitMQ Instance](#23-create-rabbitmq-instance).

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

| Rule                             | Status | Implementation                                    |
| -------------------------------- | ------ | ------------------------------------------------- |
| Host controls navigation         | ✅     | Shell orchestrates all routing, MFEs expose pages |
| No cross-MFE imports             | ✅     | Only shared libraries allowed                     |
| Event bus present                | ✅     | RabbitMQ via CloudAMQP (required, not optional)   |
| Service isolation                | ✅     | Each service runs independently on Railway        |
| Separate DB per service          | ✅     | 4 PostgreSQL instances for bounded contexts       |
| Gateway orchestration            | ✅     | API Gateway handles routing, auth, rate limiting  |
| Rate limiting                    | ✅     | Redis-backed rate limits per endpoint             |
| Health endpoints                 | ✅     | `/health`, `/ready`, `/live` for each service     |
| Contract validation              | ✅     | Gateway validates OpenAPI schemas                 |
| Manifest-based remote resolution | ✅     | MFE manifest for dynamic remote URL resolution    |

---

## Phase 7: Demo Video Recording

**Status:** 🔲 Not Started
**Estimated Time:** 2-3 hours (including practice runs)
**Target Duration:** 5 minutes

### 7.1 Recording Tools

Choose one of these free/low-cost screen recording options:

| Tool           | Platform    | Cost             | Best For                           |
| -------------- | ----------- | ---------------- | ---------------------------------- |
| **Loom**       | Web/Desktop | Free (25 videos) | Easiest setup, webcam overlay      |
| **OBS Studio** | All         | Free             | Professional quality, more control |
| **QuickTime**  | macOS       | Free             | Simple, built-in                   |
| **ScreenPal**  | Web         | Free (15 min)    | Quick recordings                   |
| **Zoom**       | All         | Free             | If you already use it              |

**Recommended for first-time:** Loom (https://loom.com)

- No editing software needed
- Automatic hosting and sharing
- Webcam bubble in corner (optional)
- Easy trimming built-in

### 7.2 Pre-Recording Setup

- [ ] **Browser setup:**
  - Use Chrome or Firefox (clean profile recommended)
  - Close unnecessary tabs
  - Clear browser cache for fresh demo
  - Disable notifications (Focus mode)
  - Set zoom to 100% or 110% for readability

- [ ] **Screen setup:**
  - Resolution: 1920x1080 (1080p) recommended
  - Hide desktop icons
  - Hide bookmark bar (or show only relevant bookmarks)
  - Dark mode or light mode consistently

- [ ] **Demo data ready:**
  - Test accounts created and logged out
  - Sample payments in various states
  - Admin dashboard has visible data

- [ ] **Script ready:**
  - Print or have second screen with talking points
  - Practice run completed at least twice

### 7.3 Video Structure (5 Minutes)

| Section                  | Duration | Content                           |
| ------------------------ | -------- | --------------------------------- |
| **Intro**                | 30 sec   | Problem statement, what you built |
| **Architecture**         | 45 sec   | Quick diagram walkthrough         |
| **User Journey**         | 2 min    | Login → Payment → Confirmation    |
| **Admin Features**       | 1 min    | Dashboard, user management        |
| **Technical Highlights** | 45 sec   | MFE loading, real-time updates    |
| **Wrap-up**              | 15 sec   | Next steps, call to action        |

### 7.4 Detailed Script Outline

#### Opening (0:00 - 0:30)

```text
"Hi, I'm [Name], and I'm excited to show you our MFE Payments System POC.

This platform demonstrates how we can build a scalable, modular payment
processing system using microfrontends and microservices.

Let me walk you through what we've built."
```

#### Architecture Overview (0:30 - 1:15)

- [ ] Show architecture diagram (from this doc or a slide)
- [ ] Highlight: "5 independent frontend modules, 5 backend services, 4 databases"
- [ ] Mention: "Each team can deploy independently"
- [ ] Point out: "Railway for backend, Vercel for frontend"

#### Customer Journey Demo (1:15 - 3:15)

**Login Flow (30 sec)**

- [ ] Navigate to login page
- [ ] Show: "This is the Auth MFE - a separate deployable module"
- [ ] Enter credentials, click login
- [ ] Point out: "JWT-based authentication with secure refresh tokens"

**Dashboard (20 sec)**

- [ ] Show dashboard loading
- [ ] Mention: "Notice how the Shell loads multiple MFEs seamlessly"
- [ ] Highlight recent activity

**Make a Payment (50 sec)**

- [ ] Click "New Payment"
- [ ] Fill in payment details (use test data)
- [ ] Point out: "Razorpay integration for India market - UPI, cards, net banking"
- [ ] Submit payment
- [ ] Show success confirmation
- [ ] Mention: "Real-time status updates via WebSocket"

**Payment History (20 sec)**

- [ ] Navigate to payment history
- [ ] Show list of payments with different statuses
- [ ] Click on a payment for details

#### Admin Features (3:15 - 4:15)

**Switch to Admin (15 sec)**

- [ ] Log out from customer account
- [ ] Login as admin user
- [ ] Mention: "Role-based access control"

**Admin Dashboard (25 sec)**

- [ ] Show admin dashboard with metrics
- [ ] Highlight: "Real-time overview of system health"
- [ ] Point out key metrics

**User Management (20 sec)**

- [ ] Navigate to user management
- [ ] Show user list
- [ ] Demonstrate search/filter
- [ ] Mention: "Full audit trail for compliance"

#### Technical Highlights (4:15 - 5:00)

**Show DevTools briefly (30 sec)**

- [ ] Open Network tab
- [ ] Point out: "Each MFE loads its own remoteEntry.js"
- [ ] Show: "API calls go through our gateway"
- [ ] Mention: "Rate limiting, health checks, observability built-in"

**Wrap-up (15 sec)**

```text
"This POC demonstrates our architectural approach at a fraction of
production costs. We're ready to scale this to AWS after approval.

Thank you for watching - I'm happy to answer any questions."
```

### 7.5 Features to Highlight

**Must-Show Features:**

- [ ] Seamless MFE loading (no page refresh between modules)
- [ ] Login/logout flow with JWT
- [ ] Payment creation with INR currency
- [ ] Real-time updates (WebSocket)
- [ ] Role-based access (customer vs admin)
- [ ] Responsive design (if time permits, show mobile view)

**Technical Points to Mention:**

- [ ] Module Federation v2 for MFE architecture
- [ ] Microservices with separate databases
- [ ] Event-driven architecture (RabbitMQ)
- [ ] Production-grade security (rate limiting, CORS, CSP)
- [ ] India-first: INR, Razorpay, Indian locale

**Avoid Showing:**

- Error states (unless specifically demoing error handling)
- Loading spinners (pre-warm the system)
- Console errors
- Slow network responses

### 7.6 Recording Tips

**Before Recording:**

- [ ] Close all unnecessary apps
- [ ] Silence phone and notifications
- [ ] Clear throat, have water nearby
- [ ] Do a 30-second test recording to check audio

**During Recording:**

- Speak slowly and clearly
- Pause briefly between sections
- Don't rush - 5 minutes is enough time
- If you make a mistake, pause and restart that sentence
- Keep mouse movements smooth and deliberate

**After Recording:**

- [ ] Watch the full recording
- [ ] Trim start/end dead time
- [ ] Add captions if possible (Loom does this automatically)
- [ ] Create a shareable link

### 7.7 Backup Plan

If live demo fails during recording:

- [ ] Have screenshots ready as fallback
- [ ] Pre-record individual feature clips
- [ ] Use the architecture diagram as a talking point
- [ ] Explain what would happen ("At this point, the user would see...")

### 7.8 Video Checklist

Before sharing the video:

- [ ] Video is under 5 minutes
- [ ] Audio is clear, no background noise
- [ ] Screen is readable (font size, resolution)
- [ ] No sensitive data visible (real emails, tokens, etc.)
- [ ] All demo features work correctly
- [ ] Smooth transitions between sections
- [ ] Clear call-to-action at the end

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

## Supporting Documentation (March 2026)

Detailed step-by-step guides created for each deployment phase:

### Phase 2: Railway Backend
📄 **[RAILWAY-BACKEND-DEPLOYMENT-GUIDE.md](./temp/RAILWAY-BACKEND-DEPLOYMENT-GUIDE.md)**
- Complete Railway service deployment instructions
- Copy-paste configurations for all 5 backend services
- Pre-generated JWT_SECRET
- Troubleshooting guide
- Environment variables reference

### Phase 3: Vercel Frontend
📄 **[VERCEL-FRONTEND-DEPLOYMENT-GUIDE.md](./temp/VERCEL-FRONTEND-DEPLOYMENT-GUIDE.md)**
- Step-by-step Vercel deployment for 5 frontend apps
- Module Federation configuration
- Cache header setup (critical for MFE)
- CORS update instructions
- Full verification checklist

### Quick Reference
📄 **[DEPLOYMENT-QUICK-REFERENCE.md](./temp/DEPLOYMENT-QUICK-REFERENCE.md)**
- Cheat sheet for both phases
- Command templates
- URL tracking sheet
- Quick troubleshooting tips

### Progress Tracking
📄 **[DEPLOYMENT-PROGRESS-TRACKER.md](./temp/DEPLOYMENT-PROGRESS-TRACKER.md)**
- Comprehensive checklist for all 7 phases
- Service-by-service deployment tracking
- URL collection fields
- Timeline tracking
- Issues log

---

## Document History

| Version | Date       | Changes                                                                                                                                                                                                        |
| ------- | ---------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1.8     | 2026-03-17 | **Phase 2 Complete:** All 5 backend services deployed and verified on Railway with auto-deploy enabled                                                                                                        |
| 1.7     | 2026-03-16 | Progress update: Phase 1 complete, Phase 2 infrastructure complete (databases/redis), added supporting documentation references                                                                                |
| 1.6     | 2026-02-13 | Lint fixes: contiguous blockquotes, Rate-Limiting hyphenation, net banking spelling, RABBITMQ_URL in API Gateway env block, language tags on all code blocks (MD040)                                           |
| 1.5     | 2026-02-13 | PR review fixes: safer DB rollback with pre-check and interactive option, RABBITMQ_URL marked as required with Phase 2 reference, grammar fix (Log out)                                                        |
| 1.4     | 2026-02-13 | Final refinements: manifest hosting path clarification, mfe-manifest.json cache rule, timeout/retry vars in env reference, softened sleep delays claim                                                         |
| 1.3     | 2026-02-13 | Added Phase 7: Demo Video Recording with tools, script outline, features to highlight, and recording tips                                                                                                      |
| 1.2     | 2026-02-13 | Round 2 expert review: MFE manifest-based remote resolution, gateway contract validation, --configuration=production flag, pre-demo warmup checklist, platform rule alignment table, stronger DB reset warning |
| 1.1     | 2026-02-13 | Round 1 expert review: rollback procedures, secret management, rate limiting, health endpoints, cache busting, MFE architecture rules, POC exclusions                                                          |
| 1.0     | 2026-02-13 | Initial POC deployment guide                                                                                                                                                                                   |

---

**Current Status:** Phase 2 Complete ✅ - All Backend Services Deployed and Running on Railway

**Next Action:** Deploy 5 frontend applications to Vercel using [VERCEL-FRONTEND-DEPLOYMENT-GUIDE.md](./temp/VERCEL-FRONTEND-DEPLOYMENT-GUIDE.md)
