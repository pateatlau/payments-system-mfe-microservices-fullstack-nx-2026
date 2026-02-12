/**
 * OAuthCallback Component
 *
 * Handles the redirect from the backend OAuth flow.
 * Extracts tokens from URL hash, fetches user info, and updates auth store.
 *
 * The backend redirects to one of these URLs:
 * - /oauth/success#accessToken=...&refreshToken=...&expiresIn=...&isNewUser=true (success)
 * - /signin?error=oauth_failed&message=... (error - handled by SignIn component)
 * - /signin?mfaToken=... (MFA required - handled by SignIn component)
 *
 * For new users (isNewUser=true), redirects to MFA recommendation page
 * unless user has previously dismissed the recommendation.
 */

import { useEffect, useState } from 'react';
import { useAuthStore } from 'shared-auth-store';
import { getApiClient } from '@mfe/shared-api-client';
import { Card, CardContent, CardHeader, CardTitle } from '@mfe/shared-design-system';
import type { User } from 'shared-types';
import { isMfaRecommendDismissed } from './MfaRecommendation';

export function OAuthCallback() {
  // Use window.location for navigation to avoid Router context issues in Module Federation
  const setAccessToken = useAuthStore((state) => state.setAccessToken);
  const [error, setError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(true);

  useEffect(() => {
    const processCallback = async () => {
      // SECURITY: Log only non-sensitive info (hash contains tokens)
      console.log('[OAuthCallback] Processing callback...');
      console.log('[OAuthCallback] Pathname:', window.location.pathname);
      console.log('[OAuthCallback] Has hash:', window.location.hash.length > 0);
      console.log('[OAuthCallback] Has search params:', window.location.search.length > 0);

      // Check for error in query params (use window.location to avoid Router context issues)
      const urlParams = new URLSearchParams(window.location.search);
      const errorParam = urlParams.get('error');
      if (errorParam) {
        const message = urlParams.get('message') || 'OAuth authentication failed';
        console.log('[OAuthCallback] Error param found:', errorParam, message);
        setError(message);
        setIsProcessing(false);
        return;
      }

      // Extract tokens from URL fragment (hash)
      // Backend uses camelCase: accessToken, refreshToken, expiresIn
      const hash = window.location.hash.substring(1);
      const params = new URLSearchParams(hash);

      const accessToken = params.get('accessToken');
      const refreshToken = params.get('refreshToken');
      const isNewUser = params.get('isNewUser') === 'true';
      // Default return URL is '/' which will redirect based on user role
      const returnUrl = '/';

      console.log('[OAuthCallback] Extracted tokens:', {
        hasAccessToken: !!accessToken,
        hasRefreshToken: !!refreshToken,
        isNewUser,
        hashLength: hash.length
      });

      if (!accessToken || !refreshToken) {
        console.log('[OAuthCallback] Missing tokens, showing error');
        setError('Invalid OAuth callback: missing tokens');
        setIsProcessing(false);
        return;
      }

      try {
        console.log('[OAuthCallback] Setting tokens in auth store...');
        // Update auth store with access token (refresh token is in HttpOnly cookie)
        // POC-3 Phase 7.2: setAccessToken now only takes accessToken
        setAccessToken(accessToken);

        // Fetch user data using the new tokens
        // The apiClient.get<T> returns ApiResponse<T>, so get<User> returns { success, data: User }
        const apiClient = getApiClient();
        const response = await apiClient.get<User>('/auth/me', {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        });

        if (!response.success || !response.data) {
          throw new Error(response.message || 'Failed to fetch user data');
        }

        const userData = response.data;

        // Update the store with full user data
        // The store's setAccessToken only sets tokens, we need to set user separately
        // We'll rely on the store's persistence - on next page load it will rehydrate
        // For now, we manually update the store state
        useAuthStore.setState({
          user: userData,
          isAuthenticated: true,
          isLoading: false,
          error: null,
        });

        // Clear the hash from URL (security - don't leave tokens in browser history)
        window.history.replaceState(null, '', window.location.pathname);

        // For new users, show MFA recommendation page (unless previously dismissed)
        // The user can skip or enable MFA from the recommendation page
        const shouldShowMfaRecommend = isNewUser && !isMfaRecommendDismissed();

        if (shouldShowMfaRecommend) {
          console.log('[OAuthCallback] New user, redirecting to MFA recommendation');
          window.location.href = '/mfa-recommend';
        } else {
          // Navigate to return URL using window.location to avoid Router context issues
          window.location.href = returnUrl;
        }
      } catch (err) {
        console.error('OAuth callback error:', err);
        const errorMessage = err instanceof Error ? err.message : 'Failed to complete authentication';
        setError(errorMessage);
        setIsProcessing(false);
      }
    };

    processCallback();
  }, [setAccessToken]);

  if (error) {
    return (
      <div className="min-h-[400px] flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-destructive">Authentication Failed</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-muted-foreground">{error}</p>
            <button
              onClick={() => { window.location.href = '/signin'; }}
              className="text-primary hover:underline"
            >
              Return to Sign In
            </button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isProcessing) {
    return (
      <div className="min-h-[400px] flex flex-col items-center justify-center space-y-4">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        <p className="text-muted-foreground">Completing sign in...</p>
      </div>
    );
  }

  return null;
}

export default OAuthCallback;
