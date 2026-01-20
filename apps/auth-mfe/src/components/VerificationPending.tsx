import { useState, useEffect, useCallback } from 'react';
import {
  Button,
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  Alert,
  AlertDescription,
} from '@mfe/shared-design-system';
import { getApiClient } from '@mfe/shared-api-client';
import type { EmailVerificationPendingState } from 'shared-auth-store';
import hdfcLogo from '../assets/hdfc-logo-03.png';

/**
 * VerificationPending component props
 */
export interface VerificationPendingProps {
  /**
   * Email verification state from auth store
   */
  verificationState: EmailVerificationPendingState;
  /**
   * Optional callback when user wants to navigate to sign-in
   */
  onNavigateToSignIn?: () => void;
  /**
   * Optional callback when user wants to try signing up with different email
   */
  onTryDifferentEmail?: () => void;
}

/**
 * Resend cooldown in seconds
 */
const RESEND_COOLDOWN_SECONDS = 60;

/**
 * VerificationPending component
 *
 * Displayed after successful registration when email verification is required.
 * Shows instructions to check email and provides resend functionality with cooldown.
 */
export function VerificationPending({
  verificationState,
  onNavigateToSignIn,
  onTryDifferentEmail,
}: VerificationPendingProps) {
  const [isResending, setIsResending] = useState(false);
  const [resendError, setResendError] = useState<string | null>(null);
  const [resendSuccess, setResendSuccess] = useState(false);
  const [cooldownSeconds, setCooldownSeconds] = useState(0);

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
  const handleResend = useCallback(async () => {
    if (cooldownSeconds > 0 || isResending) return;

    try {
      setIsResending(true);
      setResendError(null);
      setResendSuccess(false);

      const apiClient = getApiClient();
      await apiClient.post('/auth/resend-verification', {
        email: verificationState.email,
      });

      setResendSuccess(true);
      setCooldownSeconds(RESEND_COOLDOWN_SECONDS);
    } catch (err) {
      const error = err as { response?: { status?: number; data?: { error?: { message?: string } } }; message?: string };

      if (error.response?.status === 429) {
        // Rate limited - extract retry after if available
        setResendError('Too many requests. Please try again later.');
        setCooldownSeconds(RESEND_COOLDOWN_SECONDS);
      } else if (!error.response) {
        setResendError('Network error. Please check your connection and try again.');
      } else {
        // For security, the backend always returns success to prevent email enumeration
        // So any error here is likely a network or server issue
        setResendError(error.response?.data?.error?.message || 'Failed to resend verification email. Please try again.');
      }
    } finally {
      setIsResending(false);
    }
  }, [verificationState.email, cooldownSeconds, isResending]);

  /**
   * Mask email for display (e.g., j***e@example.com)
   */
  const getMaskedEmail = (email: string): string => {
    const [localPart, domain] = email.split('@');
    if (!localPart || !domain) return email;
    if (localPart.length <= 2) return `${localPart[0]}*@${domain}`;
    return `${localPart[0]}${'*'.repeat(Math.min(localPart.length - 2, 5))}${localPart[localPart.length - 1]}@${domain}`;
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
            <CardTitle>Verify Your Email</CardTitle>
            <CardDescription>
              We've sent a verification link to your email
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Email icon and message */}
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
                A verification link has been sent to{' '}
                <span className="font-medium text-foreground">
                  {getMaskedEmail(verificationState.email)}
                </span>
              </p>
              <p className="text-sm text-muted-foreground">
                Please click the link in the email to verify your account.
                The link will expire in 24 hours.
              </p>
            </div>

            {/* Instructions */}
            <div className="bg-muted/50 rounded-lg p-4 text-sm">
              <p className="font-medium mb-2">Next steps:</p>
              <ol className="list-decimal list-inside space-y-1 text-muted-foreground">
                <li>Check your email inbox (and spam folder)</li>
                <li>Click the verification link in the email</li>
                <li>Once verified, you can sign in to your account</li>
              </ol>
            </div>

            {/* Success message after resend */}
            {resendSuccess && (
              <Alert>
                <AlertDescription>
                  Verification email sent! Please check your inbox.
                </AlertDescription>
              </Alert>
            )}

            {/* Error message */}
            {resendError && (
              <Alert variant="destructive">
                <AlertDescription>{resendError}</AlertDescription>
              </Alert>
            )}

            {/* Resend button with cooldown */}
            <div className="text-center">
              <p className="text-sm text-muted-foreground mb-2">
                Didn't receive the email?
              </p>
              <Button
                type="button"
                variant="outline"
                onClick={handleResend}
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

            {/* Navigation buttons */}
            <div className="space-y-3">
              {onNavigateToSignIn && (
                <Button
                  type="button"
                  onClick={onNavigateToSignIn}
                  className="w-full"
                >
                  Go to Sign In
                </Button>
              )}

              {onTryDifferentEmail && (
                <div className="text-center">
                  <Button
                    type="button"
                    variant="link"
                    onClick={onTryDifferentEmail}
                  >
                    Use a different email address
                  </Button>
                </div>
              )}
            </div>

            {/* DEV ONLY: Show verification token for testing */}
            {verificationState._dev && (
              <div className="mt-4 p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                <p className="text-xs font-medium text-yellow-800 dark:text-yellow-200 mb-2">
                  DEV MODE: Verification Token
                </p>
                <div className="space-y-1 text-xs text-yellow-700 dark:text-yellow-300">
                  <p>
                    <span className="font-medium">User ID:</span>{' '}
                    {verificationState._dev.userId}
                  </p>
                  <p>
                    <span className="font-medium">Expires:</span>{' '}
                    {new Date(verificationState._dev.expiresAt).toLocaleString()}
                  </p>
                  <p className="break-all">
                    <span className="font-medium">Verify URL:</span>{' '}
                    <a
                      href={verificationState._dev.verifyUrl}
                      className="text-blue-600 dark:text-blue-400 underline"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      {verificationState._dev.verifyUrl}
                    </a>
                  </p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default VerificationPending;
