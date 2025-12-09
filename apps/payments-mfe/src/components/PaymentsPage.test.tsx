import { render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { PaymentsPage } from './PaymentsPage';
import { useAuthStore } from 'shared-auth-store';
import * as paymentsApi from '../api/payments';

// Mock dependencies
jest.mock('shared-auth-store');
jest.mock('../api/payments');
jest.mock('@mfe/shared-event-bus');

const mockUseAuthStore = useAuthStore as unknown as jest.Mock;
const mockListPayments = paymentsApi.listPayments as jest.MockedFunction<
  typeof paymentsApi.listPayments
>;

// Mock payment data
const mockPayments = [
  {
    id: '1',
    senderId: 'user1',
    recipientId: 'user2',
    amount: 100,
    currency: 'USD',
    status: 'pending',
    type: 'instant',
    description: 'Test payment 1',
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-01T00:00:00.000Z',
  },
  {
    id: '2',
    senderId: 'user1',
    recipientId: 'user3',
    amount: 200,
    currency: 'USD',
    status: 'completed',
    type: 'instant',
    description: 'Test payment 2',
    createdAt: '2024-01-02T00:00:00.000Z',
    updatedAt: '2024-01-02T00:00:00.000Z',
  },
];

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: false },
    mutations: { retry: false },
  },
});

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
);

describe('PaymentsPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    queryClient.clear();
    
    mockUseAuthStore.mockReturnValue({
      user: {
        id: 'user1',
        email: 'test@example.com',
        name: 'Test User',
        role: 'CUSTOMER',
      },
      hasRole: jest.fn((role: string) => role === 'CUSTOMER'),
    });
  });

  it('displays loading state initially', () => {
    mockListPayments.mockImplementation(
      () => new Promise(() => {}) // Never resolves
    );

    render(<PaymentsPage />, { wrapper });

    expect(screen.getByText(/loading payments/i)).toBeInTheDocument();
  });

  it('displays payments list after loading', async () => {
    mockListPayments.mockResolvedValue(mockPayments);

    render(<PaymentsPage />, { wrapper });

    await waitFor(() => {
      expect(screen.getByText(/test payment 1/i)).toBeInTheDocument();
      expect(screen.getByText(/test payment 2/i)).toBeInTheDocument();
    });
  });

  it('displays error state when fetch fails', async () => {
    mockListPayments.mockRejectedValue(new Error('Failed to fetch'));

    render(<PaymentsPage />, { wrapper });

    await waitFor(() => {
      expect(screen.getByText(/error loading payments/i)).toBeInTheDocument();
    });
  });

  it('displays empty state when no payments exist', async () => {
    mockListPayments.mockResolvedValue([]);

    render(<PaymentsPage />, { wrapper });

    await waitFor(() => {
      expect(screen.getByText(/no payments found/i)).toBeInTheDocument();
    });
  });

  it('displays create payment button for non-ADMIN users', async () => {
    mockListPayments.mockResolvedValue([]);
    mockUseAuthStore.mockReturnValue({
      user: {
        id: 'user1',
        email: 'test@example.com',
        name: 'Test User',
        role: 'CUSTOMER',
      },
      hasRole: jest.fn((role: string) => role === 'CUSTOMER'),
    });

    render(<PaymentsPage />, { wrapper });

    await waitFor(() => {
      expect(
        screen.getByRole('button', { name: /create payment/i })
      ).toBeInTheDocument();
    });
  });

  it('displays payment status badges', async () => {
    mockListPayments.mockResolvedValue(mockPayments);

    render(<PaymentsPage />, { wrapper });

    await waitFor(() => {
      expect(screen.getByText('pending')).toBeInTheDocument();
      expect(screen.getByText('completed')).toBeInTheDocument();
    });
  });

  it('formats currency correctly', async () => {
    mockListPayments.mockResolvedValue(mockPayments);

    render(<PaymentsPage />, { wrapper });

    await waitFor(() => {
      expect(screen.getByText(/\$100\.00/)).toBeInTheDocument();
      expect(screen.getByText(/\$200\.00/)).toBeInTheDocument();
    });
  });
});
