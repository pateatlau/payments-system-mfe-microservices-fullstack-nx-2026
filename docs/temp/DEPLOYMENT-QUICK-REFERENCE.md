# CD Deployment Quick Reference - Railway + Vercel

**Date:** March 16, 2026

---

## 📋 Phase 2: Railway Backend (CURRENT PHASE)

**Deployment Guide:** `docs/temp/RAILWAY-BACKEND-DEPLOYMENT-GUIDE.md`

### Database Status ✅

- ✅ `auth-db` - PostgreSQL
- ✅ `payments-db` - PostgreSQL
- ✅ `admin-db` - PostgreSQL
- ✅ `profile-db` - PostgreSQL
- ✅ `redis` - Redis

### Services to Deploy (In Order):

1. **auth-service** → Port 3001
2. **payments-service** → Port 3002
3. **admin-service** → Port 3003
4. **profile-service** → Port 3004
5. **api-gateway** → Port 3000 (DEPLOY LAST!)

### Critical Secrets

**JWT_SECRET (use for all services):**

```
adbbaf99a5fc72e3e2bdf31723391ddfbf68b1572f4edcd927dcfda58b7aec346828894a1e5345ada4c6c7055cbf128d6d5563efc31c88c5d0a8f391d9cb2d27
```

**CloudAMQP URL:**

```
<From previous session - check Railway env vars>
```

### Build Command Template

```bash
pnpm install --frozen-lockfile && pnpm db:<service>:generate && pnpm nx build <service-name> --configuration=production
```

### Start Command Template (Services with DB)

```bash
npx prisma migrate deploy --schema=apps/<service-name>/prisma/schema.prisma && node dist/apps/<service-name>/main.js
```

### Start Command (API Gateway - No DB)

```bash
node dist/apps/api-gateway/main.js
```

### Test After Deployment

```bash
# Health check
https://<api-gateway-url>/health

# Swagger docs
https://<api-gateway-url>/api-docs
```

---

## 📋 Phase 3: Vercel Frontend

**Deployment Guide:** `docs/temp/VERCEL-FRONTEND-DEPLOYMENT-GUIDE.md`

### Deployment Order:

1. **auth-mfe** → Remote MFE
2. **payments-mfe** → Remote MFE
3. **admin-mfe** → Remote MFE
4. **profile-mfe** → Remote MFE
5. **shell** → Host App (DEPLOY LAST!)

### Build Command (MFEs)

```bash
cd ../.. && pnpm install --frozen-lockfile && pnpm nx build <mfe-name> --configuration=production
```

### Build Command (Shell)

```bash
cd ../.. && pnpm install --frozen-lockfile && pnpm build:remotes && pnpm nx build shell --configuration=production
```

### Output Directory (All)

```
../../dist/apps/<app-name>
```

### Environment Variables (MFEs)

| Variable          | Value                           |
| ----------------- | ------------------------------- |
| `NX_API_BASE_URL` | `https://<api-gateway-url>/api` |
| `NODE_ENV`        | `production`                    |

### Environment Variables (Shell)

| Variable              | Value                                  |
| --------------------- | -------------------------------------- |
| `NX_API_BASE_URL`     | `https://<api-gateway-url>/api`        |
| `NX_AUTH_MFE_URL`     | `https://auth-mfe-<id>.vercel.app`     |
| `NX_PAYMENTS_MFE_URL` | `https://payments-mfe-<id>.vercel.app` |
| `NX_ADMIN_MFE_URL`    | `https://admin-mfe-<id>.vercel.app`    |
| `NX_PROFILE_MFE_URL`  | `https://profile-mfe-<id>.vercel.app`  |
| `NODE_ENV`            | `production`                           |

### Cache Headers (Critical!)

**For all MFEs - Add in Vercel Settings → Headers:**

**Source:** `/remoteEntry.js`
**Header:** `Cache-Control: no-cache, no-store, must-revalidate`

### CORS Update (After Vercel Deployment)

Update Railway API Gateway → Variables:

```bash
CORS_ORIGINS=https://shell-<id>.vercel.app,https://auth-mfe-<id>.vercel.app,https://payments-mfe-<id>.vercel.app,https://admin-mfe-<id>.vercel.app,https://profile-mfe-<id>.vercel.app
```

---

## 🔍 Verification Checklist

### Phase 2 (Railway Backend)

- [ ] All 5 services show **SUCCESS** in Railway dashboard
- [ ] API Gateway has public URL
- [ ] `/health` endpoint returns 200 OK
- [ ] `/api-docs` shows Swagger documentation
- [ ] All service logs show "Server started"
- [ ] No CRASHED/FAILED deployments
- [ ] JWT_SECRET saved securely

### Phase 3 (Vercel Frontend)

- [ ] All 5 frontend apps deployed
- [ ] All deployment URLs saved
- [ ] Environment variables configured
- [ ] Cache headers set for `remoteEntry.js`
- [ ] CORS updated on API Gateway
- [ ] Shell app loads all remote MFEs
- [ ] Login flow works
- [ ] No CORS or Module Federation errors

---

## 📝 URL Tracking Sheet

Fill in as you deploy:

### Railway Backend

| Service          | URL           |
| ---------------- | ------------- |
| API Gateway      | `https://`    |
| Auth Service     | Internal only |
| Payments Service | Internal only |
| Admin Service    | Internal only |
| Profile Service  | Internal only |

### Vercel Frontend

| App          | URL        |
| ------------ | ---------- |
| Shell        | `https://` |
| Auth MFE     | `https://` |
| Payments MFE | `https://` |
| Admin MFE    | `https://` |
| Profile MFE  | `https://` |

---

## 🆘 Quick Troubleshooting

### Railway Build Fails

- Check build command has `cd` to root
- Verify `pnpm-lock.yaml` exists
- Check service logs for specific error

### Prisma Migration Fails

- Verify `DATABASE_URL` is set correctly
- Check database service is running
- Run migration manually: `railway run --service <name> npx prisma migrate deploy`

### Vercel Build Fails

- Ensure build command starts with `cd ../..`
- Check root directory is correct
- Verify monorepo dependencies resolved

### CORS Errors

- Update `CORS_ORIGINS` in API Gateway
- Include ALL Vercel URLs
- Wait ~2 minutes for Railway redeploy

### Module Federation Fails

- Check all remote MFE URLs are correct
- Verify `remoteEntry.js` loads (Network tab)
- Check cache headers are set
- Hard refresh browser

---

## 📞 Support Resources

- **Railway Docs:** https://docs.railway.app
- **Vercel Docs:** https://vercel.com/docs
- **Project CLAUDE.md:** Full architecture reference
- **Deployment Plans:**
  - `docs/CD-POC-RAILWAY-VERCEL.md` - Main plan
  - `docs/temp/RAILWAY-BACKEND-DEPLOYMENT-GUIDE.md` - Phase 2
  - `docs/temp/VERCEL-FRONTEND-DEPLOYMENT-GUIDE.md` - Phase 3

---

**Current Status:** Phase 2 (Backend Deployment) in progress 🚀
