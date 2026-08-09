import { test, expect } from '@playwright/test';
import { registerAndLogin, uniqueEmail } from './helpers/auth';
import { createApplication } from './helpers/applications';

test.describe('Share links', () => {
  test('creates a share link and an anonymous browser can view the summary', async ({
    browser,
    page,
  }) => {
    await registerAndLogin(page, { email: uniqueEmail('share'), password: 'SecurePass123' });
    await createApplication(page, { company: 'Acme Corp', role: 'Staff Engineer' });

    await page.goto('/settings/integrations');
    await page.getByPlaceholder('e.g. For my mentor').fill('For my mentor');
    await page.getByRole('button', { name: /create link/i }).click();

    const shareLinksSection = page.locator('section').filter({ hasText: 'Share links' });
    await expect(shareLinksSection.getByText(/share link created successfully/i)).toBeVisible();
    const shareUrl = await shareLinksSection.locator('code').textContent();
    expect(shareUrl).toContain('/share?token=');

    // A brand new, unauthenticated browser context — the "anonymous viewer".
    const anonymousContext = await browser.newContext();
    const anonymousPage = await anonymousContext.newPage();
    await anonymousPage.goto(shareUrl!);

    await expect(anonymousPage.getByRole('heading', { name: 'Job search summary' })).toBeVisible();
    await expect(
      anonymousPage
        .getByText('Applications', { exact: true })
        .locator('xpath=preceding-sibling::p'),
    ).toHaveText('1');

    await anonymousContext.close();
  });

  test('revoking a share link makes it invalid for anonymous viewers', async ({
    browser,
    page,
  }) => {
    await registerAndLogin(page, { email: uniqueEmail('share-revoke'), password: 'SecurePass123' });

    await page.goto('/settings/integrations');
    await page.getByPlaceholder('e.g. For my mentor').fill('Temporary link');
    await page.getByRole('button', { name: /create link/i }).click();
    const shareLinksSection = page.locator('section').filter({ hasText: 'Share links' });
    const shareUrl = await shareLinksSection.locator('code').textContent();

    await page.getByRole('button', { name: /done/i }).click();
    await page.getByRole('button', { name: /revoke share link/i }).click();
    await expect(page.getByText('Temporary link')).not.toBeVisible();

    const anonymousContext = await browser.newContext();
    const anonymousPage = await anonymousContext.newPage();
    await anonymousPage.goto(shareUrl!);

    await expect(anonymousPage.getByText(/invalid or has been revoked/i)).toBeVisible();
    await anonymousContext.close();
  });

  test('shows an error for a share URL with no token', async ({ page }) => {
    await page.goto('/share');
    await expect(page.getByText(/missing a token/i)).toBeVisible();
  });
});
