// Ported from apps/web's applications/-board-move.ts — the parts that don't
// depend on dnd-kit. Mobile has no drag-and-drop; a card moves column via an
// explicit "Move to..." action instead, always landing at the end of its new
// column, so there's no in-flight reorder-within-column logic to port.
import type { Application, ApplicationStatus } from '../types';

export type BoardColumns = Record<string, string[]>;

/**
 * Board order: rank first, then newest. Every row ties at rank 0 until
 * something is moved, so before that the tiebreak alone reproduces the order
 * the board had before ranks existed — and a newly created application still
 * sorts to the top of its column.
 */
export function compareBoardApplications(a: Application, b: Application): number {
  if (a.boardPosition !== b.boardPosition) return a.boardPosition - b.boardPosition;
  const byCreated = b.createdAt.localeCompare(a.createdAt);
  if (byCreated !== 0) return byCreated;
  return b.id.localeCompare(a.id);
}

export function groupByStatus(
  apps: Application[],
  statuses: readonly ApplicationStatus[],
): BoardColumns {
  const columns: BoardColumns = Object.fromEntries(statuses.map((status) => [status, []]));
  for (const app of [...apps].sort(compareBoardApplications)) {
    columns[app.status]?.push(app.id);
  }
  return columns;
}
