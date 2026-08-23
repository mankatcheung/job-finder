import { test, expect } from '@playwright/test';
import { registerAndLogin, uniqueEmail } from './helpers/auth';

test.describe('Notifications', () => {
  test('shows a real "New sign-in detected" alert triggered by a second device', async ({
    browser,
    page,
  }) => {
    const email = uniqueEmail('notif');
    const password = 'SecurePass123';

    // First session (registration) never alerts — detectNewDeviceAndAlert
    // skips a user's very first session. A genuinely different userAgent on
    // a second login is what triggers the "New sign-in detected" notification.
    await registerAndLogin(page, { email, password });

    const secondDeviceContext = await browser.newContext({
      userAgent: 'Mozilla/5.0 (E2E second device; secondary-browser/1.0)',
    });
    const secondPage = await secondDeviceContext.newPage();
    await secondPage.goto('/login');
    await secondPage.getByPlaceholder('you@example.com').fill(email);
    await secondPage.getByPlaceholder('••••••••').fill(password);
    await secondPage.getByRole('button', { name: /sign in/i }).click();
    await expect(secondPage).toHaveURL(/dashboard/);
    await secondDeviceContext.close();

    // Back on the first session: open the popover and find the alert (JEF-218
    // — the bell now opens a compact popover, not the full inbox; bulk
    // actions live on the /notifications page it links to).
    await page.getByRole('button', { name: /notifications/i }).click();
    await expect(page.getByText('New sign-in detected')).toBeVisible();
    await expect(page.getByText('Unknown device signed in')).toBeVisible();
    await expect(page.getByRole('checkbox')).toHaveCount(0);

    await page.getByRole('link', { name: 'View all notifications' }).click();
    await expect(page).toHaveURL(/notifications$/);
    // Generous timeout: this is the first time this test's fresh browser
    // context requests the /notifications route chunk, and under a heavily
    // loaded local dev server that on-demand Vite compile can outrun a
    // default-length assertion — a production build (what CI actually runs
    // against) has no such compile step.
    await expect(page.getByRole('heading', { name: 'Notifications' })).toBeVisible({
      timeout: 15_000,
    });

    // Mark it read via the bulk-action bar and confirm the page stays put
    // and doesn't navigate away (JEF-125).
    const checkbox = page.getByRole('checkbox', { name: 'Select New sign-in detected' });
    await expect(checkbox).toBeVisible();
    await checkbox.check();
    await page.getByRole('button', { name: 'Mark read' }).click();
    await expect(page).not.toHaveURL(/applications/);
    await expect(page.getByRole('heading', { name: 'Notifications' })).toBeVisible();
    await expect(checkbox).not.toBeChecked();
  });

  test('shows "You\'re all caught up." when there are no notifications', async ({ page }) => {
    await registerAndLogin(page, { email: uniqueEmail('notif-empty'), password: 'SecurePass123' });

    await page.getByRole('button', { name: /notifications/i }).click();
    await expect(page.getByText("You're all caught up.")).toBeVisible();
  });
});
