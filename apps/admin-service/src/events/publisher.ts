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

let publisher: RabbitMQPublisher | null = null;

/**
 * Get or create event publisher
 */
export function getEventPublisher(): RabbitMQPublisher {
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

    // Initialize exchange
    publisher.initialize().catch(error => {
      console.error('[Admin Service] Failed to initialize publisher:', error);
    });
  }

  return publisher;
}

/**
 * Admin User Event Payloads
 */
interface AdminUserDeletedPayload {
  userId: string;
  deletedBy: string;
  deletedAt: string;
  reason?: string;
}

interface AdminUserUpdatedPayload {
  userId: string;
  updatedBy: string;
  updatedAt: string;
  changes: {
    role?: string;
    name?: string;
    email?: string;
  };
}

/**
 * Publish admin.user.deleted event
 *
 * Triggered when an admin deletes a user
 * Subscribers: Auth Service (delete user from auth_db)
 */
export async function publishAdminUserDeleted(
  payload: AdminUserDeletedPayload
): Promise<void> {
  const eventPublisher = getEventPublisher();

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
  payload: AdminUserUpdatedPayload
): Promise<void> {
  const eventPublisher = getEventPublisher();

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
