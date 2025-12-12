/**
 * Logger Utility
 *
 * Winston logger configuration for the API Gateway
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
  defaultMeta: { service: 'api-gateway' },
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

import { Request, Response, NextFunction } from 'express';

/**
 * Request logger middleware
 * Logs all incoming requests
 */
export const requestLogger = (
  req: Request,
  _res: Response,
  next: NextFunction
) => {
  logger.info('Incoming request', {
    method: req.method,
    url: req.url,
    ip: req.ip,
    userAgent: req.headers['user-agent'],
  });
  next();
};
