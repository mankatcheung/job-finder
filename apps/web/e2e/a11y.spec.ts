import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { registerAndLogin, uniqueEmail } from './helpers/auth';

/**
 * Accessibility (axe-core) scans for key public pages.
 *
 * These tests run axe-core against rendered pages and assert zero
 * violations.  Violations that are impractical to fix (e.g. color-
 * contrast on brand-coloured elements) can be disabled per-scan via
 * AxeBuilder’s `disableRules()` or `exclude()`.
 *
 * Deliberately not using `waitForLoadState('networkidle')` — something on
 * these pages (likely TanStack Devtools or the Vite HMR client) keeps a
 * connection open indefinitely, so networkidle never resolves. Waiting for
 * a concrete piece of rendered UI is both faster and more reliable.
 */

/** Run an axe scan and assert zero violations. */
async function scan(page: import('@playwright/test').Page, label: string) {
  const results = await new AxeBuilder({ page }).analyze();
  expect(results.violations, `A11y violations on ${label}`).toEqual([]);
}

test.describe('Accessibility scans – public pages', () => {
  test('login page passes axe', async ({ page }) => {
    await page.goto('/login');
    await expect(page.getByRole('heading', { name: 'Sign in' })).toBeVisible();
    await scan(page, '/login');
  });

  test('register page passes axe', async ({ page }) => {
    await page.goto('/register');
    await expect(page.getByRole('heading', { name: 'Create account' })).toBeVisible();
    await scan(page, '/register');
  });

  test('forgot-password page passes axe', async ({ page }) => {
    await page.goto('/forgot-password');
    await expect(page.getByRole('heading', { name: /forgot your password/i })).toBeVisible();
    await scan(page, '/forgot-password');
  });
});

test.describe('Accessibility scans – authenticated pages', () => {
  test.beforeEach(async ({ page }) => {
    await registerAndLogin(page, { email: uniqueEmail('a11y'), password: 'SecurePass123' });
  });

  test('dashboard page passes axe', async ({ page }) => {
    await scan(page, '/dashboard');
  });

  test('applications page passes axe', async ({ page }) => {
    await page.goto('/applications');
    await expect(page.getByRole('heading', { name: 'Applications' })).toBeVisible();
    await scan(page, '/applications');
  });
});
