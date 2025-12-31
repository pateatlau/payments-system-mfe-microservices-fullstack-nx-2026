import {
  Card,
  Button,
  Alert,
  AlertDescription,
} from '@mfe/shared-design-system';
import { PaymentStatus } from 'shared-types';
import { PaymentTableRow } from './PaymentTableRow';
import type { PaymentWithParties } from './PaymentTableUtils';

export interface PaymentTableProps {
  payments: PaymentWithParties[];
  editingPaymentId: string | null;
  deleteConfirmId: string | null;
  isUpdating: boolean;
  isVendor: boolean;
  isAdmin: boolean;
  isCustomer: boolean;
  hasActiveFilters: boolean;
  statusValue: PaymentStatus;
  onStatusChange: (value: PaymentStatus) => void;
  reasonRegister?: Record<string, unknown>;
  onEdit: (payment: PaymentWithParties) => void;
  onSave: () => void;
  onCancel: () => void;
  onDelete: (id: string) => void;
  onCancelDelete: () => void;
  onView: (id: string) => void;
  onConfirmDelete: () => void;
  onClearFilters: () => void;
  onCreatePayment: () => void;
  updateError?: Error | null;
  deleteError?: Error | null;
}

/**
 * PaymentTable - Displays payments in a table with edit/delete actions
 */
export function PaymentTable({
  payments,
  editingPaymentId,
  deleteConfirmId,
  isUpdating,
  isVendor,
  isAdmin,
  isCustomer,
  hasActiveFilters,
  statusValue,
  onStatusChange,
  reasonRegister,
  onEdit,
  onSave,
  onCancel,
  onDelete,
  onCancelDelete,
  onView,
  onConfirmDelete,
  onClearFilters,
  onCreatePayment,
  updateError,
  deleteError,
}: PaymentTableProps) {
  const hasPayments = payments.length > 0;

  return (
    <>
      <Card className="overflow-hidden">
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
                <th className="px-3 py-2 text-[10px] font-medium tracking-wider text-right uppercase text-muted-foreground">
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
                payments.map(payment => (
                  <PaymentTableRow
                    key={payment.id}
                    payment={payment}
                    isEditing={editingPaymentId === payment.id}
                    isUpdating={isUpdating}
                    isVendor={isVendor}
                    isAdmin={isAdmin}
                    deleteConfirmId={deleteConfirmId}
                    statusValue={statusValue}
                    onStatusChange={onStatusChange}
                    reasonRegister={reasonRegister}
                    onEdit={onEdit}
                    onSave={onSave}
                    onCancel={onCancel}
                    onDelete={onDelete}
                    onCancelDelete={onCancelDelete}
                    onView={onView}
                    onConfirmDelete={onConfirmDelete}
                  />
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
                          <Button variant="outline" onClick={onClearFilters}>
                            Clear filters
                          </Button>
                        )}
                        {(isVendor || isCustomer) && (
                          <Button onClick={onCreatePayment}>
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
      {(updateError || deleteError) && (
        <Alert variant="destructive" className="mt-4">
          <AlertDescription>
            {updateError?.message ||
              deleteError?.message ||
              'An error occurred'}
          </AlertDescription>
        </Alert>
      )}
    </>
  );
}
