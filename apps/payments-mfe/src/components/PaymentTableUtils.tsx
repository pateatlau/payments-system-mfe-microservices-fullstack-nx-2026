import { Button, Input, Select } from '@mfe/shared-design-system';
import { PaymentStatus } from 'shared-types';
import type { Payment } from '../api/types';

interface PartyInfo {
  id: string;
  email: string;
  name?: string | null;
}

export interface PaymentWithParties extends Payment {
  sender?: PartyInfo | null;
  recipient?: PartyInfo | null;
}

function formatCurrency(amount: number, currency: string): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
  }).format(amount);
}

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

export interface PaymentTableRowEditProps {
  statusRegister?: Record<string, unknown>;
  reasonRegister?: Record<string, unknown>;
  isUpdating: boolean;
  onSave: () => void;
  onCancel: () => void;
  payment: PaymentWithParties;
}

function EditModeRow({
  payment,
  statusRegister = {},
  reasonRegister = {},
  isUpdating,
  onSave,
  onCancel,
}: PaymentTableRowEditProps) {
  return (
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
      <td className="px-3 py-2 font-mono text-xs whitespace-nowrap text-foreground">
        {formatCurrency(payment.amount, payment.currency)}
      </td>
      <td className="px-3 py-2 text-xs whitespace-nowrap text-muted-foreground">
        {payment.type}
      </td>
      <td className="px-3 py-2 whitespace-nowrap">
        <Select {...statusRegister}>
          <option value={PaymentStatus.PENDING}>Pending</option>
          <option value={PaymentStatus.PROCESSING}>Processing</option>
          <option value={PaymentStatus.COMPLETED}>Completed</option>
          <option value={PaymentStatus.FAILED}>Failed</option>
          <option value={PaymentStatus.CANCELLED}>Cancelled</option>
        </Select>
      </td>
      <td className="px-3 py-2 whitespace-nowrap">
        <Input
          type="text"
          {...reasonRegister}
          placeholder="Reason"
          className="w-full text-xs"
        />
      </td>
      <td className="px-3 py-2 text-xs whitespace-nowrap text-muted-foreground">
        {formatDate(payment.createdAt)}
      </td>
      <td className="px-3 py-2 text-xs font-medium whitespace-nowrap">
        <div className="flex gap-1">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="text-emerald-600 hover:text-emerald-700 hover:bg-emerald-100/70 focus-visible:ring-2 focus-visible:ring-emerald-500/40 focus-visible:ring-offset-2"
            disabled={isUpdating}
            title="Save"
            aria-label="Save"
            onClick={onSave}
          >
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
            onClick={onCancel}
            title="Cancel"
            aria-label="Cancel"
          >
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
      </td>
    </>
  );
}

export {
  EditModeRow,
  formatCurrency,
  formatDate,
  getPartyDisplay,
  deriveNameFromEmail,
};
