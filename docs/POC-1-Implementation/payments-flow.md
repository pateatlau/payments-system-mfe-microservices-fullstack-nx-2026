# Payments Flow Documentation

**POC-1 Implementation**  
**Status:** ✅ Complete

---

## Overview

POC-1 implements a **stubbed payments system** with CRUD operations. All payment operations are simulated (no actual Payment Service Provider integration). The system supports role-based access control, where VENDOR users can create/edit/delete payments, while CUSTOMER users can only view payments.

---

## Architecture

### Components

```
┌─────────────────────────────────────────────────────────┐
│                    Shell App (Host)                       │
│                                                           │
│  ┌─────────────────────────────────────────────────┐    │
│  │         PaymentsPage (Wrapper)                   │    │
│  │  (Wrapper component in shell)                   │    │
│  └──────────────┬──────────────────────────────────┘    │
│                 │                                        │
│                 │ Module Federation                      │
│                 │                                        │
│                 ▼                                        │
│  ┌─────────────────────────────────────────────────┐    │
│  │         Payments MFE (Remote)                    │    │
│  │                                                   │    │
│  │  ┌──────────────────────────────────────────┐  │    │
│  │  │         PaymentsPage Component            │  │    │
│  │  │                                           │  │    │
│  │  │  ┌──────────────┐  ┌──────────────┐     │  │    │
│  │  │  │ PaymentsList │  │ CreateForm  │     │  │    │
│  │  │  └──────────────┘  └──────────────┘     │  │    │
│  │  └──────────┬───────────────────────────────┘  │    │
│  │             │                                    │    │
│  │             ▼                                    │    │
│  │  ┌──────────────────────────────────────────┐  │    │
│  │  │         TanStack Query Hooks              │  │    │
│  │  │  - usePayments                            │  │    │
│  │  │  - useCreatePayment                        │  │    │
│  │  │  - useUpdatePayment                        │  │    │
│  │  │  - useDeletePayment                        │  │    │
│  │  └──────────┬───────────────────────────────┘  │    │
│  │             │                                    │    │
│  │             ▼                                    │    │
│  │  ┌──────────────────────────────────────────┐  │    │
│  │  │         Stubbed Payments API             │  │    │
│  │  │  (No actual PSP integration)              │  │    │
│  │  └──────────────────────────────────────────┘  │    │
│  └───────────────────────────────────────────────────┘    │
│                                                           │
│                    Shared Store                            │
│                    (useAuthStore)                          │
│                    (for role checking)                     │
└───────────────────────────────────────────────────────────┘
```

### Key Files

- **Payments MFE:**
  - `apps/payments-mfe/src/components/PaymentsPage.tsx` - Main payments dashboard
  - `apps/payments-mfe/src/api/stubbedPayments.ts` - Stubbed payment operations
  - `apps/payments-mfe/src/hooks/usePayments.ts` - Fetch payments hook
  - `apps/payments-mfe/src/hooks/usePaymentMutations.ts` - Mutation hooks

- **Shell App:**
  - `apps/shell/src/pages/PaymentsPage.tsx` - Payments page wrapper
  - `apps/shell/src/routes/AppRoutes.tsx` - Route definitions

- **Shared:**
  - `libs/shared-auth-store/src/lib/shared-auth-store.ts` - Auth store (for roles)

---

## Payment Data Model

### Payment Interface

```typescript
interface Payment {
  id: string;
  amount: number;
  currency: string;
  description: string;
  status: PaymentStatus; // 'pending' | 'completed' | 'failed'
  createdAt: string;     // ISO 8601 date string
  updatedAt: string;    // ISO 8601 date string
  vendorId?: string;     // Optional vendor ID
  customerId?: string;   // Optional customer ID
}
```

### Payment Status

- `pending` - Payment is pending processing
- `completed` - Payment has been completed
- `failed` - Payment has failed

---

## User Flows

### View Payments (All Users)

**Flow:**
1. User navigates to `/payments` (must be authenticated)
2. `PaymentsPage` component loads
3. `usePayments` hook fetches payments list
4. Payments are displayed in a table/list
5. User can see all payments (no filtering by role in POC-1)

**Code:**
```typescript
const { data: payments, isLoading, error } = usePayments();
```

### Create Payment (VENDOR Only)

**Flow:**
1. VENDOR user navigates to `/payments`
2. VENDOR sees "Create Payment" button
3. VENDOR clicks button → form modal opens
4. VENDOR fills in payment details (amount, currency, description)
5. VENDOR submits form
6. `useCreatePayment` hook creates payment
7. Optimistic update shows payment immediately
8. Payment list refreshes

**Code:**
```typescript
const createPayment = useCreatePayment();

const handleSubmit = async (data: CreatePaymentData) => {
  await createPayment.mutateAsync(data);
  // Form closes automatically on success
};
```

**Role Check:**
```typescript
const isVendor = useAuthStore((state) => state.hasRole('VENDOR'));

{isVendor && (
  <button onClick={openCreateModal}>Create Payment</button>
)}
```

### Update Payment (VENDOR Only)

**Flow:**
1. VENDOR user views payments list
2. VENDOR clicks "Edit" button on a payment
3. Form modal opens with payment data pre-filled
4. VENDOR modifies payment details
5. VENDOR submits form
6. `useUpdatePayment` hook updates payment
7. Optimistic update shows changes immediately
8. Payment list refreshes

**Code:**
```typescript
const updatePayment = useUpdatePayment();

const handleSubmit = async (data: UpdatePaymentData) => {
  await updatePayment.mutateAsync({ id: payment.id, ...data });
};
```

### Delete Payment (VENDOR Only)

**Flow:**
1. VENDOR user views payments list
2. VENDOR clicks "Delete" button on a payment
3. Confirmation dialog appears
4. VENDOR confirms deletion
5. `useDeletePayment` hook deletes payment
6. Optimistic update removes payment immediately
7. Payment list refreshes

**Code:**
```typescript
const deletePayment = useDeletePayment();

const handleDelete = async (id: string) => {
  if (confirm('Are you sure you want to delete this payment?')) {
    await deletePayment.mutateAsync(id);
  }
};
```

---

## Stubbed Payment Operations

### Location

`apps/payments-mfe/src/api/stubbedPayments.ts`

### Implementation

All operations are stubbed (no actual PSP integration):

```typescript
// Fetch all payments
export async function fetchPayments(): Promise<Payment[]> {
  await delay(300); // Simulate API delay
  return mockPayments;
}

// Create payment
export async function createPayment(data: CreatePaymentData): Promise<Payment> {
  await delay(500);
  const payment: Payment = {
    id: `payment-${Date.now()}`,
    ...data,
    status: 'pending',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  mockPayments.push(payment);
  return payment;
}

// Update payment
export async function updatePayment(
  id: string,
  data: UpdatePaymentData
): Promise<Payment> {
  await delay(500);
  const index = mockPayments.findIndex((p) => p.id === id);
  if (index === -1) throw new Error('Payment not found');
  const updated = { ...mockPayments[index], ...data, updatedAt: new Date().toISOString() };
  mockPayments[index] = updated;
  return updated;
}

// Delete payment
export async function deletePayment(id: string): Promise<void> {
  await delay(300);
  const index = mockPayments.findIndex((p) => p.id === id);
  if (index === -1) throw new Error('Payment not found');
  mockPayments.splice(index, 1);
}
```

### Mock Data

Initial mock payments are stored in memory (not persisted):

```typescript
const mockPayments: Payment[] = [
  {
    id: 'payment-1',
    amount: 100.00,
    currency: 'USD',
    description: 'Sample payment 1',
    status: 'completed',
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z',
  },
  // ... more mock payments
];
```

**Note:** Mock data is reset on page refresh (not persisted).

---

## TanStack Query Integration

### Query Configuration

**Location:** `apps/payments-mfe/src/providers/QueryProvider.tsx`

```typescript
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      gcTime: 10 * 60 * 1000,   // 10 minutes (formerly cacheTime)
    },
  },
});
```

### Hooks

#### usePayments

**Location:** `apps/payments-mfe/src/hooks/usePayments.ts`

```typescript
export function usePayments() {
  return useQuery({
    queryKey: ['payments'],
    queryFn: fetchPayments,
  });
}
```

**Returns:**
- `data: Payment[] | undefined` - Payments list
- `isLoading: boolean` - Loading state
- `error: Error | null` - Error state
- `refetch: () => void` - Manual refetch function

#### useCreatePayment

**Location:** `apps/payments-mfe/src/hooks/usePaymentMutations.ts`

```typescript
export function useCreatePayment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createPayment,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payments'] });
    },
  });
}
```

**Returns:**
- `mutate: (data: CreatePaymentData) => void` - Create payment
- `mutateAsync: (data: CreatePaymentData) => Promise<Payment>` - Async create
- `isPending: boolean` - Mutation loading state
- `error: Error | null` - Error state

#### useUpdatePayment

Similar to `useCreatePayment`, but for updates.

#### useDeletePayment

Similar to `useCreatePayment`, but for deletions.

---

## Role-Based Access Control

### VENDOR Role

**Capabilities:**
- ✅ View all payments
- ✅ Create new payments
- ✅ Update existing payments
- ✅ Delete payments
- ✅ See "Reports" link in header

**UI Elements:**
- "Create Payment" button (visible only to VENDOR)
- "Edit" button on each payment (visible only to VENDOR)
- "Delete" button on each payment (visible only to VENDOR)

### CUSTOMER Role

**Capabilities:**
- ✅ View all payments
- ❌ Cannot create payments
- ❌ Cannot update payments
- ❌ Cannot delete payments
- ❌ Cannot see "Reports" link

**UI Elements:**
- No "Create Payment" button
- No "Edit" or "Delete" buttons
- Read-only view

### Role Checking

**In Components:**
```typescript
import { useAuthStore } from 'shared-auth-store';

const isVendor = useAuthStore((state) => state.hasRole('VENDOR'));
const isCustomer = useAuthStore((state) => state.hasRole('CUSTOMER'));

{isVendor && (
  <button onClick={handleCreate}>Create Payment</button>
)}
```

**Helper Functions:**
```typescript
// Check single role
const isVendor = useAuthStore((state) => state.hasRole('VENDOR'));

// Check multiple roles
const canManagePayments = useAuthStore((state) => 
  state.hasAnyRole(['VENDOR', 'ADMIN'])
);
```

---

## Optimistic Updates

### Implementation

TanStack Query supports optimistic updates for better UX:

```typescript
const updatePayment = useMutation({
  mutationFn: updatePayment,
  onMutate: async (newData) => {
    // Cancel outgoing refetches
    await queryClient.cancelQueries({ queryKey: ['payments'] });

    // Snapshot previous value
    const previousPayments = queryClient.getQueryData(['payments']);

    // Optimistically update
    queryClient.setQueryData(['payments'], (old: Payment[]) =>
      old.map((p) => (p.id === newData.id ? { ...p, ...newData } : p))
    );

    return { previousPayments };
  },
  onError: (err, newData, context) => {
    // Rollback on error
    queryClient.setQueryData(['payments'], context.previousPayments);
  },
  onSettled: () => {
    // Refetch to ensure consistency
    queryClient.invalidateQueries({ queryKey: ['payments'] });
  },
});
```

**Benefits:**
- Immediate UI feedback
- Better perceived performance
- Automatic rollback on error

---

## Error Handling

### Query Errors

```typescript
const { data, error, isError } = usePayments();

if (isError) {
  return <div>Error: {error.message}</div>;
}
```

### Mutation Errors

```typescript
const createPayment = useCreatePayment();

createPayment.mutate(data, {
  onError: (error) => {
    console.error('Failed to create payment:', error);
    // Show error toast/notification
  },
});
```

### Error States

- Network errors
- Validation errors
- Not found errors
- Permission errors (future)

---

## Testing

### Unit Tests

- `apps/payments-mfe/src/components/PaymentsPage.test.tsx`
- `apps/payments-mfe/src/api/stubbedPayments.test.ts`
- `apps/payments-mfe/src/hooks/usePayments.test.tsx`
- `apps/payments-mfe/src/hooks/usePaymentMutations.test.tsx`

### Integration Tests

- `apps/shell/src/integration/PaymentsFlowIntegration.test.tsx` - Complete payments flow

### E2E Tests

- `apps/shell-e2e/src/payments-flow.spec.ts` - Payments E2E tests
- `apps/shell-e2e/src/role-based-access.spec.ts` - RBAC E2E tests

---

## Future Enhancements (POC-2+)

### Planned Features

1. **Real PSP Integration**
   - Actual payment processing
   - Payment gateway integration
   - Transaction history

2. **Payment Filtering**
   - Filter by status
   - Filter by date range
   - Filter by amount

3. **Payment Search**
   - Search by description
   - Search by ID
   - Advanced search

4. **Payment Details**
   - Detailed payment view
   - Payment history
   - Payment receipts

5. **Bulk Operations**
   - Bulk delete
   - Bulk update status
   - Export payments

6. **Real-Time Updates**
   - WebSocket integration
   - Live payment status updates
   - Notifications

---

## API Reference

### Payment Types

```typescript
interface Payment {
  id: string;
  amount: number;
  currency: string;
  description: string;
  status: 'pending' | 'completed' | 'failed';
  createdAt: string;
  updatedAt: string;
  vendorId?: string;
  customerId?: string;
}

interface CreatePaymentData {
  amount: number;
  currency: string;
  description: string;
}

interface UpdatePaymentData {
  amount?: number;
  currency?: string;
  description?: string;
  status?: PaymentStatus;
}
```

### Hooks

```typescript
// Fetch payments
const { data, isLoading, error } = usePayments();

// Create payment
const createPayment = useCreatePayment();
createPayment.mutate(data);

// Update payment
const updatePayment = useUpdatePayment();
updatePayment.mutate({ id, ...data });

// Delete payment
const deletePayment = useDeletePayment();
deletePayment.mutate(id);
```

---

## Troubleshooting

### Payments Not Loading

**Issue:** Payments list is empty or not loading.

**Solution:**
1. Check network tab for API calls
2. Verify TanStack Query is configured
3. Check console for errors
4. Verify mock data exists

### Role-Based UI Not Working

**Issue:** VENDOR sees CUSTOMER UI or vice versa.

**Solution:**
1. Check user role in auth store
2. Verify `hasRole` helper is working
3. Check component conditional rendering

### Optimistic Updates Not Working

**Issue:** UI doesn't update immediately after mutation.

**Solution:**
1. Verify `onMutate` is implemented
2. Check query key matches
3. Verify `setQueryData` is called correctly

---

## Related Documentation

- [`authentication-flow.md`](./authentication-flow.md) - Authentication details
- [`rbac-implementation.md`](./rbac-implementation.md) - RBAC details
- [`poc-1-completion-summary.md`](./poc-1-completion-summary.md) - Overall summary

---

**Status:** ✅ Complete  
**Last Updated:** 2026-01-XX

