/**
 * SocialLoginButtons Component
 *
 * A component that renders social login buttons for OAuth providers.
 * Uses inline SVG icons with brand-accurate colors.
 * Based on shadcn/ui patterns with Tailwind CSS v4.
 */

import * as React from 'react';
import { cn } from '../utils/cn';
import { Button } from './Button';

/**
 * Provider configuration type
 */
export interface SocialProvider {
  id: string;
  name: string;
  icon: React.ComponentType<{ className?: string }>;
  className: string;
}

/**
 * Props for the SocialLoginButtons component
 */
export interface SocialLoginButtonsProps {
  /** Callback when a provider button is clicked */
  onProviderClick: (provider: string) => void;
  /** Disable all buttons */
  disabled?: boolean;
  /** Provider ID currently loading (shows spinner) */
  loading?: string | null;
  /** Subset of provider IDs to show (default: all enabled providers) */
  enabledProviders?: string[];
  /** Additional CSS classes */
  className?: string;
}

// SVG icons as inline components (brand-accurate colors)
const GoogleIcon = ({ className }: { className?: string }) => (
  <svg className={cn('h-4 w-4', className)} viewBox="0 0 24 24">
    <path
      fill="#4285F4"
      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
    />
    <path
      fill="#34A853"
      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
    />
    <path
      fill="#FBBC05"
      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
    />
    <path
      fill="#EA4335"
      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
    />
  </svg>
);

const GitHubIcon = ({ className }: { className?: string }) => (
  <svg className={cn('h-4 w-4', className)} fill="currentColor" viewBox="0 0 24 24">
    <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
  </svg>
);

const FacebookIcon = ({ className }: { className?: string }) => (
  <svg className={cn('h-4 w-4', className)} fill="currentColor" viewBox="0 0 24 24">
    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
  </svg>
);

const LinkedInIcon = ({ className }: { className?: string }) => (
  <svg className={cn('h-4 w-4', className)} fill="currentColor" viewBox="0 0 24 24">
    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
  </svg>
);

const XIcon = ({ className }: { className?: string }) => (
  <svg className={cn('h-4 w-4', className)} fill="currentColor" viewBox="0 0 24 24">
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
  </svg>
);

// Loading spinner component
const LoadingSpinner = ({ className }: { className?: string }) => (
  <svg
    className={cn('h-4 w-4 animate-spin', className)}
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
);

/**
 * Default provider configurations with brand-accurate styling
 */
export const socialProviders: SocialProvider[] = [
  {
    id: 'google',
    name: 'Google',
    icon: GoogleIcon,
    className: 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50 dark:bg-white dark:text-gray-700 dark:border-gray-300 dark:hover:bg-gray-100',
  },
  {
    id: 'github',
    name: 'GitHub',
    icon: GitHubIcon,
    className: 'bg-gray-900 text-white border-gray-900 hover:bg-gray-800 dark:bg-gray-800 dark:border-gray-700 dark:hover:bg-gray-700',
  },
  {
    id: 'facebook',
    name: 'Facebook',
    icon: FacebookIcon,
    className: 'bg-[#1877F2] text-white border-[#1877F2] hover:bg-[#166FE5]',
  },
  {
    id: 'linkedin',
    name: 'LinkedIn',
    icon: LinkedInIcon,
    className: 'bg-[#0A66C2] text-white border-[#0A66C2] hover:bg-[#004182]',
  },
  {
    id: 'twitter',
    name: 'X',
    icon: XIcon,
    className: 'bg-black text-white border-black hover:bg-gray-900 dark:bg-white dark:text-black dark:border-white dark:hover:bg-gray-200',
  },
];

/**
 * SocialLoginButtons component
 *
 * Renders a list of social login buttons for OAuth providers.
 *
 * @example
 * ```tsx
 * <SocialLoginButtons
 *   onProviderClick={(provider) => handleSocialLogin(provider)}
 *   enabledProviders={['google', 'github']}
 *   loading={loadingProvider}
 * />
 * ```
 */
function SocialLoginButtons({
  onProviderClick,
  disabled,
  loading,
  enabledProviders = ['google', 'github'],
  className,
}: SocialLoginButtonsProps) {
  const visibleProviders = socialProviders.filter((p) =>
    enabledProviders.includes(p.id)
  );

  return (
    <div className={cn('space-y-3', className)}>
      {visibleProviders.map((provider) => {
        const isLoading = loading === provider.id;
        const isDisabled = disabled || !!loading;
        const Icon = provider.icon;

        return (
          <Button
            key={provider.id}
            type="button"
            variant="outline"
            className={cn('w-full border', provider.className)}
            onClick={() => onProviderClick(provider.id)}
            disabled={isDisabled}
            aria-label={`Continue with ${provider.name}`}
          >
            {isLoading ? (
              <LoadingSpinner className="mr-2" />
            ) : (
              <Icon className="mr-2" />
            )}
            Continue with {provider.name}
          </Button>
        );
      })}
    </div>
  );
}

export { SocialLoginButtons, GoogleIcon, GitHubIcon, FacebookIcon, LinkedInIcon, XIcon, LoadingSpinner };
