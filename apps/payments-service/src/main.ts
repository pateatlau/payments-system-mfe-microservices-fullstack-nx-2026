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

const app = express();

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

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use(healthRoutes);
app.use(webhookRouter); // Public webhook endpoint
app.use(paymentRoutes); // Protected payment endpoints

// 404 Handler
app.use(notFoundHandler);

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
