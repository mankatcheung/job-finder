import {
  buildGrid,
  buildMonthGrid,
  buildWeekGrid,
  dateFromDayKey,
  dayKey,
  goToPeriod,
} from '../calendarGrid';

describe('dayKey / dateFromDayKey', () => {
  it('round-trips a date through its key', () => {
    const date = new Date(2026, 0, 15);
    expect(dayKey(date)).toBe('2026-01-15');
    expect(dateFromDayKey('2026-01-15').getTime()).toBe(date.getTime());
  });
});

describe('buildMonthGrid', () => {
  it('returns a 42-day grid starting on the Sunday on/before the 1st', () => {
    const grid = buildMonthGrid(new Date(2026, 0, 15)); // Jan 2026 starts on a Thursday
    expect(grid).toHaveLength(42);
    expect(grid[0].getDay()).toBe(0);
    expect(dayKey(grid[4])).toBe('2026-01-01');
  });
});

describe('buildWeekGrid', () => {
  it('returns 7 days starting on Sunday of the anchor week', () => {
    const grid = buildWeekGrid(new Date(2026, 0, 15)); // Thursday
    expect(grid).toHaveLength(7);
    expect(grid[0].getDay()).toBe(0);
    expect(grid[6].getDay()).toBe(6);
  });
});

describe('buildGrid', () => {
  it('delegates to the month grid for "month"', () => {
    expect(buildGrid('month', new Date(2026, 0, 15))).toHaveLength(42);
  });

  it('delegates to the week grid for "week"', () => {
    expect(buildGrid('week', new Date(2026, 0, 15))).toHaveLength(7);
  });

  it('returns a single-day grid for "day"', () => {
    const anchor = new Date(2026, 0, 15);
    expect(buildGrid('day', anchor)).toEqual([anchor]);
  });
});

describe('goToPeriod', () => {
  it('moves by whole months in month view', () => {
    const next = goToPeriod('month', new Date(2026, 0, 15), 1);
    expect(next.getMonth()).toBe(1);
    expect(next.getDate()).toBe(1);
  });

  it('moves by 7 days in week view', () => {
    const next = goToPeriod('week', new Date(2026, 0, 15), 1);
    expect(dayKey(next)).toBe('2026-01-22');
  });

  it('moves by 1 day in day view', () => {
    const next = goToPeriod('day', new Date(2026, 0, 15), -1);
    expect(dayKey(next)).toBe('2026-01-14');
  });
});
