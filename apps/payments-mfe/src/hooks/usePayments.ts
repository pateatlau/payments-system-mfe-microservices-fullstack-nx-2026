import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from 'shared-auth-store';
import type { Payment } from '../api/types';
import { listPayments } from '../api/payments';

/**
 * Query key factory for payments
 */
export const paymentKeys = {
  all: ['payments'] as const,
  lists: () => [...paymentKeys.all, 'list'] as const,
  list: (filters: { userId?: string } = {}) =>
    [...paymentKeys.lists(), filters] as const,
  details: () => [...paymentKeys.all, 'detail'] as const,
  detail: (id: string) => [...paymentKeys.details(), id] as const,
};

/**
 * Hook to fetch all payments
 * For CUSTOMER role, filters payments by current user ID
 * For VENDOR/ADMIN roles, returns all payments
 *
 * @returns TanStack Query result with payments data
 */
export function usePayments() {
  const { user } = useAuthStore();

  return useQuery<Payment[]>({
    queryKey: paymentKeys.list({ userId: user?.id }),
    queryFn: async () => {
      // Role-based filtering handled by backend; include basic pagination defaults
      return await listPayments({
        page: 1,
        limit: 20,
      });
    },
    enabled: !!user, // Only fetch if user is authenticated
  });
}

/**
 * Hook to fetch a single payment by ID
 * 
 * @param id - Payment ID
 * @returns TanStack Query result with payment data
 */
export function usePaymentById(id: string | undefined) {
  return useQuery<Payment>({
    queryKey: paymentKeys.detail(id || ''),
    queryFn: async () => {
      if (!id) {
        throw new Error('Payment ID is required');
      }
      const { getPaymentById } = await import('../api/payments');
      return await getPaymentById(id);
    },
    enabled: !!id, // Only fetch if ID is provided
  });
}

/**
 * Hook to invalidate payments queries
 * Useful after mutations to refetch payments list
 */
export function useInvalidatePayments() {
  const queryClient = useQueryClient();

  return () => {
    queryClient.invalidateQueries({ queryKey: paymentKeys.all });
  };
}
