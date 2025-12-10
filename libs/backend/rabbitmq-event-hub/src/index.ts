/**
 * RabbitMQ Event Hub Library
 *
 * Purpose: Production-ready event hub for microservices using RabbitMQ
 * Features:
 * - Connection management with automatic reconnection
 * - Reliable message publishing with persistence and confirms
 * - Flexible message subscription with manual ack/nack
 * - Exponential backoff retry logic
 * - Type-safe event handling
 * - Dead letter queue support
 * - Health checks and statistics
 *
 * Zero-Coupling Pattern:
 * - Services communicate ONLY via RabbitMQ events
 * - No direct API calls between services
 * - Eventual consistency via event synchronization
 *
 * Usage:
 * ```typescript
 * import { RabbitMQConnectionManager, RabbitMQPublisher, RabbitMQSubscriber } from '@payments-system/rabbitmq-event-hub';
 *
 * // Create connection manager
 * const connectionManager = new RabbitMQConnectionManager({
 *   url: 'amqp://localhost:5672',
 * });
 * await connectionManager.connect();
 *
 * // Publish events
 * const publisher = new RabbitMQPublisher(connectionManager, {
 *   exchange: 'payments_events',
 * });
 * await publisher.publish('user.created', { userId: '123', email: 'user@example.com' });
 *
 * // Subscribe to events
 * const subscriber = new RabbitMQSubscriber(connectionManager, {
 *   exchange: 'payments_events',
 *   routingKeyPattern: 'user.*',
 * });
 * await subscriber.subscribe(async (event, context) => {
 *   console.log('Received event:', event);
 *   context.ack();
 * });
 * ```
 */

// Export types
export * from './lib/types';

// Export connection manager
export { RabbitMQConnectionManager } from './lib/connection';

// Export publisher
export { RabbitMQPublisher } from './lib/publisher';

// Export subscriber
export { RabbitMQSubscriber } from './lib/subscriber';

// Export retry utilities
export {
  calculateRetryDelay,
  sleep,
  withRetry,
  withRetryIfRetryable,
  isRetryableError,
  createRetryWrapper,
  defaultRetryStrategy,
} from './lib/retry';
