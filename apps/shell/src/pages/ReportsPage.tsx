import { ComponentType } from 'react';
import { RemoteErrorBoundary } from '../components/RemoteErrorBoundary';

/**
 * Props interface for the ReportsPage component from payments-mfe
 * ReportsPage from payments-mfe doesn't require props
 */
export type ReportsComponentProps = Record<string, never>;

/**
 * Props for ReportsPage - allows dependency injection for testing
 */
export interface ReportsPageProps {
  /**
   * ReportsPage component to render.
   * In production, pass the lazy-loaded component from remotes.
   * In tests, pass a mock component.
   */
  ReportsComponent: ComponentType<ReportsComponentProps>;
}

/**
 * ReportsPage component
 *
 * Wrapper for ReportsPage component from payments-mfe.
 * Note: Route protection is handled by ProtectedRoute wrapper in AppRoutes.
 * Uses dependency injection pattern for testability.
 * Wrapped with error boundary for production readiness.
 *
 * @example
 * // Production usage (in routes, wrapped with ProtectedRoute)
 * const ReportsRemote = lazy(() => import('paymentsMfe/ReportsPage'));
 * <ProtectedRoute requiredRole={UserRole.VENDOR}>
 *   <ReportsPage ReportsComponent={ReportsRemote} />
 * </ProtectedRoute>
 *
 * @example
 * // Test usage (with mock component)
 * <ReportsPage ReportsComponent={MockReportsPage} />
 */
export function ReportsPage({ ReportsComponent }: ReportsPageProps) {
  return (
    <RemoteErrorBoundary componentName="ReportsPage">
      <div className="h-full min-h-0">
        <ReportsComponent />
      </div>
    </RemoteErrorBoundary>
  );
}
