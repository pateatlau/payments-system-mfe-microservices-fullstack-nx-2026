/**
 * Profile Service - Main Entry Point
 */

import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import { prisma } from './lib/prisma';
import config from './config';
import logger from './utils/logger';
import { errorHandler, notFoundHandler } from './middleware/errorHandler';
import healthRoutes from './routes/health';
import profileRoutes from './routes/profile';
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
  serviceName: 'profile-service',
});

const app = express();

/**
 * Initialize Prometheus Metrics
 */
const metrics = initPrometheusMetrics('profile-service');

// Initialize Sentry (must be first, before other middleware)
initSentry(app, {
  serviceName: 'profile-service',
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
// CRITICAL for Safari: Allow cross-origin requests from MFE frontend
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' },
    crossOriginOpenerPolicy: { policy: 'same-origin-allow-popups' },
  })
);

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

// Increase JSON body limit to 5MB for base64-encoded images
// TODO: Replace with proper file upload to cloud storage (S3) and reduce limit
app.use(express.json({ limit: '5mb' }));

// Rate limiting - RESTORED to production-ready values
// Type assertion needed for express-rate-limit compatibility with Express 5
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // RESTORED: Limit each IP to 100 requests per 15 minutes
  standardHeaders: true, // Return rate limit info in RateLimit-* headers
  legacyHeaders: false, // Disable X-RateLimit-* headers
  // Skip health checks and metrics endpoints
  skip: (req) => {
    return req.path === '/health' || req.path === '/metrics';
  },
});
app.use(limiter as unknown as express.RequestHandler);

// Request logging
app.use((req, _res, next) => {
  logger.info(`${req.method} ${req.path}`, {
    method: req.method,
    path: req.path,
    query: req.query,
    ip: req.ip,
  });
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

// Profile API routes (authentication required)
app.use('/api/profile', profileRoutes);

// 404 handler
app.use(notFoundHandler);

// Sentry error handler (must be before general error handler)
initSentryErrorHandler(app);

// Error handler (must be last)
app.use(errorHandler);

// Start server
const server = app.listen(config.port, () => {
  logger.info(`Profile Service started on port ${config.port}`, {
    port: config.port,
    env: config.nodeEnv,
  });
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  logger.info('SIGTERM signal received: closing HTTP server');
  server.close(async () => {
    logger.info('HTTP server closed');
    await prisma.$disconnect();
    logger.info('Database connection closed');
    process.exit(0);
  });
});

process.on('SIGINT', async () => {
  logger.info('SIGINT signal received: closing HTTP server');
  server.close(async () => {
    logger.info('HTTP server closed');
    await prisma.$disconnect();
    logger.info('Database connection closed');
    process.exit(0);
  });
});
