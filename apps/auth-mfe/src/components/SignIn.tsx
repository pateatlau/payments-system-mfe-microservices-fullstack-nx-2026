import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuthStore } from 'shared-auth-store';
import { useEffect, useRef, useState, useCallback } from 'react';
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
import { getApiClient } from '@mfe/shared-api-client';
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
/**
 * Resend cooldown in seconds
 */
const RESEND_COOLDOWN_SECONDS = 60;

export function SignIn({ onSuccess, onNavigateToSignUp, onNavigateToForgotPassword }: SignInProps = {}) {
  const {
    login,
    completeMfaLogin,
    cancelMfaLogin,
    isLoading,
    error,
    errorCode,
    clearError,
    isAuthenticated,
    mfaPending,
    user,
  } = useAuthStore();
  const onSuccessCalledRef = useRef(false);

  // Email verification resend state
  const [lastAttemptedEmail, setLastAttemptedEmail] = useState<string | null>(null);
  const [isResending, setIsResending] = useState(false);
  const [resendSuccess, setResendSuccess] = useState(false);
  const [resendError, setResendError] = useState<string | null>(null);
  const [cooldownSeconds, setCooldownSeconds] = useState(0);

  // Countdown timer for resend cooldown
  useEffect(() => {
    if (cooldownSeconds <= 0) return;

    const timer = setInterval(() => {
      setCooldownSeconds(prev => {
        if (prev <= 1) return 0;
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [cooldownSeconds]);

  // Handle resend verification email
  const handleResendVerification = useCallback(async () => {
    if (cooldownSeconds > 0 || isResending || !lastAttemptedEmail) return;

    try {
      setIsResending(true);
      setResendError(null);
      setResendSuccess(false);

      const apiClient = getApiClient();
      await apiClient.post('/auth/resend-verification', {
        email: lastAttemptedEmail,
      });

      setResendSuccess(true);
      setCooldownSeconds(RESEND_COOLDOWN_SECONDS);
    } catch (err) {
      const apiError = err as {
        response?: { status?: number; data?: { error?: { message?: string } } };
        message?: string;
      };

      if (apiError.response?.status === 429) {
        setResendError('Too many requests. Please try again later.');
        setCooldownSeconds(RESEND_COOLDOWN_SECONDS);
      } else if (!apiError.response) {
        setResendError('Network error. Please check your connection and try again.');
      } else {
        setResendError(
          apiError.response?.data?.error?.message ||
            'Failed to resend verification email. Please try again.'
        );
      }
    } finally {
      setIsResending(false);
    }
  }, [lastAttemptedEmail, cooldownSeconds, isResending]);

  // Check if error is EMAIL_NOT_VERIFIED
  const isEmailNotVerified = errorCode === 'EMAIL_NOT_VERIFIED';

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
      // Store email for potential resend verification
      setLastAttemptedEmail(data.email);
      // Reset resend state
      setResendSuccess(false);
      setResendError(null);

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

              {/* Auth store error display - special handling for EMAIL_NOT_VERIFIED */}
              {error && (
                isEmailNotVerified ? (
                  <div className="space-y-3">
                    <Alert variant="default" className="border-amber-500 bg-amber-50 dark:bg-amber-950/20">
                      <div className="flex flex-col gap-2">
                        <AlertDescription className="text-amber-800 dark:text-amber-200">
                          <strong>Email verification required</strong>
                          <p className="mt-1 text-sm">
                            Please check your inbox for a verification link before signing in.
                          </p>
                        </AlertDescription>
                      </div>
                    </Alert>

                    {/* Resend success message */}
                    {resendSuccess && (
                      <Alert variant="default" className="border-green-500 bg-green-50 dark:bg-green-950/20">
                        <AlertDescription className="text-green-800 dark:text-green-200">
                          Verification email sent! Please check your inbox.
                        </AlertDescription>
                      </Alert>
                    )}

                    {/* Resend error message */}
                    {resendError && (
                      <Alert variant="destructive">
                        <AlertDescription>{resendError}</AlertDescription>
                      </Alert>
                    )}

                    {/* Resend button */}
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleResendVerification}
                      disabled={isResending || cooldownSeconds > 0}
                      className="w-full"
                    >
                      {isResending
                        ? 'Sending...'
                        : cooldownSeconds > 0
                          ? `Resend available in ${cooldownSeconds}s`
                          : 'Resend Verification Email'}
                    </Button>
                  </div>
                ) : (
                  <Alert variant="destructive">
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )
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
