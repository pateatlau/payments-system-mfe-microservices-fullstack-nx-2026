import { ComponentType } from 'react';
import { RemoteErrorBoundary } from '../components/RemoteErrorBoundary';

/**
 * Props interface for the PaymentsPage component from payments-mfe
 * PaymentsPage from payments-mfe doesn't require props
 */
export type PaymentsComponentProps = Record<string, never>;

/**
 * Props for PaymentsPage - allows dependency injection for testing
 */
export interface PaymentsPageProps {
  /**
   * PaymentsPage component to render.
   * In production, pass the lazy-loaded component from remotes.
   * In tests, pass a mock component.
   */
  PaymentsComponent: ComponentType<PaymentsComponentProps>;
}

/**
 * PaymentsPage component
 * 
 * Wrapper for PaymentsPage component from payments-mfe.
 * Note: Route protection is handled by ProtectedRoute wrapper in AppRoutes.
 * Uses dependency injection pattern for testability.
 * Wrapped with error boundary for production readiness.
 * 
 * @example
 * // Production usage (in routes, wrapped with ProtectedRoute)
 * const PaymentsRemote = lazy(() => import('paymentsMfe/PaymentsPage'));
 * <ProtectedRoute>
 *   <PaymentsPage PaymentsComponent={PaymentsRemote} />
 * </ProtectedRoute>
 * 
 * @example
 * // Test usage (with mock component)
 * <PaymentsPage PaymentsComponent={MockPaymentsPage} />
 */
export function PaymentsPage({ PaymentsComponent }: PaymentsPageProps) {
  return (
    <RemoteErrorBoundary componentName="PaymentsPage">
      <PaymentsComponent />
    </RemoteErrorBoundary>
  );
}
