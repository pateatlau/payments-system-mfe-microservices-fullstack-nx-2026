import { test, expect } from '@playwright/test';

test('has title', async ({ page }) => {
  await page.goto('/');

  // Expect page title to be "Shell"
  await expect(page).toHaveTitle(/Shell/);
});

test('renders shell app content', async ({ page }) => {
  await page.goto('/');

  // Wait for content to load and expect h2 to contain "Welcome to the Shell Application"
  await expect(page.locator('h2')).toContainText(
    'Welcome to the Shell Application',
    {
      timeout: 10000,
    }
  );
});

test('renders navigation links', async ({ page }) => {
  await page.goto('/');

  // Wait for navigation to load and expect navigation links to be visible
  // Using getByText since the links might be in a navigation container
  const homeLink = page.getByText('Home');
  const page2Link = page.getByText('Page 2');

  await expect(homeLink).toBeVisible({ timeout: 10000 });
  await expect(page2Link).toBeVisible({ timeout: 10000 });

  // Verify they are actually links
  await expect(homeLink).toHaveAttribute('href', '/');
  await expect(page2Link).toHaveAttribute('href', '/page-2');
});
