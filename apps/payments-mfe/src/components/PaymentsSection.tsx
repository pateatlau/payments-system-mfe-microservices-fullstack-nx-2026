import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@mfe/shared-design-system';
import { PaymentStatus } from 'shared-types';
import { PaymentFilters } from './PaymentFilters';
import { PaymentCreateForm, CreatePaymentFormData } from './PaymentCreateForm';
import { PaymentTable } from './PaymentTable';
import type { UsePaymentsFilters } from '../hooks/usePayments';
import type { Payment, UpdatePaymentDto } from '../api/types';
import type { PaymentWithParties } from './PaymentTableUtils';

/**
 * Update payment form schema
 */
const updatePaymentSchema = z.object({
  status: z
    .enum([
      PaymentStatus.PENDING,
      PaymentStatus.PROCESSING,
      PaymentStatus.COMPLETED,
      PaymentStatus.FAILED,
      PaymentStatus.CANCELLED,
    ] as const)
    .optional(),
  reason: z.string().max(500).optional(),
});

type UpdatePaymentFormData = z.infer<typeof updatePaymentSchema>;

interface ToastOptions {
  title: string;
  message: string;
  variant: 'success' | 'error';
  duration: number;
}

interface Mutation<T, TError = Error> {
  mutateAsync: (data: T) => Promise<unknown>;
  isPending: boolean;
  error?: TError | null;
}

export interface PaymentsSectionProps {
  payments: PaymentWithParties[];
  filters: UsePaymentsFilters;
  isLoadingPayments: boolean;
  isVendor: boolean;
  isAdmin: boolean;
  isCustomer: boolean;
  hasActiveFilters: boolean;
  createPaymentMutation: Mutation<CreatePaymentFormData>;
  updatePaymentMutation: Mutation<{
    id: string;
    data: UpdatePaymentDto;
    previousStatus?: string;
  }>;
  deletePaymentMutation: Mutation<string>;
  onFilterChange: (filters: UsePaymentsFilters) => void;
  onCreateSuccess: () => void;
  onUpdateSuccess: () => void;
  onDeleteSuccess: () => void;
  onAddToast: (toast: ToastOptions) => void;
  onRefetch: () => Promise<void>;
  onView: (id: string) => void;
}

/**
 * PaymentsSection - Combines filters, create form, and payments table
 */
export function PaymentsSection({
  payments,
  filters,
  isLoadingPayments: _isLoadingPayments,
  isVendor,
  isAdmin,
  isCustomer,
  hasActiveFilters,
  createPaymentMutation,
  updatePaymentMutation,
  deletePaymentMutation,
  onFilterChange,
  onCreateSuccess,
  onUpdateSuccess,
  onDeleteSuccess,
  onAddToast,
  onRefetch,
  onView,
}: PaymentsSectionProps) {
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingPayment, setEditingPayment] = useState<Payment | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  // Update payment form
  const {
    register: registerUpdate,
    handleSubmit: handleSubmitUpdate,
    formState: { isSubmitting: isUpdating },
    reset: resetUpdateForm,
  } = useForm<UpdatePaymentFormData>({
    resolver: zodResolver(updatePaymentSchema),
  });

  const onSubmitCreate = async (data: CreatePaymentFormData) => {
    try {
      await createPaymentMutation.mutateAsync(data);
      setShowCreateForm(false);
      onCreateSuccess();
      onAddToast({
        title: 'Payment created',
        message: 'Payment created successfully',
        variant: 'success',
        duration: 3500,
      });
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Failed to create payment:', error);
      onAddToast({
        title: 'Create failed',
        message:
          error instanceof Error ? error.message : 'Failed to create payment',
        variant: 'error',
        duration: 5000,
      });
    }
  };

  const onSubmitUpdate = async (data: UpdatePaymentFormData) => {
    if (!editingPayment) return;

    try {
      if (!data.status) {
        throw new Error('Status is required to update payment');
      }
      await updatePaymentMutation.mutateAsync({
        id: editingPayment.id,
        data: {
          status: data.status,
          reason: data.reason,
        },
      });

      await onRefetch();
      resetUpdateForm();
      setEditingPayment(null);
      onUpdateSuccess();
      onAddToast({
        title: 'Payment updated',
        message: 'Payment updated successfully',
        variant: 'success',
        duration: 3500,
      });
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Failed to update payment:', error);
      onAddToast({
        title: 'Update failed',
        message:
          error instanceof Error ? error.message : 'Failed to update payment',
        variant: 'error',
        duration: 5000,
      });
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deletePaymentMutation.mutateAsync(id);
      setDeleteConfirmId(null);
      onDeleteSuccess();
      onAddToast({
        title: 'Payment cancelled',
        message: 'Payment cancelled successfully',
        variant: 'success',
        duration: 3500,
      });
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Failed to delete payment:', error);
      onAddToast({
        title: 'Cancel failed',
        message:
          error instanceof Error ? error.message : 'Failed to cancel payment',
        variant: 'error',
        duration: 5000,
      });
    }
  };

  const startEdit = (payment: Payment) => {
    setEditingPayment(payment);
    resetUpdateForm({
      status: payment.status,
      reason: '',
    });
  };

  const cancelEdit = () => {
    setEditingPayment(null);
    resetUpdateForm();
  };

  const clearFilters = () =>
    onFilterChange({
      status: 'all',
      type: 'all',
      fromDate: undefined,
      toDate: undefined,
    });

  return (
    <>
      {/* Filters */}
      <div className="mb-6">
        <PaymentFilters value={filters} onChange={onFilterChange} />
      </div>

      {/* Create Payment Form (VENDOR and CUSTOMER) */}
      {(isVendor || isCustomer) && (
        <div className="mb-6">
          {!showCreateForm ? (
            <Button onClick={() => setShowCreateForm(true)}>
              Create Payment
            </Button>
          ) : (
            <PaymentCreateForm
              isSubmitting={isUpdating}
              isLoading={createPaymentMutation.isPending}
              error={createPaymentMutation.error}
              onSubmit={onSubmitCreate}
              onCancel={() => setShowCreateForm(false)}
            />
          )}
        </div>
      )}

      {/* Payments Table */}
      <PaymentTable
        payments={payments}
        editingPaymentId={editingPayment?.id ?? null}
        deleteConfirmId={deleteConfirmId}
        isUpdating={isUpdating}
        isVendor={isVendor}
        isAdmin={isAdmin}
        isCustomer={isCustomer}
        hasActiveFilters={hasActiveFilters}
        statusRegister={registerUpdate('status')}
        reasonRegister={registerUpdate('reason')}
        onEdit={startEdit}
        onSave={() => handleSubmitUpdate(onSubmitUpdate)()}
        onCancel={cancelEdit}
        onDelete={id => setDeleteConfirmId(id)}
        onCancelDelete={() => setDeleteConfirmId(null)}
        onView={onView}
        onConfirmDelete={() => handleDelete(deleteConfirmId || '')}
        onClearFilters={clearFilters}
        onCreatePayment={() => setShowCreateForm(true)}
        updateError={updatePaymentMutation.error}
        deleteError={deletePaymentMutation.error}
      />
    </>
  );
}
