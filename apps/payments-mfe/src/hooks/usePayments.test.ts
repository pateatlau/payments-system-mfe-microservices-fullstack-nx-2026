import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactNode } from 'react';
import { usePayments, usePaymentById } from './usePayments';
import * as paymentsApi from '../api/payments';
import { useAuthStore } from 'shared-auth-store';

// Mock dependencies
jest.mock('../api/payments');
jest.mock('shared-auth-store');

const mockListPayments = paymentsApi.listPayments as jest.MockedFunction<
  typeof paymentsApi.listPayments
>;
const mockGetPaymentById = paymentsApi.getPaymentById as jest.MockedFunction<
  typeof paymentsApi.getPaymentById
>;
const mockUseAuthStore = useAuthStore as unknown as jest.Mock;

// Mock payment data
const mockPayment = {
  id: '1',
  senderId: 'user1',
  recipientId: 'user2',
  amount: 100,
  currency: 'USD',
  status: 'pending',
  type: 'instant',
  description: 'Test payment',
  createdAt: '2024-01-01T00:00:00.000Z',
  updatedAt: '2024-01-01T00:00:00.000Z',
};

// Query client wrapper
const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });
  return ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
};

describe('usePayments', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseAuthStore.mockReturnValue({
      user: { id: 'user1', email: 'test@example.com', role: 'CUSTOMER' },
    });
  });

  it('fetches payments successfully', async () => {
    mockListPayments.mockResolvedValue([mockPayment]);

    const { result } = renderHook(() => usePayments(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data).toEqual([mockPayment]);
    expect(mockListPayments).toHaveBeenCalledWith({ page: 1, limit: 20 });
  });

  it('does not fetch when user is not authenticated', () => {
    mockUseAuthStore.mockReturnValue({ user: null });

    const { result } = renderHook(() => usePayments(), {
      wrapper: createWrapper(),
    });

    expect(result.current.isLoading).toBe(false);
    expect(mockListPayments).not.toHaveBeenCalled();
  });

  it('handles fetch error', async () => {
    mockListPayments.mockRejectedValue(new Error('Failed to fetch'));

    const { result } = renderHook(() => usePayments(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isError).toBe(true));

    expect(result.current.error).toBeTruthy();
  });
});

describe('usePaymentById', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('fetches payment by ID successfully', async () => {
    mockGetPaymentById.mockResolvedValue(mockPayment);

    const { result } = renderHook(() => usePaymentById('1'), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data).toEqual(mockPayment);
    expect(mockGetPaymentById).toHaveBeenCalledWith('1');
  });

  it('does not fetch when ID is not provided', () => {
    const { result } = renderHook(() => usePaymentById(undefined), {
      wrapper: createWrapper(),
    });

    expect(result.current.isLoading).toBe(false);
    expect(mockGetPaymentById).not.toHaveBeenCalled();
  });

  it('handles fetch error', async () => {
    mockGetPaymentById.mockRejectedValue(new Error('Payment not found'));

    const { result } = renderHook(() => usePaymentById('1'), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isError).toBe(true));

    expect(result.current.error).toBeTruthy();
  });
});
