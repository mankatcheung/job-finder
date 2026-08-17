import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  CircuitBreaker,
  CircuitBreakerOpenError,
} from '#src/infrastructure/cache/CircuitBreaker.js';

function makeBreaker(overrides: Partial<{ failureThreshold: number; cooldownMs: number }> = {}) {
  const onStateChange = vi.fn();
  const breaker = new CircuitBreaker({
    failureThreshold: 3,
    cooldownMs: 1000,
    ...overrides,
    onStateChange,
  });
  return { breaker, onStateChange };
}

describe('CircuitBreaker', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('starts closed and returns the result of a successful call', async () => {
    const { breaker } = makeBreaker();
    const result = await breaker.execute(() => Promise.resolve('ok'));
    expect(result).toBe('ok');
  });

  it('stays closed across repeated successes', async () => {
    const { breaker, onStateChange } = makeBreaker();
    for (let i = 0; i < 10; i++) await breaker.execute(() => Promise.resolve('ok'));
    expect(onStateChange).not.toHaveBeenCalled();
  });

  it('propagates the real error on each failure while still closed', async () => {
    const { breaker } = makeBreaker({ failureThreshold: 3 });
    await expect(breaker.execute(() => Promise.reject(new Error('boom')))).rejects.toThrow('boom');
    await expect(breaker.execute(() => Promise.reject(new Error('boom')))).rejects.toThrow('boom');
  });

  it('opens after reaching the failure threshold and short-circuits without calling fn', async () => {
    const { breaker, onStateChange } = makeBreaker({ failureThreshold: 3 });
    const fn = vi.fn(() => Promise.reject(new Error('boom')));

    await expect(breaker.execute(fn)).rejects.toThrow('boom');
    await expect(breaker.execute(fn)).rejects.toThrow('boom');
    await expect(breaker.execute(fn)).rejects.toThrow('boom'); // 3rd failure trips it open
    expect(fn).toHaveBeenCalledTimes(3);
    expect(onStateChange).toHaveBeenCalledWith('closed', 'open');

    await expect(breaker.execute(fn)).rejects.toBeInstanceOf(CircuitBreakerOpenError);
    expect(fn).toHaveBeenCalledTimes(3); // not called a 4th time
  });

  it('stays open until the cooldown elapses', async () => {
    const { breaker } = makeBreaker({ failureThreshold: 1, cooldownMs: 1000 });
    await expect(breaker.execute(() => Promise.reject(new Error('boom')))).rejects.toThrow('boom');

    vi.advanceTimersByTime(999);
    await expect(breaker.execute(() => Promise.resolve('ok'))).rejects.toBeInstanceOf(
      CircuitBreakerOpenError,
    );
  });

  it('allows one half-open trial through after the cooldown elapses, and closes on success', async () => {
    const { breaker, onStateChange } = makeBreaker({ failureThreshold: 1, cooldownMs: 1000 });
    await expect(breaker.execute(() => Promise.reject(new Error('boom')))).rejects.toThrow('boom');

    vi.advanceTimersByTime(1000);
    const result = await breaker.execute(() => Promise.resolve('recovered'));

    expect(result).toBe('recovered');
    expect(onStateChange).toHaveBeenCalledWith('open', 'half-open');
    expect(onStateChange).toHaveBeenCalledWith('half-open', 'closed');
  });

  it('reopens immediately if the half-open trial fails, without needing the full threshold again', async () => {
    const { breaker, onStateChange } = makeBreaker({ failureThreshold: 3, cooldownMs: 1000 });
    const fn = vi.fn(() => Promise.reject(new Error('boom')));

    await expect(breaker.execute(fn)).rejects.toThrow('boom');
    await expect(breaker.execute(fn)).rejects.toThrow('boom');
    await expect(breaker.execute(fn)).rejects.toThrow('boom'); // opens (3 failures)

    vi.advanceTimersByTime(1000);
    await expect(breaker.execute(fn)).rejects.toThrow('boom'); // half-open trial fails
    expect(onStateChange).toHaveBeenCalledWith('half-open', 'open');

    // Back in the open state immediately — no further calls until a fresh cooldown.
    await expect(breaker.execute(fn)).rejects.toBeInstanceOf(CircuitBreakerOpenError);
  });

  it('resets the cooldown timer on a half-open trial failure', async () => {
    const { breaker } = makeBreaker({ failureThreshold: 1, cooldownMs: 1000 });
    await expect(breaker.execute(() => Promise.reject(new Error('boom')))).rejects.toThrow('boom');

    vi.advanceTimersByTime(1000);
    await expect(breaker.execute(() => Promise.reject(new Error('still down')))).rejects.toThrow(
      'still down',
    );

    // Only 500ms into the *new* cooldown — should still be open.
    vi.advanceTimersByTime(500);
    await expect(breaker.execute(() => Promise.resolve('ok'))).rejects.toBeInstanceOf(
      CircuitBreakerOpenError,
    );

    vi.advanceTimersByTime(500);
    await expect(breaker.execute(() => Promise.resolve('ok'))).resolves.toBe('ok');
  });

  it('resets the consecutive-failure count on any success', async () => {
    const { breaker } = makeBreaker({ failureThreshold: 3 });
    await expect(breaker.execute(() => Promise.reject(new Error('boom')))).rejects.toThrow('boom');
    await expect(breaker.execute(() => Promise.reject(new Error('boom')))).rejects.toThrow('boom');
    await breaker.execute(() => Promise.resolve('ok')); // resets the streak

    const fn = vi.fn(() => Promise.reject(new Error('boom')));
    await expect(breaker.execute(fn)).rejects.toThrow('boom');
    await expect(breaker.execute(fn)).rejects.toThrow('boom');
    // Only 2 consecutive failures since the reset — still closed, fn still gets called.
    expect(fn).toHaveBeenCalledTimes(2);
  });
});
