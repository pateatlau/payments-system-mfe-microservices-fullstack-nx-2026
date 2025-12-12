/**
 * Admin Service - Main Entry Point
 * Port: 3003
 * Responsibilities: User management (ADMIN only)
 */

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import config from './config';
import { logger } from './utils/logger';
import { errorHandler, notFoundHandler } from './middleware/errorHandler';
import healthRoutes from './routes/health';
import {
  initSentry,
  initSentryErrorHandler,
  initPrometheusMetrics,
  createMetricsMiddleware,
  defaultPathNormalizer,
  initTracing,
  correlationIdMiddleware,
} from '@mfe-poc/observability';

/**
 * Initialize OpenTelemetry Tracing (must be first, before any other imports/initialization)
 */
initTracing({
  serviceName: 'admin-service',
});

const app = express();

/**
 * Initialize Prometheus Metrics
 */
const metrics = initPrometheusMetrics('admin-service');

// Initialize Sentry (must be first, before other middleware)
initSentry(app, {
  serviceName: 'admin-service',
});

// Correlation ID middleware (early in chain for request tracking)
app.use(correlationIdMiddleware);

// Metrics middleware (after Sentry, before other middleware)
app.use(
  createMetricsMiddleware({
    httpRequestsTotal: metrics.http.httpRequestsTotal,
    httpRequestDuration: metrics.http.httpRequestDuration,
    httpActiveConnections: metrics.http.httpActiveConnections,
    httpErrorsTotal: metrics.http.httpErrorsTotal,
    normalizePath: defaultPathNormalizer,
  })
);

// Security middleware
app.use(helmet());

// CORS - allow frontend MFEs (shell/auth/payments/admin) and nginx proxy (HTTPS)
const allowedOrigins = [
  'http://localhost:4200',
  'http://localhost:4201',
  'http://localhost:4202',
  'http://localhost:4203',
  'https://localhost', // nginx proxy
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

// Rate limiting
// Type assertion needed for express-rate-limit compatibility with Express 5
// Disabled in development to allow for testing and auto-refresh features
const isDevelopment = process.env['NODE_ENV'] !== 'production';
if (!isDevelopment) {
  const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // Limit each IP to 100 requests per windowMs
    message: 'Too many requests from this IP, please try again later.',
  });
  app.use(limiter as unknown as express.RequestHandler);
}

// Body parsing
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logging
app.use((req, _res, next) => {
  logger.info(`${req.method} ${req.path}`);
  next();
});

// Health check routes (no auth required)
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

// Admin routes (authentication and ADMIN role required)
import adminRoutes from './routes/admin';
app.use('/api/admin', adminRoutes);

// 404 handler
app.use(notFoundHandler);

// Sentry error handler (must be before general error handler)
initSentryErrorHandler(app);

// Error handler (must be last)
app.use(errorHandler);

// Start server
const server = app.listen(config.port, () => {
  logger.info(`Admin Service listening on port ${config.port}`);
  logger.info(`Environment: ${config.nodeEnv}`);
  logger.info(`Health check: http://localhost:${config.port}/health`);
});

server.on('error', error => {
  logger.error('Server error:', error);
  process.exit(1);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM signal received: closing HTTP server');
  server.close(() => {
    logger.info('HTTP server closed');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  logger.info('SIGINT signal received: closing HTTP server');
  server.close(() => {
    logger.info('HTTP server closed');
    process.exit(0);
  });
});

export default app;
