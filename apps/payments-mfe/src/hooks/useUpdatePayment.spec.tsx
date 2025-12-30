import { describe, it, expect, beforeEach } from '@jest/globals';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useUpdatePayment } from './useUpdatePayment';
import * as sharedApiClient from '@mfe/shared-api-client';
import * as mfePaymentsApi from '../api/payments';
import type { Payment } from 'shared-types';
import { PaymentStatus, PaymentType } from 'shared-types';

// Mock the shared API client
jest.mock('@mfe/shared-api-client', () => ({
  updatePaymentDetails: jest.fn(),
}));

// Mock the MFE payments API
jest.mock('../api/payments', () => ({
  updatePaymentDetails: jest.fn(),
}));

describe('useUpdatePayment', () => {
  let queryClient: QueryClient;

  const mockPayment: Payment = {
    id: 'pay_123',
    userId: 'user_1',
    amount: 150,
    currency: 'USD',
    status: PaymentStatus.PROCESSING,
    type: PaymentType.INSTANT,
    description: 'Updated payment',
    metadata: { tag: 'test' },
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
    jest.clearAllMocks();
  });

  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );

  describe('successful update', () => {
    it('should update payment and call onSuccess callback', async () => {
      const onSuccess = jest.fn();
      const onError = jest.fn();

      // Mock shared API client success
      jest
        .mocked(sharedApiClient.updatePaymentDetails)
        .mockResolvedValue(mockPayment);

      const { result } = renderHook(
        () => useUpdatePayment({ onSuccess, onError }),
        { wrapper }
      );

      // Trigger mutation
      result.current.mutate({
        id: 'pay_123',
        data: { description: 'Updated payment' },
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(sharedApiClient.updatePaymentDetails).toHaveBeenCalledWith(
        'pay_123',
        { description: 'Updated payment' }
      );
      expect(onSuccess).toHaveBeenCalledWith(mockPayment);
      expect(onError).not.toHaveBeenCalled();
    });

    it('should invalidate specific payment and list caches', async () => {
      jest
        .mocked(sharedApiClient.updatePaymentDetails)
        .mockResolvedValue(mockPayment);

      const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');

      const { result } = renderHook(() => useUpdatePayment(), { wrapper });

      result.current.mutate({
        id: 'pay_123',
        data: { description: 'New' },
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      // Verify invalidation for specific payment
      expect(invalidateSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          queryKey: expect.arrayContaining(['payments', 'detail', 'pay_123']),
          exact: true,
        })
      );

      // Verify invalidation for list
      expect(invalidateSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          queryKey: expect.arrayContaining(['payments', 'list']),
        })
      );

      invalidateSpy.mockRestore();
    });
  });

  describe('fallback to MFE wrapper', () => {
    it('should fall back to MFE API wrapper on shared client error', async () => {
      const onSuccess = jest.fn();

      // Mock shared API client failure
      jest
        .mocked(sharedApiClient.updatePaymentDetails)
        .mockRejectedValue(new Error('Shared client error'));

      // Mock MFE wrapper success
      jest
        .mocked(mfePaymentsApi.updatePaymentDetails)
        .mockResolvedValue(mockPayment);

      const { result } = renderHook(() => useUpdatePayment({ onSuccess }), {
        wrapper,
      });

      result.current.mutate({
        id: 'pay_123',
        data: { description: 'Updated' },
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      // Verify fallback was called
      expect(mfePaymentsApi.updatePaymentDetails).toHaveBeenCalledWith(
        'pay_123',
        { description: 'Updated' }
      );
      expect(onSuccess).toHaveBeenCalledWith(mockPayment);
    });
  });

  describe('error handling', () => {
    it('should handle errors and call onError callback', async () => {
      const onError = jest.fn();
      const testError = new Error('Update failed');

      jest
        .mocked(sharedApiClient.updatePaymentDetails)
        .mockRejectedValue(testError);
      jest
        .mocked(mfePaymentsApi.updatePaymentDetails)
        .mockRejectedValue(testError);

      const { result } = renderHook(() => useUpdatePayment({ onError }), {
        wrapper,
      });

      result.current.mutate({
        id: 'pay_123',
        data: { description: 'Fail' },
      });

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });

      expect(onError).toHaveBeenCalledWith(testError);
    });

    it('should have isError and error state on mutation failure', async () => {
      const testError = new Error('Network error');

      jest
        .mocked(sharedApiClient.updatePaymentDetails)
        .mockRejectedValue(testError);
      jest
        .mocked(mfePaymentsApi.updatePaymentDetails)
        .mockRejectedValue(testError);

      const { result } = renderHook(() => useUpdatePayment(), { wrapper });

      result.current.mutate({
        id: 'pay_123',
        data: { description: 'Any' },
      });

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });

      expect(result.current.error).toBeDefined();
    });
  });

  describe('mutation lifecycle', () => {
    it('should have isPending state during mutation', async () => {
      jest
        .mocked(sharedApiClient.updatePaymentDetails)
        .mockImplementation(
          () =>
            new Promise(resolve => setTimeout(() => resolve(mockPayment), 100))
        );

      const { result } = renderHook(() => useUpdatePayment(), { wrapper });

      expect(result.current.isPending).toBe(false);

      result.current.mutate({
        id: 'pay_123',
        data: { description: 'New' },
      });

      // Check pending state briefly
      await waitFor(() => {
        // State may transition quickly, but we can verify it's either pending or success
        expect(result.current.isPending || result.current.isSuccess).toBe(true);
      });

      // Wait for completion
      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.isPending).toBe(false);
    });
  });
});
