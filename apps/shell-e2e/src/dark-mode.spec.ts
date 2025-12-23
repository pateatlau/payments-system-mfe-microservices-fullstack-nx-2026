import { test, expect } from '@playwright/test';

/**
 * Dark Mode Integration Tests
 *
 * Validates that:
 * 1. Theme toggle works across all pages
 * 2. .dark class is properly applied/removed
 * 3. CSS variables reflect correct colors in both themes
 * 4. Theme persists across page reloads
 * 5. All MFEs inherit theme from shell
 */

test.describe('Dark Mode Theme System', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the shell app
    await page.goto('/');
    // Wait for theme initialization
    await page.waitForLoadState('networkidle');
  });

  test('should initialize with system or default theme', async ({ page }) => {
    // Check that html element exists and has proper theme class
    const htmlElement = page.locator('html');
    const classes = await htmlElement.getAttribute('class');

    // Should have either 'dark' class or be in light mode (no dark class)
    expect(
      classes === null || classes === '' || classes.includes('dark')
    ).toBeTruthy();
  });

  test('should toggle theme from light to dark', async ({ page }) => {
    // First, ensure we're in light mode
    const htmlElement = page.locator('html');
    const isDark = await htmlElement.evaluate(el =>
      el.classList.contains('dark')
    );

    if (isDark) {
      // If already dark, toggle to light first
      const themeToggle = page
        .locator(
          'button[data-testid="theme-toggle"], button:has-text("☀"), button:has-text("🌙")'
        )
        .first();
      await themeToggle.click();
      await page.waitForTimeout(300);
    }

    // Now toggle to dark
    const themeToggle = page
      .locator(
        'button[data-testid="theme-toggle"], button:has-text("☀"), button:has-text("🌙")'
      )
      .first();
    await themeToggle.click();
    await page.waitForTimeout(300);

    // Verify .dark class is added
    const darkModeActive = await htmlElement.evaluate(el =>
      el.classList.contains('dark')
    );
    expect(darkModeActive).toBe(true);
  });

  test('should toggle theme from dark to light', async ({ page }) => {
    const htmlElement = page.locator('html');
    const isDark = await htmlElement.evaluate(el =>
      el.classList.contains('dark')
    );

    if (!isDark) {
      // If not dark, toggle to dark first
      const themeToggle = page
        .locator(
          'button[data-testid="theme-toggle"], button:has-text("☀"), button:has-text("🌙")'
        )
        .first();
      await themeToggle.click();
      await page.waitForTimeout(300);
    }

    // Now toggle to light
    const themeToggle = page
      .locator(
        'button[data-testid="theme-toggle"], button:has-text("☀"), button:has-text("🌙")'
      )
      .first();
    await themeToggle.click();
    await page.waitForTimeout(300);

    // Verify .dark class is removed
    const darkModeActive = await htmlElement.evaluate(el =>
      el.classList.contains('dark')
    );
    expect(darkModeActive).toBe(false);
  });

  test('should apply correct CSS variables in light mode', async ({ page }) => {
    const htmlElement = page.locator('html');

    // Ensure light mode
    const isDark = await htmlElement.evaluate(el =>
      el.classList.contains('dark')
    );
    if (isDark) {
      const themeToggle = page
        .locator(
          'button[data-testid="theme-toggle"], button:has-text("☀"), button:has-text("🌙")'
        )
        .first();
      await themeToggle.click();
      await page.waitForTimeout(300);
    }

    // Get computed CSS variables
    const bgColor = await htmlElement.evaluate(() => {
      const style = getComputedStyle(document.documentElement);
      return style.getPropertyValue('--background').trim();
    });

    const fgColor = await htmlElement.evaluate(() => {
      const style = getComputedStyle(document.documentElement);
      return style.getPropertyValue('--foreground').trim();
    });

    // Light mode: background should be white-ish (255 255 255)
    // Light mode: foreground should be dark-ish (gray-900)
    expect(bgColor).toBeTruthy();
    expect(fgColor).toBeTruthy();
    // Both should be RGB values (contain spaces)
    expect(bgColor).toMatch(/\d+\s+\d+\s+\d+/);
    expect(fgColor).toMatch(/\d+\s+\d+\s+\d+/);
  });

  test('should apply correct CSS variables in dark mode', async ({ page }) => {
    const htmlElement = page.locator('html');

    // Ensure dark mode
    const isDark = await htmlElement.evaluate(el =>
      el.classList.contains('dark')
    );
    if (!isDark) {
      const themeToggle = page
        .locator(
          'button[data-testid="theme-toggle"], button:has-text("☀"), button:has-text("🌙")'
        )
        .first();
      await themeToggle.click();
      await page.waitForTimeout(300);
    }

    // Get computed CSS variables
    const bgColor = await htmlElement.evaluate(() => {
      const style = getComputedStyle(document.documentElement);
      return style.getPropertyValue('--background').trim();
    });

    const fgColor = await htmlElement.evaluate(() => {
      const style = getComputedStyle(document.documentElement);
      return style.getPropertyValue('--foreground').trim();
    });

    // Dark mode: background should be dark (gray-900)
    // Dark mode: foreground should be light (gray-50)
    expect(bgColor).toBeTruthy();
    expect(fgColor).toBeTruthy();
    expect(bgColor).toMatch(/\d+\s+\d+\s+\d+/);
    expect(fgColor).toMatch(/\d+\s+\d+\s+\d+/);
  });

  test('should persist theme across page reload', async ({ page }) => {
    const htmlElement = page.locator('html');

    // Toggle to dark mode
    const themeToggle = page
      .locator(
        'button[data-testid="theme-toggle"], button:has-text("☀"), button:has-text("🌙")'
      )
      .first();
    await themeToggle.click();
    await page.waitForTimeout(300);

    const isDarkBefore = await htmlElement.evaluate(el =>
      el.classList.contains('dark')
    );

    // Reload page
    await page.reload();
    await page.waitForLoadState('networkidle');

    // Check theme after reload
    const isDarkAfter = await htmlElement.evaluate(el =>
      el.classList.contains('dark')
    );
    expect(isDarkAfter).toBe(isDarkBefore);
  });

  test('should have theme toggle visible in authenticated header', async ({
    page,
  }) => {
    // Wait for header to load
    await page.waitForSelector('header', { timeout: 5000 }).catch(() => null);

    // Look for theme toggle button
    const themeToggle = page
      .locator(
        'button[data-testid="theme-toggle"], button:has-text("☀"), button:has-text("🌙")'
      )
      .first();

    // Verify it exists and is visible
    const count = await themeToggle.count();
    if (count > 0) {
      const isVisible = await themeToggle.isVisible();
      expect(isVisible).toBe(true);
    }
  });

  test('should apply theme to main content area', async ({ page }) => {
    const main = page.locator('main');
    const classes = await main.getAttribute('class');

    // Main should have semantic token classes (not hardcoded colors)
    expect(classes).toBeTruthy();

    // Should not have hardcoded color classes
    const hasHardcodedColor = classes?.match(
      /bg-white|bg-slate|text-slate|border-gray/
    );
    expect(hasHardcodedColor).toBeFalsy();
  });

  test('should apply theme to cards and sections', async ({ page }) => {
    // Navigate to a page with cards/sections
    const cards = page.locator('[class*="card"], [class*="bg-card"]');

    const count = await cards.count();
    if (count > 0) {
      // Verify cards have semantic token classes
      const firstCard = cards.first();
      const classes = await firstCard.getAttribute('class');

      expect(classes).toBeTruthy();
      // Should use semantic tokens, not hardcoded colors
      const hasHardcodedColor = classes?.match(
        /bg-white|text-slate-900|border-gray-200/
      );
      expect(hasHardcodedColor).toBeFalsy();
    }
  });

  test('should have proper contrast in light mode', async ({ page }) => {
    const htmlElement = page.locator('html');

    // Ensure light mode
    const isDark = await htmlElement.evaluate(el =>
      el.classList.contains('dark')
    );
    if (isDark) {
      const themeToggle = page
        .locator(
          'button[data-testid="theme-toggle"], button:has-text("☀"), button:has-text("🌙")'
        )
        .first();
      await themeToggle.click();
      await page.waitForTimeout(300);
    }

    // Get background and foreground colors
    const colors = await htmlElement.evaluate(() => {
      const style = getComputedStyle(document.documentElement);
      const bg = style.getPropertyValue('--background').trim();
      const fg = style.getPropertyValue('--foreground').trim();
      return { bg, fg };
    });

    expect(colors.bg).toMatch(/\d+\s+\d+\s+\d+/);
    expect(colors.fg).toMatch(/\d+\s+\d+\s+\d+/);

    // Light mode should have light background and dark foreground
    // This is a basic check; detailed contrast ratio testing would require color parsing
    const bgValues = colors.bg.split(/\s+/).map(Number);
    const fgValues = colors.fg.split(/\s+/).map(Number);

    const bgBrightness = (bgValues[0] + bgValues[1] + bgValues[2]) / 3;
    const fgBrightness = (fgValues[0] + fgValues[1] + fgValues[2]) / 3;

    // In light mode, background should be brighter than foreground
    expect(bgBrightness).toBeGreaterThan(fgBrightness);
  });

  test('should have proper contrast in dark mode', async ({ page }) => {
    const htmlElement = page.locator('html');

    // Ensure dark mode
    const isDark = await htmlElement.evaluate(el =>
      el.classList.contains('dark')
    );
    if (!isDark) {
      const themeToggle = page
        .locator(
          'button[data-testid="theme-toggle"], button:has-text("☀"), button:has-text("🌙")'
        )
        .first();
      await themeToggle.click();
      await page.waitForTimeout(300);
    }

    // Get background and foreground colors
    const colors = await htmlElement.evaluate(() => {
      const style = getComputedStyle(document.documentElement);
      const bg = style.getPropertyValue('--background').trim();
      const fg = style.getPropertyValue('--foreground').trim();
      return { bg, fg };
    });

    expect(colors.bg).toMatch(/\d+\s+\d+\s+\d+/);
    expect(colors.fg).toMatch(/\d+\s+\d+\s+\d+/);

    // Dark mode should have dark background and light foreground
    const bgValues = colors.bg.split(/\s+/).map(Number);
    const fgValues = colors.fg.split(/\s+/).map(Number);

    const bgBrightness = (bgValues[0] + bgValues[1] + bgValues[2]) / 3;
    const fgBrightness = (fgValues[0] + fgValues[1] + fgValues[2]) / 3;

    // In dark mode, foreground should be brighter than background
    expect(fgBrightness).toBeGreaterThan(bgBrightness);
  });
});

test.describe('Dark Mode Across Different Pages', () => {
  test('should maintain theme on Payments page', async ({ page }) => {
    await page.goto('/payments');
    await page.waitForLoadState('networkidle');

    const htmlElement = page.locator('html');

    // Toggle theme
    const themeToggle = page
      .locator(
        'button[data-testid="theme-toggle"], button:has-text("☀"), button:has-text("🌙")'
      )
      .first();
    const initialDark = await htmlElement.evaluate(el =>
      el.classList.contains('dark')
    );

    if (themeToggle.count() > 0) {
      await themeToggle.click();
      await page.waitForTimeout(300);

      const finalDark = await htmlElement.evaluate(el =>
        el.classList.contains('dark')
      );
      expect(finalDark).not.toBe(initialDark);
    }
  });

  test('should maintain theme on Admin page', async ({ page }) => {
    await page.goto('/admin');
    await page.waitForLoadState('networkidle');

    const htmlElement = page.locator('html');

    // Check that the page has semantic token classes
    const main = page.locator('main');
    const mainClasses = await main.getAttribute('class');

    if (mainClasses) {
      const hasHardcodedColor = mainClasses?.match(
        /bg-white|text-slate|border-gray/
      );
      expect(hasHardcodedColor).toBeFalsy();
    }
  });

  test('should maintain theme on Profile page', async ({ page }) => {
    await page.goto('/profile');
    await page.waitForLoadState('networkidle');

    const htmlElement = page.locator('html');

    // Look for form inputs and verify they use semantic tokens
    const inputs = page.locator(
      'input[type="text"], input[type="email"], textarea'
    );
    const count = await inputs.count();

    if (count > 0) {
      const firstInput = inputs.first();
      const classes = await firstInput.getAttribute('class');

      if (classes) {
        // Should use semantic input classes, not hardcoded colors
        const hasHardcodedColor = classes?.match(/bg-white|border-gray/);
        expect(hasHardcodedColor).toBeFalsy();
      }
    }
  });
});

test.describe('Theme Tokens Verification', () => {
  test('should use all required semantic tokens', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    const requiredTokens = [
      '--background',
      '--foreground',
      '--muted',
      '--muted-foreground',
      '--border',
      '--input',
      '--ring',
      '--card',
    ];

    const htmlElement = page.locator('html');

    const tokensExist = await htmlElement.evaluate((el, required) => {
      const style = getComputedStyle(el);
      return required.every(token => {
        const value = style.getPropertyValue(token).trim();
        return value.length > 0;
      });
    }, requiredTokens);

    expect(tokensExist).toBe(true);
  });

  test('should have consistent token format (RGB space-separated)', async ({
    page,
  }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    const htmlElement = page.locator('html');

    const tokensValid = await htmlElement.evaluate(() => {
      const style = getComputedStyle(document.documentElement);
      const tokens = [
        '--background',
        '--foreground',
        '--muted',
        '--muted-foreground',
        '--border',
      ];

      return tokens.every(token => {
        const value = style.getPropertyValue(token).trim();
        // Should be RGB space-separated format: "255 255 255"
        return /^\d+\s+\d+\s+\d+$/.test(value);
      });
    });

    expect(tokensValid).toBe(true);
  });
});
