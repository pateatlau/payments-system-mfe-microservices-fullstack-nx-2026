import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuthStore, type SignUpData } from 'shared-auth-store';
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
  SocialLoginButtons,
} from '@mfe/shared-design-system';
import hdfcLogo from '../assets/hdfc-logo-03.png';
import { VerificationPending } from './VerificationPending';

/**
 * Password strength validation helper
 * Banking-grade requirements: minimum 12 characters, uppercase, lowercase, numbers, symbols
 */
const passwordStrengthRegex =
  /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&#^()_+\-=[\]{};':"\\|,.<>/])[A-Za-z\d@$!%*?&#^()_+\-=[\]{};':"\\|,.<>/]{12,}$/;

/**
 * Phone number validation regex
 * Accepts formats: +1234567890, 123-456-7890, (123) 456-7890, etc.
 */
const phoneRegex = /^[+]?[(]?[0-9]{1,4}[)]?[-\s./0-9]*$/;

/**
 * Sign-up form schema using Zod
 * Banking-grade password requirements: minimum 12 characters with complexity
 * Optional phone and address fields for profile creation
 */
const signUpSchema = z
  .object({
    name: z
      .string()
      .min(1, 'Name is required')
      .min(2, 'Name must be at least 2 characters'),
    email: z.string().email('Invalid email address'),
    phone: z
      .string()
      .optional()
      .refine(
        val => !val || (val.length >= 10 && val.length <= 20),
        'Phone number must be 10-20 characters'
      )
      .refine(
        val => !val || phoneRegex.test(val),
        'Invalid phone number format'
      ),
    address: z
      .string()
      .optional()
      .refine(
        val => !val || val.length <= 500,
        'Address must be at most 500 characters'
      ),
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
  const {
    signup,
    isLoading,
    error,
    clearError,
    isAuthenticated,
    emailVerificationPending,
    clearEmailVerificationPending,
  } = useAuthStore();
  const onSuccessCalledRef = useRef(false);

  // Social login state
  const [socialLoginLoading, setSocialLoginLoading] = useState<string | null>(null);

  // OAuth error from URL (when backend redirects with error)
  const [oauthError, setOauthError] = useState<string | null>(null);

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
      phone: '',
      address: '',
      password: '',
      confirmPassword: '',
    },
  });

  // Watch password for real-time strength feedback
  const password = watch('password');

  // Clear auth store error and verification state when component mounts
  // (to clear stale state from previous sessions)
  // Note: We use an empty dependency array so this only runs on mount, not when error changes.
  // This allows error messages to be displayed to users before being cleared.
  useEffect(() => {
    clearError();
    // Note: We don't clear emailVerificationPending on mount because we want to
    // preserve it if user refreshes the page after registration
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Check for OAuth error from URL params (when backend redirects to /signup?error=...)
  // Using window.location directly to avoid Router context issues in Module Federation
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const errorParam = urlParams.get('error');
    const messageParam = urlParams.get('message');

    if (errorParam) {
      // Set the OAuth error to display
      const errorMessage = messageParam || 'OAuth authentication failed. Please try again.';
      setOauthError(errorMessage);

      // Clear the error params from URL (so refreshing doesn't show error again)
      urlParams.delete('error');
      urlParams.delete('message');
      const newUrl = urlParams.toString()
        ? `${window.location.pathname}?${urlParams.toString()}`
        : window.location.pathname;
      window.history.replaceState({}, '', newUrl);
    }
  }, []);

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
      // Clear OAuth error when starting email sign-up
      setOauthError(null);

      const signUpData: SignUpData = {
        email: data.email,
        password: data.password,
        name: data.name,
      };
      await signup(signUpData);

      // Note: Profile update (phone/address) is deferred until after email verification
      // since the user is not authenticated at this point. They can update their profile
      // after verifying their email and logging in.

      // If signup was successful and email verification is required,
      // the emailVerificationPending state will be set and we'll show the
      // VerificationPending component. No navigation needed.
    } catch (err) {
      // Error is handled by auth store
      // eslint-disable-next-line no-console
      console.error('Sign-up error:', err);
    }
  };

  // Handle social login - redirect to backend OAuth endpoint
  // Same flow as sign-in: OAuth creates account if user doesn't exist
  const handleSocialLogin = useCallback((provider: string) => {
    setSocialLoginLoading(provider);
    setOauthError(null); // Clear any previous OAuth error

    // Get API base URL from environment or default to nginx proxy
    const apiBaseUrl = process.env.NX_API_BASE_URL || 'https://localhost/api';

    // Encode return URL - where to redirect after successful auth
    // For sign-up, we use '/' which will redirect based on user role
    const returnUrl = encodeURIComponent('/');

    // Redirect to backend OAuth endpoint
    // The backend handles CSRF protection via state parameter stored in Redis
    window.location.href = `${apiBaseUrl}/auth/oauth/${provider}?returnUrl=${returnUrl}`;
  }, []);

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
    const hasSymbol = /[@$!%*?&#^()_+\-=[\]{};':"\\|,.<>/]/.test(pwd);

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

  // Show verification pending screen after successful registration
  if (emailVerificationPending) {
    return (
      <VerificationPending
        verificationState={emailVerificationPending}
        onNavigateToSignIn={onNavigateToSignIn}
        onTryDifferentEmail={() => {
          clearEmailVerificationPending();
        }}
      />
    );
  }

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
            <CardTitle>Sign Up</CardTitle>
            <CardDescription>
              Create your account to get started
            </CardDescription>
          </CardHeader>
          <CardContent>
            {/* OAuth error display (from URL redirect) */}
            {oauthError && (
              <Alert variant="destructive" className="mb-6">
                <AlertDescription>{oauthError}</AlertDescription>
              </Alert>
            )}

            {/* Social login buttons */}
            <SocialLoginButtons
              onProviderClick={handleSocialLogin}
              disabled={isFormLoading}
              loading={socialLoginLoading}
              enabledProviders={['google', 'github']}
            />

            {/* Social login divider */}
            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-card px-2 text-muted-foreground">
                  Or continue with email
                </span>
              </div>
            </div>

            <form
              onSubmit={e => {
                e.preventDefault();
                handleSubmit(onSubmit)(e);
              }}
              className="space-y-6"
              noValidate
            >
              {/* Name field */}
              <div className="space-y-2">
                <Label htmlFor="name">
                  Full Name <span className="text-destructive" aria-hidden="true">*</span>
                  <span className="sr-only"> (required)</span>
                </Label>
                <Input
                  id="name"
                  type="text"
                  {...register('name')}
                  placeholder="John Doe"
                  disabled={isFormLoading}
                  autoComplete="name"
                  aria-required="true"
                />
                {errors.name && (
                  <p className="text-sm text-destructive" role="alert">
                    {errors.name.message}
                  </p>
                )}
              </div>

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
                  aria-required="true"
                />
                {errors.email && (
                  <p className="text-sm text-destructive" role="alert">
                    {errors.email.message}
                  </p>
                )}
              </div>

              {/* Phone field (optional) */}
              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number (Optional)</Label>
                <Input
                  id="phone"
                  type="tel"
                  {...register('phone')}
                  placeholder="+91 98765 43210"
                  disabled={isFormLoading}
                  autoComplete="tel"
                />
                {errors.phone && (
                  <p className="text-sm text-destructive" role="alert">
                    {errors.phone.message}
                  </p>
                )}
              </div>

              {/* Address field (optional) */}
              <div className="space-y-2">
                <Label htmlFor="address">Address (Optional)</Label>
                <Input
                  id="address"
                  type="text"
                  {...register('address')}
                  placeholder="123, MG Road, Bengaluru, Karnataka 560001"
                  disabled={isFormLoading}
                  autoComplete="street-address"
                />
                {errors.address && (
                  <p className="text-sm text-destructive" role="alert">
                    {errors.address.message}
                  </p>
                )}
              </div>

              {/* Password field */}
              <div className="space-y-2">
                <Label htmlFor="password">
                  Password <span className="text-destructive" aria-hidden="true">*</span>
                  <span className="sr-only"> (required)</span>
                </Label>
                <PasswordInput
                  id="password"
                  {...register('password')}
                  placeholder="Enter your password"
                  disabled={isFormLoading}
                  autoComplete="new-password"
                  aria-required="true"
                />
                {password && password.length > 0 && (
                  <p className={`text-sm ${passwordStrength.color}`}>
                    Password strength: {passwordStrength.strength}
                  </p>
                )}
                {errors.password && (
                  <p className="text-sm text-destructive" role="alert">
                    {errors.password.message}
                  </p>
                )}
                <p className="text-xs text-muted-foreground">
                  Must be at least 12 characters with uppercase, lowercase,
                  numbers, and symbols
                </p>
              </div>

              {/* Confirm Password field */}
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">
                  Confirm Password <span className="text-destructive" aria-hidden="true">*</span>
                  <span className="sr-only"> (required)</span>
                </Label>
                <PasswordInput
                  id="confirmPassword"
                  {...register('confirmPassword')}
                  placeholder="Confirm your password"
                  disabled={isFormLoading}
                  autoComplete="new-password"
                  aria-required="true"
                />
                {errors.confirmPassword && (
                  <p className="text-sm text-destructive" role="alert">
                    {errors.confirmPassword.message}
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
                {isFormLoading ? 'Creating account...' : 'Sign Up'}
              </Button>
            </form>

            {/* Sign-in link */}
            {onNavigateToSignIn && (
              <div className="mt-6 text-center">
                <p className="text-sm text-muted-foreground">
                  Already have an account?{' '}
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

export default SignUp;
