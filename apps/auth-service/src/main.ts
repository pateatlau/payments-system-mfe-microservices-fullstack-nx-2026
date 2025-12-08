/**
 * Auth Service Main Entry Point
 *
 * Handles user authentication: registration, login, token management
 */

import express from 'express';
import { config } from './config';
import { errorHandler, notFoundHandler } from './middleware/errorHandler';
import healthRoutes from './routes/health';
import authRoutes from './routes/auth';
import { logger } from './utils/logger';

/**
 * Create Express application
 */
const app = express();

/**
 * Middleware Setup
 */

// Body parsing
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

/**
 * Routes
 */

// Health check routes
app.use(healthRoutes);

// Auth routes
app.use(authRoutes);

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
  logger.info(`Auth Service started on port ${port}`, {
    environment: config.nodeEnv,
  });
});

export default app;
