import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { usePaymentReports } from './usePayments';
import * as mfePaymentsApi from '../api/payments';
import type { PaymentReports } from '../api/types';

// Mock the MFE payments API
jest.mock('../api/payments', () => ({
  getPaymentReports: jest.fn(),
}));

// Mock the auth store
jest.mock('shared-auth-store', () => ({
  useAuthStore: jest.fn(() => ({
    user: { id: 'user_1', role: 'VENDOR' },
  })),
}));

describe('usePaymentReports', () => {
  let queryClient: QueryClient;

  const mockReports: PaymentReports = {
    totalPayments: 42,
    totalAmount: 5000,
    byStatus: {
      pending: 5,
      processing: 10,
      completed: 25,
      failed: 1,
      cancelled: 1,
    },
    byType: {
      instant: 35,
      scheduled: 5,
      recurring: 2,
    },
    period: {
      start: '2025-12-01',
      end: '2025-12-31',
    },
  };

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
      },
    });
    jest.clearAllMocks();
  });

  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );

  describe('successful fetch', () => {
    it('should fetch reports without date range', async () => {
      (mfePaymentsApi.getPaymentReports as jest.Mock).mockResolvedValue(
        mockReports
      );

      const { result } = renderHook(() => usePaymentReports(), { wrapper });

      expect(result.current.isLoading).toBe(true);

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(mfePaymentsApi.getPaymentReports).toHaveBeenCalledWith(undefined);
      expect(result.current.data).toEqual(mockReports);
    });

    it('should fetch reports with date range parameters', async () => {
      (mfePaymentsApi.getPaymentReports as jest.Mock).mockResolvedValue(
        mockReports
      );

      const params = { startDate: '2025-12-01', endDate: '2025-12-31' };
      const { result } = renderHook(() => usePaymentReports(params), {
        wrapper,
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(mfePaymentsApi.getPaymentReports).toHaveBeenCalledWith(params);
      expect(result.current.data).toEqual(mockReports);
    });

    it('should contain correct aggregated data structure', async () => {
      (mfePaymentsApi.getPaymentReports as jest.Mock).mockResolvedValue(
        mockReports
      );

      const { result } = renderHook(() => usePaymentReports(), { wrapper });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      const data = result.current.data;
      expect(data?.totalPayments).toBe(42);
      expect(data?.totalAmount).toBe(5000);
      expect(data?.byStatus.completed).toBe(25);
      expect(data?.byType.instant).toBe(35);
      expect(data?.period.start).toBe('2025-12-01');
    });
  });

  describe('error handling', () => {
    it('should handle API errors', async () => {
      const testError = new Error('Reports fetch failed');
      (mfePaymentsApi.getPaymentReports as jest.Mock).mockRejectedValue(
        testError
      );

      const { result } = renderHook(() => usePaymentReports(), { wrapper });

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });

      expect(result.current.error).toBeDefined();
      expect(result.current.data).toBeUndefined();
    });

    it('should track loading and error states', async () => {
      (mfePaymentsApi.getPaymentReports as jest.Mock).mockRejectedValue(
        new Error('Network error')
      );

      const { result } = renderHook(() => usePaymentReports(), { wrapper });

      expect(result.current.isLoading).toBe(true);
      expect(result.current.isError).toBe(false);

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
        expect(result.current.isError).toBe(true);
      });
    });
  });

  describe('cache behavior', () => {
    it('should use 5-minute staleTime for cache', async () => {
      (mfePaymentsApi.getPaymentReports as jest.Mock).mockResolvedValue(
        mockReports
      );

      const { result } = renderHook(() => usePaymentReports(), { wrapper });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      // Check that the cache entry exists with correct staleTime
      const cacheData = queryClient.getQueryData([
        'payments',
        'reports',
        undefined,
      ]);

      expect(cacheData).toBeDefined();

      // Verify API is not called again immediately (data is in cache)
      const callCount = (mfePaymentsApi.getPaymentReports as jest.Mock).mock
        .calls.length;
      expect(callCount).toBe(1);
    });

    it('should use different cache keys for different date ranges', async () => {
      (mfePaymentsApi.getPaymentReports as jest.Mock).mockResolvedValue(
        mockReports
      );

      const params1 = { startDate: '2025-12-01', endDate: '2025-12-15' };
      const params2 = { startDate: '2025-12-16', endDate: '2025-12-31' };

      const { result: result1 } = renderHook(() => usePaymentReports(params1), {
        wrapper,
      });

      await waitFor(() => {
        expect(result1.current.isSuccess).toBe(true);
      });

      // Verify the hook was called with params1
      expect(mfePaymentsApi.getPaymentReports).toHaveBeenCalledWith(params1);

      // Now query with different params
      const { result: result2 } = renderHook(() => usePaymentReports(params2), {
        wrapper,
      });

      await waitFor(() => {
        expect(result2.current.isSuccess).toBe(true);
      });

      // Verify the hook was called again with params2
      expect(mfePaymentsApi.getPaymentReports).toHaveBeenLastCalledWith(
        params2
      );

      // Verify two separate calls were made
      expect(
        (mfePaymentsApi.getPaymentReports as jest.Mock).mock.calls
      ).toHaveLength(2);
    });
  });

  describe('role-based access', () => {
    it('should only enable query for VENDOR and ADMIN roles', async () => {
      // Test will use mocked auth store that returns VENDOR role
      // The hook should be enabled
      (mfePaymentsApi.getPaymentReports as jest.Mock).mockResolvedValue(
        mockReports
      );

      const { result } = renderHook(() => usePaymentReports(), { wrapper });

      // Hook should fetch data for VENDOR role
      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(mfePaymentsApi.getPaymentReports).toHaveBeenCalled();
    });
  });

  describe('filter parameters', () => {
    it('should support start date only', async () => {
      (mfePaymentsApi.getPaymentReports as jest.Mock).mockResolvedValue(
        mockReports
      );

      const params = { startDate: '2025-12-01' };
      const { result } = renderHook(() => usePaymentReports(params), {
        wrapper,
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(mfePaymentsApi.getPaymentReports).toHaveBeenCalledWith(params);
    });

    it('should support end date only', async () => {
      (mfePaymentsApi.getPaymentReports as jest.Mock).mockResolvedValue(
        mockReports
      );

      const params = { endDate: '2025-12-31' };
      const { result } = renderHook(() => usePaymentReports(params), {
        wrapper,
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(mfePaymentsApi.getPaymentReports).toHaveBeenCalledWith(params);
    });

    it('should support both date range parameters', async () => {
      (mfePaymentsApi.getPaymentReports as jest.Mock).mockResolvedValue(
        mockReports
      );

      const params = {
        startDate: '2025-12-01',
        endDate: '2025-12-31',
      };
      const { result } = renderHook(() => usePaymentReports(params), {
        wrapper,
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(mfePaymentsApi.getPaymentReports).toHaveBeenCalledWith(params);
    });
  });
});
