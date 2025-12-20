import { useMutation, useQueryClient } from '@tanstack/react-query';
import { updatePaymentDetails } from '../api/payments';
import type { UpdatePaymentDetailsDto } from '../api/types';
import type { Payment } from 'shared-types';

interface UseUpdatePaymentOptions {
  onSuccess?: (payment: Payment) => void;
  onError?: (error: Error) => void;
}

/**
 * Hook to update payment details (amount, currency, description, recipient, metadata)
 * Invalidates relevant queries after successful update
 */
export function useUpdatePayment(options?: UseUpdatePaymentOptions) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdatePaymentDetailsDto }) =>
      updatePaymentDetails(id, data),
    onSuccess: payment => {
      // Invalidate payment queries to refetch fresh data
      queryClient.invalidateQueries({ queryKey: ['payments'] });
      queryClient.invalidateQueries({ queryKey: ['payment', payment.id] });
      options?.onSuccess?.(payment);
    },
    onError: (error: Error) => {
      options?.onError?.(error);
    },
  });
}
