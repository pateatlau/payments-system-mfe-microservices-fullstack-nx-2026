import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuthStore, type SignUpData } from 'shared-auth-store';
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

/**
 * Password strength validation helper
 * Banking-grade requirements: minimum 12 characters, uppercase, lowercase, numbers, symbols
 */
const passwordStrengthRegex =
  /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&#^()_+\-=[\]{};':"\\|,.<>/])[A-Za-z\d@$!%*?&#^()_+\-=[\]{};':"\\|,.<>/]{12,}$/;

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

  // Clear auth store error when component mounts (to clear stale errors from previous sessions)
  // Note: We use an empty dependency array so this only runs on mount, not when error changes.
  // This allows error messages to be displayed to users before being cleared.
  useEffect(() => {
    clearError();
    // eslint-disable-next-line react-hooks/exhaustive-deps
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

  return (
    <div className="flex items-center justify-center w-full">
      <div className="w-full max-w-md">
        <Card>
          <CardHeader>
            <CardTitle>Sign Up</CardTitle>
            <CardDescription>
              Create your account to get started
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
              {/* Name field */}
              <div className="space-y-2">
                <Label htmlFor="name">Full Name</Label>
                <Input
                  id="name"
                  type="text"
                  {...register('name')}
                  placeholder="John Doe"
                  disabled={isFormLoading}
                  autoComplete="name"
                />
                {errors.name && (
                  <p className="text-sm text-destructive" role="alert">
                    {errors.name.message}
                  </p>
                )}
              </div>

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
                  autoComplete="new-password"
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
                <Label htmlFor="confirmPassword">Confirm Password</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  {...register('confirmPassword')}
                  placeholder="Confirm your password"
                  disabled={isFormLoading}
                  autoComplete="new-password"
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
