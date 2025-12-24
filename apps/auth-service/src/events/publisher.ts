/**
 * Auth Service - Event Publisher
 *
 * Purpose: Publish auth-related events to RabbitMQ
 * Events: user.created, user.updated, user.deleted, user.login, user.logout
 *
 * Zero-Coupling Pattern:
 * - Auth Service publishes events when user data changes
 * - Other services (Admin, Profile, Payments) subscribe to these events
 * - No direct API calls between services
 */

import { RabbitMQPublisher } from '@payments-system/rabbitmq-event-hub';
import { getConnectionManager } from './connection';
import { config } from '../config';

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
        appId: 'auth-service',
      },
    });

    // Initialize exchange
    publisher.initialize().catch(error => {
      console.error('[Auth Service] Failed to initialize publisher:', error);
    });
  }

  return publisher;
}

/**
 * User Event Payloads
 */
interface UserCreatedPayload {
  userId: string;
  email: string;
  name: string;
  role: string;
  emailVerified: boolean;
  createdAt: string;
}

interface UserUpdatedPayload {
  userId: string;
  email?: string;
  name?: string;
  role?: string;
  emailVerified?: boolean;
  updatedAt: string;
}

interface UserDeletedPayload {
  userId: string;
  deletedAt: string;
}

interface UserLoginPayload {
  userId: string;
  email: string;
  loginAt: string;
  ipAddress?: string;
}

interface UserLogoutPayload {
  userId: string;
  logoutAt: string;
}

/**
 * Publish user.created event
 *
 * Triggered when a new user registers
 * Subscribers: Admin Service (denormalized user copy), Profile Service (create profile)
 */
export async function publishUserCreated(
  payload: UserCreatedPayload
): Promise<void> {
  const publisher = getEventPublisher();

  await publisher.publish('user.created', payload, {
    userId: payload.userId,
    eventType: 'user_lifecycle',
  });

  console.log(`[Auth Service] Published user.created event: ${payload.userId}`);
}

/**
 * Publish user.updated event
 *
 * Triggered when user data is updated
 * Subscribers: Admin Service (sync denormalized copy), Profile Service (update profile)
 */
export async function publishUserUpdated(
  payload: UserUpdatedPayload
): Promise<void> {
  const publisher = getEventPublisher();

  await publisher.publish('user.updated', payload, {
    userId: payload.userId,
    eventType: 'user_lifecycle',
  });

  console.log(`[Auth Service] Published user.updated event: ${payload.userId}`);
}

/**
 * Publish user.deleted event
 *
 * Triggered when a user is deleted (soft or hard delete)
 * Subscribers: Admin Service (remove denormalized copy), Profile Service (delete profile)
 */
export async function publishUserDeleted(
  payload: UserDeletedPayload
): Promise<void> {
  const publisher = getEventPublisher();

  await publisher.publish('user.deleted', payload, {
    userId: payload.userId,
    eventType: 'user_lifecycle',
  });

  console.log(`[Auth Service] Published user.deleted event: ${payload.userId}`);
}

/**
 * Publish user.login event
 *
 * Triggered when a user successfully logs in
 * Subscribers: Admin Service (audit log), Profile Service (update last login)
 */
export async function publishUserLogin(
  payload: UserLoginPayload
): Promise<void> {
  const publisher = getEventPublisher();

  await publisher.publish('user.login', payload, {
    userId: payload.userId,
    eventType: 'user_activity',
  });

  console.log(`[Auth Service] Published user.login event: ${payload.userId}`);
}

/**
 * Publish user.logout event
 *
 * Triggered when a user logs out
 * Subscribers: Admin Service (audit log)
 */
export async function publishUserLogout(
  payload: UserLogoutPayload
): Promise<void> {
  const publisher = getEventPublisher();

  await publisher.publish('user.logout', payload, {
    userId: payload.userId,
    eventType: 'user_activity',
  });

  console.log(`[Auth Service] Published user.logout event: ${payload.userId}`);
}

/**
 * Close the publisher (for graceful shutdown)
 */
export async function closePublisher(): Promise<void> {
  if (publisher) {
    await publisher.close();
    publisher = null;
    console.log('[Auth Service] Event publisher closed');
  }
}
