import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';
import { usePayments, useInvalidatePayments } from './usePayments';
import { useAuthStore } from 'shared-auth-store';
import { getPayments } from '../api/stubbedPayments';
import { resetPaymentsStore } from '../api/stubbedPayments';

// Mock the auth store
vi.mock('shared-auth-store', () => ({
  useAuthStore: vi.fn(),
}));

// Mock the stubbed payments API
vi.mock('../api/stubbedPayments', () => ({
  getPayments: vi.fn(),
  resetPaymentsStore: vi.fn(),
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
    vi.clearAllMocks();
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

    (useAuthStore as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
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

    (getPayments as ReturnType<typeof vi.fn>).mockResolvedValue(mockPayments);

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

    (useAuthStore as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
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

    (getPayments as ReturnType<typeof vi.fn>).mockResolvedValue(mockPayments);

    const { result } = renderHook(() => usePayments(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(getPayments).toHaveBeenCalledWith(undefined); // VENDOR role gets all payments
  });

  it('does not fetch when user is not authenticated', () => {
    (useAuthStore as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
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

    (useAuthStore as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
      user: mockUser,
    });

    (getPayments as ReturnType<typeof vi.fn>).mockImplementation(
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

    (useAuthStore as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
      user: mockUser,
    });

    const mockError = new Error('Failed to fetch payments');
    (getPayments as ReturnType<typeof vi.fn>).mockRejectedValue(mockError);

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
    const invalidateQueriesSpy = vi.spyOn(queryClient, 'invalidateQueries');

    const { result } = renderHook(() => useInvalidatePayments(), {
      wrapper: createWrapper(),
    });

    result.current();

    expect(invalidateQueriesSpy).toHaveBeenCalledWith({
      queryKey: ['payments'],
    });
  });
});

