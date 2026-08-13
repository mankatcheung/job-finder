import { CACHE } from '#src/constants.js';

export type CircuitState = 'closed' | 'open' | 'half-open';

/** Thrown by `execute()` when the breaker is open — the wrapped call never ran. */
export class CircuitBreakerOpenError extends Error {
  constructor() {
    super('Circuit breaker is open');
    this.name = 'CircuitBreakerOpenError';
  }
}

interface Deps {
  failureThreshold?: number;
  cooldownMs?: number;
  /** Test/observability hook — fires on every state transition. */
  onStateChange?: (from: CircuitState, to: CircuitState) => void;
}

/**
 * Generic closed → open → half-open circuit breaker. Not Redis-specific —
 * wraps any async operation, failing fast (without calling the operation at
 * all) once it's decided the dependency is unhealthy, rather than making
 * every caller wait out a slow timeout individually.
 *
 * State is intentionally process-local: each instance tracks its own view of
 * "is my connection to the dependency healthy," which is the standard
 * approach for this pattern (Hystrix, resilience4j, Polly all do the same).
 * There's also no way to coordinate this via the dependency itself — using
 * Redis to track "is Redis down" would be circular.
 */
export class CircuitBreaker {
  private state: CircuitState = 'closed';
  private consecutiveFailures = 0;
  private openedAt = 0;
  private readonly failureThreshold: number;
  private readonly cooldownMs: number;
  private readonly onStateChange?: (from: CircuitState, to: CircuitState) => void;

  constructor({
    failureThreshold = CACHE.CIRCUIT_FAILURE_THRESHOLD,
    cooldownMs = CACHE.CIRCUIT_COOLDOWN_MS,
    onStateChange,
  }: Deps = {}) {
    this.failureThreshold = failureThreshold;
    this.cooldownMs = cooldownMs;
    this.onStateChange = onStateChange;
  }

  async execute<T>(fn: () => Promise<T>): Promise<T> {
    if (this.state === 'open') {
      if (Date.now() - this.openedAt < this.cooldownMs) {
        throw new CircuitBreakerOpenError();
      }
      this.transition('half-open');
    }

    try {
      const result = await fn();
      this.onSuccess();
      return result;
    } catch (err) {
      this.onFailure();
      throw err;
    }
  }

  private onSuccess(): void {
    this.consecutiveFailures = 0;
    if (this.state !== 'closed') this.transition('closed');
  }

  private onFailure(): void {
    this.consecutiveFailures++;
    // A half-open trial gets exactly one chance — any failure reopens
    // immediately rather than counting toward the full threshold again.
    if (this.state === 'half-open' || this.consecutiveFailures >= this.failureThreshold) {
      this.openedAt = Date.now();
      this.transition('open');
    }
  }

  private transition(to: CircuitState): void {
    if (to === this.state) return;
    const from = this.state;
    this.state = to;
    this.onStateChange?.(from, to);
  }
}
