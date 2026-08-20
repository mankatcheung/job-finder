import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { eq } from 'drizzle-orm';
import { DrizzleApplicationRepository } from '#src/infrastructure/db/repositories/DrizzleApplicationRepository.js';
import { createTestDb, type TestDb } from '#src/__tests__/helpers/createTestDb.js';
import { user, jobApplication } from '#src/infrastructure/db/schema.js';
import type { ApplicationStatus } from '#src/domain/application/ApplicationStatus.js';

describe('DrizzleApplicationRepository.reorderBoard', () => {
  let db: TestDb;
  let repo: DrizzleApplicationRepository;

  const seed = async (
    rows: {
      id: string;
      userId?: string;
      status?: ApplicationStatus;
      deletedAt?: Date | null;
      createdAt?: Date;
    }[],
  ) => {
    for (const row of rows) {
      await db.db.insert(jobApplication).values({
        id: row.id,
        userId: row.userId ?? 'u1',
        company: 'Acme',
        role: 'Engineer',
        status: row.status ?? 'applied',
        deletedAt: row.deletedAt ?? null,
        createdAt: row.createdAt ?? new Date('2024-01-01'),
        updatedAt: new Date('2024-01-01'),
      });
    }
  };

  const positions = async (): Promise<Record<string, number>> => {
    const rows = await db.db.select().from(jobApplication);
    return Object.fromEntries(rows.map((r) => [r.id, r.boardPosition]));
  };

  beforeAll(async () => {
    db = await createTestDb();
    repo = new DrizzleApplicationRepository({ db: db.db });
    await db.db.insert(user).values({ id: 'u1', email: 'a@test.com', passwordHash: 'h' });
    await db.db.insert(user).values({ id: 'u2', email: 'b@test.com', passwordHash: 'h' });
  });

  afterAll(() => db.cleanup());

  beforeEach(async () => {
    await db.db.delete(jobApplication);
  });

  it('writes 0…n-1 in the given order and returns the column in it', async () => {
    await seed([{ id: 'a' }, { id: 'b' }, { id: 'c' }]);

    const column = await repo.reorderBoard('u1', 'applied', ['c', 'a', 'b']);

    expect(await positions()).toEqual({ c: 0, a: 1, b: 2 });
    expect(column.map((row) => row.id)).toEqual(['c', 'a', 'b']);
  });

  it('defaults every row to 0, so an untouched board keeps its createdAt order', async () => {
    // This is why the migration needed no backfill: before anything is
    // dragged every row ties at 0 and the createdAt/id tiebreak reproduces
    // exactly the order the board showed before the column existed.
    await seed([
      { id: 'older', createdAt: new Date('2024-01-01') },
      { id: 'newer', createdAt: new Date('2024-05-01') },
    ]);

    expect(await positions()).toEqual({ older: 0, newer: 0 });

    const column = await repo.reorderBoard('u1', 'applied', []);
    expect(column.map((row) => row.id)).toEqual(['newer', 'older']);
  });

  it("leaves another user's cards alone", async () => {
    await seed([{ id: 'mine' }, { id: 'theirs', userId: 'u2' }]);

    await repo.reorderBoard('u1', 'applied', ['theirs', 'mine']);

    // 'theirs' matches no row scoped to u1, so only 'mine' is written — and it
    // takes index 1 because that is where the caller placed it.
    const after = await positions();
    expect(after.theirs).toBe(0);
    expect(after.mine).toBe(1);
  });

  it('leaves cards in another column alone', async () => {
    await seed([{ id: 'a' }, { id: 'elsewhere', status: 'offered' }]);

    await repo.reorderBoard('u1', 'applied', ['elsewhere', 'a']);

    const after = await positions();
    expect(after.elsewhere).toBe(0);
    expect(after.a).toBe(1);
  });

  it('skips trashed cards and omits them from the returned column', async () => {
    await seed([{ id: 'a' }, { id: 'trashed', deletedAt: new Date('2024-06-01') }]);

    const column = await repo.reorderBoard('u1', 'applied', ['trashed', 'a']);

    expect((await positions()).trashed).toBe(0);
    expect(column.map((row) => row.id)).toEqual(['a']);
  });

  it('does not bump updatedAt', async () => {
    // isLikelyGhosted reads updatedAt, and updatedAt carries $onUpdate. If a
    // reorder let that fire, dragging one card would clear the ghosted badge
    // from every card in the column.
    await seed([{ id: 'a' }, { id: 'b' }]);
    const [before] = await db.db.select().from(jobApplication).where(eq(jobApplication.id, 'a'));

    await repo.reorderBoard('u1', 'applied', ['b', 'a']);

    const [after] = await db.db.select().from(jobApplication).where(eq(jobApplication.id, 'a'));
    expect(after.updatedAt.getTime()).toBe(before.updatedAt.getTime());
    expect(after.boardPosition).toBe(1);
  });

  it('reads the column back without writing when given an empty list', async () => {
    await seed([{ id: 'a' }]);

    const column = await repo.reorderBoard('u1', 'applied', []);

    expect(column.map((row) => row.id)).toEqual(['a']);
    expect((await positions()).a).toBe(0);
  });
});
