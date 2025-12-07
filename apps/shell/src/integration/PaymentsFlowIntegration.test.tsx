import React from 'react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useAuthStore } from 'shared-auth-store';
import { PaymentsPage } from '../pages/PaymentsPage';

// Mock the auth store
vi.mock('shared-auth-store', () => ({
  useAuthStore: vi.fn(),
}));

// Mock PaymentsPage component from payments-mfe
// This simulates the actual PaymentsPage component behavior
const createMockPaymentsComponent = (mockData: {
  payments?: any[];
  isLoading?: boolean;
  error?: Error | null;
  hasRole?: (role: string) => boolean;
  onCreatePayment?: (data: any) => Promise<any>;
  onUpdatePayment?: (id: string, data: any) => Promise<any>;
  onDeletePayment?: (id: string) => Promise<any>;
}) => {
  return function MockPaymentsPageComponent() {
    const { hasRole: hasRoleFromStore } = (useAuthStore as unknown as ReturnType<typeof vi.fn>)();
    const hasRole = mockData.hasRole || hasRoleFromStore || (() => false);

    return (
      <div data-testid="payments-page">
        <h1>Payments</h1>
        {mockData.isLoading && <div data-testid="loading">Loading payments...</div>}
        {mockData.error && (
          <div data-testid="error">Error: {mockData.error.message}</div>
        )}
        {mockData.payments && mockData.payments.length > 0 && (
          <div data-testid="payments-list">
            {mockData.payments.map((payment: any) => (
              <div key={payment.id} data-testid={`payment-${payment.id}`}>
                <span data-testid={`payment-amount-${payment.id}`}>
                  {payment.amount} {payment.currency}
                </span>
                <span data-testid={`payment-status-${payment.id}`}>{payment.status}</span>
                {hasRole('VENDOR') && (
                  <>
                    <button
                      data-testid={`edit-${payment.id}`}
                      onClick={async () => {
                        if (mockData.onUpdatePayment) {
                          await mockData.onUpdatePayment(payment.id, { amount: 150 });
                        }
                      }}
                    >
                      Edit
                    </button>
                    <button
                      data-testid={`delete-${payment.id}`}
                      onClick={async () => {
                        if (mockData.onDeletePayment) {
                          await mockData.onDeletePayment(payment.id);
                        }
                      }}
                    >
                      Delete
                    </button>
                  </>
                )}
              </div>
            ))}
          </div>
        )}
        {hasRole('VENDOR') && (
          <button
            data-testid="create-payment"
            onClick={async () => {
              if (mockData.onCreatePayment) {
                await mockData.onCreatePayment({
                  amount: 100,
                  currency: 'USD',
                  type: 'payment',
                  description: 'Test payment',
                });
              }
            }}
          >
            Create Payment
          </button>
        )}
      </div>
    );
  };
};

describe('Payments Flow Integration Tests', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });
    vi.clearAllMocks();
  });

  const createWrapper = () => {
    return ({ children }: { children: React.ReactNode }) => (
      <QueryClientProvider client={queryClient}>
        <MemoryRouter>{children}</MemoryRouter>
      </QueryClientProvider>
    );
  };

  const mockPayments = [
    {
      id: 'pay-1',
      userId: 'user-1',
      amount: 100.5,
      currency: 'USD',
      status: 'completed',
      type: 'payment',
      description: 'Test payment',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: 'pay-2',
      userId: 'user-1',
      amount: 250.0,
      currency: 'EUR',
      status: 'pending',
      type: 'initiate',
      description: 'Invoice payment',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  ];

  describe('View Payments List', () => {
    it('should display payments list for authenticated user', () => {
      (useAuthStore as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
        user: { id: 'user-1', email: 'test@example.com', name: 'Test', role: 'CUSTOMER' },
        isAuthenticated: true,
        hasRole: vi.fn(() => false),
      });

      const MockComponent = createMockPaymentsComponent({
        payments: mockPayments,
        isLoading: false,
        error: null,
        hasRole: () => false,
      });

      render(
        <PaymentsPage PaymentsComponent={MockComponent} />,
        { wrapper: createWrapper() }
      );

      expect(screen.getByTestId('payments-list')).toBeInTheDocument();
      expect(screen.getByTestId('payment-pay-1')).toBeInTheDocument();
      expect(screen.getByTestId('payment-pay-2')).toBeInTheDocument();
      expect(screen.getByTestId('payment-amount-pay-1')).toHaveTextContent('100.5 USD');
      expect(screen.getByTestId('payment-status-pay-1')).toHaveTextContent('completed');
    });

    it('should display loading state while fetching payments', () => {
      (useAuthStore as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
        user: { id: 'user-1', email: 'test@example.com', name: 'Test', role: 'CUSTOMER' },
        isAuthenticated: true,
        hasRole: vi.fn(() => false),
      });

      const MockComponent = createMockPaymentsComponent({
        payments: undefined,
        isLoading: true,
        error: null,
        hasRole: () => false,
      });

      render(
        <PaymentsPage PaymentsComponent={MockComponent} />,
        { wrapper: createWrapper() }
      );

      expect(screen.getByTestId('loading')).toBeInTheDocument();
    });
  });

  describe('Create Payment (VENDOR)', () => {
    it('should create payment successfully', async () => {
      const user = userEvent.setup();
      const onCreatePayment = vi.fn().mockResolvedValue({
        id: 'pay-new',
        amount: 100,
        currency: 'USD',
        status: 'processing',
        type: 'payment',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });

      (useAuthStore as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
        user: { id: 'user-1', email: 'vendor@example.com', name: 'Vendor', role: 'VENDOR' },
        isAuthenticated: true,
        hasRole: vi.fn((role: string) => role === 'VENDOR'),
      });

      const MockComponent = createMockPaymentsComponent({
        payments: mockPayments,
        isLoading: false,
        error: null,
        hasRole: () => true, // VENDOR role
        onCreatePayment,
      });

      render(
        <PaymentsPage PaymentsComponent={MockComponent} />,
        { wrapper: createWrapper() }
      );

      const createButton = screen.getByTestId('create-payment');
      await user.click(createButton);

      await waitFor(() => {
        expect(onCreatePayment).toHaveBeenCalledWith({
          amount: 100,
          currency: 'USD',
          type: 'payment',
          description: 'Test payment',
        });
      });
    });
  });

  describe('Update Payment', () => {
    it('should update payment successfully', async () => {
      const user = userEvent.setup();
      const onUpdatePayment = vi.fn().mockResolvedValue({
        id: 'pay-1',
        amount: 150,
        currency: 'USD',
        status: 'completed',
        type: 'payment',
        updatedAt: new Date().toISOString(),
      });

      (useAuthStore as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
        user: { id: 'user-1', email: 'vendor@example.com', name: 'Vendor', role: 'VENDOR' },
        isAuthenticated: true,
        hasRole: vi.fn((role: string) => role === 'VENDOR'),
      });

      const MockComponent = createMockPaymentsComponent({
        payments: mockPayments,
        isLoading: false,
        error: null,
        hasRole: () => true, // VENDOR role
        onUpdatePayment,
      });

      render(
        <PaymentsPage PaymentsComponent={MockComponent} />,
        { wrapper: createWrapper() }
      );

      const editButton = screen.getByTestId('edit-pay-1');
      await user.click(editButton);

      await waitFor(() => {
        expect(onUpdatePayment).toHaveBeenCalledWith('pay-1', { amount: 150 });
      });
    });
  });

  describe('Delete Payment', () => {
    it('should delete payment successfully', async () => {
      const user = userEvent.setup();
      const onDeletePayment = vi.fn().mockResolvedValue(true);

      (useAuthStore as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
        user: { id: 'user-1', email: 'vendor@example.com', name: 'Vendor', role: 'VENDOR' },
        isAuthenticated: true,
        hasRole: vi.fn((role: string) => role === 'VENDOR'),
      });

      const MockComponent = createMockPaymentsComponent({
        payments: mockPayments,
        isLoading: false,
        error: null,
        hasRole: () => true, // VENDOR role
        onDeletePayment,
      });

      render(
        <PaymentsPage PaymentsComponent={MockComponent} />,
        { wrapper: createWrapper() }
      );

      const deleteButton = screen.getByTestId('delete-pay-1');
      await user.click(deleteButton);

      await waitFor(() => {
        expect(onDeletePayment).toHaveBeenCalledWith('pay-1');
      });
    });
  });

  describe('Role-Based Access', () => {
    it('should show create/edit/delete buttons for VENDOR', () => {
      (useAuthStore as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
        user: { id: 'user-1', email: 'vendor@example.com', name: 'Vendor', role: 'VENDOR' },
        isAuthenticated: true,
        hasRole: vi.fn((role: string) => role === 'VENDOR'),
      });

      const MockComponent = createMockPaymentsComponent({
        payments: mockPayments,
        isLoading: false,
        error: null,
        hasRole: () => true, // VENDOR role
      });

      render(
        <PaymentsPage PaymentsComponent={MockComponent} />,
        { wrapper: createWrapper() }
      );

      expect(screen.getByTestId('create-payment')).toBeInTheDocument();
      expect(screen.getByTestId('edit-pay-1')).toBeInTheDocument();
      expect(screen.getByTestId('delete-pay-1')).toBeInTheDocument();
    });

    it('should hide create/edit/delete buttons for CUSTOMER', () => {
      (useAuthStore as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
        user: { id: 'user-1', email: 'customer@example.com', name: 'Customer', role: 'CUSTOMER' },
        isAuthenticated: true,
        hasRole: vi.fn(() => false),
      });

      const MockComponent = createMockPaymentsComponent({
        payments: mockPayments,
        isLoading: false,
        error: null,
        hasRole: () => false, // CUSTOMER role
      });

      render(
        <PaymentsPage PaymentsComponent={MockComponent} />,
        { wrapper: createWrapper() }
      );

      expect(screen.queryByTestId('create-payment')).not.toBeInTheDocument();
      expect(screen.queryByTestId('edit-pay-1')).not.toBeInTheDocument();
      expect(screen.queryByTestId('delete-pay-1')).not.toBeInTheDocument();
      // But payments list should still be visible
      expect(screen.getByTestId('payments-list')).toBeInTheDocument();
    });
  });
});
