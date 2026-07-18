import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MemoryCache } from '@/infrastructure/cache/MemoryCache.js';

describe('MemoryCache', () => {
  let cache: MemoryCache;

  beforeEach(() => {
    cache = new MemoryCache(1000); // 1s TTL for tests
  });

  it('returns undefined for a missing key', () => {
    expect(cache.get('missing')).toBeUndefined();
  });

  it('stores and retrieves a value', () => {
    cache.set('key', 'value');
    expect(cache.get<string>('key')).toBe('value');
  });

  it('returns undefined after TTL expires', () => {
    vi.useFakeTimers();
    cache.set('key', 'value');
    vi.advanceTimersByTime(1001);
    expect(cache.get('key')).toBeUndefined();
    vi.useRealTimers();
  });

  it('does not expire before TTL', () => {
    vi.useFakeTimers();
    cache.set('key', 'value');
    vi.advanceTimersByTime(999);
    expect(cache.get<string>('key')).toBe('value');
    vi.useRealTimers();
  });

  it('deletes a specific key', () => {
    cache.set('a', 1);
    cache.set('b', 2);
    cache.delete('a');
    expect(cache.get('a')).toBeUndefined();
    expect(cache.get<number>('b')).toBe(2);
  });

  it('deletes all keys matching a prefix', () => {
    cache.set('apps:list:user1:', 'list1');
    cache.set('apps:list:user2:', 'list2');
    cache.set('apps:byId:abc', 'single');
    cache.deleteByPrefix('apps:list:user1:');
    expect(cache.get('apps:list:user1:')).toBeUndefined();
    expect(cache.get<string>('apps:list:user2:')).toBe('list2');
    expect(cache.get<string>('apps:byId:abc')).toBe('single');
  });

  it('clears all entries', () => {
    cache.set('a', 1);
    cache.set('b', 2);
    cache.clear();
    expect(cache.size).toBe(0);
  });

  it('reports correct size', () => {
    expect(cache.size).toBe(0);
    cache.set('a', 1);
    cache.set('b', 2);
    expect(cache.size).toBe(2);
  });

  it('stores null as a valid value (distinct from cache miss)', () => {
    cache.set('nullable', null);
    expect(cache.get('nullable')).toBeNull();
    expect(cache.get('nullable') !== undefined).toBe(true);
  });
});
