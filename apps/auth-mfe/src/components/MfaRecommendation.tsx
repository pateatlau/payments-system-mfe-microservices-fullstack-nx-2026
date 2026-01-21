/**
 * MfaRecommendation Component
 *
 * Shown to new social login users to encourage MFA adoption.
 * Provides options to:
 * - Enable MFA immediately (redirects to profile security settings)
 * - Skip for now (continues to app)
 * - Don't show again (sets localStorage flag)
 *
 * @component
 */

import { useState } from 'react';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  Button,
  Label,
} from '@mfe/shared-design-system';

// localStorage key for "don't show again" preference
const MFA_RECOMMEND_DISMISSED_KEY = 'mfa_recommend_dismissed';

/**
 * Check if user has dismissed the MFA recommendation
 */
export function isMfaRecommendDismissed(): boolean {
  try {
    return localStorage.getItem(MFA_RECOMMEND_DISMISSED_KEY) === 'true';
  } catch {
    return false;
  }
}

/**
 * Set the MFA recommendation dismissed flag
 */
export function setMfaRecommendDismissed(dismissed: boolean): void {
  try {
    if (dismissed) {
      localStorage.setItem(MFA_RECOMMEND_DISMISSED_KEY, 'true');
    } else {
      localStorage.removeItem(MFA_RECOMMEND_DISMISSED_KEY);
    }
  } catch {
    // Ignore localStorage errors
  }
}

// Shield icon SVG (inline to avoid external dependencies)
const ShieldIcon = () => (
  <svg
    className="h-12 w-12 text-primary mx-auto"
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
    strokeWidth={1.5}
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M9 12.75 11.25 15 15 9.75m-3-7.036A11.959 11.959 0 0 1 3.598 6 11.99 11.99 0 0 0 3 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285Z"
    />
  </svg>
);

// Check icon for benefits list
const CheckIcon = () => (
  <svg
    className="h-5 w-5 text-green-500 flex-shrink-0"
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
    strokeWidth={2}
  >
    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
  </svg>
);

export interface MfaRecommendationProps {
  /** URL to redirect to after enabling MFA or skipping */
  returnUrl?: string;
}

export function MfaRecommendation({ returnUrl = '/' }: MfaRecommendationProps) {
  const [dontShowAgain, setDontShowAgain] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleEnableMfa = () => {
    setIsLoading(true);
    // Save preference if checked
    if (dontShowAgain) {
      setMfaRecommendDismissed(true);
    }
    // Redirect to profile security tab to set up MFA
    // Using window.location to avoid Router context issues in Module Federation
    window.location.href = '/profile?tab=security';
  };

  const handleSkip = () => {
    // Save preference if checked
    if (dontShowAgain) {
      setMfaRecommendDismissed(true);
    }
    // Continue to the app
    window.location.href = returnUrl;
  };

  const benefits = [
    'Protects against unauthorized access',
    'Adds an extra layer of security',
    'Required for sensitive operations',
    'Takes less than 2 minutes to set up',
  ];

  return (
    <div className="min-h-[400px] flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center space-y-4">
          <ShieldIcon />
          <div>
            <CardTitle className="text-xl">Secure Your Account</CardTitle>
            <CardDescription className="mt-2">
              We recommend enabling two-factor authentication (2FA) to add an
              extra layer of security to your account.
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Benefits list */}
          <ul className="space-y-3">
            {benefits.map((benefit, index) => (
              <li key={index} className="flex items-center gap-3">
                <CheckIcon />
                <span className="text-sm text-muted-foreground">{benefit}</span>
              </li>
            ))}
          </ul>

          {/* Action buttons */}
          <div className="space-y-3">
            <Button
              onClick={handleEnableMfa}
              disabled={isLoading}
              className="w-full"
            >
              {isLoading ? 'Redirecting...' : 'Enable Two-Factor Authentication'}
            </Button>
            <Button
              variant="ghost"
              onClick={handleSkip}
              disabled={isLoading}
              className="w-full"
            >
              Skip for now
            </Button>
          </div>

          {/* Don't show again checkbox */}
          <div className="flex items-center gap-2 pt-2 border-t">
            <input
              type="checkbox"
              id="dontShowAgain"
              checked={dontShowAgain}
              onChange={(e) => setDontShowAgain(e.target.checked)}
              className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
            />
            <Label
              htmlFor="dontShowAgain"
              className="text-sm text-muted-foreground cursor-pointer"
            >
              Don't show this again
            </Label>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default MfaRecommendation;
