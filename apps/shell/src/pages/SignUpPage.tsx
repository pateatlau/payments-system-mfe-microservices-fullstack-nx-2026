import { ComponentType } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { useAuthStore } from 'shared-auth-store';

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
  const { isAuthenticated } = useAuthStore();
  const navigate = useNavigate();

  // Redirect to payments if already authenticated
  if (isAuthenticated) {
    return <Navigate to="/payments" replace />;
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4 py-12">
      <SignUpComponent
        onSuccess={() => navigate('/payments', { replace: true })}
        onNavigateToSignIn={() => navigate('/signin', { replace: true })}
      />
    </div>
  );
}
