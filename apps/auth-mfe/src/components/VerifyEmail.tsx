import { useState, useEffect, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Button,
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  Alert,
  AlertDescription,
  Input,
  Label,
} from '@mfe/shared-design-system';
import { getApiClient } from '@mfe/shared-api-client';
import hdfcLogo from '../assets/hdfc-logo-03.png';

/**
 * Resend email form schema using Zod
 */
const resendEmailSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
});

type ResendEmailFormData = z.infer<typeof resendEmailSchema>;

/**
 * Verification states
 */
type VerificationState = 'verifying' | 'success' | 'error' | 'already_verified' | 'resend';

/**
 * VerifyEmail component props
 */
export interface VerifyEmailProps {
  /**
   * Token from URL query parameter
   */
  token?: string | null;
  /**
   * Optional callback when user wants to navigate to sign-in
   */
  onNavigateToSignIn?: () => void;
  /**
   * Optional callback when user wants to navigate to sign-up
   */
  onNavigateToSignUp?: () => void;
}

/**
 * Resend cooldown in seconds
 */
const RESEND_COOLDOWN_SECONDS = 60;

/**
 * VerifyEmail component
 *
 * Handles email verification link clicks from emails.
 * Displays appropriate states: verifying, success, error, or already verified.
 */
export function VerifyEmail({
  token,
  onNavigateToSignIn,
  onNavigateToSignUp,
}: VerifyEmailProps) {
  const [state, setState] = useState<VerificationState>(token ? 'verifying' : 'resend');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [errorCode, setErrorCode] = useState<string | null>(null);

  // Resend state
  const [isResending, setIsResending] = useState(false);
  const [resendSuccess, setResendSuccess] = useState(false);
  const [resendError, setResendError] = useState<string | null>(null);
  const [cooldownSeconds, setCooldownSeconds] = useState(0);

  // React Hook Form for resend email
  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
  } = useForm<ResendEmailFormData>({
    resolver: zodResolver(resendEmailSchema),
    defaultValues: {
      email: '',
    },
  });

  // Watch the email field for button disabled state
  const resendEmail = watch('email');

  /**
   * Verify email with token
   */
  const verifyEmail = useCallback(async (verificationToken: string) => {
    try {
      setState('verifying');
      setErrorMessage(null);
      setErrorCode(null);

      const apiClient = getApiClient();
      const response = await apiClient.post<{ alreadyVerified?: boolean }>('/auth/verify-email', {
        token: verificationToken,
      });

      if (response.success) {
        // Handle alreadyVerified flag from backend
        if (response.data?.alreadyVerified) {
          setState('already_verified');
          setErrorMessage('Your email has already been verified. You can sign in to your account.');
        } else {
          setState('success');
        }
      }
    } catch (err) {
      const error = err as {
        response?: {
          status?: number;
          data?: {
            error?: {
              code?: string;
              message?: string;
            };
          };
        };
        message?: string;
      };

      const code = error.response?.data?.error?.code;
      const message = error.response?.data?.error?.message;

      setErrorCode(code || null);

      if (code === 'ALREADY_VERIFIED') {
        setState('already_verified');
        setErrorMessage('Your email has already been verified. You can sign in to your account.');
      } else if (code === 'TOKEN_EXPIRED') {
        setState('error');
        setErrorMessage('This verification link has expired. Please request a new one.');
      } else if (code === 'INVALID_TOKEN' || code === 'TOKEN_NOT_FOUND') {
        setState('error');
        setErrorMessage('This verification link is invalid. Please request a new one.');
      } else if (!error.response) {
        setState('error');
        setErrorMessage('Network error. Please check your connection and try again.');
      } else {
        setState('error');
        setErrorMessage(message || 'Failed to verify email. Please try again.');
      }
    }
  }, []);

  // Verify on mount if token is provided
  useEffect(() => {
    if (token) {
      verifyEmail(token);
    }
  }, [token, verifyEmail]);

  // Countdown timer effect
  useEffect(() => {
    if (cooldownSeconds <= 0) return;

    const timer = setInterval(() => {
      setCooldownSeconds(prev => {
        if (prev <= 1) {
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [cooldownSeconds]);

  /**
   * Handle resend verification email
   */
  const handleResend = useCallback(async (data: ResendEmailFormData) => {
    if (cooldownSeconds > 0 || isResending) return;

    try {
      setIsResending(true);
      setResendError(null);
      setResendSuccess(false);

      const apiClient = getApiClient();
      await apiClient.post('/auth/resend-verification', {
        email: data.email,
      });

      setResendSuccess(true);
      setCooldownSeconds(RESEND_COOLDOWN_SECONDS);
    } catch (err) {
      const error = err as {
        response?: {
          status?: number;
          data?: { error?: { message?: string } };
        };
        message?: string;
      };

      if (error.response?.status === 429) {
        setResendError('Too many requests. Please try again later.');
        setCooldownSeconds(RESEND_COOLDOWN_SECONDS);
      } else if (!error.response) {
        setResendError('Network error. Please check your connection and try again.');
      } else {
        // Backend always returns success for security, so errors are network/server issues
        setResendError(
          error.response?.data?.error?.message ||
            'Failed to resend verification email. Please try again.'
        );
      }
    } finally {
      setIsResending(false);
    }
  }, [cooldownSeconds, isResending]);

  /**
   * Render loading/verifying state
   */
  const renderVerifying = () => (
    <div className="text-center">
      <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4">
        <svg
          className="animate-spin w-8 h-8 text-primary"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          />
        </svg>
      </div>
      <p className="text-muted-foreground">Verifying your email...</p>
    </div>
  );

  /**
   * Render success state
   */
  const renderSuccess = () => (
    <div className="space-y-6">
      <div className="text-center">
        <div className="mx-auto w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mb-4">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={2}
            stroke="currentColor"
            className="w-8 h-8 text-green-600 dark:text-green-400"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        </div>
        <p className="text-lg font-medium text-foreground mb-2">
          Email Verified Successfully!
        </p>
        <p className="text-muted-foreground">
          Your email has been verified. You can now sign in to your account.
        </p>
      </div>

      {onNavigateToSignIn && (
        <Button type="button" onClick={onNavigateToSignIn} className="w-full">
          Sign In to Your Account
        </Button>
      )}
    </div>
  );

  /**
   * Render already verified state
   */
  const renderAlreadyVerified = () => (
    <div className="space-y-6">
      <div className="text-center">
        <div className="mx-auto w-16 h-16 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center mb-4">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={2}
            stroke="currentColor"
            className="w-8 h-8 text-blue-600 dark:text-blue-400"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        </div>
        <p className="text-lg font-medium text-foreground mb-2">
          Already Verified
        </p>
        <p className="text-muted-foreground">{errorMessage}</p>
      </div>

      {onNavigateToSignIn && (
        <Button type="button" onClick={onNavigateToSignIn} className="w-full">
          Sign In to Your Account
        </Button>
      )}
    </div>
  );

  /**
   * Render error state with resend option
   */
  const renderError = () => (
    <div className="space-y-6">
      <div className="text-center">
        <div className="mx-auto w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mb-4">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={2}
            stroke="currentColor"
            className="w-8 h-8 text-red-600 dark:text-red-400"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z"
            />
          </svg>
        </div>
        <p className="text-lg font-medium text-foreground mb-2">
          Verification Failed
        </p>
        <p className="text-muted-foreground">{errorMessage}</p>
      </div>

      {/* Show resend form for expired/invalid tokens */}
      {(errorCode === 'TOKEN_EXPIRED' || errorCode === 'INVALID_TOKEN' || errorCode === 'TOKEN_NOT_FOUND') && (
        <div className="space-y-4">
          <p className="text-sm text-center text-muted-foreground">
            Enter your email address to receive a new verification link:
          </p>
          <form onSubmit={handleSubmit(handleResend)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="resend-email-error">Email</Label>
              <Input
                id="resend-email-error"
                type="email"
                {...register('email')}
                placeholder="you@example.com"
                disabled={isResending || cooldownSeconds > 0}
                autoComplete="email"
              />
              {errors.email && (
                <p className="text-sm text-destructive">{errors.email.message}</p>
              )}
            </div>

            {resendSuccess && (
              <Alert>
                <AlertDescription>
                  If an account exists with this email, a verification link has been sent.
                </AlertDescription>
              </Alert>
            )}

            {resendError && (
              <Alert variant="destructive">
                <AlertDescription>{resendError}</AlertDescription>
              </Alert>
            )}

            <Button
              type="submit"
              variant="outline"
              disabled={isResending || cooldownSeconds > 0 || !resendEmail}
              className="w-full"
            >
              {isResending
                ? 'Sending...'
                : cooldownSeconds > 0
                  ? `Resend available in ${cooldownSeconds}s`
                  : 'Send New Verification Link'}
            </Button>
          </form>
        </div>
      )}

      <div className="space-y-3">
        {onNavigateToSignIn && (
          <Button
            type="button"
            variant="outline"
            onClick={onNavigateToSignIn}
            className="w-full"
          >
            Back to Sign In
          </Button>
        )}

        {onNavigateToSignUp && (
          <div className="text-center">
            <Button type="button" variant="link" onClick={onNavigateToSignUp}>
              Create a new account
            </Button>
          </div>
        )}
      </div>
    </div>
  );

  /**
   * Render resend form (when no token provided)
   */
  const renderResendForm = () => (
    <div className="space-y-6">
      <div className="text-center">
        <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1.5}
            stroke="currentColor"
            className="w-8 h-8 text-primary"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M21.75 6.75v10.5a2.25 2.25 0 0 1-2.25 2.25h-15a2.25 2.25 0 0 1-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25m19.5 0v.243a2.25 2.25 0 0 1-1.07 1.916l-7.5 4.615a2.25 2.25 0 0 1-2.36 0L3.32 8.91a2.25 2.25 0 0 1-1.07-1.916V6.75"
            />
          </svg>
        </div>
        <p className="text-muted-foreground">
          Enter your email address to receive a verification link.
        </p>
      </div>

      <form onSubmit={handleSubmit(handleResend)} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="resend-email">Email</Label>
          <Input
            id="resend-email"
            type="email"
            {...register('email')}
            placeholder="you@example.com"
            disabled={isResending || cooldownSeconds > 0}
            autoComplete="email"
            autoFocus
          />
          {errors.email && (
            <p className="text-sm text-destructive">{errors.email.message}</p>
          )}
        </div>

        {resendSuccess && (
          <Alert>
            <AlertDescription>
              If an account exists with this email and is not yet verified, a verification link has been sent.
            </AlertDescription>
          </Alert>
        )}

        {resendError && (
          <Alert variant="destructive">
            <AlertDescription>{resendError}</AlertDescription>
          </Alert>
        )}

        <Button
          type="submit"
          disabled={isResending || cooldownSeconds > 0 || !resendEmail}
          className="w-full"
        >
          {isResending
            ? 'Sending...'
            : cooldownSeconds > 0
              ? `Resend available in ${cooldownSeconds}s`
              : 'Send Verification Link'}
        </Button>
      </form>

      <div className="space-y-3">
        {onNavigateToSignIn && (
          <Button
            type="button"
            variant="outline"
            onClick={onNavigateToSignIn}
            className="w-full"
          >
            Back to Sign In
          </Button>
        )}

        {onNavigateToSignUp && (
          <div className="text-center">
            <Button type="button" variant="link" onClick={onNavigateToSignUp}>
              Create a new account
            </Button>
          </div>
        )}
      </div>
    </div>
  );

  /**
   * Get content based on state
   */
  const getContent = () => {
    switch (state) {
      case 'verifying':
        return renderVerifying();
      case 'success':
        return renderSuccess();
      case 'already_verified':
        return renderAlreadyVerified();
      case 'error':
        return renderError();
      case 'resend':
        return renderResendForm();
      default:
        return renderVerifying();
    }
  };

  /**
   * Get title based on state
   */
  const getTitle = () => {
    switch (state) {
      case 'verifying':
        return 'Verifying Email';
      case 'success':
        return 'Email Verified';
      case 'already_verified':
        return 'Email Verified';
      case 'error':
        return 'Verification Failed';
      case 'resend':
        return 'Verify Your Email';
      default:
        return 'Email Verification';
    }
  };

  /**
   * Get description based on state
   */
  const getDescription = () => {
    switch (state) {
      case 'verifying':
        return 'Please wait while we verify your email address';
      case 'success':
        return 'Your account is now active';
      case 'already_verified':
        return 'Your account is already active';
      case 'error':
        return 'We encountered a problem';
      case 'resend':
        return 'Request a new verification link';
      default:
        return '';
    }
  };

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
            <CardTitle>{getTitle()}</CardTitle>
            <CardDescription>{getDescription()}</CardDescription>
          </CardHeader>
          <CardContent>{getContent()}</CardContent>
        </Card>
      </div>
    </div>
  );
}

export default VerifyEmail;
