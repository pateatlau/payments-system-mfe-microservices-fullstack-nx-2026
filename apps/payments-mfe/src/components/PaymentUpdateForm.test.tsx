import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
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
  Label: ({ children, ...props }: React.ComponentProps<'label'>) => (
    <label {...props}>{children}</label>
  ),
  Alert: ({
    children,
    variant,
  }: {
    children: React.ReactNode;
    variant?: string;
  }) => (
    <div role="alert" data-variant={variant}>
      {children}
    </div>
  ),
  Card: ({ children, ...props }: React.ComponentProps<'div'>) => (
    <div {...props}>{children}</div>
  ),
}));

describe('PaymentUpdateForm', () => {
  let queryClient: QueryClient;
  const mockPayment: Payment = {
    id: 'test-payment-1',
    userId: 'user-123',
    amount: 100.0,
    currency: 'USD',
    description: 'Test payment',
    status: PaymentStatus.PENDING,
    type: PaymentType.INSTANT,
    metadata: { notes: 'Test notes' },
    createdAt: new Date().toISOString(),
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

  const renderForm = (payment: Payment = mockPayment, props = {}) => {
    return render(
      <QueryClientProvider client={queryClient}>
        <PaymentUpdateForm payment={payment} {...props} />
      </QueryClientProvider>
    );
  };

  describe('Rendering', () => {
    it('renders form with payment data pre-filled', () => {
      renderForm();

      expect(screen.getByLabelText(/amount/i)).toHaveValue(100);
      expect(screen.getByLabelText(/currency/i)).toHaveValue('USD');
      expect(screen.getByLabelText(/description/i)).toHaveValue('Test payment');
      expect(screen.getByLabelText(/recipient email/i)).toHaveValue('');
      expect(screen.getByLabelText(/metadata/i)).toHaveValue(
        JSON.stringify({ notes: 'Test notes' }, null, 2)
      );
    });

    it('renders all form fields', () => {
      renderForm();

      expect(screen.getByLabelText(/amount/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/currency/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/description/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/recipient email/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/metadata/i)).toBeInTheDocument();
    });

    it('renders submit button', () => {
      renderForm();

      expect(
        screen.getByRole('button', { name: /update payment/i })
      ).toBeInTheDocument();
    });

    it('renders cancel button when onCancel provided', () => {
      const onCancel = vi.fn();
      renderForm(mockPayment, { onCancel });

      expect(
        screen.getByRole('button', { name: /cancel/i })
      ).toBeInTheDocument();
    });

    it('does not render cancel button when onCancel not provided', () => {
      renderForm();

      expect(
        screen.queryByRole('button', { name: /cancel/i })
      ).not.toBeInTheDocument();
    });
  });

  describe('Payment Status Restrictions', () => {
    it('prevents updates to completed payments', () => {
      const completedPayment = {
        ...mockPayment,
        status: PaymentStatus.COMPLETED,
      };
      renderForm(completedPayment);

      expect(
        screen.getByText(/cannot update payment with status: completed/i)
      ).toBeInTheDocument();
      expect(
        screen.queryByRole('button', { name: /update payment/i })
      ).not.toBeInTheDocument();
    });

    it('prevents updates to failed payments', () => {
      const failedPayment = { ...mockPayment, status: PaymentStatus.FAILED };
      renderForm(failedPayment);

      expect(
        screen.getByText(/cannot update payment with status: failed/i)
      ).toBeInTheDocument();
      expect(
        screen.queryByRole('button', { name: /update payment/i })
      ).not.toBeInTheDocument();
    });

    it('shows close button for non-updatable payments', () => {
      const completedPayment = {
        ...mockPayment,
        status: PaymentStatus.COMPLETED,
      };
      const onCancel = vi.fn();
      renderForm(completedPayment, { onCancel });

      const closeButton = screen.getByRole('button', { name: /close/i });
      expect(closeButton).toBeInTheDocument();
    });

    it('allows updates to pending payments', () => {
      const pendingPayment = { ...mockPayment, status: PaymentStatus.PENDING };
      renderForm(pendingPayment);

      expect(
        screen.getByRole('button', { name: /update payment/i })
      ).toBeInTheDocument();
    });

    it('allows updates to processing payments', () => {
      const processingPayment = {
        ...mockPayment,
        status: PaymentStatus.PROCESSING,
      };
      renderForm(processingPayment);

      expect(
        screen.getByRole('button', { name: /update payment/i })
      ).toBeInTheDocument();
    });
  });

  describe('Form Validation', () => {
    it('validates positive amount', async () => {
      renderForm();
      const user = userEvent.setup();

      const amountInput = screen.getByLabelText(/amount/i);
      await user.clear(amountInput);
      await user.type(amountInput, '-50');

      // Trigger validation by clicking submit
      await user.click(screen.getByRole('button', { name: /update payment/i }));

      await waitFor(() => {
        expect(
          screen.getByText(/amount must be greater than 0/i)
        ).toBeInTheDocument();
      });
    });

    it('validates currency format (3 uppercase letters)', async () => {
      renderForm();
      const user = userEvent.setup();

      const currencyInput = screen.getByLabelText(/currency/i);
      await user.clear(currencyInput);
      await user.type(currencyInput, 'us');
      await user.click(screen.getByRole('button', { name: /update payment/i }));

      await waitFor(() => {
        expect(
          screen.getByText(/currency must be 3 uppercase letters/i)
        ).toBeInTheDocument();
      });
    });

    it('validates email format', async () => {
      renderForm();
      const user = userEvent.setup();

      const emailInput = screen.getByLabelText(/recipient email/i);
      await user.clear(emailInput);
      await user.type(emailInput, 'invalid-email');

      // Trigger validation by clicking submit
      await user.click(screen.getByRole('button', { name: /update payment/i }));

      await waitFor(() => {
        expect(screen.getByText(/invalid email format/i)).toBeInTheDocument();
      });
    });

    it('accepts valid currency format', async () => {
      renderForm();
      const user = userEvent.setup();

      const currencyInput = screen.getByLabelText(/currency/i);
      await user.clear(currencyInput);
      await user.type(currencyInput, 'EUR');

      // Should not show error
      expect(
        screen.queryByText(/currency must be 3 uppercase letters/i)
      ).not.toBeInTheDocument();
    });

    it('accepts valid email format', async () => {
      renderForm();
      const user = userEvent.setup();

      const emailInput = screen.getByLabelText(/recipient email/i);
      await user.clear(emailInput);
      await user.type(emailInput, 'valid@example.com');

      // Should not show error
      expect(
        screen.queryByText(/invalid email format/i)
      ).not.toBeInTheDocument();
    });
  });

  describe('Form Submission', () => {
    it('submits updated data when form is valid', async () => {
      const mockUpdatePaymentDetails = vi.mocked(
        paymentsApi.updatePaymentDetails
      );
      mockUpdatePaymentDetails.mockResolvedValue({
        ...mockPayment,
        amount: 150,
      });

      renderForm();
      const user = userEvent.setup();

      const amountInput = screen.getByLabelText(/amount/i);
      await user.clear(amountInput);
      await user.type(amountInput, '150');

      await user.click(screen.getByRole('button', { name: /update payment/i }));

      await waitFor(() => {
        expect(mockUpdatePaymentDetails).toHaveBeenCalledWith(
          'test-payment-1',
          {
            amount: 150,
          }
        );
      });
    });

    it('calls onSuccess callback when update succeeds', async () => {
      const updatedPayment = { ...mockPayment, amount: 150 };
      const mockUpdatePaymentDetails = vi.mocked(
        paymentsApi.updatePaymentDetails
      );
      mockUpdatePaymentDetails.mockResolvedValue(updatedPayment);

      const onSuccess = vi.fn();
      renderForm(mockPayment, { onSuccess });
      const user = userEvent.setup();

      const amountInput = screen.getByLabelText(/amount/i);
      await user.clear(amountInput);
      await user.type(amountInput, '150');

      await user.click(screen.getByRole('button', { name: /update payment/i }));

      await waitFor(() => {
        expect(onSuccess).toHaveBeenCalledWith(updatedPayment);
      });
    });

    it('shows success message when update succeeds', async () => {
      const mockUpdatePaymentDetails = vi.mocked(
        paymentsApi.updatePaymentDetails
      );
      mockUpdatePaymentDetails.mockResolvedValue({
        ...mockPayment,
        amount: 150,
      });

      renderForm();
      const user = userEvent.setup();

      const amountInput = screen.getByLabelText(/amount/i);
      await user.clear(amountInput);
      await user.type(amountInput, '150');

      await user.click(screen.getByRole('button', { name: /update payment/i }));

      await waitFor(() => {
        expect(
          screen.getByText(/payment updated successfully/i)
        ).toBeInTheDocument();
      });
    });

    it('shows error message when update fails', async () => {
      const mockUpdatePaymentDetails = vi.mocked(
        paymentsApi.updatePaymentDetails
      );
      mockUpdatePaymentDetails.mockRejectedValue(new Error('Network error'));

      renderForm();
      const user = userEvent.setup();

      const amountInput = screen.getByLabelText(/amount/i);
      await user.clear(amountInput);
      await user.type(amountInput, '150');

      await user.click(screen.getByRole('button', { name: /update payment/i }));

      await waitFor(() => {
        expect(screen.getByText(/network error/i)).toBeInTheDocument();
      });
    });

    it('only submits changed fields', async () => {
      const mockUpdatePaymentDetails = vi.mocked(
        paymentsApi.updatePaymentDetails
      );
      mockUpdatePaymentDetails.mockResolvedValue({
        ...mockPayment,
        description: 'Updated description',
      });

      renderForm();
      const user = userEvent.setup();

      // Only change description
      const descriptionInput = screen.getByLabelText(/description/i);
      await user.clear(descriptionInput);
      await user.type(descriptionInput, 'Updated description');

      await user.click(screen.getByRole('button', { name: /update payment/i }));

      await waitFor(() => {
        expect(mockUpdatePaymentDetails).toHaveBeenCalledWith(
          'test-payment-1',
          {
            description: 'Updated description',
          }
        );
      });
    });

    it('shows error when no changes are made', async () => {
      renderForm();

      // Submit button should be disabled when no changes
      const submitButton = screen.getByRole('button', {
        name: /update payment/i,
      });
      expect(submitButton).toBeDisabled();
    });

    it('disables submit button while submitting', async () => {
      const mockUpdatePaymentDetails = vi.mocked(
        paymentsApi.updatePaymentDetails
      );
      mockUpdatePaymentDetails.mockImplementation(
        () => new Promise(resolve => setTimeout(resolve, 1000))
      );

      renderForm();
      const user = userEvent.setup();

      const amountInput = screen.getByLabelText(/amount/i);
      await user.clear(amountInput);
      await user.type(amountInput, '150');

      const submitButton = screen.getByRole('button', {
        name: /update payment/i,
      });
      await user.click(submitButton);

      expect(submitButton).toBeDisabled();
    });

    it('shows loading state while submitting', async () => {
      const mockUpdatePaymentDetails = vi.mocked(
        paymentsApi.updatePaymentDetails
      );
      mockUpdatePaymentDetails.mockImplementation(
        () => new Promise(resolve => setTimeout(resolve, 1000))
      );

      renderForm();
      const user = userEvent.setup();

      const amountInput = screen.getByLabelText(/amount/i);
      await user.clear(amountInput);
      await user.type(amountInput, '150');

      await user.click(screen.getByRole('button', { name: /update payment/i }));

      expect(
        screen.getByRole('button', { name: /updating/i })
      ).toBeInTheDocument();
    });
  });

  describe('Cancel Functionality', () => {
    it('calls onCancel when cancel button is clicked', async () => {
      const onCancel = vi.fn();
      renderForm(mockPayment, { onCancel });
      const user = userEvent.setup();

      await user.click(screen.getByRole('button', { name: /cancel/i }));

      expect(onCancel).toHaveBeenCalledTimes(1);
    });

    it('disables cancel button while submitting', async () => {
      const mockUpdatePaymentDetails = vi.mocked(
        paymentsApi.updatePaymentDetails
      );
      mockUpdatePaymentDetails.mockImplementation(
        () => new Promise(resolve => setTimeout(resolve, 1000))
      );

      const onCancel = vi.fn();
      renderForm(mockPayment, { onCancel });
      const user = userEvent.setup();

      const amountInput = screen.getByLabelText(/amount/i);
      await user.clear(amountInput);
      await user.type(amountInput, '150');

      await user.click(screen.getByRole('button', { name: /update payment/i }));

      expect(screen.getByRole('button', { name: /cancel/i })).toBeDisabled();
    });
  });

  describe('Metadata Handling', () => {
    it('displays metadata as formatted JSON', () => {
      renderForm();

      const metadataInput = screen.getByLabelText(
        /metadata/i
      ) as HTMLTextAreaElement;

      // Should display formatted JSON
      expect(metadataInput.value).toContain('"notes"');
      expect(metadataInput.value).toContain('"Test notes"');
    });

    it('allows updating metadata field', () => {
      renderForm();

      const metadataInput = screen.getByLabelText(
        /metadata/i
      ) as HTMLTextAreaElement;

      // Verify initial state
      expect(metadataInput).toBeInTheDocument();
      expect(metadataInput).not.toBeDisabled();
    });
  });
});
