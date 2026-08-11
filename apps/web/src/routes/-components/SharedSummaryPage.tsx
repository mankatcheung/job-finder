import { useQuery } from '@tanstack/react-query';
import { useSearch } from '@tanstack/react-router';
import { gqlClient } from '#/graphql/client';
import { Alert } from '@job-finder/ui';

const SHARED_SUMMARY_QUERY = `
  query SharedSummary($token: String!) {
    sharedSummary(token: $token) {
      statusCounts {
        status
        count
      }
      totalApplications
      totalInterviews
      upcomingInterviews
      applicationsUpdatedLast7Days
      generatedAt
    }
  }
`;

interface StatusCount {
  status: string;
  count: number;
}

interface SharedSummary {
  statusCounts: StatusCount[];
  totalApplications: number;
  totalInterviews: number;
  upcomingInterviews: number;
  applicationsUpdatedLast7Days: number;
  generatedAt: string;
}

const STATUS_LABEL: Record<string, string> = {
  draft: 'Draft',
  applied: 'Applied',
  interviewing: 'Interviewing',
  offered: 'Offered',
  accepted: 'Accepted',
  rejected: 'Rejected',
  withdrawn: 'Withdrawn',
};

export function SharedSummaryPage() {
  const { token } = useSearch({ from: '/share' });

  const { data, isLoading } = useQuery({
    queryKey: ['sharedSummary', token],
    queryFn: () =>
      gqlClient.request<{ sharedSummary: SharedSummary | null }>(SHARED_SUMMARY_QUERY, { token }),
    enabled: Boolean(token),
  });

  const summary = data?.sharedSummary;

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 px-4 py-12">
      <div className="w-full max-w-lg bg-white dark:bg-gray-800 rounded-xl shadow-sm p-8 space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            Job search summary
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            A read-only, summary-level view shared via job-finder.
          </p>
        </div>

        {!token ? (
          <Alert>This link is missing a token.</Alert>
        ) : isLoading ? (
          <p className="text-sm text-gray-500 dark:text-gray-400">Loading…</p>
        ) : !summary ? (
          <Alert>This link is invalid or has been revoked.</Alert>
        ) : (
          <>
            <div className="grid grid-cols-2 gap-4">
              <SummaryStat label="Applications" value={summary.totalApplications} />
              <SummaryStat label="Interviews" value={summary.totalInterviews} />
              <SummaryStat label="Upcoming interviews" value={summary.upcomingInterviews} />
              <SummaryStat
                label="Updated in the last 7 days"
                value={summary.applicationsUpdatedLast7Days}
              />
            </div>

            <div>
              <h2 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-2">
                By status
              </h2>
              <ul className="divide-y divide-gray-200 dark:divide-gray-700 rounded-lg border border-gray-200 dark:border-gray-700">
                {summary.statusCounts.map((sc) => (
                  <li
                    key={sc.status}
                    className="flex items-center justify-between px-3 py-2 text-sm"
                  >
                    <span className="text-gray-700 dark:text-gray-300">
                      {STATUS_LABEL[sc.status] ?? sc.status}
                    </span>
                    <span className="font-medium text-gray-900 dark:text-gray-100">{sc.count}</span>
                  </li>
                ))}
              </ul>
            </div>

            <p className="text-xs text-gray-400">
              Generated {new Date(summary.generatedAt).toLocaleString()}
            </p>
          </>
        )}
      </div>
    </div>
  );
}

function SummaryStat({ label, value }: { label: string; value: number }) {
  return (
    <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4">
      <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{value}</p>
      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{label}</p>
    </div>
  );
}
