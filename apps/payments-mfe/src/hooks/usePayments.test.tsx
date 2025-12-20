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
});import { describe, it, expect, beforeEach } from '@jest/globals';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';
import { usePayments, useInvalidatePayments } from './usePayments';
import { useAuthStore } from 'shared-auth-store';
import { getPayments } from '../api/stubbedPayments';

// Mock the auth store
jest.mock('shared-auth-store', () => ({
  useAuthStore: jest.fn(),
}));

// Mock the stubbed payments API
jest.mock('../api/stubbedPayments', () => ({
  getPayments: jest.fn(),
  resetPaymentsStore: jest.fn(),
}));

describe('usePayments', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
        },
      },
    });
    jest.clearAllMocks();
  });

  const createWrapper = () => {
    return ({ children }: { children: React.ReactNode }) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );
  };

  it('fetches payments when user is authenticated', async () => {
    const mockUser = {
      id: 'user-1',
      email: 'test@example.com',
      name: 'Test User',
      role: 'CUSTOMER' as const,
    };

    (useAuthStore as unknown as ReturnType<typeof jest.fn>).mockReturnValue({
      user: mockUser,
    });

    const mockPayments = [
      {
        id: '1',
        userId: 'user-1',
        amount: 100,
        currency: 'USD',
        status: 'completed' as const,
        type: 'payment' as const,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    ];

    (getPayments as ReturnType<typeof jest.fn>).mockResolvedValue(mockPayments);

    const { result } = renderHook(() => usePayments(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.data).toEqual(mockPayments);
    expect(getPayments).toHaveBeenCalledWith('user-1'); // CUSTOMER role filters by userId
  });

  it('fetches all payments for VENDOR role', async () => {
    const mockUser = {
      id: 'user-2',
      email: 'vendor@example.com',
      name: 'Vendor User',
      role: 'VENDOR' as const,
    };

    (useAuthStore as unknown as ReturnType<typeof jest.fn>).mockReturnValue({
      user: mockUser,
    });

    const mockPayments = [
      {
        id: '1',
        userId: 'user-1',
        amount: 100,
        currency: 'USD',
        status: 'completed' as const,
        type: 'payment' as const,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    ];

    (getPayments as ReturnType<typeof jest.fn>).mockResolvedValue(mockPayments);

    const { result } = renderHook(() => usePayments(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(getPayments).toHaveBeenCalledWith(undefined); // VENDOR role gets all payments
  });

  it('does not fetch when user is not authenticated', () => {
    (useAuthStore as unknown as ReturnType<typeof jest.fn>).mockReturnValue({
      user: null,
    });

    const { result } = renderHook(() => usePayments(), {
      wrapper: createWrapper(),
    });

    expect(result.current.isFetching).toBe(false);
    expect(getPayments).not.toHaveBeenCalled();
  });

  it('handles loading state', () => {
    const mockUser = {
      id: 'user-1',
      email: 'test@example.com',
      name: 'Test User',
      role: 'CUSTOMER' as const,
    };

    (useAuthStore as unknown as ReturnType<typeof jest.fn>).mockReturnValue({
      user: mockUser,
    });

    (getPayments as ReturnType<typeof jest.fn>).mockImplementation(
      () => new Promise(() => {}) // Never resolves
    );

    const { result } = renderHook(() => usePayments(), {
      wrapper: createWrapper(),
    });

    expect(result.current.isLoading).toBe(true);
  });

  it('handles error state', async () => {
    const mockUser = {
      id: 'user-1',
      email: 'test@example.com',
      name: 'Test User',
      role: 'CUSTOMER' as const,
    };

    (useAuthStore as unknown as ReturnType<typeof jest.fn>).mockReturnValue({
      user: mockUser,
    });

    const mockError = new Error('Failed to fetch payments');
    (getPayments as ReturnType<typeof jest.fn>).mockRejectedValue(mockError);

    const { result } = renderHook(() => usePayments(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });

    expect(result.current.error).toBe(mockError);
  });
});

describe('useInvalidatePayments', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
        },
      },
    });
  });

  const createWrapper = () => {
    return ({ children }: { children: React.ReactNode }) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );
  };

  it('invalidates payments queries', () => {
    const invalidateQueriesSpy = jest.spyOn(queryClient, 'invalidateQueries');

    const { result } = renderHook(() => useInvalidatePayments(), {
      wrapper: createWrapper(),
    });

    result.current();

    expect(invalidateQueriesSpy).toHaveBeenCalledWith({
      queryKey: ['payments'],
    });
  });
});
