/**
 * Event Publisher
 *
 * Publishes events to Redis Pub/Sub
 */

import { v4 as uuidv4 } from 'uuid';
import { getPublisherClient } from './redis-connection';
import { BaseEvent } from './types';

/**
 * Event Publisher class
 */
export class EventPublisher {
  private serviceName: string;

  constructor(serviceName: string) {
    this.serviceName = serviceName;
  }

  /**
   * Publish an event
   *
   * @param eventType - Event type (e.g., 'auth:user:registered')
   * @param data - Event data
   * @param correlationId - Optional correlation ID for tracing
   * @returns Promise that resolves when event is published
   */
  async publish<T = unknown>(
    eventType: string,
    data: T,
    correlationId?: string
  ): Promise<void> {
    const event: BaseEvent = {
      id: uuidv4(),
      type: eventType,
      timestamp: new Date().toISOString(),
      source: this.serviceName,
      data,
      correlationId,
    };

    const publisher = getPublisherClient();
    await publisher.publish(eventType, JSON.stringify(event));
  }

  /**
   * Publish multiple events in batch
   *
   * @param events - Array of events to publish
   * @returns Promise that resolves when all events are published
   */
  async publishBatch(
    events: Array<{ eventType: string; data: unknown; correlationId?: string }>
  ): Promise<void> {
    const publisher = getPublisherClient();
    const pipeline = publisher.pipeline();

    for (const { eventType, data, correlationId } of events) {
      const event: BaseEvent = {
        id: uuidv4(),
        type: eventType,
        timestamp: new Date().toISOString(),
        source: this.serviceName,
        data,
        correlationId,
      };

      pipeline.publish(eventType, JSON.stringify(event));
    }

    await pipeline.exec();
  }
}

/**
 * Create a new event publisher
 *
 * @param serviceName - Name of the service publishing events
 * @returns EventPublisher instance
 */
export const createEventPublisher = (serviceName: string): EventPublisher => {
  return new EventPublisher(serviceName);
};
