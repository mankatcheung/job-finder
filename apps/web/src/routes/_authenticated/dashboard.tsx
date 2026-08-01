import { createFileRoute, Link } from '@tanstack/react-router';
import { queryOptions, useQuery } from '@tanstack/react-query';
import { gqlClient } from '#/graphql/client';
import { ErrorState } from '#/components/ErrorState';
import {
  AlertCircleIcon,
  BriefcaseIcon,
  CheckCircleIcon,
  ClockIcon,
  FileTextIcon,
  StarIcon,
} from 'lucide-react';

const APPLICATIONS_QUERY = `
  query Applications {
    applications {
      id
      company
      role
      status
      starred
      followUpAt
      createdAt
    }
  }
`;

type Application = {
  id: string;
  company: string;
  role: string;
  status: string;
  starred: boolean;
  followUpAt?: string | null;
  createdAt: string;
};

const applicationsQueryOptions = queryOptions({
  queryKey: ['applications'],
  queryFn: () => gqlClient.request<{ applications: Application[] }>(APPLICATIONS_QUERY),
});

export const Route = createFileRoute('/_authenticated/dashboard')({
  loader: ({ context: { queryClient } }) => queryClient.ensureQueryData(applicationsQueryOptions),
  component: DashboardPage,
});

export function DashboardPage() {
  const { data, isLoading, isError, error, refetch } = useQuery(applicationsQueryOptions);

  const apps = data?.applications ?? [];
  const now = new Date();
  const counts = {
    total: apps.length,
    applied: apps.filter((a) => a.status === 'applied').length,
    interviewing: apps.filter((a) => a.status === 'interviewing').length,
    offered: apps.filter((a) => a.status === 'offered').length,
    overdue: apps.filter((a) => a.followUpAt && new Date(a.followUpAt) <= now).length,
  };

  return (
    <div className="p-4 sm:p-8 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Dashboard</h1>
        <Link
          to="/applications/new"
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors"
        >
          + New application
        </Link>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 mb-10">
        <StatCard
          label="Total"
          value={counts.total}
          icon={<BriefcaseIcon size={20} />}
          color="blue"
          loading={isLoading}
        />
        <StatCard
          label="Applied"
          value={counts.applied}
          icon={<FileTextIcon size={20} />}
          color="indigo"
          loading={isLoading}
        />
        <StatCard
          label="Interviewing"
          value={counts.interviewing}
          icon={<ClockIcon size={20} />}
          color="yellow"
          loading={isLoading}
        />
        <StatCard
          label="Offered"
          value={counts.offered}
          icon={<CheckCircleIcon size={20} />}
          color="green"
          loading={isLoading}
        />
        <StatCard
          label="Follow-up due"
          value={counts.overdue}
          icon={<AlertCircleIcon size={20} />}
          color="orange"
          loading={isLoading}
        />
      </div>

      <div>
        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
          Recent applications
        </h2>
        {isLoading ? (
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-16 bg-gray-100 dark:bg-gray-800 rounded-lg animate-pulse" />
            ))}
          </div>
        ) : isError ? (
          <ErrorState error={error} onRetry={() => refetch()} />
        ) : apps.length === 0 ? (
          <div className="text-center py-12 text-gray-500 dark:text-gray-400">
            <BriefcaseIcon size={40} className="mx-auto mb-3 opacity-40" />
            <p>No applications yet.</p>
            <Link
              to="/applications/new"
              className="mt-2 inline-block text-blue-600 hover:underline text-sm"
            >
              Add your first one →
            </Link>
          </div>
        ) : (
          <div className="space-y-2">
            {apps.slice(0, 8).map((app) => {
              const isOverdue = app.followUpAt && new Date(app.followUpAt) <= now;
              return (
                <Link
                  key={app.id}
                  to="/applications/$applicationId"
                  params={{ applicationId: app.id }}
                  className="flex items-center justify-between px-4 py-3 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-600 transition-colors"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    {app.starred && (
                      <StarIcon size={13} className="text-yellow-400 fill-yellow-400 shrink-0" />
                    )}
                    {isOverdue && (
                      <AlertCircleIcon size={13} className="text-orange-500 shrink-0" />
                    )}
                    <div className="min-w-0">
                      <p className="font-medium text-gray-900 dark:text-gray-100 text-sm">
                        {app.company}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">{app.role}</p>
                    </div>
                  </div>
                  <StatusBadge status={app.status} />
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

function StatCard({
  label,
  value,
  icon,
  color,
  loading,
}: {
  label: string;
  value: number;
  icon: React.ReactNode;
  color: string;
  loading: boolean;
}) {
  const colors: Record<string, string> = {
    blue: 'bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400',
    indigo: 'bg-indigo-50 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400',
    yellow: 'bg-yellow-50 text-yellow-600 dark:bg-yellow-900/30 dark:text-yellow-400',
    green: 'bg-green-50 text-green-600 dark:bg-green-900/30 dark:text-green-400',
    orange: 'bg-orange-50 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400',
  };
  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
      <div className={`w-9 h-9 rounded-lg flex items-center justify-center mb-3 ${colors[color]}`}>
        {icon}
      </div>
      {loading ? (
        <div className="h-7 w-12 bg-gray-100 dark:bg-gray-700 rounded animate-pulse mb-1" />
      ) : (
        <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{value}</p>
      )}
      <p className="text-xs text-gray-500 dark:text-gray-400">{label}</p>
    </div>
  );
}

export function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    draft: 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300',
    applied: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
    interviewing: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
    offered: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
    rejected: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
    accepted: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
    withdrawn: 'bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-400',
  };
  return (
    <span
      className={`text-xs font-medium px-2 py-0.5 rounded-full capitalize ${styles[status] ?? styles.draft}`}
    >
      {status}
    </span>
  );
}
