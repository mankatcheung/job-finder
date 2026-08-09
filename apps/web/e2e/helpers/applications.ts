import type { Page } from '@playwright/test';
import { expect } from '@playwright/test';

/**
 * Creates a new application via the UI and lands on its detail page.
 * Returns the new application's id, parsed from the resulting URL.
 */
export async function createApplication(
  page: Page,
  { company, role }: { company: string; role: string },
): Promise<string> {
  // Client-side navigation, not page.goto: /applications has a route loader
  // that fires a query on load, and a full page reload can race the loader
  // against session rehydration, occasionally 401ing into the error boundary.
  await page.getByRole('link', { name: 'Applications', exact: true }).click();
  await page.getByRole('link', { name: /new application/i }).click();
  await page.getByPlaceholder('Acme Corp').fill(company);
  await page.getByPlaceholder('Senior Engineer').fill(role);
  await page.getByRole('button', { name: /save application/i }).click();

  await expect(page).toHaveURL(/\/applications\/[^/]+$/);
  const match = /\/applications\/([^/]+)$/.exec(page.url());
  if (!match) throw new Error(`Could not parse applicationId from URL: ${page.url()}`);
  return match[1];
}

/** Clicks a section-navigation tab on the application detail page (desktop sidebar). */
export async function openTab(page: Page, label: string): Promise<void> {
  await page
    .getByRole('navigation', { name: 'Section navigation' })
    .getByRole('button', { name: label })
    .click();
}
