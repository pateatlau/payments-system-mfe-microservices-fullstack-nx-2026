import { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuthStore } from 'shared-auth-store';

/**
 * Props for ProtectedRoute component
 */
export interface ProtectedRouteProps {
  /**
   * The content to render if authenticated
   */
  children: ReactNode;

  /**
   * Path to redirect to if not authenticated
   * @default '/signin'
   */
  redirectTo?: string;

  /**
   * Optional loading component to show while checking auth state
   * If not provided, a default loading spinner is shown
   */
  loadingComponent?: ReactNode;
}

/**
 * Default loading component shown while checking auth state
 */
function DefaultLoadingComponent() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <div className="text-center">
        <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
        <p className="text-slate-600">Checking authentication...</p>
      </div>
    </div>
  );
}

/**
 * ProtectedRoute component
 *
 * A wrapper component that protects routes requiring authentication.
 * Redirects unauthenticated users to the sign-in page.
 * Shows a loading state while checking authentication.
 *
 * @example
 * // Basic usage
 * <ProtectedRoute>
 *   <PaymentsPage />
 * </ProtectedRoute>
 *
 * @example
 * // Custom redirect path
 * <ProtectedRoute redirectTo="/login">
 *   <DashboardPage />
 * </ProtectedRoute>
 *
 * @example
 * // Custom loading component
 * <ProtectedRoute loadingComponent={<CustomSpinner />}>
 *   <PaymentsPage />
 * </ProtectedRoute>
 */
export function ProtectedRoute({
  children,
  redirectTo = '/signin',
  loadingComponent,
}: ProtectedRouteProps) {
  const { isAuthenticated, isLoading } = useAuthStore();
  const location = useLocation();

  // Show loading state while checking auth
  if (isLoading) {
    return <>{loadingComponent || <DefaultLoadingComponent />}</>;
  }

  // Redirect to sign in if not authenticated
  // Pass the current location so we can redirect back after login
  if (!isAuthenticated) {
    return <Navigate to={redirectTo} state={{ from: location }} replace />;
  }

  // User is authenticated, render children
  return <>{children}</>;
}

