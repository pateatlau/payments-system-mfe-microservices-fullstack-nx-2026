# Payments MFE – Main Flow Documentation (POC-3)

Last Updated: 2025-12-21

## Overview

This document summarizes the Payments MFE main flow implementation completed in POC-3 and provides usage guidance for shared components, hooks, and new UX patterns.

## Features

- Status Badges with tooltips and icons (shared design system `StatusBadge`)
- Toast notifications for success/error outcomes (`Toast`, `ToastContainer` + `useToasts` hook)
- Role-aware empty states and CTAs in list and reports
- Accessibility: modal dialog semantics, focus trap, keyboard navigation
- Enhanced reports view with summary metrics and empty-state messaging

## Shared Components & Helpers

### StatusBadge (Design System)

- Component: `StatusBadge`
- Helpers: `getStatusInfo(status)`, `renderStatusIcon(icon)`
- Usage:

```tsx
import { StatusBadge, getStatusInfo } from '@mfe/shared-design-system';
import { PaymentStatus } from 'shared-types';

const info = getStatusInfo(PaymentStatus.PROCESSING);

<StatusBadge variant={info.variant} tooltip={info.tooltip} icon={info.icon}>
  processing
</StatusBadge>;
```

### Toasts

- Components: `Toast`, `ToastContainer`
- Hook: `useToasts` (local to payments MFE)
- Usage (simplified):

```tsx
const { toasts, addToast, removeToast } = useToasts();

addToast({ type: 'success', title: 'Payment updated', duration: 3500 });

<ToastContainer toasts={toasts} onClose={removeToast} position="top-right" />;
```

## Hooks

- `usePayments(filters)` – fetch list with filter params
- `usePaymentReports(params)` – summary metrics with date-range filter
- `useUpdatePayment()` – mutation with cache invalidation (details + list)

## API Integration

- Shared API client: `libs/shared-api-client/src/lib/payments.ts`
- Function: `updatePaymentDetails(paymentId, data)`
- Types: `UpdatePaymentData` (alias of `UpdatePaymentRequest`)
- Errors: propagated for clear UI feedback

## Testing Strategy

- Unit: helpers (`statusBadge`), hooks (`useToasts`, `useUpdatePayment`)
- Integration: `PaymentUpdateForm` end-to-end flow
- E2E: payments scenarios in `shell-e2e` (create, view, update, filter, reports)

## Payment Status Flow

- Statuses: `pending`, `processing`, `completed`, `failed`, `cancelled`
- Badges: mapped via `getStatusInfo` to variant + icon + tooltip
- Constraints: completed/failed cannot be updated

## Role-Based Access Control

- Customer: can create payments, view own details
- Vendor: can update/cancel own payments, view reports
- Admin: elevated actions across payments

## Accessibility

- Dialog semantics (`role="dialog"`, `aria-modal`, labels)
- Focus trap with Escape close and Tab cycling
- Non-null focus targeting to satisfy TypeScript

## Usage Examples

- Payments list: show status with `StatusBadge`
- Details header: consistent badge and tooltip
- Reports tab: role-aware visibility and empty-state handling

## Notes

- StatusBadge helpers re-exported for backward compatibility from `apps/payments-mfe/src/utils/statusBadge.tsx`.
- Performance checks authored; execution may be deferred until ports are free.
