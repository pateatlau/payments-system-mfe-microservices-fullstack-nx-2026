import { describe, it, expect, beforeEach } from '@jest/globals';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';
import {
  useCreatePayment,
  useUpdatePayment,
  useDeletePayment,
} from './usePaymentMutations';
import { useAuthStore } from 'shared-auth-store';
import {
  createPayment,
  updatePayment,
  deletePayment,
} from '../api/stubbedPayments';

// Mock the auth store
jest.mock('shared-auth-store', () => ({
  useAuthStore: jest.fn(),
}));

// Mock the stubbed payments API
jest.mock('../api/stubbedPayments', () => ({
  createPayment: jest.fn(),
  updatePayment: jest.fn(),
  deletePayment: jest.fn(),
}));

describe('usePaymentMutations', () => {
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
    jest.clearAllMocks();
  });

  const createWrapper = () => {
    return ({ children }: { children: React.ReactNode }) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );
  };

  describe('useCreatePayment', () => {
    it('creates payment when user is authenticated', async () => {
      const mockUser = {
        id: 'user-1',
        email: 'test@example.com',
        name: 'Test User',
        role: 'CUSTOMER' as const,
      };

      (useAuthStore as unknown as ReturnType<typeof jest.fn>).mockReturnValue({
        user: mockUser,
      });

      const mockPayment = {
        id: 'payment-1',
        userId: 'user-1',
        amount: 100,
        currency: 'USD',
        status: 'processing' as const,
        type: 'payment' as const,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      (createPayment as ReturnType<typeof jest.fn>).mockResolvedValue(
        mockPayment
      );

      const { result } = renderHook(() => useCreatePayment(), {
        wrapper: createWrapper(),
      });

      const createPaymentDto = {
        amount: 100,
        currency: 'USD',
        type: 'payment' as const,
      };

      result.current.mutate(createPaymentDto);

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(createPayment).toHaveBeenCalledWith('user-1', createPaymentDto);
      expect(result.current.data).toEqual(mockPayment);
    });

    it('throws error when user is not authenticated', async () => {
      (useAuthStore as unknown as ReturnType<typeof jest.fn>).mockReturnValue({
        user: null,
      });

      const { result } = renderHook(() => useCreatePayment(), {
        wrapper: createWrapper(),
      });

      const createPaymentDto = {
        amount: 100,
        type: 'payment' as const,
      };

      result.current.mutate(createPaymentDto);

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });

      expect(result.current.error?.message).toBe(
        'User must be authenticated to create payments'
      );
    });

    it('invalidates payments queries after successful creation', async () => {
      const mockUser = {
        id: 'user-1',
        email: 'test@example.com',
        name: 'Test User',
        role: 'CUSTOMER' as const,
      };

      (useAuthStore as unknown as ReturnType<typeof jest.fn>).mockReturnValue({
        user: mockUser,
      });

      const mockPayment = {
        id: 'payment-1',
        userId: 'user-1',
        amount: 100,
        currency: 'USD',
        status: 'processing' as const,
        type: 'payment' as const,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      (createPayment as ReturnType<typeof jest.fn>).mockResolvedValue(
        mockPayment
      );

      const invalidateQueriesSpy = jest.spyOn(queryClient, 'invalidateQueries');

      const { result } = renderHook(() => useCreatePayment(), {
        wrapper: createWrapper(),
      });

      result.current.mutate({
        amount: 100,
        type: 'payment' as const,
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(invalidateQueriesSpy).toHaveBeenCalledWith({
        queryKey: ['payments'],
      });
    });
  });

  describe('useUpdatePayment', () => {
    it('updates payment successfully', async () => {
      const mockPayment = {
        id: 'payment-1',
        userId: 'user-1',
        amount: 200,
        currency: 'USD',
        status: 'completed' as const,
        type: 'payment' as const,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      (updatePayment as ReturnType<typeof jest.fn>).mockResolvedValue(
        mockPayment
      );

      const { result } = renderHook(() => useUpdatePayment(), {
        wrapper: createWrapper(),
      });

      result.current.mutate({
        id: 'payment-1',
        data: { amount: 200, status: 'completed' as const },
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(updatePayment).toHaveBeenCalledWith('payment-1', {
        amount: 200,
        status: 'completed',
      });
      expect(result.current.data).toEqual(mockPayment);
    });

    it('handles update failure', async () => {
      (updatePayment as ReturnType<typeof jest.fn>).mockResolvedValue(null);

      const { result } = renderHook(() => useUpdatePayment(), {
        wrapper: createWrapper(),
      });

      result.current.mutate({
        id: 'non-existent',
        data: { amount: 200 },
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data).toBeNull();
    });

    it('invalidates and updates cache after successful update', async () => {
      const mockPayment = {
        id: 'payment-1',
        userId: 'user-1',
        amount: 200,
        currency: 'USD',
        status: 'completed' as const,
        type: 'payment' as const,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      (updatePayment as ReturnType<typeof jest.fn>).mockResolvedValue(
        mockPayment
      );

      const invalidateQueriesSpy = jest.spyOn(queryClient, 'invalidateQueries');
      const setQueryDataSpy = jest.spyOn(queryClient, 'setQueryData');

      const { result } = renderHook(() => useUpdatePayment(), {
        wrapper: createWrapper(),
      });

      result.current.mutate({
        id: 'payment-1',
        data: { amount: 200 },
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(invalidateQueriesSpy).toHaveBeenCalledWith({
        queryKey: ['payments'],
      });
      expect(setQueryDataSpy).toHaveBeenCalledWith(
        ['payments', 'detail', 'payment-1'],
        mockPayment
      );
    });
  });

  describe('useDeletePayment', () => {
    it('deletes payment successfully', async () => {
      (deletePayment as ReturnType<typeof jest.fn>).mockResolvedValue(true);

      const { result } = renderHook(() => useDeletePayment(), {
        wrapper: createWrapper(),
      });

      result.current.mutate('payment-1');

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(deletePayment).toHaveBeenCalledWith('payment-1');
      expect(result.current.data).toBe(true);
    });

    it('handles delete failure', async () => {
      (deletePayment as ReturnType<typeof jest.fn>).mockResolvedValue(false);

      const { result } = renderHook(() => useDeletePayment(), {
        wrapper: createWrapper(),
      });

      result.current.mutate('non-existent');

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data).toBe(false);
    });

    it('invalidates payments queries after successful deletion', async () => {
      (deletePayment as ReturnType<typeof jest.fn>).mockResolvedValue(true);

      const invalidateQueriesSpy = jest.spyOn(queryClient, 'invalidateQueries');

      const { result } = renderHook(() => useDeletePayment(), {
        wrapper: createWrapper(),
      });

      result.current.mutate('payment-1');

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(invalidateQueriesSpy).toHaveBeenCalledWith({
        queryKey: ['payments'],
      });
    });
  });
});
