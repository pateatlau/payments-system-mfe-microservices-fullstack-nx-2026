/**
 * WebSocket Authentication
 *
 * Handles JWT authentication for WebSocket connections:
 * - Extracts token from query parameter
 * - Verifies JWT signature
 * - Decodes user information
 * - Returns payload for connection setup
 */

import jwt from 'jsonwebtoken';
import type { WebSocketJWTPayload } from './types';
import { logger } from '../utils/logger';
import { config } from '../config';

/**
 * Extract token from WebSocket upgrade request URL
 */
export function extractToken(url: string): string | null {
  try {
    const urlObj = new URL(url, 'http://localhost'); // Base URL not used, just for parsing
    return urlObj.searchParams.get('token');
  } catch (error) {
    logger.error('Failed to parse WebSocket URL', { error, url });
    return null;
  }
}

/**
 * Verify JWT token and extract payload
 */
export async function verifyWebSocketToken(
  token: string
): Promise<WebSocketJWTPayload> {
  try {
    // Verify token with JWT secret
    const decoded = jwt.verify(token, config.jwtSecret) as WebSocketJWTPayload;

    // Validate required fields
    if (!decoded.userId || !decoded.email || !decoded.role) {
      throw new Error('Invalid token payload: missing required fields');
    }

    // Validate role
    const validRoles: WebSocketJWTPayload['role'][] = [
      'ADMIN',
      'CUSTOMER',
      'VENDOR',
    ];
    if (!validRoles.includes(decoded.role)) {
      throw new Error(`Invalid role: ${decoded.role}`);
    }

    logger.debug('WebSocket token verified', {
      userId: decoded.userId,
      email: decoded.email,
      role: decoded.role,
    });

    return decoded;
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      logger.warn('Invalid WebSocket JWT token', {
        error: error.message,
      });
      throw new Error('Invalid token');
    }

    if (error instanceof jwt.TokenExpiredError) {
      logger.warn('Expired WebSocket JWT token', {
        expiredAt: error.expiredAt,
      });
      throw new Error('Token expired');
    }

    logger.error('Failed to verify WebSocket token', { error });
    throw new Error('Token verification failed');
  }
}

/**
 * Authenticate WebSocket connection
 * Returns payload if successful, throws error if not
 */
export async function authenticateWebSocket(
  url: string
): Promise<WebSocketJWTPayload> {
  // Extract token from URL
  const token = extractToken(url);

  if (!token) {
    throw new Error('No token provided');
  }

  // Verify and decode token
  const payload = await verifyWebSocketToken(token);

  return payload;
}
