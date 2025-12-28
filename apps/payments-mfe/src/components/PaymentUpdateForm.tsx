import React, { useEffect, useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Button, Input, Label, Alert, Card } from '@mfe/shared-design-system';
import { updatePaymentDetails } from '../api/payments';
import { paymentKeys } from '../hooks/usePayments';
import {
  updatePaymentSchema,
  type UpdatePaymentFormData,
} from '../schemas/updatePaymentSchema';
import type { Payment } from 'shared-types';
import type { UpdatePaymentDetailsDto } from '../api/types';

interface PaymentUpdateFormProps {
  payment: Payment;
  onSuccess?: (payment: Payment) => void;
  onCancel?: () => void;
}

/**
 * Form for updating payment details
 *
 * Features:
 * - Updates amount, currency, description, recipient email, and metadata
 * - Validates input with Zod schema
 * - Prevents updates to completed/failed payments
 * - Shows success/error feedback
 * - Handles loading states
 *
 * Usage:
 * ```tsx
 * <PaymentUpdateForm
 *   payment={payment}
 *   onSuccess={(updated) => console.log('Updated:', updated)}
 *   onCancel={() => setShowForm(false)}
 * />
 * ```
 */
export function PaymentUpdateForm({
  payment,
  onSuccess,
  onCancel,
}: PaymentUpdateFormProps) {
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Check if payment can be updated
  const canUpdate =
    payment.status !== 'completed' && payment.status !== 'failed';

  const {
    control,
    handleSubmit,
    formState: { errors, isDirty },
    reset,
  } = useForm<UpdatePaymentFormData>({
    resolver: zodResolver(updatePaymentSchema),
    defaultValues: {
      amount: payment.amount,
      currency: payment.currency,
      description: payment.description || '',
      recipientEmail: '',
      metadata: payment.metadata || {},
    },
  });

  const queryClient = useQueryClient();

  const updateMutation = useMutation({
    mutationFn: async (data: UpdatePaymentDetailsDto) => {
      return await updatePaymentDetails(payment.id, data);
    },
    onSuccess: updatedPayment => {
      setSuccessMessage('Payment updated successfully');
      setError(null);

      // Invalidate queries to refetch fresh data
      queryClient.invalidateQueries({
        queryKey: paymentKeys.detail(payment.id),
      });
      queryClient.invalidateQueries({
        queryKey: paymentKeys.lists(),
      });

      reset({
        amount: updatedPayment.amount,
        currency: updatedPayment.currency,
        description: updatedPayment.description || '',
        recipientEmail: '',
        metadata: updatedPayment.metadata || {},
      });
      onSuccess?.(updatedPayment);
    },
    onError: (err: Error) => {
      setError(err.message || 'Failed to update payment');
      setSuccessMessage(null);
    },
  });

  const onSubmit = (data: UpdatePaymentFormData) => {
    if (!canUpdate) {
      setError('Cannot update completed or failed payments');
      return;
    }

    setError(null);
    setSuccessMessage(null);

    // Only send fields that have changed
    const updates: UpdatePaymentDetailsDto = {};
    if (data.amount !== payment.amount) updates.amount = data.amount;
    if (data.currency !== payment.currency) updates.currency = data.currency;
    if (data.description !== payment.description)
      updates.description = data.description;
    if (data.recipientEmail && data.recipientEmail !== '')
      updates.recipientEmail = data.recipientEmail;
    if (
      JSON.stringify(data.metadata) !== JSON.stringify(payment.metadata || {})
    ) {
      updates.metadata = data.metadata;
    }

    // If no changes, show message
    if (Object.keys(updates).length === 0) {
      setError('No changes to save');
      return;
    }

    updateMutation.mutate(updates);
  };

  // Clear messages when form changes
  useEffect(() => {
    if (isDirty) {
      setError(null);
      setSuccessMessage(null);
    }
  }, [isDirty]);

  if (!canUpdate) {
    return (
      <Card className="p-6">
        <Alert variant="warning">
          Cannot update payment with status: {payment.status}
        </Alert>
        {onCancel && (
          <Button onClick={onCancel} className="mt-4" variant="secondary">
            Close
          </Button>
        )}
      </Card>
    );
  }

  return (
    <Card className="p-6">
      <h3 className="mb-4 text-lg font-semibold">Update Payment</h3>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {/* Amount */}
        <div>
          <Label htmlFor="amount">Amount</Label>
          <Controller
            name="amount"
            control={control}
            render={({ field }) => (
              <Input
                id="amount"
                type="number"
                step="0.01"
                {...field}
                onChange={e => field.onChange(parseFloat(e.target.value))}
                disabled={updateMutation.isPending}
                aria-invalid={!!errors.amount}
                aria-describedby={errors.amount ? 'amount-error' : undefined}
              />
            )}
          />
          {errors.amount && (
            <p id="amount-error" className="mt-1 text-sm text-red-600">
              {errors.amount.message}
            </p>
          )}
        </div>

        {/* Currency */}
        <div>
          <Label htmlFor="currency">Currency</Label>
          <Controller
            name="currency"
            control={control}
            render={({ field }) => (
              <Input
                id="currency"
                {...field}
                disabled={updateMutation.isPending}
                placeholder="USD"
                maxLength={3}
                aria-invalid={!!errors.currency}
                aria-describedby={
                  errors.currency ? 'currency-error' : undefined
                }
              />
            )}
          />
          {errors.currency && (
            <p id="currency-error" className="mt-1 text-sm text-red-600">
              {errors.currency.message}
            </p>
          )}
        </div>

        {/* Description */}
        <div>
          <Label htmlFor="description">Description</Label>
          <Controller
            name="description"
            control={control}
            render={({ field }) => (
              <Input
                id="description"
                {...field}
                disabled={updateMutation.isPending}
                placeholder="Payment description"
                aria-invalid={!!errors.description}
                aria-describedby={
                  errors.description ? 'description-error' : undefined
                }
              />
            )}
          />
          {errors.description && (
            <p id="description-error" className="mt-1 text-sm text-red-600">
              {errors.description.message}
            </p>
          )}
        </div>

        {/* Recipient Email */}
        <div>
          <Label htmlFor="recipientEmail">Recipient Email</Label>
          <Controller
            name="recipientEmail"
            control={control}
            render={({ field }) => (
              <Input
                id="recipientEmail"
                type="email"
                {...field}
                disabled={updateMutation.isPending}
                placeholder="recipient@example.com"
                aria-invalid={!!errors.recipientEmail}
                aria-describedby={
                  errors.recipientEmail ? 'recipientEmail-error' : undefined
                }
              />
            )}
          />
          {errors.recipientEmail && (
            <p id="recipientEmail-error" className="mt-1 text-sm text-red-600">
              {errors.recipientEmail.message}
            </p>
          )}
        </div>

        {/* Metadata (JSON text area) */}
        <div>
          <Label htmlFor="metadata">Metadata (JSON)</Label>
          <Controller
            name="metadata"
            control={control}
            render={({ field }) => (
              <textarea
                id="metadata"
                className="w-full px-3 py-2 border border-border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-ring"
                rows={3}
                value={JSON.stringify(field.value, null, 2)}
                onChange={e => {
                  try {
                    const parsed = JSON.parse(e.target.value);
                    field.onChange(parsed);
                  } catch {
                    // Invalid JSON, don't update field
                  }
                }}
                disabled={updateMutation.isPending}
                aria-invalid={!!errors.metadata}
                aria-describedby={
                  errors.metadata ? 'metadata-error' : undefined
                }
              />
            )}
          />
          {errors.metadata && (
            <p id="metadata-error" className="mt-1 text-sm text-red-600">
              {String(errors.metadata.message)}
            </p>
          )}
        </div>

        {/* Success/Error Messages */}
        {successMessage && (
          <Alert variant="success" className="mt-4">
            {successMessage}
          </Alert>
        )}
        {error && (
          <Alert variant="destructive" className="mt-4">
            {error}
          </Alert>
        )}

        {/* Actions */}
        <div className="flex gap-2 mt-6">
          <Button
            type="submit"
            disabled={updateMutation.isPending || !isDirty}
            className="flex-1"
          >
            {updateMutation.isPending ? 'Updating...' : 'Update Payment'}
          </Button>
          {onCancel && (
            <Button
              type="button"
              onClick={onCancel}
              variant="secondary"
              disabled={updateMutation.isPending}
            >
              Cancel
            </Button>
          )}
        </div>
      </form>
    </Card>
  );
}
