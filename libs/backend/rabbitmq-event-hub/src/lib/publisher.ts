/**
 * RabbitMQ Publisher
 *
 * Purpose: Publish events to RabbitMQ with persistence and reliability
 * Features: Publisher confirms, persistent messages, retry logic, message validation
 */

import { v4 as uuidv4 } from 'uuid';
import { RabbitMQConnectionManager } from './connection';
import { BaseEvent, PublisherOptions, MessageProperties } from './types';
import { withRetry } from './retry';

/**
 * Default publisher options
 */
const defaultPublisherOptions: Partial<PublisherOptions> = {
  exchangeType: 'topic',
  durable: true,
  autoDelete: false,
  confirm: true,
  timeout: 10000, // 10 seconds
  defaultProperties: {
    contentType: 'application/json',
    contentEncoding: 'utf-8',
  },
};

/**
 * RabbitMQ Publisher
 *
 * Publishes events to a RabbitMQ exchange
 */
export class RabbitMQPublisher {
  private readonly connectionManager: RabbitMQConnectionManager;
  private readonly options: PublisherOptions;
  private exchangeReady = false;

  constructor(
    connectionManager: RabbitMQConnectionManager,
    options: PublisherOptions
  ) {
    this.connectionManager = connectionManager;
    this.options = {
      ...defaultPublisherOptions,
      ...options,
    } as PublisherOptions;
  }

  /**
   * Initialize the publisher (create exchange)
   */
  async initialize(): Promise<void> {
    if (this.exchangeReady) {
      return;
    }

    try {
      const channel = await this.connectionManager.getChannel();

      // Create exchange if it doesn't exist
      await channel.assertExchange(
        this.options.exchange,
        this.options.exchangeType!,
        {
          durable: this.options.durable,
          autoDelete: this.options.autoDelete,
        }
      );

      this.exchangeReady = true;
      console.log(
        `[RabbitMQ Publisher] Exchange "${this.options.exchange}" ready`
      );
    } catch (error) {
      console.error('[RabbitMQ Publisher] Failed to initialize:', error);
      throw error;
    }
  }

  /**
   * Publish an event
   *
   * @param routingKey - Routing key (e.g., 'user.created', 'payment.completed')
   * @param data - Event data
   * @param metadata - Optional event metadata
   * @param correlationId - Optional correlation ID
   * @returns Event ID
   */
  async publish<T = unknown>(
    routingKey: string,
    data: T,
    metadata?: Record<string, unknown>,
    correlationId?: string
  ): Promise<string> {
    // Ensure exchange is ready
    if (!this.exchangeReady) {
      await this.initialize();
    }

    // Create event
    const event: BaseEvent<T> = {
      id: uuidv4(),
      type: routingKey,
      version: '1.0',
      timestamp: new Date().toISOString(),
      source: this.options.defaultProperties?.appId || 'unknown',
      correlationId,
      data,
      metadata,
    };

    // Validate event
    this.validateEvent(event);

    // Publish with retry
    await withRetry(
      async () => {
        const channel = await this.connectionManager.getChannel();

        // Prepare message properties
        const properties: MessageProperties = {
          ...this.options.defaultProperties,
          messageId: event.id,
          correlationId: event.correlationId,
          timestamp: Date.parse(event.timestamp),
          type: event.type,
          headers: {
            source: event.source,
            version: event.version,
            ...metadata,
          },
        };

        // Serialize event
        const message = Buffer.from(JSON.stringify(event));

        // Publish message
        const published = channel.publish(
          this.options.exchange,
          routingKey,
          message,
          properties
        );

        if (!published) {
          throw new Error('Failed to publish message (buffer full)');
        }

        // Wait for confirmation if enabled
        if (this.options.confirm) {
          await this.waitForConfirm(channel);
        }

        this.connectionManager.incrementStat('published');
        console.log(
          `[RabbitMQ Publisher] Published event: ${event.id} (${routingKey})`
        );
      },
      {
        maxRetries: 3,
        initialDelay: 1000,
        maxDelay: 5000,
        multiplier: 2,
        jitter: true,
      },
      (attempt, error, delay) => {
        console.warn(
          `[RabbitMQ Publisher] Publish attempt ${attempt} failed: ${error.message}. Retrying in ${delay}ms...`
        );
        this.connectionManager.incrementStat('errors');
      }
    );

    return event.id;
  }

  /**
   * Publish multiple events in batch
   *
   * @param events - Array of events to publish
   * @returns Array of event IDs
   */
  async publishBatch<T = unknown>(
    events: Array<{
      routingKey: string;
      data: T;
      metadata?: Record<string, unknown>;
      correlationId?: string;
    }>
  ): Promise<string[]> {
    const eventIds: string[] = [];

    for (const event of events) {
      const eventId = await this.publish(
        event.routingKey,
        event.data,
        event.metadata,
        event.correlationId
      );
      eventIds.push(eventId);
    }

    return eventIds;
  }

  /**
   * Validate event structure
   */
  private validateEvent(event: BaseEvent): void {
    if (!event.id) {
      throw new Error('Event ID is required');
    }

    if (!event.type) {
      throw new Error('Event type is required');
    }

    if (!event.version) {
      throw new Error('Event version is required');
    }

    if (!event.timestamp) {
      throw new Error('Event timestamp is required');
    }

    if (!event.source) {
      throw new Error('Event source is required');
    }

    if (event.data === undefined) {
      throw new Error('Event data is required');
    }
  }

  /**
   * Wait for publisher confirmation
   */
  private async waitForConfirm(channel: any): Promise<void> {
    // Use the promise-based API for waitForConfirms
    const timeout = this.options.timeout || 10000;

    return Promise.race([
      channel.waitForConfirms(),
      new Promise<never>((_, reject) =>
        setTimeout(
          () => reject(new Error('Publisher confirmation timeout')),
          timeout
        )
      ),
    ]);
  }

  /**
   * Close the publisher
   */
  async close(): Promise<void> {
    this.exchangeReady = false;
    console.log('[RabbitMQ Publisher] Publisher closed');
  }
}
