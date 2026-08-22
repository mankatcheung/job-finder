import { test, expect } from '@playwright/test';

test.describe('Cookie consent', () => {
  test.describe('outside a consent-required region', () => {
    // No x-vercel-ip-country / Accept-Language override — the default
    // Chromium locale/headers don't match anything in the EU/EEA/UK/CH list.
    test('does not show the banner, but "Cookie preferences" in the footer still works', async ({
      page,
    }) => {
      await page.goto('/');

      await expect(page.getByRole('button', { name: /accept all/i })).not.toBeVisible();

      await page.getByRole('button', { name: 'Cookie preferences' }).click();
      await expect(page.getByRole('heading', { name: 'Cookie preferences' })).toBeVisible();
      // Analytics defaults on outside a consent-required region.
      await expect(page.getByRole('checkbox', { name: /^analytics$/i })).toBeChecked();

      await page.getByRole('checkbox', { name: /^analytics$/i }).uncheck();
      await page.getByRole('button', { name: /save preferences/i }).click();
      await expect(page.getByRole('heading', { name: 'Cookie preferences' })).not.toBeVisible();
    });
  });

  test.describe('inside a consent-required region', () => {
    test.use({ extraHTTPHeaders: { 'x-vercel-ip-country': 'DE' } });

    test('shows the banner on first visit and "Accept all" dismisses it', async ({ page }) => {
      await page.goto('/');

      await expect(page.getByText(/necessary cookies to keep you signed in/i)).toBeVisible();
      await page.getByRole('button', { name: /accept all/i }).click();
      await expect(page.getByText(/necessary cookies to keep you signed in/i)).not.toBeVisible();

      // A returning visit respects the stored choice — no re-prompt.
      await page.reload();
      await expect(page.getByText(/necessary cookies to keep you signed in/i)).not.toBeVisible();
    });

    test('"Manage preferences" lets a visitor choose per-category before dismissing', async ({
      page,
    }) => {
      await page.goto('/');

      await page.getByRole('button', { name: /manage preferences/i }).click();
      const necessaryToggle = page.getByRole('checkbox', { name: /^necessary$/i });
      await expect(necessaryToggle).toBeChecked();
      await expect(necessaryToggle).toBeDisabled();

      const analyticsToggle = page.getByRole('checkbox', { name: /^analytics$/i });
      await expect(analyticsToggle).not.toBeChecked();
      await analyticsToggle.check();
      await page.getByRole('button', { name: /save preferences/i }).click();

      await expect(page.getByText(/necessary cookies to keep you signed in/i)).not.toBeVisible();
    });

    test('"Reject non-essential" dismisses the banner without opting into analytics', async ({
      page,
    }) => {
      await page.goto('/');

      await page.getByRole('button', { name: /reject non-essential/i }).click();
      await expect(page.getByText(/necessary cookies to keep you signed in/i)).not.toBeVisible();

      // Reopening via the footer link shows the rejected choice, not a reset.
      await page.getByRole('button', { name: 'Cookie preferences' }).click();
      await expect(page.getByRole('checkbox', { name: /^analytics$/i })).not.toBeChecked();
    });
  });
});
