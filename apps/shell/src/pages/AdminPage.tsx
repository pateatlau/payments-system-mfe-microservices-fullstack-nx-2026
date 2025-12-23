import { ComponentType, Suspense } from 'react';
import { RemoteErrorBoundary } from '../components/RemoteErrorBoundary';

/**
 * Props for AdminDashboard component from admin-mfe
 */
export interface AdminDashboardComponentProps {
  // Admin dashboard props (can be extended as needed)
}

/**
 * Props for AdminPage wrapper component
 */
export interface AdminPageProps {
  /**
   * AdminDashboard component from admin-mfe remote
   * Injected via dependency injection pattern for testability
   */
  AdminDashboardComponent: ComponentType<AdminDashboardComponentProps>;
}

/**
 * Loading fallback for admin dashboard
 */
function AdminLoadingFallback() {
  return (
    <div className="h-full min-h-0 flex items-center justify-center">
      <div className="text-center">
        <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
        <p className="text-muted-foreground">Loading admin dashboard...</p>
      </div>
    </div>
  );
}

/**
 * AdminPage component
 *
 * Wrapper page component for the Admin MFE's AdminDashboard component.
 * This page is only accessible to users with ADMIN role.
 *
 * Uses dependency injection pattern to receive the remote AdminDashboard component,
 * enabling testing without loading the actual remote.
 *
 * @example
 * // Production usage (in AppRoutes)
 * import { AdminDashboardRemote } from '../remotes';
 * <AdminPage AdminDashboardComponent={AdminDashboardRemote} />
 *
 * @example
 * // Test usage
 * const MockAdminDashboard = () => <div>Mock Admin Dashboard</div>;
 * <AdminPage AdminDashboardComponent={MockAdminDashboard} />
 */
export function AdminPage({ AdminDashboardComponent }: AdminPageProps) {
  return (
    <RemoteErrorBoundary componentName="Admin Dashboard">
      <div className="h-full min-h-0">
        <Suspense fallback={<AdminLoadingFallback />}>
          <AdminDashboardComponent />
        </Suspense>
      </div>
    </RemoteErrorBoundary>
  );
}
