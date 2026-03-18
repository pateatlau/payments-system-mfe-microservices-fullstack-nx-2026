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
import {
  createResponseSanitizer,
  createRequestLimitsMiddleware,
  getBodyParserOptions,
  bodyParserErrorHandler,
} from '@payments-system/middleware';
import {
  startEventSubscriptions,
  closeSubscriptions,
} from './events/subscriber';

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
// CRITICAL for Safari: Allow cross-origin requests from MFE frontend
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' },
    crossOriginOpenerPolicy: { policy: 'same-origin-allow-popups' },
  })
);

// CORS - allow frontend MFEs and API Gateway proxy
// Configurable via CORS_ORIGINS env var for production deployments
const defaultOrigins = [
  'http://localhost:4200',
  'http://localhost:4201',
  'http://localhost:4202',
  'http://localhost:4203',
  'https://localhost', // nginx proxy
];
const allowedOrigins = process.env['CORS_ORIGINS']
  ? process.env['CORS_ORIGINS'].split(',').map(s => s.trim()).filter(Boolean)
  : defaultOrigins;

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

// Rate limiting - RESTORED to production-ready values
// Type assertion needed for express-rate-limit compatibility with Express 5
// Disabled in development to allow for testing and auto-refresh features
const isDevelopment = process.env['NODE_ENV'] !== 'production';
if (!isDevelopment) {
  const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // RESTORED: Limit each IP to 100 requests per 15 minutes
    message: 'Too many requests from this IP, please try again later.',
    standardHeaders: true, // Return rate limit info in RateLimit-* headers
    legacyHeaders: false, // Disable X-RateLimit-* headers
    // Skip health checks and metrics endpoints
    skip: (req) => {
      return req.path === '/health' || req.path === '/metrics';
    },
  });
  app.use(limiter as unknown as express.RequestHandler);
}

// Request size limits middleware
// Protects against oversized URLs, headers, and parameter pollution
const requestLimits = createRequestLimitsMiddleware({
  serviceName: 'admin-service',
  maxUrlLength: 2048,
  maxHeaderSize: 8 * 1024, // 8KB
  maxHeaderCount: 100,
  maxParameterCount: 50,
  skipPaths: ['/health', '/metrics'],
});
app.use(requestLimits);

// Body parsing with size limits
const { jsonOptions, urlEncodedOptions } = getBodyParserOptions({
  jsonLimit: '1mb',
  urlEncodedLimit: '1mb',
});
app.use(express.json(jsonOptions));
app.use(express.urlencoded(urlEncodedOptions));

// Body parser error handler (converts body-parser errors to consistent format)
app.use(bodyParserErrorHandler('admin-service'));

// Response sanitization middleware
// Prevents PII leakage and removes stack traces in production
app.use(
  createResponseSanitizer({
    removeStackTraces: config.nodeEnv === 'production',
    redactPii: true,
    sanitizePaths: true,
    environment: config.nodeEnv,
  })
);

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
const server = app.listen(config.port, async () => {
  logger.info(`Admin Service listening on port ${config.port}`);
  logger.info(`Environment: ${config.nodeEnv}`);
  logger.info(`Health check: http://localhost:${config.port}/health`);

  // Initialize RabbitMQ event subscriptions for audit logging
  try {
    await startEventSubscriptions();
    logger.info('Event subscriptions initialized successfully');
  } catch (error) {
    logger.error('Failed to initialize event subscriptions:', error);
    // Don't crash the service - event subscriptions can be retried
  }
});

server.on('error', error => {
  logger.error('Server error:', error);
  process.exit(1);
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  logger.info('SIGTERM signal received: closing HTTP server');
  await closeSubscriptions();
  server.close(() => {
    logger.info('HTTP server closed');
    process.exit(0);
  });
});

process.on('SIGINT', async () => {
  logger.info('SIGINT signal received: closing HTTP server');
  await closeSubscriptions();
  server.close(() => {
    logger.info('HTTP server closed');
    process.exit(0);
  });
});

export default app;
