import { useQuery, useQueryClient } from '@tanstack/react-query';
import { getPayments } from '../api/stubbedPayments';
import { useAuthStore } from 'shared-auth-store';
import type { Payment } from '../api/types';

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
      // For CUSTOMER role, filter by user ID (see own payments only)
      // For VENDOR/ADMIN roles, get all payments
      const userId = user?.role === 'CUSTOMER' ? user.id : undefined;
      return await getPayments(userId);
    },
    enabled: !!user, // Only fetch if user is authenticated
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

