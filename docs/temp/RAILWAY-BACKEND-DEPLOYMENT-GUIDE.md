# Railway Backend Deployment Guide - Step-by-Step

**Date:** March 16, 2026
**Updated:** March 16, 2026 (v2 - fixed build/start commands for unbundled esbuild)
**Status:** Ready to Deploy
**Repository:** https://github.com/pateatlau/payments-system-mfe-microservices-fullstack-nx-2026

---

## Prerequisites - ✅ COMPLETED

- ✅ Railway Hobby plan active
- ✅ PostgreSQL databases created: `auth-db`, `payments-db`, `admin-db`, `profile-db`
- ✅ Redis instance created: `redis`
- ✅ CloudAMQP RabbitMQ instance created (URL saved in Railway)
- ✅ GitHub repository access configured

---

## Deployment Order

Deploy services in this order to ensure proper dependency setup:

1. **Auth Service** (no dependencies)
2. **Payments Service** (no dependencies)
3. **Admin Service** (no dependencies)
4. **Profile Service** (no dependencies)
5. **API Gateway** (depends on all 4 services being deployed to get their internal URLs)

---

## Generate Secrets

**CRITICAL:** Generate unique secrets for production. Do NOT use example values in actual deployments.

```bash
# Generate JWT Secret (use same for all services that verify JWTs)
openssl rand -hex 64
# Example output: a1b2c3d4e5f6...128 character string

# Generate JWT Refresh Secret (MUST be different from JWT_SECRET)
openssl rand -hex 64
# Example output: x9y8z7w6v5u4...128 character string
```

**IMPORTANT:**
- Generate UNIQUE secrets for your deployment (never commit or reuse example values)
- Store secrets securely (Railway secrets panel, password manager, etc.)
- Use the SAME `JWT_SECRET` and `JWT_REFRESH_SECRET` across all services that sign/verify tokens
- Auth-service and API-gateway both need the same `JWT_REFRESH_SECRET` (auth signs, gateway verifies)

---

## Important: Build Architecture

This monorepo uses **Nx + esbuild with `bundle: false`**. This means:

- Dependencies are NOT bundled into the output — they remain as `require()` calls
- The build output at `dist/apps/<service>/` includes a generated `package.json` with only runtime dependencies and a `pnpm-lock.yaml`
- **Production dependencies must be installed inside the dist directory** after building
- For Prisma services, the Prisma client must also be generated inside the dist directory
- The workspace root's `node_modules` (pnpm symlink structure) cannot be used at runtime because Node.js resolves modules from the file's location, not the cwd

**Key settings:**
- **Root Directory:** Leave EMPTY (do NOT set) — builds must run from the repo root to access Nx, pnpm scripts, and the full monorepo
- **Build Command:** Installs deps, generates Prisma, builds with Nx, then installs production deps in the dist output
- **Start Command:** Runs from within the dist directory where `node_modules` are available

---

## Service 1: Auth Service

### Step 1.1: Create Service in Railway UI

1. Go to https://railway.com/dashboard
2. Open your **payments-poc** project
3. Click **"+ New"** → **"GitHub Repo"**
4. Select: `pateatlau/payments-system-mfe-microservices-fullstack-nx-2026`
5. Click **"Add Service"**

### Step 1.2: Configure Service Settings

Click on the newly created service → **Settings** tab:

**Service Name:**

```
auth-service
```

**Root Directory:** Leave EMPTY (do not set)

**Build Command:**

```bash
pnpm install --frozen-lockfile && pnpm db:auth:generate && pnpm nx build auth-service --configuration=production && cd dist/apps/auth-service && echo "" > pnpm-workspace.yaml && pnpm install --frozen-lockfile && cp -r ../../../apps/auth-service/prisma apps/auth-service/ && npx prisma generate --schema=apps/auth-service/prisma/schema.prisma
```

**Start Command:**

```bash
cd dist/apps/auth-service && npx prisma migrate deploy --schema=apps/auth-service/prisma/schema.prisma && node main.js
```

**Watch Paths:**

```
apps/auth-service/**
libs/**
```

### Step 1.3: Set Environment Variables

Click on the service → **Variables** tab → **Raw Editor**:

```bash
PORT=3001
NODE_ENV=production
DATABASE_URL=${{auth-db.DATABASE_URL}}
JWT_SECRET=<your-generated-jwt-secret-from-step-above>
JWT_REFRESH_SECRET=<generate-a-unique-secret-here>
REDIS_URL=${{redis.REDIS_URL}}
RABBITMQ_URL=<YOUR_CLOUDAMQP_URL_HERE>
```

**IMPORTANT:**
- `JWT_REFRESH_SECRET` must be a unique, secure string (different from JWT_SECRET). Generate with: `openssl rand -hex 64`
- Railway will automatically resolve `${{auth-db.DATABASE_URL}}` to the auth-db connection string
- Replace `<YOUR_CLOUDAMQP_URL_HERE>` with your CloudAMQP URL

### Step 1.4: Link to Database

1. Click **Settings** tab
2. Scroll to **"Service Variables"**
3. Verify `DATABASE_URL` shows the reference to `auth-db`

### Step 1.5: Deploy

1. Click **"Deploy"** button (or it may auto-deploy)
2. Wait for deployment to complete (check **Deployments** tab)
3. Verify deployment status is **"SUCCESS"**

### Step 1.6: Note Internal URL

Once deployed, the service will be available at:

```
http://auth-service.railway.internal:3001
```

---

## Service 2: Payments Service

### Step 2.1: Create Service

1. In Railway dashboard → **payments-poc** project
2. Click **"+ New"** → **"GitHub Repo"**
3. Select: `pateatlau/payments-system-mfe-microservices-fullstack-nx-2026`
4. Click **"Add Service"**

### Step 2.2: Configure Settings

**Service Name:**

```
payments-service
```

**Root Directory:** Leave EMPTY (do not set)

**Build Command:**

```bash
pnpm install --frozen-lockfile && pnpm db:payments:generate && pnpm nx build payments-service --configuration=production && cd dist/apps/payments-service && echo "" > pnpm-workspace.yaml && pnpm install --frozen-lockfile && cp -r ../../../apps/payments-service/prisma apps/payments-service/ && npx prisma generate --schema=apps/payments-service/prisma/schema.prisma
```

**Start Command:**

```bash
cd dist/apps/payments-service && npx prisma migrate deploy --schema=apps/payments-service/prisma/schema.prisma && node main.js
```

**Watch Paths:**

```
apps/payments-service/**
libs/**
```

### Step 2.3: Set Environment Variables

```bash
PORT=3002
NODE_ENV=production
DATABASE_URL=${{payments-db.DATABASE_URL}}
REDIS_URL=${{redis.REDIS_URL}}
RABBITMQ_URL=<YOUR_CLOUDAMQP_URL_HERE>
AUTH_SERVICE_URL=http://auth-service.railway.internal:3001
```

**Note:** Razorpay keys (`RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`) are optional for POC.

### Step 2.4: Deploy

1. Click **"Deploy"**
2. Wait for **SUCCESS** status
3. Internal URL: `http://payments-service.railway.internal:3002`

---

## Service 3: Admin Service

### Step 3.1: Create Service

1. **"+ New"** → **"GitHub Repo"**
2. Select repository
3. Click **"Add Service"**

### Step 3.2: Configure Settings

**Service Name:**

```
admin-service
```

**Root Directory:** Leave EMPTY (do not set)

**Build Command:**

```bash
pnpm install --frozen-lockfile && pnpm db:admin:generate && pnpm nx build admin-service --configuration=production && cd dist/apps/admin-service && echo "" > pnpm-workspace.yaml && pnpm install --frozen-lockfile && cp -r ../../../apps/admin-service/prisma apps/admin-service/ && npx prisma generate --schema=apps/admin-service/prisma/schema.prisma
```

**Start Command:**

```bash
cd dist/apps/admin-service && npx prisma migrate deploy --schema=apps/admin-service/prisma/schema.prisma && node main.js
```

**Watch Paths:**

```
apps/admin-service/**
libs/**
```

### Step 3.3: Set Environment Variables

```bash
PORT=3003
NODE_ENV=production
DATABASE_URL=${{admin-db.DATABASE_URL}}
RABBITMQ_URL=<YOUR_CLOUDAMQP_URL_HERE>
AUTH_SERVICE_URL=http://auth-service.railway.internal:3001
```

### Step 3.4: Deploy

1. Deploy and wait for **SUCCESS**
2. Internal URL: `http://admin-service.railway.internal:3003`

---

## Service 4: Profile Service

### Step 4.1: Create Service

1. **"+ New"** → **"GitHub Repo"**
2. Select repository
3. Click **"Add Service"**

### Step 4.2: Configure Settings

**Service Name:**

```
profile-service
```

**Root Directory:** Leave EMPTY (do not set)

**Build Command:**

```bash
pnpm install --frozen-lockfile && pnpm db:profile:generate && pnpm nx build profile-service --configuration=production && cd dist/apps/profile-service && echo "" > pnpm-workspace.yaml && pnpm install --frozen-lockfile && cp -r ../../../apps/profile-service/prisma apps/profile-service/ && npx prisma generate --schema=apps/profile-service/prisma/schema.prisma
```

**Start Command:**

```bash
cd dist/apps/profile-service && npx prisma migrate deploy --schema=apps/profile-service/prisma/schema.prisma && node main.js
```

**Watch Paths:**

```
apps/profile-service/**
libs/**
```

### Step 4.3: Set Environment Variables

```bash
PORT=3004
NODE_ENV=production
DATABASE_URL=${{profile-db.DATABASE_URL}}
REDIS_URL=${{redis.REDIS_URL}}
JWT_SECRET=<your-generated-jwt-secret-from-step-above>
AUTH_SERVICE_URL=http://auth-service.railway.internal:3001
```

### Step 4.4: Deploy

1. Deploy and wait for **SUCCESS**
2. Internal URL: `http://profile-service.railway.internal:3004`

---

## Service 5: API Gateway

**IMPORTANT:** Deploy API Gateway **LAST** after all 4 backend services are running!

### Step 5.1: Create Service

1. **"+ New"** → **"GitHub Repo"**
2. Select repository
3. Click **"Add Service"**

### Step 5.2: Configure Settings

**Service Name:**

```
api-gateway
```

**Root Directory:** Leave EMPTY (do not set)

**Build Command:**

```bash
pnpm install --frozen-lockfile && pnpm nx build api-gateway --configuration=production && cd dist/apps/api-gateway && echo "" > pnpm-workspace.yaml && pnpm install --frozen-lockfile
```

**Start Command:**

```bash
cd dist/apps/api-gateway && node main.js
```

**Watch Paths:**

```
apps/api-gateway/**
libs/**
```

### Step 5.3: Set Environment Variables

```bash
PORT=3000
NODE_ENV=production
JWT_SECRET=<your-generated-jwt-secret-from-step-above>
JWT_REFRESH_SECRET=<generate-a-unique-secret-here>
REDIS_URL=${{redis.REDIS_URL}}
CORS_ORIGINS=https://localhost,http://localhost:4200
AUTH_SERVICE_URL=http://auth-service.railway.internal:3001
PAYMENTS_SERVICE_URL=http://payments-service.railway.internal:3002
ADMIN_SERVICE_URL=http://admin-service.railway.internal:3003
PROFILE_SERVICE_URL=http://profile-service.railway.internal:3004
```

**IMPORTANT:** `JWT_REFRESH_SECRET` must match the value used in auth-service. Generate with: `openssl rand -hex 64`

**IMPORTANT NOTES:**

1. Replace `<YOUR_CLOUDAMQP_URL_HERE>` with your CloudAMQP URL (should be saved in Railway from previous session)
2. The `CORS_ORIGINS` will be updated later when we deploy to Vercel - for now, allow localhost
3. All `*_SERVICE_URL` variables use Railway's internal networking (`.railway.internal`)

### Step 5.4: Generate Public Domain

1. Go to **Settings** tab
2. Scroll to **"Networking"**
3. Click **"Generate Domain"**
4. Railway will create a public URL like: `https://api-gateway-production-xxxx.up.railway.app`
5. **SAVE THIS URL** - you'll need it for frontend deployment!

### Step 5.5: Deploy

1. Click **"Deploy"**
2. Wait for **SUCCESS**
3. Note the public URL

---

## Verification Steps

After all 5 services are deployed, verify each one:

### Check Deployment Status

1. In Railway dashboard, verify all services show **green checkmark** (SUCCESS)
2. No services should be in **"CRASHED"** or **"FAILED"** state

### Test Health Endpoints

Open these URLs in your browser (replace `<api-gateway-url>` with your actual URL):

```bash
# API Gateway health
https://<api-gateway-url>/health

# API Gateway ready check
https://<api-gateway-url>/ready

# API Gateway live check
https://<api-gateway-url>/live
```

Expected response:

```json
{
  "status": "ok",
  "timestamp": "2026-03-16T..."
}
```

### Test API Documentation

Visit Swagger docs:

```
https://<api-gateway-url>/api-docs
```

You should see the interactive API documentation.

### Check Service Logs

For each service, click on it in Railway dashboard → **Deployments** → **View Logs**

Look for:

- ✅ "Server started on port XXXX"
- ✅ "Database connected successfully"
- ✅ "Prisma migrations completed"
- ❌ No error messages or stack traces

---

## Troubleshooting

### Runtime Crash: "Cannot find module 'express'" (or any npm package)

**Cause:** The Nx esbuild build uses `bundle: false`, so npm packages are NOT bundled into the output. Node.js resolves modules from the file's location (`dist/apps/<service>/`), not the repo root's `node_modules`.

**Fix:**

1. The build command MUST include these steps after `pnpm nx build`:
   ```bash
   cd dist/apps/<service> && echo "" > pnpm-workspace.yaml && pnpm install --frozen-lockfile
   ```
2. The `pnpm-workspace.yaml` prevents pnpm from walking up to the repo root's workspace
3. The start command MUST `cd dist/apps/<service>` before running `node main.js`
4. Do NOT set Root Directory in Railway — builds must run from repo root

### Build Fails with "pnpm: not found"

**Cause:** Railway's Railpack needs `packageManager` field in the `package.json` it reads.

**Fix:**

1. Ensure `"packageManager": "pnpm@9.15.4"` exists in the root `package.json`
2. Do NOT set Root Directory (otherwise Railpack reads the wrong `package.json`)

### Build Fails with "Command not found" (e.g., `pnpm db:auth:generate`)

**Cause:** Root Directory was set to `apps/<service>`, so pnpm scripts from root `package.json` aren't available.

**Fix:** Remove Root Directory setting. Build commands should run from the repo root.

### Prisma Migration Fails

**Cause:** Database connection issue or schema mismatch.

**Fix:**

1. Verify `DATABASE_URL` variable is set and references correct database
2. Check database is running (should show green in Railway dashboard)
3. View logs to see exact Prisma error
4. The schema path in the start command must point to the copy inside `dist/apps/<service>/apps/<service>/prisma/schema.prisma`

### Prisma Client Not Found at Runtime

**Cause:** The Nx module resolution wrapper expects the Prisma client at `dist/apps/<service>/apps/<service>/node_modules/.prisma/<service>-client`. This must be generated inside the dist directory during build.

**Fix:** The build command must include:
```bash
mkdir -p apps/<service>/prisma && cp ../../../apps/<service>/prisma/schema.prisma apps/<service>/prisma/ && npx prisma generate --schema=apps/<service>/prisma/schema.prisma
```

### Service Crashes on Startup

**Cause:** Missing environment variables or port conflicts.

**Fix:**

1. Check all required env vars are set
2. Verify `PORT` is set correctly (3000-3004)
3. Check logs for specific error message
4. Ensure start command is correct

### API Gateway Cannot Reach Backend Services

**Cause:** Internal networking not configured or wrong service names.

**Fix:**

1. Verify all backend services are deployed and running
2. Check service names match exactly (e.g., `auth-service`, not `auth`)
3. Verify internal URLs use `.railway.internal` domain
4. Check Railway's private networking is enabled (it should be by default)

### Redis Connection Failed

**Cause:** Redis instance not running or wrong URL reference.

**Fix:**

1. Check `redis` service is running in Railway dashboard
2. Verify `REDIS_URL=${{redis.REDIS_URL}}` syntax is exact
3. Check logs for Redis connection error details

---

## Next Steps

After all services are deployed and verified:

1. ✅ **Save API Gateway URL** - needed for frontend deployment
2. ✅ **Update CORS_ORIGINS** - once Vercel frontend is deployed
3. ✅ **Test all endpoints** - via Swagger UI or Postman
4. ✅ **Proceed to Phase 3** - Vercel Frontend Deployment

---

## Service URLs Summary

After deployment, you should have:

| Service          | Type    | Internal URL                                    | Public URL                                           |
| ---------------- | ------- | ----------------------------------------------- | ---------------------------------------------------- |
| auth-service     | Private | `http://auth-service.railway.internal:3001`     | None                                                 |
| payments-service | Private | `http://payments-service.railway.internal:3002` | None                                                 |
| admin-service    | Private | `http://admin-service.railway.internal:3003`    | None                                                 |
| profile-service  | Private | `http://profile-service.railway.internal:3004`  | None                                                 |
| api-gateway      | Public  | `http://api-gateway.railway.internal:3000`      | `https://api-gateway-production-xxxx.up.railway.app` |

Only the API Gateway should have a public URL - all backend services communicate via internal networking.

---

## Environment Variables Reference

Save these for documentation:

```bash
# Common across all services
JWT_SECRET=<your-generated-jwt-secret-from-step-above>

# Database URLs (auto-generated by Railway)
AUTH_DB_URL=${{auth-db.DATABASE_URL}}
PAYMENTS_DB_URL=${{payments-db.DATABASE_URL}}
ADMIN_DB_URL=${{admin-db.DATABASE_URL}}
PROFILE_DB_URL=${{profile-db.DATABASE_URL}}

# Redis URL (auto-generated by Railway)
REDIS_URL=${{redis.REDIS_URL}}

# RabbitMQ URL (from CloudAMQP)
RABBITMQ_URL=<your-cloudamqp-url>
```

---

## Deployment Checklist

Before proceeding to Phase 3, verify:

- [ ] All 5 services show **SUCCESS** status in Railway
- [ ] API Gateway has a public URL generated
- [ ] `/health` endpoint returns 200 OK
- [ ] `/api-docs` shows Swagger documentation
- [ ] All service logs show "Server started" messages
- [ ] No **CRASHED** or **FAILED** deployments
- [ ] All 4 databases are connected (check service logs)
- [ ] Redis connection successful (check API Gateway logs)
- [ ] JWT_SECRET saved securely
- [ ] API Gateway public URL saved

---

**Once all items are checked, you're ready for Phase 3: Vercel Frontend Deployment! 🚀**
