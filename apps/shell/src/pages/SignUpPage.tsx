import { Suspense, lazy } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { useAuthStore } from 'shared-auth-store';

// Lazy load SignUp component from auth-mfe remote
// This will be properly configured in Task 4.3
const SignUp = lazy(() =>
  import('authMfe/SignUp').catch(() => ({
    default: () => (
      <div className="max-w-md mx-auto bg-white rounded-lg shadow-lg p-8">
        <h2 className="text-2xl font-bold text-slate-900 mb-4">Sign Up</h2>
        <p className="text-slate-600">
          SignUp component will be loaded from auth-mfe remote (Task 4.3)
        </p>
      </div>
    ),
  }))
);

/**
 * SignUpPage component
 * Wrapper for SignUp component from auth-mfe
 */
export function SignUpPage() {
  const { isAuthenticated } = useAuthStore();
  const navigate = useNavigate();

  // Redirect to payments if already authenticated
  if (isAuthenticated) {
    return <Navigate to="/payments" replace />;
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4 py-12">
      <Suspense
        fallback={
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
            <p className="text-slate-600">Loading sign up...</p>
          </div>
        }
      >
        <SignUp
          onSuccess={() => {
            navigate('/payments', { replace: true });
          }}
          onNavigateToSignIn={() => {
            navigate('/signin', { replace: true });
          }}
        />
      </Suspense>
    </div>
  );
}

