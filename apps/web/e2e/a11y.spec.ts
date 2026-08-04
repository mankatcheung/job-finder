import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

/**
 * Accessibility (axe-core) scans for key public pages.
 *
 * These tests run axe-core against rendered pages and assert zero
 * violations.  Violations that are impractical to fix (e.g. color-
 * contrast on brand-coloured elements) can be disabled per-scan via
 * AxeBuilder’s `disableRules()` or `exclude()`.
 */

/** Run an axe scan and assert zero violations. */
async function scan(page: import('@playwright/test').Page, label: string) {
  const results = await new AxeBuilder({ page }).analyze();
  expect(results.violations, `A11y violations on ${label}`).toEqual([]);
}

test.describe('Accessibility scans – public pages', () => {
  test('login page passes axe', async ({ page }) => {
    await page.goto('/login');
    await page.waitForLoadState('networkidle');
    await scan(page, '/login');
  });

  test('register page passes axe', async ({ page }) => {
    await page.goto('/register');
    await page.waitForLoadState('networkidle');
    await scan(page, '/register');
  });

  test('forgot-password page passes axe', async ({ page }) => {
    await page.goto('/forgot-password');
    await page.waitForLoadState('networkidle');
    await scan(page, '/forgot-password');
  });
});

test.describe('Accessibility scans – authenticated pages', () => {
  test.beforeEach(async ({ page }) => {
    // Register a fresh user so we have an authenticated session.
    const email = `a11y-${Date.now()}@e2e.example.com`;
    const password = 'SecurePass123';

    await page.goto('/register');
    await page.getByPlaceholder('you@example.com').fill(email);
    const [pw, confirm] = await page.getByPlaceholder('••••••••').all();
    await pw.fill(password);
    await confirm.fill(password);
    await page.getByRole('button', { name: /create account/i }).click();
    await expect(page).toHaveURL(/dashboard/);
    await page.waitForLoadState('networkidle');
  });

  test('dashboard page passes axe', async ({ page }) => {
    await scan(page, '/dashboard');
  });

  test('applications page passes axe', async ({ page }) => {
    await page.goto('/applications');
    await page.waitForLoadState('networkidle');
    await scan(page, '/applications');
  });
});
