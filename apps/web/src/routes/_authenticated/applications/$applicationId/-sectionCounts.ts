import type { QueryClient } from '@tanstack/react-query';

/**
 * The section index badges are their own cache entry (the detail page holds
 * the query), so anything that adds or removes a note, interview, contact,
 * document, draft or offer has to nudge it — otherwise the badge keeps saying
 * 3 over a list showing 2 (JEF-208).
 *
 * The key lives here rather than at each call site so a rename cannot leave
 * one tab quietly invalidating nothing.
 */
export const sectionCountsQueryKey = (applicationId: string) =>
  ['sectionCounts', applicationId] as const;

export function invalidateSectionCounts(qc: QueryClient, applicationId: string): Promise<void> {
  return qc.invalidateQueries({ queryKey: sectionCountsQueryKey(applicationId) });
}
