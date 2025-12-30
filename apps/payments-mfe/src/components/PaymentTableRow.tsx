import {
  Button,
  Badge,
  StatusBadge,
  getStatusInfo,
} from '@mfe/shared-design-system';
import {
  formatCurrency,
  formatDate,
  getPartyDisplay,
  EditModeRow,
  PaymentWithParties,
} from './PaymentTableUtils';

export interface PaymentTableRowProps {
  payment: PaymentWithParties;
  isEditing: boolean;
  isUpdating: boolean;
  isVendor: boolean;
  isAdmin: boolean;
  deleteConfirmId: string | null;
  statusRegister?: Record<string, unknown>;
  reasonRegister?: Record<string, unknown>;
  onEdit: (payment: PaymentWithParties) => void;
  onSave: () => void;
  onCancel: () => void;
  onDelete: (id: string) => void;
  onCancelDelete: () => void;
  onView: (id: string) => void;
  onConfirmDelete: () => void;
}

/**
 * PaymentTableRow - Single payment row with edit/view modes
 */
export function PaymentTableRow({
  payment,
  isEditing,
  isUpdating,
  isVendor,
  isAdmin,
  deleteConfirmId,
  statusRegister,
  reasonRegister,
  onEdit,
  onSave,
  onCancel,
  onDelete,
  onCancelDelete,
  onView,
  onConfirmDelete,
}: PaymentTableRowProps) {
  return (
    <tr className="hover:bg-muted/50">
      {isEditing ? (
        <EditModeRow
          payment={payment}
          statusRegister={statusRegister}
          reasonRegister={reasonRegister}
          isUpdating={isUpdating}
          onSave={onSave}
          onCancel={onCancel}
        />
      ) : (
        // View mode
        <>
          <td className="px-3 py-2 text-sm whitespace-nowrap text-foreground">
            {(() => {
              const sender = getPartyDisplay(payment.sender);
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
              const recipient = getPartyDisplay(payment.recipient);
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
          <td className="px-3 py-2 font-mono text-xs whitespace-nowrap text-foreground text-right">
            {formatCurrency(payment.amount, payment.currency)}
          </td>
          <td className="px-3 py-2 text-xs whitespace-nowrap text-muted-foreground">
            <Badge variant="outline" className="text-[10px] px-1.5 py-0.5">
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
                onClick={() => onView(payment.id)}
                title="View Details"
                aria-label="View Details"
              >
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
                    onClick={() => onEdit(payment)}
                    title="Edit"
                    aria-label="Edit"
                  >
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
                        onClick={onConfirmDelete}
                        title="Confirm Delete"
                        aria-label="Confirm Delete"
                      >
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
                        onClick={onCancelDelete}
                        title="Cancel"
                        aria-label="Cancel"
                      >
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
                      onClick={() => onDelete(payment.id)}
                      title="Delete"
                      aria-label="Delete"
                    >
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
  );
}
