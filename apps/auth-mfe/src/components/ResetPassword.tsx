import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useState, useEffect } from 'react';
import {
  Button,
  Label,
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  Alert,
  AlertDescription,
  PasswordInput,
} from '@mfe/shared-design-system';
import { getApiClient } from '@mfe/shared-api-client';
import hdfcLogo from '../assets/hdfc-logo-03.png';

/**
 * Password validation schema (matches backend requirements)
 * Banking-grade: 12+ chars, uppercase, lowercase, number, symbol
 */
const passwordSchema = z
  .string()
  .min(12, 'Password must be at least 12 characters')
  .max(255, 'Password must be at most 255 characters')
  .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
  .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
  .regex(/[0-9]/, 'Password must contain at least one number')
  .regex(
    /[^A-Za-z0-9]/,
    'Password must contain at least one special character'
  );

/**
 * Reset password form schema
 */
const resetPasswordSchema = z
  .object({
    newPassword: passwordSchema,
    confirmPassword: z.string().min(1, 'Please confirm your password'),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

type ResetPasswordFormData = z.infer<typeof resetPasswordSchema>;

/**
 * ResetPassword component props
 */
export interface ResetPasswordProps {
  /**
   * User ID from reset link (query param)
   */
  userId?: string;
  /**
   * Reset token from reset link (query param)
   */
  token?: string;
  /**
   * Optional callback when user wants to navigate to sign-in
   */
  onNavigateToSignIn?: () => void;
}

/**
 * ResetPassword component
 *
 * Allows users to set a new password using a valid reset token.
 * Validates password requirements and confirms passwords match.
 */
export function ResetPassword({
  userId: propUserId,
  token: propToken,
  onNavigateToSignIn,
}: ResetPasswordProps = {}) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);
  const [userId, setUserId] = useState(propUserId || '');
  const [token, setToken] = useState(propToken || '');

  // Extract userId and token from URL if not provided as props
  useEffect(() => {
    if (!propUserId || !propToken) {
      const params = new URLSearchParams(window.location.search);
      const urlUserId = params.get('userId');
      const urlToken = params.get('token');

      if (urlUserId) setUserId(urlUserId);
      if (urlToken) setToken(urlToken);
    }
  }, [propUserId, propToken]);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ResetPasswordFormData>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      newPassword: '',
      confirmPassword: '',
    },
  });

  const onSubmit = async (data: ResetPasswordFormData) => {
    // Validate we have userId and token
    if (!userId || !token) {
      setError(
        'Invalid reset link. Please request a new password reset link.'
      );
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      const apiClient = getApiClient();
      await apiClient.post('/auth/reset-password', {
        userId,
        token,
        newPassword: data.newPassword,
      });

      setIsSuccess(true);
    } catch (err) {
      const error = err as {
        response?: { data?: { error?: { code?: string; message?: string } } };
        message?: string;
      };

      if (error.response?.data?.error?.code === 'INVALID_RESET_TOKEN') {
        setError(
          'Password reset link is invalid or has expired. Please request a new one.'
        );
      } else if (error.response?.data?.error?.code === 'RESET_TOKEN_EXPIRED') {
        setError(
          'Password reset link has expired. Please request a new one.'
        );
      } else if (error.response?.data?.error?.message) {
        setError(error.response.data.error.message);
      } else if (!error.response) {
        setError('Network error. Please check your connection and try again.');
      } else {
        setError('Failed to reset password. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const isFormLoading = isLoading || isSubmitting;

  // Check if link is valid (has userId and token)
  const isLinkValid = userId && token;

  // Show success message after password reset
  if (isSuccess) {
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
              <CardTitle>Password Reset Successful</CardTitle>
              <CardDescription>
                Your password has been updated
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="text-center">
                <div className="mx-auto w-16 h-16 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center mb-4">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={1.5}
                    stroke="currentColor"
                    className="w-8 h-8 text-green-600 dark:text-green-400"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"
                    />
                  </svg>
                </div>
                <p className="text-muted-foreground mb-4">
                  Your password has been reset successfully. You can now sign in
                  with your new password.
                </p>
                <p className="text-sm text-muted-foreground">
                  For security, all your other sessions have been logged out.
                </p>
              </div>

              {/* Sign In button */}
              {onNavigateToSignIn && (
                <Button
                  type="button"
                  onClick={onNavigateToSignIn}
                  className="w-full"
                >
                  Sign In
                </Button>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Show error if link is invalid
  if (!isLinkValid) {
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
              <CardTitle>Invalid Reset Link</CardTitle>
              <CardDescription>
                This password reset link is not valid
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <Alert variant="destructive">
                <AlertDescription>
                  The password reset link is missing required information.
                  Please request a new password reset link.
                </AlertDescription>
              </Alert>

              {/* Back to Forgot Password */}
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
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Render reset password form
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
            <CardTitle>Reset Password</CardTitle>
            <CardDescription>
              Enter your new password below
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSubmit(onSubmit)(e);
              }}
              className="space-y-6"
              noValidate
            >
              {/* New Password field */}
              <div className="space-y-2">
                <Label htmlFor="newPassword">
                  New Password <span className="text-red-500">*</span>
                </Label>
                <PasswordInput
                  id="newPassword"
                  {...register('newPassword')}
                  placeholder="Enter new password"
                  disabled={isFormLoading}
                  autoComplete="new-password"
                  autoFocus
                />
                {errors.newPassword && (
                  <p className="text-sm text-destructive" role="alert">
                    {errors.newPassword.message}
                  </p>
                )}
              </div>

              {/* Confirm Password field */}
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">
                  Confirm Password <span className="text-red-500">*</span>
                </Label>
                <PasswordInput
                  id="confirmPassword"
                  {...register('confirmPassword')}
                  placeholder="Confirm new password"
                  disabled={isFormLoading}
                  autoComplete="new-password"
                />
                {errors.confirmPassword && (
                  <p className="text-sm text-destructive" role="alert">
                    {errors.confirmPassword.message}
                  </p>
                )}
              </div>

              {/* Password requirements hint */}
              <div className="text-xs text-muted-foreground space-y-1">
                <p>Password must contain:</p>
                <ul className="list-disc list-inside pl-2 space-y-0.5">
                  <li>At least 12 characters</li>
                  <li>At least one uppercase letter</li>
                  <li>At least one lowercase letter</li>
                  <li>At least one number</li>
                  <li>At least one special character</li>
                </ul>
              </div>

              {/* Error display */}
              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              {/* Submit button */}
              <Button type="submit" disabled={isFormLoading} className="w-full">
                {isFormLoading ? 'Resetting Password...' : 'Reset Password'}
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

export default ResetPassword;
