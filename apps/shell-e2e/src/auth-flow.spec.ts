import { test, expect } from '@playwright/test';

test.describe('Authentication Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Clear localStorage before each test
    await page.goto('/');
    await page.evaluate(() => localStorage.clear());
  });

  test('should redirect unauthenticated user to sign-in page', async ({
    page,
  }) => {
    await page.goto('/');

    // Should redirect to /signin
    await expect(page).toHaveURL(/.*signin/);
  });

  test('should complete sign-in flow: sign in → redirect → payments page', async ({
    page,
  }) => {
    // Intercept ALL requests to debug URL issues in CI
    const apiRequests: string[] = [];
    const failedRequests: string[] = [];
    const consoleLogs: string[] = [];

    // Capture browser console logs for debugging
    page.on('console', msg => {
      const text = `[Browser ${msg.type()}] ${msg.text()}`;
      consoleLogs.push(text);
      console.log(text);
    });

    // Listen for request failures
    page.on('requestfailed', request => {
      const failure = request.failure();
      failedRequests.push(`FAILED: ${request.method()} ${request.url()} - ${failure?.errorText || 'unknown error'}`);
      console.log(`[Request FAILED] ${request.method()} ${request.url()} - ${failure?.errorText}`);
    });

    await page.route('**/*', async (route, request) => {
      const url = request.url();
      // Capture any request that looks like an API call
      if (url.includes('/api/') || url.includes('/auth/') || url.includes('localhost:3000') || url.includes('localhost/api')) {
        apiRequests.push(`${request.method()} ${url}`);
        console.log(`[API Request] ${request.method()} ${url}`);
      }
      await route.continue();
    });

    await page.goto('/signin');

    // Enable API URL debug logging and capture window.__ENV__
    const envConfig = await page.evaluate(() => {
      // Enable debug logging for ApiClient URL resolution
      (window as unknown as { __DEBUG_API_URL__: boolean }).__DEBUG_API_URL__ = true;
      return {
        windowEnv: (window as unknown as { __ENV__?: { API_BASE_URL?: string } }).__ENV__,
        hasWindow: typeof window !== 'undefined',
      };
    });
    console.log('[DEBUG] window.__ENV__:', JSON.stringify(envConfig));

    // Wait for sign-in form to load
    await expect(page.locator('input[type="email"]')).toBeVisible({
      timeout: 10000,
    });

    // Fill in sign-in form
    await page.fill('input[type="email"]', 'customer@example.com');
    await page.fill('input[type="password"]', 'TestPassword123!');

    // Submit form
    await page.click('button[type="submit"]');

    // Wait for either successful redirect OR error message
    // This helps diagnose failures in CI
    await Promise.race([
      page.waitForURL(/.*payments/, { timeout: 30000 }),
      page.waitForSelector('[role="alert"], .error, [class*="error"]', { timeout: 30000 })
        .then(async () => {
          // Capture the actual error message for debugging
          const errorText = await page.locator('[role="alert"]').first().textContent();
          // Include API requests in error message for debugging
          const apiInfo = apiRequests.length > 0
            ? `\nAPI requests made: ${apiRequests.join(', ')}`
            : '\nNo API requests intercepted';
          const failedInfo = failedRequests.length > 0
            ? `\nFailed requests: ${failedRequests.join(', ')}`
            : '';
          const envInfo = `\nwindow.__ENV__: ${JSON.stringify(envConfig)}`;
          const consoleInfo = consoleLogs.length > 0
            ? `\nBrowser console (ApiClient logs): ${consoleLogs.filter(l => l.includes('ApiClient')).join('; ')}`
            : '';
          throw new Error(`Login failed - error displayed: "${errorText}"${apiInfo}${failedInfo}${envInfo}${consoleInfo}`);
        }),
    ]);

    // Verify payments page is loaded (use .first() as there may be multiple headings)
    await expect(page.locator('h1, h2').first()).toContainText(/payment/i, {
      timeout: 10000,
    });
  });

  test('should complete sign-up flow: sign up → show email verification pending', async ({
    page,
  }) => {
    await page.goto('/signup');

    // Wait for sign-up form to load - use specific selectors for name field
    await expect(page.locator('input#name, input[name="name"]').first()).toBeVisible({
      timeout: 10000,
    });
    await expect(page.locator('input[type="email"]')).toBeVisible({
      timeout: 10000,
    });
    // Use .first() because sign-up form has 2 password fields (password + confirm)
    await expect(page.locator('input[type="password"]').first()).toBeVisible({
      timeout: 10000,
    });

    // Fill in sign-up form with unique email to avoid conflicts
    const uniqueEmail = `newuser-${Date.now()}@example.com`;
    await page.locator('input#name, input[name="name"]').first().fill('New User');
    await page.fill('input[type="email"]', uniqueEmail);
    await page.fill('input[type="password"]', 'TestPassword123!');

    // Find and fill confirm password field (usually the second password input)
    const passwordInputs = page.locator('input[type="password"]');
    await passwordInputs.nth(1).fill('TestPassword123!');

    // Submit form
    await page.click('button[type="submit"]');

    // With email verification enabled, sign-up shows the verification pending screen
    // instead of redirecting to the payments page
    await expect(page.locator('h1, h2, [class*="CardTitle"]').first()).toContainText(
      /verify your email/i,
      { timeout: 10000 }
    );

    // Verify the verification pending UI shows the expected content
    await expect(page.locator('text=/verification link/i')).toBeVisible({
      timeout: 5000,
    });

    // Verify "Go to Sign In" button is visible
    await expect(page.locator('button:has-text("Go to Sign In")')).toBeVisible({
      timeout: 5000,
    });

    // Verify "Resend Verification Email" button is visible
    await expect(page.locator('button:has-text("Resend Verification Email")')).toBeVisible({
      timeout: 5000,
    });
  });

  test('should show validation errors for invalid email', async ({ page }) => {
    await page.goto('/signin');

    // Wait for form to load
    await expect(page.locator('input[type="email"]')).toBeVisible({
      timeout: 10000,
    });

    // Fill in invalid email
    await page.fill('input[type="email"]', 'invalid-email');
    await page.fill('input[type="password"]', 'TestPassword123!');

    // Submit form
    await page.click('button[type="submit"]');

    // Should show validation error
    await expect(page.locator('text=/invalid.*email/i')).toBeVisible({
      timeout: 5000,
    });
  });

  test('should show validation errors for weak password', async ({ page }) => {
    await page.goto('/signup');

    // Wait for form to load - use specific selector for name field
    await expect(page.locator('input#name, input[name="name"]').first()).toBeVisible({
      timeout: 10000,
    });

    // Fill in form with weak password
    await page.locator('input#name, input[name="name"]').first().fill('New User');
    await page.fill('input[type="email"]', 'newuser@example.com');
    await page.fill('input[type="password"]', 'weak');

    const passwordInputs = page.locator('input[type="password"]');
    await passwordInputs.nth(1).fill('weak');

    // Submit form
    await page.click('button[type="submit"]');

    // Should show validation error
    await expect(
      page.locator('text=/password.*(?:strength|length|complexity)/i')
    ).toBeVisible({ timeout: 5000 });
  });

  test('should navigate between sign-in and sign-up pages', async ({
    page,
  }) => {
    await page.goto('/signin');

    // Wait for sign-in form
    await expect(page.locator('input[type="email"]')).toBeVisible({
      timeout: 10000,
    });

    // Click link to navigate to sign-up
    const signUpLink = page
      .locator('a, button')
      .filter({ hasText: /sign up|signup/i })
      .first();
    await signUpLink.click();

    // Should navigate to sign-up page
    await expect(page).toHaveURL(/.*signup/);
    await expect(page.locator('input#name, input[name="name"]').first()).toBeVisible({
      timeout: 10000,
    });

    // Click link to navigate back to sign-in
    const signInLink = page
      .locator('a, button')
      .filter({ hasText: /sign in|signin/i })
      .first();
    await signInLink.click();

    // Should navigate back to sign-in page
    await expect(page).toHaveURL(/.*signin/);
    await expect(page.locator('input[type="email"]')).toBeVisible({
      timeout: 10000,
    });
  });
});
