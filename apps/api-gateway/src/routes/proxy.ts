/**
 * Service Proxy Routes
 *
 * ⚠️ POC-2 STATUS: DISABLED
 *
 * Proxy routes are temporarily disabled for POC-2.
 * Frontend applications communicate directly with backend services.
 *
 * Direct Service URLs (POC-2):
 * - Auth Service: http://localhost:3001
 * - Payments Service: http://localhost:3002
 * - Admin Service: http://localhost:3003
 * - Profile Service: http://localhost:3004
 *
 * Why Disabled:
 * During POC-2 implementation, we encountered technical issues with
 * http-proxy-middleware v3.x including request body streaming problems,
 * path rewriting complications, and timeout errors.
 *
 * POC-3 Implementation:
 * API Gateway proxy will be re-implemented in POC-3 with a more robust
 * solution. See: docs/POC-3-Planning/api-gateway-proxy-implementation.md
 */

import { Router } from 'express';

const router = Router();

/**
 * POC-2: All proxy routes are disabled
 *
 * Frontend MFEs communicate directly with backend services:
 * - Auth Service: http://localhost:3001
 * - Payments Service: http://localhost:3002
 * - Admin Service: http://localhost:3003
 * - Profile Service: http://localhost:3004
 *
 * This will be re-implemented in POC-3 with a more robust solution.
 */

// Placeholder route for documentation
router.get('/proxy-disabled', (_req, res) => {
  res.status(501).json({
    success: false,
    error: {
      code: 'PROXY_DISABLED',
      message:
        'API Gateway proxy is disabled in POC-2. Use direct service URLs.',
      services: {
        auth: 'http://localhost:3001',
        payments: 'http://localhost:3002',
        admin: 'http://localhost:3003',
        profile: 'http://localhost:3004',
      },
    },
  });
});

export default router;
