import { ComponentType } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { useAuthStore } from 'shared-auth-store';
import { RemoteErrorBoundary } from '../components/RemoteErrorBoundary';

/**
 * Props interface for the SignIn component from auth-mfe
 */
export interface SignInComponentProps {
  onSuccess?: () => void;
  onNavigateToSignUp?: () => void;
}

/**
 * Props for SignInPage - allows dependency injection for testing
 */
export interface SignInPageProps {
  /**
   * SignIn component to render.
   * In production, pass the lazy-loaded component from remotes.
   * In tests, pass a mock component.
   */
  SignInComponent: ComponentType<SignInComponentProps>;
}

/**
 * SignInPage component
 *
 * Wrapper for SignIn component.
 * Uses dependency injection pattern - component must be provided via props.
 *
 * Navigation after login is handled via the onSuccess callback passed to SignInComponent.
 * This ensures navigation happens immediately after successful login,
 * avoiding issues with Zustand subscription across Module Federation boundaries.
 *
 * @example
 * // Production usage (in routes)
 * import { SignInRemote } from './remotes';
 * <SignInPage SignInComponent={SignInRemote} />
 *
 * @example
 * // Test usage (with mock component)
 * <SignInPage SignInComponent={MockSignIn} />
 */
export function SignInPage({ SignInComponent }: SignInPageProps) {
  const navigate = useNavigate();
  // Check if already authenticated (for initial page load / direct navigation)
  const isAuthenticated = useAuthStore(state => state.isAuthenticated);

  // Redirect to payments if already authenticated
  if (isAuthenticated) {
    return <Navigate to="/payments" replace />;
  }

  // Handle successful login - navigate to payments page
  const handleSuccess = () => {
    navigate('/payments', { replace: true });
  };

  // Handle navigation to sign-up page
  const handleNavigateToSignUp = () => {
    navigate('/signup', { replace: true });
  };

  return (
    <RemoteErrorBoundary componentName="SignIn">
      <div className="h-full min-h-0 flex items-center justify-center">
        <SignInComponent
          onSuccess={handleSuccess}
          onNavigateToSignUp={handleNavigateToSignUp}
        />
      </div>
    </RemoteErrorBoundary>
  );
}
