import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { DrizzleCompanyBriefingRepository } from '#src/infrastructure/db/repositories/DrizzleCompanyBriefingRepository.js';
import { createTestDb, type TestDb } from '#src/__tests__/helpers/createTestDb.js';
import { user, jobApplication, companyBriefing } from '#src/infrastructure/db/schema.js';
import { eq } from 'drizzle-orm';

describe('DrizzleCompanyBriefingRepository', () => {
  let db: TestDb;
  let repo: DrizzleCompanyBriefingRepository;

  beforeAll(async () => {
    db = await createTestDb();
    repo = new DrizzleCompanyBriefingRepository({ db: db.db });
    await db.db.insert(user).values({ id: 'u1', email: 'u@t.com', passwordHash: 'h' });
    await db.db.insert(jobApplication).values([
      { id: 'app-1', userId: 'u1', company: 'Acme', role: 'Eng', status: 'draft' },
      { id: 'app-2', userId: 'u1', company: 'Globex', role: 'Eng', status: 'draft' },
    ]);
  });

  afterAll(() => db.cleanup());

  beforeEach(async () => {
    await db.db.delete(companyBriefing);
  });

  it('returns null when nothing has been generated', async () => {
    expect(await repo.findByApplicationId('app-1')).toBeNull();
  });

  it('stores and reads back a briefing', async () => {
    await repo.upsert({
      id: 'b1',
      applicationId: 'app-1',
      content: 'Overview…',
      generatedAt: new Date('2026-08-01T00:00:00.000Z'),
    });

    const found = await repo.findByApplicationId('app-1');
    expect(found).toMatchObject({ applicationId: 'app-1', content: 'Overview…' });
    expect(found?.generatedAt).toEqual(new Date('2026-08-01T00:00:00.000Z'));
  });

  it('regenerating replaces the row instead of adding a second one', async () => {
    await repo.upsert({
      id: 'b1',
      applicationId: 'app-1',
      content: 'First',
      generatedAt: new Date('2026-08-01T00:00:00.000Z'),
    });
    // A regenerate arrives with a fresh id — the conflict target is
    // applicationId, so it must replace rather than collide or duplicate.
    await repo.upsert({
      id: 'b2',
      applicationId: 'app-1',
      content: 'Second',
      generatedAt: new Date('2026-08-02T00:00:00.000Z'),
    });

    const rows = await db.db.select().from(companyBriefing);
    expect(rows).toHaveLength(1);
    expect(rows[0].content).toBe('Second');
  });

  it('keeps briefings for different applications apart', async () => {
    await repo.upsert({
      id: 'b1',
      applicationId: 'app-1',
      content: 'Acme',
      generatedAt: new Date(),
    });
    await repo.upsert({
      id: 'b2',
      applicationId: 'app-2',
      content: 'Globex',
      generatedAt: new Date(),
    });

    expect((await repo.findByApplicationId('app-1'))?.content).toBe('Acme');
    expect((await repo.findByApplicationId('app-2'))?.content).toBe('Globex');
  });

  it('goes with the application when it is deleted', async () => {
    await repo.upsert({
      id: 'b1',
      applicationId: 'app-2',
      content: 'Globex',
      generatedAt: new Date(),
    });

    await db.db.delete(jobApplication).where(eq(jobApplication.id, 'app-2'));

    expect(await repo.findByApplicationId('app-2')).toBeNull();
    // Restore for any later test in this file.
    await db.db
      .insert(jobApplication)
      .values({ id: 'app-2', userId: 'u1', company: 'Globex', role: 'Eng', status: 'draft' });
  });
});
