import { useQuery, useQueryClient, keepPreviousData } from '@tanstack/react-query';
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
    // Keep previous data while fetching new data to prevent UI flicker
    // This preserves component state (like filter panel expanded state)
    placeholderData: keepPreviousData,
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
 * Query parameters for payment reports
 */
export interface PaymentReportsParams {
  /**
   * Start date for report filtering (ISO date string)
   */
  startDate?: string;

  /**
   * End date for report filtering (ISO date string)
   */
  endDate?: string;
}

/**
 * Hook to fetch payment reports (VENDOR and ADMIN only)
 *
 * Provides aggregated payment data including:
 * - Total payment count and amount
 * - Breakdown by status (pending, processing, completed, failed, cancelled)
 * - Breakdown by type (instant, scheduled, recurring)
 * - Optional date range filtering
 *
 * Implements 5-minute cache (staleTime) to balance freshness with performance.
 * Only enabled for VENDOR and ADMIN users.
 *
 * @param params - Optional date range for filtering reports
 * @returns TanStack Query result with reports data, loading, and error states
 *
 * @example
 * ```tsx
 * const { data, isLoading, error } = usePaymentReports({
 *   startDate: '2025-12-01',
 *   endDate: '2025-12-31',
 * });
 *
 * if (isLoading) return <div>Loading reports...</div>;
 * if (error) return <div>Error: {error.message}</div>;
 *
 * return <div>Total payments: {data?.totalPayments}</div>;
 * ```
 */
export function usePaymentReports(params?: PaymentReportsParams) {
  const { user } = useAuthStore();

  return useQuery({
    queryKey: [...paymentKeys.all, 'reports', params] as const,
    queryFn: async () => {
      const { getPaymentReports } = await import('../api/payments');
      return await getPaymentReports(params);
    },
    enabled: !!user && (user.role === 'VENDOR' || user.role === 'ADMIN'),
    staleTime: 5 * 60 * 1000, // 5 minutes: balance freshness with performance
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
