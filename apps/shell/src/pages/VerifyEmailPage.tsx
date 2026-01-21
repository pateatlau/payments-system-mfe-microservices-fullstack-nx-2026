import { ComponentType } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { RemoteErrorBoundary } from '../components/RemoteErrorBoundary';

/**
 * Props interface for the VerifyEmail component from auth-mfe
 */
export interface VerifyEmailComponentProps {
  token?: string | null;
  onNavigateToSignIn?: () => void;
  onNavigateToSignUp?: () => void;
}

/**
 * Props for VerifyEmailPage - allows dependency injection for testing
 */
export interface VerifyEmailPageProps {
  /**
   * VerifyEmail component to render.
   * In production, pass the lazy-loaded component from remotes.
   * In tests, pass a mock component.
   */
  VerifyEmailComponent: ComponentType<VerifyEmailComponentProps>;
}

/**
 * VerifyEmailPage component
 *
 * Wrapper for VerifyEmail component.
 * Extracts token from URL query parameter.
 * Uses dependency injection pattern - component must be provided via props.
 *
 * URL format: /verify-email?token=<verification_token>
 *
 * @example
 * // Production usage (in routes)
 * import { VerifyEmailRemote } from './remotes';
 * <VerifyEmailPage VerifyEmailComponent={VerifyEmailRemote} />
 *
 * @example
 * // Test usage (with mock component)
 * <VerifyEmailPage VerifyEmailComponent={MockVerifyEmail} />
 */
export function VerifyEmailPage({ VerifyEmailComponent }: VerifyEmailPageProps) {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  // Extract token from URL query parameter
  const token = searchParams.get('token');

  // Handle navigation to sign-in page
  const handleNavigateToSignIn = () => {
    navigate('/signin', { replace: true });
  };

  // Handle navigation to sign-up page
  const handleNavigateToSignUp = () => {
    navigate('/signup', { replace: true });
  };

  return (
    <RemoteErrorBoundary componentName="VerifyEmail">
      <div className="min-h-full flex flex-col items-center justify-center py-8">
        <VerifyEmailComponent
          token={token}
          onNavigateToSignIn={handleNavigateToSignIn}
          onNavigateToSignUp={handleNavigateToSignUp}
        />
      </div>
    </RemoteErrorBoundary>
  );
}
