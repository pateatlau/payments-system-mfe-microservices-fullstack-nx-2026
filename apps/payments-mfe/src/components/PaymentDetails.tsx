import { useMemo } from 'react';
import { useAuthStore } from 'shared-auth-store';
import type { Payment, UserRole } from 'shared-types';
import { PaymentStatus } from 'shared-types';
import { StatusBadge, getStatusInfo } from '@mfe/shared-design-system';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  Alert,
  AlertTitle,
  AlertDescription,
  Button,
  Loading,
} from '@mfe/shared-design-system';

/**
 * Extended Payment type with optional fields for detailed view
 */
interface ExtendedPayment extends Payment {
  sender?: { id: string; email: string };
  recipient?: { id: string; email: string };
  senderId?: string;
  recipientId?: string;
  completedAt?: string;
  transactions?: Array<{
    id: string;
    status: string;
    statusMessage: string;
    createdAt: string;
    pspTransactionId?: string;
  }>;
}

interface PaymentDetailsProps {
  payment: ExtendedPayment | null;
  isLoading: boolean;
  isError: boolean;
  error?: Error | null;
  onEdit?: (payment: Payment) => void;
  onCancel?: (payment: Payment) => void;
  onClose?: () => void;
}

/**
 * Format currency value with symbol
 */
function formatCurrency(amount: number, currency: string): string {
  const formatter = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency || 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  return formatter.format(amount);
}

/**
 * Format date to readable string
 */
function formatDate(dateString: string | Date): string {
  const date =
    typeof dateString === 'string' ? new Date(dateString) : dateString;
  const formatter = new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
  return formatter.format(date);
}

/**
 * Transaction history item
 */
interface TransactionRecord {
  id: string;
  status: string;
  statusMessage: string;
  createdAt: string;
  pspTransactionId?: string;
}

/**
 * Payment Details Component
 *
 * Displays comprehensive payment information including:
 * - Payment header with status
 * - Payment summary (amount, type, currency)
 * - Sender/recipient information
 * - Dates and metadata
 * - Transaction history
 * - Action buttons (edit, cancel based on role/status)
 */
export function PaymentDetails({
  payment,
  isLoading,
  isError,
  error,
  onEdit,
  onCancel,
  onClose,
}: PaymentDetailsProps) {
  const { user } = useAuthStore();

  // Check if user can edit/cancel this payment
  const canEdit = useMemo(() => {
    if (!payment || !user) return false;
    // Only sender or ADMIN can edit
    const isSender = payment.senderId === user.id || payment.userId === user.id;
    return isSender || user.role === ('ADMIN' as UserRole);
  }, [payment, user]);

  const canCancel = useMemo(() => {
    if (!payment || !user) return false;
    // Can only cancel pending payments
    if (payment.status !== PaymentStatus.PENDING) return false;
    // Only sender or ADMIN can cancel
    const isSender = payment.senderId === user.id || payment.userId === user.id;
    return isSender || user.role === ('ADMIN' as UserRole);
  }, [payment, user]);

  // Loading state
  if (isLoading) {
    return (
      <Card className="w-full">
        <CardContent className="p-8">
          <Loading label="Loading payment details..." />
        </CardContent>
      </Card>
    );
  }

  // Error state
  if (isError || !payment) {
    return (
      <Card className="w-full">
        <CardContent className="p-6">
          <Alert variant="destructive">
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>
              {error?.message || 'Failed to load payment details'}
            </AlertDescription>
          </Alert>
          {onClose && (
            <Button onClick={onClose} className="mt-4">
              Close
            </Button>
          )}
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="w-full space-y-4">
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <CardTitle className="text-2xl">Payment Details</CardTitle>
              <CardDescription className="mt-1">
                ID: {payment.id}
              </CardDescription>
            </div>
            {(() => {
              const info = getStatusInfo(payment.status as PaymentStatus);
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
            {onClose && (
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600"
                aria-label="Close"
              >
                ✕
              </button>
            )}
          </div>
        </CardHeader>
      </Card>

      {/* Payment Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Summary</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
            {/* Amount */}
            <div>
              <label className="text-sm font-medium text-gray-600">
                Amount
              </label>
              <p className="text-xl font-bold">
                {formatCurrency(payment.amount, payment.currency)}
              </p>
            </div>

            {/* Currency */}
            <div>
              <label className="text-sm font-medium text-gray-600">
                Currency
              </label>
              <p className="text-lg font-semibold">{payment.currency}</p>
            </div>

            {/* Type */}
            <div>
              <label className="text-sm font-medium text-gray-600">Type</label>
              <p className="text-lg font-semibold capitalize">{payment.type}</p>
            </div>

            {/* Status */}
            <div>
              <label className="text-sm font-medium text-gray-600">
                Status
              </label>
              {(() => {
                const info = getStatusInfo(payment.status as PaymentStatus);
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
            </div>

            {/* Created Date */}
            <div>
              <label className="text-sm font-medium text-gray-600">
                Created
              </label>
              <p className="text-sm">{formatDate(payment.createdAt)}</p>
            </div>

            {/* Completed Date */}
            {payment.completedAt && (
              <div>
                <label className="text-sm font-medium text-gray-600">
                  Completed
                </label>
                <p className="text-sm">{formatDate(payment.completedAt)}</p>
              </div>
            )}
          </div>

          {/* Description */}
          {payment.description && (
            <div className="pt-4 border-t">
              <label className="text-sm font-medium text-gray-600">
                Description
              </label>
              <p className="mt-1 text-sm text-gray-800">
                {payment.description}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Parties Information */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Parties</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            {/* Sender */}
            <div className="p-4 rounded-lg bg-gray-50">
              <label className="text-sm font-medium text-gray-600">
                From (Sender)
              </label>
              <div className="mt-2 space-y-1">
                {payment.sender?.email && (
                  <p className="font-semibold">{payment.sender.email}</p>
                )}
                {payment.senderId && (
                  <p className="text-xs text-gray-500">{payment.senderId}</p>
                )}
                {payment.userId && !payment.senderId && (
                  <p className="text-xs text-gray-500">{payment.userId}</p>
                )}
              </div>
            </div>

            {/* Recipient */}
            <div className="p-4 rounded-lg bg-gray-50">
              <label className="text-sm font-medium text-gray-600">
                To (Recipient)
              </label>
              <div className="mt-2 space-y-1">
                {payment.recipient?.email && (
                  <p className="font-semibold">{payment.recipient.email}</p>
                )}
                {payment.recipientId && (
                  <p className="text-xs text-gray-500">{payment.recipientId}</p>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Metadata */}
      {payment.metadata && Object.keys(payment.metadata).length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Metadata</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {Object.entries(payment.metadata).map(([key, value]) => (
                <div key={key} className="flex justify-between text-sm">
                  <span className="font-medium text-gray-600">{key}:</span>
                  <span className="text-gray-800">
                    {typeof value === 'object'
                      ? JSON.stringify(value)
                      : String(value)}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Transaction History */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Transaction History</CardTitle>
          <CardDescription>Timeline of payment status changes</CardDescription>
        </CardHeader>
        <CardContent>
          {payment.transactions &&
          Array.isArray(payment.transactions) &&
          payment.transactions.length > 0 ? (
            <div className="space-y-3">
              {payment.transactions.map(
                (transaction: TransactionRecord, index: number) => (
                  <div
                    key={transaction.id || index}
                    className="flex gap-4 pb-3 pl-4 border-l-2 border-gray-300 last:border-0"
                  >
                    <div className="pt-1">
                      <div className="w-2 h-2 bg-blue-600 rounded-full" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <p className="font-medium capitalize">
                          {transaction.status}
                        </p>
                        <p className="text-xs text-gray-500">
                          {formatDate(new Date(transaction.createdAt))}
                        </p>
                      </div>
                      <p className="mt-1 text-sm text-gray-700">
                        {transaction.statusMessage}
                      </p>
                      {transaction.pspTransactionId && (
                        <p className="mt-1 text-xs text-gray-500">
                          PSP ID: {transaction.pspTransactionId}
                        </p>
                      )}
                    </div>
                  </div>
                )
              )}
            </div>
          ) : (
            <p className="text-sm text-gray-500">No transaction history</p>
          )}
        </CardContent>
      </Card>

      {/* Action Buttons */}
      {(canEdit || canCancel) && (
        <Card>
          <CardContent className="flex gap-3 pt-6">
            {canEdit && onEdit && (
              <Button
                onClick={() => onEdit(payment)}
                variant="outline"
                className="flex-1"
              >
                Edit Payment
              </Button>
            )}
            {canCancel && onCancel && (
              <Button
                onClick={() => onCancel(payment)}
                variant="destructive"
                className="flex-1"
              >
                Cancel Payment
              </Button>
            )}
            {onClose && !canEdit && !canCancel && (
              <Button onClick={onClose} className="flex-1">
                Close
              </Button>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

export default PaymentDetails;
