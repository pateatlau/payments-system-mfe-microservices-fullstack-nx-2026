/**
 * API Gateway Main Entry Point
 *
 * POC-3: Production-Ready API Gateway with Streaming HTTP Proxy & WebSocket
 *
 * Features:
 * ✅ Streaming HTTP proxy (zero buffering)
 * ✅ Service routing (Auth, Payments, Admin, Profile)
 * ✅ WebSocket server with authentication
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
 * WebSocket:
 * - /ws?token=<JWT> -> WebSocket server with authentication
 *
 * Implementation:
 * Uses Node.js native http/https modules for streaming proxy with
 * zero buffering, full header forwarding, and proper error handling.
 * WebSocket server provides real-time bidirectional communication.
 */

import express from 'express';
import { createServer } from 'http';
import { config } from './config';
import { corsMiddleware } from './middleware/cors';
import { securityMiddleware } from './middleware/security';
import { generalRateLimiter } from './middleware/rateLimit';
import { requestLogger } from './utils/logger';
import { errorHandler, notFoundHandler } from './middleware/errorHandler';
import healthRoutes from './routes/health';
import proxyRoutes from './routes/proxy-routes';
import { logger } from './utils/logger';
import { createWebSocketServer } from './websocket/server';
import {
  initSentry,
  initSentryErrorHandler,
  initPrometheusMetrics,
  createMetricsMiddleware,
  defaultPathNormalizer,
  initTracing,
  correlationIdMiddleware,
} from '@mfe-poc/observability';
import { createApolloServer, applyGraphQLMiddleware } from './graphql/server';
import { optionalAuth } from './middleware/auth';

/**
 * Initialize OpenTelemetry Tracing (must be first, before any other imports/initialization)
 */
initTracing({
  serviceName: 'api-gateway',
});

/**
 * Create Express application
 */
const app = express();

/**
 * Initialize Prometheus Metrics
 */
const metrics = initPrometheusMetrics('api-gateway');

/**
 * Middleware Setup (order matters!)
 */

// 0. Initialize Sentry (must be first, before other middleware)
initSentry(app, {
  serviceName: 'api-gateway',
});

// 0.5. Correlation ID middleware (early in chain for request tracking)
app.use(correlationIdMiddleware);

// 0.5. Metrics middleware (after Sentry, before other middleware)
app.use(
  createMetricsMiddleware({
    httpRequestsTotal: metrics.http.httpRequestsTotal,
    httpRequestDuration: metrics.http.httpRequestDuration,
    httpActiveConnections: metrics.http.httpActiveConnections,
    httpErrorsTotal: metrics.http.httpErrorsTotal,
    normalizePath: defaultPathNormalizer,
  })
);

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

// Metrics endpoint (no auth required, for Prometheus scraping)
app.get('/metrics', async (_req, res) => {
  try {
    res.set('Content-Type', metrics.registry.contentType);
    const metricsOutput = await metrics.registry.metrics();
    res.send(metricsOutput);
  } catch (error) {
    logger.error('Error generating metrics', { error });
    res.status(500).send('Error generating metrics');
  }
});

// API proxy routes to backend services
// IMPORTANT: Do NOT use body parsing middleware before proxy routes
// The streaming proxy handles request bodies directly via req.pipe()
// Body parsing would buffer the entire request body in memory, defeating the purpose
app.use(proxyRoutes);

/**
 * GraphQL API (POC-3)
 *
 * GraphQL endpoint at /graphql
 * Uses optionalAuth to extract user from token if present
 * Directives (@auth, @admin) handle authentication/authorization
 */
let apolloServer: ReturnType<typeof createApolloServer> | null = null;

/**
 * Error Handling (must be last!)
 */

// 404 handler
app.use(notFoundHandler);

// Sentry error handler (must be before general error handler)
initSentryErrorHandler(app);

// Error handler
app.use(errorHandler);

/**
 * Start Server
 */
const port = config.port;

// Create HTTP server (required for WebSocket)
const httpServer = createServer(app);

// Create WebSocket server
const wsServer = createWebSocketServer(httpServer);

// Apply GraphQL middleware (async - must be after server creation)
// Use optionalAuth to extract user from token if present
app.use('/graphql', optionalAuth);

// Start server with GraphQL initialization
(async () => {
  try {
    // Initialize GraphQL server
    apolloServer = createApolloServer();
    await applyGraphQLMiddleware(app, apolloServer);

    // Start HTTP server
    httpServer.listen(port, () => {
      logger.info(`API Gateway started on port ${port}`, {
        environment: config.nodeEnv,
        corsOrigins: config.corsOrigins,
        websocket: true,
        graphql: true,
      });
    });
  } catch (error) {
    logger.error('Failed to start API Gateway', { error });
    process.exit(1);
  }
})();

/**
 * Graceful shutdown
 */
process.on('SIGTERM', async () => {
  logger.info('SIGTERM received, shutting down gracefully');

  try {
    // Close GraphQL server
    if (apolloServer) {
      await apolloServer.stop();
    }

    // Close WebSocket server
    await wsServer.close();

    // Close HTTP server
    httpServer.close(() => {
      logger.info('HTTP server closed');
      process.exit(0);
    });

    // Force close after 30 seconds
    setTimeout(() => {
      logger.error('Forced shutdown after timeout');
      process.exit(1);
    }, 30000);
  } catch (error) {
    logger.error('Error during graceful shutdown', { error });
    process.exit(1);
  }
});

// Export server instance and WebSocket server for testing
export default app;
export { httpServer, wsServer };
