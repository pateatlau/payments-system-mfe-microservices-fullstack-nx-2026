import { test, expect, Page } from '@playwright/test';

const credentials = {
  customer: { email: 'customer@example.com', password: 'password123' },
  vendor: { email: 'vendor@example.com', password: 'password123' },
};

async function signIn(page: Page, role: keyof typeof credentials) {
  const { email, password } = credentials[role];
  await page.goto('/signin');
  await page.fill('input[type="email"]', email);
  await page.fill('input[type="password"]', password);
  await page.click('button[type="submit"]');
  await expect(page).toHaveURL(/.*payments/, { timeout: 12000 });
}

async function openCreateForm(page: Page) {
  const createButton = page.getByRole('button', { name: /create payment/i });
  if (await createButton.isVisible({ timeout: 4000 }).catch(() => false)) {
    await createButton.click();
  }
}

async function createPayment(
  page: Page,
  role: keyof typeof credentials,
  amount: string,
  description: string
) {
  await signIn(page, role);

  const createResponse = page.waitForResponse(
    response =>
      response.url().includes('/api/payments') &&
      response.request().method() === 'POST'
  );

  await openCreateForm(page);

  await page.fill('#amount', amount);
  await page.selectOption('#currency', 'USD');
  await page.selectOption('#type', 'INSTANT');
  await page.fill('#description', description);
  await page.fill('#recipientEmail', `recipient+${Date.now()}@example.com`);

  const submitButton = page
    .getByRole('button', { name: /create payment|create|submit/i })
    .first();
  await submitButton.click();

  const response = await createResponse;
  expect([200, 201]).toContain(response.status());
  return response;
}

test.describe('Payments - new feature e2e coverage', () => {
  test('customer can create a payment and see it listed', async ({ page }) => {
    await createPayment(page, 'customer', '123.45', 'E2E customer payment');

    await expect(page.locator('text=/E2E customer payment/i')).toBeVisible({
      timeout: 10000,
    });
  });

  test('customer can view payment details', async ({ page }) => {
    await createPayment(page, 'customer', '210.00', 'E2E details payment');

    const detailsButton = page
      .getByRole('button', { name: /view details/i })
      .first();
    await expect(detailsButton).toBeVisible({ timeout: 10000 });
    await detailsButton.click();

    await expect(page.locator('text=/payment details/i')).toBeVisible({
      timeout: 8000,
    });
    const closeButton = page
      .getByRole('button', { name: /close|dismiss|done/i })
      .first();
    if (await closeButton.isVisible().catch(() => false)) {
      await closeButton.click();
    }
  });

  test('vendor can update a payment status inline', async ({ page }) => {
    await createPayment(page, 'vendor', '305.50', 'E2E vendor update');

    const updateResponse = page.waitForResponse(
      response =>
        response.url().includes('/api/payments/') &&
        response.request().method() === 'PUT'
    );

    const editButton = page.getByRole('button', { name: /edit/i }).first();
    await expect(editButton).toBeVisible({ timeout: 10000 });
    await editButton.click();

    const statusSelect = page.locator('select').first();
    await expect(statusSelect).toBeVisible({ timeout: 5000 });
    await statusSelect.selectOption({ value: 'COMPLETED' });

    const saveButton = page.getByRole('button', { name: /save/i }).first();
    await saveButton.click();

    const response = await updateResponse;
    expect(response.status()).toBe(200);
    await expect(page.locator('text=/completed/i')).toBeVisible({
      timeout: 10000,
    });
  });

  test('vendor can filter payments by amount range and status', async ({
    page,
  }) => {
    await signIn(page, 'vendor');

    const filterResponse = page.waitForResponse(
      response =>
        response.url().includes('/api/payments') &&
        response.request().method() === 'GET' &&
        response.url().includes('minAmount=')
    );

    await page.fill('#min-amount-input', '200');
    await page.fill('#max-amount-input', '800');

    await filterResponse;

    const emptyState = page.locator('text=/No payments match filters/i');
    const anyPayment = page.locator('table tr').nth(1); // first data row

    const sawEmpty = await emptyState.isVisible().catch(() => false);
    const sawRow = await anyPayment.isVisible().catch(() => false);
    expect(sawEmpty || sawRow).toBeTruthy();
  });

  test('vendor can view payment reports tab', async ({ page }) => {
    await signIn(page, 'vendor');

    const reportsResponse = page.waitForResponse(
      response =>
        response.url().includes('/api/payments') &&
        response.url().includes('reports') &&
        response.request().method() === 'GET'
    );

    await page.getByRole('button', { name: /reports/i }).click();
    await reportsResponse;

    await expect(
      page.getByRole('heading', { name: /payment reports/i })
    ).toBeVisible({ timeout: 10000 });
    await expect(page.getByLabel('Total payments')).toBeVisible({
      timeout: 10000,
    });
  });
});
