// Ported from apps/web's apps/web/src/routes/_authenticated/calendar.tsx —
// same day-key/grid-building logic, kept in local time (not UTC) so a day
// boundary matches what the device's clock shows, not UTC midnight.
import type { CalendarViewMode } from '../types';

export function dayKey(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function dateFromDayKey(key: string): Date {
  const [y, m, d] = key.split('-').map(Number);
  return new Date(y, m - 1, d);
}

export function buildMonthGrid(anchor: Date): Date[] {
  const year = anchor.getFullYear();
  const month = anchor.getMonth();
  const firstOfMonth = new Date(year, month, 1);
  const gridStart = new Date(year, month, 1 - firstOfMonth.getDay());
  return Array.from({ length: 42 }, (_, i) => {
    const d = new Date(gridStart);
    d.setDate(gridStart.getDate() + i);
    return d;
  });
}

export function buildWeekGrid(anchor: Date): Date[] {
  const weekStart = new Date(anchor);
  weekStart.setDate(anchor.getDate() - anchor.getDay());
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(weekStart);
    d.setDate(weekStart.getDate() + i);
    return d;
  });
}

export function buildGrid(viewMode: CalendarViewMode, anchor: Date): Date[] {
  if (viewMode === 'month') return buildMonthGrid(anchor);
  if (viewMode === 'week') return buildWeekGrid(anchor);
  return [anchor];
}

export function goToPeriod(viewMode: CalendarViewMode, anchor: Date, delta: number): Date {
  if (viewMode === 'month') return new Date(anchor.getFullYear(), anchor.getMonth() + delta, 1);
  const d = new Date(anchor);
  d.setDate(anchor.getDate() + delta * (viewMode === 'week' ? 7 : 1));
  return d;
}
