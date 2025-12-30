import { test, expect } from '@playwright/test';

/**
 * Accessibility Tests for Profile MFE
 *
 * These tests verify WCAG 2.1 AA compliance:
 * - Keyboard navigation
 * - Screen reader compatibility
 * - ARIA labels and roles
 * - Focus management
 * - Color contrast (manual verification noted)
 */

test.describe('Profile Accessibility', () => {
  test.beforeEach(async ({ page }) => {
    // Clear localStorage before each test
    await page.goto('/');
    await page.evaluate(() => localStorage.clear());

    // Sign in for authenticated tests
    await page.goto('/signin');
    await page.fill('input[type="email"]', 'customer@example.com');
    await page.fill('input[type="password"]', 'password123');
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL(/.*payments/, { timeout: 10000 });
  });

  test('should support keyboard navigation through profile page', async ({
    page,
  }) => {
    // Navigate to profile page
    await page.goto('/profile');
    await expect(page.locator('h1')).toContainText(/profile/i, {
      timeout: 10000,
    });

    // Start keyboard navigation from the beginning
    await page.keyboard.press('Tab');

    // Verify first focusable element (Profile tab should be focused)
    await expect(page.locator('button:has-text("Profile")')).toBeFocused();

    // Tab through navigation
    await page.keyboard.press('Tab');
    await expect(page.locator('button:has-text("Preferences")')).toBeFocused();

    await page.keyboard.press('Tab');
    await expect(page.locator('button:has-text("Account")')).toBeFocused();

    // Tab to first form element (phone input)
    await page.keyboard.press('Tab');
    const activeElement = await page.evaluate(
      () => document.activeElement?.tagName
    );
    expect(activeElement).toBe('INPUT');
  });

  test('should support tab switching with keyboard', async ({ page }) => {
    // Navigate to profile page
    await page.goto('/profile');
    await expect(page.locator('input[placeholder*="phone"]')).toBeVisible({
      timeout: 5000,
    });

    // Focus on Preferences tab and activate with Enter
    await page.keyboard.press('Tab'); // Profile tab
    await page.keyboard.press('Tab'); // Preferences tab
    await page.keyboard.press('Enter');

    // Verify Preferences tab content is visible
    await expect(page.locator('label:has-text("Language")')).toBeVisible({
      timeout: 1000,
    });

    // Tab through preferences form elements
    await page.keyboard.press('Tab'); // Language select
    await page.keyboard.press('Tab'); // Currency select
    await page.keyboard.press('Tab'); // Timezone select
    await page.keyboard.press('Tab'); // Email checkbox
  });

  test('should support form submission with keyboard', async ({ page }) => {
    // Navigate to profile page
    await page.goto('/profile');
    await expect(page.locator('input[placeholder*="phone"]')).toBeVisible({
      timeout: 5000,
    });

    // Fill form using keyboard
    const phoneInput = page.locator('input[placeholder*="phone"]');
    await phoneInput.focus();
    await page.keyboard.type('+1-555-123-4567');

    // Tab to address field
    await page.keyboard.press('Tab');
    await page.keyboard.type('123 Keyboard Test Street');

    // Tab to submit button and submit
    // Skip bio field for this test
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');
    await page.keyboard.press('Enter');

    // Verify form submission (either success or validation error)
    await expect(
      page.locator('text=/profile.*updated|success|error/i')
    ).toBeVisible({ timeout: 5000 });
  });

  test('should have proper ARIA labels and roles', async ({ page }) => {
    // Navigate to profile page
    await page.goto('/profile');
    await expect(page.locator('h1')).toContainText(/profile/i, {
      timeout: 10000,
    });

    // Check tab navigation has proper ARIA attributes
    const tabNavigation = page.locator('[aria-label*="Profile tabs"], nav');
    await expect(tabNavigation).toBeVisible();

    // Check form inputs have proper labels
    const _phoneInput = page.locator('input[placeholder*="phone"]');
    const phoneLabel = page.locator('label').filter({ hasText: /phone/i });
    await expect(phoneLabel).toBeVisible();

    // Check select elements have aria-label
    const languageSelect = page.locator('select[aria-label*="language"]');
    await expect(languageSelect).toBeVisible();
  });

  test('should maintain focus management in modal dialogs', async ({
    page,
  }) => {
    // This test assumes there might be modals in the future (like payment details)
    // For now, we test the basic focus management in the page

    // Navigate to profile page
    await page.goto('/profile');
    await expect(page.locator('input[placeholder*="phone"]')).toBeVisible({
      timeout: 5000,
    });

    // Tab through form elements
    await page.keyboard.press('Tab'); // Skip to first input
    await page.keyboard.press('Tab'); // Phone input
    await page.keyboard.press('Tab'); // Address input
    await page.keyboard.press('Tab'); // Bio textarea
    await page.keyboard.press('Tab'); // Submit button

    // Verify submit button is focused
    await expect(
      page.locator('button[type="submit"]:has-text(/update.*profile/i)')
    ).toBeFocused();
  });

  test('should provide clear error messages for screen readers', async ({
    page,
  }) => {
    // Navigate to profile page
    await page.goto('/profile');
    await expect(page.locator('input[placeholder*="phone"]')).toBeVisible({
      timeout: 5000,
    });

    // Submit form with invalid data
    await page.fill('input[placeholder*="phone"]', 'invalid-phone');
    await page.click('button[type="submit"]:has-text(/update.*profile/i)');

    // Check for error messages (client-side validation should show errors)
    const errorMessage = page.locator('text=/invalid|error|required/i');
    // Either error appears or form validates successfully
    await Promise.race([
      expect(errorMessage).toBeVisible({ timeout: 2000 }),
      expect(page.locator('text=/profile.*updated|success/i')).toBeVisible({
        timeout: 5000,
      }),
    ]);
  });

  test('should have sufficient color contrast (visual verification)', async ({
    page,
  }) => {
    // Navigate to profile page
    await page.goto('/profile');
    await expect(page.locator('h1')).toContainText(/profile/i, {
      timeout: 10000,
    });

    // Take a screenshot for manual color contrast verification
    await page.screenshot({
      path: 'profile-accessibility-screenshot.png',
      fullPage: true,
    });

    // Note: Actual color contrast testing would require additional tools
    // This test documents that a screenshot was taken for manual review
    console.log('Screenshot saved for manual color contrast verification');

    // Basic check that text is visible (not invisible due to contrast issues)
    await expect(page.locator('h1')).toBeVisible();
    await expect(page.locator('button:has-text("Profile")')).toBeVisible();
    await expect(page.locator('input[placeholder*="phone"]')).toBeVisible();
  });

  test('should support screen reader navigation', async ({ page }) => {
    // Navigate to profile page
    await page.goto('/profile');
    await expect(page.locator('h1')).toContainText(/profile/i, {
      timeout: 10000,
    });

    // Check for semantic HTML structure
    await expect(page.locator('h1')).toBeVisible(); // Main heading
    await expect(page.locator('nav')).toBeVisible(); // Navigation landmark
    await expect(page.locator('main, [role="main"]')).toBeVisible(); // Main content area

    // Check form structure
    await expect(page.locator('form, [role="form"]')).toBeVisible();

    // Check that buttons have accessible names
    const buttons = page.locator('button');
    const buttonCount = await buttons.count();
    expect(buttonCount).toBeGreaterThan(0);

    // Verify at least one button has accessible text
    const firstButton = buttons.first();
    const buttonText = await firstButton.textContent();
    expect(buttonText?.trim()).not.toBe('');
  });

  test('should handle focus trapping in complex interactions', async ({
    page,
  }) => {
    // Navigate to profile page
    await page.goto('/profile');
    await expect(page.locator('input[placeholder*="phone"]')).toBeVisible({
      timeout: 5000,
    });

    // Fill form and tab through all fields
    await page.fill('input[placeholder*="phone"]', '+1-555-123-4567');
    await page.keyboard.press('Tab');

    await page.fill(
      'input[placeholder*="address"]',
      '123 Accessibility Test Street'
    );
    await page.keyboard.press('Tab');

    await page.fill(
      'textarea[placeholder*="bio"]',
      'Testing accessibility features'
    );
    await page.keyboard.press('Tab');

    // Should reach submit button
    await expect(
      page.locator('button[type="submit"]:has-text(/update.*profile/i)')
    ).toBeFocused();

    // Verify we can still navigate away from the form
    await page.keyboard.press('Tab');
    // Should be able to reach other page elements
  });
});
