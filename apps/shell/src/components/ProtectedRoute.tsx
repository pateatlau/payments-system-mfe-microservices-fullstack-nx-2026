import { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuthStore } from 'shared-auth-store';
import { UserRole } from 'shared-types';
import { Loading } from '@mfe/shared-design-system';

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

  /**
   * Optional required role(s) for accessing this route
   * If provided, user must have one of these roles to access the route
   * Users without the required role will be redirected to accessDeniedRedirect
   */
  requiredRole?: UserRole | UserRole[];

  /**
   * Path to redirect to if user doesn't have required role
   * @default '/payments'
   */
  accessDeniedRedirect?: string;
}

/**
 * Default loading component shown while checking auth state
 * Uses design system Loading component
 */
function DefaultLoadingComponent() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-muted">
      <Loading size="lg" label="Checking authentication..." />
    </div>
  );
}

/**
 * ProtectedRoute component
 *
 * A wrapper component that protects routes requiring authentication and optionally role-based access.
 * Redirects unauthenticated users to the sign-in page.
 * Redirects users without required role to access denied page.
 * Shows a loading state while checking authentication.
 *
 * @example
 * // Basic usage - authentication only
 * <ProtectedRoute>
 *   <PaymentsPage />
 * </ProtectedRoute>
 *
 * @example
 * // Role-based protection - single role
 * <ProtectedRoute requiredRole={UserRole.ADMIN}>
 *   <AdminPage />
 * </ProtectedRoute>
 *
 * @example
 * // Role-based protection - multiple roles
 * <ProtectedRoute requiredRole={[UserRole.ADMIN, UserRole.VENDOR]}>
 *   <ReportsPage />
 * </ProtectedRoute>
 *
 * @example
 * // Custom redirect paths
 * <ProtectedRoute
 *   redirectTo="/login"
 *   accessDeniedRedirect="/unauthorized"
 * >
 *   <DashboardPage />
 * </ProtectedRoute>
 */
export function ProtectedRoute({
  children,
  redirectTo = '/signin',
  loadingComponent,
  requiredRole,
  accessDeniedRedirect = '/payments',
}: ProtectedRouteProps) {
  const { isAuthenticated, isLoading, hasRole, hasAnyRole } = useAuthStore();
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

  // Check role-based access if required
  if (requiredRole) {
    const hasRequiredRole = Array.isArray(requiredRole)
      ? hasAnyRole(requiredRole)
      : hasRole(requiredRole);

    if (!hasRequiredRole) {
      // User is authenticated but doesn't have required role
      return <Navigate to={accessDeniedRedirect} replace />;
    }
  }

  // User is authenticated and has required role (if specified), render children
  return <>{children}</>;
}
