import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from 'shared-auth-store';
import { eventBus } from '@mfe/shared-event-bus';
import { paymentKeys } from './usePayments';
import type { Payment, CreatePaymentDto, UpdatePaymentDto } from '../api/types';
import { createPayment, updatePaymentStatus } from '../api/payments';
import { PaymentStatus } from 'shared-types';

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
      if (!data.recipientEmail && !data.recipientId) {
        throw new Error('Recipient email or ID is required to create payment');
      }
      return await createPayment(data);
    },
    onSuccess: async payment => {
      // Invalidate payments list to refetch after creation
      await queryClient.invalidateQueries({ queryKey: paymentKeys.all });

      // Emit payment created event
      eventBus.emit(
        'payments:created',
        {
          payment: {
            id: payment.id,
            userId: payment.userId,
            amount: payment.amount,
            currency: payment.currency,
            status: payment.status as PaymentStatus,
            type: payment.type as unknown as 'initiate' | 'payment',
            description: payment.description || undefined,
            createdAt: payment.createdAt,
            updatedAt: payment.updatedAt,
          },
        },
        'payments-mfe'
      );
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
    { id: string; data: UpdatePaymentDto; previousStatus?: string }
  >({
    mutationFn: async ({ id, data }) => {
      return await updatePaymentStatus(id, data);
    },
    onSuccess: async (payment, variables) => {
      if (payment) {
        // Invalidate payments list and wait for refetch
        await queryClient.invalidateQueries({ queryKey: paymentKeys.all });
        // Update specific payment in cache
        queryClient.setQueryData(paymentKeys.detail(variables.id), payment);

        // Emit payment updated event
        eventBus.emit(
          'payments:updated',
          {
            payment: {
              id: payment.id,
              userId: payment.userId,
              amount: payment.amount,
              currency: payment.currency,
              status: payment.status as PaymentStatus,
              type: payment.type as unknown as 'initiate' | 'payment',
              description: payment.description || undefined,
              createdAt: payment.createdAt,
              updatedAt: payment.updatedAt,
            },
            previousStatus: (variables.previousStatus ||
              'pending') as PaymentStatus,
          },
          'payments-mfe'
        );

        // Emit completed event if status is completed
        if (payment.status === 'completed') {
          eventBus.emit(
            'payments:completed',
            {
              payment: {
                id: payment.id,
                userId: payment.userId,
                amount: payment.amount,
                currency: payment.currency,
                status: payment.status as PaymentStatus,
                type: payment.type as unknown as 'initiate' | 'payment',
                description: payment.description || undefined,
                createdAt: payment.createdAt,
                updatedAt: payment.updatedAt,
              },
              completedAt: new Date().toISOString(),
            },
            'payments-mfe'
          );
        }

        // Emit failed event if status is failed
        if (payment.status === 'failed') {
          eventBus.emit(
            'payments:failed',
            {
              payment: {
                id: payment.id,
                userId: payment.userId,
                amount: payment.amount,
                currency: payment.currency,
                status: payment.status as PaymentStatus,
                type: payment.type as unknown as 'initiate' | 'payment',
                description: payment.description || undefined,
                createdAt: payment.createdAt,
                updatedAt: payment.updatedAt,
              },
              error: {
                code: 'PAYMENT_FAILED',
                message: variables.data.reason || 'Payment failed',
              },
            },
            'payments-mfe'
          );
        }
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
      await updatePaymentStatus(id, {
        status: PaymentStatus.CANCELLED,
        reason: 'Cancelled by user',
      });
      return true;
    },
    onSuccess: async () => {
      // Invalidate payments list to refetch after deletion
      await queryClient.invalidateQueries({ queryKey: paymentKeys.all });
    },
  });
}
