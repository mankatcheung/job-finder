import { describe, it, expect, vi, afterEach } from 'vitest';
import { MemorySessionBlocklist } from '#src/infrastructure/sessionBlocklist/MemorySessionBlocklist.js';

describe('MemorySessionBlocklist', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it('reports a revoked session as revoked', async () => {
    const blocklist = new MemorySessionBlocklist();

    await blocklist.revoke('session-1');

    expect(await blocklist.isRevoked('session-1')).toBe(true);
  });

  it('reports an unknown session as not revoked', async () => {
    const blocklist = new MemorySessionBlocklist();

    expect(await blocklist.isRevoked('never-seen')).toBe(false);
  });

  it('only blocks the session it was given', async () => {
    const blocklist = new MemorySessionBlocklist();

    await blocklist.revoke('session-1');

    expect(await blocklist.isRevoked('session-2')).toBe(false);
  });

  it('expires an entry once its TTL elapses, since by then every access token it covered has expired too', async () => {
    vi.useFakeTimers();
    const blocklist = new MemorySessionBlocklist({ ttlMs: 15 * 60 * 1000 });
    await blocklist.revoke('session-1');

    vi.advanceTimersByTime(15 * 60 * 1000 - 1);
    expect(await blocklist.isRevoked('session-1')).toBe(true);

    vi.advanceTimersByTime(2);
    expect(await blocklist.isRevoked('session-1')).toBe(false);
  });

  it('evicts the oldest entries past its cap rather than growing without bound', async () => {
    const blocklist = new MemorySessionBlocklist({ maxEntries: 2 });

    await blocklist.revoke('session-1');
    await blocklist.revoke('session-2');
    await blocklist.revoke('session-3');

    expect(await blocklist.isRevoked('session-1')).toBe(false);
    expect(await blocklist.isRevoked('session-2')).toBe(true);
    expect(await blocklist.isRevoked('session-3')).toBe(true);
  });
});
