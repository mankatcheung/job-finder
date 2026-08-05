import { useQuery } from '@tanstack/react-query';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { ErrorState } from '#/components/ErrorState';
import { analyticsQueryOptions } from './-analytics-queries';

const DEFAULT_STAGES = [
  ['draft', 'Draft', 'gray', 'backlog'],
  ['applied', 'Applied', 'blue', 'active'],
  ['interviewing', 'Interviewing', 'purple', 'interviewing'],
  ['offered', 'Offered', 'orange', 'offered'],
  ['accepted', 'Accepted', 'green', 'accepted'],
  ['rejected', 'Rejected', 'red', 'rejected'],
  ['withdrawn', 'Withdrawn', 'gray', 'withdrawn'],
].map(([key, name, color, category], position) => ({ key, name, color, category, position }));

const STATUS_COLORS: Record<string, string> = {
  gray: '#9ca3af',
  blue: '#3b82f6',
  purple: '#a855f7',
  orange: '#f97316',
  green: '#22c55e',
  red: '#ef4444',
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
  const stages = (data?.pipelineStages?.length ? data.pipelineStages : DEFAULT_STAGES).sort(
    (a, b) => a.position - b.position,
  );

  const weekCounts: Record<string, number> = {};
  apps.forEach((a) => {
    const w = isoWeek(new Date(a.createdAt));
    weekCounts[w] = (weekCounts[w] ?? 0) + 1;
  });
  const weeklyData = Object.entries(weekCounts)
    .sort(([a], [b]) => a.localeCompare(b))
    .slice(-12)
    .map(([week, count]) => ({ week: week.replace(/^\d{4}-/, ''), count }));

  const funnelData = stages.map((stage) => ({
    status: stage.name,
    count: apps.filter((a) => a.status === stage.key).length,
    color: STATUS_COLORS[stage.color] ?? '#3b82f6',
  }));

  const appliedOrBeyond = apps.filter(
    (a) => stages.find((stage) => stage.key === a.status)?.category !== 'backlog',
  );
  const gotResponse = appliedOrBeyond.filter((a) => {
    const category = stages.find((stage) => stage.key === a.status)?.category;
    return category !== 'active';
  });
  const responseRate =
    appliedOrBeyond.length > 0
      ? Math.round((gotResponse.length / appliedOrBeyond.length) * 100)
      : 0;

  const totalApps = apps.length;
  const activeApps = apps.filter((a) =>
    ['active', 'interviewing', 'offered'].includes(
      stages.find((stage) => stage.key === a.status)?.category ?? '',
    ),
  ).length;
  const successRate =
    totalApps > 0
      ? Math.round(
          (apps.filter(
            (a) => stages.find((stage) => stage.key === a.status)?.category === 'accepted',
          ).length /
            totalApps) *
            100,
        )
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

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: 'Total', value: totalApps },
          { label: 'Active', value: activeApps, color: 'text-blue-600' },
          { label: 'Response rate', value: `${responseRate}%`, color: 'text-purple-600' },
          { label: 'Offer rate', value: `${successRate}%`, color: 'text-green-600' },
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
                  <Cell key={entry.status} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}
