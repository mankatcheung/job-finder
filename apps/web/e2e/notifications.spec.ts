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

    // Back on the first session: open the inbox and find the alert.
    // (Interacting with the panel's "Mark read" action is skipped here —
    // JEF-125 tracks a real pointer-events/stacking bug where clicks on it
    // land on the sidebar nav underneath instead.)
    await page.getByRole('button', { name: /notifications/i }).click();
    await expect(page.getByText('New sign-in detected')).toBeVisible();
    await expect(page.getByText('Unknown device signed in')).toBeVisible();
    await expect(page.getByRole('checkbox', { name: 'Select New sign-in detected' })).toBeVisible();
  });

  test('shows "You\'re all caught up." when there are no notifications', async ({ page }) => {
    await registerAndLogin(page, { email: uniqueEmail('notif-empty'), password: 'SecurePass123' });

    await page.getByRole('button', { name: /notifications/i }).click();
    await expect(page.getByText("You're all caught up.")).toBeVisible();
  });
});
