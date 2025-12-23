/**
 * usePaymentUpdates Hook
 *
 * Real-time payment updates via WebSocket
 * Automatically invalidates TanStack Query caches when payments change
 */

import { useWebSocketSubscription } from 'shared-websocket';
import { useQueryClient } from '@tanstack/react-query';
import { useCallback } from 'react';

export interface PaymentUpdatePayload {
  paymentId: string;
  userId: string;
  status: string;
  [key: string]: unknown;
}

/**
 * Subscribe to real-time payment updates
 * Invalidates relevant queries to trigger UI refresh
 */
export function usePaymentUpdates() {
  const queryClient = useQueryClient();

  // Handle payment created event
  const handlePaymentCreated = useCallback(
    (payload: PaymentUpdatePayload) => {
      // eslint-disable-next-line no-console
      console.log('[PaymentUpdates] Payment created:', payload);

      // Invalidate payments list to show new payment
      queryClient.invalidateQueries({ queryKey: ['payments'] });
    },
    [queryClient]
  );

  // Handle payment updated event
  const handlePaymentUpdated = useCallback(
    (payload: PaymentUpdatePayload) => {
      // eslint-disable-next-line no-console
      console.log('[PaymentUpdates] Payment updated:', payload);

      // Invalidate payments list
      queryClient.invalidateQueries({ queryKey: ['payments'] });

      // Invalidate specific payment query if available
      if (payload.paymentId) {
        queryClient.invalidateQueries({
          queryKey: ['payment', payload.paymentId],
        });
      }
    },
    [queryClient]
  );

  // Handle payment completed event
  const handlePaymentCompleted = useCallback(
    (payload: PaymentUpdatePayload) => {
      // eslint-disable-next-line no-console
      console.log('[PaymentUpdates] Payment completed:', payload);

      // Invalidate payments list
      queryClient.invalidateQueries({ queryKey: ['payments'] });

      // Invalidate specific payment query
      if (payload.paymentId) {
        queryClient.invalidateQueries({
          queryKey: ['payment', payload.paymentId],
        });
      }
    },
    [queryClient]
  );

  // Handle payment failed event
  const handlePaymentFailed = useCallback(
    (payload: PaymentUpdatePayload) => {
      // eslint-disable-next-line no-console
      console.log('[PaymentUpdates] Payment failed:', payload);

      // Invalidate payments list
      queryClient.invalidateQueries({ queryKey: ['payments'] });

      // Invalidate specific payment query
      if (payload.paymentId) {
        queryClient.invalidateQueries({
          queryKey: ['payment', payload.paymentId],
        });
      }
    },
    [queryClient]
  );

  // Subscribe to WebSocket events
  useWebSocketSubscription('payment:created', handlePaymentCreated, [
    queryClient,
  ]);
  useWebSocketSubscription('payment:updated', handlePaymentUpdated, [
    queryClient,
  ]);
  useWebSocketSubscription('payment:completed', handlePaymentCompleted, [
    queryClient,
  ]);
  useWebSocketSubscription('payment:failed', handlePaymentFailed, [
    queryClient,
  ]);
}
