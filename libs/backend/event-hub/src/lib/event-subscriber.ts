/**
 * Event Subscriber
 *
 * Subscribes to events from Redis Pub/Sub
 */

import { getSubscriberClient } from './redis-connection';
import { BaseEvent, EventHandler, EventSubscription } from './types';

/**
 * Event Subscriber class
 */
export class EventSubscriber {
  private serviceName: string;
  private subscriptions: Map<string, Set<EventHandler>> = new Map();

  constructor(serviceName: string) {
    this.serviceName = serviceName;
    this.setupMessageHandler();
  }

  /**
   * Setup Redis message handler
   */
  private setupMessageHandler(): void {
    const subscriber = getSubscriberClient();

    subscriber.on('message', (channel: string, message: string) => {
      try {
        const event: BaseEvent = JSON.parse(message);
        this.handleEvent(channel, event);
      } catch (error) {
        console.error('Error parsing event message:', error);
      }
    });
  }

  /**
   * Handle incoming event
   *
   * @param eventType - Event type
   * @param event - Event data
   */
  private handleEvent(eventType: string, event: BaseEvent): void {
    const handlers = this.subscriptions.get(eventType);

    if (handlers && handlers.size > 0) {
      handlers.forEach(async handler => {
        try {
          await handler(event);
        } catch (error) {
          console.error(`Error handling event ${eventType}:`, error);
        }
      });
    }
  }

  /**
   * Subscribe to an event
   *
   * @param eventType - Event type to subscribe to
   * @param handler - Event handler function
   * @returns EventSubscription with unsubscribe method
   */
  async subscribe<T = unknown>(
    eventType: string,
    handler: EventHandler<T>
  ): Promise<EventSubscription> {
    const subscriber = getSubscriberClient();

    // Add handler to subscriptions map
    if (!this.subscriptions.has(eventType)) {
      this.subscriptions.set(eventType, new Set());
      // Subscribe to Redis channel
      await subscriber.subscribe(eventType);
    }

    this.subscriptions.get(eventType)!.add(handler as EventHandler);

    // Return subscription object with unsubscribe method
    return {
      eventType,
      handler,
      unsubscribe: async () => {
        await this.unsubscribe(eventType, handler);
      },
    };
  }

  /**
   * Unsubscribe from an event
   *
   * @param eventType - Event type to unsubscribe from
   * @param handler - Event handler to remove
   */
  async unsubscribe(eventType: string, handler: EventHandler): Promise<void> {
    const handlers = this.subscriptions.get(eventType);

    if (handlers) {
      handlers.delete(handler);

      // If no more handlers for this event type, unsubscribe from Redis
      if (handlers.size === 0) {
        this.subscriptions.delete(eventType);
        const subscriber = getSubscriberClient();
        await subscriber.unsubscribe(eventType);
      }
    }
  }

  /**
   * Subscribe to multiple events with a single handler
   *
   * @param eventTypes - Array of event types to subscribe to
   * @param handler - Event handler function
   * @returns Array of EventSubscription objects
   */
  async subscribeToMany<T = unknown>(
    eventTypes: string[],
    handler: EventHandler<T>
  ): Promise<EventSubscription[]> {
    const subscriptions: EventSubscription[] = [];

    for (const eventType of eventTypes) {
      const subscription = await this.subscribe(eventType, handler);
      subscriptions.push(subscription);
    }

    return subscriptions;
  }

  /**
   * Unsubscribe from all events
   */
  async unsubscribeAll(): Promise<void> {
    const subscriber = getSubscriberClient();
    const eventTypes = Array.from(this.subscriptions.keys());

    for (const eventType of eventTypes) {
      await subscriber.unsubscribe(eventType);
    }

    this.subscriptions.clear();
  }

  /**
   * Get all active subscriptions
   *
   * @returns Array of event types with active subscriptions
   */
  getActiveSubscriptions(): string[] {
    return Array.from(this.subscriptions.keys());
  }
}

/**
 * Create a new event subscriber
 *
 * @param serviceName - Name of the service subscribing to events
 * @returns EventSubscriber instance
 */
export const createEventSubscriber = (serviceName: string): EventSubscriber => {
  return new EventSubscriber(serviceName);
};
