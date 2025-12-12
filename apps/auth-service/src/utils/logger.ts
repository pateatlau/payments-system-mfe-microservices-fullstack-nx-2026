/**
 * Logger Utility
 *
 * Winston logger configuration for the Auth Service
 */

import winston from 'winston';
import { config } from '../config';

/**
 * Logger instance
 * Logs to console in development, file in production
 */
export const logger = winston.createLogger({
  level: config.logLevel,
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  defaultMeta: { service: 'auth-service' },
  transports: [
    // Console transport for all environments
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      ),
    }),
  ],
});
