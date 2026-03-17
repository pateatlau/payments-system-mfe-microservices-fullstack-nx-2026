# Vercel Frontend Deployment Guide - Phase 3

**Date:** March 16, 2026
**Status:** Ready to Deploy (After Phase 2 Backend Completion)
**Repository:** https://github.com/pateatlau/payments-system-mfe-microservices-fullstack-nx-2026

---

## Prerequisites

Before starting Phase 3, ensure Phase 2 is complete:

- ✅ All 5 backend services deployed to Railway
- ✅ API Gateway has public URL (e.g., `https://api-gateway-production-xxxx.up.railway.app`)
- ✅ All health endpoints return 200 OK
- ✅ Databases and Redis connected successfully

**You will need:**

- ✅ API Gateway public URL from Phase 2
- ✅ Vercel account (sign up at https://vercel.com if needed)
- ✅ GitHub repository access

---

## Overview

We'll deploy 5 frontend applications to Vercel:

1. **Auth MFE** (Remote) - Authentication components
2. **Payments MFE** (Remote) - Payment processing UI
3. **Admin MFE** (Remote) - Admin dashboard
4. **Profile MFE** (Remote) - User profile management
5. **Shell** (Host) - Main application that loads all remotes

**IMPORTANT DEPLOYMENT ORDER:**
Deploy the 4 remote MFEs **FIRST**, then deploy the Shell app **LAST**.

This is because the Shell needs the remote MFE URLs to configure Module Federation.

---

## Deployment Strategy

### MFE URLs After Deployment

After deployment, you'll have these Vercel URLs:

```
https://auth-mfe-<unique-id>.vercel.app
https://payments-mfe-<unique-id>.vercel.app
https://admin-mfe-<unique-id>.vercel.app
https://profile-mfe-<unique-id>.vercel.app
https://shell-<unique-id>.vercel.app  (main application URL)
```

**Note:** Vercel generates unique IDs for each project. You can also set up custom domains later.

---

## Important: Vercel Build Configuration

> **Why these specific settings?**
>
> This monorepo has Prisma (backend-only) and an Nx wrapper that cause issues on Vercel:
>
> 1. **Install Command MUST be set explicitly** to `pnpm install --frozen-lockfile --ignore-scripts --prod=false`. If left blank, Vercel runs a default `pnpm install` WITHOUT `--ignore-scripts`, which triggers Prisma's postinstall and fails because frontend apps have no Prisma schema. The `--prod=false` flag ensures devDependencies (including `nx`) are installed even when `NODE_ENV=production` (which Vercel sets automatically).
> 2. **`pnpm exec nx`** runs Nx directly from `node_modules/.bin/nx`, bypassing the Nx wrapper (`.nx/nxw.js`) which tries to run `npm i` internally and fails with `--ignore-scripts`.
> 3. **Do NOT set Root Directory** — leave it blank so Vercel runs from the repo root. This ensures `pnpm install` uses the root `pnpm-lock.yaml` and the build can find all workspace packages.
> 4. **`PRISMA_SKIP_POSTINSTALL_GENERATE=true`** environment variable is set as a safety net — this is Prisma's native mechanism to skip its postinstall generate step.
> 5. **Do NOT set `NODE_ENV=production`** as a Vercel environment variable — Vercel sets this automatically. Setting it explicitly causes `pnpm install` to skip devDependencies (where `nx` lives), breaking the build.

---

## Service 1: Auth MFE

### Step 1.1: Create Vercel Project

1. Go to https://vercel.com/dashboard
2. Click **"Add New..."** → **"Project"**
3. Click **"Import Git Repository"**
4. Select: `pateatlau/payments-system-mfe-microservices-fullstack-nx-2026`
5. Click **"Import"**

### Step 1.2: Configure Project Settings

**Framework Preset:**

```
Other
```

**Project Name:**

```
auth-mfe
```

**Root Directory:** _(leave blank — do NOT set this)_

**Install Command:**

```bash
pnpm install --frozen-lockfile --ignore-scripts --prod=false
```

**Build Command:**

```bash
pnpm exec nx build auth-mfe --configuration=production
```

**Output Directory:**

```
dist/apps/auth-mfe
```

### Step 1.3: Set Environment Variables

Click **"Environment Variables"** section and add:

| Name                                   | Value                                |
| -------------------------------------- | ------------------------------------ |
| `NX_API_BASE_URL`                      | `https://<your-api-gateway-url>/api` |
| `PRISMA_SKIP_POSTINSTALL_GENERATE`     | `true`                               |

**Example:**

```bash
NX_API_BASE_URL=https://api-gateway-production-abc123.up.railway.app/api
```

**IMPORTANT:** Replace `<your-api-gateway-url>` with your actual Railway API Gateway URL from Phase 2!

### Step 1.4: Deploy

1. Click **"Deploy"**
2. Wait for build to complete (5-10 minutes)
3. **SAVE THE DEPLOYMENT URL** - you'll need it for the Shell configuration

**Expected URL format:**

```
https://auth-mfe-<random-id>.vercel.app
```

### Step 1.5: Verify Deployment

1. Open the deployment URL
2. You should see the Auth MFE standalone page
3. Check Network tab → verify `remoteEntry.js` is loaded

---

## Service 2: Payments MFE

### Step 2.1: Create Project

1. Vercel Dashboard → **"Add New..."** → **"Project"**
2. Select same repository
3. Click **"Import"**

### Step 2.2: Configure Settings

**Framework Preset:** Other

**Project Name:**

```
payments-mfe
```

**Root Directory:** _(leave blank)_

**Install Command:**

```bash
pnpm install --frozen-lockfile --ignore-scripts --prod=false
```

**Build Command:**

```bash
pnpm exec nx build payments-mfe --configuration=production
```

**Output Directory:**

```
dist/apps/payments-mfe
```

### Step 2.3: Environment Variables

| Name                                   | Value                                |
| -------------------------------------- | ------------------------------------ |
| `NX_API_BASE_URL`                      | `https://<your-api-gateway-url>/api` |
| `PRISMA_SKIP_POSTINSTALL_GENERATE`     | `true`                               |

### Step 2.4: Deploy & Save URL

1. Deploy
2. Wait for completion
3. **Save URL:** `https://payments-mfe-<random-id>.vercel.app`

---

## Service 3: Admin MFE

### Step 3.1: Create Project

1. **"Add New..."** → **"Project"**
2. Select repository
3. Click **"Import"**

### Step 3.2: Configure Settings

**Framework Preset:** Other

**Project Name:**

```
admin-mfe
```

**Root Directory:** _(leave blank)_

**Install Command:**

```bash
pnpm install --frozen-lockfile --ignore-scripts --prod=false
```

**Build Command:**

```bash
pnpm exec nx build admin-mfe --configuration=production
```

**Output Directory:**

```
dist/apps/admin-mfe
```

### Step 3.3: Environment Variables

| Name                                   | Value                                |
| -------------------------------------- | ------------------------------------ |
| `NX_API_BASE_URL`                      | `https://<your-api-gateway-url>/api` |
| `PRISMA_SKIP_POSTINSTALL_GENERATE`     | `true`                               |

### Step 3.4: Deploy & Save URL

1. Deploy
2. **Save URL:** `https://admin-mfe-<random-id>.vercel.app`

---

## Service 4: Profile MFE

### Step 4.1: Create Project

1. **"Add New..."** → **"Project"**
2. Select repository
3. Click **"Import"**

### Step 4.2: Configure Settings

**Framework Preset:** Other

**Project Name:**

```
profile-mfe
```

**Root Directory:** _(leave blank)_

**Install Command:**

```bash
pnpm install --frozen-lockfile --ignore-scripts --prod=false
```

**Build Command:**

```bash
pnpm exec nx build profile-mfe --configuration=production
```

**Output Directory:**

```
dist/apps/profile-mfe
```

### Step 4.3: Environment Variables

| Name                                   | Value                                |
| -------------------------------------- | ------------------------------------ |
| `NX_API_BASE_URL`                      | `https://<your-api-gateway-url>/api` |
| `PRISMA_SKIP_POSTINSTALL_GENERATE`     | `true`                               |

### Step 4.4: Deploy & Save URL

1. Deploy
2. **Save URL:** `https://profile-mfe-<random-id>.vercel.app`

---

## Service 5: Shell (Host App)

**⚠️ DEPLOY THIS LAST - After all 4 remote MFEs are deployed!**

### Step 5.1: Create Project

1. **"Add New..."** → **"Project"**
2. Select repository
3. Click **"Import"**

### Step 5.2: Configure Settings

**Framework Preset:** Other

**Project Name:**

```
shell
```

**Root Directory:** _(leave blank)_

**Install Command:**

```bash
pnpm install --frozen-lockfile --ignore-scripts --prod=false
```

**Build Command:**

```bash
pnpm exec nx run-many --target=build --projects=auth-mfe,payments-mfe,admin-mfe,profile-mfe --configuration=production --parallel && pnpm exec nx build shell --configuration=production
```

**Notes:**
- `pnpm exec nx` bypasses the Nx wrapper and runs Nx directly from `node_modules`
- Builds all remote MFEs first to ensure Module Federation manifests are available, then builds Shell

**Output Directory:**

```
dist/apps/shell
```

### Step 5.3: Environment Variables

| Name                                   | Value                   | Example                                                    |
| -------------------------------------- | ----------------------- | ---------------------------------------------------------- |
| `NX_API_BASE_URL`                      | API Gateway URL + /api  | `https://api-gateway-production-abc123.up.railway.app/api` |
| `NX_AUTH_MFE_URL`                      | Auth MFE Vercel URL     | `https://auth-mfe-xyz.vercel.app`                          |
| `NX_PAYMENTS_MFE_URL`                  | Payments MFE Vercel URL | `https://payments-mfe-xyz.vercel.app`                      |
| `NX_ADMIN_MFE_URL`                     | Admin MFE Vercel URL    | `https://admin-mfe-xyz.vercel.app`                         |
| `NX_PROFILE_MFE_URL`                   | Profile MFE Vercel URL  | `https://profile-mfe-xyz.vercel.app`                       |
| `PRISMA_SKIP_POSTINSTALL_GENERATE`     | `true`                  | `true`                                                     |

**CRITICAL:** Replace all `<...>` placeholders with your actual URLs from previous deployments!

### Step 5.4: Deploy

1. Click **"Deploy"**
2. Wait for build (this may take 10-15 minutes as it builds all remotes)
3. **Save URL:** `https://shell-<random-id>.vercel.app` - This is your **main application URL**!

---

## Post-Deployment Configuration

### Update CORS on API Gateway

Now that all frontend apps are deployed, update the Railway API Gateway CORS settings:

1. Go to Railway dashboard → **payments-poc** project
2. Click **api-gateway** service
3. Go to **Variables** tab
4. Update `CORS_ORIGINS` to include all Vercel URLs:

```bash
CORS_ORIGINS=https://shell-<id>.vercel.app,https://auth-mfe-<id>.vercel.app,https://payments-mfe-<id>.vercel.app,https://admin-mfe-<id>.vercel.app,https://profile-mfe-<id>.vercel.app
```

**Example:**

```bash
CORS_ORIGINS=https://shell-abc123.vercel.app,https://auth-mfe-xyz789.vercel.app,https://payments-mfe-def456.vercel.app,https://admin-mfe-ghi789.vercel.app,https://profile-mfe-jkl012.vercel.app
```

5. Save - Railway will auto-redeploy the API Gateway with updated CORS settings

---

## Configure Cache Headers (Critical for Module Federation)

Module Federation requires that `remoteEntry.js` files are **never cached** to ensure MFEs always load the latest version.

### For Each MFE (Auth, Payments, Admin, Profile)

1. Go to Vercel project → **Settings** → **Headers**
2. Click **"Add Header"**
3. Configure:

**Source:**

```
/remoteEntry.js
```

**Headers:**

```
Cache-Control: no-cache, no-store, must-revalidate
```

4. Click **"Save"**

### For Shell App

The Shell app needs cache headers for both `remoteEntry.js` (if it has one) and general assets:

1. Go to Shell project → **Settings** → **Headers**
2. Add header for remoteEntry.js (same as above)
3. Add header for static assets:

**Source:**

```
/(.*)\\.(?:js|css|png|jpg|jpeg|gif|svg|woff|woff2)
```

**Headers:**

```
Cache-Control: public, max-age=31536000, immutable
```

This ensures content-hashed assets are cached for 1 year, while `remoteEntry.js` is always fresh.

---

## Verification Steps

### Test Each MFE Standalone

Visit each MFE URL directly:

1. **Auth MFE:** `https://auth-mfe-<id>.vercel.app`
   - Should show authentication page
   - Check DevTools → Network → verify `remoteEntry.js` loads

2. **Payments MFE:** `https://payments-mfe-<id>.vercel.app`
   - Should show payments UI
   - Verify `remoteEntry.js` loads

3. **Admin MFE:** `https://admin-mfe-<id>.vercel.app`
   - Should show admin interface
   - Verify `remoteEntry.js` loads

4. **Profile MFE:** `https://profile-mfe-<id>.vercel.app`
   - Should show profile page
   - Verify `remoteEntry.js` loads

### Test Shell App (Full Integration)

1. Open Shell URL: `https://shell-<id>.vercel.app`
2. **Check DevTools Console:**
   - No Module Federation errors
   - No CORS errors
   - All remote MFEs loaded successfully

3. **Check Network Tab:**
   - All 4 `remoteEntry.js` files loaded from correct URLs
   - API calls go to Railway backend
   - Response headers show correct `Cache-Control`

4. **Test User Flow:**
   - Navigate to login page (Auth MFE loads)
   - Login with test credentials
   - Navigate to payments page (Payments MFE loads)
   - Navigate to admin page (Admin MFE loads)
   - Navigate to profile page (Profile MFE loads)

5. **Test Module Federation:**
   - Navigate between MFEs without page refresh
   - Verify shared state persists (auth token, theme)
   - No duplicate React instances (check React DevTools)

---

## Troubleshooting

### Build Fails: "Cannot find module './installation/node_modules/nx/bin/nx'"

**Cause:** The Nx wrapper (`.nx/nxw.js`) tries to run `npm i` internally, which fails when `--ignore-scripts` is set.

**Fix:** Use `pnpm exec nx` instead of `pnpm nx` in build commands. This runs Nx directly from `node_modules/.bin/nx`, bypassing the wrapper entirely.

### Build Fails: Prisma postinstall error

**Cause:** Prisma's `@prisma/client` postinstall script runs during `pnpm install` and looks for a schema file that doesn't exist in frontend apps.

**Fix (3 layers — use ALL of them):**

1. **Set Install Command explicitly** to `pnpm install --frozen-lockfile --ignore-scripts --prod=false`. Do NOT leave it blank — Vercel's default install runs `pnpm install` WITHOUT `--ignore-scripts`, which triggers Prisma's postinstall.
2. **Add `PRISMA_SKIP_POSTINSTALL_GENERATE=true`** as an environment variable in the Vercel project settings. This is Prisma's native mechanism to skip its postinstall generate step.
3. The Build Command should NOT include `pnpm install` — it's handled by the Install Command.

### Build Fails: "not found: nx" or "devDependencies: skipped"

**Cause:** `NODE_ENV=production` is set as an environment variable, which causes `pnpm install` to skip devDependencies. Since `nx` is a devDependency, the build command can't find it.

**Fix:**

1. **Remove `NODE_ENV=production`** from Vercel environment variables — Vercel sets this automatically
2. **Add `--prod=false`** to the Install Command: `pnpm install --frozen-lockfile --ignore-scripts --prod=false`

### Build Fails: "Cannot find module" (general)

**Cause:** Monorepo dependencies not resolved.

**Fix:**

1. Do NOT set Root Directory in Vercel — leave it blank so the build runs from repo root
2. Verify `pnpm install --frozen-lockfile --ignore-scripts --prod=false` runs before build
3. Check `pnpm-lock.yaml` exists in repository root

### MFE Won't Load in Shell

**Cause:** Wrong remote URL or Module Federation misconfiguration.

**Fix:**

1. Check `NX_*_MFE_URL` environment variables are correct
2. Verify `remoteEntry.js` is accessible at MFE URL
3. Check browser console for Module Federation errors
4. Verify all MFEs use identical `sharedDependencies` configuration

### CORS Errors

**Cause:** API Gateway CORS settings don't include Vercel URLs.

**Fix:**

1. Update `CORS_ORIGINS` in Railway API Gateway
2. Include ALL Vercel URLs (Shell + 4 MFEs)
3. Ensure no trailing slashes in URLs
4. Wait for Railway to redeploy (~2 minutes)

### API Calls Fail

**Cause:** Wrong API base URL or API Gateway not running.

**Fix:**

1. Check `NX_API_BASE_URL` environment variable
2. Verify API Gateway is running in Railway
3. Test API Gateway health endpoint directly
4. Check browser Network tab for exact error

### Module Federation Loads Wrong Version

**Cause:** `remoteEntry.js` cached by browser or CDN.

**Fix:**

1. Verify cache headers are set (no-cache for remoteEntry.js)
2. Hard refresh browser (Cmd+Shift+R / Ctrl+Shift+R)
3. Check Response Headers in Network tab for `Cache-Control`
4. Redeploy MFE if cache headers weren't set initially

### Shared Dependencies Not Singleton

**Cause:** Mismatched `sharedDependencies` configuration.

**Fix:**

1. Verify all MFE `rspack.config.js` files have identical `sharedDependencies`
2. Rebuild all MFEs
3. Check React DevTools for duplicate React instances

---

## Enable Automatic Deployments

By default, Vercel auto-deploys on push to `main`. Verify this is enabled:

### For Each Project

1. Go to project → **Settings** → **Git**
2. Verify **"Production Branch"** is set to `main`
3. Verify **"Automatic Deployments"** is **ON**
4. (Optional) Enable **"Preview Deployments"** for feature branches

Now when you push to `main`, all 5 frontend apps will auto-deploy!

---

## Deployment Summary

After completing Phase 3, you should have:

| Service      | Platform | URL                                                  | Status      |
| ------------ | -------- | ---------------------------------------------------- | ----------- |
| Auth MFE     | Vercel   | `https://auth-mfe-<id>.vercel.app`                   | ✅ Deployed |
| Payments MFE | Vercel   | `https://payments-mfe-<id>.vercel.app`               | ✅ Deployed |
| Admin MFE    | Vercel   | `https://admin-mfe-<id>.vercel.app`                  | ✅ Deployed |
| Profile MFE  | Vercel   | `https://profile-mfe-<id>.vercel.app`                | ✅ Deployed |
| Shell (Host) | Vercel   | `https://shell-<id>.vercel.app`                      | ✅ Deployed |
| API Gateway  | Railway  | `https://api-gateway-production-<id>.up.railway.app` | ✅ Deployed |

**Main Application URL:** `https://shell-<id>.vercel.app` ← Share this URL for demos!

---

## Phase 3 Checklist

Before proceeding to Phase 4, verify:

- [ ] All 4 remote MFEs deployed successfully
- [ ] All 4 remote MFE URLs saved
- [ ] Shell app deployed successfully
- [ ] All environment variables set correctly
- [ ] CORS updated on API Gateway
- [ ] Cache headers configured for all projects
- [ ] All MFEs load standalone (visit each URL)
- [ ] Shell app loads all remote MFEs
- [ ] Login flow works (Auth MFE → API)
- [ ] Navigation between MFEs works without page refresh
- [ ] No CORS errors in browser console
- [ ] No Module Federation errors in console
- [ ] `remoteEntry.js` has no-cache headers
- [ ] Automatic deployments enabled for all projects

---

## Cost Tracking

**Vercel Free Tier Limits:**

- 100 GB bandwidth/month
- 100 deployments/day
- No credit card required

**Our Usage (5 projects):**

- Estimated bandwidth: 5-10 GB/month (demo usage)
- Well within free tier limits

**Note:** Vercel free tier is sufficient for POC demo. Upgrade to Pro ($20/month per user) if you need:

- More bandwidth
- Custom domains
- Team collaboration
- Advanced analytics

---

## Next Steps

After Phase 3 is complete:

1. ✅ **Test the full application** - End-to-end user flows
2. ✅ **Create demo user accounts** - For stakeholder demo
3. ✅ **Proceed to Phase 4** - Set up GitHub Actions for CI/CD
4. ✅ **Update documentation** - Record all deployment URLs

---

## Environment Variables Reference Sheet

Save these for documentation:

```bash
# API Gateway URL (Railway)
API_GATEWAY_URL=https://api-gateway-production-<id>.up.railway.app

# Vercel Frontend URLs
SHELL_URL=https://shell-<id>.vercel.app
AUTH_MFE_URL=https://auth-mfe-<id>.vercel.app
PAYMENTS_MFE_URL=https://payments-mfe-<id>.vercel.app
ADMIN_MFE_URL=https://admin-mfe-<id>.vercel.app
PROFILE_MFE_URL=https://profile-mfe-<id>.vercel.app

# For Each Vercel Project
NX_API_BASE_URL=${API_GATEWAY_URL}/api
PRISMA_SKIP_POSTINSTALL_GENERATE=true
# Note: Do NOT set NODE_ENV=production — Vercel sets this automatically

# Shell App Additional Variables
NX_AUTH_MFE_URL=${AUTH_MFE_URL}
NX_PAYMENTS_MFE_URL=${PAYMENTS_MFE_URL}
NX_ADMIN_MFE_URL=${ADMIN_MFE_URL}
NX_PROFILE_MFE_URL=${PROFILE_MFE_URL}

# Railway API Gateway CORS Update
CORS_ORIGINS=${SHELL_URL},${AUTH_MFE_URL},${PAYMENTS_MFE_URL},${ADMIN_MFE_URL},${PROFILE_MFE_URL}
```

---

**Once all items are checked, Phase 3 is complete! 🎉**

**Next:** Phase 4 - GitHub Actions CI/CD Setup
