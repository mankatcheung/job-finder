import { useQuery } from '@tanstack/react-query';
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
    <div className="flex items-center gap-3 py-2 border-b border-gray-100 dark:border-gray-700 last:border-0">
      <span className="flex-1 min-w-0 text-sm text-gray-900 dark:text-gray-100 truncate">
        {stat.label}
      </span>
      <span className="shrink-0 text-xs text-gray-500 dark:text-gray-400">
        {stat.applicationCount} app{stat.applicationCount === 1 ? '' : 's'}
      </span>
      <div className="shrink-0 w-16 h-1.5 rounded-full bg-gray-100 dark:bg-gray-700 overflow-hidden">
        <div className="h-full bg-purple-500" style={{ width: `${stat.responseRate}%` }} />
      </div>
      <span className="shrink-0 w-10 text-right text-xs font-medium text-gray-700 dark:text-gray-300">
        {stat.responseRate}%
      </span>
      <div className="shrink-0 w-16 h-1.5 rounded-full bg-gray-100 dark:bg-gray-700 overflow-hidden">
        <div className="h-full bg-green-500" style={{ width: `${stat.offerRate}%` }} />
      </div>
      <span className="shrink-0 w-10 text-right text-xs font-medium text-gray-700 dark:text-gray-300">
        {stat.offerRate}%
      </span>
      {smallSample && (
        <span className="shrink-0 text-[10px] text-gray-400 dark:text-gray-500">small sample</span>
      )}
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
    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
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
    </div>
  );
}
