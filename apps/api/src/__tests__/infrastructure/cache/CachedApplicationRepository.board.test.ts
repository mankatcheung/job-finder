import { describe, it, expect, vi } from 'vitest';
import { CachedApplicationRepository } from '#src/infrastructure/db/repositories/CachedApplicationRepository.js';
import { MemoryCache } from '#src/infrastructure/cache/MemoryCache.js';
import { makeApplicationRepository, makeApplication } from '#src/__tests__/helpers/mocks.js';

function makeRepo() {
  const inner = makeApplicationRepository();
  const cache = new MemoryCache(60_000);
  const repo = new CachedApplicationRepository({
    drizzleApplicationRepository: inner,
    cache,
  });
  return { repo, inner, cache };
}

describe('CachedApplicationRepository.reorderBoard', () => {
  it('busts the list cache, so the board does not read its old order back', async () => {
    const { repo, inner } = makeRepo();
    const first = [makeApplication({ id: 'a' }), makeApplication({ id: 'b' })];
    const reordered = [makeApplication({ id: 'b' }), makeApplication({ id: 'a' })];

    vi.mocked(inner.findAllByUserId).mockResolvedValue(first);
    await repo.findAllByUserId('user-1');
    expect(inner.findAllByUserId).toHaveBeenCalledOnce();

    vi.mocked(inner.reorderBoard).mockResolvedValue(reordered);
    await repo.reorderBoard('user-1', 'applied', ['b', 'a']);

    vi.mocked(inner.findAllByUserId).mockResolvedValue(reordered);
    const after = await repo.findAllByUserId('user-1');

    expect(after.map((app) => app.id)).toEqual(['b', 'a']);
    expect(inner.findAllByUserId).toHaveBeenCalledTimes(2);
  });

  it('busts every per-id cache entry in the batch', async () => {
    const { repo, inner } = makeRepo();
    const stale = makeApplication({ id: 'a', boardPosition: 0 });
    const fresh = makeApplication({ id: 'a', boardPosition: 1 });

    vi.mocked(inner.findById).mockResolvedValue(stale);
    await repo.findById('a');
    expect(inner.findById).toHaveBeenCalledOnce();

    vi.mocked(inner.reorderBoard).mockResolvedValue([]);
    await repo.reorderBoard('user-1', 'applied', ['b', 'a']);

    vi.mocked(inner.findById).mockResolvedValue(fresh);
    const after = await repo.findById('a');

    expect(after?.boardPosition).toBe(1);
    expect(inner.findById).toHaveBeenCalledTimes(2);
  });

  it("does not touch another user's cached list", async () => {
    const { repo, inner } = makeRepo();
    const others = [makeApplication({ id: 'x', userId: 'user-2' })];

    vi.mocked(inner.findAllByUserId).mockResolvedValue(others);
    await repo.findAllByUserId('user-2');

    vi.mocked(inner.reorderBoard).mockResolvedValue([]);
    await repo.reorderBoard('user-1', 'applied', ['a']);

    await repo.findAllByUserId('user-2');
    expect(inner.findAllByUserId).toHaveBeenCalledOnce();
  });

  it('passes the call through and returns what the inner repository reports', async () => {
    const { repo, inner } = makeRepo();
    const column = [makeApplication({ id: 'b' }), makeApplication({ id: 'a' })];
    vi.mocked(inner.reorderBoard).mockResolvedValue(column);

    const result = await repo.reorderBoard('user-1', 'applied', ['b', 'a']);

    expect(inner.reorderBoard).toHaveBeenCalledWith('user-1', 'applied', ['b', 'a']);
    expect(result).toEqual(column);
  });
});
