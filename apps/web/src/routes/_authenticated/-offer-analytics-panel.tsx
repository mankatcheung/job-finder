import { useQuery } from '@tanstack/react-query';
import { Card } from '@job-finder/ui';
import { offerAnalyticsQueryOptions } from './-offer-analytics-queries';

function formatCurrency(amount: number, currency: string): string {
  try {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
      maximumFractionDigits: 0,
    }).format(amount);
  } catch {
    // currency is free text with no ISO-4217 enforcement — fall back to a
    // plain number with the raw currency label if Intl rejects it.
    return `${Math.round(amount).toLocaleString()} ${currency}`;
  }
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

/**
 * Offer is a full domain entity (base salary, bonus, equity, benefits,
 * currency, pay period) and until now had zero cross-application view —
 * CompareOffersUseCase only compares offers within a single application.
 * This shows every offer ever logged as a chronological trend, plus
 * min/max/median/average stats grouped by currency (no FX conversion is
 * attempted, so offers in different currencies are never mixed together).
 * Fetches independently and degrades silently on error, same as the other
 * analytics panels — this is a supplementary insight, not critical path.
 */
export function OfferAnalyticsPanel() {
  const { data, isLoading } = useQuery(offerAnalyticsQueryOptions);

  if (isLoading) {
    return <div className="h-48 bg-gray-100 dark:bg-gray-800 rounded-xl animate-pulse" />;
  }

  const analytics = data?.offerAnalytics;
  if (!analytics) return null;

  return (
    <Card className="p-6">
      <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">
        Compensation trends
      </h2>
      <p className="text-xs text-gray-400 dark:text-gray-500 mb-4">
        Offers over time, annualized for comparison across pay periods.
      </p>

      {analytics.byCurrency.length === 0 ? (
        <p className="text-sm text-gray-400 text-center py-8">
          Log an offer on an application to see compensation trends here.
        </p>
      ) : (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
            {analytics.byCurrency.map((stat) => (
              <div key={stat.currency}>
                <p className="text-xs text-gray-400 dark:text-gray-500 mb-1">
                  {stat.currency} median ({stat.count})
                </p>
                <p className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                  {formatCurrency(stat.medianYearlySalary, stat.currency)}
                </p>
                <p className="text-[10px] text-gray-400 dark:text-gray-500">
                  {formatCurrency(stat.minYearlySalary, stat.currency)} –{' '}
                  {formatCurrency(stat.maxYearlySalary, stat.currency)}
                </p>
              </div>
            ))}
          </div>

          <div className="space-y-1">
            {analytics.trend.map((point) => (
              <div
                key={point.offerId}
                className="flex items-center gap-3 py-2 border-b border-gray-100 dark:border-gray-700 last:border-0"
              >
                <span className="w-24 shrink-0 text-xs text-gray-400 dark:text-gray-500">
                  {formatDate(point.createdAt)}
                </span>
                <span className="flex-1 min-w-0 text-sm text-gray-900 dark:text-gray-100 truncate">
                  {point.company}
                  <span className="text-gray-400 dark:text-gray-500"> · {point.role}</span>
                </span>
                <span className="shrink-0 text-sm font-medium text-gray-700 dark:text-gray-300">
                  {formatCurrency(point.normalizedYearlySalary, point.currency)}
                </span>
              </div>
            ))}
          </div>
        </>
      )}
    </Card>
  );
}
