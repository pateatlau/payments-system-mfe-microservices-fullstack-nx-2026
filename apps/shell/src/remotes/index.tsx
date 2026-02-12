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
 * Error fallback component
 */
function ErrorFallback({
  componentName,
  remoteName,
  isCircuitOpen = false,
}: {
  componentName: string;
  remoteName?: string;
  isCircuitOpen?: boolean;
}) {
  return (
    <div className="min-h-[200px] flex items-center justify-center">
      <div className="max-w-md mx-auto bg-card rounded-lg shadow-lg p-8 text-center">
        <div className="mb-4 flex justify-center">
          <svg
            className="h-12 w-12 text-yellow-500"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
            />
          </svg>
        </div>
        <h2 className="text-xl font-bold text-foreground mb-2">
          {isCircuitOpen ? 'Service Temporarily Unavailable' : 'Failed to Load'}
        </h2>
        <p className="text-muted-foreground text-sm">
          {isCircuitOpen
            ? `The ${componentName} service is temporarily unavailable. Please try again later.`
            : `Failed to load ${componentName} component${remoteName ? ` from ${remoteName}` : ''}.`}
        </p>
        {isCircuitOpen && (
          <p className="text-xs text-muted-foreground mt-2">
            The system will automatically retry when the service recovers.
          </p>
        )}
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
 * Create a lazy-loaded remote component with circuit breaker integration
 *
 * @param remoteName - Name of the remote MFE (e.g., 'authMfe')
 * @param componentName - Name of the component (e.g., 'SignIn')
 * @param importFn - Function that returns the dynamic import promise
 * @returns Lazy React component
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
      return {
        default: () => (
          <ErrorFallback
            componentName={componentName}
            remoteName={remoteName}
            isCircuitOpen={true}
          />
        ),
      };
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

      return {
        default: () => (
          <ErrorFallback
            componentName={componentName}
            remoteName={remoteName}
            isCircuitOpen={false}
          />
        ),
      };
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
