import { Suspense, lazy } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuthStore } from 'shared-auth-store';

// Lazy load PaymentsPage component from payments-mfe remote
// This will be properly configured in Task 4.3
const PaymentsPageRemote = lazy(() =>
  import('paymentsMfe/PaymentsPage').catch(() => ({
    default: () => (
      <div className="max-w-7xl mx-auto bg-white rounded-lg shadow-lg p-8">
        <h2 className="text-2xl font-bold text-slate-900 mb-4">Payments</h2>
        <p className="text-slate-600">
          PaymentsPage component will be loaded from payments-mfe remote (Task 4.3)
        </p>
      </div>
    ),
  }))
);

/**
 * PaymentsPage component
 * Wrapper for PaymentsPage component from payments-mfe
 * Protected route - requires authentication
 */
export function PaymentsPage() {
  const { isAuthenticated } = useAuthStore();

  // Redirect to sign in if not authenticated
  if (!isAuthenticated) {
    return <Navigate to="/signin" replace />;
  }

  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-slate-50">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
            <p className="text-slate-600">Loading payments...</p>
          </div>
        </div>
      }
    >
      <PaymentsPageRemote />
    </Suspense>
  );
}

