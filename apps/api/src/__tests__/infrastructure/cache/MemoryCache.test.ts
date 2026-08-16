import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MemoryCache } from '#src/infrastructure/cache/MemoryCache.js';

describe('MemoryCache', () => {
  let cache: MemoryCache;

  beforeEach(() => {
    cache = new MemoryCache(1000); // 1s TTL for tests
  });

  it('calls fetch and caches the result on a miss', async () => {
    const fetch = vi.fn().mockResolvedValue('value');
    const result = await cache.getOrSet('key', fetch);
    expect(result).toBe('value');
    expect(fetch).toHaveBeenCalledOnce();
  });

  it('returns the cached value on a second call without calling fetch again', async () => {
    const fetch = vi.fn().mockResolvedValue('value');
    await cache.getOrSet('key', fetch);
    const result = await cache.getOrSet('key', fetch);
    expect(result).toBe('value');
    expect(fetch).toHaveBeenCalledOnce();
  });

  it('calls fetch again after TTL expires', async () => {
    vi.useFakeTimers();
    const fetch = vi.fn().mockResolvedValue('value');
    await cache.getOrSet('key', fetch);
    vi.advanceTimersByTime(1001);
    await cache.getOrSet('key', fetch);
    expect(fetch).toHaveBeenCalledTimes(2);
    vi.useRealTimers();
  });

  it('does not call fetch again before TTL expires', async () => {
    vi.useFakeTimers();
    const fetch = vi.fn().mockResolvedValue('value');
    await cache.getOrSet('key', fetch);
    vi.advanceTimersByTime(999);
    await cache.getOrSet('key', fetch);
    expect(fetch).toHaveBeenCalledOnce();
    vi.useRealTimers();
  });

  it('deletes a specific key', async () => {
    const fetchA = vi.fn().mockResolvedValue(1);
    const fetchB = vi.fn().mockResolvedValue(2);
    await cache.getOrSet('a', fetchA);
    await cache.getOrSet('b', fetchB);

    await cache.delete('a');

    await cache.getOrSet('a', fetchA);
    await cache.getOrSet('b', fetchB);
    expect(fetchA).toHaveBeenCalledTimes(2);
    expect(fetchB).toHaveBeenCalledOnce();
  });

  it('deletes all keys matching a prefix', async () => {
    const fetchUser1 = vi.fn().mockResolvedValue('list1');
    const fetchUser2 = vi.fn().mockResolvedValue('list2');
    const fetchById = vi.fn().mockResolvedValue('single');
    await cache.getOrSet('apps:list:user1:', fetchUser1);
    await cache.getOrSet('apps:list:user2:', fetchUser2);
    await cache.getOrSet('apps:byId:abc', fetchById);

    await cache.deleteByPrefix('apps:list:user1:');

    await cache.getOrSet('apps:list:user1:', fetchUser1);
    await cache.getOrSet('apps:list:user2:', fetchUser2);
    await cache.getOrSet('apps:byId:abc', fetchById);
    expect(fetchUser1).toHaveBeenCalledTimes(2);
    expect(fetchUser2).toHaveBeenCalledOnce();
    expect(fetchById).toHaveBeenCalledOnce();
  });

  it('caches a null result as a valid value, distinct from a miss', async () => {
    const fetch = vi.fn().mockResolvedValue(null);
    const first = await cache.getOrSet('nullable', fetch);
    const second = await cache.getOrSet('nullable', fetch);
    expect(first).toBeNull();
    expect(second).toBeNull();
    expect(fetch).toHaveBeenCalledOnce();
  });

  it('single-flight: concurrent calls for the same key on a miss only invoke fetch once', async () => {
    let resolveFetch!: (value: string) => void;
    const fetch = vi.fn(
      () =>
        new Promise<string>((resolve) => {
          resolveFetch = resolve;
        }),
    );

    const first = cache.getOrSet('key', fetch);
    const second = cache.getOrSet('key', fetch);
    resolveFetch('value');

    const [firstResult, secondResult] = await Promise.all([first, second]);
    expect(firstResult).toBe('value');
    expect(secondResult).toBe('value');
    expect(fetch).toHaveBeenCalledOnce();
  });

  it('clears all entries', async () => {
    await cache.getOrSet('a', () => Promise.resolve(1));
    await cache.getOrSet('b', () => Promise.resolve(2));
    cache.clear();
    expect(cache.size).toBe(0);
  });

  it('reports correct size', async () => {
    expect(cache.size).toBe(0);
    await cache.getOrSet('a', () => Promise.resolve(1));
    await cache.getOrSet('b', () => Promise.resolve(2));
    expect(cache.size).toBe(2);
  });

  describe('eviction (JEF-130)', () => {
    it('evicts the least-recently-used entry when exceeding maxEntries', async () => {
      const small = new MemoryCache(1000, 2);
      await small.getOrSet('a', () => Promise.resolve(1));
      await small.getOrSet('b', () => Promise.resolve(2));
      await small.getOrSet('c', () => Promise.resolve(3));

      expect(small.size).toBe(2);
      const fetchA = vi.fn().mockResolvedValue('a-refetched');
      await small.getOrSet('a', fetchA);
      expect(fetchA).toHaveBeenCalledOnce();
    });

    it('a hit refreshes recency so the entry is not the first evicted', async () => {
      const small = new MemoryCache(1000, 2);
      await small.getOrSet('a', () => Promise.resolve(1));
      await small.getOrSet('b', () => Promise.resolve(2));
      // Cache hit on 'a' (fetch is not called), making 'b' the LRU entry.
      const hitFetch = vi.fn().mockResolvedValue('unused');
      await small.getOrSet('a', hitFetch);
      await small.getOrSet('c', () => Promise.resolve(3)); // evicts 'b', keeps 'a'

      const fetchA = vi.fn().mockResolvedValue('a');
      const fetchB = vi.fn().mockResolvedValue('b');
      await small.getOrSet('a', fetchA);
      await small.getOrSet('b', fetchB);
      expect(hitFetch).not.toHaveBeenCalled();
      expect(fetchA).not.toHaveBeenCalled();
      expect(fetchB).toHaveBeenCalledOnce();
    });

    it('evicts expired entries before live ones when over the cap', async () => {
      const small = new MemoryCache(1000, 2);
      await small.getOrSet('a', () => Promise.resolve(1)); // will expire
      await small.getOrSet('b', () => Promise.resolve(2)); // stays live

      vi.useFakeTimers();
      vi.advanceTimersByTime(1001); // 'a' is now expired (lazily)
      await small.getOrSet('c', () => Promise.resolve(3)); // over cap → evicts expired 'a'
      vi.useRealTimers();

      expect(small.size).toBe(2);
      const fetchB = vi.fn().mockResolvedValue(2);
      const fetchC = vi.fn().mockResolvedValue(3);
      const fetchA = vi.fn().mockResolvedValue(1);
      await small.getOrSet('b', fetchB); // live → hit
      await small.getOrSet('c', fetchC); // live → hit
      await small.getOrSet('a', fetchA); // was evicted → refetch
      expect(fetchB).not.toHaveBeenCalled();
      expect(fetchC).not.toHaveBeenCalled();
      expect(fetchA).toHaveBeenCalledOnce();
    });

    it('rejects maxEntries smaller than 1', () => {
      expect(() => new MemoryCache(1000, 0)).toThrow('maxEntries');
      expect(() => new MemoryCache(1000, -1)).toThrow('maxEntries');
    });
  });
});
