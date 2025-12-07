import { ComponentType } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuthStore } from 'shared-auth-store';

/**
 * Props interface for the PaymentsPage component from payments-mfe
 */
export interface PaymentsComponentProps {
  // PaymentsPage from payments-mfe doesn't require props
}

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
 * Wrapper for PaymentsPage component.
 * Protected route - requires authentication.
 * Uses dependency injection pattern - component must be provided via props.
 * 
 * @example
 * // Production usage (in routes)
 * import { PaymentsPageRemote } from './remotes';
 * <PaymentsPage PaymentsComponent={PaymentsPageRemote} />
 * 
 * @example
 * // Test usage (with mock component)
 * <PaymentsPage PaymentsComponent={MockPaymentsPage} />
 */
export function PaymentsPage({ PaymentsComponent }: PaymentsPageProps) {
  const { isAuthenticated } = useAuthStore();

  // Redirect to sign in if not authenticated
  if (!isAuthenticated) {
    return <Navigate to="/signin" replace />;
  }

  return <PaymentsComponent />;
}
