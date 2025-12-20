import { test, expect } from '@playwright/test';

test.describe('Profile MFE E2E Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Clear localStorage before each test
    await page.goto('/');
    await page.evaluate(() => localStorage.clear());
  });

  test('should complete full profile user journey: sign in → navigate → view profile → edit → save', async ({
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

    // Wait for redirect to payments page (default after sign in)
    await expect(page).toHaveURL(/.*payments/, { timeout: 10000 });

    // Step 2: Navigate to Profile page
    await page.click('a[href="/profile"], nav a:has-text("Profile")');

    // Wait for Profile page to load
    await expect(page).toHaveURL(/.*profile/, { timeout: 10000 });

    // Verify Profile page header
    await expect(page.locator('h1')).toContainText('Profile', {
      timeout: 10000,
    });

    // Step 3: Verify profile tabs are visible
    await expect(
      page.locator('[role="tab"]:has-text("Profile")')
    ).toBeVisible();
    await expect(
      page.locator('[role="tab"]:has-text("Preferences")')
    ).toBeVisible();
    await expect(
      page.locator('[role="tab"]:has-text("Account")')
    ).toBeVisible();

    // Step 4: Verify Profile tab content is loaded
    await expect(page.locator('input[placeholder*="phone"]')).toBeVisible({
      timeout: 10000,
    });
    await expect(page.locator('input[placeholder*="address"]')).toBeVisible();
    await expect(page.locator('textarea[placeholder*="bio"]')).toBeVisible();

    // Step 5: Edit profile information
    const phoneInput = page.locator('input[placeholder*="phone"]');
    const addressInput = page.locator('input[placeholder*="address"]');
    const bioInput = page.locator('textarea[placeholder*="bio"]');

    // Clear and fill new values
    await phoneInput.clear();
    await phoneInput.fill('555-123-4567');

    await addressInput.clear();
    await addressInput.fill('123 Updated Street, Test City');

    await bioInput.clear();
    await bioInput.fill('Updated bio for E2E testing');

    // Step 6: Save profile changes
    await page.click('button:has-text("Save changes")');

    // Wait for save to complete (button should be enabled again)
    await expect(page.locator('button:has-text("Save changes")')).toBeEnabled({
      timeout: 10000,
    });

    // Verify the values were saved (they should still be in the form)
    await expect(phoneInput).toHaveValue('555-123-4567');
    await expect(addressInput).toHaveValue('123 Updated Street, Test City');
    await expect(bioInput).toHaveValue('Updated bio for E2E testing');
  });

  test('should navigate between profile tabs and maintain state', async ({
    page,
  }) => {
    // Sign in first
    await page.goto('/signin');
    await page.fill('input[type="email"]', 'customer@example.com');
    await page.fill('input[type="password"]', 'password123');
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL(/.*payments/, { timeout: 10000 });

    // Navigate to Profile page
    await page.click('a[href="/profile"], nav a:has-text("Profile")');
    await expect(page).toHaveURL(/.*profile/, { timeout: 10000 });

    // Start on Profile tab (default)
    await expect(
      page.locator('[role="tab"][aria-selected="true"]:has-text("Profile")')
    ).toBeVisible();
    await expect(page.locator('input[placeholder*="phone"]')).toBeVisible();

    // Switch to Preferences tab
    await page.click('[role="tab"]:has-text("Preferences")');

    // Verify Preferences tab is active
    await expect(
      page.locator('[role="tab"][aria-selected="true"]:has-text("Preferences")')
    ).toBeVisible();

    // Verify Preferences content is loaded
    await expect(page.locator('label:has-text("Language")')).toBeVisible();
    await expect(page.locator('label:has-text("Timezone")')).toBeVisible();
    await expect(
      page.locator('label:has-text("Email notifications")')
    ).toBeVisible();

    // Switch to Account tab
    await page.click('[role="tab"]:has-text("Account")');

    // Verify Account tab is active
    await expect(
      page.locator('[role="tab"][aria-selected="true"]:has-text("Account")')
    ).toBeVisible();

    // Verify Account content is loaded (read-only information)
    await expect(page.locator('text=/account details/i')).toBeVisible();

    // Switch back to Profile tab
    await page.click('[role="tab"]:has-text("Profile")');

    // Verify Profile tab is active again
    await expect(
      page.locator('[role="tab"][aria-selected="true"]:has-text("Profile")')
    ).toBeVisible();
    await expect(page.locator('input[placeholder*="phone"]')).toBeVisible();
  });

  test('should edit preferences and save changes', async ({ page }) => {
    // Sign in first
    await page.goto('/signin');
    await page.fill('input[type="email"]', 'customer@example.com');
    await page.fill('input[type="password"]', 'password123');
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL(/.*payments/, { timeout: 10000 });

    // Navigate to Profile page
    await page.click('a[href="/profile"], nav a:has-text("Profile")');
    await expect(page).toHaveURL(/.*profile/, { timeout: 10000 });

    // Switch to Preferences tab
    await page.click('[role="tab"]:has-text("Preferences")');
    await expect(
      page.locator('[role="tab"][aria-selected="true"]:has-text("Preferences")')
    ).toBeVisible();

    // Edit preferences
    const languageSelect = page.locator(
      'label:has-text("Language") + select, select'
    );
    await languageSelect.selectOption('es'); // Select Spanish

    const timezoneSelect = page.locator(
      'label:has-text("Timezone") + select, select'
    );
    await timezoneSelect.selectOption('America/Los_Angeles');

    // Toggle notification settings
    const emailNotificationsCheckbox = page.locator(
      'label:has-text("Email notifications") input[type="checkbox"]'
    );
    if (await emailNotificationsCheckbox.isChecked()) {
      await emailNotificationsCheckbox.uncheck();
    } else {
      await emailNotificationsCheckbox.check();
    }

    const pushNotificationsCheckbox = page.locator(
      'label:has-text("Push notifications") input[type="checkbox"]'
    );
    if (await pushNotificationsCheckbox.isChecked()) {
      await pushNotificationsCheckbox.uncheck();
    } else {
      await pushNotificationsCheckbox.check();
    }

    // Save preferences changes
    await page.click('button:has-text("Save preferences")');

    // Wait for save to complete (button should be enabled again)
    await expect(
      page.locator('button:has-text("Save preferences")')
    ).toBeEnabled({ timeout: 10000 });

    // Verify the values were saved
    await expect(languageSelect).toHaveValue('es');
    await expect(timezoneSelect).toHaveValue('America/Los_Angeles');
  });

  test('should show loading state during form submission', async ({ page }) => {
    // Sign in first
    await page.goto('/signin');
    await page.fill('input[type="email"]', 'customer@example.com');
    await page.fill('input[type="password"]', 'password123');
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL(/.*payments/, { timeout: 10000 });

    // Navigate to Profile page
    await page.click('a[href="/profile"], nav a:has-text("Profile")');
    await expect(page).toHaveURL(/.*profile/, { timeout: 10000 });

    // Fill profile form
    const phoneInput = page.locator('input[placeholder*="phone"]');
    await phoneInput.clear();
    await phoneInput.fill('555-987-6543');

    // Click save button
    await page.click('button:has-text("Save changes")');

    // Verify loading state (button should show "Saving..." and be disabled)
    await expect(page.locator('button:has-text("Saving...")')).toBeVisible({
      timeout: 5000,
    });
    await expect(page.locator('button:has-text("Saving...")')).toBeDisabled();

    // Wait for save to complete
    await expect(page.locator('button:has-text("Save changes")')).toBeEnabled({
      timeout: 10000,
    });
  });

  test('should handle profile navigation from header', async ({ page }) => {
    // Sign in first
    await page.goto('/signin');
    await page.fill('input[type="email"]', 'customer@example.com');
    await page.fill('input[type="password"]', 'password123');
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL(/.*payments/, { timeout: 10000 });

    // Navigate to Profile using header navigation
    const profileLink = page.locator(
      'nav a[href="/profile"], header a[href="/profile"]'
    );
    await expect(profileLink).toBeVisible();
    await profileLink.click();

    // Verify Profile page loads
    await expect(page).toHaveURL(/.*profile/, { timeout: 10000 });
    await expect(page.locator('h1')).toContainText('Profile', {
      timeout: 10000,
    });
  });

  test('should protect profile routes for unauthenticated users', async ({
    page,
  }) => {
    // Try to access profile page without signing in
    await page.goto('/profile');

    // Should redirect to sign-in page
    await expect(page).toHaveURL(/.*signin/, { timeout: 10000 });

    // Verify we're on sign-in page
    await expect(page.locator('input[type="email"]')).toBeVisible({
      timeout: 10000,
    });
  });

  test('should display account information in read-only format', async ({
    page,
  }) => {
    // Sign in first
    await page.goto('/signin');
    await page.fill('input[type="email"]', 'customer@example.com');
    await page.fill('input[type="password"]', 'password123');
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL(/.*payments/, { timeout: 10000 });

    // Navigate to Profile page
    await page.click('a[href="/profile"], nav a:has-text("Profile")');
    await expect(page).toHaveURL(/.*profile/, { timeout: 10000 });

    // Switch to Account tab
    await page.click('[role="tab"]:has-text("Account")');
    await expect(
      page.locator('[role="tab"][aria-selected="true"]:has-text("Account")')
    ).toBeVisible();

    // Verify account information is displayed (read-only)
    await expect(page.locator('text=/account details/i')).toBeVisible();

    // Should not see editable fields in Account tab
    await expect(page.locator('input[placeholder*="phone"]')).not.toBeVisible();
    await expect(page.locator('button:has-text("Save")')).not.toBeVisible();
  });
});
