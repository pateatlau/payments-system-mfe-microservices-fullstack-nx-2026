# API Gateway Proxy Implementation - POC-3

## Status: Deferred to POC-3

### Issue Summary

During POC-2 implementation, we encountered persistent issues with the API Gateway proxy middleware that prevented reliable request forwarding to backend services.

### Technical Details

**Problem:**
- Request body not being forwarded correctly through proxy
- `http-proxy-middleware` v3.x path rewriting not working as expected with Express router middleware
- Request timeouts and "request aborted" errors in backend services
- Body parser middleware consuming request stream before proxy could forward it

**Attempts Made:**
1. ✅ Fixed body parser order (moved to non-proxy routes only)
2. ✅ Tried object-based `pathRewrite` configuration
3. ✅ Tried function-based `pathRewrite` configuration  
4. ✅ Implemented custom proxy using axios (without http-proxy-middleware)
5. ❌ All approaches resulted in request body forwarding issues

**Root Cause:**
The combination of:
- Express router middleware stripping path prefixes
- Body parser consuming request streams
- Complex path rewriting requirements
- `http-proxy-middleware` v3.x API changes

Made it extremely difficult to implement a reliable proxy within the POC-2 timeline.

### Current Solution (POC-2)

**Direct Service URLs:**
Frontend applications now call backend services directly, bypassing the API Gateway:

```typescript
// Service URLs
AUTH_SERVICE: http://localhost:3001
PAYMENTS_SERVICE: http://localhost:3002
ADMIN_SERVICE: http://localhost:3003
PROFILE_SERVICE: http://localhost:3004
```

**Configuration:**
- `libs/shared-api-client/src/lib/apiClient.ts`: Default baseURL set to Auth Service
- MFE Rspack configs: `NX_API_BASE_URL` environment variable configured per service
- All authentication, payments, profile, and admin features work correctly

### Recommended Approach for POC-3

**Option 1: Custom HTTP Proxy (Recommended)**
Implement a lightweight custom proxy without external libraries:
- Use Node.js native `http`/`https` modules
- Stream request/response bodies directly (don't buffer)
- Simple path rewriting logic
- Full control over headers and streaming

**Option 2: Alternative Proxy Library**
Research and evaluate alternatives to `http-proxy-middleware`:
- `http-proxy` (lower-level, more control)
- `express-http-proxy`
- Custom implementation with `node-http-proxy`

**Option 3: Service Mesh / Reverse Proxy**
For production, consider using:
- Nginx as reverse proxy
- Traefik
- Kong API Gateway
- AWS API Gateway / Azure API Management

### Implementation Checklist for POC-3

- [ ] Research and select best proxy approach
- [ ] Implement proxy with request body streaming
- [ ] Test with all HTTP methods (GET, POST, PUT, PATCH, DELETE)
- [ ] Verify authentication token forwarding
- [ ] Test with large request/response bodies
- [ ] Add comprehensive error handling
- [ ] Add request/response logging
- [ ] Performance testing
- [ ] Update frontend to use API Gateway URL
- [ ] Update documentation

### Testing Criteria

The proxy implementation must successfully:
1. ✅ Forward authentication requests (login, register, refresh)
2. ✅ Forward payment creation requests with proper body
3. ✅ Forward profile update requests
4. ✅ Handle file uploads (if applicable)
5. ✅ Preserve all headers (especially Authorization)
6. ✅ Return proper error responses
7. ✅ Handle timeouts gracefully
8. ✅ Support request/response streaming

### Files Modified in POC-2

**Frontend (Direct Service URLs):**
- `libs/shared-api-client/src/lib/apiClient.ts`
- `apps/shell/rspack.config.js`
- `apps/auth-mfe/rspack.config.js`
- `apps/payments-mfe/rspack.config.js`

**Backend (Proxy Disabled):**
- `apps/api-gateway/src/main.ts` (proxy routes commented out)
- `apps/api-gateway/src/routes/proxy.ts` (contains non-working implementations)

### References

- [http-proxy-middleware v3 Migration Guide](https://github.com/chimurai/http-proxy-middleware/blob/master/MIGRATION.md)
- [Express Body Parser Docs](https://expressjs.com/en/api.html#express.json)
- [Node.js HTTP Proxy Patterns](https://nodejs.org/en/docs/guides/anatomy-of-an-http-transaction/)

---

**Date Created:** 2025-12-09
**Created By:** AI Assistant
**Status:** Documented for POC-3 Implementation
