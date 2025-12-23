# Payment Details Component Integration Guide

## Overview

The `PaymentDetails` component displays comprehensive payment information in a card-based layout. It shows payment summary, sender/recipient details, transaction history, and provides action buttons based on user role and payment status.

## Component Location

```
/apps/payments-mfe/src/components/PaymentDetails.tsx
```

## Component API

### Props

```typescript
interface PaymentDetailsProps {
  payment: Payment | null; // Payment data object
  isLoading: boolean; // Loading state
  isError: boolean; // Error state
  error?: Error | null; // Error object
  onEdit?: (payment: Payment) => void; // Edit callback
  onCancel?: (payment: Payment) => void; // Cancel callback
  onClose?: () => void; // Close callback
}
```

### Payment Type Requirements

```typescript
interface Payment {
  id: string;
  senderId: string;
  recipientId: string;
  amount: number;
  currency: string;
  status: PaymentStatus;
  type: PaymentType;
  description?: string;
  createdAt: Date;
  completedAt?: Date;
  sender?: { id: string; email: string };
  recipient?: { id: string; email: string };
  transactions?: TransactionRecord[];
  metadata?: Record<string, any>;
}
```

## Features

### 1. **Header Section**

- Payment ID display
- Status badge with color coding
- Close button (if `onClose` provided)

### 2. **Payment Summary**

Displays key payment information in a responsive grid:

- **Amount**: Formatted currency (e.g., "$100.00 USD")
- **Currency**: Three-letter code (e.g., "USD")
- **Type**: Payment type (transfer, refund, etc.)
- **Status**: Current payment status with badge
- **Created Date**: Payment creation timestamp
- **Completed Date**: Payment completion timestamp (if available)
- **Description**: Payment description (if provided)

### 3. **Parties Information**

Shows sender and recipient details:

- Email addresses
- User IDs
- Styled in light gray background boxes

### 4. **Metadata Section**

Displays custom metadata key-value pairs:

- Only renders if metadata exists and has entries
- Handles nested objects with JSON serialization
- Two-column layout with key and value display

### 5. **Transaction History**

Timeline view of payment status changes:

- Status indicator with timestamp
- Status message description
- PSP transaction ID (if available)
- Chronological order with visual timeline

### 6. **Action Buttons**

Based on user role and payment status:

**Edit Button**: Shows when:

- User is the payment sender, OR
- User is ADMIN
- Always available (unless already processing)

**Cancel Button**: Shows when:

- Payment status is PENDING, AND
- User is the payment sender OR user is ADMIN

**Close Button**: Shows when:

- No edit/cancel buttons available
- `onClose` callback provided

### 7. **States**

#### Loading State

```tsx
<PaymentDetails payment={null} isLoading={true} isError={false} />
```

#### Error State

```tsx
<PaymentDetails
  payment={null}
  isLoading={false}
  isError={true}
  error={new Error('Failed to load payment')}
/>
```

#### Success State

```tsx
<PaymentDetails
  payment={paymentData}
  isLoading={false}
  isError={false}
  onEdit={handleEdit}
  onCancel={handleCancel}
  onClose={handleClose}
/>
```

## Usage Example

### Basic Modal Integration

```tsx
import { useState, useMemo } from 'react';
import { usePaymentById } from '../hooks';
import { PaymentDetails } from './PaymentDetails';
import { Modal, Button } from '@mfe/shared-design-system';

export function PaymentModal({
  paymentId,
  isOpen,
  onClose,
}: {
  paymentId: string;
  isOpen: boolean;
  onClose: () => void;
}) {
  const {
    data: payment,
    isLoading,
    isError,
    error,
  } = usePaymentById(paymentId);
  const [editingPayment, setEditingPayment] = useState<Payment | null>(null);

  const handleEdit = (payment: Payment) => {
    setEditingPayment(payment);
    // Show edit form
  };

  const handleCancel = async (payment: Payment) => {
    if (confirm('Are you sure you want to cancel this payment?')) {
      // Call cancel API
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Payment Details">
      <PaymentDetails
        payment={payment}
        isLoading={isLoading}
        isError={isError}
        error={error}
        onEdit={handleEdit}
        onCancel={handleCancel}
        onClose={onClose}
      />
    </Modal>
  );
}
```

### Panel Integration

```tsx
import { PaymentDetails } from './PaymentDetails';

export function PaymentSidebar({ paymentId }: { paymentId: string }) {
  const {
    data: payment,
    isLoading,
    isError,
    error,
  } = usePaymentById(paymentId);

  return (
    <aside className="w-80 border-l p-4 bg-gray-50">
      <PaymentDetails
        payment={payment}
        isLoading={isLoading}
        isError={isError}
        error={error}
        onEdit={payment => {
          // Open edit form
        }}
        onCancel={payment => {
          // Cancel payment
        }}
      />
    </aside>
  );
}
```

## Styling & Responsiveness

### Grid System

- **Desktop** (sm+): 3-column grid for summary items
- **Mobile** (<sm): 2-column grid
- Transaction history: Single column (responsive)

### Color Scheme

Status badge colors:

- **PENDING**: Yellow background with yellow text
- **PROCESSING**: Blue background with blue text
- **COMPLETED**: Green background with green text
- **FAILED**: Red background with red text
- **CANCELLED**: Gray background with gray text

### Spacing

Uses Tailwind spacing utility classes:

- Cards: Standard gap (4 units)
- Content: 4 unit padding
- Grid gaps: 4 units

## Dependencies

### Required Imports

```tsx
import { useAuthStore } from 'shared-auth-store';
import type { Payment, UserRole } from 'shared-types';
import { PaymentStatus } from 'shared-types';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  Alert,
  AlertTitle,
  AlertDescription,
  Badge,
  Button,
  Loading,
} from '@mfe/shared-design-system';
import { formatCurrency, formatDate } from '../utils/formatting';
```

### Utilities

- **formatCurrency**: Formats amount with currency symbol
- **formatDate**: Formats date with full timestamp

## Testing

### Unit Tests

File: `/apps/payments-mfe/src/components/PaymentDetails.test.tsx`

Test coverage includes:

- Loading state display
- Error state with error message
- Payment details rendering
- Sender/recipient information
- Transaction history display
- Metadata display
- Edit button visibility and click handling
- Cancel button visibility and click handling
- Close button handling
- Role-based permission checks (sender, admin, other)
- Payment status variations
- Missing optional fields handling

### Running Tests

```bash
nx test payments-mfe --testFile=PaymentDetails
```

## Accessibility Features

- Semantic HTML structure
- ARIA labels for buttons
- Proper heading hierarchy
- Color not only indicator of status (uses text + badges)
- Keyboard navigable buttons
- Loading/error states clearly communicated

## Performance Considerations

- Uses `useMemo` for role-based action buttons
- Lazy renders optional sections (description, metadata, completedAt)
- Efficient role checking with early returns
- No unnecessary re-renders with proper memoization

## Integration Checklist

- [ ] Import component: `import { PaymentDetails } from './components'`
- [ ] Ensure `usePaymentById` hook is available and working
- [ ] Design system components are properly installed
- [ ] Formatting utilities are available
- [ ] Auth store is configured
- [ ] Component is exported from `components/index.ts`
- [ ] Tests pass without errors
- [ ] Responsive design tested on mobile/tablet/desktop
- [ ] Error states properly handled
- [ ] Loading states properly displayed
- [ ] Action callbacks properly wired to handlers
