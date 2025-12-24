/**
 * Payments Service - Event Subscriber
 *
 * Purpose: Subscribe to auth user events from RabbitMQ and sync to local User table
 * Events: auth.user.created, auth.user.updated, auth.user.deleted
 *
 * Zero-Coupling Pattern:
 * - Payments Service subscribes to Auth Service events
 * - When user events arrive, updates local denormalized User table
 * - Enables recipient validation without direct API calls to Auth Service
 * - Handles placeholder users created by payment creation upsert (email-first upsert)
 */

import { RabbitMQSubscriber, EventContext, BaseEvent } from '@payments-system/rabbitmq-event-hub';
import { getConnectionManager } from './connection';
import { config } from '../config';
import { prisma } from '../lib/prisma';
import { logger } from '../utils/logger';

let subscriber: RabbitMQSubscriber | null = null;

/**
 * User Event Payloads (from Auth Service)
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

/**
 * Handle user.created event
 *
 * Upserts user to local denormalized User table.
 * Uses email-first upsert to handle placeholder users created by payment creation.
 */
async function handleUserCreated(
  payload: UserCreatedPayload
): Promise<void> {
  try {
    // Email-first upsert: if a placeholder exists with this email, update it with the real ID
    // Otherwise create a new user
    const user = await prisma.user.upsert({
      where: { email: payload.email },
      update: { id: payload.userId, email: payload.email },
      create: { id: payload.userId, email: payload.email },
    });

    logger.info('[Payments Service] Synced user from auth.user.created event', {
      userId: user.id,
      email: user.email,
    });
  } catch (error) {
    logger.error('[Payments Service] Failed to sync user (created)', {
      userId: payload.userId,
      email: payload.email,
      error,
    });
    throw error; // Nack the message so it retries
  }
}

/**
 * Handle user.updated event
 *
 * Updates user in local denormalized User table.
 * Only email field is updated (other fields not needed for payment validation).
 */
async function handleUserUpdated(
  payload: UserUpdatedPayload
): Promise<void> {
  try {
    // Update user by ID, with email-safe fallback if user doesn't exist by ID
    const user = await prisma.user.update({
      where: { id: payload.userId },
      data: {
        email: payload.email || undefined,
      },
    });

    logger.info('[Payments Service] Synced user from auth.user.updated event', {
      userId: user.id,
      email: user.email,
    });
  } catch (error) {
    // If user not found by ID, might be a new user that hasn't synced yet
    // This is non-critical - next creation will sync it
    logger.warn('[Payments Service] Could not update user (may not exist yet)', {
      userId: payload.userId,
      error,
    });
    // Don't throw - this is a non-blocking event
  }
}

/**
 * Handle user.deleted event
 *
 * Deletes user from local denormalized User table.
 * This prevents the user from being used in new payments.
 */
async function handleUserDeleted(
  payload: UserDeletedPayload
): Promise<void> {
  try {
    await prisma.user.delete({
      where: { id: payload.userId },
    });

    logger.info('[Payments Service] Synced user deletion from auth.user.deleted event', {
      userId: payload.userId,
    });
  } catch (error) {
    // If user not found, it was already deleted or never synced
    // This is non-critical
    logger.warn('[Payments Service] Could not delete user (may not exist)', {
      userId: payload.userId,
      error,
    });
    // Don't throw - this is a non-blocking event
  }
}

/**
 * Get or create event subscriber
 */
export function getEventSubscriber(): RabbitMQSubscriber {
  if (!subscriber) {
    const connectionManager = getConnectionManager();

    subscriber = new RabbitMQSubscriber(connectionManager, {
      exchange: config.rabbitmq.exchange,
      queue: `payments-service-user-events-${config.nodeEnv}`,
      routingKeyPattern: 'user.*', // Subscribe to all user.* events
      durable: true,
      autoDelete: false,
      exclusive: false,
      manualAck: true,
      prefetch: 10,
      deadLetterExchange: `${config.rabbitmq.exchange}.dlx`,
      deadLetterRoutingKey: 'user.*.dlx',
    });
  }

  return subscriber;
}

/**
 * Start subscribing to user events
 *
 * Sets up message handler for all user.* events and routes to specific handlers
 */
export async function startUserEventSubscriber(): Promise<void> {
  try {
    const subscriber = getEventSubscriber();

    // Initialize subscriber (create queue and bindings)
    await subscriber.initialize();

    logger.info('[Payments Service] Initializing user event subscriber', {
      exchange: config.rabbitmq.exchange,
      routingPattern: 'user.*',
    });

    // Single handler that routes based on event type
    await subscriber.subscribe(async (event, context) => {
      try {
        switch (event.type) {
          case 'user.created':
            await handleUserCreated(event.data as UserCreatedPayload);
            break;

          case 'user.updated':
            await handleUserUpdated(event.data as UserUpdatedPayload);
            break;

          case 'user.deleted':
            await handleUserDeleted(event.data as UserDeletedPayload);
            break;

          default:
            logger.warn('[Payments Service] Unknown user event type', {
              eventType: event.type,
            });
        }

        // Acknowledge the message (successfully processed)
        context.ack();
      } catch (error) {
        logger.error('[Payments Service] Error processing user event', {
          eventType: event.type,
          eventId: event.id,
          error,
        });

        // Negative acknowledge with requeue (will retry)
        context.nack(true);
      }
    });

    logger.info('[Payments Service] User event subscriber started successfully');
  } catch (error) {
    logger.error('[Payments Service] Failed to start user event subscriber', {
      error,
    });
    throw error;
  }
}

/**
 * Close the subscriber (for graceful shutdown)
 */
export async function closeSubscriber(): Promise<void> {
  if (subscriber) {
    await subscriber.close();
    subscriber = null;
    logger.info('[Payments Service] Event subscriber closed');
  }
}
