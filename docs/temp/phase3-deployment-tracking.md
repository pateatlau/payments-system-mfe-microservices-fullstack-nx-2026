# Phase 3: Vercel Frontend Deployment - Progress Tracker

**Date Started:** March 17, 2026
**API Gateway URL:** https://api-gateway-production-ab9b.up.railway.app

---

## Deployment URLs

### Backend (Railway) - ✅ Complete

- **API Gateway:** https://api-gateway-production-ab9b.up.railway.app
- **API Base URL:** https://api-gateway-production-ab9b.up.railway.app/api

### Frontend (Vercel) - In Progress

| Service      | Status         | Vercel URL | Notes           |
| ------------ | -------------- | ---------- | --------------- |
| Auth MFE     | ⏳ Not Started | _Pending_  | Deploy first    |
| Payments MFE | ⏳ Not Started | _Pending_  | Deploy second   |
| Admin MFE    | ⏳ Not Started | _Pending_  | Deploy third    |
| Profile MFE  | ⏳ Not Started | _Pending_  | Deploy fourth   |
| Shell (Host) | ⏳ Not Started | _Pending_  | **Deploy LAST** |

---

## Deployment Order

1. ✅ Auth MFE
2. ✅ Payments MFE
3. ✅ Admin MFE
4. ✅ Profile MFE
5. ✅ Shell (after collecting all remote URLs)

---

## Environment Variables Reference

### For All MFEs (Auth, Payments, Admin, Profile)

```bash
NX_API_BASE_URL=https://api-gateway-production-ab9b.up.railway.app/api
NODE_ENV=production
```

### For Shell (Additional Variables)

```bash
NX_API_BASE_URL=https://api-gateway-production-ab9b.up.railway.app/api
NX_AUTH_MFE_URL=_Pending_
NX_PAYMENTS_MFE_URL=_Pending_
NX_ADMIN_MFE_URL=_Pending_
NX_PROFILE_MFE_URL=_Pending_
NODE_ENV=production
```

---

## CORS Update (After All Deployments)

Update Railway API Gateway `CORS_ORIGINS` variable with:

```bash
CORS_ORIGINS=<shell-url>,<auth-mfe-url>,<payments-mfe-url>,<admin-mfe-url>,<profile-mfe-url>
```

---

## Post-Deployment Checklist

- [ ] All 5 frontend apps deployed
- [ ] All deployment URLs collected
- [ ] Shell environment variables updated with remote MFE URLs
- [ ] Cache headers configured for all projects
- [ ] CORS updated on API Gateway
- [ ] All MFEs load standalone
- [ ] Shell loads all remote MFEs
- [ ] Login flow works
- [ ] No CORS errors
- [ ] No Module Federation errors
- [ ] Auto-deploy enabled for all projects

---

## Notes

_Add any issues or observations during deployment here_
