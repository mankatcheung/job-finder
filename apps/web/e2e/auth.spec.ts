import { test, expect } from '@playwright/test';

const uniqueEmail = () => `test-${Date.now()}@e2e.example.com`;

test.describe('Authentication flows', () => {
  test('register, login, and logout', async ({ page }) => {
    const email = uniqueEmail();
    const password = 'SecurePass123';

    // Register
    await page.goto('/register');
    await page.getByPlaceholder('you@example.com').fill(email);
    const [passwordInput, confirmInput] = await page.getByPlaceholder('••••••••').all();
    await passwordInput.fill(password);
    await confirmInput.fill(password);
    await page.getByRole('button', { name: /create account/i }).click();

    await expect(page).toHaveURL(/dashboard/);

    // Logout
    await page.getByRole('button', { name: /sign out/i }).click();
    await expect(page).toHaveURL(/login/);

    // Login
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
    await page.getByPlaceholder('you@example.com').fill(uniqueEmail());
    const [passwordInput, confirmInput] = await page.getByPlaceholder('••••••••').all();
    await passwordInput.fill('password123');
    await confirmInput.fill('different456');
    await page.getByRole('button', { name: /create account/i }).click();

    await expect(page.getByText('Passwords do not match')).toBeVisible();
  });

  test('authenticated users are redirected away from /login', async ({ page, context: _context }) => {
    const email = uniqueEmail();
    // Register and get authenticated
    await page.goto('/register');
    await page.getByPlaceholder('you@example.com').fill(email);
    const [pw, confirm] = await page.getByPlaceholder('••••••••').all();
    await pw.fill('SecurePass123');
    await confirm.fill('SecurePass123');
    await page.getByRole('button', { name: /create account/i }).click();
    await expect(page).toHaveURL(/dashboard/);

    // Try to visit login
    await page.goto('/login');
    await expect(page).toHaveURL(/dashboard/);
  });

  test('unauthenticated users are redirected to /login from protected routes', async ({ page }) => {
    await page.goto('/dashboard');
    await expect(page).toHaveURL(/login/);
  });
});
