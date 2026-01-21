/**
 * Auth0 Client Configuration
 *
 * Uses openid-client library for secure OAuth/OIDC flows with Auth0.
 * This module handles:
 * - OIDC discovery from Auth0 tenant
 * - Authorization URL generation
 * - Token exchange (code for tokens)
 * - User profile retrieval
 *
 * @see https://github.com/panva/openid-client
 */

import * as client from 'openid-client';

// Auth0 Configuration from environment
export interface Auth0Config {
  domain: string;
  clientId: string;
  clientSecret: string;
  callbackUrl: string;
  audience?: string;
}

// Provider to Auth0 connection name mapping
export const PROVIDER_CONNECTION_MAP: Record<string, string> = {
  google: 'google-oauth2',
  github: 'github',
  facebook: 'facebook',
  linkedin: 'linkedin',
  twitter: 'twitter',
};

// Supported providers
export const SUPPORTED_PROVIDERS = Object.keys(PROVIDER_CONNECTION_MAP);

/**
 * Get Auth0 configuration from environment
 */
export function getAuth0Config(): Auth0Config {
  const domain = process.env['AUTH0_DOMAIN'];
  const clientId = process.env['AUTH0_CLIENT_ID'];
  const clientSecret = process.env['AUTH0_CLIENT_SECRET'];
  const callbackUrl =
    process.env['AUTH0_CALLBACK_URL'] ||
    'https://localhost/api/auth/oauth/callback';
  const audience = process.env['AUTH0_AUDIENCE'];

  if (!domain || !clientId || !clientSecret) {
    throw new Error(
      'Missing Auth0 configuration. Required: AUTH0_DOMAIN, AUTH0_CLIENT_ID, AUTH0_CLIENT_SECRET'
    );
  }

  return {
    domain,
    clientId,
    clientSecret,
    callbackUrl,
    audience,
  };
}

/**
 * Auth0 Client Singleton
 *
 * Handles OIDC discovery and client configuration.
 * Uses lazy initialization to avoid blocking startup.
 */
class Auth0Client {
  private config: Auth0Config | null = null;
  private oidcConfig: client.Configuration | null = null;
  private initPromise: Promise<void> | null = null;

  /**
   * Initialize the Auth0 client
   * Performs OIDC discovery to get issuer metadata
   */
  async initialize(): Promise<void> {
    if (this.oidcConfig) return;

    if (this.initPromise) {
      await this.initPromise;
      return;
    }

    this.initPromise = this._doInitialize();
    await this.initPromise;
  }

  private async _doInitialize(): Promise<void> {
    try {
      this.config = getAuth0Config();
      const issuerUrl = `https://${this.config.domain}`;

      console.log(`[Auth0] Discovering OIDC configuration from ${issuerUrl}`);

      // Perform OIDC discovery
      this.oidcConfig = await client.discovery(
        new URL(issuerUrl),
        this.config.clientId,
        this.config.clientSecret
      );

      console.log('[Auth0] OIDC discovery complete');
    } catch (error) {
      console.error('[Auth0] Failed to initialize:', error);
      this.initPromise = null;
      throw error;
    }
  }

  /**
   * Get the OIDC configuration (ensures initialized)
   */
  private async getOidcConfig(): Promise<client.Configuration> {
    await this.initialize();
    if (!this.oidcConfig) {
      throw new Error('Auth0 client not initialized');
    }
    return this.oidcConfig;
  }

  /**
   * Get the Auth0 configuration
   */
  getConfig(): Auth0Config {
    if (!this.config) {
      this.config = getAuth0Config();
    }
    return this.config;
  }

  /**
   * Generate authorization URL for a specific provider
   *
   * @param provider - Social provider (google, github, etc.)
   * @param state - CSRF state parameter (should be stored in Redis)
   * @param returnUrl - URL to redirect after login (encoded in state)
   * @returns Authorization URL to redirect the user to
   */
  async getAuthorizationUrl(
    provider: string,
    state: string,
    _returnUrl?: string
  ): Promise<string> {
    const oidcConfig = await this.getOidcConfig();
    const config = this.getConfig();

    // Map provider to Auth0 connection name
    const connection = PROVIDER_CONNECTION_MAP[provider];
    if (!connection) {
      throw new Error(`Unsupported provider: ${provider}`);
    }

    // Build authorization URL using openid-client
    const authUrl = client.buildAuthorizationUrl(oidcConfig, {
      redirect_uri: config.callbackUrl,
      scope: 'openid profile email',
      state,
      connection, // Auth0-specific: specify which social connection to use
    });

    return authUrl.href;
  }

  /**
   * Exchange authorization code for tokens and get user profile
   *
   * @param code - Authorization code from callback
   * @param state - State parameter for validation
   * @returns User profile and tokens from Auth0
   */
  async handleCallback(
    code: string,
    state: string
  ): Promise<{
    profile: Auth0UserProfile;
    accessToken?: string;
    refreshToken?: string;
    expiresAt?: Date;
  }> {
    const oidcConfig = await this.getOidcConfig();
    const config = this.getConfig();

    // Create the callback URL with code and state for token exchange
    // openid-client v6 expects the full callback URL with query params
    const callbackUrl = new URL(config.callbackUrl);
    callbackUrl.searchParams.set('code', code);
    callbackUrl.searchParams.set('state', state);

    console.log(`[Auth0] Exchanging code for tokens, callback URL: ${callbackUrl.toString()}`);

    try {
      // Exchange code for tokens
      const tokens = await client.authorizationCodeGrant(oidcConfig, callbackUrl, {
        expectedState: state,
      });

      console.log('[Auth0] Token exchange successful');

      // Get the ID token claims (user profile)
      const claims = tokens.claims();

      if (!claims) {
        throw new Error('No claims in token response');
      }

      // Map Auth0 claims to our profile format
      const profile: Auth0UserProfile = {
        sub: claims.sub,
        email: claims.email as string | undefined,
        emailVerified: claims.email_verified as boolean | undefined,
        name: claims.name as string | undefined,
        picture: claims.picture as string | undefined,
        nickname: claims.nickname as string | undefined,
        // Auth0 specific: extract provider info from sub
        // Format: "google-oauth2|123456789" or "github|12345"
        provider: this.extractProvider(claims.sub),
        providerAccountId: this.extractProviderAccountId(claims.sub),
      };

      return {
        profile,
        accessToken: tokens.access_token,
        refreshToken: tokens.refresh_token,
        expiresAt: tokens.expires_at
          ? new Date(Number(tokens.expires_at) * 1000)
          : undefined,
      };
    } catch (error) {
      console.error('[Auth0] Token exchange failed:', error);
      throw error;
    }
  }

  /**
   * Extract provider name from Auth0 sub claim
   * e.g., "google-oauth2|123456789" -> "google"
   */
  private extractProvider(sub: string): string {
    const parts = sub.split('|');
    const connectionId = parts[0] || sub;

    // Map Auth0 connection IDs back to our provider names
    const reverseMap: Record<string, string> = {
      'google-oauth2': 'google',
      github: 'github',
      facebook: 'facebook',
      linkedin: 'linkedin',
      twitter: 'twitter',
    };

    return reverseMap[connectionId] || connectionId;
  }

  /**
   * Extract provider account ID from Auth0 sub claim
   * e.g., "google-oauth2|123456789" -> "123456789"
   */
  private extractProviderAccountId(sub: string): string {
    const parts = sub.split('|');
    return parts[1] || sub;
  }

  /**
   * Check if client is initialized
   */
  isInitialized(): boolean {
    return this.oidcConfig !== null;
  }

  /**
   * Reset client (for testing)
   */
  reset(): void {
    this.config = null;
    this.oidcConfig = null;
    this.initPromise = null;
  }
}

/**
 * Auth0 User Profile from ID token
 */
export interface Auth0UserProfile {
  sub: string; // Auth0 user ID (e.g., "google-oauth2|123456789")
  email?: string;
  emailVerified?: boolean;
  name?: string;
  picture?: string;
  nickname?: string;
  provider: string; // Extracted provider (google, github, etc.)
  providerAccountId: string; // Provider's user ID
}

// Export singleton instance
export const auth0Client = new Auth0Client();

// Export class for testing
export { Auth0Client };
