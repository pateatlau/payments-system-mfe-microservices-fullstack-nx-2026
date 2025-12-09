/**
 * React Hooks for Event Bus
 *
 * Provides React hooks for subscribing to and emitting events
 * Handles automatic cleanup on component unmount
 */

import { useEffect, useCallback, useRef } from 'react';
import { eventBus } from './event-bus';
import type { EventHandler, UnsubscribeFn } from './event-bus';
import type { AppEventType, EventPayloadMap } from './events';
import type { EventSource } from './types';

/**
 * Hook to subscribe to an event
 * Automatically unsubscribes when component unmounts
 *
 * @param eventType - The event type to subscribe to
 * @param handler - The handler function to call when event is emitted
 * @param dependencies - Optional dependencies array for the handler
 *
 * @example
 * ```tsx
 * useEventSubscription('auth:login', (payload, meta) => {
 *   console.log('User logged in:', payload.user);
 * });
 * ```
 */
export function useEventSubscription<T extends AppEventType>(
  eventType: T,
  handler: EventHandler<T>,
  dependencies: unknown[] = []
): void {
  // Use ref to store the handler to avoid re-subscribing
  const handlerRef = useRef(handler);

  // Update handler ref when dependencies change
  useEffect(() => {
    handlerRef.current = handler;
  }, dependencies);

  useEffect(() => {
    // Wrapper to use the latest handler
    const wrappedHandler: EventHandler<T> = (payload, meta) => {
      handlerRef.current(payload, meta);
    };

    // Subscribe
    const unsubscribe = eventBus.on(eventType, wrappedHandler);

    // Cleanup on unmount
    return () => {
      unsubscribe();
    };
  }, [eventType]); // Only re-subscribe if eventType changes
}

/**
 * Hook to emit events
 * Returns a stable emit function that can be used in callbacks
 *
 * @param source - The source MFE identifier
 * @returns Emit function
 *
 * @example
 * ```tsx
 * const emit = useEventEmitter('auth-mfe');
 *
 * const handleLogin = () => {
 *   emit('auth:login', { user, accessToken, refreshToken });
 * };
 * ```
 */
export function useEventEmitter(
  source: EventSource
): <T extends AppEventType>(eventType: T, payload: EventPayloadMap[T]) => void {
  return useCallback(
    <T extends AppEventType>(eventType: T, payload: EventPayloadMap[T]) => {
      eventBus.emit(eventType, payload, source);
    },
    [source]
  );
}

/**
 * Hook to subscribe to an event once
 * Automatically unsubscribes after first emission or component unmount
 *
 * @param eventType - The event type to subscribe to
 * @param handler - The handler function to call when event is emitted
 * @param dependencies - Optional dependencies array for the handler
 *
 * @example
 * ```tsx
 * useEventSubscriptionOnce('auth:login', (payload) => {
 *   console.log('User logged in (once):', payload.user);
 * });
 * ```
 */
export function useEventSubscriptionOnce<T extends AppEventType>(
  eventType: T,
  handler: EventHandler<T>,
  dependencies: unknown[] = []
): void {
  const handlerRef = useRef(handler);
  const unsubscribeRef = useRef<UnsubscribeFn>();

  // Update handler ref when dependencies change
  useEffect(() => {
    handlerRef.current = handler;
  }, dependencies);

  useEffect(() => {
    // Wrapper to use the latest handler and clean up
    const wrappedHandler: EventHandler<T> = (payload, meta) => {
      handlerRef.current(payload, meta);
      // Auto-unsubscribe after first call
      unsubscribeRef.current?.();
    };

    // Subscribe once
    unsubscribeRef.current = eventBus.once(eventType, wrappedHandler);

    // Cleanup on unmount
    return () => {
      unsubscribeRef.current?.();
    };
  }, [eventType]);
}

/**
 * Hook to access event bus history
 * Useful for debugging and event inspection
 *
 * @returns Event history array
 *
 * @example
 * ```tsx
 * const history = useEventHistory();
 * console.log('Event history:', history);
 * ```
 */
export function useEventHistory() {
  return eventBus.getHistory();
}

/**
 * Hook to clear event history
 * Returns a function that clears the history
 *
 * @returns Clear history function
 *
 * @example
 * ```tsx
 * const clearHistory = useClearEventHistory();
 * <button onClick={clearHistory}>Clear History</button>
 * ```
 */
export function useClearEventHistory(): () => void {
  return useCallback(() => {
    eventBus.clearHistory();
  }, []);
}
