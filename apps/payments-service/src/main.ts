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

app.listen(port, () => {
  logger.info(`Payments Service started on port ${port}`, {
    environment: config.nodeEnv,
  });
});

export default app;
