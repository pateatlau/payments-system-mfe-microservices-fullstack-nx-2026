/**
 * Admin Service - Event Publisher
 *
 * Purpose: Publish admin-related events to RabbitMQ
 * Events: admin.user.deleted, admin.user.updated
 *
 * Zero-Coupling Pattern:
 * - Admin Service publishes events when admin performs user management actions
 * - Auth Service subscribes to these events to update its database
 * - No direct API calls between services
 */

import { RabbitMQPublisher } from '@payments-system/rabbitmq-event-hub';
import { getConnectionManager } from './connection';
import config from '../config';
import type {
  RabbitMQAdminUserDeletedPayload,
  RabbitMQAdminUserUpdatedPayload,
} from 'shared-types';

let publisher: RabbitMQPublisher | null = null;
let initializationPromise: Promise<void> | null = null;

/**
 * Get or create event publisher (internal - creates instance without waiting for init)
 */
function createPublisher(): RabbitMQPublisher {
  if (!publisher) {
    const connectionManager = getConnectionManager();

    publisher = new RabbitMQPublisher(connectionManager, {
      exchange: config.rabbitmq.exchange,
      exchangeType: 'topic',
      durable: true,
      confirm: true,
      defaultProperties: {
        appId: 'admin-service',
      },
    });
  }

  return publisher;
}

/**
 * Get initialized event publisher
 *
 * Ensures the publisher is fully initialized before returning.
 * Uses a cached initialization promise to prevent race conditions
 * when multiple publish calls happen concurrently.
 */
export async function getEventPublisher(): Promise<RabbitMQPublisher> {
  const pub = createPublisher();

  // If not yet initialized, start initialization
  if (!initializationPromise) {
    initializationPromise = pub.initialize().catch(error => {
      // Reset on failure so next call can retry
      initializationPromise = null;
      console.error('[Admin Service] Failed to initialize publisher:', error);
      throw error;
    });
  }

  // Wait for initialization to complete
  await initializationPromise;

  return pub;
}

/**
 * Publish admin.user.deleted event
 *
 * Triggered when an admin deletes a user
 * Subscribers: Auth Service (delete user from auth_db)
 */
export async function publishAdminUserDeleted(
  payload: RabbitMQAdminUserDeletedPayload
): Promise<void> {
  const eventPublisher = await getEventPublisher();

  await eventPublisher.publish('admin.user.deleted', payload, {
    userId: payload.userId,
    eventType: 'admin_action',
  });

  console.log(`[Admin Service] Published admin.user.deleted event: ${payload.userId}`);
}

/**
 * Publish admin.user.updated event
 *
 * Triggered when an admin updates a user (role change, etc.)
 * Subscribers: Auth Service (update user in auth_db)
 */
export async function publishAdminUserUpdated(
  payload: RabbitMQAdminUserUpdatedPayload
): Promise<void> {
  const eventPublisher = await getEventPublisher();

  await eventPublisher.publish('admin.user.updated', payload, {
    userId: payload.userId,
    eventType: 'admin_action',
  });

  console.log(`[Admin Service] Published admin.user.updated event: ${payload.userId}`);
}

/**
 * Close the publisher (for graceful shutdown)
 */
export async function closePublisher(): Promise<void> {
  if (publisher) {
    await publisher.close();
    publisher = null;
    console.log('[Admin Service] Event publisher closed');
  }
}
