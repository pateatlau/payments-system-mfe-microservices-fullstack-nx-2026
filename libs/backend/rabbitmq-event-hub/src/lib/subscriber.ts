/**
 * RabbitMQ Subscriber
 *
 * Purpose: Subscribe to events from RabbitMQ with reliable message handling
 * Features: Manual ack/nack, dead letter queue, message validation, error handling
 */

import { RabbitMQConnectionManager } from './connection';
import {
  BaseEvent,
  EventHandler,
  SubscriberOptions,
  EventContext,
} from './types';

/**
 * Default subscriber options
 */
const defaultSubscriberOptions: Partial<SubscriberOptions> = {
  durable: true,
  autoDelete: false,
  exclusive: false,
  manualAck: true,
  prefetch: 10,
};

/**
 * RabbitMQ Subscriber
 *
 * Subscribes to events from a RabbitMQ exchange
 */
export class RabbitMQSubscriber {
  private readonly connectionManager: RabbitMQConnectionManager;
  private readonly options: SubscriberOptions;
  private consumerTag: string | null = null;
  private queueReady = false;

  constructor(
    connectionManager: RabbitMQConnectionManager,
    options: SubscriberOptions
  ) {
    this.connectionManager = connectionManager;
    this.options = {
      ...defaultSubscriberOptions,
      ...options,
    } as SubscriberOptions;
  }

  /**
   * Initialize the subscriber (create queue and bindings)
   */
  async initialize(): Promise<void> {
    if (this.queueReady) {
      return;
    }

    try {
      const channel = await this.connectionManager.getChannel();

      // Create exchange if it doesn't exist
      await channel.assertExchange(this.options.exchange, 'topic', {
        durable: true,
      });

      // Create queue with optional dead letter exchange
      const queueArgs: Record<string, unknown> = {
        ...this.options.arguments,
      };

      if (this.options.deadLetterExchange) {
        queueArgs['x-dead-letter-exchange'] = this.options.deadLetterExchange;
        if (this.options.deadLetterRoutingKey) {
          queueArgs['x-dead-letter-routing-key'] =
            this.options.deadLetterRoutingKey;
        }
      }

      if (this.options.messageTtl) {
        queueArgs['x-message-ttl'] = this.options.messageTtl;
      }

      // Assert queue
      const queueName = this.options.queue || '';
      const queue = await channel.assertQueue(queueName, {
        durable: this.options.durable,
        autoDelete: this.options.autoDelete,
        exclusive: this.options.exclusive,
        arguments: queueArgs,
      });

      // Store the actual queue name (important for auto-generated names)
      this.options.queue = queue.queue;

      // Bind queue to exchange with routing key pattern
      await channel.bindQueue(
        queue.queue,
        this.options.exchange,
        this.options.routingKeyPattern
      );

      // Set prefetch
      if (this.options.prefetch) {
        await channel.prefetch(this.options.prefetch);
      }

      this.queueReady = true;
      console.log(
        `[RabbitMQ Subscriber] Queue "${queue.queue}" ready, bound to "${this.options.exchange}" with pattern "${this.options.routingKeyPattern}"`
      );
    } catch (error) {
      console.error('[RabbitMQ Subscriber] Failed to initialize:', error);
      throw error;
    }
  }

  /**
   * Subscribe to events
   *
   * @param handler - Event handler function
   */
  async subscribe<T = unknown>(handler: EventHandler<T>): Promise<void> {
    // Ensure queue is ready
    if (!this.queueReady) {
      await this.initialize();
    }

    try {
      const channel = await this.connectionManager.getChannel();

      // Start consuming messages
      const consumer = await channel.consume(
        this.options.queue!,
        async (msg: any) => {
          if (!msg) {
            console.warn('[RabbitMQ Subscriber] Received null message');
            return;
          }

          try {
            // Parse event
            const event = this.parseEvent<T>(msg.content);

            // Validate event
            this.validateEvent(event);

            // Create event context
            const context: EventContext = {
              ack: () => {
                channel.ack(msg);
                this.connectionManager.incrementStat('acknowledged');
              },
              nack: (requeue = true) => {
                channel.nack(msg, false, requeue);
                this.connectionManager.incrementStat('nacked');
              },
              reject: () => {
                channel.reject(msg, false);
                this.connectionManager.incrementStat('rejected');
              },
              exchange: this.options.exchange,
              routingKey: msg.fields.routingKey,
              deliveryTag: msg.fields.deliveryTag,
              redelivered: msg.fields.redelivered,
              properties: {
                contentType: msg.properties.contentType,
                contentEncoding: msg.properties.contentEncoding,
                messageId: msg.properties.messageId,
                correlationId: msg.properties.correlationId,
                replyTo: msg.properties.replyTo,
                expiration: msg.properties.expiration,
                priority: msg.properties.priority,
                timestamp: msg.properties.timestamp,
                type: msg.properties.type,
                appId: msg.properties.appId,
                headers: msg.properties.headers,
              },
            };

            // Invoke handler
            await handler(event, context);

            // Auto-ack if manual ack is disabled
            if (!this.options.manualAck) {
              context.ack();
            }

            this.connectionManager.incrementStat('consumed');
            console.log(
              `[RabbitMQ Subscriber] Processed event: ${event.id} (${event.type})`
            );
          } catch (error) {
            const err = error as Error;
            console.error(
              `[RabbitMQ Subscriber] Error processing message:`,
              err
            );
            this.connectionManager.incrementStat('errors');

            // Nack message on error (with requeue based on retry count)
            const retryCount = msg.properties.headers?.['x-retry-count'] || 0;
            const shouldRequeue = retryCount < 3; // Max 3 retries

            if (this.options.manualAck) {
              channel.nack(msg, false, shouldRequeue);
              this.connectionManager.incrementStat('nacked');
            }
          }
        },
        {
          noAck: !this.options.manualAck,
        }
      );

      this.consumerTag = consumer.consumerTag;
      console.log(
        `[RabbitMQ Subscriber] Subscribed to queue "${this.options.queue}" (consumer tag: ${this.consumerTag})`
      );
    } catch (error) {
      console.error('[RabbitMQ Subscriber] Failed to subscribe:', error);
      throw error;
    }
  }

  /**
   * Unsubscribe from events
   */
  async unsubscribe(): Promise<void> {
    if (!this.consumerTag) {
      return;
    }

    try {
      const channel = await this.connectionManager.getChannel();
      await channel.cancel(this.consumerTag);
      this.consumerTag = null;
      console.log('[RabbitMQ Subscriber] Unsubscribed');
    } catch (error) {
      console.error('[RabbitMQ Subscriber] Failed to unsubscribe:', error);
      throw error;
    }
  }

  /**
   * Parse event from message buffer
   */
  private parseEvent<T>(buffer: Buffer): BaseEvent<T> {
    try {
      const json = buffer.toString('utf-8');
      return JSON.parse(json) as BaseEvent<T>;
    } catch (error) {
      throw new Error(`Failed to parse event: ${(error as Error).message}`);
    }
  }

  /**
   * Validate event structure
   */
  private validateEvent(event: BaseEvent): void {
    if (!event.id) {
      throw new Error('Event ID is missing');
    }

    if (!event.type) {
      throw new Error('Event type is missing');
    }

    if (!event.version) {
      throw new Error('Event version is missing');
    }

    if (!event.timestamp) {
      throw new Error('Event timestamp is missing');
    }

    if (!event.source) {
      throw new Error('Event source is missing');
    }

    if (event.data === undefined) {
      throw new Error('Event data is missing');
    }
  }

  /**
   * Close the subscriber
   */
  async close(): Promise<void> {
    await this.unsubscribe();
    this.queueReady = false;
    console.log('[RabbitMQ Subscriber] Subscriber closed');
  }
}
