import { test, expect, Page } from '@playwright/test';

const credentials = {
  vendor: { email: 'vendor@example.com', password: 'password123' },
  customer: { email: 'customer@example.com', password: 'password123' },
};

async function signIn(page: Page, role: keyof typeof credentials) {
  const { email, password } = credentials[role];
  await page.goto('/signin');
  await page.fill('input[type="email"]', email);
  await page.fill('input[type="password"]', password);
  await page.click('button[type="submit"]');
  await expect(page).toHaveURL(/.*payments/, { timeout: 12000 });
}

async function measureNavigationLoad(page: Page): Promise<number> {
  const entries = await page.evaluate(() => {
    const nav = performance.getEntriesByType('navigation');
    if (nav && nav.length > 0) {
      const n = nav[0] as PerformanceNavigationTiming;
      return n.responseEnd - n.startTime;
    }
    return performance.now();
  });
  return typeof entries === 'number' ? entries : Number(entries);
}

test.describe('Payments perf checks', () => {
  test('payments page load <= 2s', async ({ page }) => {
    await signIn(page, 'vendor');
    const loadMs = await measureNavigationLoad(page);
    expect(loadMs).toBeLessThanOrEqual(2000);
  });

  test('reports tab fetch <= 2s', async ({ page }) => {
    await signIn(page, 'vendor');
    const start = Date.now();
    const reportsResponse = page.waitForResponse(
      resp =>
        resp.url().includes('/api/payments') &&
        resp.url().includes('reports') &&
        resp.request().method() === 'GET'
    );
    await page.getByRole('button', { name: /reports/i }).click();
    await reportsResponse;
    const elapsed = Date.now() - start;
    expect(elapsed).toBeLessThanOrEqual(2000);
  });

  test('filter interaction <= 1s', async ({ page }) => {
    await signIn(page, 'vendor');
    const filterResponse = page.waitForResponse(
      resp =>
        resp.url().includes('/api/payments') &&
        resp.request().method() === 'GET' &&
        (resp.url().includes('minAmount=') || resp.url().includes('maxAmount='))
    );
    const start = Date.now();
    await page.fill('#min-amount-input', '200');
    await page.fill('#max-amount-input', '800');
    await filterResponse;
    const elapsed = Date.now() - start;
    expect(elapsed).toBeLessThanOrEqual(1000);
  });

  test('update submission <= 1.2s', async ({ page }) => {
    await signIn(page, 'vendor');

    // Create a payment first (reuse create flow from UI)
    const createResponse = page.waitForResponse(
      resp =>
        resp.url().includes('/api/payments') &&
        resp.request().method() === 'POST'
    );
    const createButton = page.getByRole('button', { name: /create payment/i });
    if (await createButton.isVisible({ timeout: 5000 }).catch(() => false)) {
      await createButton.click();
      await page.fill('#amount', '250');
      await page.selectOption('#currency', 'USD').catch(() => {});
      await page.selectOption('#type', 'INSTANT').catch(() => {});
      await page.fill('#description', 'Perf update target');
      await page.fill(
        '#recipientEmail',
        `perf-update+${Date.now()}@example.com`
      );
      const submitBtn = page
        .getByRole('button', { name: /create payment|create|submit/i })
        .first();
      await submitBtn.click();
      await createResponse;
      await page.waitForTimeout(500); // allow list to refresh
    }

    const updateResponse = page.waitForResponse(
      resp =>
        resp.url().includes('/api/payments/') &&
        resp.request().method() === 'PUT'
    );

    const editButton = page.getByRole('button', { name: /edit/i }).first();
    await expect(editButton).toBeVisible({ timeout: 10000 });
    await editButton.click();
    const statusSelect = page.locator('select').first();
    await expect(statusSelect).toBeVisible({ timeout: 5000 });
    await statusSelect.selectOption({ value: 'COMPLETED' }).catch(() => {});

    const start = Date.now();
    const saveButton = page.getByRole('button', { name: /save/i }).first();
    await saveButton.click();
    await updateResponse;
    const elapsed = Date.now() - start;
    expect(elapsed).toBeLessThanOrEqual(1200);
  });
});
