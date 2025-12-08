/**
 * Payments Service Main Entry Point
 */

import express from 'express';
import { config } from './config';
import { logger } from './utils/logger';
import { errorHandler, notFoundHandler } from './middleware/errorHandler';
import healthRoutes from './routes/health';
import { paymentRoutes, webhookRouter } from './routes/payment';

const app = express();

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
