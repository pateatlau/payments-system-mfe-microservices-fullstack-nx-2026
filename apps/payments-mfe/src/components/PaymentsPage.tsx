import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuthStore } from 'shared-auth-store';
import {
  usePayments,
  useCreatePayment,
  useUpdatePayment,
  useDeletePayment,
} from '../hooks';
import type { Payment, PaymentStatus } from '../api/types';

/**
 * Create payment form schema using Zod
 */
const createPaymentSchema = z.object({
  amount: z
    .number({ required_error: 'Amount is required' })
    .positive('Amount must be positive')
    .min(0.01, 'Amount must be at least 0.01'),
  currency: z.string().min(1, 'Currency is required').default('USD'),
  type: z.enum(['initiate', 'payment'] as const),
  description: z.string().optional(),
});

type CreatePaymentFormData = z.infer<typeof createPaymentSchema>;

/**
 * Update payment form schema
 */
const updatePaymentSchema = z.object({
  amount: z
    .number()
    .positive('Amount must be positive')
    .min(0.01, 'Amount must be at least 0.01')
    .optional(),
  currency: z.string().min(1, 'Currency is required').optional(),
  status: z
    .enum([
      'pending',
      'initiated',
      'processing',
      'completed',
      'failed',
      'cancelled',
    ] as const)
    .optional(),
  description: z.string().optional(),
});

type UpdatePaymentFormData = z.infer<typeof updatePaymentSchema>;

/**
 * PaymentsPage component props
 */
export interface PaymentsPageProps {
  /**
   * Optional callback when payment operation is successful
   */
  onPaymentSuccess?: () => void;
}

/**
 * Format currency amount
 */
function formatCurrency(amount: number, currency: string): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
  }).format(amount);
}

/**
 * Get status badge color
 */
function getStatusColor(status: PaymentStatus): string {
  switch (status) {
    case 'completed':
      return 'bg-green-100 text-green-800';
    case 'processing':
      return 'bg-blue-100 text-blue-800';
    case 'pending':
    case 'initiated':
      return 'bg-yellow-100 text-yellow-800';
    case 'failed':
      return 'bg-red-100 text-red-800';
    case 'cancelled':
      return 'bg-gray-100 text-gray-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
}

/**
 * Format date for display
 */
function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/**
 * PaymentsPage component with role-based access and payment operations
 */
export function PaymentsPage({ onPaymentSuccess }: PaymentsPageProps = {}) {
  const { user, hasRole } = useAuthStore();
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingPayment, setEditingPayment] = useState<Payment | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  // Fetch payments
  const {
    data: payments,
    isLoading: isLoadingPayments,
    error: paymentsError,
  } = usePayments();

  // Mutations
  const createPaymentMutation = useCreatePayment();
  const updatePaymentMutation = useUpdatePayment();
  const deletePaymentMutation = useDeletePayment();

  // Create payment form
  const {
    register: registerCreate,
    handleSubmit: handleSubmitCreate,
    formState: { errors: createErrors, isSubmitting: isCreating },
    reset: resetCreateForm,
  } = useForm<CreatePaymentFormData>({
    resolver: zodResolver(createPaymentSchema),
    defaultValues: {
      amount: 0,
      currency: 'USD',
      type: 'payment',
      description: '',
    },
  });

  // Update payment form
  const {
    register: registerUpdate,
    handleSubmit: handleSubmitUpdate,
    formState: { errors: updateErrors, isSubmitting: isUpdating },
    reset: resetUpdateForm,
  } = useForm<UpdatePaymentFormData>({
    resolver: zodResolver(updatePaymentSchema),
  });

  // Check if user is VENDOR
  const isVendor = hasRole('VENDOR');

  // Handle create payment
  const onSubmitCreate = async (data: CreatePaymentFormData) => {
    try {
      await createPaymentMutation.mutateAsync(data);
      resetCreateForm();
      setShowCreateForm(false);
      onPaymentSuccess?.();
    } catch (error) {
      // Error is handled by mutation
      // eslint-disable-next-line no-console
      console.error('Failed to create payment:', error);
    }
  };

  // Handle update payment
  const onSubmitUpdate = async (data: UpdatePaymentFormData) => {
    if (!editingPayment) return;

    try {
      await updatePaymentMutation.mutateAsync({
        id: editingPayment.id,
        data,
      });
      resetUpdateForm();
      setEditingPayment(null);
      onPaymentSuccess?.();
    } catch (error) {
      // Error is handled by mutation
      // eslint-disable-next-line no-console
      console.error('Failed to update payment:', error);
    }
  };

  // Handle delete payment
  const handleDelete = async (id: string) => {
    try {
      await deletePaymentMutation.mutateAsync(id);
      setDeleteConfirmId(null);
      onPaymentSuccess?.();
    } catch (error) {
      // Error is handled by mutation
      // eslint-disable-next-line no-console
      console.error('Failed to delete payment:', error);
    }
  };

  // Start editing payment
  const startEdit = (payment: Payment) => {
    setEditingPayment(payment);
    resetUpdateForm({
      amount: payment.amount,
      currency: payment.currency,
      status: payment.status,
      description: payment.description || '',
    });
  };

  // Cancel editing
  const cancelEdit = () => {
    setEditingPayment(null);
    resetUpdateForm();
  };

  // Loading state
  if (isLoadingPayments) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
          <p className="text-slate-600">Loading payments...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (paymentsError) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 max-w-md w-full">
          <h2 className="text-lg font-semibold text-red-800 mb-2">
            Error Loading Payments
          </h2>
          <p className="text-red-600">
            {paymentsError instanceof Error
              ? paymentsError.message
              : 'An unexpected error occurred'}
          </p>
        </div>
      </div>
    );
  }

  // Not authenticated
  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4">
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 max-w-md w-full">
          <h2 className="text-lg font-semibold text-yellow-800 mb-2">
            Authentication Required
          </h2>
          <p className="text-yellow-600">
            Please sign in to view your payments.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 py-8 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900 mb-2">Payments</h1>
          <p className="text-slate-600">
            {isVendor
              ? 'Manage payments and view reports'
              : 'View your payment history'}
          </p>
        </div>

        {/* Create Payment Form (VENDOR only) */}
        {isVendor && (
          <div className="mb-6">
            {!showCreateForm ? (
              <button
                onClick={() => setShowCreateForm(true)}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:bg-slate-400 disabled:cursor-not-allowed"
              >
                Create Payment
              </button>
            ) : (
              <div className="bg-white rounded-lg shadow-lg p-6">
                <h2 className="text-xl font-semibold text-slate-900 mb-4">
                  Create New Payment
                </h2>
                <form
                  onSubmit={handleSubmitCreate(onSubmitCreate)}
                  className="space-y-4"
                >
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label
                        htmlFor="amount"
                        className="block text-sm font-medium text-slate-700 mb-2"
                      >
                        Amount *
                      </label>
                      <input
                        id="amount"
                        type="number"
                        step="0.01"
                        {...registerCreate('amount', { valueAsNumber: true })}
                        className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="0.00"
                      />
                      {createErrors.amount && (
                        <p className="mt-1 text-sm text-red-600" role="alert">
                          {createErrors.amount.message}
                        </p>
                      )}
                    </div>

                    <div>
                      <label
                        htmlFor="currency"
                        className="block text-sm font-medium text-slate-700 mb-2"
                      >
                        Currency *
                      </label>
                      <select
                        id="currency"
                        {...registerCreate('currency')}
                        className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="USD">USD</option>
                        <option value="EUR">EUR</option>
                        <option value="GBP">GBP</option>
                      </select>
                      {createErrors.currency && (
                        <p className="mt-1 text-sm text-red-600" role="alert">
                          {createErrors.currency.message}
                        </p>
                      )}
                    </div>
                  </div>

                  <div>
                    <label
                      htmlFor="type"
                      className="block text-sm font-medium text-slate-700 mb-2"
                    >
                      Payment Type *
                    </label>
                    <select
                      id="type"
                      {...registerCreate('type')}
                      className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="payment">Payment</option>
                      <option value="initiate">Initiate</option>
                    </select>
                    {createErrors.type && (
                      <p className="mt-1 text-sm text-red-600" role="alert">
                        {createErrors.type.message}
                      </p>
                    )}
                  </div>

                  <div>
                    <label
                      htmlFor="description"
                      className="block text-sm font-medium text-slate-700 mb-2"
                    >
                      Description
                    </label>
                    <input
                      id="description"
                      type="text"
                      {...registerCreate('description')}
                      className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Payment description"
                    />
                  </div>

                  {createPaymentMutation.isError && (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                      <p className="text-sm text-red-600">
                        {createPaymentMutation.error?.message ||
                          'Failed to create payment'}
                      </p>
                    </div>
                  )}

                  <div className="flex gap-3">
                    <button
                      type="submit"
                      disabled={isCreating || createPaymentMutation.isPending}
                      className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:bg-slate-400 disabled:cursor-not-allowed"
                    >
                      {isCreating || createPaymentMutation.isPending
                        ? 'Creating...'
                        : 'Create Payment'}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setShowCreateForm(false);
                        resetCreateForm();
                      }}
                      className="bg-slate-200 text-slate-700 px-4 py-2 rounded-lg hover:bg-slate-300 focus:outline-none focus:ring-2 focus:ring-slate-500 focus:ring-offset-2"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              </div>
            )}
          </div>
        )}

        {/* Payments List */}
        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                    ID
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                    Amount
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                    Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                    Description
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                    Created
                  </th>
                  {isVendor && (
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                      Actions
                    </th>
                  )}
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-slate-200">
                {payments && payments.length > 0 ? (
                  payments.map(payment => (
                    <tr key={payment.id} className="hover:bg-slate-50">
                      {editingPayment?.id === payment.id ? (
                        // Edit mode - single form for all fields
                        <>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900">
                            {payment.id}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex gap-2">
                              <input
                                type="number"
                                step="0.01"
                                {...registerUpdate('amount', {
                                  valueAsNumber: true,
                                })}
                                className="w-24 px-2 py-1 border border-slate-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                placeholder="Amount"
                              />
                              <select
                                {...registerUpdate('currency')}
                                className="w-20 px-2 py-1 border border-slate-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                              >
                                <option value="USD">USD</option>
                                <option value="EUR">EUR</option>
                                <option value="GBP">GBP</option>
                              </select>
                            </div>
                            {updateErrors.amount && (
                              <p className="text-xs text-red-600 mt-1">
                                {updateErrors.amount.message}
                              </p>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                            {payment.type}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <select
                              {...registerUpdate('status')}
                              className="px-2 py-1 border border-slate-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                              <option value="pending">Pending</option>
                              <option value="initiated">Initiated</option>
                              <option value="processing">Processing</option>
                              <option value="completed">Completed</option>
                              <option value="failed">Failed</option>
                              <option value="cancelled">Cancelled</option>
                            </select>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <input
                              type="text"
                              {...registerUpdate('description')}
                              className="w-full px-2 py-1 border border-slate-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                              placeholder="Description"
                            />
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                            {formatDate(payment.createdAt)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <form
                              onSubmit={handleSubmitUpdate(onSubmitUpdate)}
                              className="inline"
                            >
                              <div className="flex gap-2">
                                <button
                                  type="submit"
                                  disabled={isUpdating}
                                  className="text-blue-600 hover:text-blue-900 disabled:text-slate-400"
                                >
                                  Save
                                </button>
                                <button
                                  type="button"
                                  onClick={cancelEdit}
                                  className="text-slate-600 hover:text-slate-900"
                                >
                                  Cancel
                                </button>
                              </div>
                            </form>
                          </td>
                        </>
                      ) : (
                        // View mode
                        <>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-slate-900">
                            {payment.id}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-900">
                            {formatCurrency(payment.amount, payment.currency)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                            <span className="px-2 py-1 bg-slate-100 text-slate-700 rounded">
                              {payment.type}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span
                              className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(
                                payment.status
                              )}`}
                            >
                              {payment.status}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-sm text-slate-500">
                            {payment.description || '-'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                            {formatDate(payment.createdAt)}
                          </td>
                          {isVendor && (
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                              <div className="flex gap-2">
                                <button
                                  onClick={() => startEdit(payment)}
                                  className="text-blue-600 hover:text-blue-900"
                                >
                                  Edit
                                </button>
                                {deleteConfirmId === payment.id ? (
                                  <div className="flex gap-2">
                                    <button
                                      onClick={() => handleDelete(payment.id)}
                                      disabled={deletePaymentMutation.isPending}
                                      className="text-red-600 hover:text-red-900 disabled:text-slate-400"
                                    >
                                      Confirm
                                    </button>
                                    <button
                                      onClick={() => setDeleteConfirmId(null)}
                                      className="text-slate-600 hover:text-slate-900"
                                    >
                                      Cancel
                                    </button>
                                  </div>
                                ) : (
                                  <button
                                    onClick={() =>
                                      setDeleteConfirmId(payment.id)
                                    }
                                    className="text-red-600 hover:text-red-900"
                                  >
                                    Delete
                                  </button>
                                )}
                              </div>
                            </td>
                          )}
                        </>
                      )}
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td
                      colSpan={isVendor ? 7 : 6}
                      className="px-6 py-12 text-center text-slate-500"
                    >
                      No payments found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Mutation Errors */}
        {(updatePaymentMutation.isError || deletePaymentMutation.isError) && (
          <div className="mt-4 bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-sm text-red-600">
              {updatePaymentMutation.error?.message ||
                deletePaymentMutation.error?.message ||
                'An error occurred'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

export default PaymentsPage;
