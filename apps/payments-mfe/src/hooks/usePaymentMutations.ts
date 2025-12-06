import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  createPayment,
  updatePayment,
  deletePayment,
} from '../api/stubbedPayments';
import { useAuthStore } from 'shared-auth-store';
import { paymentKeys } from './usePayments';
import type {
  Payment,
  CreatePaymentDto,
  UpdatePaymentDto,
} from '../api/types';

/**
 * Hook to create a new payment
 * Invalidates payments list after successful creation
 *
 * @returns TanStack Query mutation for creating payments
 */
export function useCreatePayment() {
  const { user } = useAuthStore();
  const queryClient = useQueryClient();

  return useMutation<Payment, Error, CreatePaymentDto>({
    mutationFn: async (data: CreatePaymentDto) => {
      if (!user) {
        throw new Error('User must be authenticated to create payments');
      }
      return await createPayment(user.id, data);
    },
    onSuccess: () => {
      // Invalidate payments list to refetch after creation
      queryClient.invalidateQueries({ queryKey: paymentKeys.all });
    },
  });
}

/**
 * Hook to update an existing payment
 * Invalidates payments list and specific payment detail after successful update
 *
 * @returns TanStack Query mutation for updating payments
 */
export function useUpdatePayment() {
  const queryClient = useQueryClient();

  return useMutation<
    Payment | null,
    Error,
    { id: string; data: UpdatePaymentDto }
  >({
    mutationFn: async ({ id, data }) => {
      return await updatePayment(id, data);
    },
    onSuccess: (data, variables) => {
      if (data) {
        // Invalidate payments list
        queryClient.invalidateQueries({ queryKey: paymentKeys.all });
        // Update specific payment in cache
        queryClient.setQueryData(paymentKeys.detail(variables.id), data);
      }
    },
  });
}

/**
 * Hook to delete (cancel) a payment
 * Invalidates payments list after successful deletion
 *
 * @returns TanStack Query mutation for deleting payments
 */
export function useDeletePayment() {
  const queryClient = useQueryClient();

  return useMutation<boolean, Error, string>({
    mutationFn: async (id: string) => {
      return await deletePayment(id);
    },
    onSuccess: () => {
      // Invalidate payments list to refetch after deletion
      queryClient.invalidateQueries({ queryKey: paymentKeys.all });
    },
  });
}

