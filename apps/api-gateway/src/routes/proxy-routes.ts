/**
 * API Gateway Proxy Routes
 *
 * Purpose: Route definitions for proxying requests to backend microservices
 * Features:
 *   - Auth Service proxy (/api/auth -> AUTH_SERVICE_URL)
 *   - Payments Service proxy (/api/payments -> PAYMENTS_SERVICE_URL)
 *   - Admin Service proxy (/api/admin -> ADMIN_SERVICE_URL)
 *   - Profile Service proxy (/api/profile -> PROFILE_SERVICE_URL)
 *   - Circuit breaker protection for all services (Phase 5.1)
 *   - API versioning support (Phase 6.4): /api/v1/auth, /api/v2/auth, etc.
 *
 * POC-3 Implementation: Production-ready streaming HTTP proxy with circuit breaker
 */

import { Router, Request, Response } from 'express';
import { createStreamingProxy, ProxyTarget, getAllProxyCircuitStats } from '../middleware/proxy';
import { logger } from '../utils/logger';
import {
  apiVersionMiddleware,
  setVersionConfig,
  getVersionConfig,
} from '../middleware/apiVersion';
import { oauthRateLimiter } from '../middleware/rateLimit';
import { authenticate } from '../middleware/auth';
import { config } from '../config';

/**
 * Parse a full service URL string into a ProxyTarget
 * e.g. "http://auth-service.railway.internal:3001" -> { host, port, protocol }
 */
function parseServiceUrl(urlString: string): ProxyTarget {
  const url = new URL(urlString);
  return {
    host: url.hostname,
    port: url.port ? parseInt(url.port, 10) : url.protocol === 'https:' ? 443 : 80,
    protocol: url.protocol.replace(':', '') as 'http' | 'https',
  };
}

/**
 * Circuit breaker configuration (shared across services)
 */
const circuitBreakerConfig = {
  enabled: true,
  errorThresholdPercentage: 50,  // Open circuit after 50% errors
  resetTimeout: 30000,           // Try again after 30 seconds
  volumeThreshold: 5,            // Minimum 5 requests before calculating threshold
};

const router = Router();

/**
 * Initialize API versioning configuration
 *
 * Currently supports v1 only. When adding v2:
 * 1. Add 2 to supportedVersions array
 * 2. Update latestVersion to 2
 * 3. Add v1 to deprecatedVersions with sunset date
 */
setVersionConfig({
  supportedVersions: [1],
  defaultVersion: 1,
  latestVersion: 1,
  deprecatedVersions: [
    // Example for future deprecation:
    // { version: 1, sunsetDate: '2027-01-01', message: 'Please migrate to v2' }
  ],
  allowUnversioned: true, // Allow /api/auth as alias for /api/v1/auth
});

/**
 * Apply API versioning middleware to all API routes
 * This extracts version from URL or headers and adds it to the request
 */
router.use('/api', apiVersionMiddleware);

/**
 * Versioned routes (/api/v1/*, /api/v2/*)
 * These are rewritten by apiVersionMiddleware to /api/*
 * So they are handled by the same proxy routes below
 */

/**
 * Service target configurations — resolved from AUTH_SERVICE_URL,
 * PAYMENTS_SERVICE_URL, ADMIN_SERVICE_URL, PROFILE_SERVICE_URL env vars.
 * Defaults to localhost ports for local development.
 */
const services: Record<string, ProxyTarget> = {
  auth: parseServiceUrl(config.services.auth),
  payments: parseServiceUrl(config.services.payments),
  admin: parseServiceUrl(config.services.admin),
  profile: parseServiceUrl(config.services.profile),
};

/**
 * OAuth Rate Limiting
 *
 * Apply stricter rate limiting to OAuth initiation endpoints to prevent abuse.
 * Limit: 10 OAuth initiations per 15 minutes per IP
 *
 * Note: These routes MUST be defined before the general /api/auth proxy
 * so they can apply the rate limiter before proxying.
 */

// OAuth initiate flow - GET /api/auth/oauth/:provider (but not callback, providers, or accounts)
router.get(
  '/api/auth/oauth/:provider',
  (req, _res, next) => {
    // Skip rate limiting for special routes that shouldn't be limited
    const provider = req.params.provider;
    if (provider === 'callback' || provider === 'providers' || provider === 'accounts') {
      return next('route'); // Skip to next matching route (the general proxy)
    }
    next();
  },
  oauthRateLimiter,
  createStreamingProxy({
    target: services['auth']!,
    serviceName: 'auth-service',
    pathRewrite: {
      '^/api/auth': '/auth', // Rewrite /api/auth/oauth/:provider to /auth/oauth/:provider
    },
    timeout: 30000,
    circuitBreaker: circuitBreakerConfig,
  })
);

// OAuth link account - POST /api/auth/oauth/link/:provider (requires authentication)
router.post(
  '/api/auth/oauth/link/:provider',
  authenticate,
  oauthRateLimiter,
  createStreamingProxy({
    target: services['auth']!,
    serviceName: 'auth-service',
    pathRewrite: {
      '^/api/auth': '/auth', // Rewrite /api/auth/oauth/link/:provider to /auth/oauth/link/:provider
    },
    timeout: 30000,
    circuitBreaker: circuitBreakerConfig,
  })
);

/**
 * Auth Service Proxy
 *
 * Routes:
 *   POST /api/auth/login -> http://localhost:3001/auth/login
 *   POST /api/auth/register -> http://localhost:3001/auth/register
 *   POST /api/auth/refresh -> http://localhost:3001/auth/refresh
 *   POST /api/auth/logout -> http://localhost:3001/auth/logout
 *   GET /api/auth/me -> http://localhost:3001/auth/me
 *   POST /api/auth/mfa/setup -> http://localhost:3001/auth/mfa/setup (MFA setup)
 *   POST /api/auth/mfa/verify-setup -> http://localhost:3001/auth/mfa/verify-setup
 *   POST /api/auth/mfa/verify -> http://localhost:3001/auth/mfa/verify
 *   POST /api/auth/mfa/complete -> http://localhost:3001/auth/mfa/complete
 *   GET /api/auth/mfa/status -> http://localhost:3001/auth/mfa/status
 *   POST /api/auth/mfa/disable -> http://localhost:3001/auth/mfa/disable
 *   POST /api/auth/mfa/backup-codes/regenerate -> http://localhost:3001/auth/mfa/backup-codes/regenerate
 *   GET /api/auth/oauth/callback -> http://localhost:3001/auth/oauth/callback
 *   GET /api/auth/oauth/providers -> http://localhost:3001/auth/oauth/providers
 *   GET /api/auth/oauth/accounts -> http://localhost:3001/auth/oauth/accounts
 *   DELETE /api/auth/oauth/:provider -> http://localhost:3001/auth/oauth/:provider
 *
 * Note: Express strips /api/auth when routing, so we use custom proxy with prepend
 * OAuth initiation routes (GET /oauth/:provider, POST /oauth/link/:provider) are
 * handled above with stricter rate limiting.
 */
router.use(
  '/api/auth',
  createStreamingProxy({
    target: services['auth']!,
    serviceName: 'auth-service',
    pathRewrite: {
      '^': '/auth', // Prepend /auth to the path
    },
    timeout: 30000,
    circuitBreaker: circuitBreakerConfig,
  })
);

/**
 * Payments Service Proxy
 *
 * Routes:
 *   GET /api/payments -> http://localhost:3002/payments
 *   POST /api/payments -> http://localhost:3002/payments
 *   GET /api/payments/:id -> http://localhost:3002/payments/:id
 *   PATCH /api/payments/:id/status -> http://localhost:3002/payments/:id/status
 *
 * Note: Express strips /api/payments when routing, so we prepend /payments
 */
router.use(
  '/api/payments',
  createStreamingProxy({
    target: services['payments']!,
    serviceName: 'payments-service',
    pathRewrite: {
      '^': '/payments', // Prepend /payments to the path
    },
    timeout: 30000,
    circuitBreaker: circuitBreakerConfig,
  })
);

/**
 * Admin Service Proxy
 *
 * Routes:
 *   GET /api/admin/users -> http://localhost:3003/api/admin/users
 *   GET /api/admin/users/:id -> http://localhost:3003/api/admin/users/:id
 *   PUT /api/admin/users/:id -> http://localhost:3003/api/admin/users/:id
 *   DELETE /api/admin/users/:id -> http://localhost:3003/api/admin/users/:id
 *   PATCH /api/admin/users/:id/role -> http://localhost:3003/api/admin/users/:id/role
 *   POST /api/admin/users/:id/suspend -> http://localhost:3003/api/admin/users/:id/suspend
 *   POST /api/admin/users/:id/unsuspend -> http://localhost:3003/api/admin/users/:id/unsuspend
 *
 * Note: Express strips /api/admin when routing, so we prepend /api/admin back
 */
router.use(
  '/api/admin',
  createStreamingProxy({
    target: services['admin']!,
    serviceName: 'admin-service',
    pathRewrite: {
      '^': '/api/admin', // Prepend /api/admin to the path
    },
    timeout: 30000,
    circuitBreaker: circuitBreakerConfig,
  })
);

/**
 * Profile Service Proxy
 *
 * Routes:
 *   GET /api/profile -> http://localhost:3004/api/profile
 *   PUT /api/profile -> http://localhost:3004/api/profile
 *   GET /api/profile/preferences -> http://localhost:3004/api/profile/preferences
 *   PUT /api/profile/preferences -> http://localhost:3004/api/profile/preferences
 *
 * Note: Express strips /api/profile when routing, so we prepend /api/profile back
 */
router.use(
  '/api/profile',
  createStreamingProxy({
    target: services['profile']!,
    serviceName: 'profile-service',
    pathRewrite: {
      '^': '/api/profile', // Prepend /api/profile to the path
    },
    timeout: 30000,
    circuitBreaker: circuitBreakerConfig,
  })
);

/**
 * API Version Info Endpoint
 *
 * GET /api/version - Returns current API versioning information
 */
router.get('/api/version', (_req: Request, res: Response) => {
  const config = getVersionConfig();
  res.json({
    success: true,
    data: {
      currentVersion: config.latestVersion,
      supportedVersions: config.supportedVersions,
      defaultVersion: config.defaultVersion,
      deprecatedVersions: config.deprecatedVersions.map((d) => ({
        version: d.version,
        sunsetDate: d.sunsetDate,
        message: d.message,
      })),
      versioningMethods: {
        urlBased: {
          description: 'Include version in URL path',
          example: '/api/v1/auth/login',
          format: '/api/v{version}/{resource}',
        },
        headerBased: {
          description: 'Include version in Accept header',
          example: 'Accept: application/vnd.api+json; version=1',
          alternativeFormat: 'Accept: application/vnd.api.v1+json',
        },
      },
      documentation: '/api-docs',
    },
  });
});

/**
 * Log proxy route initialization
 */
const versionConfig = getVersionConfig();
logger.info('API Gateway proxy routes initialized', {
  services: Object.keys(services),
  routes: ['/api/auth', '/api/payments', '/api/admin', '/api/profile'],
  versionedRoutes: ['/api/v1/auth', '/api/v1/payments', '/api/v1/admin', '/api/v1/profile'],
  apiVersioning: {
    supportedVersions: versionConfig.supportedVersions,
    defaultVersion: versionConfig.defaultVersion,
    latestVersion: versionConfig.latestVersion,
    deprecatedVersions: versionConfig.deprecatedVersions.length,
  },
  circuitBreaker: {
    enabled: circuitBreakerConfig.enabled,
    errorThresholdPercentage: circuitBreakerConfig.errorThresholdPercentage,
    resetTimeout: circuitBreakerConfig.resetTimeout,
    volumeThreshold: circuitBreakerConfig.volumeThreshold,
  },
});

/**
 * Export circuit stats getter for health endpoint
 * Export version config getter for other modules
 */
export { getAllProxyCircuitStats, getVersionConfig };

export default router;
