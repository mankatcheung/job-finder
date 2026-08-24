import { test, expect, type Page, type Locator } from '@playwright/test';
import { createApplication } from './helpers/applications';
import { registerAndLogin, uniqueEmail } from './helpers/auth';

/**
 * Drags a card via real pointer events, not locator.dragTo() — the board
 * uses @dnd-kit (pointer-events based sortable/droppable), not HTML5 native
 * drag-and-drop, so dragTo()'s dragstart/dragover/drop simulation never
 * reaches its sensors. PointerSensor also has a 5px activation distance
 * (see -board-page.tsx), so the first move must clear that before the real
 * move toward the target.
 *
 * The move is paced across several discrete mouse.move calls rather than one
 * big interpolated jump: dnd-kit's closestCorners collision detection
 * measures rects on each pointermove, and a single Playwright move dispatches
 * its intermediate events fast enough to outrun that measurement against a
 * column-tall droppable rect, which reproducibly landed drops one column
 * past the intended target in testing. Small, paced steps avoid it.
 */
async function dragCardTo(page: Page, card: Locator, target: Locator): Promise<void> {
  const from = await card.boundingBox();
  const to = await target.boundingBox();
  if (!from || !to) throw new Error('Missing bounding box for drag source or target');

  const startX = from.x + from.width / 2;
  const startY = from.y + from.height / 2;
  const endX = to.x + to.width / 2;
  const endY = to.y + to.height / 2;

  await page.mouse.move(startX, startY);
  await page.mouse.down();
  await page.mouse.move(startX + 10, startY + 10, { steps: 5 });
  await page.waitForTimeout(50);

  const midSteps = 8;
  for (let i = 1; i <= midSteps; i++) {
    await page.mouse.move(
      startX + ((endX - startX) * i) / midSteps,
      startY + ((endY - startY) * i) / midSteps,
      { steps: 3 },
    );
    await page.waitForTimeout(60);
  }
  await page.waitForTimeout(150);
  await page.mouse.up();
}

test.describe('Board drag-and-drop', () => {
  const password = 'SecurePass123';

  test.beforeEach(async ({ page }) => {
    await registerAndLogin(page, { email: uniqueEmail('board-test'), password });
  });

  test('dragging a card to another column updates its status, and it persists after reload', async ({
    page,
  }) => {
    await createApplication(page, { company: 'DragMeCo', role: 'Engineer' });

    await page.getByRole('link', { name: 'Applications', exact: true }).click();
    await page.locator('a[href="/applications/board"]').click();
    await expect(page).toHaveURL(/\/applications\/board$/);

    const draftColumn = page.getByTestId('board-column-draft');
    const appliedColumn = page.getByTestId('board-column-applied');
    const card = draftColumn.locator('a', { hasText: 'DragMeCo' });
    await expect(card).toBeVisible();

    // The column's small header dot, not its own (column-tall, empty) body —
    // see dragCardTo's comment on closestCorners and tall droppable rects.
    await dragCardTo(page, card, page.getByTestId('column-dot-applied'));

    await expect(appliedColumn.locator('a', { hasText: 'DragMeCo' })).toBeVisible();
    await expect(draftColumn.locator('a', { hasText: 'DragMeCo' })).toHaveCount(0);

    // Persisted server-side, not just optimistic local state.
    await page.reload();
    await expect(
      page.getByTestId('board-column-applied').locator('a', { hasText: 'DragMeCo' }),
    ).toBeVisible();
    await expect(
      page.getByTestId('board-column-draft').locator('a', { hasText: 'DragMeCo' }),
    ).toHaveCount(0);
  });

  test('reordering cards within a column persists the new order after reload', async ({ page }) => {
    await createApplication(page, { company: 'FirstCo', role: 'Engineer' });
    await createApplication(page, { company: 'SecondCo', role: 'Engineer' });

    await page.getByRole('link', { name: 'Applications', exact: true }).click();
    await page.locator('a[href="/applications/board"]').click();
    await expect(page).toHaveURL(/\/applications\/board$/);

    const draftColumn = page.getByTestId('board-column-draft');
    const cards = draftColumn.locator('a');
    await expect(cards).toHaveCount(2);

    // Newest lands at the top of Draft — confirm that before relying on it,
    // rather than assuming creation order.
    await expect(cards.nth(0)).toContainText('SecondCo');
    await expect(cards.nth(1)).toContainText('FirstCo');

    // Drag the bottom card above the top one.
    await dragCardTo(page, cards.nth(1), cards.nth(0));

    await expect(cards.nth(0)).toContainText('FirstCo');
    await expect(cards.nth(1)).toContainText('SecondCo');

    await page.reload();
    const reloadedCards = page.getByTestId('board-column-draft').locator('a');
    await expect(reloadedCards.nth(0)).toContainText('FirstCo');
    await expect(reloadedCards.nth(1)).toContainText('SecondCo');
  });

  test('dropping a card outside any column leaves the board unchanged', async ({ page }) => {
    await createApplication(page, { company: 'StayPutCo', role: 'Engineer' });

    await page.getByRole('link', { name: 'Applications', exact: true }).click();
    await page.locator('a[href="/applications/board"]').click();
    await expect(page).toHaveURL(/\/applications\/board$/);

    const draftColumn = page.getByTestId('board-column-draft');
    const card = draftColumn.locator('a', { hasText: 'StayPutCo' });
    await expect(card).toBeVisible();

    // The board's own header, well above any column — not a droppable target.
    const header = page.getByRole('heading', { name: 'Board' });
    await dragCardTo(page, card, header);

    await expect(draftColumn.locator('a', { hasText: 'StayPutCo' })).toBeVisible();

    await page.reload();
    await expect(
      page.getByTestId('board-column-draft').locator('a', { hasText: 'StayPutCo' }),
    ).toBeVisible();
  });
});
