import { ComponentType } from 'react';
import { RemoteErrorBoundary } from '../components/RemoteErrorBoundary';

/**
 * Props interface for the OAuthCallback component from auth-mfe
 */
export interface OAuthCallbackComponentProps {
  // OAuthCallback handles everything internally via URL hash/params
}

/**
 * Props for OAuthCallbackPage - allows dependency injection for testing
 */
export interface OAuthCallbackPageProps {
  /**
   * OAuthCallback component to render.
   * In production, pass the lazy-loaded component from remotes.
   * In tests, pass a mock component.
   */
  OAuthCallbackComponent: ComponentType<OAuthCallbackComponentProps>;
}

/**
 * OAuthCallbackPage component
 *
 * Wrapper for OAuthCallback component.
 * Handles the redirect from OAuth providers after authentication.
 * Uses dependency injection pattern - component must be provided via props.
 *
 * URL format:
 * - Success: /oauth-callback#access_token=...&refresh_token=...&expires_in=...&return_url=...
 * - Error: /oauth-callback?error=...&message=...
 *
 * @example
 * // Production usage (in routes)
 * import { OAuthCallbackRemote } from './remotes';
 * <OAuthCallbackPage OAuthCallbackComponent={OAuthCallbackRemote} />
 *
 * @example
 * // Test usage (with mock component)
 * <OAuthCallbackPage OAuthCallbackComponent={MockOAuthCallback} />
 */
export function OAuthCallbackPage({ OAuthCallbackComponent }: OAuthCallbackPageProps) {
  return (
    <RemoteErrorBoundary componentName="OAuthCallback">
      <div className="min-h-full flex flex-col items-center justify-center py-8">
        <OAuthCallbackComponent />
      </div>
    </RemoteErrorBoundary>
  );
}
