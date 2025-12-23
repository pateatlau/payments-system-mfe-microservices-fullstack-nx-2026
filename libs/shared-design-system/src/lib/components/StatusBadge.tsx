import * as React from 'react';
import { Badge } from './Badge';
import type { BadgeProps } from './Badge';
import { PaymentStatus } from 'shared-types';

export type StatusIcon = 'check' | 'spinner' | 'hourglass' | 'x' | 'ban';

export interface StatusInfo {
  variant: NonNullable<BadgeProps['variant']>;
  tooltip: string;
  icon: StatusIcon;
}

export function getStatusInfo(status: PaymentStatus): StatusInfo {
  switch (status) {
    case PaymentStatus.COMPLETED:
      return {
        variant: 'success',
        tooltip: 'Completed: payment settled successfully.',
        icon: 'check',
      };
    case PaymentStatus.PROCESSING:
      return {
        variant: 'default',
        tooltip: 'Processing: payment is being handled by the system.',
        icon: 'spinner',
      };
    case PaymentStatus.PENDING:
      return {
        variant: 'warning',
        tooltip: 'Pending: payment is awaiting confirmation or action.',
        icon: 'hourglass',
      };
    case PaymentStatus.FAILED:
      return {
        variant: 'destructive',
        tooltip: 'Failed: payment could not be completed.',
        icon: 'x',
      };
    case PaymentStatus.CANCELLED:
      return {
        variant: 'secondary',
        tooltip: 'Cancelled: payment was cancelled and will not proceed.',
        icon: 'ban',
      };
    default:
      return {
        variant: 'secondary',
        tooltip: 'Unknown status.',
        icon: 'ban',
      };
  }
}

export function renderStatusIcon(icon: StatusIcon) {
  // Lightweight inline SVGs to avoid external deps
  switch (icon) {
    case 'check':
      return (
        <svg
          aria-hidden="true"
          className="mr-1 h-4 w-4"
          viewBox="0 0 20 20"
          fill="currentColor"
        >
          <path d="M16.707 5.293a1 1 0 00-1.414 0L8 12.586 4.707 9.293a1 1 0 10-1.414 1.414l4 4a1 1 0 001.414 0l8-8a1 1 0 000-1.414z" />
        </svg>
      );
    case 'spinner':
      return (
        <svg
          aria-hidden="true"
          className="mr-1 h-4 w-4 animate-spin"
          viewBox="0 0 24 24"
        >
          <circle
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="2"
            fill="none"
            opacity="0.25"
          />
          <path
            d="M22 12a10 10 0 00-10-10"
            stroke="currentColor"
            strokeWidth="2"
            fill="none"
          />
        </svg>
      );
    case 'hourglass':
      return (
        <svg
          aria-hidden="true"
          className="mr-1 h-4 w-4"
          viewBox="0 0 24 24"
          fill="currentColor"
        >
          <path d="M6 2h12v4a6 6 0 01-6 6 6 6 0 01-6-6V2zm12 20H6v-4a6 6 0 016-6 6 6 0 016 6v4z" />
        </svg>
      );
    case 'x':
      return (
        <svg
          aria-hidden="true"
          className="mr-1 h-4 w-4"
          viewBox="0 0 24 24"
          fill="currentColor"
        >
          <path
            d="M18 6L6 18M6 6l12 12"
            stroke="currentColor"
            strokeWidth="2"
          />
        </svg>
      );
    case 'ban':
      return (
        <svg
          aria-hidden="true"
          className="mr-1 h-4 w-4"
          viewBox="0 0 24 24"
          fill="currentColor"
        >
          <path d="M12 2a10 10 0 100 20 10 10 0 000-20zm-7 10a7 7 0 0111.95-4.95L7.05 16.95A6.98 6.98 0 015 12zm7 7a7 7 0 004.95-11.95L7.05 16.95A7 7 0 0012 19z" />
        </svg>
      );
    default:
      return null;
  }
}

export interface StatusBadgeProps extends Omit<BadgeProps, 'children'> {
  icon?: StatusIcon;
  tooltip?: string;
  children?: React.ReactNode;
}

export function StatusBadge({
  icon,
  tooltip,
  children,
  variant,
  className,
  ...rest
}: StatusBadgeProps) {
  return (
    <Badge
      variant={variant}
      title={tooltip}
      aria-label={tooltip ? `${String(children)}: ${tooltip}` : undefined}
      className={className}
      {...rest}
    >
      <span className="inline-flex items-center">
        {icon ? renderStatusIcon(icon) : null}
        {children}
      </span>
    </Badge>
  );
}
