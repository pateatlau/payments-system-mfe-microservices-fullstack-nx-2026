import { useEffect, useRef, useState } from 'react';
import { useAuthStore } from 'shared-auth-store';
import { UserRole } from 'shared-types';
import {
  Button,
  Alert,
  AlertTitle,
  AlertDescription,
  Loading,
  Toast,
  ToastContainer,
} from '@mfe/shared-design-system';
import {
  usePayments,
  useCreatePayment,
  useUpdatePayment,
  useDeletePayment,
  usePaymentUpdates,
} from '../hooks';
import { useToasts } from '../hooks/useToasts';
import { PaymentDetails } from './PaymentDetails';
import { PaymentReports } from './PaymentReports';
import { PaymentsSection } from './PaymentsSection';
import type { UsePaymentsFilters } from '../hooks/usePayments';
import type { PaymentWithParties } from './PaymentTableUtils';

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
 * Inner PaymentsPage component - assumes Router context is available
 */
function PaymentsPageInner({ onPaymentSuccess }: PaymentsPageProps = {}) {
  const { user, hasRole } = useAuthStore();
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
  useEffect(() => {
    const handleLocationChange = () => {
      const tabFromUrl = getTabFromUrl();
      setActiveTab(tabFromUrl);
    };

    window.addEventListener('popstate', handleLocationChange);

    const checkInterval = setInterval(() => {
      const tabFromUrl = getTabFromUrl();
      setActiveTab(prev => {
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

  // Mutations
  const createPaymentMutation = useCreatePayment();
  const updatePaymentMutation = useUpdatePayment();
  const deletePaymentMutation = useDeletePayment();

  // Role flags
  const isVendor = hasRole(UserRole.VENDOR);
  const isCustomer = hasRole(UserRole.CUSTOMER);
  const isAdmin = hasRole(UserRole.ADMIN);

  // Modal focus management
  useEffect(() => {
    if (!selectedPaymentId) return;

    previouslyFocusedRef.current = document.activeElement as HTMLElement | null;

    const dialogEl = dialogRef.current;
    const initialFocusTarget =
      dialogEl?.querySelector<HTMLElement>(FOCUSABLE_SELECTOR);
    initialFocusTarget?.focus();

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
      if (focusable.length === 0) return;

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

  const handleRefetch = async () => {
    await refetchPayments();
  };

  return (
    <div className="w-full">
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
          <PaymentsSection
            payments={paymentsWithParties}
            filters={filters}
            isLoadingPayments={isLoadingPayments}
            isVendor={isVendor}
            isAdmin={isAdmin}
            isCustomer={isCustomer}
            hasActiveFilters={hasActiveFilters}
            createPaymentMutation={createPaymentMutation}
            updatePaymentMutation={updatePaymentMutation}
            deletePaymentMutation={deletePaymentMutation}
            onFilterChange={setFilters}
            onCreateSuccess={onPaymentSuccess || (() => {})}
            onUpdateSuccess={onPaymentSuccess || (() => {})}
            onDeleteSuccess={onPaymentSuccess || (() => {})}
            onAddToast={addToast}
            onRefetch={handleRefetch}
            onView={setSelectedPaymentId}
          />
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
