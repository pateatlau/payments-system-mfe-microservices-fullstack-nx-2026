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
import cors from 'cors';
import { initSentry, initSentryErrorHandler } from '@mfe-poc/observability';

/**
 * Create Express application
 */
const app = express();

/**
 * Middleware Setup
 */

// Initialize Sentry (must be first, before other middleware)
initSentry(app, {
  serviceName: 'auth-service',
});

// CORS - allow frontend MFEs (shell/auth/payments/admin)
const allowedOrigins = [
  'http://localhost:4200',
  'http://localhost:4201',
  'http://localhost:4202',
  'http://localhost:4203',
];

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    },
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: [
      'Content-Type',
      'Authorization',
      'X-Requested-With',
      'X-Request-ID',
      'Accept',
      'Origin',
    ],
    credentials: true,
    optionsSuccessStatus: 204,
  })
);

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

// Sentry error handler (must be before general error handler)
initSentryErrorHandler(app);

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
