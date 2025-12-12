/**
 * Event Bus Integration Hook for Shell
 *
 * Subscribes to relevant events from MFEs and handles:
 * - Auth events (login, logout, session expired)
 * - Payment events (created, updated, completed, failed)
 * - Navigation coordination
 *
 * This hook is the central event coordination point for the shell application.
 */

import { useEffect, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from 'shared-auth-store';
import {
  eventBus,
  type AuthLoginPayload,
  type AuthLogoutPayload,
  type AuthSessionExpiredPayload,
  type PaymentCreatedPayload,
  type PaymentUpdatedPayload,
  type PaymentCompletedPayload,
  type PaymentFailedPayload,
} from '@mfe/shared-event-bus';

/**
 * Options for event bus integration
 */
export interface EventBusIntegrationOptions {
  /**
   * Enable auth event subscriptions
   * @default true
   */
  enableAuthEvents?: boolean;

  /**
   * Enable payment event subscriptions
   * @default true
   */
  enablePaymentEvents?: boolean;

  /**
   * Enable system event emissions
   * @default true
   */
  enableSystemEvents?: boolean;

  /**
   * Enable debug logging
   * @default false
   */
  debug?: boolean;
}

/**
 * Hook to integrate event bus with shell application
 *
 * @example
 * function App() {
 *   useEventBusIntegration();
 *   return <AppRoutes />;
 * }
 */
export function useEventBusIntegration(
  options: EventBusIntegrationOptions = {}
): void {
  const {
    enableAuthEvents = true,
    enablePaymentEvents = true,
    enableSystemEvents = true,
    debug = false,
  } = options;

  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuthStore();

  /**
   * Debug logger
   */
  const log = useCallback(
    (message: string, data?: unknown) => {
      if (debug) {
        console.log(`[EventBus:Shell] ${message}`, data || '');
      }
    },
    [debug]
  );

  /**
   * Handle auth:login events
   * Emitted when user successfully logs in
   */
  useEffect(() => {
    if (!enableAuthEvents) return;

    const unsubscribe = eventBus.on(
      'auth:login',
      (payload: AuthLoginPayload) => {
        log('User logged in', {
          userId: payload.user.id,
          role: payload.user.role,
        });

        // Navigate to payments page after login
        // Unless we're already on a protected page
        if (
          location.pathname === '/signin' ||
          location.pathname === '/signup'
        ) {
          navigate('/payments', { replace: true });
        }
      }
    );

    return unsubscribe;
  }, [enableAuthEvents, navigate, location.pathname, log]);

  /**
   * Handle auth:logout events
   * Emitted when user logs out
   */
  useEffect(() => {
    if (!enableAuthEvents) return;

    const unsubscribe = eventBus.on(
      'auth:logout',
      (payload: AuthLogoutPayload) => {
        log('User logged out', {
          userId: payload.userId,
          reason: payload.reason,
        });

        // Navigate to signin page
        navigate('/signin', { replace: true });
      }
    );

    return unsubscribe;
  }, [enableAuthEvents, navigate, log]);

  /**
   * Handle auth:session-expired events
   * Emitted when user's session expires
   */
  useEffect(() => {
    if (!enableAuthEvents) return;

    const unsubscribe = eventBus.on(
      'auth:session-expired',
      (payload: AuthSessionExpiredPayload) => {
        log('Session expired', {
          userId: payload.userId,
          expiredAt: payload.expiredAt,
        });

        // Navigate to signin page with session expired message
        navigate('/signin', {
          replace: true,
          state: { sessionExpired: true },
        });
      }
    );

    return unsubscribe;
  }, [enableAuthEvents, navigate, log]);

  /**
   * Handle payments:created events
   * Emitted when a new payment is created
   */
  useEffect(() => {
    if (!enablePaymentEvents) return;

    const unsubscribe = eventBus.on(
      'payments:created',
      (payload: PaymentCreatedPayload) => {
        log('Payment created', {
          paymentId: payload.payment.id,
          amount: payload.payment.amount,
          status: payload.payment.status,
        });

        // Optionally show a notification (implement later)
        // For now, just log it
      }
    );

    return unsubscribe;
  }, [enablePaymentEvents, log]);

  /**
   * Handle payments:updated events
   * Emitted when a payment is updated
   */
  useEffect(() => {
    if (!enablePaymentEvents) return;

    const unsubscribe = eventBus.on(
      'payments:updated',
      (payload: PaymentUpdatedPayload) => {
        log('Payment updated', {
          paymentId: payload.payment.id,
          status: payload.payment.status,
          previousStatus: payload.previousStatus,
        });
      }
    );

    return unsubscribe;
  }, [enablePaymentEvents, log]);

  /**
   * Handle payments:completed events
   * Emitted when a payment is successfully completed
   */
  useEffect(() => {
    if (!enablePaymentEvents) return;

    const unsubscribe = eventBus.on(
      'payments:completed',
      (payload: PaymentCompletedPayload) => {
        log('Payment completed', {
          paymentId: payload.payment.id,
          amount: payload.payment.amount,
          completedAt: payload.completedAt,
        });

        // Optionally show success notification
      }
    );

    return unsubscribe;
  }, [enablePaymentEvents, log]);

  /**
   * Handle payments:failed events
   * Emitted when a payment fails
   */
  useEffect(() => {
    if (!enablePaymentEvents) return;

    const unsubscribe = eventBus.on(
      'payments:failed',
      (payload: PaymentFailedPayload) => {
        log('Payment failed', {
          paymentId: payload.payment.id,
          error: payload.error,
        });

        // Optionally show error notification
      }
    );

    return unsubscribe;
  }, [enablePaymentEvents, log]);

  /**
   * Emit system:navigation events when location changes
   */
  useEffect(() => {
    if (!enableSystemEvents) return;

    // Track previous location
    const previousLocation = location.pathname;

    return () => {
      // Emit navigation event when location changes
      const currentLocation = location.pathname;
      if (previousLocation !== currentLocation) {
        eventBus.emit(
          'system:navigation',
          {
            from: previousLocation,
            to: currentLocation,
            userId: user?.id,
          },
          'shell'
        );

        log('Navigation', {
          from: previousLocation,
          to: currentLocation,
        });
      }
    };
  }, [location.pathname, user?.id, enableSystemEvents, log]);

  /**
   * Log initialization
   */
  useEffect(() => {
    log('Event bus integration initialized', {
      authEvents: enableAuthEvents,
      paymentEvents: enablePaymentEvents,
      systemEvents: enableSystemEvents,
    });
  }, [enableAuthEvents, enablePaymentEvents, enableSystemEvents, log]);
}
