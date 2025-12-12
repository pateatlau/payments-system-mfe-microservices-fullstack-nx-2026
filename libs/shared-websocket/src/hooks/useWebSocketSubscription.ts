/**
 * useWebSocketSubscription Hook
 *
 * Subscribe to WebSocket events with automatic cleanup
 */

import { useEffect } from 'react';
import { useWebSocket } from './useWebSocket';
import type { EventListener } from '../lib/types';

/**
 * Subscribe to a WebSocket event
 *
 * Automatically subscribes on mount and unsubscribes on unmount
 *
 * @param eventType - Event type to subscribe to (e.g., 'payment:created')
 * @param callback - Callback function to handle events
 * @param deps - Optional dependency array (like useEffect)
 */
export function useWebSocketSubscription<T = unknown>(
  eventType: string,
  callback: EventListener<T>,
  deps: React.DependencyList = []
): void {
  const { client, isConnected } = useWebSocket();

  useEffect(() => {
    if (!isConnected) return;

    // Subscribe to event type
    client.subscribe(eventType);

    // Register event listener
    client.on(eventType, callback);

    // Cleanup on unmount
    return () => {
      client.off(eventType, callback);
      // Note: We don't unsubscribe here because other components might be listening
      // Subscriptions are automatically re-established on reconnection
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [client, eventType, isConnected, ...deps]);
}
