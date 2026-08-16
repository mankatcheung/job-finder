/**
 * A Map with a hard size cap. When an insert would exceed the cap, the oldest
 * entry (first-inserted; native Map preserves insertion order) is evicted, so
 * memory stays bounded on warm/long-lived instances (JEF-130).
 *
 * Used for the Cached*Repository reverse-index maps (id → owning userId/
 * applicationId), which otherwise grow monotonically with the number of
 * distinct ids a process has ever seen. Evicted ids simply miss the list-cache
 * bust on the next delete()/update() for that id — the stale cache entry still
 * expires via the normal TTL.
 *
 * FIFO eviction is intentional: these maps are only read to reverse-lookup an
 * owner, so recency tracking (LRU) buys nothing over plain insertion order.
 */
export class BoundedMap<K, V> {
  private readonly map = new Map<K, V>();
  private readonly maxEntries: number;

  constructor(maxEntries: number) {
    if (!Number.isInteger(maxEntries) || maxEntries < 1) {
      throw new Error('maxEntries must be a positive integer');
    }
    this.maxEntries = maxEntries;
  }

  get size(): number {
    return this.map.size;
  }

  set(key: K, value: V): void {
    this.map.set(key, value);
    this.evictIfOverCapacity();
  }

  get(key: K): V | undefined {
    return this.map.get(key);
  }

  delete(key: K): boolean {
    return this.map.delete(key);
  }

  private evictIfOverCapacity(): void {
    while (this.map.size > this.maxEntries) {
      const oldest = this.map.keys().next().value;
      if (oldest === undefined) break;
      this.map.delete(oldest);
    }
  }
}
