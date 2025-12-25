/**
 * Streaming HTTP Proxy Middleware
 *
 * Purpose: Production-ready HTTP proxy using Node.js native http/https modules
 * Features:
 *   - Request/response streaming (no buffering)
 *   - Header forwarding (X-Forwarded-*, X-Real-IP)
 *   - Path rewriting
 *   - Error handling (502 for connection errors, 504 for timeouts)
 *   - Timeout configuration
 *
 * Why Native HTTP:
 * POC-2 encountered issues with http-proxy-middleware v3.x including:
 * - Request body streaming problems
 * - Path rewriting complications
 * - Timeout errors
 *
 * This implementation uses Node.js native http/https for maximum control
 * and reliability.
 */

import { Request, Response } from 'express';
import { request as httpRequest, IncomingMessage, ClientRequest } from 'http';
import { request as httpsRequest } from 'https';
import { logger } from '../utils/logger';

/**
 * Proxy target configuration
 */
export interface ProxyTarget {
  host: string;
  port: number;
  protocol: 'http' | 'https';
}

/**
 * Proxy options configuration
 */
export interface ProxyOptions {
  target: ProxyTarget;
  pathRewrite?: Record<string, string>;
  timeout?: number;
  preserveHostHeader?: boolean;
  changeOrigin?: boolean;
}

/**
 * Default proxy options
 */
const defaultOptions: Partial<ProxyOptions> = {
  timeout: 30000, // 30 seconds
  preserveHostHeader: false,
  changeOrigin: true,
};

/**
 * Create streaming HTTP proxy middleware
 *
 * @param options - Proxy configuration options
 * @returns Express middleware function
 *
 * @example
 * ```typescript
 * const authProxy = createStreamingProxy({
 *   target: { host: 'localhost', port: 3001, protocol: 'http' },
 *   pathRewrite: { '^/api/auth': '' },
 *   timeout: 30000
 * });
 *
 * router.use('/api/auth', authProxy);
 * ```
 */
export function createStreamingProxy(
  options: ProxyOptions
): (req: Request, res: Response) => void {
  const config = { ...defaultOptions, ...options };

  return (req: Request, res: Response): void => {
    const target = config.target;
    const requestFn = target.protocol === 'https' ? httpsRequest : httpRequest;

    // Rewrite path if needed
    let path = req.url || '/';
    if (config.pathRewrite) {
      for (const [pattern, replacement] of Object.entries(config.pathRewrite)) {
        const regex = new RegExp(pattern);
        path = path.replace(regex, replacement);
      }
    }

    // Build proxy request headers
    const proxyHeaders = buildProxyHeaders(req, target, config);

    // Log proxy request
    logger.debug('Proxying request', {
      method: req.method,
      originalPath: req.url,
      rewrittenPath: path,
      target: `${target.protocol}://${target.host}:${target.port}`,
    });

    // Create proxy request
    const proxyReq: ClientRequest = requestFn(
      {
        hostname: target.host,
        port: target.port,
        path,
        method: req.method,
        headers: proxyHeaders,
        timeout: config.timeout,
      },
      (proxyRes: IncomingMessage) => {
        // Forward response status and headers
        res.writeHead(
          proxyRes.statusCode || 502,
          proxyRes.statusMessage,
          proxyRes.headers
        );

        // Stream response back to client
        proxyRes.pipe(res);

        // Log response
        logger.debug('Proxy response received', {
          statusCode: proxyRes.statusCode,
          path: req.url,
        });
      }
    );

    // Stream request body to target (no buffering)
    req.pipe(proxyReq);

    // Handle proxy request errors
    proxyReq.on('error', (err: Error) => {
      logger.error('Proxy request error', {
        error: err.message,
        path: req.url,
        target: `${target.protocol}://${target.host}:${target.port}`,
      });

      if (!res.headersSent) {
        res.status(502).json({
          success: false,
          error: {
            code: 'BAD_GATEWAY',
            message: 'Failed to connect to upstream service',
          },
        });
      }
    });

    // Handle proxy request timeout
    proxyReq.on('timeout', () => {
      logger.error('Proxy request timeout', {
        path: req.url,
        timeout: config.timeout,
        target: `${target.protocol}://${target.host}:${target.port}`,
      });

      proxyReq.destroy();

      if (!res.headersSent) {
        res.status(504).json({
          success: false,
          error: {
            code: 'GATEWAY_TIMEOUT',
            message: 'Upstream service did not respond in time',
          },
        });
      }
    });

    // Handle client abort
    req.on('aborted', () => {
      logger.debug('Client aborted request', { path: req.url });
      proxyReq.destroy();
    });

    // Handle client error
    req.on('error', (err: Error) => {
      logger.error('Client request error', {
        error: err.message,
        path: req.url,
      });
      proxyReq.destroy();
    });
  };
}

/**
 * Build proxy request headers
 *
 * @param req - Express request
 * @param target - Proxy target configuration
 * @param config - Proxy options
 * @returns Headers object for proxy request
 */
function buildProxyHeaders(
  req: Request,
  target: ProxyTarget,
  config: ProxyOptions
): Record<string, string | string[] | undefined> {
  const headers = { ...req.headers };

  // Set Host header
  if (!config.preserveHostHeader || config.changeOrigin) {
    headers.host = `${target.host}:${target.port}`;
  }

  // Add X-Forwarded-* headers
  const clientIp = getClientIp(req);
  headers['x-forwarded-for'] = headers['x-forwarded-for']
    ? `${headers['x-forwarded-for']}, ${clientIp}`
    : clientIp;

  headers['x-forwarded-proto'] = req.protocol;
  headers['x-forwarded-host'] = req.get('host') || req.headers.host || '';

  // Add X-Real-IP
  headers['x-real-ip'] = clientIp;

  // Remove problematic headers
  delete headers['content-length']; // Will be recalculated by Node.js
  delete headers['transfer-encoding']; // Will be handled by Node.js

  return headers;
}

/**
 * Get client IP address from request
 *
 * @param req - Express request
 * @returns Client IP address
 */
function getClientIp(req: Request): string {
  // Check X-Forwarded-For header (may contain multiple IPs)
  const forwardedFor = req.get('x-forwarded-for');
  if (forwardedFor && typeof forwardedFor === 'string') {
    const firstIp = forwardedFor.split(',')[0];
    return firstIp ? firstIp.trim() : 'unknown';
  }

  // Check X-Real-IP header
  const realIp = req.get('x-real-ip');
  if (realIp && typeof realIp === 'string') {
    return realIp;
  }

  // Fall back to socket address
  return req.socket.remoteAddress || 'unknown';
}

/**
 * Create proxy middleware for a specific service
 *
 * @param serviceName - Name of the service (for logging)
 * @param target - Target service configuration
 * @param pathPrefix - Path prefix to remove (e.g., '/api/auth')
 * @returns Express middleware function
 *
 * @example
 * ```typescript
 * const authProxy = createServiceProxy('auth', {
 *   host: 'localhost',
 *   port: 3001,
 *   protocol: 'http'
 * }, '/api/auth');
 * ```
 */
export function createServiceProxy(
  _serviceName: string,
  target: ProxyTarget,
  pathPrefix: string
): (req: Request, res: Response) => void {
  return createStreamingProxy({
    target,
    pathRewrite: {
      [`^${pathPrefix}`]: '', // Remove path prefix
    },
    timeout: 30000,
  });
}
