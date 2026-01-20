import { ComponentType } from 'react';
import { Navigate, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuthStore } from 'shared-auth-store';
import { RemoteErrorBoundary } from '../components/RemoteErrorBoundary';

/**
 * Props interface for the ResetPassword component from auth-mfe
 */
export interface ResetPasswordComponentProps {
  userId?: string;
  token?: string;
  onNavigateToSignIn?: () => void;
}

/**
 * Props for ResetPasswordPage - allows dependency injection for testing
 */
export interface ResetPasswordPageProps {
  /**
   * ResetPassword component to render.
   * In production, pass the lazy-loaded component from remotes.
   * In tests, pass a mock component.
   */
  ResetPasswordComponent: ComponentType<ResetPasswordComponentProps>;
}

/**
 * ResetPasswordPage component
 *
 * Wrapper for ResetPassword component.
 * Extracts userId and token from URL query parameters.
 * Uses dependency injection pattern - component must be provided via props.
 *
 * @example
 * // Production usage (in routes)
 * import { ResetPasswordRemote } from './remotes';
 * <ResetPasswordPage ResetPasswordComponent={ResetPasswordRemote} />
 *
 * @example
 * // Test usage (with mock component)
 * <ResetPasswordPage ResetPasswordComponent={MockResetPassword} />
 */
export function ResetPasswordPage({ ResetPasswordComponent }: ResetPasswordPageProps) {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  // Check if already authenticated (for initial page load / direct navigation)
  const isAuthenticated = useAuthStore(state => state.isAuthenticated);

  // Redirect to root if already authenticated (role-based routing will determine destination)
  if (isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  // Extract userId and token from URL query parameters
  const userId = searchParams.get('userId') || undefined;
  const token = searchParams.get('token') || undefined;

  // Handle navigation back to sign-in page
  const handleNavigateToSignIn = () => {
    navigate('/signin', { replace: true });
  };

  return (
    <RemoteErrorBoundary componentName="ResetPassword">
      <div className="min-h-full flex flex-col items-center justify-center py-8">
        <ResetPasswordComponent
          userId={userId}
          token={token}
          onNavigateToSignIn={handleNavigateToSignIn}
        />
      </div>
    </RemoteErrorBoundary>
  );
}
