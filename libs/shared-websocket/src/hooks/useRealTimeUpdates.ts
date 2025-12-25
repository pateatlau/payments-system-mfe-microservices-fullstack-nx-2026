/**
 * useRealTimeUpdates Hook
 *
 * Integration with TanStack Query for real-time data invalidation
 */

import { useQueryClient } from '@tanstack/react-query';
import { useWebSocketSubscription } from './useWebSocketSubscription';

export interface RealTimeUpdateConfig {
  /** Event type to listen to */
  eventType: string;

  /** Query keys to invalidate when event is received */
  queryKeys: unknown[][];

  /** Optional callback for custom handling */
  onEvent?: (payload: unknown) => void;
}

/**
 * Automatically invalidate TanStack Query queries on WebSocket events
 *
 * @param config - Real-time update configuration
 *
 * @example
 * useRealTimeUpdates({
 *   eventType: 'payment:created',
 *   queryKeys: [['payments'], ['payment', paymentId]],
 *   onEvent: (payload) => console.log('Payment created', payload),
 * });
 */
export function useRealTimeUpdates(config: RealTimeUpdateConfig): void {
  const queryClient = useQueryClient();

  useWebSocketSubscription(
    config.eventType,
    (payload: unknown) => {
      // Invalidate queries
      config.queryKeys.forEach(queryKey => {
        queryClient.invalidateQueries({ queryKey });
      });

      // Call custom handler
      if (config.onEvent) {
        config.onEvent(payload);
      }
    },
    [queryClient, ...config.queryKeys]
  );
}

/**
 * Automatically update TanStack Query cache on WebSocket events
 *
 * @param eventType - Event type to listen to
 * @param queryKey - Query key to update
 * @param updater - Function to update cache data
 *
 * @example
 * useRealTimeQueryUpdate(
 *   'payment:updated',
 *   ['payment', paymentId],
 *   (oldData, newData) => ({ ...oldData, ...newData })
 * );
 */
export function useRealTimeQueryUpdate<T>(
  eventType: string,
  queryKey: unknown[],
  updater: (oldData: T | undefined, newData: unknown) => T
): void {
  const queryClient = useQueryClient();

  useWebSocketSubscription(
    eventType,
    (payload: unknown) => {
      queryClient.setQueryData<T>(queryKey, oldData =>
        updater(oldData, payload)
      );
    },
    [queryClient, ...queryKey]
  );
}
