import {
  buildFunnelData,
  buildWeeklyData,
  computeSummaryStats,
  isoWeek,
} from '../analyticsSummary';
import type { AnalyticsApplication } from '../../types';

function makeApp(overrides: Partial<AnalyticsApplication>): AnalyticsApplication {
  return {
    id: '1',
    company: 'Acme',
    role: 'Engineer',
    status: 'applied',
    appliedAt: null,
    createdAt: '2026-01-01T00:00:00.000Z',
    likelyGhosted: false,
    ...overrides,
  };
}

describe('isoWeek', () => {
  it('buckets a date into its ISO week', () => {
    expect(isoWeek(new Date(2026, 0, 5))).toBe('2026-W02');
  });
});

describe('buildWeeklyData', () => {
  it('counts applications per ISO week, sorted ascending, capped at 12 weeks', () => {
    const apps = [
      makeApp({ id: '1', createdAt: '2026-01-05T00:00:00.000Z' }),
      makeApp({ id: '2', createdAt: '2026-01-06T00:00:00.000Z' }),
      makeApp({ id: '3', createdAt: '2026-01-12T00:00:00.000Z' }),
    ];

    const data = buildWeeklyData(apps);

    expect(data).toEqual([
      { week: 'W02', count: 2 },
      { week: 'W03', count: 1 },
    ]);
  });
});

describe('buildFunnelData', () => {
  it('counts applications per status across every known status', () => {
    const apps = [
      makeApp({ id: '1', status: 'applied' }),
      makeApp({ id: '2', status: 'applied' }),
      makeApp({ id: '3', status: 'interviewing' }),
    ];

    const data = buildFunnelData(apps);

    expect(data.find((f) => f.status === 'applied')?.count).toBe(2);
    expect(data.find((f) => f.status === 'interviewing')?.count).toBe(1);
    expect(data.find((f) => f.status === 'draft')?.count).toBe(0);
  });
});

describe('computeSummaryStats', () => {
  it('computes response/success/ghosting rates over the applied-or-beyond denominator', () => {
    const apps = [
      makeApp({ id: '1', status: 'draft' }),
      makeApp({ id: '2', status: 'applied' }),
      makeApp({ id: '3', status: 'interviewing' }),
      makeApp({ id: '4', status: 'accepted' }),
      makeApp({ id: '5', status: 'applied', likelyGhosted: true }),
    ];

    const stats = computeSummaryStats(apps);

    // appliedOrBeyond = 4 (excludes draft); gotResponse = interviewing+accepted = 2
    expect(stats.totalApps).toBe(5);
    expect(stats.activeApps).toBe(3); // both 'applied' rows + the 'interviewing' row
    expect(stats.responseRate).toBe(50); // 2/4
    expect(stats.successRate).toBe(20); // 1/5 accepted
    expect(stats.ghostingRate).toBe(25); // 1/4 likelyGhosted
  });

  it('returns zero rates when there are no applications', () => {
    expect(computeSummaryStats([])).toEqual({
      totalApps: 0,
      activeApps: 0,
      responseRate: 0,
      successRate: 0,
      ghostingRate: 0,
    });
  });
});
