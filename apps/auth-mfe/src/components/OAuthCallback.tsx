/**
 * OAuthCallback Component
 *
 * Handles the redirect from the backend OAuth flow.
 * Extracts tokens from URL hash, fetches user info, and updates auth store.
 *
 * The backend redirects to one of these URLs:
 * - /oauth-callback#access_token=...&refresh_token=...&expires_in=... (success)
 * - /oauth-callback?error=...&message=... (error)
 * - /mfa?mfaToken=...&returnUrl=... (MFA required - handled by backend redirect)
 */

import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuthStore } from 'shared-auth-store';
import { getApiClient } from '@mfe/shared-api-client';
import { Card, CardContent, CardHeader, CardTitle } from '@mfe/shared-design-system';
import type { User } from 'shared-types';

export function OAuthCallback() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const setAccessToken = useAuthStore((state) => state.setAccessToken);
  const [error, setError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(true);

  useEffect(() => {
    const processCallback = async () => {
      // Check for error in query params
      const errorParam = searchParams.get('error');
      if (errorParam) {
        const message = searchParams.get('message') || 'OAuth authentication failed';
        setError(message);
        setIsProcessing(false);
        return;
      }

      // Extract tokens from URL fragment (hash)
      const hash = window.location.hash.substring(1);
      const params = new URLSearchParams(hash);

      const accessToken = params.get('access_token');
      const refreshToken = params.get('refresh_token');
      const returnUrl = params.get('return_url') || '/';

      if (!accessToken || !refreshToken) {
        setError('Invalid OAuth callback: missing tokens');
        setIsProcessing(false);
        return;
      }

      try {
        // Update auth store with tokens first
        setAccessToken(accessToken, refreshToken);

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

        // Navigate to return URL
        navigate(returnUrl, { replace: true });
      } catch (err) {
        console.error('OAuth callback error:', err);
        const errorMessage = err instanceof Error ? err.message : 'Failed to complete authentication';
        setError(errorMessage);
        setIsProcessing(false);
      }
    };

    processCallback();
  }, [searchParams, setAccessToken, navigate]);

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
              onClick={() => navigate('/signin')}
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
