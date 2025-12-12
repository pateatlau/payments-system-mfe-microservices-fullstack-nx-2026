import { ComponentType } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { useAuthStore } from 'shared-auth-store';
import { RemoteErrorBoundary } from '../components/RemoteErrorBoundary';

/**
 * Props interface for the SignUp component from auth-mfe
 */
export interface SignUpComponentProps {
  onSuccess?: () => void;
  onNavigateToSignIn?: () => void;
}

/**
 * Props for SignUpPage - allows dependency injection for testing
 */
export interface SignUpPageProps {
  /**
   * SignUp component to render.
   * In production, pass the lazy-loaded component from remotes.
   * In tests, pass a mock component.
   */
  SignUpComponent: ComponentType<SignUpComponentProps>;
}

/**
 * SignUpPage component
 *
 * Wrapper for SignUp component.
 * Uses dependency injection pattern - component must be provided via props.
 *
 * Navigation after signup is handled via the onSuccess callback passed to SignUpComponent.
 * This ensures navigation happens immediately after successful signup,
 * avoiding issues with Zustand subscription across Module Federation boundaries.
 *
 * @example
 * // Production usage (in routes)
 * import { SignUpRemote } from './remotes';
 * <SignUpPage SignUpComponent={SignUpRemote} />
 *
 * @example
 * // Test usage (with mock component)
 * <SignUpPage SignUpComponent={MockSignUp} />
 */
export function SignUpPage({ SignUpComponent }: SignUpPageProps) {
  const navigate = useNavigate();
  // Check if already authenticated (for initial page load / direct navigation)
  const isAuthenticated = useAuthStore(state => state.isAuthenticated);

  // Redirect to payments if already authenticated
  if (isAuthenticated) {
    return <Navigate to="/payments" replace />;
  }

  // Handle successful signup - navigate to payments page
  const handleSuccess = () => {
    navigate('/payments', { replace: true });
  };

  // Handle navigation to sign-in page
  const handleNavigateToSignIn = () => {
    navigate('/signin', { replace: true });
  };

  return (
    <RemoteErrorBoundary componentName="SignUp">
      <div className="h-full min-h-0 flex items-center justify-center">
        <SignUpComponent
          onSuccess={handleSuccess}
          onNavigateToSignIn={handleNavigateToSignIn}
        />
      </div>
    </RemoteErrorBoundary>
  );
}
