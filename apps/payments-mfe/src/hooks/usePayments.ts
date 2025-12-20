import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from 'shared-auth-store';
import type { Payment } from '../api/types';
import { listPayments } from '../api/payments';
import type { PaymentStatus, PaymentType } from 'shared-types';

/**
 * Query key factory for payments
 */
export const paymentKeys = {
  all: ['payments'] as const,
  lists: () => [...paymentKeys.all, 'list'] as const,
  list: (params: unknown = {}) => [...paymentKeys.lists(), params] as const,
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
export type UsePaymentsFilters = {
  status?: PaymentStatus | 'all';
  type?: PaymentType | 'all';
  fromDate?: string;
  toDate?: string;
  minAmount?: number;
  maxAmount?: number;
};

function applyClientFilters(payments: Payment[], filters?: UsePaymentsFilters) {
  if (!filters) return payments;
  const { fromDate, toDate, minAmount, maxAmount } = filters;

  return payments.filter(p => {
    const createdAt = new Date(p.createdAt).getTime();
    const withinDate =
      (!fromDate || createdAt >= new Date(fromDate).getTime()) &&
      (!toDate || createdAt <= new Date(toDate).getTime());
    const withinAmount =
      (minAmount === undefined || p.amount >= minAmount) &&
      (maxAmount === undefined || p.amount <= maxAmount);
    return withinDate && withinAmount;
  });
}

export function usePayments(filters?: UsePaymentsFilters) {
  const { user } = useAuthStore();

  return useQuery<Payment[]>({
    queryKey: paymentKeys.list({ userId: user?.id, filters }),
    queryFn: async () => {
      // Send supported filters to backend; keep other filters client-side
      const params: {
        page: number;
        limit: number;
        status?: PaymentStatus;
        type?: PaymentType;
        fromDate?: string;
        toDate?: string;
        minAmount?: number;
        maxAmount?: number;
      } = { page: 1, limit: 20 };

      if (filters?.status && filters.status !== 'all') {
        params.status = filters.status as PaymentStatus;
      }
      if (filters?.type && filters.type !== 'all') {
        params.type = filters.type as PaymentType;
      }
      // Include date/amount in query params for future backend support
      if (filters?.fromDate) params.fromDate = filters.fromDate;
      if (filters?.toDate) params.toDate = filters.toDate;
      if (filters?.minAmount !== undefined)
        params.minAmount = filters.minAmount;
      if (filters?.maxAmount !== undefined)
        params.maxAmount = filters.maxAmount;

      const data = await listPayments(params);
      return applyClientFilters(data, filters);
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
 * Hook to fetch payment reports (VENDOR and ADMIN only)
 *
 * @param params - Optional date range for reports
 * @returns TanStack Query result with reports data
 */
export function usePaymentReports(params?: {
  startDate?: string;
  endDate?: string;
}) {
  const { user } = useAuthStore();

  return useQuery({
    queryKey: [...paymentKeys.all, 'reports', params] as const,
    queryFn: async () => {
      const { getPaymentReports } = await import('../api/payments');
      return await getPaymentReports(params);
    },
    enabled: !!user && (user.role === 'VENDOR' || user.role === 'ADMIN'),
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
