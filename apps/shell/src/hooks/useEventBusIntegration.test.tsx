import React from 'react';
import { renderHook, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { useAuthStore } from 'shared-auth-store';
import { eventBus } from '@mfe/shared-event-bus';
import { useEventBusIntegration } from './useEventBusIntegration';
import type {
  AuthLoginPayload,
  AuthLogoutPayload,
  AuthSessionExpiredPayload,
  PaymentCreatedPayload,
  PaymentCompletedPayload,
  PaymentFailedPayload,
} from '@mfe/shared-event-bus';

// Mock dependencies
jest.mock('shared-auth-store', () => ({
  useAuthStore: jest.fn(),
}));

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
  useLocation: () => ({ pathname: '/test' }),
}));

const mockNavigate = jest.fn();

// Test wrapper with Router
const wrapper = ({ children }: { children: React.ReactNode }) => {
  return <BrowserRouter>{children}</BrowserRouter>;
};

describe('useEventBusIntegration', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockNavigate.mockClear();
    eventBus.clearHistory();

    // Default auth store mock
    (useAuthStore as unknown as jest.Mock).mockReturnValue({
      user: { id: 'test-user-id', email: 'test@example.com', role: 'CUSTOMER' },
    });
  });

  describe('auth events', () => {
    it('handles auth:login event and navigates to payments', async () => {
      renderHook(() => useEventBusIntegration(), { wrapper });

      // Simulate login event from auth-mfe
      const loginPayload: AuthLoginPayload = {
        user: {
          id: 'user-123',
          email: 'user@example.com',
          name: 'Test User',
          role: 'CUSTOMER',
        },
        accessToken: 'test-access-token',
        refreshToken: 'test-refresh-token',
      };

      eventBus.emit('auth:login', loginPayload, 'auth-mfe');

      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith('/payments', {
          replace: true,
        });
      });
    });

    it('handles auth:logout event and navigates to signin', async () => {
      renderHook(() => useEventBusIntegration(), { wrapper });

      const logoutPayload: AuthLogoutPayload = {
        userId: 'user-123',
        reason: 'user_initiated',
      };

      eventBus.emit('auth:logout', logoutPayload, 'auth-mfe');

      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith('/signin', { replace: true });
      });
    });

    it('handles auth:session-expired event and navigates to signin', async () => {
      renderHook(() => useEventBusIntegration(), { wrapper });

      const sessionExpiredPayload: AuthSessionExpiredPayload = {
        userId: 'user-123',
        expiredAt: new Date().toISOString(),
      };

      eventBus.emit('auth:session-expired', sessionExpiredPayload, 'auth-mfe');

      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith('/signin', {
          replace: true,
          state: { sessionExpired: true },
        });
      });
    });

    it('does not subscribe to auth events when disabled', async () => {
      renderHook(() => useEventBusIntegration({ enableAuthEvents: false }), {
        wrapper,
      });

      const loginPayload: AuthLoginPayload = {
        user: {
          id: 'user-123',
          email: 'user@example.com',
          name: 'Test User',
          role: 'CUSTOMER',
        },
        accessToken: 'test-access-token',
        refreshToken: 'test-refresh-token',
      };

      eventBus.emit('auth:login', loginPayload, 'auth-mfe');

      await waitFor(
        () => {
          expect(mockNavigate).not.toHaveBeenCalled();
        },
        { timeout: 100 }
      );
    });
  });

  describe('payment events', () => {
    it('handles payments:created event', async () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

      renderHook(() => useEventBusIntegration({ debug: true }), { wrapper });

      const createdPayload: PaymentCreatedPayload = {
        payment: {
          id: 'payment-123',
          userId: 'user-123',
          amount: 100.0,
          currency: 'USD',
          status: 'pending',
          type: 'payment',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      };

      eventBus.emit('payments:created', createdPayload, 'payments-mfe');

      await waitFor(() => {
        expect(consoleSpy).toHaveBeenCalledWith(
          expect.stringContaining('[EventBus:Shell] Payment created'),
          expect.objectContaining({
            paymentId: 'payment-123',
            amount: 100.0,
          })
        );
      });

      consoleSpy.mockRestore();
    });

    it('handles payments:completed event', async () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

      renderHook(() => useEventBusIntegration({ debug: true }), { wrapper });

      const completedPayload: PaymentCompletedPayload = {
        payment: {
          id: 'payment-123',
          userId: 'user-123',
          amount: 100.0,
          currency: 'USD',
          status: 'completed',
          type: 'payment',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        completedAt: new Date().toISOString(),
      };

      eventBus.emit('payments:completed', completedPayload, 'payments-mfe');

      await waitFor(() => {
        expect(consoleSpy).toHaveBeenCalledWith(
          expect.stringContaining('[EventBus:Shell] Payment completed'),
          expect.any(Object)
        );
      });

      consoleSpy.mockRestore();
    });

    it('handles payments:failed event', async () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

      renderHook(() => useEventBusIntegration({ debug: true }), { wrapper });

      const failedPayload: PaymentFailedPayload = {
        payment: {
          id: 'payment-123',
          userId: 'user-123',
          amount: 100.0,
          currency: 'USD',
          status: 'failed',
          type: 'payment',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        error: {
          code: 'INSUFFICIENT_FUNDS',
          message: 'Insufficient funds',
        },
      };

      eventBus.emit('payments:failed', failedPayload, 'payments-mfe');

      await waitFor(() => {
        expect(consoleSpy).toHaveBeenCalledWith(
          expect.stringContaining('[EventBus:Shell] Payment failed'),
          expect.objectContaining({
            paymentId: 'payment-123',
            error: expect.objectContaining({
              code: 'INSUFFICIENT_FUNDS',
            }),
          })
        );
      });

      consoleSpy.mockRestore();
    });

    it('does not subscribe to payment events when disabled', async () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

      renderHook(
        () =>
          useEventBusIntegration({
            enablePaymentEvents: false,
            debug: true,
          }),
        { wrapper }
      );

      const createdPayload: PaymentCreatedPayload = {
        payment: {
          id: 'payment-123',
          userId: 'user-123',
          amount: 100.0,
          currency: 'USD',
          status: 'pending',
          type: 'payment',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      };

      eventBus.emit('payments:created', createdPayload, 'payments-mfe');

      await waitFor(
        () => {
          const paymentLogs = consoleSpy.mock.calls.filter(call =>
            call[0].includes('Payment created')
          );
          expect(paymentLogs).toHaveLength(0);
        },
        { timeout: 100 }
      );

      consoleSpy.mockRestore();
    });
  });

  describe('configuration', () => {
    it('enables debug logging when debug option is true', async () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

      renderHook(() => useEventBusIntegration({ debug: true }), { wrapper });

      await waitFor(() => {
        expect(consoleSpy).toHaveBeenCalledWith(
          expect.stringContaining(
            '[EventBus:Shell] Event bus integration initialized'
          ),
          expect.any(Object)
        );
      });

      consoleSpy.mockRestore();
    });

    it('does not log when debug is false', async () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

      renderHook(() => useEventBusIntegration({ debug: false }), { wrapper });

      await waitFor(
        () => {
          const eventBusLogs = consoleSpy.mock.calls.filter(call =>
            call[0].includes('[EventBus:Shell]')
          );
          expect(eventBusLogs).toHaveLength(0);
        },
        { timeout: 100 }
      );

      consoleSpy.mockRestore();
    });
  });

  describe('cleanup', () => {
    it('unsubscribes from events on unmount', () => {
      const { unmount } = renderHook(() => useEventBusIntegration(), {
        wrapper,
      });

      const listenerCountBefore = eventBus.getListenerCount('auth:login');

      unmount();

      const listenerCountAfter = eventBus.getListenerCount('auth:login');

      // Listeners should decrease after unmount
      expect(listenerCountAfter).toBeLessThan(listenerCountBefore);
    });
  });
});
