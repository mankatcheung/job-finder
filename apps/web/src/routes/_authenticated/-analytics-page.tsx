import { useQuery } from '@tanstack/react-query';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { ErrorState } from '#/components/ErrorState';
import type { ApplicationStatus } from '#/graphql/generated/graphql';
import { analyticsQueryOptions } from './-analytics-queries';
import { DocumentVersionOutcomesPanel } from './-document-version-outcomes-panel';

const STAGE_ORDER: ApplicationStatus[] = [
  'draft',
  'applied',
  'interviewing',
  'offered',
  'accepted',
  'rejected',
  'withdrawn',
];

const STATUS_COLORS: Record<string, string> = {
  draft: '#9ca3af',
  applied: '#3b82f6',
  interviewing: '#a855f7',
  offered: '#f97316',
  accepted: '#22c55e',
  rejected: '#ef4444',
  withdrawn: '#6b7280',
};

function isoWeek(date: Date): string {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() + 3 - ((d.getDay() + 6) % 7));
  const week1 = new Date(d.getFullYear(), 0, 4);
  const weekNum =
    1 +
    Math.round(((d.getTime() - week1.getTime()) / 86400000 - 3 + ((week1.getDay() + 6) % 7)) / 7);
  return `${d.getFullYear()}-W${String(weekNum).padStart(2, '0')}`;
}

export function AnalyticsPage() {
  const { data, isLoading, isError, error, refetch } = useQuery(analyticsQueryOptions);

  const apps = data?.applications ?? [];

  const weekCounts: Record<string, number> = {};
  apps.forEach((a) => {
    const w = isoWeek(new Date(a.createdAt));
    weekCounts[w] = (weekCounts[w] ?? 0) + 1;
  });
  const weeklyData = Object.entries(weekCounts)
    .sort(([a], [b]) => a.localeCompare(b))
    .slice(-12)
    .map(([week, count]) => ({ week: week.replace(/^\d{4}-/, ''), count }));

  const funnelData = STAGE_ORDER.map((status) => ({
    status,
    count: apps.filter((a) => a.status === status).length,
  }));

  const appliedOrBeyond = apps.filter((a) => a.status !== 'draft');
  const gotResponse = appliedOrBeyond.filter((a) => !['applied', 'draft'].includes(a.status));
  const responseRate =
    appliedOrBeyond.length > 0
      ? Math.round((gotResponse.length / appliedOrBeyond.length) * 100)
      : 0;

  // Distinct from responseRate above: an explicit rejection still counts as
  // a "response" there, but shouldn't count as ghosting. likelyGhosted is
  // already computed server-side per application (JEF-57) — this just
  // rolls it up into a rate over the same appliedOrBeyond denominator.
  const ghostedApps = appliedOrBeyond.filter((a) => a.likelyGhosted);
  const ghostingRate =
    appliedOrBeyond.length > 0
      ? Math.round((ghostedApps.length / appliedOrBeyond.length) * 100)
      : 0;

  const totalApps = apps.length;
  const activeApps = apps.filter((a) =>
    ['applied', 'interviewing', 'offered'].includes(a.status),
  ).length;
  const successRate =
    totalApps > 0
      ? Math.round((apps.filter((a) => a.status === 'accepted').length / totalApps) * 100)
      : 0;

  const tooltipStyle = {
    backgroundColor: 'var(--tooltip-bg, #1f2937)',
    border: 'none',
    borderRadius: '8px',
    color: '#f9fafb',
    fontSize: '12px',
  };

  if (isLoading) {
    return (
      <div className="p-4 sm:p-8 max-w-5xl mx-auto space-y-6">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-64 bg-gray-100 dark:bg-gray-800 rounded-xl animate-pulse" />
        ))}
      </div>
    );
  }

  if (isError) {
    return (
      <div className="p-4 sm:p-8 max-w-5xl mx-auto">
        <ErrorState error={error} onRetry={() => refetch()} />
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-8 max-w-5xl mx-auto space-y-8">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Analytics</h1>

      <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
        {[
          { label: 'Total', value: totalApps },
          { label: 'Active', value: activeApps, color: 'text-blue-600' },
          { label: 'Response rate', value: `${responseRate}%`, color: 'text-purple-600' },
          { label: 'Offer rate', value: `${successRate}%`, color: 'text-green-600' },
          { label: 'Ghosting rate', value: `${ghostingRate}%`, color: 'text-gray-500' },
        ].map(({ label, value, color }) => (
          <div
            key={label}
            className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4"
          >
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">{label}</p>
            <p className={`text-2xl font-bold ${color ?? 'text-gray-900 dark:text-gray-100'}`}>
              {value}
            </p>
          </div>
        ))}
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
        <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4">
          Applications per week
        </h2>
        {weeklyData.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-8">No data yet.</p>
        ) : (
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={weeklyData} margin={{ top: 0, right: 0, bottom: 0, left: -20 }}>
              <XAxis dataKey="week" tick={{ fontSize: 11, fill: '#9ca3af' }} />
              <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: '#9ca3af' }} />
              <Tooltip contentStyle={tooltipStyle} />
              <Bar dataKey="count" fill="#3b82f6" radius={[4, 4, 0, 0]} name="Applications" />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
        <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4">
          Stage funnel
        </h2>
        {apps.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-8">No data yet.</p>
        ) : (
          <ResponsiveContainer width="100%" height={220}>
            <BarChart
              data={funnelData}
              layout="vertical"
              margin={{ top: 0, right: 16, bottom: 0, left: 64 }}
            >
              <XAxis type="number" allowDecimals={false} tick={{ fontSize: 11, fill: '#9ca3af' }} />
              <YAxis type="category" dataKey="status" tick={{ fontSize: 11, fill: '#9ca3af' }} />
              <Tooltip contentStyle={tooltipStyle} />
              <Bar dataKey="count" radius={[0, 4, 4, 0]} name="Applications">
                {funnelData.map((entry) => (
                  <Cell key={entry.status} fill={STATUS_COLORS[entry.status] ?? '#3b82f6'} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>

      <DocumentVersionOutcomesPanel />
    </div>
  );
}
