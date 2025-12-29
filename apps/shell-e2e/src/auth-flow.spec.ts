import { test, expect } from '@playwright/test';

// Skip tests that require backend API in CI (backend auth not fully configured yet)
const isCI = !!process.env.CI;

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
    test.skip(isCI, 'Requires backend auth service - skipped in CI for now');
    await page.goto('/signin');

    // Wait for sign-in form to load
    await expect(page.locator('input[type="email"]')).toBeVisible({
      timeout: 10000,
    });
    await expect(page.locator('input[type="password"]')).toBeVisible({
      timeout: 10000,
    });

    // Fill in sign-in form
    await page.fill('input[type="email"]', 'customer@example.com');
    await page.fill('input[type="password"]', 'password123');

    // Submit form
    await page.click('button[type="submit"]');

    // Wait for redirect to payments page
    await expect(page).toHaveURL(/.*payments/, { timeout: 10000 });

    // Verify payments page is loaded
    await expect(page.locator('h1, h2')).toContainText(/payment/i, {
      timeout: 10000,
    });
  });

  test('should complete sign-up flow: sign up → redirect → payments page', async ({
    page,
  }) => {
    test.skip(isCI, 'Requires backend auth service - skipped in CI for now');
    await page.goto('/signup');

    // Wait for sign-up form to load
    await expect(page.locator('input[type="text"]')).toBeVisible({
      timeout: 10000,
    });
    await expect(page.locator('input[type="email"]')).toBeVisible({
      timeout: 10000,
    });
    await expect(page.locator('input[type="password"]')).toBeVisible({
      timeout: 10000,
    });

    // Fill in sign-up form
    await page.fill('input[type="text"]', 'New User');
    await page.fill('input[type="email"]', 'newuser@example.com');
    await page.fill('input[type="password"]', 'Password123!@#');

    // Find and fill confirm password field (usually the second password input)
    const passwordInputs = page.locator('input[type="password"]');
    await passwordInputs.nth(1).fill('Password123!@#');

    // Submit form
    await page.click('button[type="submit"]');

    // Wait for redirect to payments page
    await expect(page).toHaveURL(/.*payments/, { timeout: 10000 });

    // Verify payments page is loaded
    await expect(page.locator('h1, h2')).toContainText(/payment/i, {
      timeout: 10000,
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
    await page.fill('input[type="password"]', 'password123');

    // Submit form
    await page.click('button[type="submit"]');

    // Should show validation error
    await expect(page.locator('text=/invalid.*email/i')).toBeVisible({
      timeout: 5000,
    });
  });

  test('should show validation errors for weak password', async ({ page }) => {
    await page.goto('/signup');

    // Wait for form to load
    await expect(page.locator('input[type="text"]')).toBeVisible({
      timeout: 10000,
    });

    // Fill in form with weak password
    await page.fill('input[type="text"]', 'New User');
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
    await expect(page.locator('input[type="text"]')).toBeVisible({
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
