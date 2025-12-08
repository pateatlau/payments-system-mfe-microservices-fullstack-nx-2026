/**
 * Event Hub Types
 *
 * Type definitions for event publishing and subscribing
 */

/**
 * Base event structure
 */
export interface BaseEvent {
  id: string;
  type: string;
  timestamp: string;
  source: string;
  data: unknown;
  correlationId?: string;
}

/**
 * Event handler function
 */
export type EventHandler<T = unknown> = (
  event: BaseEvent & { data: T }
) => void | Promise<void>;

/**
 * Event subscription
 */
export interface EventSubscription {
  eventType: string;
  handler: EventHandler;
  unsubscribe: () => Promise<void>;
}
