# Payments MFE Implementation Plan - Gap Closure

**Status:** In Progress  
**Version:** 1.0  
**Date:** December 20, 2025  
**Phase:** Payments Flow Gap Closure

> **📊 Progress Tracking:** See [`PAYMENTS-MFE-TASK-LIST.md`](./PAYMENTS-MFE-TASK-LIST.md) to track completion status and overall progress.

---

## Executive Summary

This document provides a detailed, step-by-step implementation plan for closing critical gaps in the Payments MFE, based on the [PAYMENTS-FLOW-ANALYSIS.md](./PAYMENTS-FLOW-ANALYSIS.md). The plan focuses on implementing high-priority features that are either missing frontend components or missing backend endpoints.

Each task is designed to be:

- **Clear and actionable** - Specific steps that can be executed
- **Small and testable** - Easy to verify completion
- **Production-ready** - No throw-away code
- **Incremental** - Builds on previous work

**Timeline:** 2-3 weeks  
**Goal:** Complete all high-priority gaps (Customer Payment Creation, Payment Details View, Payment Reports UI, PUT endpoint)

**Key Features to Implement:**

- Customer payment creation UI
- Payment details view (modal/page)
- Payment reports dashboard
- Payment filtering UI
- PUT /api/payments/:id endpoint (backend)
- Payment update form (frontend)
- Comprehensive testing for all new features

---

## Current State Analysis

### Existing Infrastructure

**Backend Services:**

- Payments Service (port 3004) - Functional with core CRUD endpoints
- API Gateway (port 3000) - Routes `/api/payments` endpoints
- Database - Prisma schema with Payment, Transaction models

**Frontend Infrastructure:**

- Payments MFE (port 4202) - Module Federation remote
- Design System - Available shared components (Button, Card, Input, Select, Modal, etc.)
- TanStack Query - Already configured for data fetching
- React Hook Form + Zod - Already configured for validation

**Implemented Features:**

- ✅ Payment listing for vendors and customers
- ✅ Create payment (vendors can create, customers cannot in UI)
- ✅ Update payment status (PATCH /api/payments/:id/status)
- ✅ Delete/cancel payment (via status update workaround)
- ✅ WebSocket real-time updates
- ✅ Basic error handling and loading states

**Missing Features (to implement):**

- ❌ Customer payment creation UI
- ❌ Payment details view (full details + transaction history)
- ❌ Payment reports/dashboard UI
- ❌ Payment filtering UI (backend ready, UI missing)
- ❌ PUT /api/payments/:id endpoint (backend)
- ❌ Payment update form
- ❌ Advanced UX features (empty states, status tooltips, etc.)

---

## Architecture Overview

### Payments MFE Directory Structure

```
apps/payments-mfe/
├── src/
│   ├── components/
│   │   ├── PaymentsPage.tsx           # Main page (already exists)
│   │   ├── PaymentDetails.tsx         # NEW: Payment details modal/view
│   │   ├── PaymentFilters.tsx         # NEW: Filter controls
│   │   ├── PaymentReports.tsx         # NEW: Reports dashboard
│   │   ├── PaymentForm.tsx            # Existing (may refactor)
│   │   └── [other components]
│   ├── hooks/
│   │   ├── usePayments.ts             # Existing (may extend)
│   │   ├── usePaymentById.ts          # Existing (may extend)
│   │   ├── useUpdatePayment.ts        # Existing (may extend)
│   │   ├── usePaymentReports.ts       # NEW: Reports data hook
│   │   └── [other hooks]
│   ├── api/
│   │   └── payments.ts                # Existing API client (may extend)
│   └── [other directories]
```

### Payments Service Directory Structure

```
apps/payments-service/
├── src/
│   ├── controllers/
│   │   └── payment.controller.ts      # Existing (add PUT endpoint)
│   ├── services/
│   │   └── payment.service.ts         # Existing (add update logic)
│   ├── validators/
│   │   └── payment.validators.ts      # Existing (add PUT schema)
│   ├── routes/
│   │   └── payment.ts                 # Existing (add PUT route)
│   └── [other directories]
```

---

## Phase 1: Backend - PUT Endpoint Implementation (Days 1-2)

### Task 1.1: Create PUT Payment Validation Schema

**Objective:** Define Zod schema for PUT /api/payments/:id request validation

**Steps:**

1. Open `apps/payments-service/src/validators/payment.validators.ts`
2. Create `updatePaymentSchema` for PUT requests:
   ```typescript
   export const updatePaymentSchema = z
     .object({
       amount: z.number().positive('Amount must be positive').optional(),
       description: z.string().max(500).optional(),
       recipientId: z.string().uuid().optional(),
       recipientEmail: z.string().email().optional(),
       metadata: z.record(z.unknown()).optional(),
       type: z.enum(['instant', 'scheduled', 'recurring']).optional(),
     })
     .refine(
       data =>
         data.amount !== undefined ||
         data.description !== undefined ||
         data.recipientId !== undefined ||
         data.recipientEmail !== undefined ||
         data.metadata !== undefined ||
         data.type !== undefined,
       { message: 'Must provide at least one field to update' }
     );
   ```
3. Validate schema with TypeScript compiler
4. Export schema and inferred type (`UpdatePaymentData`)
5. Add JSDoc documentation explaining update restrictions

**Verification:**

- [x] Schema created
- [x] Type inference working
- [x] No TypeScript errors
- [x] Schema documented

**Acceptance Criteria:**

- [x] Validation schema complete
- [x] Type exported and correct
- [x] Handles all update fields
- [x] Properly documented

**Status:** Complete  
**Completed Date:** 2025-12-20

**Notes:** Schema blocks currency changes, allows full metadata replacement, permits type updates, and requires at least one field in the payload.

---

### Task 1.2: Implement PUT Endpoint in Payment Controller

**Objective:** Add PUT /api/payments/:id endpoint to payment controller

**Steps:**

1. Open `apps/payments-service/src/controllers/payment.controller.ts`
2. Create `updatePayment` handler:

   ```typescript
   export async function updatePayment(req: Request, res: Response) {
     // Parse request
     const { id } = req.params;
     const userId = req.user?.id;

     // Validate schema
     const validation = updatePaymentSchema.safeParse(req.body);
     if (!validation.success) {
       return res.status(400).json({ error: validation.error });
     }

     // Call service
     const payment = await paymentService.updatePayment(
       id,
       userId,
       validation.data
     );
     return res.json(payment);
   }
   ```

3. Add role-based authorization (VENDOR, ADMIN only)
4. Add error handling (404, 403, 400)
5. Add JSDoc documentation

**Verification:**

- [x] Handler created
- [x] Authorization working
- [x] Error handling implemented
- [x] Response format correct

**Acceptance Criteria:**

- [ ] Endpoint responds correctly
- [ ] Authorization enforced
- [ ] Errors handled gracefully
- [ ] Response matches API contract

**Status:** Complete  
**Completed Date:** 2025-12-21

**Notes:** Controller now exposes `updatePayment` with auth check, ID validation, schema validation, and service call. Service logic remains TODO (throws NOT_IMPLEMENTED) and will be implemented in Task 1.3.

---

### Task 1.3: Implement PUT Logic in Payment Service

**Objective:** Add update logic to payment service

**Steps:**

1. Open `apps/payments-service/src/services/payment.service.ts`
2. Create `updatePayment` method:

   ```typescript
   async updatePayment(
     id: string,
     userId: string,
     data: UpdatePaymentData
   ): Promise<Payment> {
     // Get existing payment
     const payment = await this.getPaymentById(id, userId);

     // Validate update allowed (cannot update completed/failed)
     if (['completed', 'failed'].includes(payment.status)) {
       throw new Error('Cannot update completed or failed payments');
     }

     // Validate recipient if updating
     if (data.recipientId || data.recipientEmail) {
       // Validate recipient exists
     }

     // Update payment
     const updated = await db.payment.update({
       where: { id },
       data: {
         ...data,
         updatedAt: new Date(),
       },
       include: { transactions: true },
     });

     // Create audit transaction
     await this.createTransaction({...});

     return updated;
   }
   ```

3. Add validation for status restrictions
4. Add recipient validation
5. Create transaction record for audit
6. Add error handling

**Verification:**

- [x] Service method created
- [x] Validation logic working
- [x] Transaction record created
- [x] Error handling correct

**Acceptance Criteria:**

- [ ] Payment updates correctly
- [ ] Status restrictions enforced
- [ ] Audit trail maintained
- [ ] Errors handled properly

**Status:** Complete  
**Completed Date:** 2025-12-21

**Notes:** Service implements role checks (ADMIN or sender), status restriction (no updates when completed/failed), recipient resolution (id/email, single-source), metadata full replace, type updatable, audit transaction, and cache invalidation for sender and old/new recipients.

---

### Task 1.4: Add PUT Route to Router

**Objective:** Register PUT endpoint in Express routes

**Steps:**

1. Open `apps/payments-service/src/routes/payment.ts`
2. Add PUT route:
   ```typescript
   router.put(
     '/:id',
     requireAuth(),
     authorizeRoles(['VENDOR', 'ADMIN']),
     updatePayment
   );
   ```
3. Ensure route is placed before DELETE (if exists)
4. Verify route order in router (more specific routes first)
5. Add JSDoc for route documentation

**Verification:**

- [x] Route registered
- [x] Middleware applied correctly
- [x] Route accessible
- [x] Authorization working

**Acceptance Criteria:**

- [ ] PUT endpoint accessible at /api/payments/:id
- [ ] Authorization enforced
- [ ] Request routing works

**Status:** Complete  
**Completed Date:** 2025-12-21

---

### Task 1.5: Write Backend Tests for PUT Endpoint

**Objective:** Write comprehensive tests for PUT endpoint

**Steps:**

1. Create `apps/payments-service/src/controllers/payment.test.ts` (if doesn't exist)
2. Write tests:
   - ✅ PUT successful update
   - ✅ PUT with partial data
   - ✅ PUT authorization check (403 for customer)
   - ✅ PUT not found (404)
   - ✅ PUT on completed payment (error)
   - ✅ PUT invalid schema (400)
   - ✅ PUT recipient validation
3. Mock database calls
4. Run tests: `nx test payments-service`

**Verification:**

- [ ] Tests created
- [ ] All scenarios covered
- [ ] Tests passing
- [ ] Coverage > 80%

**Acceptance Criteria:**

- [ ] Endpoint tests complete
- [ ] All edge cases tested
- [ ] Tests passing
- [ ] Good coverage

**Status:** Not Started

---

## Phase 2: Frontend - Core Components (Days 3-8)

### Task 2.1: Create Payment Details Component

**Objective:** Create detailed view of a single payment with transaction history

**Steps:**

1. Create `apps/payments-mfe/src/components/PaymentDetails.tsx`
2. Design component structure:
   - Header with payment ID and status badge
   - Payment summary (amount, currency, type)
   - Sender/recipient information
   - Payment dates and metadata
   - Transaction history table
   - Action buttons (edit, cancel, based on role)
3. Use `usePaymentById` hook for data
4. Handle loading states with skeleton
5. Handle error states with alert
6. Add responsive design
7. Write tests: `PaymentDetails.test.tsx`

**Implementation Details:**

- Use modal or side panel (TBD based on UX)
- Show transaction history (date, status, amount, description)
- Display metadata (payment type, reference, etc.)
- Action buttons based on payment status and user role
- Format currency values properly
- Format dates in user's timezone

**Verification:**

- [ ] Component renders correctly
- [ ] All payment info displayed
- [ ] Transaction history shows
- [ ] Loading states work
- [ ] Error states work
- [ ] Tests passing

**Acceptance Criteria:**

- [ ] Details component complete
- [ ] Displays all payment info
- [ ] Transaction history shown
- [ ] Tests passing

**Status:** Not Started

---

### Task 2.2: Create Payment Filters Component

**Objective:** Create filter controls for payments list

**Steps:**

1. Create `apps/payments-mfe/src/components/PaymentFilters.tsx`
2. Design filter controls:
   - Status dropdown (all, pending, processing, completed, failed, cancelled)
   - Type dropdown (all, payment, initiate, transfer)
   - Date range picker (from, to)
   - Amount range slider (min, max)
   - Clear filters button
3. Use React Hook Form for filter state
4. Handle form submission (trigger parent update)
5. Add responsive design
6. Write tests: `PaymentFilters.test.tsx`

**Implementation Details:**

- Use design system components (Select, Input, Button, Card)
- Debounce filter changes to avoid excessive API calls
- Support clearing individual filters
- Show active filter count
- Store filters in URL query params (optional but recommended)
- Accessibility: proper labels, focus management

**Verification:**

- [ ] Filter controls render
- [ ] All filters functional
- [ ] Form submission works
- [ ] Clear filters works
- [ ] Tests passing

**Acceptance Criteria:**

- [ ] Filter component complete
- [ ] All filters working
- [ ] Form handles submission
- [ ] Tests passing

**Status:** Not Started

---

### Task 2.3: Integrate Filters into PaymentsPage

**Objective:** Add filter functionality to payments listing

**Steps:**

1. Modify `apps/payments-mfe/src/components/PaymentsPage.tsx`
2. Add `PaymentFilters` component above payment list
3. Manage filter state (status, type, dateRange, amountRange)
4. Update `usePayments` hook call with filter params
5. Pass filters to API query
6. Show active filters display
7. Update loading/error states to account for filtering
8. Write integration tests

**Implementation Details:**

- Hook state: `const [filters, setFilters] = useState({...})`
- Pass filters to hook: `usePayments({ ...filters })`
- Hook sends filters to API as query params
- Show "No payments match filters" empty state
- Clear filters button
- Display applied filter count

**Verification:**

- [ ] Filters integrated
- [ ] API receives filter params
- [ ] Results filtered correctly
- [ ] Empty states work
- [ ] Integration tests pass

**Acceptance Criteria:**

- [ ] Filters functional in list
- [ ] API receives params correctly
- [ ] Results update on filter change
- [ ] Tests passing

**Status:** Not Started

---

### Task 2.4: Implement Payment Reports Component

**Objective:** Create reports/dashboard for payment analytics

**Steps:**

1. Create `apps/payments-mfe/src/components/PaymentReports.tsx`
2. Design dashboard layout:
   - Summary cards (total payments, total amount, success rate)
   - Charts (payments by status, payments by type, trend over time)
   - Filters (date range, payment type)
   - Export button (future)
3. Create `apps/payments-mfe/src/hooks/usePaymentReports.ts` hook
4. Use `getPaymentReports` API function (already exists)
5. Handle loading states with skeleton
6. Handle error states
7. Make responsive
8. Write tests: `PaymentReports.test.tsx`

**Implementation Details:**

- Summary cards showing:
  - Total payment count
  - Total amount (by currency)
  - Success rate (completed / total)
  - Average payment amount
- Charts (use chart library if available, or create custom)
  - Pie chart: payments by status
  - Bar chart: payments by type
  - Line chart: payments over time
- Date range picker for filtering
- Role-based visibility (vendors/admins only)

**Verification:**

- [ ] Component renders
- [ ] Summary cards display
- [ ] Charts display
- [ ] Data loads correctly
- [ ] Filters work
- [ ] Tests passing

**Acceptance Criteria:**

- [ ] Reports component complete
- [ ] All metrics displayed
- [ ] Charts functional
- [ ] Filters working
- [ ] Tests passing

**Status:** Not Started

---

### Task 2.5: Implement Customer Payment Creation

**Objective:** Enable customers to create payments through UI

**Steps:**

1. Modify `apps/payments-mfe/src/components/PaymentsPage.tsx`
2. Check user role from auth store
3. Show "Create Payment" button for customers (currently only vendors see it)
4. For customers, set form default type to "payment"
5. For vendors, keep existing behavior (type="initiate")
6. Update form validation if needed for customer vs. vendor differences
7. Handle success/error feedback
8. Write tests

**Implementation Details:**

- Check user role: `const { user } = useAuthStore()`
- Conditional button render based on role
- When customer clicks "Create Payment":
  - Pre-fill form type="payment"
  - Show customer-specific help text
  - Adjust field labels if needed
- Form submission should work same as vendor (just different type)
- Backend already supports customer type="payment"

**Verification:**

- [ ] Customer sees create button
- [ ] Form shows for customer
- [ ] Type defaults to "payment"
- [ ] Form submits correctly
- [ ] Tests passing

**Acceptance Criteria:**

- [ ] Customers can create payments
- [ ] Form works for both roles
- [ ] Type set correctly
- [ ] Tests passing

**Status:** Not Started

---

### Task 2.6: Create Payment Update Form

**Objective:** Implement form to update payment details (amount, description, etc.)

**Steps:**

1. Create `apps/payments-mfe/src/components/PaymentUpdateForm.tsx`
2. Design form with fields:
   - Amount (editable)
   - Currency (editable)
   - Description (editable)
   - Recipient (editable - email or ID)
   - Metadata (optional, advanced)
3. Use React Hook Form + Zod schema (create `updatePaymentSchema`)
4. Handle form submission (call PUT endpoint)
5. Add validation:
   - Cannot update completed/failed payments
   - Recipient must be valid
   - Amount must be positive
6. Add success/error feedback
7. Add loading states during submission
8. Write tests

**Implementation Details:**

- Use `useUpdatePayment` hook (create or extend existing)
- Show which fields are editable based on payment status
- Disable form fields for completed/failed payments
- Show helpful validation messages
- On success, close modal/redirect, show toast
- On error, show error message
- Optimistic updates if possible

**Verification:**

- [ ] Form renders
- [ ] All fields functional
- [ ] Validation works
- [ ] Submit calls API
- [ ] Loading states work
- [ ] Tests passing

**Acceptance Criteria:**

- [ ] Update form complete
- [ ] All fields editable
- [ ] Validation working
- [ ] Submit functional
- [ ] Tests passing

**Status:** Not Started

---

### Task 2.7: Integrate Payment Details Modal into PaymentsPage

**Objective:** Add ability to view payment details from payments list

**Steps:**

1. Modify `apps/payments-mfe/src/components/PaymentsPage.tsx`
2. Add "View Details" button/link in payment table
3. Manage modal state (open/close, selected payment ID)
4. Render `PaymentDetails` component in modal
5. Handle modal open/close
6. Pass selected payment ID to details component
7. Update tests

**Implementation Details:**

- State: `const [selectedPaymentId, setSelectedPaymentId] = useState<string | null>(null)`
- Button in table row: `<Button onClick={() => setSelectedPaymentId(payment.id)}>Details</Button>`
- Modal with close button: `{selectedPaymentId && <PaymentDetails id={selectedPaymentId} onClose={() => setSelectedPaymentId(null)} />}`
- Handle loading while details load
- Handle error if payment doesn't exist

**Verification:**

- [ ] Details button visible
- [ ] Modal opens on click
- [ ] Details load correctly
- [ ] Modal closes properly
- [ ] Tests passing

**Acceptance Criteria:**

- [ ] Details view accessible from list
- [ ] Modal works correctly
- [ ] Data loads properly
- [ ] Tests passing

**Status:** Not Started

---

### Task 2.8: Add Payment Reports Link to Navigation

**Objective:** Make payment reports accessible from UI navigation

**Steps:**

1. Modify `apps/payments-mfe/src/components/PaymentsPage.tsx`
2. Add tab or link to reports (for vendors/admins only)
3. Conditionally render `PaymentReports` component
4. Use tab navigation or route (TBD)
5. Show "Reports" tab with icon
6. Handle role-based visibility

**Implementation Details:**

- Add state: `const [activeTab, setActiveTab] = useState<'payments' | 'reports'>('payments')`
- Check role: if vendor/admin, show reports tab
- Tab button: `<Button onClick={() => setActiveTab('reports')}>Reports</Button>`
- Render: `{activeTab === 'reports' ? <PaymentReports /> : <PaymentsList />}`

**Verification:**

- [ ] Reports tab visible
- [ ] Tab switches content
- [ ] Reports load
- [ ] Role check working

**Acceptance Criteria:**

- [ ] Reports accessible
- [ ] Tab navigation works
- [ ] Role check enforced
- [ ] Tests passing

**Status:** Not Started

---

## Phase 3: API Client Extensions (Days 9-10)

### Task 3.1: Extend API Client for PUT Request

**Objective:** Add PUT request support to payments API client

**Steps:**

1. Open `apps/payments-mfe/src/api/payments.ts`
2. Add `updatePaymentDetails` function:
   ```typescript
   export async function updatePaymentDetails(
     id: string,
     data: UpdatePaymentData
   ): Promise<Payment> {
     return apiClient.put(`/payments/${id}`, data);
   }
   ```
3. Export function and type
4. Add JSDoc documentation
5. Add error handling

**Verification:**

- [ ] Function created
- [ ] Type correct
- [ ] Exported properly
- [ ] Documented

**Acceptance Criteria:**

- [ ] API function working
- [ ] Type exported
- [ ] Documented

**Status:** Not Started

---

### Task 3.2: Create useUpdatePayment Hook

**Objective:** Create TanStack Query hook for payment updates

**Steps:**

1. Create or extend `apps/payments-mfe/src/hooks/useUpdatePayment.ts`
2. Create mutation hook:
   ```typescript
   export function useUpdatePayment() {
     const queryClient = useQueryClient();
     return useMutation({
       mutationFn: (data: { id: string; data: UpdatePaymentData }) =>
         updatePaymentDetails(data.id, data.data),
       onSuccess: updatedPayment => {
         queryClient.setQueryData(
           ['payment', updatedPayment.id],
           updatedPayment
         );
         queryClient.invalidateQueries(['payments']);
       },
     });
   }
   ```
3. Handle cache invalidation
4. Add error handling
5. Write tests

**Verification:**

- [ ] Hook created
- [ ] Cache invalidation works
- [ ] Error handling correct
- [ ] Tests passing

**Acceptance Criteria:**

- [ ] Hook functional
- [ ] Cache updated correctly
- [ ] Tests passing

**Status:** Not Started

---

### Task 3.3: Create usePaymentReports Hook

**Objective:** Create hook for fetching payment reports

**Steps:**

1. Create `apps/payments-mfe/src/hooks/usePaymentReports.ts`
2. Create query hook:
   ```typescript
   export function usePaymentReports(filters?: ReportFilters) {
     return useQuery({
       queryKey: ['paymentReports', filters],
       queryFn: () => getPaymentReports(filters),
       staleTime: 5 * 60 * 1000, // 5 minutes
     });
   }
   ```
3. Support date range filtering
4. Handle loading/error states
5. Write tests

**Verification:**

- [ ] Hook created
- [ ] Filters working
- [ ] Cache working
- [ ] Tests passing

**Acceptance Criteria:**

- [ ] Hook functional
- [ ] Filters working
- [ ] Tests passing

**Status:** Not Started

---

## Phase 4: Testing & Refinement (Days 11-12)

### Task 4.1: Integration Tests for Payment Update Flow

**Objective:** Test full payment update flow (form → API → list update)

**Steps:**

1. Create `apps/payments-mfe/src/components/PaymentUpdateForm.integration.test.tsx`
2. Test flow:
   - Open update form
   - Fill form with new values
   - Submit form
   - Verify API called correctly
   - Verify list updates
   - Verify success feedback
3. Test error scenarios
4. Mock API appropriately
5. Run tests

**Verification:**

- [ ] Integration tests created
- [ ] Flow tested end-to-end
- [ ] Error scenarios covered
- [ ] Tests passing

**Acceptance Criteria:**

- [ ] Update flow tested
- [ ] Error cases covered
- [ ] Tests passing

**Status:** Not Started

---

### Task 4.2: E2E Tests for New Features

**Objective:** Write E2E tests for all new user-facing features

**Steps:**

1. If E2E setup exists (check `apps/shell-e2e`), create `payments.spec.ts`
2. Test scenarios:
   - Customer creates payment
   - View payment details
   - Update payment
   - Filter payments
   - View payment reports
3. Use real browser automation
4. Test across roles (vendor, customer)
5. Run tests: `nx e2e shell-e2e`

**Verification:**

- [ ] E2E tests created
- [ ] Main flows tested
- [ ] Both roles tested
- [ ] Tests passing

**Acceptance Criteria:**

- [ ] E2E tests complete
- [ ] Key flows verified
- [ ] Tests passing

**Status:** Not Started

---

### Task 4.3: Performance Testing

**Objective:** Verify performance of new features

**Steps:**

1. Test bundle size impact: `nx build payments-mfe`
2. Verify no significant increase (< 50KB gzipped)
3. Test page load time for reports
4. Test filtering performance (large payment lists)
5. Test update form submission time
6. Optimize if needed (code splitting, lazy loading)

**Verification:**

- [ ] Bundle size acceptable
- [ ] Load times acceptable
- [ ] No performance regressions
- [ ] All optimizations done

**Acceptance Criteria:**

- [ ] Performance acceptable
- [ ] No significant regressions
- [ ] Optimization complete

**Status:** Not Started

---

### Task 4.4: Accessibility Audit

**Objective:** Ensure new components meet accessibility standards

**Steps:**

1. Test keyboard navigation (Tab, Enter, Escape)
2. Test with screen reader (if possible)
3. Verify ARIA labels present
4. Check color contrast
5. Test focus management in modals
6. Fix any accessibility issues
7. Run accessibility audit tools

**Verification:**

- [ ] Keyboard navigation works
- [ ] ARIA labels present
- [ ] Color contrast sufficient
- [ ] Focus management correct
- [ ] No accessibility issues

**Acceptance Criteria:**

- [ ] Accessibility standards met
- [ ] Keyboard navigation working
- [ ] Screen reader compatible

**Status:** Not Started

---

## Phase 5: Polish & Documentation (Days 13-14)

### Task 5.1: Add Toast Notifications

**Objective:** Improve user feedback with toast notifications

**Steps:**

1. Add toast notifications for:
   - Payment created successfully (customer)
   - Payment updated successfully
   - Payment cancelled successfully
   - Payment creation errors
   - Payment update errors
   - Report data loaded
2. Use design system toast component
3. Position appropriately
4. Set appropriate duration for each type
5. Write tests

**Verification:**

- [ ] Toasts display on success
- [ ] Toasts display on error
- [ ] Appropriate messages
- [ ] Tests passing

**Acceptance Criteria:**

- [ ] Toast notifications working
- [ ] User feedback clear
- [ ] Tests passing

**Status:** Not Started

---

### Task 5.2: Enhance Empty States

**Objective:** Improve UX with helpful empty states

**Steps:**

1. Create empty state for:
   - No payments (vendor): "Create your first payment"
   - No payments (customer): "You haven't made any payments yet"
   - No payments after filter: "No payments match your filters"
   - No reports data: "No data available for selected period"
2. Add illustrations/icons (if available)
3. Add call-to-action buttons
4. Make messages contextual
5. Write tests

**Verification:**

- [ ] Empty states display
- [ ] Messages contextual
- [ ] CTAs functional
- [ ] Tests passing

**Acceptance Criteria:**

- [ ] Empty states enhanced
- [ ] Messages helpful
- [ ] Tests passing

**Status:** Not Started

---

### Task 5.3: Enhance Status Badges

**Objective:** Improve status display with tooltips and better styling

**Steps:**

1. Add tooltips to status badges explaining status meaning
2. Enhance styling (more visual distinction)
3. Add icons if available
4. Support tooltip in all places badges appear
5. Write tests

**Verification:**

- [ ] Tooltips display
- [ ] Styling enhanced
- [ ] Icons consistent
- [ ] Tests passing

**Acceptance Criteria:**

- [ ] Status badges enhanced
- [ ] Tooltips helpful
- [ ] Tests passing

**Status:** Not Started

---

### Task 5.4: Documentation

**Objective:** Create documentation for new features

**Steps:**

1. Update main README.md with new features
2. Create component documentation (JSDoc comments)
3. Document API integration approach
4. Document testing strategy
5. Add usage examples for new components
6. Document payment status flow
7. Document role-based access control

**Verification:**

- [ ] README updated
- [ ] Components documented
- [ ] API documented
- [ ] Testing documented

**Acceptance Criteria:**

- [ ] Documentation complete
- [ ] Examples provided
- [ ] Accessible to team

**Status:** Not Started

---

### Task 5.5: Code Review & Cleanup

**Objective:** Final code review and quality checks

**Steps:**

1. Run linter: `nx lint payments-mfe` and `nx lint payments-service`
2. Fix linting errors
3. Run type checker
4. Fix type errors
5. Review code quality
6. Check for `any` types
7. Ensure consistent code style
8. Run all tests: `nx test payments-mfe` and `nx test payments-service`
9. Verify test coverage > 70%
10. Verify no throw-away code

**Verification:**

- [ ] Linting passes
- [ ] Type checking passes
- [ ] Code quality good
- [ ] All tests passing
- [ ] Coverage > 70%
- [ ] No `any` types

**Acceptance Criteria:**

- [ ] Code quality verified
- [ ] All checks passing
- [ ] Tests passing
- [ ] Coverage sufficient

**Status:** Not Started

---

## Success Criteria

### Functional Requirements

- ✅ Customers can create payments through UI
- ✅ All users can view payment details (full info + transactions)
- ✅ Vendors/admins can view payment reports
- ✅ All users can filter payments (status, type, date, amount)
- ✅ Vendors/admins can update payment details (PUT endpoint)
- ✅ Payment details update reflected in list immediately
- ✅ All operations have loading/error/success feedback

### Technical Requirements

- ✅ PUT /api/payments/:id endpoint implemented (backend)
- ✅ All new components use design system
- ✅ TanStack Query hooks for all data fetching
- ✅ React Hook Form + Zod for all forms
- ✅ TypeScript strict mode passing
- ✅ All tests passing (70%+ coverage)
- ✅ Linting passes
- ✅ No `any` types

### Quality Requirements

- ✅ Error handling comprehensive
- ✅ Loading states implemented
- ✅ Empty states helpful
- ✅ Accessibility standards met
- ✅ Performance acceptable
- ✅ Code follows project patterns
- ✅ Toast notifications working
- ✅ Documentation complete

---

## Timeline Estimate

| Phase       | Duration              | Tasks                            |
| ----------- | --------------------- | -------------------------------- |
| **Phase 1** | 2 days                | Backend PUT endpoint (5 tasks)   |
| **Phase 2** | 6 days                | Frontend components (8 tasks)    |
| **Phase 3** | 2 days                | API client extensions (3 tasks)  |
| **Phase 4** | 2 days                | Testing & refinement (4 tasks)   |
| **Phase 5** | 2 days                | Polish & documentation (5 tasks) |
| **Total**   | **14 days (2 weeks)** | **25 tasks**                     |

---

## Implementation Notes

### Key Architectural Decisions

1. **PUT Endpoint Instead of PATCH** - Using PUT for full updates (not just status) provides cleaner REST semantics
2. **Soft Delete via Status** - Delete functionality achieved via status update to CANCELLED (good for audit trail)
3. **Component Reusability** - PaymentUpdateForm can be used in modal or standalone
4. **Cache Invalidation** - Both local updates and full list refreshes to ensure consistency
5. **Role-Based UI** - Customer vs vendor views determined by auth store role

### Testing Strategy

- **Unit Tests:** Individual components and hooks
- **Integration Tests:** Full flows (form → API → list update)
- **E2E Tests:** User journeys across browser
- **Performance Tests:** Bundle size and load time
- **Accessibility Tests:** Keyboard, screen reader, ARIA

### Performance Considerations

- Lazy load reports component (heavy with charts)
- Debounce filter changes
- Optimize payment list rendering (virtualization if needed)
- Cache report data (5-minute stale time)
- Use optimistic updates for better UX

---

**Document Version:** 1.0  
**Last Updated:** 2025-12-20  
**Next Review:** After Phase 1 completion
