/**
 * Auth Service Main Entry Point
 *
 * Handles user authentication: registration, login, token management
 */

import express from 'express';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import { config } from './config';
import { errorHandler, notFoundHandler } from './middleware/errorHandler';
import healthRoutes from './routes/health';
import authRoutes from './routes/auth';
import oauthRoutes from './routes/oauth';
import deviceRoutes from './routes/devices';
import sessionRoutes from './routes/sessions';
import { logger } from './utils/logger';
import { initializeSessionManager } from './services/session.service';
import cors from 'cors';
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
import { initializeSubscriber } from './events/subscriber';

/**
 * Initialize OpenTelemetry Tracing (must be first, before any other imports/initialization)
 */
initTracing({
  serviceName: 'auth-service',
});

/**
 * Create Express application
 */
const app = express();

/**
 * Initialize Prometheus Metrics
 */
const metrics = initPrometheusMetrics('auth-service');

/**
 * Middleware Setup
 */

// Initialize Sentry (must be first, before other middleware)
initSentry(app, {
  serviceName: 'auth-service',
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

// Security headers via Helmet
// Protects against common web vulnerabilities (XSS, clickjacking, MIME sniffing, etc.)
app.use(
  helmet({
    // Content Security Policy - restrict resource loading
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        scriptSrc: ["'self'"],
        imgSrc: ["'self'", 'data:', 'https:'],
      },
    },
    // HTTP Strict Transport Security
    hsts: {
      maxAge: 31536000, // 1 year
      includeSubDomains: true,
      preload: true,
    },
    // Prevent clickjacking
    frameguard: {
      action: 'deny',
    },
    // Prevent MIME type sniffing
    noSniff: true,
    // XSS filter (legacy browsers)
    xssFilter: true,
    // CRITICAL for Safari: Allow cross-origin requests from MFE frontend
    crossOriginResourcePolicy: { policy: 'cross-origin' },
    // Allow popups for OAuth flows while maintaining security
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
      'X-CSRF-Token',
      'X-Device-ID',
      'Accept',
      'Origin',
    ],
    // POC-3 Phase 7.1: credentials: true is required for HttpOnly cookie authentication
    credentials: true,
    optionsSuccessStatus: 204,
  })
);

// Request size limits middleware
// Protects against oversized URLs, headers, and parameter pollution
const requestLimits = createRequestLimitsMiddleware({
  serviceName: 'auth-service',
  maxUrlLength: 2048,
  maxHeaderSize: 8 * 1024, // 8KB
  maxHeaderCount: 100,
  maxParameterCount: 50,
  skipPaths: ['/health', '/metrics'],
});
app.use(requestLimits);

// Cookie parser (for HttpOnly refresh token cookies)
// POC-3 Phase 7.1: Required for reading refresh tokens from cookies
app.use(cookieParser());

// Body parsing with size limits
const { jsonOptions, urlEncodedOptions } = getBodyParserOptions({
  jsonLimit: '1mb',
  urlEncodedLimit: '1mb',
});
app.use(express.json(jsonOptions));
app.use(express.urlencoded(urlEncodedOptions));

// Body parser error handler (converts body-parser errors to consistent format)
app.use(bodyParserErrorHandler('auth-service'));

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

/**
 * Routes
 */

// Health check routes
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

// Auth routes
app.use(authRoutes);

// OAuth routes (social login)
app.use(oauthRoutes);

// Device routes (protected)
app.use(deviceRoutes);

// Session management routes (protected)
app.use(sessionRoutes);

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

app.listen(port, async () => {
  logger.info(`Auth Service started on port ${port}`, {
    environment: config.nodeEnv,
  });

  // Initialize session manager (Redis-backed session management)
  try {
    await initializeSessionManager();
    logger.info('Auth Service session manager initialized');
  } catch (error) {
    logger.warn('Session manager running in degraded mode', { error });
    // Service continues with in-memory fallback
  }

  // Initialize RabbitMQ subscriber for admin events
  try {
    await initializeSubscriber();
    logger.info('Auth Service RabbitMQ subscriber initialized');
  } catch (error) {
    logger.error('Failed to initialize RabbitMQ subscriber', { error });
    // Don't fail the service - it can still handle auth requests
    // Events will be retried when connection is restored
  }
});

export default app;
