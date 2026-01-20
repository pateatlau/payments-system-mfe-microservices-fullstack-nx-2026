import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuthStore } from 'shared-auth-store';
import { useEffect, useRef } from 'react';
import {
  Button,
  Input,
  PasswordInput,
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

/**
 * MFA verification form schema
 */
const mfaSchema = z.object({
  code: z
    .string()
    .min(6, 'Code must be at least 6 characters')
    .max(8, 'Code must be at most 8 characters')
    .regex(/^[A-Za-z0-9]+$/, 'Code must be alphanumeric'),
});

type SignInFormData = z.infer<typeof signInSchema>;
type MfaFormData = z.infer<typeof mfaSchema>;

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
  /**
   * Optional callback when user wants to navigate to forgot password
   */
  onNavigateToForgotPassword?: () => void;
}

/**
 * SignIn component with form validation, MFA support, and auth store integration
 */
export function SignIn({ onSuccess, onNavigateToSignUp, onNavigateToForgotPassword }: SignInProps = {}) {
  const {
    login,
    completeMfaLogin,
    cancelMfaLogin,
    isLoading,
    error,
    clearError,
    isAuthenticated,
    mfaPending,
    user,
  } = useAuthStore();
  const onSuccessCalledRef = useRef(false);

  // Sign-in form
  const {
    register: registerSignIn,
    handleSubmit: handleSignInSubmit,
    formState: { errors: signInErrors, isSubmitting: isSignInSubmitting },
  } = useForm<SignInFormData>({
    resolver: zodResolver(signInSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  // MFA form
  const {
    register: registerMfa,
    handleSubmit: handleMfaSubmit,
    formState: { errors: mfaErrors, isSubmitting: isMfaSubmitting },
    reset: resetMfaForm,
  } = useForm<MfaFormData>({
    resolver: zodResolver(mfaSchema),
    defaultValues: {
      code: '',
    },
  });

  // Clear auth store error when component mounts (to clear stale errors from previous sessions)
  // Note: We use an empty dependency array so this only runs on mount, not when error changes.
  // This allows error messages to be displayed to users before being cleared.
  useEffect(() => {
    clearError();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Reset MFA form when entering MFA state
  useEffect(() => {
    if (mfaPending) {
      resetMfaForm();
    }
  }, [mfaPending, resetMfaForm]);

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

  const onSignInSubmit = async (data: SignInFormData) => {
    try {
      await login(data.email, data.password);
      // After successful login (or MFA pending), the state is updated
      // Navigation is handled by useEffect when isAuthenticated becomes true
    } catch (err) {
      // Error is handled by auth store
      // eslint-disable-next-line no-console
      console.error('Sign-in error:', err);
    }
  };

  const onMfaSubmit = async (data: MfaFormData) => {
    try {
      await completeMfaLogin(data.code);
      // After successful MFA verification, isAuthenticated becomes true
      // Navigation is handled by useEffect
    } catch (err) {
      // Error is handled by auth store
      // eslint-disable-next-line no-console
      console.error('MFA verification error:', err);
    }
  };

  const handleCancelMfa = () => {
    cancelMfaLogin();
  };

  const isFormLoading = isLoading || isSignInSubmitting || isMfaSubmitting;

  // Render MFA verification form when MFA is pending
  if (mfaPending) {
    return (
      <div className="flex items-center justify-center w-full">
        <div className="w-full max-w-md">
          {/* HDFC Bank Logo */}
          <div className="flex justify-center">
            <img
              src={hdfcLogo}
              alt="HDFC Bank - We understand your world"
              className="w-1/2 object-contain"
            />
          </div>
          <Card>
            <CardHeader>
              <CardTitle>Two-Factor Authentication</CardTitle>
              <CardDescription>
                Enter the 6-digit code from your authenticator app
                {user?.email && (
                  <span className="block mt-1 font-medium">
                    Signing in as: {user.email}
                  </span>
                )}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form
                onSubmit={e => {
                  e.preventDefault();
                  handleMfaSubmit(onMfaSubmit)(e);
                }}
                className="space-y-6"
                noValidate
              >
                {/* MFA Code field */}
                <div className="space-y-2">
                  <Label htmlFor="mfa-code">Authentication Code</Label>
                  <Input
                    id="mfa-code"
                    type="text"
                    {...registerMfa('code')}
                    placeholder="Enter 6-digit code"
                    disabled={isFormLoading}
                    autoComplete="one-time-code"
                    autoFocus
                    maxLength={8}
                    className="text-center text-2xl tracking-widest"
                  />
                  {mfaErrors.code && (
                    <p className="text-sm text-destructive" role="alert">
                      {mfaErrors.code.message}
                    </p>
                  )}
                  <p className="text-xs text-muted-foreground">
                    You can also use an 8-character backup code
                  </p>
                </div>

                {/* Auth store error display */}
                {error && (
                  <Alert variant="destructive">
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}

                {/* Submit button */}
                <Button type="submit" disabled={isFormLoading} className="w-full">
                  {isFormLoading ? 'Verifying...' : 'Verify Code'}
                </Button>

                {/* Cancel button */}
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleCancelMfa}
                  disabled={isFormLoading}
                  className="w-full"
                >
                  Back to Sign In
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Render standard sign-in form
  return (
    <div className="flex items-center justify-center w-full">
      <div className="w-full max-w-md">
        {/* HDFC Bank Logo */}
        <div className="flex justify-center">
          <img
            src={hdfcLogo}
            alt="HDFC Bank - We understand your world"
            className="w-1/2 object-contain"
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
                handleSignInSubmit(onSignInSubmit)(e);
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
                  {...registerSignIn('email')}
                  placeholder="you@example.com"
                  disabled={isFormLoading}
                  autoComplete="email"
                />
                {signInErrors.email && (
                  <p className="text-sm text-destructive" role="alert">
                    {signInErrors.email.message}
                  </p>
                )}
              </div>

              {/* Password field */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password">Password</Label>
                  {onNavigateToForgotPassword && (
                    <Button
                      type="button"
                      variant="link"
                      onClick={onNavigateToForgotPassword}
                      className="p-0 h-auto text-xs"
                    >
                      Forgot password?
                    </Button>
                  )}
                </div>
                <PasswordInput
                  id="password"
                  {...registerSignIn('password')}
                  placeholder="Enter your password"
                  disabled={isFormLoading}
                  autoComplete="current-password"
                />
                {signInErrors.password && (
                  <p className="text-sm text-destructive" role="alert">
                    {signInErrors.password.message}
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
