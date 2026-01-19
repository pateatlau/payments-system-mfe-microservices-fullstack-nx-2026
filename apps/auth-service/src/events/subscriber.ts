/**
 * Auth Service - Event Subscriber
 *
 * Purpose: Subscribe to admin-related events from RabbitMQ
 * Events: admin.user.deleted, admin.user.updated
 *
 * Zero-Coupling Pattern:
 * - Admin Service publishes events when admin performs user management actions
 * - Auth Service subscribes to these events to update its database
 * - No direct API calls between services
 */

import {
  RabbitMQSubscriber,
  BaseEvent,
  EventContext,
} from '@payments-system/rabbitmq-event-hub';
import { getConnectionManager } from './connection';
import { config } from '../config';
import { prisma } from '../lib/prisma';
import { publishUserDeleted } from './publisher';
import { cache, CacheTags } from '../lib/cache';

let adminEventsSubscriber: RabbitMQSubscriber | null = null;

/**
 * Admin User Event Payloads
 */
interface AdminUserDeletedEvent {
  userId: string;
  deletedBy: string;
  deletedAt: string;
  reason?: string;
}

interface AdminUserUpdatedEvent {
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
 * Handle admin.user.deleted event
 *
 * When an admin deletes a user via the Admin Service, this handler:
 * 1. Deletes the user from auth_db
 * 2. Publishes user.deleted event for other services (Profile, Payments)
 */
async function handleAdminUserDeleted(
  event: BaseEvent<AdminUserDeletedEvent>,
  context: EventContext
): Promise<void> {
  const { userId, deletedBy, reason } = event.data;

  try {
    console.log(`[Auth Service] Processing admin.user.deleted: ${userId} (deleted by ${deletedBy})`);

    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      console.log(`[Auth Service] User ${userId} not found in auth_db, skipping deletion`);
      context.ack();
      return;
    }

    // Delete user from auth_db
    await prisma.user.delete({
      where: { id: userId },
    });

    // Invalidate user cache
    try {
      await cache.invalidateByTag(CacheTags.user(userId));
      console.log(`[Auth Service] Invalidated cache for deleted user ${userId}`);
    } catch (cacheError) {
      // Log but don't fail - user is already deleted
      console.error(`[Auth Service] Failed to invalidate cache for user ${userId}:`, cacheError);
    }

    console.log(`[Auth Service] Deleted user ${userId} from auth_db (reason: ${reason || 'admin action'})`);

    // Publish user.deleted event for other services (Profile, Payments, etc.)
    // This ensures all services remove their copies of the user data
    try {
      await publishUserDeleted({
        userId,
        deletedAt: new Date().toISOString(),
      });
    } catch (publishError) {
      // Log but don't fail - the user is already deleted from auth_db
      console.error('[Auth Service] Failed to publish user.deleted event:', publishError);
    }

    context.ack();
  } catch (error) {
    console.error(`[Auth Service] Error handling admin.user.deleted for ${userId}:`, error);
    // Requeue for retry
    context.nack(true);
  }
}

/**
 * Handle admin.user.updated event
 *
 * When an admin updates a user via the Admin Service, this handler
 * updates the user in auth_db.
 */
async function handleAdminUserUpdated(
  event: BaseEvent<AdminUserUpdatedEvent>,
  context: EventContext
): Promise<void> {
  const { userId, updatedBy, changes } = event.data;

  try {
    console.log(`[Auth Service] Processing admin.user.updated: ${userId} (updated by ${updatedBy})`);

    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      console.log(`[Auth Service] User ${userId} not found in auth_db, skipping update`);
      context.ack();
      return;
    }

    // Build update data from changes
    const updateData: Record<string, unknown> = {};
    if (changes.role) updateData.role = changes.role;
    if (changes.name) updateData.name = changes.name;
    if (changes.email) updateData.email = changes.email;

    if (Object.keys(updateData).length === 0) {
      console.log(`[Auth Service] No relevant changes for user ${userId}, skipping update`);
      context.ack();
      return;
    }

    // Update user in auth_db
    await prisma.user.update({
      where: { id: userId },
      data: updateData,
    });

    // Invalidate user cache to ensure fresh data on next login
    try {
      await cache.invalidateByTag(CacheTags.user(userId));
      console.log(`[Auth Service] Invalidated cache for user ${userId}`);
    } catch (cacheError) {
      // Log but don't fail - database is already updated
      console.error(`[Auth Service] Failed to invalidate cache for user ${userId}:`, cacheError);
    }

    console.log(`[Auth Service] Updated user ${userId} in auth_db:`, Object.keys(updateData));

    context.ack();
  } catch (error) {
    console.error(`[Auth Service] Error handling admin.user.updated for ${userId}:`, error);
    // Requeue for retry
    context.nack(true);
  }
}

/**
 * Initialize event subscriber
 */
export async function initializeSubscriber(): Promise<void> {
  if (adminEventsSubscriber) {
    return; // Already subscribed
  }

  const connectionManager = getConnectionManager();

  adminEventsSubscriber = new RabbitMQSubscriber(connectionManager, {
    exchange: config.rabbitmq.exchange,
    queue: 'auth_service_admin_events',
    routingKeyPattern: 'admin.user.*',
    durable: true,
    manualAck: true,
  });

  await adminEventsSubscriber.initialize();

  // Subscribe with router to handle different event types
  await adminEventsSubscriber.subscribe(async (event, context) => {
    switch (event.type) {
      case 'admin.user.deleted':
        await handleAdminUserDeleted(event as BaseEvent<AdminUserDeletedEvent>, context);
        break;
      case 'admin.user.updated':
        await handleAdminUserUpdated(event as BaseEvent<AdminUserUpdatedEvent>, context);
        break;
      default:
        console.log(`[Auth Service] Unknown admin event: ${event.type}`);
        context.ack(); // Ack unknown events
    }
  });

  console.log('[Auth Service] Subscribed to admin events (admin.user.*)');
}

/**
 * Close subscriber (for graceful shutdown)
 */
export async function closeSubscriber(): Promise<void> {
  if (adminEventsSubscriber) {
    await adminEventsSubscriber.close();
    adminEventsSubscriber = null;
    console.log('[Auth Service] Event subscriber closed');
  }
}
