import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { PaymentsPage } from './PaymentsPage';
import { useAuthStore } from 'shared-auth-store';
import {
  usePayments,
  useCreatePayment,
  useUpdatePayment,
  useDeletePayment,
} from '../hooks';

// Mock the auth store
vi.mock('shared-auth-store', () => ({
  useAuthStore: vi.fn(),
}));

// Mock the hooks
vi.mock('../hooks', () => ({
  usePayments: vi.fn(),
  useCreatePayment: vi.fn(),
  useUpdatePayment: vi.fn(),
  useDeletePayment: vi.fn(),
}));

describe('PaymentsPage', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
        },
        mutations: {
          retry: false,
        },
      },
    });
    vi.clearAllMocks();
  });

  const createWrapper = () => {
    return ({ children }: { children: React.ReactNode }) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );
  };

  const mockPayments = [
    {
      id: 'pay-1',
      userId: 'user-1',
      amount: 100.5,
      currency: 'USD',
      status: 'completed' as const,
      type: 'payment' as const,
      description: 'Test payment',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: 'pay-2',
      userId: 'user-1',
      amount: 250.0,
      currency: 'EUR',
      status: 'pending' as const,
      type: 'initiate' as const,
      description: 'Invoice payment',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  ];

  describe('Loading State', () => {
    it('displays loading state when payments are loading', () => {
      (useAuthStore as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
        user: { id: 'user-1', email: 'test@example.com', name: 'Test', role: 'CUSTOMER' },
        hasRole: vi.fn(() => false),
      });

      (usePayments as ReturnType<typeof vi.fn>).mockReturnValue({
        data: undefined,
        isLoading: true,
        error: null,
      });

      (useCreatePayment as ReturnType<typeof vi.fn>).mockReturnValue({
        mutateAsync: vi.fn(),
        isPending: false,
        isError: false,
        error: null,
      });

      (useUpdatePayment as ReturnType<typeof vi.fn>).mockReturnValue({
        mutateAsync: vi.fn(),
        isPending: false,
        isError: false,
        error: null,
      });

      (useDeletePayment as ReturnType<typeof vi.fn>).mockReturnValue({
        mutateAsync: vi.fn(),
        isPending: false,
        isError: false,
        error: null,
      });

      render(<PaymentsPage />, { wrapper: createWrapper() });

      expect(screen.getByText('Loading payments...')).toBeInTheDocument();
    });
  });

  describe('Error State', () => {
    it('displays error state when payments fail to load', () => {
      (useAuthStore as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
        user: { id: 'user-1', email: 'test@example.com', name: 'Test', role: 'CUSTOMER' },
        hasRole: vi.fn(() => false),
      });

      (usePayments as ReturnType<typeof vi.fn>).mockReturnValue({
        data: undefined,
        isLoading: false,
        error: new Error('Failed to load payments'),
      });

      (useCreatePayment as ReturnType<typeof vi.fn>).mockReturnValue({
        mutateAsync: vi.fn(),
        isPending: false,
        isError: false,
        error: null,
      });

      (useUpdatePayment as ReturnType<typeof vi.fn>).mockReturnValue({
        mutateAsync: vi.fn(),
        isPending: false,
        isError: false,
        error: null,
      });

      (useDeletePayment as ReturnType<typeof vi.fn>).mockReturnValue({
        mutateAsync: vi.fn(),
        isPending: false,
        isError: false,
        error: null,
      });

      render(<PaymentsPage />, { wrapper: createWrapper() });

      expect(screen.getByText('Error Loading Payments')).toBeInTheDocument();
      expect(screen.getByText('Failed to load payments')).toBeInTheDocument();
    });
  });

  describe('Not Authenticated', () => {
    it('displays authentication required message when user is not authenticated', () => {
      (useAuthStore as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
        user: null,
        hasRole: vi.fn(() => false),
      });

      (usePayments as ReturnType<typeof vi.fn>).mockReturnValue({
        data: undefined,
        isLoading: false,
        error: null,
      });

      (useCreatePayment as ReturnType<typeof vi.fn>).mockReturnValue({
        mutateAsync: vi.fn(),
        isPending: false,
        isError: false,
        error: null,
      });

      (useUpdatePayment as ReturnType<typeof vi.fn>).mockReturnValue({
        mutateAsync: vi.fn(),
        isPending: false,
        isError: false,
        error: null,
      });

      (useDeletePayment as ReturnType<typeof vi.fn>).mockReturnValue({
        mutateAsync: vi.fn(),
        isPending: false,
        isError: false,
        error: null,
      });

      render(<PaymentsPage />, { wrapper: createWrapper() });

      expect(screen.getByText('Authentication Required')).toBeInTheDocument();
      expect(screen.getByText('Please sign in to view your payments.')).toBeInTheDocument();
    });
  });

  describe('CUSTOMER Role', () => {
    it('displays payments list for CUSTOMER without create/edit/delete buttons', () => {
      const mockHasRole = vi.fn((role: string) => role === 'CUSTOMER');

      (useAuthStore as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
        user: { id: 'user-1', email: 'test@example.com', name: 'Test', role: 'CUSTOMER' },
        hasRole: mockHasRole,
      });

      (usePayments as ReturnType<typeof vi.fn>).mockReturnValue({
        data: mockPayments,
        isLoading: false,
        error: null,
      });

      (useCreatePayment as ReturnType<typeof vi.fn>).mockReturnValue({
        mutateAsync: vi.fn(),
        isPending: false,
        isError: false,
        error: null,
      });

      (useUpdatePayment as ReturnType<typeof vi.fn>).mockReturnValue({
        mutateAsync: vi.fn(),
        isPending: false,
        isError: false,
        error: null,
      });

      (useDeletePayment as ReturnType<typeof vi.fn>).mockReturnValue({
        mutateAsync: vi.fn(),
        isPending: false,
        isError: false,
        error: null,
      });

      render(<PaymentsPage />, { wrapper: createWrapper() });

      expect(screen.getByText('Payments')).toBeInTheDocument();
      expect(screen.getByText('View your payment history')).toBeInTheDocument();
      expect(screen.queryByText('Create Payment')).not.toBeInTheDocument();
      expect(screen.queryByText('Edit')).not.toBeInTheDocument();
      expect(screen.queryByText('Delete')).not.toBeInTheDocument();
    });

    it('displays empty state when no payments found', () => {
      const mockHasRole = vi.fn((role: string) => role === 'CUSTOMER');

      (useAuthStore as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
        user: { id: 'user-1', email: 'test@example.com', name: 'Test', role: 'CUSTOMER' },
        hasRole: mockHasRole,
      });

      (usePayments as ReturnType<typeof vi.fn>).mockReturnValue({
        data: [],
        isLoading: false,
        error: null,
      });

      (useCreatePayment as ReturnType<typeof vi.fn>).mockReturnValue({
        mutateAsync: vi.fn(),
        isPending: false,
        isError: false,
        error: null,
      });

      (useUpdatePayment as ReturnType<typeof vi.fn>).mockReturnValue({
        mutateAsync: vi.fn(),
        isPending: false,
        isError: false,
        error: null,
      });

      (useDeletePayment as ReturnType<typeof vi.fn>).mockReturnValue({
        mutateAsync: vi.fn(),
        isPending: false,
        isError: false,
        error: null,
      });

      render(<PaymentsPage />, { wrapper: createWrapper() });

      expect(screen.getByText('No payments found')).toBeInTheDocument();
    });
  });

  describe('VENDOR Role', () => {
    it('displays create payment button for VENDOR', () => {
      const mockHasRole = vi.fn((role: string) => role === 'VENDOR');
      const mockCreatePayment = vi.fn().mockResolvedValue({});

      (useAuthStore as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
        user: { id: 'user-1', email: 'vendor@example.com', name: 'Vendor', role: 'VENDOR' },
        hasRole: mockHasRole,
      });

      (usePayments as ReturnType<typeof vi.fn>).mockReturnValue({
        data: mockPayments,
        isLoading: false,
        error: null,
      });

      (useCreatePayment as ReturnType<typeof vi.fn>).mockReturnValue({
        mutateAsync: mockCreatePayment,
        isPending: false,
        isError: false,
        error: null,
      });

      (useUpdatePayment as ReturnType<typeof vi.fn>).mockReturnValue({
        mutateAsync: vi.fn(),
        isPending: false,
        isError: false,
        error: null,
      });

      (useDeletePayment as ReturnType<typeof vi.fn>).mockReturnValue({
        mutateAsync: vi.fn(),
        isPending: false,
        isError: false,
        error: null,
      });

      render(<PaymentsPage />, { wrapper: createWrapper() });

      expect(screen.getByText('Create Payment')).toBeInTheDocument();
      expect(screen.getByText('Manage payments and view reports')).toBeInTheDocument();
    });

    it('shows create payment form when create button is clicked', async () => {
      const user = userEvent.setup();
      const mockHasRole = vi.fn((role: string) => role === 'VENDOR');
      const mockCreatePayment = vi.fn().mockResolvedValue({});

      (useAuthStore as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
        user: { id: 'user-1', email: 'vendor@example.com', name: 'Vendor', role: 'VENDOR' },
        hasRole: mockHasRole,
      });

      (usePayments as ReturnType<typeof vi.fn>).mockReturnValue({
        data: mockPayments,
        isLoading: false,
        error: null,
      });

      (useCreatePayment as ReturnType<typeof vi.fn>).mockReturnValue({
        mutateAsync: mockCreatePayment,
        isPending: false,
        isError: false,
        error: null,
      });

      (useUpdatePayment as ReturnType<typeof vi.fn>).mockReturnValue({
        mutateAsync: vi.fn(),
        isPending: false,
        isError: false,
        error: null,
      });

      (useDeletePayment as ReturnType<typeof vi.fn>).mockReturnValue({
        mutateAsync: vi.fn(),
        isPending: false,
        isError: false,
        error: null,
      });

      render(<PaymentsPage />, { wrapper: createWrapper() });

      const createButton = screen.getByRole('button', { name: /create payment/i });
      await user.click(createButton);

      expect(screen.getByText('Create New Payment')).toBeInTheDocument();
      expect(screen.getByLabelText(/amount/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/currency/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/payment type/i)).toBeInTheDocument();
    });

    it('validates create payment form', async () => {
      const user = userEvent.setup();
      const mockHasRole = vi.fn((role: string) => role === 'VENDOR');
      const mockCreatePayment = vi.fn().mockResolvedValue({});

      (useAuthStore as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
        user: { id: 'user-1', email: 'vendor@example.com', name: 'Vendor', role: 'VENDOR' },
        hasRole: mockHasRole,
      });

      (usePayments as ReturnType<typeof vi.fn>).mockReturnValue({
        data: mockPayments,
        isLoading: false,
        error: null,
      });

      (useCreatePayment as ReturnType<typeof vi.fn>).mockReturnValue({
        mutateAsync: mockCreatePayment,
        isPending: false,
        isError: false,
        error: null,
      });

      (useUpdatePayment as ReturnType<typeof vi.fn>).mockReturnValue({
        mutateAsync: vi.fn(),
        isPending: false,
        isError: false,
        error: null,
      });

      (useDeletePayment as ReturnType<typeof vi.fn>).mockReturnValue({
        mutateAsync: vi.fn(),
        isPending: false,
        isError: false,
        error: null,
      });

      render(<PaymentsPage />, { wrapper: createWrapper() });

      const createButton = screen.getByRole('button', { name: /create payment/i });
      await user.click(createButton);

      // Set amount to invalid value (negative) to trigger validation
      const amountInput = screen.getByLabelText(/amount/i) as HTMLInputElement;
      await user.clear(amountInput);
      await user.type(amountInput, '-10');

      const submitButton = screen.getByRole('button', { name: /create payment/i });
      await user.click(submitButton);

      // Wait for validation error to appear
      await waitFor(() => {
        const errorMessage = screen.queryByText(/amount must be positive/i, { exact: false });
        expect(errorMessage).toBeInTheDocument();
      }, { timeout: 3000 });
    });

    it('creates payment successfully', async () => {
      const user = userEvent.setup();
      const mockHasRole = vi.fn((role: string) => role === 'VENDOR');
      const mockCreatePayment = vi.fn().mockResolvedValue({
        id: 'pay-3',
        userId: 'user-1',
        amount: 100,
        currency: 'USD',
        status: 'processing',
        type: 'payment',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });

      (useAuthStore as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
        user: { id: 'user-1', email: 'vendor@example.com', name: 'Vendor', role: 'VENDOR' },
        hasRole: mockHasRole,
      });

      (usePayments as ReturnType<typeof vi.fn>).mockReturnValue({
        data: mockPayments,
        isLoading: false,
        error: null,
      });

      (useCreatePayment as ReturnType<typeof vi.fn>).mockReturnValue({
        mutateAsync: mockCreatePayment,
        isPending: false,
        isError: false,
        error: null,
      });

      (useUpdatePayment as ReturnType<typeof vi.fn>).mockReturnValue({
        mutateAsync: vi.fn(),
        isPending: false,
        isError: false,
        error: null,
      });

      (useDeletePayment as ReturnType<typeof vi.fn>).mockReturnValue({
        mutateAsync: vi.fn(),
        isPending: false,
        isError: false,
        error: null,
      });

      render(<PaymentsPage />, { wrapper: createWrapper() });

      const createButton = screen.getByRole('button', { name: /create payment/i });
      await user.click(createButton);

      const amountInput = screen.getByLabelText(/amount/i);
      await user.clear(amountInput);
      await user.type(amountInput, '100');

      const submitButton = screen.getByRole('button', { name: /create payment/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockCreatePayment).toHaveBeenCalledWith({
          amount: 100,
          currency: 'USD',
          type: 'payment',
          description: '',
        });
      });
    });

    it('displays edit and delete buttons for VENDOR', () => {
      const mockHasRole = vi.fn((role: string) => role === 'VENDOR');

      (useAuthStore as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
        user: { id: 'user-1', email: 'vendor@example.com', name: 'Vendor', role: 'VENDOR' },
        hasRole: mockHasRole,
      });

      (usePayments as ReturnType<typeof vi.fn>).mockReturnValue({
        data: mockPayments,
        isLoading: false,
        error: null,
      });

      (useCreatePayment as ReturnType<typeof vi.fn>).mockReturnValue({
        mutateAsync: vi.fn(),
        isPending: false,
        isError: false,
        error: null,
      });

      (useUpdatePayment as ReturnType<typeof vi.fn>).mockReturnValue({
        mutateAsync: vi.fn(),
        isPending: false,
        isError: false,
        error: null,
      });

      (useDeletePayment as ReturnType<typeof vi.fn>).mockReturnValue({
        mutateAsync: vi.fn(),
        isPending: false,
        isError: false,
        error: null,
      });

      render(<PaymentsPage />, { wrapper: createWrapper() });

      const editButtons = screen.getAllByText('Edit');
      const deleteButtons = screen.getAllByText('Delete');

      expect(editButtons.length).toBeGreaterThan(0);
      expect(deleteButtons.length).toBeGreaterThan(0);
    });

    it('enters edit mode when edit button is clicked', async () => {
      const user = userEvent.setup();
      const mockHasRole = vi.fn((role: string) => role === 'VENDOR');
      const mockUpdatePayment = vi.fn().mockResolvedValue({});

      (useAuthStore as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
        user: { id: 'user-1', email: 'vendor@example.com', name: 'Vendor', role: 'VENDOR' },
        hasRole: mockHasRole,
      });

      (usePayments as ReturnType<typeof vi.fn>).mockReturnValue({
        data: mockPayments,
        isLoading: false,
        error: null,
      });

      (useCreatePayment as ReturnType<typeof vi.fn>).mockReturnValue({
        mutateAsync: vi.fn(),
        isPending: false,
        isError: false,
        error: null,
      });

      (useUpdatePayment as ReturnType<typeof vi.fn>).mockReturnValue({
        mutateAsync: mockUpdatePayment,
        isPending: false,
        isError: false,
        error: null,
      });

      (useDeletePayment as ReturnType<typeof vi.fn>).mockReturnValue({
        mutateAsync: vi.fn(),
        isPending: false,
        isError: false,
        error: null,
      });

      render(<PaymentsPage />, { wrapper: createWrapper() });

      const editButtons = screen.getAllByText('Edit');
      await user.click(editButtons[0]);

      expect(screen.getByText('Save')).toBeInTheDocument();
      expect(screen.getByText('Cancel')).toBeInTheDocument();
    });

    it('deletes payment with confirmation', async () => {
      const user = userEvent.setup();
      const mockHasRole = vi.fn((role: string) => role === 'VENDOR');
      const mockDeletePayment = vi.fn().mockResolvedValue(true);

      (useAuthStore as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
        user: { id: 'user-1', email: 'vendor@example.com', name: 'Vendor', role: 'VENDOR' },
        hasRole: mockHasRole,
      });

      (usePayments as ReturnType<typeof vi.fn>).mockReturnValue({
        data: mockPayments,
        isLoading: false,
        error: null,
      });

      (useCreatePayment as ReturnType<typeof vi.fn>).mockReturnValue({
        mutateAsync: vi.fn(),
        isPending: false,
        isError: false,
        error: null,
      });

      (useUpdatePayment as ReturnType<typeof vi.fn>).mockReturnValue({
        mutateAsync: vi.fn(),
        isPending: false,
        isError: false,
        error: null,
      });

      (useDeletePayment as ReturnType<typeof vi.fn>).mockReturnValue({
        mutateAsync: mockDeletePayment,
        isPending: false,
        isError: false,
        error: null,
      });

      render(<PaymentsPage />, { wrapper: createWrapper() });

      const deleteButtons = screen.getAllByText('Delete');
      await user.click(deleteButtons[0]);

      expect(screen.getByText('Confirm')).toBeInTheDocument();
      expect(screen.getByText('Cancel')).toBeInTheDocument();

      const confirmButton = screen.getByText('Confirm');
      await user.click(confirmButton);

      await waitFor(() => {
        expect(mockDeletePayment).toHaveBeenCalledWith('pay-1');
      });
    });
  });
});

