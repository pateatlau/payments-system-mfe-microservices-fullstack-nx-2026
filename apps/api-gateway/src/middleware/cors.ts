/**
 * CORS Middleware
 *
 * Configures Cross-Origin Resource Sharing for frontend applications
 */

import cors from 'cors';
import { config } from '../config';
import { logger } from '../utils/logger';

/**
 * CORS middleware configuration
 * Allows requests from frontend MFEs running on different ports
 */
export const corsMiddleware = cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) {
      return callback(null, true);
    }

    // Check if origin is in whitelist
    if (config.corsOrigins.includes(origin)) {
      callback(null, true);
    } else {
      logger.warn('CORS rejected origin', {
        origin,
        allowedOrigins: config.corsOrigins,
      });
      callback(new Error('Not allowed by CORS'));
    }
  },
  // POC-3 Phase 7.1: credentials: true is required for HttpOnly cookie authentication
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  // Include X-CSRF-Token for CSRF protection, X-Client-Fingerprint for session security
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Request-ID', 'X-CSRF-Token', 'X-Device-ID', 'X-Client-Fingerprint'],
  exposedHeaders: ['X-Request-ID'],
  maxAge: 86400, // 24 hours
});
