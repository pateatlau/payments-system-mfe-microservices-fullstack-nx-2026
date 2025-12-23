import { describe, it, expect, beforeEach } from '@jest/globals';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { PaymentStatus, PaymentType } from 'shared-types';
import type { Payment } from '../api/types';
import { PaymentsPage } from './PaymentsPage';
import * as paymentsApi from '../api/payments';

// Mock all modules before any imports
jest.mock('../api/payments');

jest.mock('shared-auth-store', () => ({
  useAuthStore: jest.fn(() => ({
    user: { id: 'user-123', role: 'VENDOR' },
    hasRole: jest.fn((role: string) => role === 'VENDOR'),
  })),
}));

jest.mock('./PaymentFilters', () => ({
  PaymentFilters: () => <div data-testid="payment-filters">Filters</div>,
}));

jest.mock('./PaymentDetails', () => ({
  PaymentDetails: ({
    payment,
    onClose,
  }: {
    payment: Payment | null;
    onClose: () => void;
  }) => (
    <div data-testid="payment-details-modal">
      <h2>Payment Details</h2>
      {payment && <div data-testid="payment-id">{payment.id}</div>}
      <button onClick={onClose} data-testid="close-details">
        Close
      </button>
    </div>
  ),
}));

jest.mock('../hooks/usePaymentUpdates', () => ({
  usePaymentUpdates: () => ({}),
}));

describe('PaymentsPage - Payment Details Modal', () => {
  let queryClient: QueryClient;
  const mockPayments: Payment[] = [
    {
      id: 'payment-1',
      userId: 'user-123',
      amount: 100.0,
      currency: 'USD',
      description: 'Test payment 1',
      status: PaymentStatus.COMPLETED,
      type: PaymentType.INSTANT,
      metadata: {},
      createdAt: new Date('2025-01-01').toISOString(),
      updatedAt: new Date('2025-01-01').toISOString(),
    },
    {
      id: 'payment-2',
      userId: 'user-123',
      amount: 200.0,
      currency: 'EUR',
      description: 'Test payment 2',
      status: PaymentStatus.PENDING,
      type: PaymentType.SCHEDULED,
      metadata: {},
      createdAt: new Date('2025-01-02').toISOString(),
      updatedAt: new Date('2025-01-02').toISOString(),
    },
  ];

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });
    jest.mocked(paymentsApi.listPayments).mockResolvedValue(mockPayments);
  });

  const renderComponent = () =>
    render(
      <QueryClientProvider client={queryClient}>
        <PaymentsPage />
      </QueryClientProvider>
    );

  describe('View Details Button', () => {
    it('shows View Details button for each payment', async () => {
      renderComponent();

      const buttons = await screen.findAllByRole('button', {
        name: /view details/i,
      });
      expect(buttons).toHaveLength(2);
    });
  });

  describe('Modal Functionality', () => {
    it('opens modal when View Details is clicked', async () => {
      const user = userEvent.setup();
      renderComponent();

      // Wait for payments to load
      await screen.findAllByRole('button', { name: /view details/i });

      // Click first View Details button
      const viewButtons = screen.getAllByRole('button', {
        name: /view details/i,
      });
      await user.click(viewButtons[0]!);

      // Modal should be visible - check for the modal container
      expect(screen.getByTestId('payment-details-modal')).toBeInTheDocument();
      // Check that payment ID is shown in the mocked component
      expect(screen.getByTestId('payment-id')).toHaveTextContent('payment-1');
    });

    it('displays correct payment in modal', async () => {
      const user = userEvent.setup();
      renderComponent();

      await screen.findAllByRole('button', { name: /view details/i });

      // Click first payment's View Details
      const viewButtons = screen.getAllByRole('button', {
        name: /view details/i,
      });
      await user.click(viewButtons[0]!);

      // Check that correct payment ID is shown
      expect(screen.getByTestId('payment-id')).toHaveTextContent('payment-1');
    });

    it('closes modal when close button is clicked', async () => {
      const user = userEvent.setup();
      renderComponent();

      await screen.findAllByRole('button', { name: /view details/i });

      // Open modal
      const viewButtons = screen.getAllByRole('button', {
        name: /view details/i,
      });
      await user.click(viewButtons[0]!);

      expect(screen.getByTestId('payment-details-modal')).toBeInTheDocument();

      // Close modal
      const closeButton = screen.getByTestId('close-details');
      await user.click(closeButton);

      // Modal should be gone
      expect(
        screen.queryByTestId('payment-details-modal')
      ).not.toBeInTheDocument();
    });

    it('can open modal for different payments', async () => {
      const user = userEvent.setup();
      renderComponent();

      await screen.findAllByRole('button', { name: /view details/i });
      const viewButtons = screen.getAllByRole('button', {
        name: /view details/i,
      });

      // Open first payment
      await user.click(viewButtons[0]!);
      expect(screen.getByTestId('payment-id')).toHaveTextContent('payment-1');

      // Close it
      await user.click(screen.getByTestId('close-details'));

      // Open second payment
      await user.click(viewButtons[1]!);
      expect(screen.getByTestId('payment-id')).toHaveTextContent('payment-2');
    });
  });

  describe('Modal Backdrop', () => {
    it('closes modal when clicking backdrop', async () => {
      const user = userEvent.setup();
      renderComponent();

      await screen.findAllByRole('button', { name: /view details/i });

      // Open modal
      const viewButtons = screen.getAllByRole('button', {
        name: /view details/i,
      });
      await user.click(viewButtons[0]!);

      const modal = screen.getByTestId('payment-details-modal');
      expect(modal).toBeInTheDocument();

      // Find backdrop (parent of modal with fixed positioning)
      const backdrop = modal.closest('[class*="fixed"]');
      expect(backdrop).toBeInTheDocument();

      // Click backdrop
      if (backdrop) {
        await user.click(backdrop);
        // Modal should close
        expect(
          screen.queryByTestId('payment-details-modal')
        ).not.toBeInTheDocument();
      }
    });
  });
});
