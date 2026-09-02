/**
 * The monthly-token-limit policy, in one place (JEF-258).
 *
 * Two callers have to agree on it: `GetLlmUsageSummaryUseCase`, which tells
 * the user how much of their limit is gone, and the provider factory, which
 * refuses a key that has passed it. If they computed the month boundary or
 * the comparison separately, a user could watch a meter read 1.9M of 2M
 * while every AI call was already being refused.
 */

/**
 * Start of the calendar month containing `now`, in UTC — matching how
 * `LlmUsageEvent.createdAt` is stored.
 *
 * Usage resets monthly by construction: there is nothing to sum before the
 * 1st, so no cron job and no deletion are involved.
 */
export function startOfUtcMonth(now: Date): Date {
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
}

/**
 * Whether a key with this limit has spent it.
 *
 * A limit can only be checked *before* a call, while the tokens it costs are
 * known only after — so a single long turn can end above the ceiling. This is
 * deliberately a stop-line rather than a hard cap: `>=` means the key is
 * refused from the moment it reaches the limit, and the overshoot from the
 * turn that crossed it stands. The UI says "paused once you pass your limit"
 * rather than implying an exact cut-off.
 *
 * A null limit is no limit, which is every key's default.
 */
export function isLimitReached(usedTokens: number, monthlyTokenLimit: number | null): boolean {
  if (monthlyTokenLimit === null) return false;
  return usedTokens >= monthlyTokenLimit;
}
