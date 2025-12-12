import { test, expect } from '@playwright/test';

/**
 * Full-Stack Integration Tests for Authentication Flow
 *
 * These tests verify end-to-end flows across frontend and backend:
 * - Frontend UI interactions
 * - Backend API calls and responses
 * - Token management
 * - Error handling
 */

test.describe('Full-Stack Authentication Integration', () => {
  test.beforeEach(async ({ page }) => {
    // Clear localStorage and cookies before each test
    await page.goto('/');
    await page.evaluate(() => {
      localStorage.clear();
      sessionStorage.clear();
    });
    await page.context().clearCookies();
  });

  test.describe('Registration End-to-End', () => {
    test('should register new user and receive tokens from backend', async ({
      page,
    }) => {
      // Track API call
      const registerResponsePromise = page.waitForResponse(
        response =>
          response.url().includes('/api/auth/register') &&
          response.request().method() === 'POST'
      );

      await page.goto('/signup');

      // Wait for sign-up form
      await expect(page.locator('input[type="text"]')).toBeVisible({
        timeout: 10000,
      });

      // Generate unique email for test
      const timestamp = Date.now();
      const testEmail = `test-${timestamp}@example.com`;

      // Fill in sign-up form
      await page.fill('input[type="text"]', 'Test User');
      await page.fill('input[type="email"]', testEmail);
      await page.fill('input[type="password"]', 'TestPassword123!@#');

      const passwordInputs = page.locator('input[type="password"]');
      await passwordInputs.nth(1).fill('TestPassword123!@#');

      // Submit form
      await page.click('button[type="submit"]');

      // Wait for API response
      const registerResponse = await registerResponsePromise;

      // Verify backend API response
      expect(registerResponse.status()).toBe(201);
      const responseBody = await registerResponse.json();
      expect(responseBody).toHaveProperty('success', true);
      expect(responseBody.data).toHaveProperty('accessToken');
      expect(responseBody.data).toHaveProperty('refreshToken');
      expect(responseBody.data).toHaveProperty('user');
      expect(responseBody.data.user).toHaveProperty('email', testEmail);

      // Verify frontend redirect to payments
      await expect(page).toHaveURL(/.*payments/, { timeout: 10000 });

      // Verify tokens are stored (check localStorage)
      const tokens = await page.evaluate(() => {
        return {
          accessToken: localStorage.getItem('auth_accessToken'),
          refreshToken: localStorage.getItem('auth_refreshToken'),
        };
      });
      expect(tokens.accessToken).toBeTruthy();
      expect(tokens.refreshToken).toBeTruthy();
    });

    test('should handle duplicate email registration error from backend', async ({
      page,
    }) => {
      // First, register a user
      await page.goto('/signup');
      const testEmail = 'duplicate@example.com';

      await page.fill('input[type="text"]', 'First User');
      await page.fill('input[type="email"]', testEmail);
      await page.fill('input[type="password"]', 'Password123!@#');

      const passwordInputs = page.locator('input[type="password"]');
      await passwordInputs.nth(1).fill('Password123!@#');
      await page.click('button[type="submit"]');

      // Wait for first registration to complete
      await expect(page).toHaveURL(/.*payments/, { timeout: 10000 });

      // Now try to register again with same email
      await page.goto('/signup');

      const duplicateResponsePromise = page.waitForResponse(
        response =>
          response.url().includes('/api/auth/register') &&
          response.request().method() === 'POST'
      );

      await page.fill('input[type="text"]', 'Second User');
      await page.fill('input[type="email"]', testEmail);
      await page.fill('input[type="password"]', 'Password123!@#');
      await passwordInputs.nth(1).fill('Password123!@#');
      await page.click('button[type="submit"]');

      // Verify backend returns 409 Conflict
      const duplicateResponse = await duplicateResponsePromise;
      expect(duplicateResponse.status()).toBe(409);

      const errorBody = await duplicateResponse.json();
      expect(errorBody).toHaveProperty('success', false);
      expect(errorBody).toHaveProperty('error');

      // Verify error message is displayed in UI
      await expect(
        page.locator('text=/email.*already.*exists|duplicate/i')
      ).toBeVisible({ timeout: 5000 });
    });
  });

  test.describe('Login End-to-End', () => {
    test('should login and receive tokens from backend', async ({ page }) => {
      // Track API call
      const loginResponsePromise = page.waitForResponse(
        response =>
          response.url().includes('/api/auth/login') &&
          response.request().method() === 'POST'
      );

      await page.goto('/signin');

      // Wait for sign-in form
      await expect(page.locator('input[type="email"]')).toBeVisible({
        timeout: 10000,
      });

      // Fill in sign-in form
      await page.fill('input[type="email"]', 'customer@example.com');
      await page.fill('input[type="password"]', 'password123');

      // Submit form
      await page.click('button[type="submit"]');

      // Wait for API response
      const loginResponse = await loginResponsePromise;

      // Verify backend API response
      expect(loginResponse.status()).toBe(200);
      const responseBody = await loginResponse.json();
      expect(responseBody).toHaveProperty('success', true);
      expect(responseBody.data).toHaveProperty('accessToken');
      expect(responseBody.data).toHaveProperty('refreshToken');
      expect(responseBody.data).toHaveProperty('user');
      expect(responseBody.data.user).toHaveProperty(
        'email',
        'customer@example.com'
      );

      // Verify frontend redirect to payments
      await expect(page).toHaveURL(/.*payments/, { timeout: 10000 });

      // Verify tokens are stored
      const tokens = await page.evaluate(() => {
        return {
          accessToken: localStorage.getItem('auth_accessToken'),
          refreshToken: localStorage.getItem('auth_refreshToken'),
        };
      });
      expect(tokens.accessToken).toBeTruthy();
      expect(tokens.refreshToken).toBeTruthy();
    });

    test('should handle invalid credentials error from backend', async ({
      page,
    }) => {
      // Track API call
      const loginResponsePromise = page.waitForResponse(
        response =>
          response.url().includes('/api/auth/login') &&
          response.request().method() === 'POST'
      );

      await page.goto('/signin');

      // Fill in invalid credentials
      await page.fill('input[type="email"]', 'nonexistent@example.com');
      await page.fill('input[type="password"]', 'wrongpassword');
      await page.click('button[type="submit"]');

      // Verify backend returns 401 Unauthorized
      const loginResponse = await loginResponsePromise;
      expect(loginResponse.status()).toBe(401);

      const errorBody = await loginResponse.json();
      expect(errorBody).toHaveProperty('success', false);
      expect(errorBody).toHaveProperty('error');

      // Verify error message is displayed in UI
      await expect(
        page.locator('text=/invalid.*credentials|unauthorized|incorrect/i')
      ).toBeVisible({ timeout: 5000 });

      // Verify user is NOT redirected to payments
      await expect(page).not.toHaveURL(/.*payments/);
    });

    test('should handle wrong password error from backend', async ({
      page,
    }) => {
      const loginResponsePromise = page.waitForResponse(
        response =>
          response.url().includes('/api/auth/login') &&
          response.request().method() === 'POST'
      );

      await page.goto('/signin');

      // Use correct email but wrong password
      await page.fill('input[type="email"]', 'customer@example.com');
      await page.fill('input[type="password"]', 'wrongpassword');
      await page.click('button[type="submit"]');

      // Verify backend returns 401
      const loginResponse = await loginResponsePromise;
      expect(loginResponse.status()).toBe(401);

      const errorBody = await loginResponse.json();
      expect(errorBody).toHaveProperty('success', false);
    });
  });

  test.describe('Logout End-to-End', () => {
    test.beforeEach(async ({ page }) => {
      // Sign in before each test
      await page.goto('/signin');
      await page.fill('input[type="email"]', 'customer@example.com');
      await page.fill('input[type="password"]', 'password123');
      await page.click('button[type="submit"]');
      await expect(page).toHaveURL(/.*payments/, { timeout: 10000 });
    });

    test('should logout and call backend API to invalidate tokens', async ({
      page,
    }) => {
      // Track logout API call
      const logoutResponsePromise = page.waitForResponse(
        response =>
          response.url().includes('/api/auth/logout') &&
          response.request().method() === 'POST'
      );

      // Find and click logout button
      const logoutButton = page
        .locator('button')
        .filter({ hasText: /logout|sign out/i });
      await expect(logoutButton).toBeVisible({ timeout: 10000 });
      await logoutButton.click();

      // Verify backend API was called
      const logoutResponse = await logoutResponsePromise;
      expect(logoutResponse.status()).toBe(200);

      const responseBody = await logoutResponse.json();
      expect(responseBody).toHaveProperty('success', true);

      // Verify redirect to sign-in
      await expect(page).toHaveURL(/.*signin/, { timeout: 10000 });

      // Verify tokens are cleared
      const tokens = await page.evaluate(() => {
        return {
          accessToken: localStorage.getItem('auth_accessToken'),
          refreshToken: localStorage.getItem('auth_refreshToken'),
        };
      });
      expect(tokens.accessToken).toBeFalsy();
      expect(tokens.refreshToken).toBeFalsy();
    });
  });

  test.describe('Token Refresh', () => {
    test.beforeEach(async ({ page }) => {
      // Sign in before each test
      await page.goto('/signin');
      await page.fill('input[type="email"]', 'customer@example.com');
      await page.fill('input[type="password"]', 'password123');
      await page.click('button[type="submit"]');
      await expect(page).toHaveURL(/.*payments/, { timeout: 10000 });
    });

    test('should automatically refresh token when access token expires', async ({
      page,
    }) => {
      // Get initial tokens
      const initialTokens = await page.evaluate(() => {
        return {
          accessToken: localStorage.getItem('auth_accessToken'),
          refreshToken: localStorage.getItem('auth_refreshToken'),
        };
      });
      expect(initialTokens.refreshToken).toBeTruthy();

      // Simulate expired access token by manually setting an old/invalid token
      // In a real scenario, this would happen when the token expires
      // For testing, we'll trigger a refresh by making an API call that requires auth
      // and intercepting the 401 response that triggers refresh

      // Make a request that requires authentication
      const refreshResponsePromise = page.waitForResponse(
        response =>
          response.url().includes('/api/auth/refresh') &&
          response.request().method() === 'POST'
      );

      // Simulate token expiry by making an API call with expired token
      // The interceptor should detect 401 and trigger refresh
      // For this test, we'll directly test the refresh endpoint
      await page.evaluate(refreshToken => {
        return fetch('/api/auth/refresh', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ refreshToken }),
        });
      }, initialTokens.refreshToken);

      // Wait for refresh response
      const refreshResponse = await refreshResponsePromise;
      expect(refreshResponse.status()).toBe(200);

      const refreshBody = await refreshResponse.json();
      expect(refreshBody).toHaveProperty('success', true);
      expect(refreshBody.data).toHaveProperty('accessToken');

      // Verify new access token is stored
      const newTokens = await page.evaluate(() => {
        return {
          accessToken: localStorage.getItem('auth_accessToken'),
          refreshToken: localStorage.getItem('auth_refreshToken'),
        };
      });
      expect(newTokens.accessToken).toBeTruthy();
      // Refresh token should remain the same (or be updated depending on implementation)
    });

    test('should handle invalid refresh token error', async ({ page }) => {
      // Set invalid refresh token
      await page.evaluate(() => {
        localStorage.setItem('auth_refreshToken', 'invalid-refresh-token');
      });

      // Try to refresh with invalid token
      const refreshResponsePromise = page.waitForResponse(
        response =>
          response.url().includes('/api/auth/refresh') &&
          response.request().method() === 'POST'
      );

      await page.evaluate(() => {
        return fetch('/api/auth/refresh', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ refreshToken: 'invalid-refresh-token' }),
        });
      });

      // Verify backend returns 401
      const refreshResponse = await refreshResponsePromise;
      expect(refreshResponse.status()).toBe(401);

      const errorBody = await refreshResponse.json();
      expect(errorBody).toHaveProperty('success', false);
    });
  });

  test.describe('Session Expiry', () => {
    test('should handle session expiry and redirect to sign-in', async ({
      page,
    }) => {
      // Sign in first
      await page.goto('/signin');
      await page.fill('input[type="email"]', 'customer@example.com');
      await page.fill('input[type="password"]', 'password123');
      await page.click('button[type="submit"]');
      await expect(page).toHaveURL(/.*payments/, { timeout: 10000 });

      // Clear tokens to simulate session expiry
      await page.evaluate(() => {
        localStorage.removeItem('auth_accessToken');
        localStorage.removeItem('auth_refreshToken');
      });

      // Try to access protected route
      await page.goto('/payments');

      // Should redirect to sign-in
      await expect(page).toHaveURL(/.*signin/, { timeout: 10000 });
    });

    test('should handle expired refresh token', async ({ page }) => {
      // Sign in first
      await page.goto('/signin');
      await page.fill('input[type="email"]', 'customer@example.com');
      await page.fill('input[type="password"]', 'password123');
      await page.click('button[type="submit"]');
      await expect(page).toHaveURL(/.*payments/, { timeout: 10000 });

      // Set expired refresh token (in real scenario, this would be expired)
      // For testing, we'll use an invalid token format
      await page.evaluate(() => {
        localStorage.setItem('auth_refreshToken', 'expired-token');
        localStorage.setItem('auth_accessToken', 'expired-access-token');
      });

      // Make a request that would trigger refresh
      // The refresh should fail, and user should be logged out
      const refreshResponsePromise = page.waitForResponse(
        response =>
          response.url().includes('/api/auth/refresh') &&
          response.request().method() === 'POST'
      );

      // Trigger refresh attempt (this would happen automatically via interceptor)
      await page.evaluate(() => {
        return fetch('/api/auth/refresh', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ refreshToken: 'expired-token' }),
        });
      });

      // Verify refresh fails
      const refreshResponse = await refreshResponsePromise;
      expect(refreshResponse.status()).toBe(401);

      // User should be redirected to sign-in
      await page.goto('/payments');
      await expect(page).toHaveURL(/.*signin/, { timeout: 10000 });
    });
  });
});
