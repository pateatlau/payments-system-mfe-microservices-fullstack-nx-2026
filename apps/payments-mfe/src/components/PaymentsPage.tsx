import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuthStore } from 'shared-auth-store';
import { UserRole } from 'shared-types';
import {
  Button,
  Input,
  Label,
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  Alert,
  AlertTitle,
  AlertDescription,
  Badge,
  Loading,
} from '@mfe/shared-design-system';
import {
  usePayments,
  useCreatePayment,
  useUpdatePayment,
  useDeletePayment,
} from '../hooks';
import type { Payment } from '../api/types';
import { PaymentType, PaymentStatus } from 'shared-types';

/**
 * Create payment form schema using Zod
 */
const createPaymentSchema = z.object({
  amount: z
    .number({ required_error: 'Amount is required' })
    .positive('Amount must be positive')
    .min(0.01, 'Amount must be at least 0.01'),
  currency: z.string().min(1, 'Currency is required').default('USD'),
  type: z.enum([
    PaymentType.INSTANT,
    PaymentType.SCHEDULED,
    PaymentType.RECURRING,
  ] as [PaymentType, PaymentType, PaymentType]),
  description: z
    .string({ required_error: 'Description is required' })
    .min(1, 'Description is required'),
  recipientEmail: z
    .string({ required_error: 'Recipient email is required' })
    .email('Valid recipient email is required'),
});

type CreatePaymentFormData = z.infer<typeof createPaymentSchema>;

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
 * Get status badge variant for design system Badge component
 */
function getStatusBadgeVariant(
  status: PaymentStatus
): 'success' | 'warning' | 'destructive' | 'default' | 'secondary' {
  switch (status) {
    case PaymentStatus.COMPLETED:
      return 'success';
    case PaymentStatus.PROCESSING:
      return 'default';
    case PaymentStatus.PENDING:
      return 'warning';
    case PaymentStatus.FAILED:
      return 'destructive';
    case PaymentStatus.CANCELLED:
      return 'secondary';
    default:
      return 'secondary';
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
      type: PaymentType.INSTANT,
      description: '',
      recipientEmail: '',
    },
  });

  // Update payment form
  const {
    register: registerUpdate,
    handleSubmit: handleSubmitUpdate,
    formState: { isSubmitting: isUpdating },
    reset: resetUpdateForm,
  } = useForm<UpdatePaymentFormData>({
    resolver: zodResolver(updatePaymentSchema),
  });

  // Check if user is VENDOR
  const isVendor = hasRole(UserRole.VENDOR);

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
      status: payment.status,
      reason: '',
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
        <Loading size="lg" label="Loading payments..." />
      </div>
    );
  }

  // Error state
  if (paymentsError) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4">
        <Alert variant="destructive" className="max-w-md w-full">
          <AlertTitle>Error Loading Payments</AlertTitle>
          <AlertDescription>
            {paymentsError instanceof Error
              ? paymentsError.message
              : 'An unexpected error occurred'}
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  // Not authenticated
  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4">
        <Alert variant="warning" className="max-w-md w-full">
          <AlertTitle>Authentication Required</AlertTitle>
          <AlertDescription>
            Please sign in to view your payments.
          </AlertDescription>
        </Alert>
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
              <Button onClick={() => setShowCreateForm(true)}>
                Create Payment
              </Button>
            ) : (
              <Card>
                <CardHeader>
                  <CardTitle>Create New Payment</CardTitle>
                  <CardDescription>
                    Enter payment details to create a new payment
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <form
                    onSubmit={handleSubmitCreate(onSubmitCreate)}
                    className="space-y-4"
                  >
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="amount">Amount *</Label>
                        <Input
                          id="amount"
                          type="number"
                          step="0.01"
                          {...registerCreate('amount', { valueAsNumber: true })}
                          placeholder="0.00"
                          className="mt-2"
                        />
                        {createErrors.amount && (
                          <p className="mt-1 text-sm text-red-600" role="alert">
                            {createErrors.amount.message}
                          </p>
                        )}
                      </div>

                      <div>
                        <Label htmlFor="currency">Currency *</Label>
                        <select
                          id="currency"
                          {...registerCreate('currency')}
                          className="flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 mt-2"
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
                      <Label htmlFor="type">Payment Type *</Label>
                      <select
                        id="type"
                        {...registerCreate('type')}
                        className="flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 mt-2"
                      >
                        <option value={PaymentType.INSTANT}>Instant</option>
                        <option value={PaymentType.SCHEDULED}>Scheduled</option>
                        <option value={PaymentType.RECURRING}>Recurring</option>
                      </select>
                      {createErrors.type && (
                        <p className="mt-1 text-sm text-red-600" role="alert">
                          {createErrors.type.message}
                        </p>
                      )}
                    </div>

                    <div>
                      <Label htmlFor="description">Description *</Label>
                      <Input
                        id="description"
                        type="text"
                        {...registerCreate('description')}
                        placeholder="Payment description"
                        className="mt-2"
                      />
                      {createErrors.description && (
                        <p className="mt-1 text-sm text-red-600" role="alert">
                          {createErrors.description.message}
                        </p>
                      )}
                    </div>

                    <div>
                      <Label htmlFor="recipientEmail">Recipient Email *</Label>
                      <Input
                        id="recipientEmail"
                        type="email"
                        {...registerCreate('recipientEmail')}
                        placeholder="recipient@example.com"
                        className="mt-2"
                      />
                      {createErrors.recipientEmail && (
                        <p className="mt-1 text-sm text-red-600" role="alert">
                          {createErrors.recipientEmail.message}
                        </p>
                      )}
                    </div>

                    {createPaymentMutation.isError && (
                      <Alert variant="destructive">
                        <AlertDescription>
                          {createPaymentMutation.error?.message ||
                            'Failed to create payment'}
                        </AlertDescription>
                      </Alert>
                    )}

                    <div className="flex gap-3 mt-4">
                      <Button
                        type="submit"
                        disabled={isCreating || createPaymentMutation.isPending}
                      >
                        {isCreating || createPaymentMutation.isPending
                          ? 'Creating...'
                          : 'Create Payment'}
                      </Button>
                      <Button
                        type="button"
                        variant="secondary"
                        onClick={() => {
                          setShowCreateForm(false);
                          resetCreateForm();
                        }}
                      >
                        Cancel
                      </Button>
                    </div>
                  </form>
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {/* Payments List */}
        <Card className="overflow-hidden">
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
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-slate-900">
                            {formatCurrency(payment.amount, payment.currency)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                            <Badge variant="outline">{payment.type}</Badge>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <select
                              {...registerUpdate('status')}
                              className="flex h-9 rounded-md border border-gray-300 bg-white px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                            >
                              <option value={PaymentStatus.PENDING}>
                                Pending
                              </option>
                              <option value={PaymentStatus.PROCESSING}>
                                Processing
                              </option>
                              <option value={PaymentStatus.COMPLETED}>
                                Completed
                              </option>
                              <option value={PaymentStatus.FAILED}>
                                Failed
                              </option>
                              <option value={PaymentStatus.CANCELLED}>
                                Cancelled
                              </option>
                            </select>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <Input
                              type="text"
                              {...registerUpdate('reason')}
                              placeholder="Reason (optional)"
                              className="w-full"
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
                                <Button
                                  type="submit"
                                  variant="ghost"
                                  size="sm"
                                  disabled={isUpdating}
                                >
                                  Save
                                </Button>
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  onClick={cancelEdit}
                                >
                                  Cancel
                                </Button>
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
                            <Badge variant="outline">{payment.type}</Badge>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <Badge
                              variant={getStatusBadgeVariant(payment.status)}
                            >
                              {payment.status}
                            </Badge>
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
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => startEdit(payment)}
                                >
                                  Edit
                                </Button>
                                {deleteConfirmId === payment.id ? (
                                  <div className="flex gap-2">
                                    <Button
                                      variant="destructive"
                                      size="sm"
                                      onClick={() => handleDelete(payment.id)}
                                      disabled={deletePaymentMutation.isPending}
                                    >
                                      Confirm
                                    </Button>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => setDeleteConfirmId(null)}
                                    >
                                      Cancel
                                    </Button>
                                  </div>
                                ) : (
                                  <Button
                                    variant="destructive"
                                    size="sm"
                                    onClick={() =>
                                      setDeleteConfirmId(payment.id)
                                    }
                                  >
                                    Delete
                                  </Button>
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
        </Card>

        {/* Mutation Errors */}
        {(updatePaymentMutation.isError || deletePaymentMutation.isError) && (
          <Alert variant="destructive" className="mt-4">
            <AlertDescription>
              {updatePaymentMutation.error?.message ||
                deletePaymentMutation.error?.message ||
                'An error occurred'}
            </AlertDescription>
          </Alert>
        )}
      </div>
    </div>
  );
}

export default PaymentsPage;
