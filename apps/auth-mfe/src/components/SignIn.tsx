import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuthStore } from 'shared-auth-store';
import { useEffect, useRef } from 'react';
import {
  Button,
  Input,
  Label,
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  Alert,
  AlertDescription,
} from '@mfe/shared-design-system';
import hdfcLogo from '../assets/hdfc-logo-03.png';

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

  // Clear auth store error when component mounts (to clear stale errors from previous sessions)
  // Note: We use an empty dependency array so this only runs on mount, not when error changes.
  // This allows error messages to be displayed to users before being cleared.
  useEffect(() => {
    clearError();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
    <div className="flex items-center justify-center w-full">
      <div className="w-full max-w-md">
        {/* HDFC Bank Logo */}
        <div className="flex justify-center mb-6">
          <img
            src={hdfcLogo}
            alt="HDFC Bank - We understand your world"
            className="h-16 object-contain"
          />
        </div>
        <Card>
          <CardHeader>
            <CardTitle>Sign In</CardTitle>
            <CardDescription>
              Enter your credentials to access your account
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form
              onSubmit={e => {
                e.preventDefault();
                handleSubmit(onSubmit)(e);
              }}
              className="space-y-6"
              noValidate
            >
              {/* Email field */}
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  {...register('email')}
                  placeholder="you@example.com"
                  disabled={isFormLoading}
                  autoComplete="email"
                />
                {errors.email && (
                  <p className="text-sm text-destructive" role="alert">
                    {errors.email.message}
                  </p>
                )}
              </div>

              {/* Password field */}
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  {...register('password')}
                  placeholder="Enter your password"
                  disabled={isFormLoading}
                  autoComplete="current-password"
                />
                {errors.password && (
                  <p className="text-sm text-destructive" role="alert">
                    {errors.password.message}
                  </p>
                )}
              </div>

              {/* Auth store error display */}
              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              {/* Submit button */}
              <Button type="submit" disabled={isFormLoading} className="w-full">
                {isFormLoading ? 'Signing in...' : 'Sign In'}
              </Button>
            </form>

            {/* Sign-up link */}
            {onNavigateToSignUp && (
              <div className="mt-6 text-center">
                <p className="text-sm text-muted-foreground">
                  Don't have an account?{' '}
                  <Button
                    type="button"
                    variant="link"
                    onClick={onNavigateToSignUp}
                  >
                    Sign up
                  </Button>
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default SignIn;
