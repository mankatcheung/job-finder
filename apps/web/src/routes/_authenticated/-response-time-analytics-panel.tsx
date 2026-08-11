import { useQuery } from '@tanstack/react-query';
import { Card } from '@job-finder/ui';
import { responseTimeAnalyticsQueryOptions } from './-response-time-analytics-queries';

const STATUS_LABEL: Record<string, string> = {
  draft: 'Draft',
  applied: 'Applied',
  interviewing: 'Interviewing',
  offered: 'Offered',
  accepted: 'Accepted',
  rejected: 'Rejected',
  withdrawn: 'Withdrawn',
};

// Below this many completed stage exits, a duration is more noise than
// signal — flagged rather than hidden, mirroring JEF-58's small-sample
// threshold for interview rates.
const SMALL_SAMPLE_THRESHOLD = 3;

function formatDays(n: number | null): string {
  if (n === null) return '—';
  return `${n < 10 ? n.toFixed(1) : Math.round(n)}d`;
}

/**
 * ActivityLog's timestamped status_changed events are otherwise only ever
 * read one application at a time (the activity feed) — this aggregates
 * them into two views: how long applications typically sit in each stage
 * before moving on, and how long it takes to hear back after applying.
 * Fetches independently and degrades silently on error, same as the other
 * analytics panels — this is a supplementary insight, not critical path.
 */
export function ResponseTimeAnalyticsPanel() {
  const { data, isLoading } = useQuery(responseTimeAnalyticsQueryOptions);

  if (isLoading) {
    return <div className="h-48 bg-gray-100 dark:bg-gray-800 rounded-xl animate-pulse" />;
  }

  const analytics = data?.responseTimeAnalytics;
  if (!analytics) return null;

  const maxMedian = Math.max(1, ...analytics.timeInStage.map((s) => s.medianDays ?? 0));

  return (
    <Card className="p-6">
      <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">
        Time to respond
      </h2>
      <p className="text-xs text-gray-400 dark:text-gray-500 mb-4">
        How long applications typically sit in each stage, and how long it takes to hear back after
        applying.
      </p>

      <div className="mb-6">
        <p className="text-xs text-gray-400 dark:text-gray-500 mb-1">Time to first response</p>
        <p className="text-lg font-semibold text-gray-900 dark:text-gray-100">
          {formatDays(analytics.timeToFirstResponse.medianDays)}{' '}
          <span className="text-xs font-normal text-gray-400">median</span>
        </p>
        <p className="text-[10px] text-gray-400 dark:text-gray-500">
          {analytics.timeToFirstResponse.sampleSize > 0
            ? `${analytics.timeToFirstResponse.sampleSize} application${analytics.timeToFirstResponse.sampleSize === 1 ? '' : 's'}`
            : 'No responses yet'}
        </p>
      </div>

      {analytics.timeInStage.length === 0 ? (
        <p className="text-sm text-gray-400 text-center py-8">
          Once applications move between stages, time spent in each stage shows up here.
        </p>
      ) : (
        <div className="space-y-3">
          {analytics.timeInStage.map((stat) => {
            const smallSample = stat.sampleSize < SMALL_SAMPLE_THRESHOLD;
            const widthPercent = ((stat.medianDays ?? 0) / maxMedian) * 100;
            return (
              <div
                key={stat.status}
                className="flex items-center gap-3 py-2 border-b border-gray-100 dark:border-gray-700 last:border-0"
              >
                <span className="w-24 shrink-0 text-sm text-gray-900 dark:text-gray-100">
                  {STATUS_LABEL[stat.status] ?? stat.status}
                </span>
                <div className="flex-1 h-1.5 rounded-full bg-gray-100 dark:bg-gray-700 overflow-hidden">
                  <div className="h-full bg-blue-500" style={{ width: `${widthPercent}%` }} />
                </div>
                <span className="shrink-0 w-12 text-right text-xs font-medium text-gray-700 dark:text-gray-300">
                  {formatDays(stat.medianDays)}
                </span>
                {smallSample && (
                  <span className="shrink-0 text-[10px] text-gray-400 dark:text-gray-500">
                    small sample
                  </span>
                )}
              </div>
            );
          })}
        </div>
      )}
    </Card>
  );
}
