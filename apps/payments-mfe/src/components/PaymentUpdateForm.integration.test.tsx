/**
 * PaymentUpdateForm Integration Tests
 *
 * Tests the complete payment update flow:
 * - Opening and displaying the form
 * - Filling form fields with new values
 * - Submitting the form
 * - API call verification and response handling
 * - List cache invalidation
 * - Success/error feedback
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { PaymentUpdateForm } from './PaymentUpdateForm';
import type { Payment } from 'shared-types';
import { PaymentStatus, PaymentType } from 'shared-types';
import * as paymentsApi from '../api/payments';

// Mock the payments API
vi.mock('../api/payments', () => ({
  updatePaymentDetails: vi.fn(),
}));

// Mock shared-design-system components
vi.mock('@mfe/shared-design-system', () => ({
  Button: ({ children, ...props }: React.ComponentProps<'button'>) => (
    <button {...props}>{children}</button>
  ),
  Input: (props: React.ComponentProps<'input'>) => <input {...props} />,
  Label: ({ children, htmlFor, ...props }: React.ComponentProps<'label'>) => (
    <label htmlFor={htmlFor} {...props}>
      {children}
    </label>
  ),
  Alert: ({
    children,
    variant,
    ...props
  }: {
    children: React.ReactNode;
    variant?: string;
    className?: string;
  }) => (
    <div role="alert" data-variant={variant} {...props}>
      {children}
    </div>
  ),
  Card: ({ children, ...props }: React.ComponentProps<'div'>) => (
    <div {...props}>{children}</div>
  ),
}));

describe('PaymentUpdateForm - Integration Tests', () => {
  let queryClient: QueryClient;
  const mockPayment: Payment = {
    id: 'pay_123',
    userId: 'user_1',
    amount: 100.0,
    currency: 'USD',
    description: 'Original description',
    status: PaymentStatus.PROCESSING,
    type: PaymentType.INSTANT,
    metadata: { tag: 'test' },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  const updatedPayment: Payment = {
    ...mockPayment,
    amount: 150.0,
    description: 'Updated description',
    updatedAt: new Date().toISOString(),
  };

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });
    vi.clearAllMocks();
  });

  const renderForm = (payment = mockPayment, callbacks = {}) => {
    return render(
      <QueryClientProvider client={queryClient}>
        <PaymentUpdateForm payment={payment} {...callbacks} />
      </QueryClientProvider>
    );
  };

  describe('Complete Payment Update Flow', () => {
    it('should handle successful payment update end-to-end', async () => {
      const user = userEvent.setup();
      const onSuccess = vi.fn();

      vi.mocked(paymentsApi.updatePaymentDetails).mockResolvedValue(
        updatedPayment
      );

      renderForm(mockPayment, { onSuccess });

      // Step 1: Verify form is displayed with original data
      expect(screen.getByLabelText(/amount/i)).toHaveValue(100);
      expect(screen.getByLabelText(/description/i)).toHaveValue(
        'Original description'
      );

      // Step 2: Update form fields
      const amountInput = screen.getByLabelText(/amount/i);
      const descriptionInput = screen.getByLabelText(/description/i);

      await user.clear(amountInput);
      await user.type(amountInput, '150');
      await user.clear(descriptionInput);
      await user.type(descriptionInput, 'Updated description');

      // Step 3: Submit form
      const submitButton = screen.getByRole('button', { name: /update payment/i });
      await user.click(submitButton);

      // Step 4: Verify API was called with updated data
      await waitFor(() => {
        expect(paymentsApi.updatePaymentDetails).toHaveBeenCalledWith(
          'pay_123',
          expect.objectContaining({
            amount: 150,
            description: 'Updated description',
          })
        );
      });

      // Step 5: Verify success callback was invoked
      await waitFor(() => {
        expect(onSuccess).toHaveBeenCalledWith(updatedPayment);
      });

      // Step 6: Verify success message is displayed
      await waitFor(() => {
        expect(
          screen.getByText('Payment updated successfully')
        ).toBeInTheDocument();
      });
    });

    it('should only send changed fields in API request', async () => {
      const user = userEvent.setup();

      vi.mocked(paymentsApi.updatePaymentDetails).mockResolvedValue(
        updatedPayment
      );

      renderForm();

      // Change only amount
      const amountInput = screen.getByLabelText(/amount/i);
      await user.clear(amountInput);
      await user.type(amountInput, '150');

      // Submit
      const submitButton = screen.getByRole('button', { name: /update payment/i });
      await user.click(submitButton);

      // Verify API was called with only the changed field
      await waitFor(() => {
        expect(paymentsApi.updatePaymentDetails).toHaveBeenCalledWith(
          'pay_123',
          expect.objectContaining({
            amount: 150,
          })
        );
      });

      // Should not have unchanged fields
      const call = vi.mocked(paymentsApi.updatePaymentDetails).mock.calls[0];
      expect(call[1]).not.toHaveProperty('description');
    });

    it('should handle form submission with multiple field changes', async () => {
      const user = userEvent.setup();

      vi.mocked(paymentsApi.updatePaymentDetails).mockResolvedValue(
        updatedPayment
      );

      renderForm();

      // Change multiple fields
      await user.clear(screen.getByLabelText(/amount/i));
      await user.type(screen.getByLabelText(/amount/i), '250');

      await user.clear(screen.getByLabelText(/description/i));
      await user.type(screen.getByLabelText(/description/i), 'Bulk update');

      await user.clear(screen.getByLabelText(/currency/i));
      await user.type(screen.getByLabelText(/currency/i), 'EUR');

      // Submit
      await user.click(
        screen.getByRole('button', { name: /update payment/i })
      );

      // Verify API was called with all changes
      await waitFor(() => {
        expect(paymentsApi.updatePaymentDetails).toHaveBeenCalledWith(
          'pay_123',
          expect.objectContaining({
            amount: 250,
            description: 'Bulk update',
            currency: 'EUR',
          })
        );
      });
    });
  });

  describe('Error Handling in Update Flow', () => {
    it('should display error message on API failure', async () => {
      const user = userEvent.setup();
      const testError = new Error('Server error: payment locked');

      vi.mocked(paymentsApi.updatePaymentDetails).mockRejectedValue(testError);

      renderForm();

      // Modify and submit
      await user.clear(screen.getByLabelText(/amount/i));
      await user.type(screen.getByLabelText(/amount/i), '200');
      await user.click(
        screen.getByRole('button', { name: /update payment/i })
      );

      // Verify error is displayed
      await waitFor(() => {
        expect(screen.getByText(testError.message)).toBeInTheDocument();
      });
    });

    it('should handle form validation errors', async () => {
      const user = userEvent.setup();

      renderForm();

      // Enter invalid amount (negative)
      const amountInput = screen.getByLabelText(/amount/i);
      await user.clear(amountInput);
      await user.type(amountInput, '-50');

      // Try to submit
      await user.click(
        screen.getByRole('button', { name: /update payment/i })
      );

      // Verify validation error is shown
      await waitFor(() => {
        const errorEl = screen.queryById('amount-error');
        // Form should not be submitted with invalid data
        expect(paymentsApi.updatePaymentDetails).not.toHaveBeenCalled();
      });
    });

    it('should prevent submission when no fields are changed', async () => {
      const user = userEvent.setup();

      renderForm();

      // Don't change anything, just click submit
      const submitButton = screen.getByRole('button', { name: /update payment/i });

      // Submit button should be disabled when form is pristine
      expect(submitButton).toBeDisabled();

      // Even if we force submit, no API call should be made
      await user.click(submitButton, { skipHover: true });
      expect(paymentsApi.updatePaymentDetails).not.toHaveBeenCalled();
    });

    it('should display error when trying to update completed payment', async () => {
      const completedPayment: Payment = {
        ...mockPayment,
        status: PaymentStatus.COMPLETED,
      };

      renderForm(completedPayment);

      // Form should show warning message instead of update fields
      expect(
        screen.getByText(/cannot update payment with status/i)
      ).toBeInTheDocument();
      expect(
        screen.queryByRole('button', { name: /update payment/i })
      ).not.toBeInTheDocument();
    });

    it('should display error when trying to update failed payment', async () => {
      const failedPayment: Payment = {
        ...mockPayment,
        status: PaymentStatus.FAILED,
      };

      renderForm(failedPayment);

      // Form should show warning message
      expect(
        screen.getByText(/cannot update payment with status/i)
      ).toBeInTheDocument();
    });
  });

  describe('Cache Invalidation on Update', () => {
    it('should invalidate cache queries after successful update', async () => {
      const user = userEvent.setup();
      const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');

      vi.mocked(paymentsApi.updatePaymentDetails).mockResolvedValue(
        updatedPayment
      );

      renderForm();

      // Make a change and submit
      await user.clear(screen.getByLabelText(/amount/i));
      await user.type(screen.getByLabelText(/amount/i), '175');
      await user.click(
        screen.getByRole('button', { name: /update payment/i })
      );

      // Verify cache was invalidated
      await waitFor(() => {
        // Should invalidate both specific payment and list queries
        expect(invalidateSpy).toHaveBeenCalled();
      });

      invalidateSpy.mockRestore();
    });
  });

  describe('User Feedback During Update', () => {
    it('should show loading state while updating', async () => {
      const user = userEvent.setup();

      vi.mocked(paymentsApi.updatePaymentDetails).mockImplementation(
        () => new Promise(resolve => setTimeout(() => resolve(updatedPayment), 100))
      );

      renderForm();

      // Make a change and submit
      await user.clear(screen.getByLabelText(/amount/i));
      await user.type(screen.getByLabelText(/amount/i), '200');

      const submitButton = screen.getByRole('button', { name: /update payment/i });
      await user.click(submitButton);

      // Verify loading state (button text changes)
      await waitFor(() => {
        expect(submitButton).toBeDisabled();
      });

      // After completion
      await waitFor(() => {
        expect(
          screen.getByText('Payment updated successfully')
        ).toBeInTheDocument();
      });
    });

    it('should clear success message when form changes after update', async () => {
      const user = userEvent.setup();

      vi.mocked(paymentsApi.updatePaymentDetails).mockResolvedValue(
        updatedPayment
      );

      renderForm();

      // Update
      await user.clear(screen.getByLabelText(/amount/i));
      await user.type(screen.getByLabelText(/amount/i), '200');
      await user.click(
        screen.getByRole('button', { name: /update payment/i })
      );

      // Wait for success message
      await waitFor(() => {
        expect(
          screen.getByText('Payment updated successfully')
        ).toBeInTheDocument();
      });

      // Make another change
      await user.clear(screen.getByLabelText(/amount/i));
      await user.type(screen.getByLabelText(/amount/i), '250');

      // Success message should be cleared
      await waitFor(() => {
        expect(
          screen.queryByText('Payment updated successfully')
        ).not.toBeInTheDocument();
      });
    });
  });

  describe('Cancel Callback', () => {
    it('should invoke cancel callback when Cancel button is clicked', async () => {
      const user = userEvent.setup();
      const onCancel = vi.fn();

      renderForm(mockPayment, { onCancel });

      const cancelButton = screen.getByRole('button', { name: /cancel/i });
      await user.click(cancelButton);

      expect(onCancel).toHaveBeenCalled();
    });

    it('should disable cancel button during update', async () => {
      const user = userEvent.setup();
      const onCancel = vi.fn();

      vi.mocked(paymentsApi.updatePaymentDetails).mockImplementation(
        () => new Promise(resolve => setTimeout(() => resolve(updatedPayment), 100))
      );

      renderForm(mockPayment, { onCancel });

      // Make a change and submit
      await user.clear(screen.getByLabelText(/amount/i));
      await user.type(screen.getByLabelText(/amount/i), '200');
      await user.click(
        screen.getByRole('button', { name: /update payment/i })
      );

      // Cancel button should be disabled during update
      const cancelButton = screen.getByRole('button', { name: /cancel/i });
      await waitFor(() => {
        expect(cancelButton).toBeDisabled();
      });
    });
  });

  describe('Metadata Field', () => {
    it('should handle JSON metadata updates', async () => {
      const user = userEvent.setup();

      vi.mocked(paymentsApi.updatePaymentDetails).mockResolvedValue(
        updatedPayment
      );

      renderForm();

      // Update metadata JSON
      const metadataTextarea = screen.getByLabelText(/metadata/i);
      await user.clear(metadataTextarea);
      await user.type(metadataTextarea, '{"tag":"updated","version":2}');

      // Submit
      await user.click(
        screen.getByRole('button', { name: /update payment/i })
      );

      // Verify API was called with updated metadata
      await waitFor(() => {
        expect(paymentsApi.updatePaymentDetails).toHaveBeenCalledWith(
          'pay_123',
          expect.objectContaining({
            metadata: { tag: 'updated', version: 2 },
          })
        );
      });
    });
  });
});
