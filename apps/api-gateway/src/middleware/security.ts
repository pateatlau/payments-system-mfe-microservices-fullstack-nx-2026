/**
 * Security Middleware
 *
 * Configures security headers using Helmet
 */

import helmet from 'helmet';

/**
 * Helmet middleware for security headers
 * Protects against common web vulnerabilities
 */
export const securityMiddleware = helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", 'data:', 'https:'],
    },
  },
  hsts: {
    maxAge: 31536000, // 1 year
    includeSubDomains: true,
    preload: true,
  },
  frameguard: {
    action: 'deny',
  },
  noSniff: true,
  xssFilter: true,
  // CRITICAL for Safari: Allow cross-origin requests from MFE frontend
  // Without this, Safari blocks API responses due to strict CORP enforcement
  crossOriginResourcePolicy: { policy: 'cross-origin' },
  // Allow popups for OAuth flows while maintaining security
  crossOriginOpenerPolicy: { policy: 'same-origin-allow-popups' },
});
