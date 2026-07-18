import { test, expect } from '@playwright/test';

const uniqueEmail = () => `apps-test-${Date.now()}@e2e.example.com`;

test.describe('Job applications', () => {
  let email: string;
  const password = 'SecurePass123';

  test.beforeEach(async ({ page }) => {
    email = uniqueEmail();
    await page.goto('/register');
    await page.getByPlaceholder('you@example.com').fill(email);
    const [pw, confirm] = await page.getByPlaceholder('••••••••').all();
    await pw.fill(password);
    await confirm.fill(password);
    await page.getByRole('button', { name: /create account/i }).click();
    await expect(page).toHaveURL(/dashboard/);
  });

  test('creates a new application and it appears in the list', async ({ page }) => {
    await page.goto('/applications');

    // Create application
    await page.getByRole('button', { name: /new application|add/i }).click();
    await page.getByLabel(/company/i).fill('Stripe');
    await page.getByLabel(/role/i).fill('Software Engineer');
    await page.getByRole('button', { name: /save|create/i }).click();

    await expect(page.getByText('Stripe')).toBeVisible();
    await expect(page.getByText('Software Engineer')).toBeVisible();
  });

  test('updates an existing application', async ({ page }) => {
    await page.goto('/applications');

    // Create
    await page.getByRole('button', { name: /new application|add/i }).click();
    await page.getByLabel(/company/i).fill('OldCo');
    await page.getByLabel(/role/i).fill('Dev');
    await page.getByRole('button', { name: /save|create/i }).click();

    // Edit
    await page.getByText('OldCo').click();
    const companyInput = page.getByLabel(/company/i);
    await companyInput.fill('NewCo');
    await page.getByRole('button', { name: /save|update/i }).click();

    await expect(page.getByText('NewCo')).toBeVisible();
  });

  test('deletes an application', async ({ page }) => {
    await page.goto('/applications');

    // Create
    await page.getByRole('button', { name: /new application|add/i }).click();
    await page.getByLabel(/company/i).fill('ToDelete');
    await page.getByLabel(/role/i).fill('QA');
    await page.getByRole('button', { name: /save|create/i }).click();

    // Delete
    await page.getByText('ToDelete').click();
    await page.getByRole('button', { name: /delete/i }).click();

    await expect(page.getByText('ToDelete')).not.toBeVisible();
  });

  test('navigates to dashboard from sidebar', async ({ page }) => {
    await page.goto('/applications');
    await page.getByRole('link', { name: /dashboard/i }).click();
    await expect(page).toHaveURL(/dashboard/);
  });
});
