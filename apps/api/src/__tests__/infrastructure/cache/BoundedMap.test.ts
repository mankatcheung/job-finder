import { describe, it, expect } from 'vitest';
import { BoundedMap } from '#src/infrastructure/cache/BoundedMap.js';

describe('BoundedMap', () => {
  it('stores and retrieves entries', () => {
    const map = new BoundedMap<string, number>(10);
    map.set('a', 1);
    expect(map.get('a')).toBe(1);
    expect(map.size).toBe(1);
  });

  it('evicts the oldest entry when exceeding maxEntries', () => {
    const map = new BoundedMap<string, number>(2);
    map.set('a', 1);
    map.set('b', 2);
    map.set('c', 3);

    expect(map.size).toBe(2);
    expect(map.get('a')).toBeUndefined();
    expect(map.get('b')).toBe(2);
    expect(map.get('c')).toBe(3);
  });

  it('set on an existing key updates its value without changing eviction order', () => {
    const map = new BoundedMap<string, number>(2);
    map.set('a', 1);
    map.set('b', 2);
    map.set('a', 10);

    // 'a' is still the oldest insert, so the next set evicts it.
    map.set('c', 3);

    expect(map.get('a')).toBeUndefined();
    expect(map.get('b')).toBe(2);
    expect(map.get('c')).toBe(3);
  });

  it('delete removes entries and frees capacity for new ones', () => {
    const map = new BoundedMap<string, number>(2);
    map.set('a', 1);
    map.set('b', 2);
    map.delete('a'); // frees a slot — 'c' fits without evicting 'b'

    map.set('c', 3);
    map.set('d', 4); // over cap again — evicts the oldest remaining entry 'b'

    expect(map.size).toBe(2);
    expect(map.get('b')).toBeUndefined();
    expect(map.get('c')).toBe(3);
    expect(map.get('d')).toBe(4);
  });

  it('never drops below maxEntries even with a single entry', () => {
    const map = new BoundedMap<string, number>(1);
    map.set('a', 1);
    map.set('b', 2);
    expect(map.size).toBe(1);
    expect(map.get('b')).toBe(2);
  });

  it('rejects maxEntries smaller than 1', () => {
    expect(() => new BoundedMap(0)).toThrow('maxEntries');
    expect(() => new BoundedMap(1.5)).toThrow('maxEntries');
    expect(() => new BoundedMap(-1)).toThrow('maxEntries');
  });
});
