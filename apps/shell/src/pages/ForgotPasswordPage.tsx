import { ComponentType } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { useAuthStore } from 'shared-auth-store';
import { RemoteErrorBoundary } from '../components/RemoteErrorBoundary';

/**
 * Props interface for the ForgotPassword component from auth-mfe
 */
export interface ForgotPasswordComponentProps {
  onNavigateToSignIn?: () => void;
}

/**
 * Props for ForgotPasswordPage - allows dependency injection for testing
 */
export interface ForgotPasswordPageProps {
  /**
   * ForgotPassword component to render.
   * In production, pass the lazy-loaded component from remotes.
   * In tests, pass a mock component.
   */
  ForgotPasswordComponent: ComponentType<ForgotPasswordComponentProps>;
}

/**
 * ForgotPasswordPage component
 *
 * Wrapper for ForgotPassword component.
 * Uses dependency injection pattern - component must be provided via props.
 *
 * @example
 * // Production usage (in routes)
 * import { ForgotPasswordRemote } from './remotes';
 * <ForgotPasswordPage ForgotPasswordComponent={ForgotPasswordRemote} />
 *
 * @example
 * // Test usage (with mock component)
 * <ForgotPasswordPage ForgotPasswordComponent={MockForgotPassword} />
 */
export function ForgotPasswordPage({ ForgotPasswordComponent }: ForgotPasswordPageProps) {
  const navigate = useNavigate();
  // Check if already authenticated (for initial page load / direct navigation)
  const isAuthenticated = useAuthStore(state => state.isAuthenticated);

  // Redirect to root if already authenticated (role-based routing will determine destination)
  if (isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  // Handle navigation back to sign-in page
  const handleNavigateToSignIn = () => {
    navigate('/signin', { replace: true });
  };

  return (
    <RemoteErrorBoundary componentName="ForgotPassword">
      <div className="min-h-full flex flex-col items-center justify-center py-8">
        <ForgotPasswordComponent onNavigateToSignIn={handleNavigateToSignIn} />
      </div>
    </RemoteErrorBoundary>
  );
}
