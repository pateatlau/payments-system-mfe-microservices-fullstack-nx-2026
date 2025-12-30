/**
 * ReportsPage Component
 *
 * Standalone page for viewing payment reports.
 * This is a vendor/admin-only page accessible via /reports route.
 */

import { useAuthStore } from 'shared-auth-store';
import { UserRole } from 'shared-types';
import { Alert, AlertTitle, AlertDescription } from '@mfe/shared-design-system';
import { PaymentReports } from './PaymentReports';

/**
 * ReportsPage component props
 */
export interface ReportsPageProps {
  /**
   * Optional callback when report data is refreshed
   */
  onRefresh?: () => void;
}

/**
 * ReportsPage - Payment reports page for vendors and admins
 */
export function ReportsPage({ onRefresh: _onRefresh }: ReportsPageProps = {}) {
  const { user, hasRole } = useAuthStore();

  // Not authenticated
  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen px-4 bg-muted">
        <Alert variant="warning" className="w-full max-w-md">
          <AlertTitle>Authentication Required</AlertTitle>
          <AlertDescription>
            Please sign in to view payment reports.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  // Check role access - only vendors and admins can view reports
  const isVendor = hasRole(UserRole.VENDOR);
  const isAdmin = hasRole(UserRole.ADMIN);

  if (!isVendor && !isAdmin) {
    return (
      <div className="flex items-center justify-center min-h-screen px-4 bg-muted">
        <Alert variant="warning" className="w-full max-w-md">
          <AlertTitle>Access Restricted</AlertTitle>
          <AlertDescription>
            Reports are available to vendors and admins only.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="w-full pb-8">
      <div className="mx-auto max-w-7xl">
        {/* Header */}
        <div className="mb-8">
          <h1 className="mb-2 text-3xl font-bold text-foreground">Reports</h1>
          <p className="text-muted-foreground">
            View payment analytics and generate reports
          </p>
        </div>

        {/* Reports Content */}
        <PaymentReports />
      </div>
    </div>
  );
}

export default ReportsPage;
