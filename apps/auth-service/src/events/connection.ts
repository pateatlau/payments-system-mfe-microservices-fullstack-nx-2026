/**
 * Auth Service - RabbitMQ Connection Manager
 *
 * Purpose: Manage RabbitMQ connection for Auth Service
 * Features: Singleton connection, automatic reconnection, graceful shutdown
 */

import { RabbitMQConnectionManager } from '@payments-system/rabbitmq-event-hub';
import { config } from '../config';

let connectionManager: RabbitMQConnectionManager | null = null;

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

    // Connect on first access
    connectionManager.connect().catch(error => {
      console.error('[Auth Service] Failed to connect to RabbitMQ:', error);
    });
  }

  return connectionManager;
}

/**
 * Close RabbitMQ connection (for graceful shutdown)
 */
export async function closeConnection(): Promise<void> {
  if (connectionManager) {
    await connectionManager.close();
    connectionManager = null;
    console.log('[Auth Service] RabbitMQ connection closed');
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
