import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuthStore } from 'shared-auth-store';
import { useEffect, useRef } from 'react';

/**
 * Sign-in form schema using Zod
 */
const signInSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

type SignInFormData = z.infer<typeof signInSchema>;

/**
 * SignIn component props
 */
export interface SignInProps {
  /**
   * Optional callback when sign-in is successful
   */
  onSuccess?: () => void;
  /**
   * Optional callback when user wants to navigate to sign-up
   */
  onNavigateToSignUp?: () => void;
}

/**
 * SignIn component with form validation and auth store integration
 */
export function SignIn({ onSuccess, onNavigateToSignUp }: SignInProps = {}) {
  const { login, isLoading, error, clearError, isAuthenticated } =
    useAuthStore();
  const onSuccessCalledRef = useRef(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<SignInFormData>({
    resolver: zodResolver(signInSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  // Clear auth store error when component mounts or when error changes
  useEffect(() => {
    if (error) {
      clearError();
    }
  }, [error, clearError]);

  // Call onSuccess when authentication succeeds (only once)
  // Note: Navigation is handled by SignInPage component via Navigate component
  // to avoid duplicate navigation attempts that cause browser throttling.
  useEffect(() => {
    if (isAuthenticated && !error && onSuccess && !onSuccessCalledRef.current) {
      onSuccessCalledRef.current = true;
      onSuccess();
    }
    // Reset ref when not authenticated (for re-login scenarios)
    if (!isAuthenticated) {
      onSuccessCalledRef.current = false;
    }
  }, [isAuthenticated, error, onSuccess]);

  const onSubmit = async (data: SignInFormData) => {
    try {
      await login(data.email, data.password);
      // After successful login, onSuccess callback is called via useEffect
      // which triggers navigation in the parent SignInPage component
    } catch (err) {
      // Error is handled by auth store
      // eslint-disable-next-line no-console
      console.error('Sign-in error:', err);
    }
  };

  const isFormLoading = isLoading || isSubmitting;

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4 py-12">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <h1 className="text-3xl font-bold text-slate-900 mb-2">Sign In</h1>
          <p className="text-slate-600 mb-8">
            Enter your credentials to access your account
          </p>

          <form
            onSubmit={e => {
              e.preventDefault();
              handleSubmit(onSubmit)(e);
            }}
            className="space-y-6"
            noValidate
          >
            {/* Email field */}
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-slate-700 mb-2"
              >
                Email
              </label>
              <input
                id="email"
                type="email"
                {...register('email')}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-slate-100 disabled:cursor-not-allowed"
                placeholder="you@example.com"
                disabled={isFormLoading}
                autoComplete="email"
              />
              {errors.email && (
                <p className="mt-1 text-sm text-red-600" role="alert">
                  {errors.email.message}
                </p>
              )}
            </div>

            {/* Password field */}
            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium text-slate-700 mb-2"
              >
                Password
              </label>
              <input
                id="password"
                type="password"
                {...register('password')}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-slate-100 disabled:cursor-not-allowed"
                placeholder="Enter your password"
                disabled={isFormLoading}
                autoComplete="current-password"
              />
              {errors.password && (
                <p className="mt-1 text-sm text-red-600" role="alert">
                  {errors.password.message}
                </p>
              )}
            </div>

            {/* Auth store error display */}
            {error && (
              <div
                className="p-3 bg-red-50 border border-red-200 rounded-lg"
                role="alert"
              >
                <p className="text-sm text-red-800">{error}</p>
              </div>
            )}

            {/* Submit button */}
            <button
              type="submit"
              disabled={isFormLoading}
              className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:bg-slate-400 disabled:cursor-not-allowed transition-colors"
            >
              {isFormLoading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>

          {/* Sign-up link */}
          {onNavigateToSignUp && (
            <div className="mt-6 text-center">
              <p className="text-sm text-slate-600">
                Don't have an account?{' '}
                <button
                  type="button"
                  onClick={onNavigateToSignUp}
                  className="text-blue-600 hover:text-blue-700 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded"
                >
                  Sign up
                </button>
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default SignIn;
