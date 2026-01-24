import { test, expect, Page } from '@playwright/test';

/**
 * Social Login E2E Tests
 *
 * These tests verify the social login (OAuth) functionality.
 * Note: We cannot perform actual OAuth redirects to external providers (Google, GitHub)
 * in E2E tests. Instead, we test:
 * - Social login buttons presence and interaction
 * - OAuth callback handler with simulated tokens
 * - MFA recommendation flow for new users
 * - Error handling scenarios
 * - Account linking UI in profile page
 */

test.describe('Social Login Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Clear localStorage before each test
    await page.goto('/');
    await page.evaluate(() => {
      localStorage.clear();
      sessionStorage.clear();
    });
    await page.context().clearCookies();
  });

  test.describe('Sign-In Page Social Login Buttons', () => {
    test('should display social login buttons on sign-in page', async ({
      page,
    }) => {
      await page.goto('/signin');

      // Wait for page to load
      await expect(page.locator('input[type="email"]')).toBeVisible({
        timeout: 10000,
      });

      // Verify Google button is visible
      const googleButton = page.locator('button:has-text("Continue with Google")');
      await expect(googleButton).toBeVisible({ timeout: 5000 });

      // Verify GitHub button is visible
      const githubButton = page.locator('button:has-text("Continue with GitHub")');
      await expect(githubButton).toBeVisible({ timeout: 5000 });

      // Verify the divider text is present
      await expect(
        page.locator('text=/or continue with email/i')
      ).toBeVisible({ timeout: 5000 });
    });

    test('should redirect to backend OAuth endpoint when clicking Google button', async ({
      page,
    }) => {
      // Track navigation requests
      let oauthRedirectUrl: string | null = null;

      // Listen for navigation that goes to OAuth endpoint
      page.on('request', (request) => {
        const url = request.url();
        if (url.includes('/api/auth/oauth/authorize') || url.includes('/auth/oauth/authorize')) {
          oauthRedirectUrl = url;
        }
      });

      await page.goto('/signin');

      // Wait for Google button
      const googleButton = page.locator('button:has-text("Continue with Google")');
      await expect(googleButton).toBeVisible({ timeout: 10000 });

      // Click Google button - this will trigger a navigation
      // Use Promise.race to handle the redirect without waiting for the external OAuth provider
      await Promise.race([
        googleButton.click(),
        page.waitForURL(/auth0|oauth|authorize/, { timeout: 5000 }).catch(() => {}),
        new Promise(resolve => setTimeout(resolve, 2000)), // Fallback timeout
      ]);

      // Verify the OAuth URL was requested or we navigated to an OAuth endpoint
      const currentUrl = page.url();
      const isOAuthRedirect =
        oauthRedirectUrl?.includes('provider=google') ||
        currentUrl.includes('auth0') ||
        currentUrl.includes('oauth') ||
        currentUrl.includes('authorize');

      expect(isOAuthRedirect || oauthRedirectUrl !== null).toBeTruthy();
    });
  });

  test.describe('Sign-Up Page Social Login Buttons', () => {
    test('should display social login buttons on sign-up page', async ({
      page,
    }) => {
      await page.goto('/signup');

      // Wait for page to load - use name field as indicator
      await expect(
        page.locator('input#name, input[name="name"]').first()
      ).toBeVisible({ timeout: 10000 });

      // Verify Google button is visible
      const googleButton = page.locator('button:has-text("Continue with Google")');
      await expect(googleButton).toBeVisible({ timeout: 5000 });

      // Verify GitHub button is visible
      const githubButton = page.locator('button:has-text("Continue with GitHub")');
      await expect(githubButton).toBeVisible({ timeout: 5000 });

      // Verify the divider text is present
      await expect(
        page.locator('text=/or continue with email/i')
      ).toBeVisible({ timeout: 5000 });
    });
  });

  test.describe('OAuth Callback Handler', () => {
    test('should handle successful OAuth callback with tokens', async ({
      page,
    }) => {
      // Simulate a successful OAuth callback by navigating to the callback URL with mock tokens
      // In a real scenario, the backend would redirect here after OAuth flow completes
      const mockAccessToken = 'mock-access-token-for-testing';
      const mockRefreshToken = 'mock-refresh-token-for-testing';

      // Mock the /auth/me API endpoint to return user data
      await page.route('**/api/auth/me', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: {
              id: 'test-user-id',
              email: 'testuser@example.com',
              name: 'Test User',
              role: 'CUSTOMER',
              emailVerified: true,
            },
          }),
        });
      });

      // Navigate to OAuth callback with tokens in hash
      await page.goto(
        `/oauth/success#accessToken=${mockAccessToken}&refreshToken=${mockRefreshToken}&isNewUser=false`
      );

      // Should show loading state briefly, then redirect
      // Wait for redirect to home or dashboard
      await page.waitForURL(/\/(payments|dashboard)?$/, { timeout: 10000 });

      // Verify tokens are stored
      const storedTokens = await page.evaluate(() => {
        const authStorage = localStorage.getItem('auth-storage');
        if (!authStorage) return null;
        try {
          const parsed = JSON.parse(authStorage);
          return {
            accessToken: parsed.state?.accessToken,
            isAuthenticated: parsed.state?.isAuthenticated,
          };
        } catch {
          return null;
        }
      });

      // Tokens should be stored (or auth state set)
      expect(storedTokens?.accessToken || storedTokens?.isAuthenticated).toBeTruthy();
    });

    test('should handle OAuth callback error gracefully', async ({ page }) => {
      // Navigate to OAuth callback with error params
      await page.goto('/oauth/success?error=access_denied&message=User%20cancelled%20authentication');

      // Should display error message
      await expect(
        page.locator('text=/authentication failed|error|cancelled/i')
      ).toBeVisible({ timeout: 10000 });

      // Should have link to return to sign in
      await expect(
        page.locator('text=/return to sign in|sign in/i')
      ).toBeVisible({ timeout: 5000 });
    });

    test('should handle missing tokens in OAuth callback', async ({ page }) => {
      // Navigate to OAuth callback without tokens
      await page.goto('/oauth/success');

      // Should display error about missing tokens
      await expect(
        page.locator('text=/missing tokens|invalid|failed/i')
      ).toBeVisible({ timeout: 10000 });
    });

    test('should redirect new users to MFA recommendation page', async ({
      page,
    }) => {
      const mockAccessToken = 'mock-access-token-new-user';
      const mockRefreshToken = 'mock-refresh-token-new-user';

      // Mock the /auth/me API endpoint
      await page.route('**/api/auth/me', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: {
              id: 'new-user-id',
              email: 'newuser@example.com',
              name: 'New User',
              role: 'CUSTOMER',
              emailVerified: true,
              mfaEnabled: false,
            },
          }),
        });
      });

      // Clear any previous MFA dismissal
      await page.evaluate(() => {
        localStorage.removeItem('mfa_recommend_dismissed');
      });

      // Navigate to OAuth callback with isNewUser=true
      await page.goto(
        `/oauth/success#accessToken=${mockAccessToken}&refreshToken=${mockRefreshToken}&isNewUser=true`
      );

      // Should redirect to MFA recommendation page
      await page.waitForURL(/mfa-recommend/, { timeout: 10000 });

      // Verify MFA recommendation page content
      await expect(
        page.locator('text=/secure your account/i')
      ).toBeVisible({ timeout: 5000 });

      await expect(
        page.locator('button:has-text(/enable.*two-factor|enable.*mfa/i)')
      ).toBeVisible({ timeout: 5000 });

      await expect(
        page.locator('button:has-text(/skip/i)')
      ).toBeVisible({ timeout: 5000 });
    });

    test('should skip MFA recommendation if previously dismissed', async ({
      page,
    }) => {
      const mockAccessToken = 'mock-access-token-returning-user';
      const mockRefreshToken = 'mock-refresh-token-returning-user';

      // Mock the /auth/me API endpoint
      await page.route('**/api/auth/me', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: {
              id: 'returning-user-id',
              email: 'returning@example.com',
              name: 'Returning User',
              role: 'CUSTOMER',
              emailVerified: true,
              mfaEnabled: false,
            },
          }),
        });
      });

      // Set the MFA dismissed flag before OAuth callback
      await page.goto('/');
      await page.evaluate(() => {
        localStorage.setItem('mfa_recommend_dismissed', 'true');
      });

      // Navigate to OAuth callback with isNewUser=true
      await page.goto(
        `/oauth/success#accessToken=${mockAccessToken}&refreshToken=${mockRefreshToken}&isNewUser=true`
      );

      // Should redirect to home, NOT to MFA recommendation
      await page.waitForURL(/^(?!.*mfa-recommend).*$/, { timeout: 10000 });

      // Should NOT be on MFA recommendation page
      expect(page.url()).not.toContain('mfa-recommend');
    });
  });

  test.describe('MFA Recommendation Page', () => {
    /**
     * Helper to set up authenticated state and navigate to MFA recommendation page
     */
    async function setupAuthenticatedMfaRecommendPage(page: Page) {
      // Mock authenticated state
      await page.evaluate(() => {
        localStorage.setItem('auth-storage', JSON.stringify({
          state: {
            accessToken: 'mock-token',
            refreshToken: 'mock-refresh',
            isAuthenticated: true,
            user: {
              id: 'test-user',
              email: 'test@example.com',
              name: 'Test User',
              role: 'CUSTOMER',
            },
          },
          version: 0,
        }));
        // Clear any previous dismissal
        localStorage.removeItem('mfa_recommend_dismissed');
      });

      await page.goto('/mfa-recommend');
    }

    test('should display MFA recommendation page with all elements', async ({
      page,
    }) => {
      await setupAuthenticatedMfaRecommendPage(page);

      // Verify title
      await expect(
        page.locator('text=/secure your account/i')
      ).toBeVisible({ timeout: 10000 });

      // Verify benefits are listed
      await expect(
        page.locator('text=/protects against unauthorized access/i')
      ).toBeVisible({ timeout: 5000 });

      // Verify buttons
      await expect(
        page.locator('button:has-text(/enable.*two-factor|enable.*mfa/i)')
      ).toBeVisible({ timeout: 5000 });

      await expect(
        page.locator('button:has-text(/skip/i)')
      ).toBeVisible({ timeout: 5000 });

      // Verify checkbox
      await expect(
        page.locator('text=/don\'t show this again/i')
      ).toBeVisible({ timeout: 5000 });
    });

    test('should redirect to profile security tab when clicking Enable MFA', async ({
      page,
    }) => {
      await setupAuthenticatedMfaRecommendPage(page);

      // Click Enable MFA button
      const enableButton = page.locator('button:has-text(/enable.*two-factor|enable.*mfa/i)');
      await expect(enableButton).toBeVisible({ timeout: 10000 });
      await enableButton.click();

      // Should redirect to profile page (security tab)
      await expect(page).toHaveURL(/profile.*security|profile/, { timeout: 10000 });
    });

    test('should redirect to home when clicking Skip', async ({ page }) => {
      await setupAuthenticatedMfaRecommendPage(page);

      // Click Skip button
      const skipButton = page.locator('button:has-text(/skip/i)');
      await expect(skipButton).toBeVisible({ timeout: 10000 });
      await skipButton.click();

      // Should redirect to home
      await page.waitForURL(/^\/$|\/payments|\/dashboard/, { timeout: 10000 });
    });

    test('should save "Don\'t show again" preference', async ({ page }) => {
      await setupAuthenticatedMfaRecommendPage(page);

      // Check the "Don't show again" checkbox
      const checkbox = page.locator('input[type="checkbox"]').first();
      await checkbox.check();

      // Click Skip
      const skipButton = page.locator('button:has-text(/skip/i)');
      await skipButton.click();

      // Wait for redirect
      await page.waitForURL(/^\/$|\/payments|\/dashboard/, { timeout: 10000 });

      // Verify preference is saved in localStorage
      const dismissed = await page.evaluate(() => {
        return localStorage.getItem('mfa_recommend_dismissed');
      });
      expect(dismissed).toBe('true');
    });
  });

  test.describe('Account Linking in Profile Page', () => {
    /**
     * Helper to set up authenticated state and navigate to profile security tab
     */
    async function setupAuthenticatedProfilePage(page: Page) {
      // Sign in first
      await page.goto('/signin');
      await page.fill('input[type="email"]', 'customer@example.com');
      await page.fill('input[type="password"]', 'password123');
      await page.click('button[type="submit"]');
      await expect(page).toHaveURL(/.*payments/, { timeout: 10000 });

      // Navigate to profile
      await page.click('text=/profile/i');
      await expect(page).toHaveURL(/.*profile/, { timeout: 10000 });
    }

    test('should display Linked Accounts section in Security tab', async ({
      page,
    }) => {
      await setupAuthenticatedProfilePage(page);

      // Click on Security tab
      const securityTab = page.locator('button:has-text("Security")');
      await expect(securityTab).toBeVisible({ timeout: 10000 });
      await securityTab.click();

      // Wait for security tab content
      await expect(
        page.locator('text=/linked accounts|connected accounts/i')
      ).toBeVisible({ timeout: 10000 });
    });

    test('should display available providers to link', async ({ page }) => {
      // Mock the linked accounts API to return empty list
      await page.route('**/api/auth/oauth/accounts', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: [],
          }),
        });
      });

      // Mock supported providers
      await page.route('**/api/auth/oauth/providers', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: ['google', 'github'],
          }),
        });
      });

      await setupAuthenticatedProfilePage(page);

      // Click on Security tab
      const securityTab = page.locator('button:has-text("Security")');
      await securityTab.click();

      // Should show options to link accounts
      await expect(
        page.locator('text=/link|connect/i').first()
      ).toBeVisible({ timeout: 10000 });
    });

    test('should display linked accounts when user has linked providers', async ({
      page,
    }) => {
      // Mock the linked accounts API to return linked Google account
      await page.route('**/api/auth/oauth/accounts', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: [
              {
                provider: 'google',
                providerEmail: 'testuser@gmail.com',
                linkedAt: new Date().toISOString(),
              },
            ],
          }),
        });
      });

      await setupAuthenticatedProfilePage(page);

      // Click on Security tab
      const securityTab = page.locator('button:has-text("Security")');
      await securityTab.click();

      // Should show the linked Google account
      await expect(
        page.locator('text=/google/i')
      ).toBeVisible({ timeout: 10000 });

      // Should show unlink option
      await expect(
        page.locator('button:has-text(/unlink|disconnect|remove/i)')
      ).toBeVisible({ timeout: 5000 });
    });

    test('should show confirmation dialog when unlinking account', async ({
      page,
    }) => {
      // Mock the linked accounts API to return linked Google account
      await page.route('**/api/auth/oauth/accounts', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: [
              {
                provider: 'google',
                providerEmail: 'testuser@gmail.com',
                linkedAt: new Date().toISOString(),
              },
            ],
          }),
        });
      });

      await setupAuthenticatedProfilePage(page);

      // Click on Security tab
      const securityTab = page.locator('button:has-text("Security")');
      await securityTab.click();

      // Wait for linked accounts to load
      await expect(
        page.locator('text=/google/i')
      ).toBeVisible({ timeout: 10000 });

      // Click unlink button
      const unlinkButton = page.locator('button:has-text(/unlink|disconnect|remove/i)').first();
      await unlinkButton.click();

      // Should show confirmation dialog
      await expect(
        page.locator('text=/are you sure|confirm|warning/i')
      ).toBeVisible({ timeout: 5000 });
    });
  });

  test.describe('Error Handling', () => {
    test('should display OAuth error from URL params on sign-in page', async ({
      page,
    }) => {
      // Navigate to sign-in with OAuth error params (as backend would redirect)
      await page.goto('/signin?error=oauth_failed&message=Failed%20to%20authenticate%20with%20Google');

      // Should display the error message
      await expect(
        page.locator('text=/failed to authenticate|oauth.*failed|error/i')
      ).toBeVisible({ timeout: 10000 });
    });

    test('should handle network errors during OAuth callback', async ({
      page,
    }) => {
      const mockAccessToken = 'mock-token-network-error';
      const mockRefreshToken = 'mock-refresh-network-error';

      // Mock the /auth/me API to fail
      await page.route('**/api/auth/me', async (route) => {
        await route.abort('failed');
      });

      // Navigate to OAuth callback with tokens
      await page.goto(
        `/oauth/success#accessToken=${mockAccessToken}&refreshToken=${mockRefreshToken}&isNewUser=false`
      );

      // Should show error message
      await expect(
        page.locator('text=/failed|error|problem/i')
      ).toBeVisible({ timeout: 10000 });

      // Should have link to return to sign in
      await expect(
        page.locator('text=/return to sign in|sign in|try again/i')
      ).toBeVisible({ timeout: 5000 });
    });

    test('should handle API error response during OAuth callback', async ({
      page,
    }) => {
      const mockAccessToken = 'mock-token-api-error';
      const mockRefreshToken = 'mock-refresh-api-error';

      // Mock the /auth/me API to return error
      await page.route('**/api/auth/me', async (route) => {
        await route.fulfill({
          status: 401,
          contentType: 'application/json',
          body: JSON.stringify({
            success: false,
            error: 'UNAUTHORIZED',
            message: 'Invalid token',
          }),
        });
      });

      // Navigate to OAuth callback with tokens
      await page.goto(
        `/oauth/success#accessToken=${mockAccessToken}&refreshToken=${mockRefreshToken}&isNewUser=false`
      );

      // Should show error message
      await expect(
        page.locator('text=/failed|error|invalid/i')
      ).toBeVisible({ timeout: 10000 });
    });
  });
});
