import { ComponentType } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { useAuthStore } from 'shared-auth-store';

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
  const { isAuthenticated } = useAuthStore();
  const navigate = useNavigate();

  // Redirect to payments if already authenticated
  if (isAuthenticated) {
    return <Navigate to="/payments" replace />;
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4 py-12">
      <SignInComponent
        onSuccess={() => navigate('/payments', { replace: true })}
        onNavigateToSignUp={() => navigate('/signup', { replace: true })}
      />
    </div>
  );
}
