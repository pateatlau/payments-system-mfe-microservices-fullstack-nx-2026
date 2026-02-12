/**
 * Remote component loaders for Module Federation
 *
 * This file contains lazy-loaded components from remote MFEs.
 * These are used in production routes.
 *
 * For testing, mock the page components directly instead of this file.
 *
 * @security Part of Module Federation Security (Phase 6)
 * - Integrates with circuit breaker to skip loading unhealthy remotes
 * - Records failures to trigger circuit breaker protection
 * - Provides graceful fallbacks for unavailable remotes
 */
import { lazy, Suspense, ComponentType } from 'react';
import { isRemoteAvailable, remoteCircuitBreaker } from '@mfe/shared-utils';

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

/**
 * Custom error class for remote loading failures
 * Allows RemoteErrorBoundary to identify and handle remote-specific errors
 */
class RemoteLoadError extends Error {
  constructor(
    message: string,
    public readonly remoteName: string,
    public readonly componentName: string,
    public readonly isCircuitOpen: boolean
  ) {
    super(message);
    this.name = 'RemoteLoadError';
  }
}

/**
 * Create a lazy-loaded remote component with circuit breaker integration
 *
 * @param remoteName - Name of the remote MFE (e.g., 'authMfe')
 * @param componentName - Name of the component (e.g., 'SignIn')
 * @param importFn - Function that returns the dynamic import promise
 * @returns Lazy React component
 *
 * @throws RemoteLoadError - When circuit breaker is open or import fails
 *         The error is caught by RemoteErrorBoundary which renders the fallback
 *         This allows React.lazy to retry on future mounts instead of caching failure
 */
function createRemoteComponent(
  remoteName: string,
  componentName: string,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  importFn: () => Promise<{ default: ComponentType<any> }>
) {
  return lazy(async () => {
    // Check if circuit breaker allows requests to this remote
    if (!isRemoteAvailable(remoteName)) {
      // eslint-disable-next-line no-console
      console.warn(
        `[MFE] Skipping ${componentName} from ${remoteName} - circuit breaker is open`
      );
      // Reject so React.lazy will retry on next mount
      throw new RemoteLoadError(
        `Circuit breaker is open for ${remoteName}`,
        remoteName,
        componentName,
        true
      );
    }

    try {
      const module = await importFn();
      // Record success with circuit breaker
      remoteCircuitBreaker.recordSuccess(remoteName);
      return module;
    } catch (error) {
      // Record failure with circuit breaker
      const err = error instanceof Error ? error : new Error(String(error));
      remoteCircuitBreaker.recordFailure(remoteName, err);

      // eslint-disable-next-line no-console
      console.error(
        `[MFE] Failed to load ${componentName} from ${remoteName}:`,
        error
      );

      // Reject so React.lazy will retry on next mount
      throw new RemoteLoadError(
        `Failed to load ${componentName} from ${remoteName}: ${err.message}`,
        remoteName,
        componentName,
        false
      );
    }
  });
}

// Lazy-loaded remote components with circuit breaker integration
const LazySignIn = createRemoteComponent('authMfe', 'SignIn', () =>
  import('authMfe/SignIn')
);

const LazySignUp = createRemoteComponent('authMfe', 'SignUp', () =>
  import('authMfe/SignUp')
);

const LazyForgotPassword = createRemoteComponent(
  'authMfe',
  'ForgotPassword',
  () => import('authMfe/ForgotPassword')
);

const LazyResetPassword = createRemoteComponent('authMfe', 'ResetPassword', () =>
  import('authMfe/ResetPassword')
);

const LazyVerifyEmail = createRemoteComponent('authMfe', 'VerifyEmail', () =>
  import('authMfe/VerifyEmail')
);

const LazyOAuthCallback = createRemoteComponent('authMfe', 'OAuthCallback', () =>
  import('authMfe/OAuthCallback')
);

const LazyMfaRecommendation = createRemoteComponent(
  'authMfe',
  'MfaRecommendation',
  () => import('authMfe/MfaRecommendation')
);

const LazyPaymentsPage = createRemoteComponent(
  'paymentsMfe',
  'PaymentsPage',
  () => import('paymentsMfe/PaymentsPage')
);

const LazyReportsPage = createRemoteComponent('paymentsMfe', 'ReportsPage', () =>
  import('paymentsMfe/ReportsPage')
);

const LazyAdminDashboard = createRemoteComponent(
  'adminMfe',
  'AdminDashboard',
  () => import('adminMfe/AdminDashboard')
);

const LazyProfilePage = createRemoteComponent('profileMfe', 'ProfilePage', () =>
  import('profileMfe/ProfilePage')
);

// Export wrapped components with Suspense
export const SignInRemote = withSuspense(LazySignIn, 'Loading sign in...');
export const SignUpRemote = withSuspense(LazySignUp, 'Loading sign up...');
export const ForgotPasswordRemote = withSuspense(
  LazyForgotPassword,
  'Loading forgot password...'
);
export const ResetPasswordRemote = withSuspense(
  LazyResetPassword,
  'Loading reset password...'
);
export const VerifyEmailRemote = withSuspense(
  LazyVerifyEmail,
  'Loading email verification...'
);
export const OAuthCallbackRemote = withSuspense(
  LazyOAuthCallback,
  'Completing sign in...'
);
export const MfaRecommendationRemote = withSuspense(
  LazyMfaRecommendation,
  'Loading...'
);
export const PaymentsPageRemote = withSuspense(
  LazyPaymentsPage,
  'Loading payments...'
);
export const ReportsPageRemote = withSuspense(
  LazyReportsPage,
  'Loading reports...'
);
export const AdminDashboardRemote = withSuspense(
  LazyAdminDashboard,
  'Loading admin dashboard...'
);
export const ProfilePageRemote = withSuspense(
  LazyProfilePage,
  'Loading profile...'
);
