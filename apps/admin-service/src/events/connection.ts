/**
 * Admin Service - RabbitMQ Connection Manager
 *
 * Purpose: Manage RabbitMQ connection for Admin Service
 * Features: Singleton connection, automatic reconnection, graceful shutdown
 */

import { RabbitMQConnectionManager } from '@payments-system/rabbitmq-event-hub';
import config from '../config';

let connectionManager: RabbitMQConnectionManager | null = null;
let connectionPromise: Promise<void> | null = null;

/**
 * Get or create RabbitMQ connection manager
 */
export function getConnectionManager(): RabbitMQConnectionManager {
  if (!connectionManager) {
    connectionManager = new RabbitMQConnectionManager({
      url: config.rabbitmq.url,
      heartbeat: 60,
      reconnection: {
        enabled: true,
        maxRetries: 0, // Infinite retries
        initialDelay: 1000,
        maxDelay: 30000,
        multiplier: 2,
      },
      prefetch: 10,
    });
  }

  return connectionManager;
}

/**
 * Initialize RabbitMQ connection
 * Must be called before using the connection manager
 */
export async function initializeConnection(): Promise<void> {
  const manager = getConnectionManager();

  if (!connectionPromise) {
    connectionPromise = manager.connect();
  }

  try {
    await connectionPromise;
    console.log('[Admin Service] RabbitMQ connection established');
  } catch (error) {
    console.error('[Admin Service] Failed to connect to RabbitMQ:', error);
    connectionPromise = null; // Allow retry on next call
    throw error;
  }
}

/**
 * Close RabbitMQ connection (for graceful shutdown)
 */
export async function closeConnection(): Promise<void> {
  if (connectionManager) {
    await connectionManager.close();
    connectionManager = null;
    console.log('[Admin Service] RabbitMQ connection closed');
  }
}

/**
 * Health check for RabbitMQ connection
 */
export async function checkConnectionHealth(): Promise<boolean> {
  if (!connectionManager) {
    return false;
  }

  return connectionManager.healthCheck();
}
