import { useQuery } from '@tanstack/react-query';
import { Card } from '@job-finder/ui';
import {
  applicationChannelAnalyticsQueryOptions,
  type ApplicationGroupStat,
} from './-application-channel-analytics-queries';

// Below this many applications, response/offer rates are more noise than
// signal — flagged rather than hidden, mirroring JEF-58's small-sample
// threshold for interview rates.
const SMALL_SAMPLE_THRESHOLD = 3;

function GroupRow({ stat }: { stat: ApplicationGroupStat }) {
  const smallSample = stat.applicationCount < SMALL_SAMPLE_THRESHOLD;
  return (
    <div className="flex flex-col gap-1.5 py-2 border-b border-gray-100 dark:border-gray-700 last:border-0 sm:flex-row sm:items-center sm:gap-3">
      <span className="text-sm text-gray-900 dark:text-gray-100 truncate sm:flex-1 sm:min-w-0">
        {stat.label}
      </span>
      {/* `sm:contents` hoists these into the row above as direct flex items,
          so the fixed-width count/bar/% columns line up across every row —
          they're only wrapped together for the stacked mobile layout. */}
      <div className="flex flex-wrap items-center gap-2 sm:contents">
        <span className="shrink-0 w-14 text-xs text-gray-500 dark:text-gray-400 sm:w-16 sm:text-right">
          {stat.applicationCount} app{stat.applicationCount === 1 ? '' : 's'}
        </span>
        <div className="flex items-center gap-1.5 shrink-0 sm:gap-2">
          <div className="w-10 h-1.5 rounded-full bg-gray-100 dark:bg-gray-700 overflow-hidden sm:w-16">
            <div className="h-full bg-purple-500" style={{ width: `${stat.responseRate}%` }} />
          </div>
          <span className="w-9 text-right text-xs font-medium text-gray-700 dark:text-gray-300 sm:w-10">
            {stat.responseRate}%
          </span>
        </div>
        <div className="flex items-center gap-1.5 shrink-0 sm:gap-2">
          <div className="w-10 h-1.5 rounded-full bg-gray-100 dark:bg-gray-700 overflow-hidden sm:w-16">
            <div className="h-full bg-green-500" style={{ width: `${stat.offerRate}%` }} />
          </div>
          <span className="w-9 text-right text-xs font-medium text-gray-700 dark:text-gray-300 sm:w-10">
            {stat.offerRate}%
          </span>
        </div>
        {smallSample && (
          <span className="shrink-0 text-[10px] text-gray-400 dark:text-gray-500 sm:whitespace-nowrap">
            small sample
          </span>
        )}
      </div>
    </div>
  );
}

/**
 * Application.source and Application.tags are captured on every
 * application and, until now, never aggregated anywhere on the Analytics
 * page — this answers "which channel/tag is actually working for me."
 * Fetches independently and degrades silently on error, same as the other
 * analytics panels — this is a supplementary insight, not critical path.
 */
export function ApplicationChannelAnalyticsPanel() {
  const { data, isLoading } = useQuery(applicationChannelAnalyticsQueryOptions);

  if (isLoading) {
    return <div className="h-48 bg-gray-100 dark:bg-gray-800 rounded-xl animate-pulse" />;
  }

  const analytics = data?.applicationChannelAnalytics;
  if (!analytics) return null;

  return (
    <Card className="p-6">
      <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">
        Source &amp; tag performance
      </h2>
      <p className="text-xs text-gray-400 dark:text-gray-500 mb-4">
        Response rate and offer rate by where an application came from and how it&apos;s tagged.
      </p>

      <div className="mb-6">
        <h3 className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2">By source</h3>
        {analytics.bySource.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-6">
            Add a source when logging an application to see performance by channel here.
          </p>
        ) : (
          <div className="space-y-1">
            {analytics.bySource.map((stat) => (
              <GroupRow key={stat.label} stat={stat} />
            ))}
          </div>
        )}
      </div>

      <div>
        <h3 className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2">By tag</h3>
        {analytics.byTag.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-6">
            Add tags to your applications to see performance by tag here.
          </p>
        ) : (
          <div className="space-y-1">
            {analytics.byTag.map((stat) => (
              <GroupRow key={stat.label} stat={stat} />
            ))}
          </div>
        )}
      </div>
    </Card>
  );
}
