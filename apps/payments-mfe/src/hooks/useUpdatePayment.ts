import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { UpdatePaymentData } from '@mfe/shared-api-client';
import { updatePaymentDetails as updatePaymentDetailsShared } from '@mfe/shared-api-client';
import { updatePaymentDetails as updatePaymentDetailsMFE } from '../api/payments';
import type { UpdatePaymentDetailsDto } from '../api/types';
import type { Payment } from 'shared-types';
import { paymentKeys } from './usePayments';

interface UseUpdatePaymentOptions {
  /**
   * Callback invoked on successful mutation
   */
  onSuccess?: (payment: Payment) => void;

  /**
   * Callback invoked on mutation error
   */
  onError?: (error: Error) => void;
}

/**
 * Hook to update payment details via PUT /payments/:id
 *
 * Uses TanStack Query mutation with:
 * - Automatic error handling and retry logic (via shared ApiClient)
 * - Cache invalidation for specific payment and list
 * - Optional success/error callbacks
 *
 * @param options - Optional callbacks for success/error handling
 * @returns TanStack Query mutation object with mutate/mutateAsync and status
 *
 * @example
 * ```tsx
 * const updateMutation = useUpdatePayment({
 *   onSuccess: (payment) => console.log('Updated:', payment),
 *   onError: (error) => console.error('Failed:', error.message),
 * });
 *
 * // In form submission:
 * await updateMutation.mutateAsync({
 *   id: 'pay_123',
 *   data: { description: 'New description' },
 * });
 * ```
 */
export function useUpdatePayment(options?: UseUpdatePaymentOptions) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      data,
    }: {
      id: string;
      data: UpdatePaymentDetailsDto;
    }): Promise<Payment> => {
      // Prefer shared API client if available; fall back to MFE local wrapper
      // The shared client includes auth interceptors, error handling, and retry logic
      try {
        return await updatePaymentDetailsShared(id, data as UpdatePaymentData);
      } catch {
        // Fallback to MFE wrapper (for backward compatibility)
        return await updatePaymentDetailsMFE(id, data);
      }
    },

    onSuccess: (payment: Payment) => {
      // Invalidate specific payment query to refetch fresh data
      queryClient.invalidateQueries({
        queryKey: paymentKeys.detail(payment.id),
        exact: true,
      });

      // Invalidate payments list to reflect any status/data changes
      queryClient.invalidateQueries({
        queryKey: paymentKeys.lists(),
      });

      // Invoke optional callback
      options?.onSuccess?.(payment);
    },

    onError: (error: Error) => {
      // Ensure error is logged or handled
      // eslint-disable-next-line no-console
      console.error('Payment update failed:', error.message);
      options?.onError?.(error);
    },
  });
}
