/**
 * API Gateway Main Entry Point
 *
 * POC-3: Production-Ready API Gateway with Streaming HTTP Proxy
 *
 * Features:
 * ✅ Streaming HTTP proxy (zero buffering)
 * ✅ Service routing (Auth, Payments, Admin, Profile)
 * ✅ Health endpoints (/health, /health/ready, /health/live)
 * ✅ CORS middleware
 * ✅ Security headers (helmet)
 * ✅ Rate limiting
 * ✅ Error handling (502, 504)
 * ✅ Request logging
 * ✅ Header forwarding (X-Forwarded-*)
 *
 * Proxy Routes:
 * - /api/auth/* -> Auth Service (3001)
 * - /api/payments/* -> Payments Service (3002)
 * - /api/admin/* -> Admin Service (3003)
 * - /api/profile/* -> Profile Service (3004)
 *
 * Implementation:
 * Uses Node.js native http/https modules for streaming proxy with
 * zero buffering, full header forwarding, and proper error handling.
 */

import express from 'express';
import { config } from './config';
import { corsMiddleware } from './middleware/cors';
import { securityMiddleware } from './middleware/security';
import { generalRateLimiter } from './middleware/rateLimit';
import { requestLogger } from './utils/logger';
import { errorHandler, notFoundHandler } from './middleware/errorHandler';
import healthRoutes from './routes/health';
import proxyRoutes from './routes/proxy-routes';
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
// IMPORTANT: Do NOT use body parsing middleware before proxy routes
// The streaming proxy handles request bodies directly via req.pipe()
// Body parsing would buffer the entire request body in memory, defeating the purpose
app.use(proxyRoutes);

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
