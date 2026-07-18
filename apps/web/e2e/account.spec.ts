import { test, expect } from '@playwright/test';

const uniqueEmail = () => `account-test-${Date.now()}@e2e.example.com`;

test.describe('Account settings', () => {
  const password = 'SecurePass123';
  let email: string;

  test.beforeEach(async ({ page }) => {
    email = uniqueEmail();
    await page.goto('/register');
    await page.getByPlaceholder('you@example.com').fill(email);
    const [pw, confirm] = await page.getByPlaceholder('••••••••').all();
    await pw.fill(password);
    await confirm.fill(password);
    await page.getByRole('button', { name: /create account/i }).click();
    await expect(page).toHaveURL(/dashboard/);
    await page.goto('/account');
  });

  test('renders all account sections', async ({ page }) => {
    await expect(page.getByText('Account settings')).toBeVisible();
    await expect(page.getByText('Email address')).toBeVisible();
    await expect(page.getByText('Password')).toBeVisible();
    await expect(page.getByText('Export your data')).toBeVisible();
    await expect(page.getByText('Danger zone')).toBeVisible();
  });

  test('updates email with correct password', async ({ page }) => {
    const newEmail = uniqueEmail();
    const emailSection = page.locator('section').filter({ hasText: 'Email address' });

    await emailSection.getByPlaceholder('••••••••').fill(password);
    await emailSection.getByPlaceholder('you@example.com').fill(newEmail);
    await emailSection.getByRole('button', { name: /update email/i }).click();

    await expect(emailSection.getByText('Email updated successfully.')).toBeVisible();
  });

  test('shows error when updating email with wrong password', async ({ page }) => {
    const emailSection = page.locator('section').filter({ hasText: 'Email address' });

    await emailSection.getByPlaceholder('••••••••').fill('wrongpassword');
    await emailSection.getByPlaceholder('you@example.com').fill(uniqueEmail());
    await emailSection.getByRole('button', { name: /update email/i }).click();

    await expect(emailSection.locator('p.text-red-600')).toBeVisible();
  });

  test('updates password with correct current password', async ({ page }) => {
    const newPassword = 'NewSecurePass456';
    const passwordSection = page.locator('section').filter({ hasText: /^Password/ });
    const inputs = passwordSection.locator('input[type="password"]');

    await inputs.nth(0).fill(password);
    await inputs.nth(1).fill(newPassword);
    await inputs.nth(2).fill(newPassword);
    await passwordSection.getByRole('button', { name: /update password/i }).click();

    await expect(passwordSection.getByText('Password updated successfully.')).toBeVisible();
  });

  test('shows error when new passwords do not match', async ({ page }) => {
    const passwordSection = page.locator('section').filter({ hasText: /^Password/ });
    const inputs = passwordSection.locator('input[type="password"]');

    await inputs.nth(0).fill(password);
    await inputs.nth(1).fill('newPass1234');
    await inputs.nth(2).fill('differentPass');
    await passwordSection.getByRole('button', { name: /update password/i }).click();

    await expect(passwordSection.getByText('Passwords do not match')).toBeVisible();
  });

  test('deletes account, clears session, and redirects to /login', async ({ page }) => {
    const dangerSection = page.locator('section').filter({ hasText: 'Danger zone' });
    await dangerSection.getByPlaceholder('••••••••').fill(password);
    await dangerSection.getByRole('button', { name: /delete my account/i }).click();

    await expect(page).toHaveURL(/login/);

    // Verify session is gone — trying to access dashboard redirects to login
    await page.goto('/dashboard');
    await expect(page).toHaveURL(/login/);
  });
});
