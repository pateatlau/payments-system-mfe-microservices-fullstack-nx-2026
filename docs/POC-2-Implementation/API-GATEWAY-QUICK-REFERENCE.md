# API Gateway - Quick Reference Card (POC-2)

> **TL;DR:** API Gateway works for everything except proxying. Frontend uses direct service URLs. No functionality impacted.

---

## Status at a Glance

| Component        | Status      | Notes                                      |
| ---------------- | ----------- | ------------------------------------------ |
| Health Endpoints | ✅ Working  | `/health`, `/health/ready`, `/health/live` |
| CORS             | ✅ Working  | All MFE ports configured                   |
| Security         | ✅ Working  | Helmet middleware active                   |
| Rate Limiting    | ✅ Working  | 100 req/15min                              |
| Logging          | ✅ Working  | Winston structured logs                    |
| Error Handling   | ✅ Working  | Global handler                             |
| **Proxy Routes** | ❌ Disabled | **Deferred to POC-3**                      |

---

## Do I Need to Start API Gateway?

**Short Answer:** No, it's optional for POC-2.

```bash
# Start backend WITHOUT gateway (recommended)
pnpm backend:dev:all

# Start backend WITH gateway (optional, for health monitoring)
pnpm backend:dev:with-gateway
```

---

## Direct Service URLs

| Service  | URL                     |
| -------- | ----------------------- |
| Auth     | `http://localhost:3001` |
| Payments | `http://localhost:3002` |
| Admin    | `http://localhost:3003` |
| Profile  | `http://localhost:3004` |

---

## Quick Health Check

```bash
# Check if gateway is running (optional)
curl http://localhost:3000/health

# Check backend services (required)
curl http://localhost:3001/health  # Auth
curl http://localhost:3002/health  # Payments
curl http://localhost:3003/health  # Admin
curl http://localhost:3004/health  # Profile
```

---

## Why is Proxy Disabled?

Technical issues with `http-proxy-middleware` v3.x:

- Request body streaming problems
- Path rewriting complications
- Header forwarding issues

**Solution:** Use direct service URLs for POC-2, implement robust proxy in POC-3.

---

## Where to Learn More

| Topic             | Document                                                    |
| ----------------- | ----------------------------------------------------------- |
| Developer README  | `apps/api-gateway/README.md`                                |
| Detailed Status   | `apps/api-gateway/POC-2-STATUS.md`                          |
| Direct URLs Setup | `docs/POC-2-Implementation/DIRECT-SERVICE-URLS-README.md`   |
| Option A Summary  | `docs/POC-2-Implementation/API-GATEWAY-OPTION-A-SUMMARY.md` |
| POC-3 Proxy Plan  | `docs/POC-3-Planning/api-gateway-proxy-implementation.md`   |

---

## Key Takeaways

✅ **API Gateway infrastructure is solid** - All middleware working  
✅ **Frontend flows unaffected** - Direct URLs work perfectly  
✅ **Optional for POC-2** - Can skip starting it  
✅ **POC-3 Ready** - Foundation exists for proxy implementation

**Bottom Line:** Everything works! Just using direct URLs instead of going through the gateway.
