import { test, expect } from '@playwright/test';
import { registerAndLogin, uniqueEmail } from './helpers/auth';

test.describe('Authentication flows', () => {
  test('register, login, and logout', async ({ page }) => {
    const email = uniqueEmail('test');
    const password = 'SecurePass123';

    await registerAndLogin(page, { email, password });

    // Logout
    await page.getByRole('button', { name: /sign out/i }).click();
    await expect(page).toHaveURL(/login/);

    // Login again
    await page.getByPlaceholder('you@example.com').fill(email);
    await page.getByPlaceholder('••••••••').fill(password);
    await page.getByRole('button', { name: /sign in/i }).click();

    await expect(page).toHaveURL(/dashboard/);
  });

  test('shows error for invalid login credentials', async ({ page }) => {
    await page.goto('/login');
    await page.getByPlaceholder('you@example.com').fill('nobody@example.com');
    await page.getByPlaceholder('••••••••').fill('wrongpassword');
    await page.getByRole('button', { name: /sign in/i }).click();

    await expect(page.locator('p.text-red-600')).toBeVisible();
    await expect(page).toHaveURL(/login/);
  });

  test('shows error when register passwords do not match', async ({ page }) => {
    await page.goto('/register');
    await page.getByPlaceholder('you@example.com').fill(uniqueEmail('mismatch'));
    const [passwordInput, confirmInput] = await page.getByPlaceholder('••••••••').all();
    await passwordInput.fill('password123');
    await confirmInput.fill('different456');
    await page.getByRole('button', { name: /create account/i }).click();

    await expect(page.getByText('Passwords do not match')).toBeVisible();
  });

  test('authenticated users are redirected away from /login', async ({ page }) => {
    await registerAndLogin(page, { email: uniqueEmail('redirect'), password: 'SecurePass123' });

    // Try to visit login
    await page.goto('/login');
    await expect(page).toHaveURL(/dashboard/);
  });

  test('unauthenticated users are redirected to /login from protected routes', async ({ page }) => {
    await page.goto('/dashboard');
    await expect(page).toHaveURL(/login/);
  });
});
