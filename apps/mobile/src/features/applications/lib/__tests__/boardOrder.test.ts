import { compareBoardApplications, groupByStatus } from '../boardOrder';
import type { Application } from '../../types';

function makeApp(overrides: Partial<Application>): Application {
  return {
    id: '1',
    company: 'Acme',
    role: 'Engineer',
    status: 'applied',
    jobUrl: null,
    location: null,
    salaryRange: null,
    description: null,
    appliedAt: null,
    starred: false,
    source: null,
    followUpAt: null,
    tags: [],
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    boardPosition: 0,
    likelyGhosted: false,
    ...overrides,
  };
}

describe('compareBoardApplications', () => {
  it('sorts by boardPosition ascending first', () => {
    const a = makeApp({ id: 'a', boardPosition: 1 });
    const b = makeApp({ id: 'b', boardPosition: 0 });
    expect(compareBoardApplications(a, b)).toBeGreaterThan(0);
  });

  it('breaks a boardPosition tie by newest createdAt first', () => {
    const older = makeApp({ id: 'a', boardPosition: 0, createdAt: '2026-01-01T00:00:00.000Z' });
    const newer = makeApp({ id: 'b', boardPosition: 0, createdAt: '2026-01-02T00:00:00.000Z' });
    expect(compareBoardApplications(newer, older)).toBeLessThan(0);
  });

  it('breaks a full tie by id', () => {
    const a = makeApp({ id: 'a', boardPosition: 0, createdAt: '2026-01-01T00:00:00.000Z' });
    const b = makeApp({ id: 'b', boardPosition: 0, createdAt: '2026-01-01T00:00:00.000Z' });
    expect(compareBoardApplications(a, b)).toBe(b.id.localeCompare(a.id));
  });
});

describe('groupByStatus', () => {
  it('groups applications into their status column, in board order', () => {
    const apps = [
      makeApp({ id: 'a', status: 'applied', boardPosition: 1 }),
      makeApp({ id: 'b', status: 'applied', boardPosition: 0 }),
      makeApp({ id: 'c', status: 'interviewing', boardPosition: 0 }),
    ];

    const columns = groupByStatus(apps, ['applied', 'interviewing', 'offered']);

    expect(columns.applied).toEqual(['b', 'a']);
    expect(columns.interviewing).toEqual(['c']);
    expect(columns.offered).toEqual([]);
  });
});
