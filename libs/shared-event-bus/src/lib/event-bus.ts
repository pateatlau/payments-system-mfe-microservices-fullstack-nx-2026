/**
 * Event Bus Implementation
 *
 * Provides a pub/sub pattern for inter-MFE communication
 * Features:
 * - Type-safe event emission and subscription
 * - Event history for debugging
 * - One-time subscription support
 * - Error handling for listeners
 */

import type { AppEvent, AppEventType, EventPayloadMap } from './events';
import type { EventMeta, EventSource } from './types';

/**
 * Event handler function type
 * @template T - The event type being handled
 */
export type EventHandler<T extends AppEventType> = (
  payload: EventPayloadMap[T],
  meta: EventMeta
) => void;

/**
 * Unsubscribe function returned by subscription methods
 */
export type UnsubscribeFn = () => void;

/**
 * Event bus interface
 */
export interface IEventBus {
  /**
   * Subscribe to an event type
   * @returns Unsubscribe function
   */
  on<T extends AppEventType>(
    eventType: T,
    handler: EventHandler<T>
  ): UnsubscribeFn;

  /**
   * Unsubscribe from an event type
   */
  off<T extends AppEventType>(eventType: T, handler: EventHandler<T>): void;

  /**
   * Emit an event
   */
  emit<T extends AppEventType>(
    eventType: T,
    payload: EventPayloadMap[T],
    source: EventSource
  ): void;

  /**
   * Subscribe to an event type once (auto-unsubscribe after first emission)
   * @returns Unsubscribe function
   */
  once<T extends AppEventType>(
    eventType: T,
    handler: EventHandler<T>
  ): UnsubscribeFn;

  /**
   * Get event history (for debugging)
   */
  getHistory(): AppEvent[];

  /**
   * Clear event history
   */
  clearHistory(): void;
}

/**
 * Event Bus implementation
 * Singleton pattern for global event communication
 */
export class EventBus implements IEventBus {
  private listeners: Map<string, Set<EventHandler<AppEventType>>> = new Map();
  private eventHistory: AppEvent[] = [];
  private readonly maxHistorySize: number;

  constructor(maxHistorySize = 100) {
    this.maxHistorySize = maxHistorySize;
  }

  /**
   * Subscribe to an event type
   */
  on<T extends AppEventType>(
    eventType: T,
    handler: EventHandler<T>
  ): UnsubscribeFn {
    if (!this.listeners.has(eventType)) {
      this.listeners.set(eventType, new Set());
    }

    const listenersSet = this.listeners.get(eventType);
    if (listenersSet) {
      listenersSet.add(handler as EventHandler<AppEventType>);
    }

    // Return unsubscribe function
    return () => this.off(eventType, handler);
  }

  /**
   * Unsubscribe from an event type
   */
  off<T extends AppEventType>(eventType: T, handler: EventHandler<T>): void {
    const listenersSet = this.listeners.get(eventType);
    if (listenersSet) {
      listenersSet.delete(handler as EventHandler<AppEventType>);
    }
  }

  /**
   * Emit an event
   */
  emit<T extends AppEventType>(
    eventType: T,
    payload: EventPayloadMap[T],
    source: EventSource
  ): void {
    const meta: EventMeta = {
      timestamp: new Date().toISOString(),
      source,
      version: 1,
      correlationId:
        typeof crypto !== 'undefined' && crypto.randomUUID
          ? crypto.randomUUID()
          : `${Date.now()}-${Math.random().toString(36).substring(2, 15)}`,
    };

    // Log event in development
    if (process.env['NODE_ENV'] === 'development') {
      console.log(`[EventBus] ${eventType}`, { payload, meta });
    }

    // Create event object
    const event: AppEvent = {
      type: eventType,
      payload,
      meta,
    } as AppEvent;

    // Store in history
    this.addToHistory(event);

    // Notify listeners
    const listenersSet = this.listeners.get(eventType);
    if (listenersSet) {
      listenersSet.forEach(handler => {
        try {
          handler(payload, meta);
        } catch (error) {
          console.error(`[EventBus] Error in handler for ${eventType}:`, error);
        }
      });
    }
  }

  /**
   * Subscribe to an event type once (auto-unsubscribe after first emission)
   */
  once<T extends AppEventType>(
    eventType: T,
    handler: EventHandler<T>
  ): UnsubscribeFn {
    const wrappedHandler: EventHandler<T> = (payload, meta) => {
      this.off(eventType, wrappedHandler);
      handler(payload, meta);
    };

    return this.on(eventType, wrappedHandler);
  }

  /**
   * Get event history (for debugging)
   * Returns a copy to prevent external modifications
   */
  getHistory(): AppEvent[] {
    return [...this.eventHistory];
  }

  /**
   * Clear event history
   */
  clearHistory(): void {
    this.eventHistory = [];
  }

  /**
   * Get number of listeners for a specific event type
   * Useful for debugging
   */
  getListenerCount(eventType: AppEventType): number {
    return this.listeners.get(eventType)?.size ?? 0;
  }

  /**
   * Get all event types that have listeners
   * Useful for debugging
   */
  getEventTypes(): AppEventType[] {
    return Array.from(this.listeners.keys()) as AppEventType[];
  }

  /**
   * Add event to history with size management
   */
  private addToHistory(event: AppEvent): void {
    this.eventHistory.push(event);

    // Maintain max history size using FIFO
    if (this.eventHistory.length > this.maxHistorySize) {
      this.eventHistory.shift();
    }
  }
}

/**
 * Global singleton event bus instance
 * Use this for all inter-MFE communication
 */
export const eventBus = new EventBus();

/**
 * Create a new event bus instance
 * Useful for testing or isolated event communication
 */
export function createEventBus(maxHistorySize?: number): EventBus {
  return new EventBus(maxHistorySize);
}
