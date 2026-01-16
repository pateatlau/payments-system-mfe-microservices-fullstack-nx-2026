/**
 * Admin Service - Event Subscriber
 *
 * Purpose: Subscribe to events from Auth and Payments services
 * Events: user.*, payment.*
 *
 * Zero-Coupling Pattern:
 * - Admin Service subscribes to events from other services
 * - Maintains denormalized copies of User data for admin operations
 * - No direct API calls to other services
 * - Eventual consistency via event synchronization
 */

import {
  RabbitMQSubscriber,
  BaseEvent,
  EventContext,
} from '@payments-system/rabbitmq-event-hub';
import { getConnectionManager } from './connection';
import config from '../config';
import { prisma, Prisma, UserRoleType } from '../lib/prisma';
import {
  createAuditLog,
  AuditAction,
  ResourceType,
} from '../services/audit.service';

let userEventsSubscriber: RabbitMQSubscriber | null = null;
let paymentEventsSubscriber: RabbitMQSubscriber | null = null;

/**
 * User Event Handlers
 */

interface UserCreatedEvent {
  userId: string;
  email: string;
  name: string;
  role: string;
  emailVerified: boolean;
  createdAt: string;
}

interface UserUpdatedEvent {
  userId: string;
  email?: string;
  name?: string;
  role?: string;
  emailVerified?: boolean;
  updatedAt: string;
}

interface UserDeletedEvent {
  userId: string;
  deletedAt: string;
}

interface UserLoginEvent {
  userId: string;
  email: string;
  loginAt: string;
  ipAddress?: string;
}

interface UserLogoutEvent {
  userId: string;
  logoutAt: string;
}

/**
 * Handle user.created event
 *
 * Create denormalized User copy in admin_db
 */
async function handleUserCreated(
  event: BaseEvent<UserCreatedEvent>,
  context: EventContext
): Promise<void> {
  try {
    const { userId, email, name, role, emailVerified, createdAt } = event.data;

    // Create denormalized user in admin_db (passwordHash omitted for security)
    await prisma.user.create({
      data: {
        id: userId,
        email,
        name,
        role: role as UserRoleType,
        emailVerified,
        createdAt: new Date(createdAt),
        updatedAt: new Date(createdAt),
      },
    });

    // Create audit log for user registration
    await createAuditLog({
      action: AuditAction.USER_REGISTERED,
      resourceType: ResourceType.USER,
      resourceId: userId,
      userId: userId,
      details: { email, role, source: 'auth_service_event' },
    });

    console.log(`[Admin Service] Synced user.created: ${userId}`);
    context.ack();
  } catch (error) {
    console.error('[Admin Service] Error handling user.created:', error);
    context.nack(true); // Requeue for retry
  }
}

/**
 * Handle user.updated event
 *
 * Update denormalized User copy in admin_db
 */
async function handleUserUpdated(
  event: BaseEvent<UserUpdatedEvent>,
  context: EventContext
): Promise<void> {
  try {
    const { userId, ...updates } = event.data;

    // Update denormalized user in admin_db
    const updateData: Prisma.UserUpdateInput = {
      ...updates,
      role: updates.role ? (updates.role as UserRoleType) : undefined,
      updatedAt: updates.updatedAt ? new Date(updates.updatedAt) : undefined,
    };
    await prisma.user.update({
      where: { id: userId },
      data: updateData,
    });

    console.log(`[Admin Service] Synced user.updated: ${userId}`);
    context.ack();
  } catch (error) {
    console.error('[Admin Service] Error handling user.updated:', error);
    context.nack(true); // Requeue for retry
  }
}

/**
 * Handle user.deleted event
 *
 * Delete denormalized User copy from admin_db
 */
async function handleUserDeleted(
  event: BaseEvent<UserDeletedEvent>,
  context: EventContext
): Promise<void> {
  try {
    const { userId } = event.data;

    // Get user info before deleting for audit log
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { email: true },
    });

    // Delete denormalized user from admin_db
    await prisma.user.delete({
      where: { id: userId },
    });

    // Create audit log for user deletion (from auth service)
    await createAuditLog({
      action: AuditAction.USER_DELETED,
      resourceType: ResourceType.USER,
      resourceId: userId,
      details: { email: user?.email, source: 'auth_service_event' },
    });

    console.log(`[Admin Service] Synced user.deleted: ${userId}`);
    context.ack();
  } catch (error) {
    console.error('[Admin Service] Error handling user.deleted:', error);
    context.nack(true); // Requeue for retry
  }
}

/**
 * Handle user.login event
 *
 * Create audit log for user login
 */
async function handleUserLogin(
  event: BaseEvent<UserLoginEvent>,
  context: EventContext
): Promise<void> {
  try {
    const { userId, email, loginAt, ipAddress } = event.data;

    // Create audit log for user login
    await createAuditLog({
      action: AuditAction.USER_LOGIN,
      resourceType: ResourceType.USER,
      resourceId: userId,
      userId: userId,
      details: { email, loginAt, source: 'auth_service_event' },
      ipAddress: ipAddress || undefined,
    });

    console.log(`[Admin Service] Logged user.login: ${userId} (${email})`);
    context.ack();
  } catch (error) {
    console.error('[Admin Service] Error handling user.login:', error);
    context.nack(true); // Requeue for retry
  }
}

/**
 * Handle user.logout event
 *
 * Create audit log for user logout
 */
async function handleUserLogout(
  event: BaseEvent<UserLogoutEvent>,
  context: EventContext
): Promise<void> {
  try {
    const { userId, logoutAt } = event.data;

    // Get user info for audit log
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { email: true },
    });

    // Create audit log for user logout
    await createAuditLog({
      action: AuditAction.USER_LOGOUT,
      resourceType: ResourceType.USER,
      resourceId: userId,
      userId: userId,
      details: { email: user?.email, logoutAt, source: 'auth_service_event' },
    });

    console.log(`[Admin Service] Logged user.logout: ${userId}`);
    context.ack();
  } catch (error) {
    console.error('[Admin Service] Error handling user.logout:', error);
    context.nack(true); // Requeue for retry
  }
}

/**
 * Payment Event Handlers (for audit logging)
 */

interface PaymentEvent {
  paymentId: string;
  senderId?: string;
  recipientId?: string;
  amount?: number;
  currency?: string;
  status?: string;
  [key: string]: unknown;
}

/**
 * Handle payment events (for audit logging)
 */
async function handlePaymentEvent(
  event: BaseEvent<PaymentEvent>,
  context: EventContext
): Promise<void> {
  try {
    // Map event type to audit action
    const actionMap: Record<string, string> = {
      'payment.created': AuditAction.PAYMENT_CREATED,
      'payment.updated': AuditAction.PAYMENT_UPDATED,
      'payment.completed': AuditAction.PAYMENT_COMPLETED,
      'payment.failed': AuditAction.PAYMENT_FAILED,
      'payment.cancelled': AuditAction.PAYMENT_CANCELLED,
    };

    const action = actionMap[event.type] || event.type;

    // Create audit log for payment event
    await createAuditLog({
      action,
      resourceType: ResourceType.PAYMENT,
      resourceId: event.data.paymentId,
      userId: event.data.senderId,
      details: {
        ...event.data,
        source: 'payments_service_event',
      },
    });

    console.log(
      `[Admin Service] Logged payment event: ${event.type} - ${event.data.paymentId}`
    );
    context.ack();
  } catch (error) {
    console.error(`[Admin Service] Error handling ${event.type}:`, error);
    context.nack(true); // Requeue for retry
  }
}

/**
 * Start subscribing to user events
 */
export async function subscribeToUserEvents(): Promise<void> {
  if (userEventsSubscriber) {
    return; // Already subscribed
  }

  const connectionManager = getConnectionManager();

  userEventsSubscriber = new RabbitMQSubscriber(connectionManager, {
    exchange: config.rabbitmq.exchange,
    queue: 'admin_service_user_events',
    routingKeyPattern: 'user.*',
    durable: true,
    manualAck: true,
  });

  await userEventsSubscriber.initialize();

  // Subscribe with router to handle different event types
  await userEventsSubscriber.subscribe(async (event, context) => {
    switch (event.type) {
      case 'user.created':
        await handleUserCreated(event as BaseEvent<UserCreatedEvent>, context);
        break;
      case 'user.updated':
        await handleUserUpdated(event as BaseEvent<UserUpdatedEvent>, context);
        break;
      case 'user.deleted':
        await handleUserDeleted(event as BaseEvent<UserDeletedEvent>, context);
        break;
      case 'user.login':
        await handleUserLogin(event as BaseEvent<UserLoginEvent>, context);
        break;
      case 'user.logout':
        await handleUserLogout(event as BaseEvent<UserLogoutEvent>, context);
        break;
      default:
        console.log(`[Admin Service] Unknown user event: ${event.type}`);
        context.ack(); // Ack unknown events
    }
  });

  console.log('[Admin Service] Subscribed to user events (user.*)');
}

/**
 * Start subscribing to payment events
 */
export async function subscribeToPaymentEvents(): Promise<void> {
  if (paymentEventsSubscriber) {
    return; // Already subscribed
  }

  const connectionManager = getConnectionManager();

  paymentEventsSubscriber = new RabbitMQSubscriber(connectionManager, {
    exchange: config.rabbitmq.exchange,
    queue: 'admin_service_payment_events',
    routingKeyPattern: 'payment.*',
    durable: true,
    manualAck: true,
  });

  await paymentEventsSubscriber.initialize();

  // Subscribe to all payment events for audit logging
  await paymentEventsSubscriber.subscribe(async (event, context) => {
    await handlePaymentEvent(event as BaseEvent<PaymentEvent>, context);
  });

  console.log('[Admin Service] Subscribed to payment events (payment.*)');
}

/**
 * Start all subscriptions
 */
export async function startEventSubscriptions(): Promise<void> {
  await subscribeToUserEvents();
  await subscribeToPaymentEvents();
  console.log('[Admin Service] All event subscriptions active');
}

/**
 * Close all subscriptions (for graceful shutdown)
 */
export async function closeSubscriptions(): Promise<void> {
  if (userEventsSubscriber) {
    await userEventsSubscriber.close();
    userEventsSubscriber = null;
  }

  if (paymentEventsSubscriber) {
    await paymentEventsSubscriber.close();
    paymentEventsSubscriber = null;
  }

  console.log('[Admin Service] All event subscriptions closed');
}
