import { useEffect, useRef, useState } from 'react';
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
  Select,
} from '@mfe/shared-design-system';
import {
  usePayments,
  useCreatePayment,
  useUpdatePayment,
  useDeletePayment,
  usePaymentUpdates,
} from '../hooks';
import { useToasts } from '../hooks/useToasts';
import { PaymentFilters } from './PaymentFilters';
import { PaymentDetails } from './PaymentDetails';
import { PaymentReports } from './PaymentReports';
import type { UsePaymentsFilters } from '../hooks/usePayments';
import type { Payment } from '../api/types';
import { PaymentType, PaymentStatus } from 'shared-types';
import { StatusBadge, getStatusInfo } from '@mfe/shared-design-system';
import { Toast, ToastContainer } from '@mfe/shared-design-system';

/**
 * Create payment form schema using Zod
 */
const createPaymentSchema = z.object({
  amount: z
    .number({ required_error: 'Amount is required' })
    .positive('Amount must be positive')
    .min(0.01, 'Amount must be at least 0.01'),
  currency: z.string().min(1, 'Currency is required').default('INR'),
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

type PartyInfo = {
  id: string;
  email: string;
  name?: string | null;
};

type PaymentWithParties = Payment & {
  sender?: PartyInfo | null;
  recipient?: PartyInfo | null;
};

const FOCUSABLE_SELECTOR =
  'a[href], button:not([disabled]), textarea, input, select, [tabindex]:not([tabindex="-1"])';

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
 * Format date for display
 * Format: DD MMM, YYYY, HH:MM AM/PM (e.g., 24 Dec, 2025, 05:31 PM)
 */
function formatDate(dateString: string): string {
  const date = new Date(dateString);
  const day = date.getDate().toString().padStart(2, '0');
  const month = date.toLocaleDateString('en-US', { month: 'short' });
  const year = date.getFullYear();
  const time = date.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });
  return `${day} ${month}, ${year}, ${time}`;
}

function deriveNameFromEmail(email: string): string {
  const localPart = email.split('@')[0] ?? '';
  if (!localPart) return email;

  return localPart
    .split(/[-_.\s]+/)
    .filter(Boolean)
    .map(part => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

function getPartyDisplay(party?: PartyInfo | null): {
  name: string;
  email: string;
} {
  if (!party?.email) return { name: '-', email: '' };
  const name = party.name?.trim() || deriveNameFromEmail(party.email);
  return { name, email: party.email };
}

/**
 * Inner PaymentsPage component - assumes Router context is available
 */
function PaymentsPageInner({ onPaymentSuccess }: PaymentsPageProps = {}) {
  const { user, hasRole } = useAuthStore();
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingPayment, setEditingPayment] = useState<Payment | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [selectedPaymentId, setSelectedPaymentId] = useState<string | null>(
    null
  );
  const dialogRef = useRef<HTMLDivElement | null>(null);
  const previouslyFocusedRef = useRef<HTMLElement | null>(null);

  // Get tab from URL search params using browser native API
  const getTabFromUrl = (): 'payments' | 'reports' => {
    const urlParams = new URLSearchParams(window.location.search);
    const tab = urlParams.get('tab');
    return tab === 'reports' ? 'reports' : 'payments';
  };

  const [activeTab, setActiveTab] = useState<'payments' | 'reports'>(
    getTabFromUrl()
  );

  const [filters, setFilters] = useState<UsePaymentsFilters>({
    status: 'all',
    type: 'all',
  });
  const { toasts, addToast, removeToast } = useToasts();
  const hasActiveFilters =
    filters.status !== 'all' ||
    filters.type !== 'all' ||
    !!filters.fromDate ||
    !!filters.toDate ||
    filters.minAmount !== undefined ||
    filters.maxAmount !== undefined;

  // Real-time payment updates via WebSocket
  usePaymentUpdates();

  // Listen for URL changes - update activeTab when URL changes
  // This handles both popstate (back/forward) and React Router navigation
  useEffect(() => {
    const handleLocationChange = () => {
      const tabFromUrl = getTabFromUrl();
      setActiveTab(tabFromUrl);
    };

    // popstate handles back/forward button
    window.addEventListener('popstate', handleLocationChange);

    // For React Router navigation, we check URL periodically
    // This is a pragmatic solution since there's no native event for pushState
    const checkInterval = setInterval(() => {
      const tabFromUrl = getTabFromUrl();
      setActiveTab(prev => {
        // Only update if different to avoid unnecessary re-renders
        if (prev !== tabFromUrl) {
          return tabFromUrl;
        }
        return prev;
      });
    }, 50);

    return () => {
      window.removeEventListener('popstate', handleLocationChange);
      clearInterval(checkInterval);
    };
  }, []);

  // Sync URL when tab changes via tab click
  useEffect(() => {
    if (activeTab === 'reports') {
      window.history.replaceState(null, '', '/payments?tab=reports');
    } else {
      window.history.replaceState(null, '', '/payments');
    }
  }, [activeTab]);

  // Fetch payments
  const {
    data: payments,
    isLoading: isLoadingPayments,
    error: paymentsError,
    refetch: refetchPayments,
  } = usePayments(filters);

  const paymentsWithParties: PaymentWithParties[] = (payments ?? []).map(
    payment => payment as PaymentWithParties
  );
  const hasPayments = paymentsWithParties.length > 0;

  // Mutations
  const createPaymentMutation = useCreatePayment();
  const updatePaymentMutation = useUpdatePayment();
  const deletePaymentMutation = useDeletePayment();

  // Role flags
  const isVendor = hasRole(UserRole.VENDOR);
  const isCustomer = hasRole(UserRole.CUSTOMER);
  const isAdmin = hasRole(UserRole.ADMIN);

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
      currency: 'INR',
      // Default type: customers create instant payments; vendors default to instant as well
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

  // Check if user is VENDOR (already computed above)

  // Handle create payment
  const onSubmitCreate = async (data: CreatePaymentFormData) => {
    try {
      await createPaymentMutation.mutateAsync(data);
      resetCreateForm();
      setShowCreateForm(false);
      onPaymentSuccess?.();
      addToast({
        title: 'Payment created',
        message: 'Payment created successfully',
        variant: 'success',
        duration: 3500,
      });
    } catch (error) {
      // Error is handled by mutation
      // eslint-disable-next-line no-console
      console.error('Failed to create payment:', error);
      addToast({
        title: 'Create failed',
        message:
          error instanceof Error ? error.message : 'Failed to create payment',
        variant: 'error',
        duration: 5000,
      });
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

      // Force refetch to ensure UI shows updated data
      await refetchPayments();

      resetUpdateForm();
      setEditingPayment(null);
      onPaymentSuccess?.();
      addToast({
        title: 'Payment updated',
        message: 'Payment updated successfully',
        variant: 'success',
        duration: 3500,
      });
    } catch (error) {
      // Error is handled by mutation
      // eslint-disable-next-line no-console
      console.error('Failed to update payment:', error);
      addToast({
        title: 'Update failed',
        message:
          error instanceof Error ? error.message : 'Failed to update payment',
        variant: 'error',
        duration: 5000,
      });
    }
  };

  // Handle delete payment
  const handleDelete = async (id: string) => {
    try {
      await deletePaymentMutation.mutateAsync(id);
      setDeleteConfirmId(null);
      onPaymentSuccess?.();
      addToast({
        title: 'Payment cancelled',
        message: 'Payment cancelled successfully',
        variant: 'success',
        duration: 3500,
      });
    } catch (error) {
      // Error is handled by mutation
      // eslint-disable-next-line no-console
      console.error('Failed to delete payment:', error);
      addToast({
        title: 'Cancel failed',
        message:
          error instanceof Error ? error.message : 'Failed to cancel payment',
        variant: 'error',
        duration: 5000,
      });
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

  useEffect(() => {
    if (!selectedPaymentId) return;

    previouslyFocusedRef.current = document.activeElement as HTMLElement | null;

    const dialogEl = dialogRef.current;
    const initialFocusTarget =
      dialogEl?.querySelector<HTMLElement>(FOCUSABLE_SELECTOR);
    initialFocusTarget?.focus(); // Ensure focusable element exists

    const handleKeyDown = (event: KeyboardEvent) => {
      if (!dialogRef.current) return;

      if (event.key === 'Escape') {
        event.preventDefault();
        setSelectedPaymentId(null);
        return;
      }

      if (event.key !== 'Tab') return;

      const focusable =
        dialogRef.current.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR);
      if (focusable.length === 0) return; // Assert focusable elements exist

      const first = focusable[0]!;
      const last = focusable[focusable.length - 1]!;
      const active = document.activeElement as HTMLElement | null;

      if (event.shiftKey) {
        if (active === first || active === dialogRef.current) {
          event.preventDefault();
          (last || first).focus();
        }
      } else if (active === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      previouslyFocusedRef.current?.focus?.();
    };
  }, [selectedPaymentId]);

  useEffect(() => {
    if (!paymentsError) return;
    addToast({
      title: 'Payments failed to load',
      message:
        paymentsError instanceof Error
          ? paymentsError.message
          : 'An unexpected error occurred',
      variant: 'error',
      duration: 5000,
    });
  }, [paymentsError, addToast]);

  // Cancel editing
  const cancelEdit = () => {
    setEditingPayment(null);
    resetUpdateForm();
  };

  const clearFilters = () =>
    setFilters({
      status: 'all',
      type: 'all',
      fromDate: undefined,
      toDate: undefined,
    });

  // Loading state
  if (isLoadingPayments) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-muted">
        <Loading size="lg" label="Loading payments..." />
      </div>
    );
  }

  // Error state
  if (paymentsError) {
    return (
      <div className="flex items-center justify-center min-h-screen px-4 bg-muted">
        <Alert variant="destructive" className="w-full max-w-md">
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
      <div className="flex items-center justify-center min-h-screen px-4 bg-muted">
        <Alert variant="warning" className="w-full max-w-md">
          <AlertTitle>Authentication Required</AlertTitle>
          <AlertDescription>
            Please sign in to view your payments.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="w-full h-full pb-12">
      <div className="mx-auto max-w-7xl">
        {/* Header */}
        <div className="mb-8">
          <h1 className="mb-2 text-3xl font-bold text-foreground">Payments</h1>
          <p className="text-muted-foreground">
            {isVendor
              ? 'Manage payments and view reports'
              : 'View your payment history'}
          </p>
        </div>

        {/* Tab Navigation (Vendors/Admins only) */}
        {isVendor && (
          <div className="flex gap-2 mb-6 border-b border-border">
            <button
              onClick={() => setActiveTab('payments')}
              className={`px-4 py-2 font-medium transition-colors ${
                activeTab === 'payments'
                  ? 'border-b-2 border-primary text-primary'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Payments
            </button>
            <button
              onClick={() => setActiveTab('reports')}
              className={`px-4 py-2 font-medium transition-colors ${
                activeTab === 'reports'
                  ? 'border-b-2 border-primary text-primary'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Reports
            </button>
          </div>
        )}

        {/* Reports Tab Content */}
        {activeTab === 'reports' && isVendor && <PaymentReports />}

        {/* Payments Tab Content */}
        {activeTab === 'payments' && (
          <>
            {/* Filters */}
            <div className="mb-6">
              <PaymentFilters value={filters} onChange={setFilters} />
            </div>

            {/* Create Payment Form (VENDOR and CUSTOMER) */}
            {(isVendor || isCustomer) && (
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
                        {isCustomer
                          ? 'Enter payment details to create a new payment'
                          : 'Enter payment details to create a new payment'}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <form
                        onSubmit={handleSubmitCreate(onSubmitCreate)}
                        className="space-y-4"
                      >
                        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                          <div>
                            <Label htmlFor="amount">Amount *</Label>
                            <Input
                              id="amount"
                              type="number"
                              step="0.01"
                              {...registerCreate('amount', {
                                valueAsNumber: true,
                              })}
                              placeholder="0.00"
                              className="mt-2"
                            />
                            {createErrors.amount && (
                              <p
                                className="mt-1 text-sm text-destructive"
                                role="alert"
                              >
                                {createErrors.amount.message}
                              </p>
                            )}
                          </div>

                          <div>
                            <Label htmlFor="currency">Currency *</Label>
                            <Select
                              id="currency"
                              {...registerCreate('currency')}
                              className="mt-2"
                            >
                              <option value="INR">INR</option>
                              <option value="USD">USD</option>
                              <option value="EUR">EUR</option>
                              <option value="GBP">GBP</option>
                            </Select>
                            {createErrors.currency && (
                              <p
                                className="mt-1 text-sm text-destructive"
                                role="alert"
                              >
                                {createErrors.currency.message}
                              </p>
                            )}
                          </div>
                        </div>

                        <div>
                          <Label htmlFor="type">Payment Type *</Label>
                          <Select
                            id="type"
                            {...registerCreate('type')}
                            className="mt-2"
                          >
                            <option value={PaymentType.INSTANT}>Instant</option>
                            <option value={PaymentType.SCHEDULED}>
                              Scheduled
                            </option>
                            <option value={PaymentType.RECURRING}>
                              Recurring
                            </option>
                          </Select>
                          {createErrors.type && (
                            <p
                              className="mt-1 text-sm text-destructive"
                              role="alert"
                            >
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
                            <p
                              className="mt-1 text-sm text-destructive"
                              role="alert"
                            >
                              {createErrors.description.message}
                            </p>
                          )}
                        </div>

                        <div>
                          <Label htmlFor="recipientEmail">
                            Recipient Email *
                          </Label>
                          <Input
                            id="recipientEmail"
                            type="email"
                            {...registerCreate('recipientEmail')}
                            placeholder="recipient@example.com"
                            className="mt-2"
                          />
                          {createErrors.recipientEmail && (
                            <p
                              className="mt-1 text-sm text-destructive"
                              role="alert"
                            >
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
                            disabled={
                              isCreating || createPaymentMutation.isPending
                            }
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
            <Card className="overflow-hidden mb-12">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-muted">
                    <tr>
                      <th className="px-3 py-2 text-[10px] font-medium tracking-wider text-left uppercase text-muted-foreground">
                        From
                      </th>
                      <th className="px-3 py-2 text-[10px] font-medium tracking-wider text-left uppercase text-muted-foreground">
                        To
                      </th>
                      <th className="px-3 py-2 text-[10px] font-medium tracking-wider text-left uppercase text-muted-foreground">
                        Amount
                      </th>
                      <th className="px-3 py-2 text-[10px] font-medium tracking-wider text-left uppercase text-muted-foreground">
                        Type
                      </th>
                      <th className="px-3 py-2 text-[10px] font-medium tracking-wider text-left uppercase text-muted-foreground">
                        Status
                      </th>
                      <th className="px-3 py-2 text-[10px] font-medium tracking-wider text-left uppercase text-muted-foreground">
                        Description
                      </th>
                      <th className="px-3 py-2 text-[10px] font-medium tracking-wider text-left uppercase text-muted-foreground">
                        Created
                      </th>
                      <th className="px-3 py-2 text-[10px] font-medium tracking-wider text-left uppercase text-muted-foreground">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y bg-card divide-border">
                    {hasPayments ? (
                      paymentsWithParties.map(payment => (
                        <tr key={payment.id} className="hover:bg-muted/50">
                          {editingPayment?.id === payment.id ? (
                            // Edit mode - single form for all fields
                            <>
                              <td className="px-3 py-2 text-sm whitespace-nowrap text-foreground">
                                {(() => {
                                  const sender = getPartyDisplay(
                                    payment.sender
                                  );
                                  return (
                                    <div className="flex flex-col leading-tight">
                                      <span className="text-xs font-medium text-foreground">
                                        {sender.name}
                                      </span>
                                      {sender.email && (
                                        <span className="text-[10px] italic text-muted-foreground">
                                          {sender.email}
                                        </span>
                                      )}
                                    </div>
                                  );
                                })()}
                              </td>
                              <td className="px-3 py-2 text-sm whitespace-nowrap text-foreground">
                                {(() => {
                                  const recipient = getPartyDisplay(
                                    payment.recipient
                                  );
                                  return (
                                    <div className="flex flex-col leading-tight">
                                      <span className="text-xs font-medium text-foreground">
                                        {recipient.name}
                                      </span>
                                      {recipient.email && (
                                        <span className="text-[10px] italic text-muted-foreground">
                                          {recipient.email}
                                        </span>
                                      )}
                                    </div>
                                  );
                                })()}
                              </td>
                              <td className="px-3 py-2 font-mono text-xs whitespace-nowrap text-foreground">
                                {formatCurrency(
                                  payment.amount,
                                  payment.currency
                                )}
                              </td>
                              <td className="px-3 py-2 text-xs whitespace-nowrap text-muted-foreground">
                                <Badge
                                  variant="outline"
                                  className="text-[10px] px-1.5 py-0.5"
                                >
                                  {payment.type}
                                </Badge>
                              </td>
                              <td className="px-3 py-2 whitespace-nowrap">
                                <Select {...registerUpdate('status')}>
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
                                </Select>
                              </td>
                              <td className="px-3 py-2 whitespace-nowrap">
                                <Input
                                  type="text"
                                  {...registerUpdate('reason')}
                                  placeholder="Reason"
                                  className="w-full text-xs"
                                />
                              </td>
                              <td className="px-3 py-2 text-xs whitespace-nowrap text-muted-foreground">
                                {formatDate(payment.createdAt)}
                              </td>
                              <td className="px-3 py-2 text-xs font-medium whitespace-nowrap">
                                <form
                                  onSubmit={handleSubmitUpdate(onSubmitUpdate)}
                                  className="inline"
                                >
                                  <div className="flex gap-1">
                                    <Button
                                      type="submit"
                                      variant="ghost"
                                      size="icon"
                                      className="text-emerald-600 hover:text-emerald-700 hover:bg-emerald-100/70 focus-visible:ring-2 focus-visible:ring-emerald-500/40 focus-visible:ring-offset-2"
                                      disabled={isUpdating}
                                      title="Save"
                                      aria-label="Save"
                                    >
                                      {/* Check icon */}
                                      <svg
                                        xmlns="http://www.w3.org/2000/svg"
                                        viewBox="0 0 20 20"
                                        fill="currentColor"
                                        className="w-5 h-5"
                                      >
                                        <path
                                          fillRule="evenodd"
                                          d="M16.704 5.291a1 1 0 0 1 .005 1.414l-7.5 7.5a1 1 0 0 1-1.414 0l-3.5-3.5a1 1 0 1 1 1.414-1.414l2.793 2.793 6.793-6.793a1 1 0 0 1 1.409 0Z"
                                          clipRule="evenodd"
                                        />
                                      </svg>
                                    </Button>
                                    <Button
                                      type="button"
                                      variant="ghost"
                                      size="sm"
                                      className="text-muted-foreground hover:text-foreground hover:bg-primary/10 focus-visible:ring-2 focus-visible:ring-primary/30 focus-visible:ring-offset-2"
                                      onClick={cancelEdit}
                                      title="Cancel"
                                      aria-label="Cancel"
                                    >
                                      {/* X icon */}
                                      <svg
                                        xmlns="http://www.w3.org/2000/svg"
                                        viewBox="0 0 20 20"
                                        fill="currentColor"
                                        className="w-5 h-5"
                                      >
                                        <path
                                          fillRule="evenodd"
                                          d="M5.293 5.293a1 1 0 0 1 1.414 0L10 8.586l3.293-3.293a1 1 0 1 1 1.414 1.414L11.414 10l3.293 3.293a1 1 0 0 1-1.414 1.414L10 11.414l-3.293 3.293a1 1 0 0 1-1.414-1.414L8.586 10 5.293 6.707a1 1 0 0 1 0-1.414Z"
                                          clipRule="evenodd"
                                        />
                                      </svg>
                                    </Button>
                                  </div>
                                </form>
                              </td>
                            </>
                          ) : (
                            // View mode
                            <>
                              <td className="px-3 py-2 text-sm whitespace-nowrap text-foreground">
                                {(() => {
                                  const sender = getPartyDisplay(
                                    payment.sender
                                  );
                                  return (
                                    <div className="flex flex-col leading-tight">
                                      <span className="text-xs font-medium text-foreground">
                                        {sender.name}
                                      </span>
                                      {sender.email && (
                                        <span className="text-[10px] italic text-muted-foreground">
                                          {sender.email}
                                        </span>
                                      )}
                                    </div>
                                  );
                                })()}
                              </td>
                              <td className="px-3 py-2 text-sm whitespace-nowrap text-foreground">
                                {(() => {
                                  const recipient = getPartyDisplay(
                                    payment.recipient
                                  );
                                  return (
                                    <div className="flex flex-col leading-tight">
                                      <span className="text-xs font-medium text-foreground">
                                        {recipient.name}
                                      </span>
                                      {recipient.email && (
                                        <span className="text-[10px] italic text-muted-foreground">
                                          {recipient.email}
                                        </span>
                                      )}
                                    </div>
                                  );
                                })()}
                              </td>
                              <td className="px-3 py-2 font-mono text-xs whitespace-nowrap text-foreground">
                                {formatCurrency(
                                  payment.amount,
                                  payment.currency
                                )}
                              </td>
                              <td className="px-3 py-2 text-xs whitespace-nowrap text-muted-foreground">
                                <Badge
                                  variant="outline"
                                  className="text-[10px] px-1.5 py-0.5"
                                >
                                  {payment.type}
                                </Badge>
                              </td>
                              <td className="px-3 py-2 whitespace-nowrap">
                                {(() => {
                                  const info = getStatusInfo(payment.status);
                                  return (
                                    <StatusBadge
                                      variant={info.variant}
                                      tooltip={info.tooltip}
                                      icon={info.icon}
                                    >
                                      {payment.status}
                                    </StatusBadge>
                                  );
                                })()}
                              </td>
                              <td className="px-3 py-2 text-xs text-muted-foreground max-w-[120px] truncate">
                                {payment.description || '-'}
                              </td>
                              <td className="px-3 py-2 text-xs whitespace-nowrap text-muted-foreground">
                                {formatDate(payment.createdAt)}
                              </td>
                              <td className="px-3 py-2 text-xs font-medium whitespace-nowrap">
                                <div className="flex gap-2">
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="p-0 text-primary hover:text-primary hover:bg-primary/10 focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:ring-offset-2 h-7 w-7"
                                    onClick={() =>
                                      setSelectedPaymentId(payment.id)
                                    }
                                    title="View Details"
                                    aria-label="View Details"
                                  >
                                    {/* Eye icon */}
                                    <svg
                                      xmlns="http://www.w3.org/2000/svg"
                                      viewBox="0 0 20 20"
                                      fill="currentColor"
                                      className="w-4 h-4"
                                    >
                                      <path d="M10 3.5c4.5 0 8 4.5 8 6.5s-3.5 6.5-8 6.5-8-4.5-8-6.5 3.5-6.5 8-6.5Zm0 3a4.5 4.5 0 1 0 0 9 4.5 4.5 0 0 0 0-9Z" />
                                    </svg>
                                  </Button>
                                  {(isVendor || isAdmin) && (
                                    <>
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        className="p-0 text-primary hover:text-primary hover:bg-primary/10 focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:ring-offset-2 h-7 w-7"
                                        onClick={() => startEdit(payment)}
                                        title="Edit"
                                        aria-label="Edit"
                                      >
                                        {/* Pencil icon */}
                                        <svg
                                          xmlns="http://www.w3.org/2000/svg"
                                          viewBox="0 0 20 20"
                                          fill="currentColor"
                                          className="w-4 h-4"
                                        >
                                          <path d="M13.586 3.586a2 2 0 0 1 2.828 2.828l-8.5 8.5a2 2 0 0 1-1.061.561l-3.15.525a.75.75 0 0 1-.87-.87l.525-3.15a2 2 0 0 1 .561-1.061l8.5-8.5Z" />
                                          <path d="M12 5l3 3" />
                                        </svg>
                                      </Button>
                                      {deleteConfirmId === payment.id ? (
                                        <div className="flex gap-2">
                                          <Button
                                            variant="destructive"
                                            size="sm"
                                            className="p-0 hover:bg-destructive/80 h-7 w-7"
                                            onClick={() =>
                                              handleDelete(payment.id)
                                            }
                                            disabled={
                                              deletePaymentMutation.isPending
                                            }
                                            title="Confirm Delete"
                                            aria-label="Confirm Delete"
                                          >
                                            {/* Check icon */}
                                            <svg
                                              xmlns="http://www.w3.org/2000/svg"
                                              viewBox="0 0 20 20"
                                              fill="currentColor"
                                              className="w-4 h-4"
                                            >
                                              <path
                                                fillRule="evenodd"
                                                d="M16.704 5.291a1 1 0 0 1 .005 1.414l-7.5 7.5a1 1 0 0 1-1.414 0l-3.5-3.5a1 1 0 1 1 1.414-1.414l2.793 2.793 6.793-6.793a1 1 0 0 1 1.409 0Z"
                                                clipRule="evenodd"
                                              />
                                            </svg>
                                          </Button>
                                          <Button
                                            variant="ghost"
                                            size="sm"
                                            className="p-0 text-muted-foreground hover:text-foreground hover:bg-accent h-7 w-7"
                                            onClick={() =>
                                              setDeleteConfirmId(null)
                                            }
                                            title="Cancel"
                                            aria-label="Cancel"
                                          >
                                            {/* X icon */}
                                            <svg
                                              xmlns="http://www.w3.org/2000/svg"
                                              viewBox="0 0 20 20"
                                              fill="currentColor"
                                              className="w-4 h-4"
                                            >
                                              <path
                                                fillRule="evenodd"
                                                d="M5.293 5.293a1 1 0 0 1 1.414 0L10 8.586l3.293-3.293a1 1 0 1 1 1.414 1.414L11.414 10l3.293 3.293a1 1 0 0 1-1.414 1.414L10 11.414l-3.293 3.293a1 1 0 0 1-1.414-1.414L8.586 10 5.293 6.707a1 1 0 0 1 0-1.414Z"
                                                clipRule="evenodd"
                                              />
                                            </svg>
                                          </Button>
                                        </div>
                                      ) : (
                                        <Button
                                          variant="destructive"
                                          size="sm"
                                          className="p-0 hover:bg-destructive/80 h-7 w-7"
                                          onClick={() =>
                                            setDeleteConfirmId(payment.id)
                                          }
                                          title="Delete"
                                          aria-label="Delete"
                                        >
                                          {/* Trash icon */}
                                          <svg
                                            xmlns="http://www.w3.org/2000/svg"
                                            viewBox="0 0 20 20"
                                            fill="currentColor"
                                            className="w-4 h-4"
                                          >
                                            <path d="M8 2a2 2 0 0 1 2-2h0a2 2 0 0 1 2 2h4a1 1 0 1 1 0 2h-1v11a3 3 0 0 1-3 3H8a3 3 0 0 1-3-3V4H4a1 1 0 1 1 0-2h4Zm-1 4a1 1 0 1 0-2 0v9a1 1 0 1 0 2 0V6Zm3 0a1 1 0 1 0-2 0v9a1 1 0 1 0 2 0V6Zm3 0a1 1 0 1 0-2 0v9a1 1 0 1 0 2 0V6Z" />
                                          </svg>
                                        </Button>
                                      )}
                                    </>
                                  )}
                                </div>
                              </td>
                            </>
                          )}
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={8} className="px-6 py-10">
                          <div className="flex flex-col items-center justify-center gap-3 text-center text-muted-foreground">
                            <p className="text-lg font-semibold">
                              {hasActiveFilters
                                ? 'No payments match your filters'
                                : isVendor
                                  ? 'No payments yet. Create the first payment.'
                                  : 'No payments found for your account.'}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              {hasActiveFilters
                                ? 'Try adjusting or clearing the filters to see more results.'
                                : isVendor
                                  ? 'Start by creating a payment to view it here.'
                                  : 'Payments you create or receive will appear in this list.'}
                            </p>
                            <div className="flex gap-2">
                              {hasActiveFilters && (
                                <Button
                                  variant="outline"
                                  onClick={clearFilters}
                                >
                                  Clear filters
                                </Button>
                              )}
                              {(isVendor || isCustomer) && (
                                <Button onClick={() => setShowCreateForm(true)}>
                                  Create payment
                                </Button>
                              )}
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </Card>

            {/* Mutation Errors */}
            {(updatePaymentMutation.isError ||
              deletePaymentMutation.isError) && (
              <Alert variant="destructive" className="mt-4">
                <AlertDescription>
                  {updatePaymentMutation.error?.message ||
                    deletePaymentMutation.error?.message ||
                    'An error occurred'}
                </AlertDescription>
              </Alert>
            )}
          </>
        )}
      </div>

      {/* Payment Details Modal */}
      {selectedPaymentId && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50"
          onClick={() => setSelectedPaymentId(null)}
        >
          <div
            ref={dialogRef}
            className="relative w-full max-w-4xl max-h-[90vh] overflow-y-auto bg-background rounded-lg shadow-xl"
            onClick={e => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-labelledby="payment-details-title"
            aria-describedby="payment-details-content"
            tabIndex={-1}
          >
            <div className="sticky top-0 z-10 flex items-center justify-between p-4 border-b bg-background border-border">
              <h2 id="payment-details-title" className="text-xl font-semibold">
                Payment Details
              </h2>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSelectedPaymentId(null)}
                aria-label="Close modal"
              >
                ✕
              </Button>
            </div>
            <div id="payment-details-content" className="p-6">
              <PaymentDetails
                payment={
                  paymentsWithParties.find(p => p.id === selectedPaymentId) ||
                  null
                }
                isLoading={false}
                isError={false}
                onClose={() => setSelectedPaymentId(null)}
              />
            </div>
          </div>
        </div>
      )}
      <ToastContainer position="top-right">
        {toasts.map(toast => (
          <Toast
            key={toast.id}
            title={toast.title}
            message={toast.message}
            variant={toast.variant}
            duration={toast.duration}
            onDismiss={() => removeToast(toast.id)}
          />
        ))}
      </ToastContainer>
    </div>
  );
}

/**
 * PaymentsPage - Public export
 * The shell provides Router context via BrowserRouter in bootstrap.tsx
 */
export function PaymentsPage(props: PaymentsPageProps = {}) {
  return <PaymentsPageInner {...props} />;
}

export default PaymentsPage;
