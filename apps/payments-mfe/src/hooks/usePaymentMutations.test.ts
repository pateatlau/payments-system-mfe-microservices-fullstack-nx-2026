import { renderHook, waitFor, act } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactNode } from 'react';
import {
  useCreatePayment,
  useUpdatePayment,
  useDeletePayment,
} from './usePaymentMutations';
import * as paymentsApi from '../api/payments';
import { useAuthStore } from 'shared-auth-store';
import { eventBus } from '@mfe/shared-event-bus';

// Mock dependencies
jest.mock('../api/payments');
jest.mock('shared-auth-store');
jest.mock('@mfe/shared-event-bus');

const mockCreatePayment = paymentsApi.createPayment as jest.MockedFunction<
  typeof paymentsApi.createPayment
>;
const mockUpdatePaymentStatus =
  paymentsApi.updatePaymentStatus as jest.MockedFunction<
    typeof paymentsApi.updatePaymentStatus
  >;
const mockUseAuthStore = useAuthStore as unknown as jest.Mock;
const mockEventBusEmit = eventBus.emit as jest.Mock;

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

describe('useCreatePayment', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseAuthStore.mockReturnValue({
      user: { id: 'user1', email: 'test@example.com', role: 'CUSTOMER' },
    });
  });

  it('creates payment successfully', async () => {
    mockCreatePayment.mockResolvedValue(mockPayment);

    const { result } = renderHook(() => useCreatePayment(), {
      wrapper: createWrapper(),
    });

    await act(async () => {
      await result.current.mutateAsync({
        amount: 100,
        currency: 'USD',
        type: 'instant' as const,
        description: 'Test payment',
        recipientEmail: 'recipient@example.com',
      });
    });

    expect(mockCreatePayment).toHaveBeenCalled();
    expect(mockEventBusEmit).toHaveBeenCalledWith(
      'payments:created',
      expect.objectContaining({
        payment: expect.objectContaining({
          id: '1',
          amount: 100,
        }),
      })
    );
  });

  it('throws error when user is not authenticated', async () => {
    mockUseAuthStore.mockReturnValue({ user: null });

    const { result } = renderHook(() => useCreatePayment(), {
      wrapper: createWrapper(),
    });

    await expect(
      result.current.mutateAsync({
        amount: 100,
        currency: 'USD',
        type: 'instant' as const,
        description: 'Test payment',
        recipientEmail: 'recipient@example.com',
      })
    ).rejects.toThrow('User must be authenticated');
  });

  it('throws error when recipient is not provided', async () => {
    const { result } = renderHook(() => useCreatePayment(), {
      wrapper: createWrapper(),
    });

    await expect(
      result.current.mutateAsync({
        amount: 100,
        currency: 'USD',
        type: 'instant' as const,
        description: 'Test payment',
      })
    ).rejects.toThrow('Recipient email or ID is required');
  });
});

describe('useUpdatePayment', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('updates payment successfully', async () => {
    mockUpdatePaymentStatus.mockResolvedValue({
      ...mockPayment,
      status: 'completed',
    });

    const { result } = renderHook(() => useUpdatePayment(), {
      wrapper: createWrapper(),
    });

    await act(async () => {
      await result.current.mutateAsync({
        id: '1',
        data: { status: 'completed' as const },
      });
    });

    expect(mockUpdatePaymentStatus).toHaveBeenCalledWith('1', {
      status: 'completed',
    });
    expect(mockEventBusEmit).toHaveBeenCalledWith(
      'payments:updated',
      expect.any(Object)
    );
  });

  it('emits completed event when status is completed', async () => {
    mockUpdatePaymentStatus.mockResolvedValue({
      ...mockPayment,
      status: 'completed',
      completedAt: '2024-01-01T01:00:00.000Z',
    });

    const { result } = renderHook(() => useUpdatePayment(), {
      wrapper: createWrapper(),
    });

    await act(async () => {
      await result.current.mutateAsync({
        id: '1',
        data: { status: 'completed' as const },
      });
    });

    expect(mockEventBusEmit).toHaveBeenCalledWith(
      'payments:completed',
      expect.objectContaining({
        payment: expect.objectContaining({
          id: '1',
        }),
      })
    );
  });
});

describe('useDeletePayment', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('deletes (cancels) payment successfully', async () => {
    mockUpdatePaymentStatus.mockResolvedValue({
      ...mockPayment,
      status: 'cancelled',
    });

    const { result } = renderHook(() => useDeletePayment(), {
      wrapper: createWrapper(),
    });

    await act(async () => {
      await result.current.mutateAsync('1');
    });

    expect(mockUpdatePaymentStatus).toHaveBeenCalledWith('1', {
      status: 'cancelled',
      reason: 'Cancelled by user',
    });
  });
});
