/**
 * API Gateway Main Entry Point
 *
 * ⚠️ POC-2 STATUS: HEALTH ENDPOINTS ONLY - PROXY DISABLED
 *
 * The API Gateway currently serves ONLY health check endpoints.
 * Proxy functionality is disabled and deferred to POC-3.
 *
 * What's Working:
 * ✅ Health endpoints (/health, /health/ready, /health/live)
 * ✅ CORS middleware
 * ✅ Security headers (helmet)
 * ✅ Rate limiting
 * ✅ Error handling
 * ✅ Request logging
 *
 * What's Disabled:
 * ❌ Proxy routes (http-proxy-middleware)
 *
 * Frontend Impact:
 * Frontend applications communicate directly with backend services.
 * No functionality is impacted - all flows work with direct service URLs.
 *
 * Documentation:
 * - Direct URLs Guide: docs/POC-2-Implementation/DIRECT-SERVICE-URLS-README.md
 * - POC-3 Proxy Plan: docs/POC-3-Planning/api-gateway-proxy-implementation.md
 */

import express from 'express';
import { config } from './config';
import { corsMiddleware } from './middleware/cors';
import { securityMiddleware } from './middleware/security';
import { generalRateLimiter } from './middleware/rateLimit';
import { requestLogger } from './utils/logger';
import { errorHandler, notFoundHandler } from './middleware/errorHandler';
import healthRoutes from './routes/health';
// POC-2: Proxy routes disabled - using direct service URLs
// import proxyRoutes from './routes/proxy';
import { logger } from './utils/logger';

/**
 * Create Express application
 */
const app = express();

/**
 * Middleware Setup (order matters!)
 */

// 1. Security headers
app.use(securityMiddleware);

// 2. CORS
app.use(corsMiddleware);

// 3. Request logging
app.use(requestLogger);

// 4. Rate limiting
// Type assertion needed for express-rate-limit compatibility with Express 5
app.use(generalRateLimiter as unknown as express.RequestHandler);

/**
 * Routes
 */

// Health check routes (no auth required)
// Body parsing is OK for health routes since they don't proxy
app.use('/health', express.json());
app.use('/health', express.urlencoded({ extended: true }));
app.use(healthRoutes);

// API proxy routes to backend services
// POC-2: Proxy routes temporarily disabled - frontend uses direct service URLs
// API Gateway proxy implementation deferred to POC-3
// See docs/POC-3-Planning/api-gateway-proxy-implementation.md for details
// app.use(proxyRoutes);

/**
 * Error Handling (must be last!)
 */

// 404 handler
app.use(notFoundHandler);

// Error handler
app.use(errorHandler);

/**
 * Start Server
 */
const port = config.port;

app.listen(port, () => {
  logger.info(`API Gateway started on port ${port}`, {
    environment: config.nodeEnv,
    corsOrigins: config.corsOrigins,
  });
});

export default app;
