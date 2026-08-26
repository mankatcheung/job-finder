import { test, expect } from '@playwright/test';
import { registerAndLogin, uniqueEmail } from './helpers/auth';
import { createApplication } from './helpers/applications';

/**
 * The app shell is one viewport tall and <main> is the only scroll container,
 * which is what lets full-height pages (assistant chat, applications board)
 * fill the screen exactly instead of doing viewport arithmetic. The wrapper
 * inside main therefore has a *definite* height — so this guards the other
 * half of that trade: ordinary long pages must still scroll all the way to
 * their end, and must not be squashed into the wrapper's height.
 *
 * A layout-only concern, so it can only be checked in a real browser.
 */
test.describe('app shell scrolling', () => {
  const password = 'SecurePass123';

  test.beforeEach(async ({ page }) => {
    await registerAndLogin(page, { email: uniqueEmail('shell-scroll'), password });
  });

  for (const viewport of [
    { name: 'desktop', width: 1280, height: 700 },
    { name: 'mobile', width: 390, height: 664 },
  ] as const) {
    test(`ordinary pages scroll to the end on ${viewport.name}`, async ({ page }) => {
      // Seeded at the default (desktop) size: createApplication navigates via
      // the desktop sidebar, which is hidden behind a drawer on mobile. The
      // viewport only matters for the measurements below.
      for (let i = 0; i < 12; i++) {
        await createApplication(page, { company: `Scroll Co ${i}`, role: `Role ${i}` });
      }

      await page.setViewportSize({ width: viewport.width, height: viewport.height });
      await page.goto('/applications');
      await expect(page.getByText('Scroll Co 0')).toBeVisible();

      const before = await page.evaluate(() => {
        const main = document.querySelector('main')!;
        const content = main.firstElementChild!.firstElementChild as HTMLElement;
        return {
          canScroll: main.scrollHeight > main.clientHeight + 1,
          // The wrapper's fixed height must not clip or compress the page.
          contentHeight: Math.round(content.getBoundingClientRect().height),
        };
      });
      expect(before.canScroll).toBe(true);
      expect(before.contentHeight).toBeGreaterThan(viewport.height);

      // Scrolling reaches the very bottom — nothing is stranded out of reach.
      // maxScroll is read after the scroll, not before: this list loads more
      // rows as it nears the end, which moves the bottom while we're going.
      const { landedAt, maxScroll } = await page.evaluate(() => {
        const main = document.querySelector('main')!;
        main.scrollTop = 99_999;
        return { landedAt: main.scrollTop, maxScroll: main.scrollHeight - main.clientHeight };
      });
      expect(landedAt).toBe(maxScroll);
      expect(landedAt).toBeGreaterThan(0);

      // The document itself never scrolls; main owns it.
      const documentScrolls = await page.evaluate(
        () => document.documentElement.scrollHeight > document.documentElement.clientHeight + 1,
      );
      expect(documentScrolls).toBe(false);
    });
  }
});
