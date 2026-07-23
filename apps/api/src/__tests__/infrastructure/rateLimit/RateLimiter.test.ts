import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { RateLimiter } from '@/infrastructure/rateLimit/RateLimiter.js';

describe('RateLimiter', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2024-01-01T00:00:00.000Z'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('allows requests up to the configured maximum within the window', () => {
    const limiter = new RateLimiter(3, 60_000);

    expect(limiter.consume('key-1')).toBe(true);
    expect(limiter.consume('key-1')).toBe(true);
    expect(limiter.consume('key-1')).toBe(true);
  });

  it('rejects requests once the maximum is exceeded within the window', () => {
    const limiter = new RateLimiter(2, 60_000);

    expect(limiter.consume('key-1')).toBe(true);
    expect(limiter.consume('key-1')).toBe(true);
    expect(limiter.consume('key-1')).toBe(false);
  });

  it('tracks separate keys independently', () => {
    const limiter = new RateLimiter(1, 60_000);

    expect(limiter.consume('key-1')).toBe(true);
    expect(limiter.consume('key-2')).toBe(true);
    expect(limiter.consume('key-1')).toBe(false);
    expect(limiter.consume('key-2')).toBe(false);
  });

  it('resets the count once the window has elapsed', () => {
    const limiter = new RateLimiter(1, 60_000);

    expect(limiter.consume('key-1')).toBe(true);
    expect(limiter.consume('key-1')).toBe(false);

    vi.advanceTimersByTime(60_001);

    expect(limiter.consume('key-1')).toBe(true);
  });
});
