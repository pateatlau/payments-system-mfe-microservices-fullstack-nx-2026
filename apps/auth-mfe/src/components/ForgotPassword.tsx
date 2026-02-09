import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useState } from 'react';
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
import { getApiClient } from '@mfe/shared-api-client';
import hdfcLogo from '../assets/hdfc-logo-03.png';

/**
 * Forgot password form schema using Zod
 */
const forgotPasswordSchema = z.object({
  email: z.string().email('Invalid email address'),
});

type ForgotPasswordFormData = z.infer<typeof forgotPasswordSchema>;

/**
 * ForgotPassword component props
 */
export interface ForgotPasswordProps {
  /**
   * Optional callback when user wants to navigate back to sign-in
   */
  onNavigateToSignIn?: () => void;
}

/**
 * ForgotPassword component
 *
 * Allows users to request a password reset link via email.
 * Shows a success message after submitting, regardless of whether
 * the email exists (for security - prevents email enumeration).
 */
export function ForgotPassword({ onNavigateToSignIn }: ForgotPasswordProps = {}) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [submittedEmail, setSubmittedEmail] = useState('');

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ForgotPasswordFormData>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: {
      email: '',
    },
  });

  const onSubmit = async (data: ForgotPasswordFormData) => {
    try {
      setIsLoading(true);
      setError(null);

      const apiClient = getApiClient();
      await apiClient.post('/auth/forgot-password', { email: data.email });

      // Always show success to prevent email enumeration
      setSubmittedEmail(data.email);
      setIsSubmitted(true);
    } catch (err) {
      // For security, we show success even if the email doesn't exist
      // Only show error for network/server issues
      const error = err as { response?: { status?: number }; message?: string };
      if (error.response?.status === 429) {
        setError('Too many requests. Please try again later.');
      } else if (!error.response) {
        setError('Network error. Please check your connection and try again.');
      } else {
        // For all other responses (including 404), show success
        setSubmittedEmail(data.email);
        setIsSubmitted(true);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const isFormLoading = isLoading || isSubmitting;

  // Show success message after submission
  if (isSubmitted) {
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
              <CardTitle>Check Your Email</CardTitle>
              <CardDescription>
                Password reset instructions sent
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
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
                <p className="text-muted-foreground mb-2">
                  If an account exists for{' '}
                  <span className="font-medium text-foreground">{submittedEmail}</span>,
                  you will receive a password reset link shortly.
                </p>
                <p className="text-sm text-muted-foreground">
                  Please check your inbox and spam folder.
                </p>
              </div>

              {/* Back to Sign In button */}
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

              {/* Resend link */}
              <div className="text-center">
                <p className="text-sm text-muted-foreground">
                  Didn't receive the email?{' '}
                  <Button
                    type="button"
                    variant="link"
                    onClick={() => {
                      setIsSubmitted(false);
                      setSubmittedEmail('');
                    }}
                    className="p-0 h-auto"
                  >
                    Try again
                  </Button>
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Render forgot password form
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
            <CardTitle>Forgot Password</CardTitle>
            <CardDescription>
              Enter your email address and we'll send you a link to reset your password
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
                <Label htmlFor="email">
                  Email <span className="text-destructive" aria-hidden="true">*</span>
                  <span className="sr-only"> (required)</span>
                </Label>
                <Input
                  id="email"
                  type="email"
                  {...register('email')}
                  placeholder="you@example.com"
                  disabled={isFormLoading}
                  autoComplete="email"
                  autoFocus
                  aria-required="true"
                />
                {errors.email && (
                  <p className="text-sm text-destructive" role="alert">
                    {errors.email.message}
                  </p>
                )}
              </div>

              {/* Error display */}
              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              {/* Submit button */}
              <Button type="submit" disabled={isFormLoading} className="w-full">
                {isFormLoading ? 'Sending...' : 'Send Reset Link'}
              </Button>
            </form>

            {/* Back to Sign In link */}
            {onNavigateToSignIn && (
              <div className="mt-6 text-center">
                <p className="text-sm text-muted-foreground">
                  Remember your password?{' '}
                  <Button
                    type="button"
                    variant="link"
                    onClick={onNavigateToSignIn}
                  >
                    Sign in
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

export default ForgotPassword;
