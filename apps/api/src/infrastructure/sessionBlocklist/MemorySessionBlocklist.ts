import { BoundedMap } from '#src/infrastructure/cache/BoundedMap.js';
import { SESSION_BLOCKLIST } from '#src/constants.js';
import type { ISessionBlocklist } from '#src/use-cases/ports/ISessionBlocklist.js';

/**
 * In-process ISessionBlocklist for local dev and tests. Entries live in
 * memory, so they aren't shared across horizontally-scaled instances and are
 * lost on restart — the same coherence limitation `MemoryCache`/`RateLimiter`
 * have, and the reason production uses `RedisSessionBlocklist` (selected via
 * the same `CACHE_PROVIDER` toggle).
 *
 * Backed by a real implementation rather than a no-op so the revocation
 * behaviour itself is exercisable locally: on a single dev instance this
 * behaves exactly like production.
 */
export class MemorySessionBlocklist implements ISessionBlocklist {
  private readonly entries: BoundedMap<string, number>;
  private readonly ttlMs: number;

  constructor({
    ttlMs = SESSION_BLOCKLIST.TTL_MS,
    maxEntries = SESSION_BLOCKLIST.MEMORY_MAX_ENTRIES,
  }: { ttlMs?: number; maxEntries?: number } = {}) {
    this.entries = new BoundedMap(maxEntries);
    this.ttlMs = ttlMs;
  }

  async revoke(sessionId: string): Promise<void> {
    this.entries.set(sessionId, Date.now() + this.ttlMs);
  }

  async isRevoked(sessionId: string): Promise<boolean> {
    const expiresAt = this.entries.get(sessionId);
    if (expiresAt === undefined) return false;
    // Lazy expiry — there's no timer to fire, and an entry past its TTL is
    // equivalent to absent (every access token it covered has expired too).
    if (Date.now() >= expiresAt) {
      this.entries.delete(sessionId);
      return false;
    }
    return true;
  }
}
