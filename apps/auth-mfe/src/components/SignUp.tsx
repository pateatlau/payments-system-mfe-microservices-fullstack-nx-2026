import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuthStore, type SignUpData } from 'shared-auth-store';
import { useEffect, useRef } from 'react';

/**
 * Password strength validation helper
 * Banking-grade requirements: minimum 12 characters, uppercase, lowercase, numbers, symbols
 */
// eslint-disable-next-line no-useless-escape
const passwordStrengthRegex =
  /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&#^()_+\-=[\]{};':"\\|,.<>\/])[A-Za-z\d@$!%*?&#^()_+\-=[\]{};':"\\|,.<>\/]{12,}$/;

/**
 * Sign-up form schema using Zod
 * Banking-grade password requirements: minimum 12 characters with complexity
 */
const signUpSchema = z
  .object({
    name: z
      .string()
      .min(1, 'Name is required')
      .min(2, 'Name must be at least 2 characters'),
    email: z.string().email('Invalid email address'),
    password: z
      .string()
      .min(12, 'Password must be at least 12 characters')
      .regex(
        passwordStrengthRegex,
        'Password must contain uppercase, lowercase, numbers, and symbols'
      ),
    confirmPassword: z.string().min(1, 'Please confirm your password'),
  })
  .refine(data => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

type SignUpFormData = z.infer<typeof signUpSchema>;

/**
 * SignUp component props
 */
export interface SignUpProps {
  /**
   * Optional callback when sign-up is successful
   */
  onSuccess?: () => void;
  /**
   * Optional callback when user wants to navigate to sign-in
   */
  onNavigateToSignIn?: () => void;
}

/**
 * SignUp component with form validation and auth store integration
 */
export function SignUp({ onSuccess, onNavigateToSignIn }: SignUpProps = {}) {
  const { signup, isLoading, error, clearError, isAuthenticated } =
    useAuthStore();
  const onSuccessCalledRef = useRef(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    watch,
  } = useForm<SignUpFormData>({
    resolver: zodResolver(signUpSchema),
    defaultValues: {
      name: '',
      email: '',
      password: '',
      confirmPassword: '',
    },
  });

  // Watch password for real-time strength feedback
  const password = watch('password');

  // Clear auth store error when component mounts or when error changes
  useEffect(() => {
    if (error) {
      clearError();
    }
  }, [error, clearError]);

  // Call onSuccess when authentication succeeds (only once)
  // Note: Navigation is handled by SignUpPage component via Navigate component
  // to avoid duplicate navigation attempts that cause browser throttling.
  useEffect(() => {
    if (isAuthenticated && !error && onSuccess && !onSuccessCalledRef.current) {
      onSuccessCalledRef.current = true;
      onSuccess();
    }
    // Reset ref when not authenticated (for re-signup scenarios)
    if (!isAuthenticated) {
      onSuccessCalledRef.current = false;
    }
  }, [isAuthenticated, error, onSuccess]);

  const onSubmit = async (data: SignUpFormData) => {
    try {
      const signUpData: SignUpData = {
        email: data.email,
        password: data.password,
        name: data.name,
      };
      await signup(signUpData);
      // Navigation is handled by SignUpPage component via Navigate component
      // when isAuthenticated becomes true. onSuccess is called via useEffect above.
    } catch (err) {
      // Error is handled by auth store
      // eslint-disable-next-line no-console
      console.error('Sign-up error:', err);
    }
  };

  const isFormLoading = isLoading || isSubmitting;

  // Password strength indicator
  const getPasswordStrength = (
    pwd: string
  ): { strength: string; color: string } => {
    if (!pwd) return { strength: '', color: '' };
    if (pwd.length < 12) {
      return { strength: 'Too short', color: 'text-red-600' };
    }
    const hasLower = /[a-z]/.test(pwd);
    const hasUpper = /[A-Z]/.test(pwd);
    const hasNumber = /\d/.test(pwd);
    // eslint-disable-next-line no-useless-escape
    const hasSymbol = /[@$!%*?&#^()_+\-=[\]{};':"\\|,.<>\/]/.test(pwd);

    const requirementsMet = [hasLower, hasUpper, hasNumber, hasSymbol].filter(
      Boolean
    ).length;

    if (requirementsMet === 4) {
      return { strength: 'Strong', color: 'text-green-600' };
    } else if (requirementsMet >= 2) {
      return { strength: 'Medium', color: 'text-yellow-600' };
    } else {
      return { strength: 'Weak', color: 'text-red-600' };
    }
  };

  const passwordStrength = getPasswordStrength(password);

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4 py-12">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <h1 className="text-3xl font-bold text-slate-900 mb-2">Sign Up</h1>
          <p className="text-slate-600 mb-8">
            Create your account to get started
          </p>

          <form
            onSubmit={e => {
              e.preventDefault();
              handleSubmit(onSubmit)(e);
            }}
            className="space-y-6"
            noValidate
          >
            {/* Name field */}
            <div>
              <label
                htmlFor="name"
                className="block text-sm font-medium text-slate-700 mb-2"
              >
                Full Name
              </label>
              <input
                id="name"
                type="text"
                {...register('name')}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-slate-100 disabled:cursor-not-allowed"
                placeholder="John Doe"
                disabled={isFormLoading}
                autoComplete="name"
              />
              {errors.name && (
                <p className="mt-1 text-sm text-red-600" role="alert">
                  {errors.name.message}
                </p>
              )}
            </div>

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
                autoComplete="new-password"
              />
              {password && password.length > 0 && (
                <p className={`mt-1 text-sm ${passwordStrength.color}`}>
                  Password strength: {passwordStrength.strength}
                </p>
              )}
              {errors.password && (
                <p className="mt-1 text-sm text-red-600" role="alert">
                  {errors.password.message}
                </p>
              )}
              <p className="mt-1 text-xs text-slate-500">
                Must be at least 12 characters with uppercase, lowercase,
                numbers, and symbols
              </p>
            </div>

            {/* Confirm Password field */}
            <div>
              <label
                htmlFor="confirmPassword"
                className="block text-sm font-medium text-slate-700 mb-2"
              >
                Confirm Password
              </label>
              <input
                id="confirmPassword"
                type="password"
                {...register('confirmPassword')}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-slate-100 disabled:cursor-not-allowed"
                placeholder="Confirm your password"
                disabled={isFormLoading}
                autoComplete="new-password"
              />
              {errors.confirmPassword && (
                <p className="mt-1 text-sm text-red-600" role="alert">
                  {errors.confirmPassword.message}
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
              {isFormLoading ? 'Creating account...' : 'Sign Up'}
            </button>
          </form>

          {/* Sign-in link */}
          {onNavigateToSignIn && (
            <div className="mt-6 text-center">
              <p className="text-sm text-slate-600">
                Already have an account?{' '}
                <button
                  type="button"
                  onClick={onNavigateToSignIn}
                  className="text-blue-600 hover:text-blue-700 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded"
                >
                  Sign in
                </button>
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default SignUp;
