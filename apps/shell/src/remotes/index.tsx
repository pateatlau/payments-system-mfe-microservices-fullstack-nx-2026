/**
 * Remote component loaders for Module Federation
 *
 * This file contains lazy-loaded components from remote MFEs.
 * These are used in production routes.
 *
 * For testing, mock the page components directly instead of this file.
 */
import { lazy, Suspense, ComponentType } from 'react';

/**
 * Loading fallback component
 */
function LoadingFallback({ message = 'Loading...' }: { message?: string }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-muted">
      <div className="text-center">
        <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary mb-4"></div>
        <p className="text-muted-foreground">{message}</p>
      </div>
    </div>
  );
}

/**
 * Error fallback component
 */
function ErrorFallback({ componentName }: { componentName: string }) {
  return (
    <div className="max-w-md mx-auto bg-card rounded-lg shadow-lg p-8">
      <h2 className="text-2xl font-bold text-foreground mb-4">Error</h2>
      <p className="text-muted-foreground">
        Failed to load {componentName} component from remote
      </p>
    </div>
  );
}

/**
 * Higher-order component to wrap lazy-loaded components with Suspense
 */
function withSuspense<P extends object>(
  LazyComponent: ComponentType<P>,
  loadingMessage: string
) {
  return function WrappedComponent(props: P) {
    return (
      <Suspense fallback={<LoadingFallback message={loadingMessage} />}>
        <LazyComponent {...props} />
      </Suspense>
    );
  };
}

// Lazy-loaded remote components
const LazySignIn = lazy(() =>
  import('authMfe/SignIn').catch(() => ({
    default: () => <ErrorFallback componentName="SignIn" />,
  }))
);

const LazySignUp = lazy(() =>
  import('authMfe/SignUp').catch(() => ({
    default: () => <ErrorFallback componentName="SignUp" />,
  }))
);

const LazyPaymentsPage = lazy(() =>
  import('paymentsMfe/PaymentsPage').catch(() => ({
    default: () => <ErrorFallback componentName="PaymentsPage" />,
  }))
);

const LazyAdminDashboard = lazy(() =>
  import('adminMfe/AdminDashboard').catch(() => ({
    default: () => <ErrorFallback componentName="AdminDashboard" />,
  }))
);

const LazyProfilePage = lazy(() =>
  import('profileMfe/ProfilePage').catch(() => ({
    default: () => <ErrorFallback componentName="ProfilePage" />,
  }))
);

// Export wrapped components with Suspense
export const SignInRemote = withSuspense(LazySignIn, 'Loading sign in...');
export const SignUpRemote = withSuspense(LazySignUp, 'Loading sign up...');
export const PaymentsPageRemote = withSuspense(
  LazyPaymentsPage,
  'Loading payments...'
);
export const AdminDashboardRemote = withSuspense(
  LazyAdminDashboard,
  'Loading admin dashboard...'
);
export const ProfilePageRemote = withSuspense(
  LazyProfilePage,
  'Loading profile...'
);
