import { test, expect } from '@playwright/test';
import { registerAndLogin, uniqueEmail } from './helpers/auth';

test.describe('Account settings', () => {
  const password = 'SecurePass123';

  test.beforeEach(async ({ page }) => {
    await registerAndLogin(page, { email: uniqueEmail('account-test'), password });
    await page.goto('/settings/security');
  });

  test('renders all account sections', async ({ page }) => {
    await expect(page.getByText('Password', { exact: true })).toBeVisible();

    // Email address now lives on Profile, split out of Security (JEF-204).
    await page.goto('/settings/profile');
    await expect(page.getByText('Email address')).toBeVisible();

    await page.goto('/settings/data');
    await expect(page.getByText('Export your data')).toBeVisible();

    // Danger zone is its own page, split out of Data (JEF-204).
    await page.goto('/settings/danger-zone');
    await expect(page.getByText('Danger zone')).toBeVisible();
  });

  test('updates email with correct password', async ({ page }) => {
    // Now a confirm-by-email flow (requestEmailChange), not an immediate
    // change — the only client-visible signal of success is the form
    // resetting (no success banner is shown).
    await page.goto('/settings/profile');
    const newEmail = uniqueEmail('new');
    const emailSection = page.locator('section').filter({ hasText: 'Email address' });
    const newEmailInput = emailSection.getByPlaceholder('you@example.com');

    await emailSection.getByPlaceholder('••••••••').fill(password);
    await newEmailInput.fill(newEmail);
    await emailSection.getByRole('button', { name: /update email/i }).click();

    await expect(newEmailInput).toHaveValue('');
  });

  test('shows error when updating email with wrong password', async ({ page }) => {
    await page.goto('/settings/profile');
    const emailSection = page.locator('section').filter({ hasText: 'Email address' });

    await emailSection.getByPlaceholder('••••••••').fill('wrongpassword');
    await emailSection.getByPlaceholder('you@example.com').fill(uniqueEmail('wrong'));
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

  test('shows an error and keeps the account when deleting with the wrong password', async ({
    page,
  }) => {
    await page.goto('/settings/danger-zone');
    const dangerSection = page.locator('section').filter({ hasText: 'Danger zone' });
    await dangerSection.getByPlaceholder('••••••••').fill('wrongpassword');
    await dangerSection.getByRole('button', { name: /delete my account/i }).click();

    await expect(dangerSection.locator('p.text-red-600')).toBeVisible();
    // Never left the page, and the account still works.
    await expect(page).toHaveURL(/danger-zone/);
    await page.reload();
    await expect(page).toHaveURL(/danger-zone/);
  });

  test('deletes account, clears session, and redirects to /login', async ({ page }) => {
    await page.goto('/settings/danger-zone');
    const dangerSection = page.locator('section').filter({ hasText: 'Danger zone' });
    await dangerSection.getByPlaceholder('••••••••').fill(password);
    await dangerSection.getByRole('button', { name: /delete my account/i }).click();

    await expect(page).toHaveURL(/login/);

    // Verify session is gone — trying to access dashboard redirects to login
    await page.goto('/dashboard');
    await expect(page).toHaveURL(/login/);
  });

  test('a deleted account can no longer log in with its old credentials', async ({ page }) => {
    const email = uniqueEmail('to-be-deleted');
    // Independent of the shared beforeEach's account — this test deletes its
    // own throwaway account and then proves it, rather than reusing one
    // another test in this file also tears down. /register redirects an
    // already-authenticated visitor away, so sign out of beforeEach's
    // account first.
    await page.getByRole('button', { name: /sign out/i }).click();
    await expect(page).toHaveURL(/login/);
    // Wait for /login to actually settle before navigating away again — an
    // immediate goto('/register') can race the logout redirect and abort.
    await expect(page.getByRole('heading', { name: 'Sign in' })).toBeVisible();
    await registerAndLogin(page, { email, password });

    await page.goto('/settings/danger-zone');
    const dangerSection = page.locator('section').filter({ hasText: 'Danger zone' });
    await dangerSection.getByPlaceholder('••••••••').fill(password);
    await dangerSection.getByRole('button', { name: /delete my account/i }).click();
    await expect(page).toHaveURL(/login/);

    await page.getByPlaceholder('you@example.com').fill(email);
    await page.getByPlaceholder('••••••••').fill(password);
    await page.getByRole('button', { name: /sign in/i }).click();

    await expect(page.locator('p.text-red-600')).toBeVisible();
    await expect(page).toHaveURL(/login/);
  });
});
