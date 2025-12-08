/**
 * API Gateway Main Entry Point
 *
 * The API Gateway serves as the single entry point for all frontend requests
 * Routes requests to appropriate backend services
 * Handles authentication, CORS, rate limiting, and error handling
 */

import express from 'express';
import { config } from './config';
import { corsMiddleware } from './middleware/cors';
import { securityMiddleware } from './middleware/security';
import { generalRateLimiter } from './middleware/rateLimit';
import { requestLogger } from './utils/logger';
import { errorHandler, notFoundHandler } from './middleware/errorHandler';
import healthRoutes from './routes/health';
import proxyRoutes from './routes/proxy';
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

// 3. Body parsing
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 4. Request logging
app.use(requestLogger);

// 5. Rate limiting
// Type assertion needed for express-rate-limit compatibility with Express 5
app.use(generalRateLimiter as unknown as express.RequestHandler);

/**
 * Routes
 */

// Health check routes (no auth required)
app.use(healthRoutes);

// API proxy routes to backend services
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
