/**
 * Payments Service - Event Publisher
 *
 * Purpose: Publish payment-related events to RabbitMQ
 * Events: payment.created, payment.updated, payment.completed, payment.failed
 *
 * Zero-Coupling Pattern:
 * - Payments Service publishes events when payment status changes
 * - Other services (Admin, Profile) subscribe to these events
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
        appId: 'payments-service',
      },
    });

    // Initialize exchange
    publisher.initialize().catch((error) => {
      console.error('[Payments Service] Failed to initialize publisher:', error);
    });
  }

  return publisher;
}

/**
 * Payment Event Payloads
 */
interface PaymentCreatedPayload {
  paymentId: string;
  senderId: string;
  recipientId: string;
  amount: number;
  currency: string;
  description?: string;
  status: string;
  createdAt: string;
}

interface PaymentUpdatedPayload {
  paymentId: string;
  status?: string;
  updatedAt: string;
}

interface PaymentCompletedPayload {
  paymentId: string;
  senderId: string;
  recipientId: string;
  amount: number;
  currency: string;
  completedAt: string;
}

interface PaymentFailedPayload {
  paymentId: string;
  senderId: string;
  recipientId: string;
  amount: number;
  currency: string;
  failureReason: string;
  failedAt: string;
}

/**
 * Publish payment.created event
 *
 * Triggered when a new payment is initiated
 * Subscribers: Admin Service (audit log), Profile Service (transaction history)
 */
export async function publishPaymentCreated(payload: PaymentCreatedPayload): Promise<void> {
  const publisher = getEventPublisher();
  
  await publisher.publish(
    'payment.created',
    payload,
    {
      paymentId: payload.paymentId,
      senderId: payload.senderId,
      eventType: 'payment_lifecycle',
    }
  );

  console.log(`[Payments Service] Published payment.created event: ${payload.paymentId}`);
}

/**
 * Publish payment.updated event
 *
 * Triggered when payment status changes
 * Subscribers: Admin Service (audit log), Profile Service (update status)
 */
export async function publishPaymentUpdated(payload: PaymentUpdatedPayload): Promise<void> {
  const publisher = getEventPublisher();
  
  await publisher.publish(
    'payment.updated',
    payload,
    {
      paymentId: payload.paymentId,
      eventType: 'payment_lifecycle',
    }
  );

  console.log(`[Payments Service] Published payment.updated event: ${payload.paymentId}`);
}

/**
 * Publish payment.completed event
 *
 * Triggered when a payment completes successfully
 * Subscribers: Admin Service (reporting), Profile Service (update balance/history)
 */
export async function publishPaymentCompleted(payload: PaymentCompletedPayload): Promise<void> {
  const publisher = getEventPublisher();
  
  await publisher.publish(
    'payment.completed',
    payload,
    {
      paymentId: payload.paymentId,
      senderId: payload.senderId,
      recipientId: payload.recipientId,
      eventType: 'payment_lifecycle',
    }
  );

  console.log(`[Payments Service] Published payment.completed event: ${payload.paymentId}`);
}

/**
 * Publish payment.failed event
 *
 * Triggered when a payment fails
 * Subscribers: Admin Service (error tracking), Profile Service (notify user)
 */
export async function publishPaymentFailed(payload: PaymentFailedPayload): Promise<void> {
  const publisher = getEventPublisher();
  
  await publisher.publish(
    'payment.failed',
    payload,
    {
      paymentId: payload.paymentId,
      senderId: payload.senderId,
      eventType: 'payment_lifecycle',
    }
  );

  console.log(`[Payments Service] Published payment.failed event: ${payload.paymentId}`);
}

/**
 * Close the publisher (for graceful shutdown)
 */
export async function closePublisher(): Promise<void> {
  if (publisher) {
    await publisher.close();
    publisher = null;
    console.log('[Payments Service] Event publisher closed');
  }
}
