import { test, expect } from '@playwright/test';

test.describe('Profile Management Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Clear localStorage before each test
    await page.goto('/');
    await page.evaluate(() => localStorage.clear());
  });

  test('should complete profile management flow: sign in → navigate to profile → view profile → update profile → success', async ({
    page,
  }) => {
    // Step 1: Sign in
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

    // Step 2: Navigate to Profile page via header navigation
    await page.click('text=/profile/i');

    // Wait for profile page to load
    await expect(page).toHaveURL(/.*profile/, { timeout: 10000 });
    await expect(page.locator('h1')).toContainText(/profile/i, {
      timeout: 10000,
    });

    // Step 3: Verify default Profile tab is active
    await expect(page.locator('input[placeholder*="phone"]')).toBeVisible({
      timeout: 5000,
    });

    // Step 4: Update profile information
    await page.fill('input[placeholder*="phone"]', '+1-555-123-4567');
    await page.fill(
      'input[placeholder*="address"]',
      '123 Updated Street, Test City, TC 12345'
    );
    await page.fill(
      'textarea[placeholder*="bio"]',
      'Updated bio for E2E testing. This user is testing the profile management functionality.'
    );

    // Submit the form
    await page.click('button[type="submit"]:has-text(/update.*profile/i)');

    // Step 5: Verify success feedback
    await expect(
      page.locator('text=/profile.*updated|success|saved/i')
    ).toBeVisible({ timeout: 5000 });

    // Step 6: Switch to Preferences tab
    await page.click('button:has-text("Preferences")');

    // Verify preferences form is visible
    await expect(page.locator('label:has-text("Language")')).toBeVisible({
      timeout: 5000,
    });

    // Step 7: Update preferences
    await page.selectOption('select[aria-label*="language"]', 'en');
    await page.selectOption('select[aria-label*="currency"]', 'USD');
    await page.selectOption(
      'select[aria-label*="timezone"]',
      'America/New_York'
    );

    // Check some notification preferences
    await page.check('input[type="checkbox"][value="email"]');
    await page.check('input[type="checkbox"][value="push"]');

    // Submit preferences
    await page.click('button[type="submit"]:has-text(/update.*preferences/i)');

    // Step 8: Verify preferences success feedback
    await expect(
      page.locator('text=/preferences.*updated|success|saved/i')
    ).toBeVisible({ timeout: 5000 });

    // Step 9: Switch to Account tab
    await page.click('button:has-text("Account")');

    // Verify account information is displayed
    await expect(page.locator('text=/read-only overview/i')).toBeVisible({
      timeout: 5000,
    });
    await expect(page.locator('text=customer@example.com')).toBeVisible({
      timeout: 5000,
    });
  });

  test('should handle profile form validation errors', async ({ page }) => {
    // Sign in first
    await page.goto('/signin');
    await page.fill('input[type="email"]', 'customer@example.com');
    await page.fill('input[type="password"]', 'password123');
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL(/.*payments/, { timeout: 10000 });

    // Navigate to profile
    await page.click('text=/profile/i');
    await expect(page).toHaveURL(/.*profile/, { timeout: 10000 });

    // Try to submit invalid phone number
    await page.fill('input[placeholder*="phone"]', 'invalid-phone-number');
    await page.click('button[type="submit"]:has-text(/update.*profile/i)');

    // Verify form doesn't submit (client-side validation prevents it)
    // The success message should not appear
    await expect(
      page.locator('text=/profile.*updated|success|saved/i')
    ).not.toBeVisible({ timeout: 2000 });
  });

  test('should navigate back to payments from profile', async ({ page }) => {
    // Sign in first
    await page.goto('/signin');
    await page.fill('input[type="email"]', 'customer@example.com');
    await page.fill('input[type="password"]', 'password123');
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL(/.*payments/, { timeout: 10000 });

    // Navigate to profile
    await page.click('text=/profile/i');
    await expect(page).toHaveURL(/.*profile/, { timeout: 10000 });

    // Navigate back to payments
    await page.click('text=/payments/i');
    await expect(page).toHaveURL(/.*payments/, { timeout: 10000 });
  });

  test('should redirect unauthenticated users away from profile page', async ({
    page,
  }) => {
    // Try to access profile page directly without authentication
    await page.goto('/profile');

    // Should redirect to sign-in page
    await expect(page).toHaveURL(/.*signin/, { timeout: 10000 });
  });

  test('should maintain form state when switching tabs', async ({ page }) => {
    // Sign in first
    await page.goto('/signin');
    await page.fill('input[type="email"]', 'customer@example.com');
    await page.fill('input[type="password"]', 'password123');
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL(/.*payments/, { timeout: 10000 });

    // Navigate to profile
    await page.click('text=/profile/i');
    await expect(page).toHaveURL(/.*profile/, { timeout: 10000 });

    // Fill in profile form
    await page.fill('input[placeholder*="phone"]', '+1-555-123-4567');
    await page.fill('input[placeholder*="address"]', '123 Test Street');

    // Switch to preferences tab
    await page.click('button:has-text("Preferences")');

    // Switch back to profile tab
    await page.click('button:has-text("Profile")');

    // Verify form values are maintained
    await expect(page.locator('input[placeholder*="phone"]')).toHaveValue(
      '+1-555-123-4567'
    );
    await expect(page.locator('input[placeholder*="address"]')).toHaveValue(
      '123 Test Street'
    );
  });
});
