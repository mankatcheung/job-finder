import { test, expect, type Page } from '@playwright/test';
import { createApplication } from './helpers/applications';
import { registerAndLogin, uniqueEmail } from './helpers/auth';

const FAKE_LLM_URL = 'http://localhost:3001/llm-test/fake/chat/completions';
const FAKE_REPLY = 'Fake assistant reply for e2e testing.';

/**
 * Points the app's existing "Custom (OpenAI-compatible)" LLM provider option
 * at FakeOAuthProvider's sibling for LLM calls — apps/api's
 * fakeLlmCompletions.routes.ts, registered only when LLM_PROVIDER_MODE=fake
 * (see ci.yml's e2e job env block). Not a new provider or a UI change: this
 * is the same real mechanism a self-hosted OpenAI-compatible endpoint uses in
 * production, just pointed at a same-origin stand-in so no live LLM call or
 * API key secret is needed in CI.
 */
async function setupFakeAiProvider(page: Page): Promise<void> {
  await page.goto('/settings/ai');
  await page.locator('select').selectOption('custom');
  await page.getByPlaceholder('sk-…').fill('fake-api-key');
  await page
    .getByPlaceholder('https://your-endpoint.example.com/v1/chat/completions')
    .fill(FAKE_LLM_URL);
  await page.getByPlaceholder('e.g. gpt-4o-mini').fill('fake-model');
  await page.getByRole('button', { name: 'Add key' }).click();
  await expect(page.getByText('Custom (OpenAI-compatible)')).toBeVisible();
}

test.describe('AI assistant chat', () => {
  const password = 'SecurePass123';

  test.beforeEach(async ({ page }) => {
    await registerAndLogin(page, { email: uniqueEmail('assistant-test'), password });
    await setupFakeAiProvider(page);
  });

  test('sends a chat message and shows the assistant reply', async ({ page }) => {
    await page.getByRole('link', { name: 'Assistant', exact: true }).click();
    await expect(page).toHaveURL(/\/assistant$/);

    await page.getByPlaceholder('Ask a question…').fill('What applications do I have?');
    await page.getByRole('button', { name: 'Send' }).click();

    await expect(page.getByText(FAKE_REPLY)).toBeVisible();
  });

  test('a sent conversation is reachable from history', async ({ page }) => {
    await page.getByRole('link', { name: 'Assistant', exact: true }).click();
    await page.getByPlaceholder('Ask a question…').fill('Hello there');
    await page.getByRole('button', { name: 'Send' }).click();
    await expect(page.getByText(FAKE_REPLY)).toBeVisible();

    await page.getByRole('link', { name: 'Conversation history' }).click();
    await expect(page).toHaveURL(/\/assistant\/history$/);

    const conversations = page.locator('ul li a');
    await expect(conversations).toHaveCount(1);
    await conversations.first().click();

    // Back on /assistant with the same conversation restored.
    await expect(page).toHaveURL(/\/assistant\?conversation=/);
    await expect(page.getByText('Hello there')).toBeVisible();
    await expect(page.getByText(FAKE_REPLY)).toBeVisible();
  });
});

test.describe('AI resume generation', () => {
  const password = 'SecurePass123';

  test.beforeEach(async ({ page }) => {
    await registerAndLogin(page, { email: uniqueEmail('resume-gen-test'), password });
    await setupFakeAiProvider(page);

    // Matches fakeLlmCompletions.routes.ts's canned resume exactly —
    // GenerateResumeUseCase refuses to save a resume naming an employer or
    // institution the user hasn't actually recorded. "Add" is both the
    // section header's open-the-form trigger and, once open, the form's own
    // submit button — scope the submit click to <form> to disambiguate.
    await page.goto('/settings/experience');
    const workSection = page.locator('section').filter({ hasText: 'Work Experience' });
    await workSection.getByRole('button', { name: 'Add' }).click();
    await page.getByPlaceholder('Acme Corp').fill('Acme Corp');
    await page.getByPlaceholder('Software Engineer').fill('Senior Engineer');
    await workSection.locator('input[type="date"]').first().fill('2020-01-01');
    await workSection.locator('form').getByRole('button', { name: 'Add' }).click();
    await expect(workSection.locator('form')).toHaveCount(0);

    const eduSection = page.locator('section').filter({ hasText: 'Education' });
    await eduSection.getByRole('button', { name: 'Add' }).click();
    await page.getByPlaceholder('MIT').fill('State University');
    await eduSection.locator('input[type="date"]').first().fill('2016-01-01');
    await eduSection.locator('form').getByRole('button', { name: 'Add' }).click();
    await expect(eduSection.locator('form')).toHaveCount(0);
  });

  test('generates a tailored resume and saves it as a reachable document draft', async ({
    page,
  }) => {
    const applicationId = await createApplication(page, { company: 'DestCo', role: 'Engineer' });

    await page.goto(`/applications/${applicationId}/documents/new`);
    await page.getByRole('button', { name: 'Resume', exact: true }).click();
    await page.getByRole('button', { name: /generate resume/i }).click();

    // (?!new$) excludes the form's own URL — it already matches
    // ".../documents/<segment>$" before the post-generate navigation happens,
    // the same trap createApplication's helper had (see its own fix).
    await expect(page).toHaveURL(
      new RegExp(`/applications/${applicationId}/documents/(?!new$)[^/]+$`),
    );
    await expect(page.getByText('Acme Corp')).toBeVisible();
    await expect(page.getByText('Built things.')).toBeVisible();

    // Reachable again from the application's own Documents tab, not just the
    // page this navigation happened to land on.
    await page.goto(`/applications/${applicationId}`);
    await page
      .getByRole('navigation', { name: 'Section navigation' })
      .getByRole('button', { name: 'Documents' })
      .click();
    await expect(page.getByRole('link', { name: /DestCo — Engineer/ })).toBeVisible();
  });
});
