/**
 * Payments Service Main Entry Point
 */

import express from 'express';
import cors from 'cors';
import { config } from './config';
import { logger } from './utils/logger';
import { errorHandler, notFoundHandler } from './middleware/errorHandler';
import healthRoutes from './routes/health';
import { paymentRoutes, webhookRouter } from './routes/payment';
import { startUserEventSubscriber, closeSubscriber } from './events/subscriber';
import { initializePublisher, closePublisher } from './events/publisher';
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
  serviceName: 'payments-service',
});

const app = express();

/**
 * Initialize Prometheus Metrics
 */
const metrics = initPrometheusMetrics('payments-service');

// Initialize Sentry (must be first, before other middleware)
initSentry(app, {
  serviceName: 'payments-service',
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

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
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

app.use(webhookRouter); // Public webhook endpoint
app.use(paymentRoutes); // Protected payment endpoints

// 404 Handler
app.use(notFoundHandler);

// Sentry error handler (must be before general error handler)
initSentryErrorHandler(app);

// Error Handler
app.use(errorHandler);

// Start Server
const port = config.port;

const server = app.listen(port, () => {
  logger.info(`Payments Service started on port ${port}`, {
    environment: config.nodeEnv,
  });
});

/**
 * Initialize RabbitMQ Event Publisher and Subscriber (async, non-blocking)
 * Publisher: Publishes payment events to RabbitMQ
 * Subscriber: Enables automatic user synchronization from Auth Service
 */
(async () => {
  try {
    await initializePublisher();
    logger.info('RabbitMQ publisher initialized successfully');
  } catch (error) {
    logger.error('Failed to initialize RabbitMQ publisher', { error });
    // Non-fatal: payments can still be created, but events won't be published
  }

  try {
    await startUserEventSubscriber();
    logger.info('RabbitMQ subscriber initialized successfully');
  } catch (error) {
    logger.error('Failed to start RabbitMQ subscriber', { error });
    // Non-fatal: service can still operate with manual upserts
    // but user sync from auth service won't work
  }
})();

/**
 * Graceful Shutdown
 */
const shutdown = async (signal: string) => {
  logger.info(`Received ${signal}, shutting down gracefully...`);

  // Close RabbitMQ publisher and subscriber
  try {
    await closePublisher();
    await closeSubscriber();
  } catch (error) {
    logger.error('Error closing RabbitMQ connections', { error });
  }

  // Close HTTP server
  server.close(() => {
    logger.info('HTTP server closed');
    process.exit(0);
  });

  // Force exit after 30 seconds
  setTimeout(() => {
    logger.error('Forced shutdown after 30 seconds');
    process.exit(1);
  }, 30000);
};

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

export default app;
