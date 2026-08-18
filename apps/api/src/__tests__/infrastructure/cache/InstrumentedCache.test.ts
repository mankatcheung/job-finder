import { describe, it, expect, vi } from 'vitest';
import { InstrumentedCache } from '#src/infrastructure/cache/InstrumentedCache.js';
import { MemoryCache } from '#src/infrastructure/cache/MemoryCache.js';
import type { ICache } from '#src/infrastructure/cache/ICache.js';
import { makeFakeMetrics } from '#src/__tests__/helpers/fakeMetrics.js';

function makeCache(inner: ICache = new MemoryCache()) {
  const metrics = makeFakeMetrics();
  return { cache: new InstrumentedCache({ inner, metrics }), metrics };
}

describe('InstrumentedCache', () => {
  it('counts a miss when the value has to be fetched', async () => {
    const { cache, metrics } = makeCache();

    await cache.getOrSet('key-1', async () => 'value');

    expect(metrics.misses).toBe(1);
    expect(metrics.hits).toBe(0);
  });

  it('counts a hit when a second read is served without fetching', async () => {
    const { cache, metrics } = makeCache();
    const fetch = vi.fn().mockResolvedValue('value');

    await cache.getOrSet('key-1', fetch);
    await cache.getOrSet('key-1', fetch);

    expect(metrics.misses).toBe(1);
    expect(metrics.hits).toBe(1);
    expect(fetch).toHaveBeenCalledTimes(1);
  });

  it('counts a miss again once the entry has been invalidated', async () => {
    const { cache, metrics } = makeCache();

    await cache.getOrSet('key-1', async () => 'value');
    await cache.getOrSet('key-1', async () => 'value');
    await cache.delete('key-1');
    await cache.getOrSet('key-1', async () => 'value');

    expect(metrics.hits).toBe(1);
    expect(metrics.misses).toBe(2);
  });

  it('still returns the underlying value unchanged', async () => {
    const { cache } = makeCache();

    await expect(cache.getOrSet('key-1', async () => ({ a: 1 }))).resolves.toEqual({ a: 1 });
    await expect(cache.getOrSet('key-1', async () => ({ a: 2 }))).resolves.toEqual({ a: 1 });
  });

  it('counts one miss per call even if the inner cache invokes fetch twice', async () => {
    // RedisCache can do this when `fetch` succeeded but the write-back to
    // Redis then failed — one caller request is still one miss.
    const doubleFetching: ICache = {
      getOrSet: async <T>(_key: string, fetch: () => Promise<T>) => {
        await fetch();
        return fetch();
      },
      delete: async () => {},
      deleteByPrefix: async () => {},
    };
    const { cache, metrics } = makeCache(doubleFetching);

    await cache.getOrSet('key-1', async () => 'value');

    expect(metrics.misses).toBe(1);
  });

  it('records nothing when the inner cache throws', async () => {
    const throwing: ICache = {
      getOrSet: async () => {
        throw new Error('boom');
      },
      delete: async () => {},
      deleteByPrefix: async () => {},
    };
    const { cache, metrics } = makeCache(throwing);

    await expect(cache.getOrSet('key-1', async () => 'value')).rejects.toThrow('boom');
    expect(metrics.hits).toBe(0);
    expect(metrics.misses).toBe(0);
  });

  it('passes delete and deleteByPrefix straight through', async () => {
    const inner: ICache = {
      getOrSet: async <T>(_k: string, fetch: () => Promise<T>) => fetch(),
      delete: vi.fn().mockResolvedValue(undefined),
      deleteByPrefix: vi.fn().mockResolvedValue(undefined),
    };
    const { cache } = makeCache(inner);

    await cache.delete('key-1');
    await cache.deleteByPrefix('prefix:');

    expect(inner.delete).toHaveBeenCalledWith('key-1');
    expect(inner.deleteByPrefix).toHaveBeenCalledWith('prefix:');
  });
});
