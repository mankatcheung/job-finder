import { createFileRoute, Link } from '@tanstack/react-router';
import { useQuery } from '@tanstack/react-query';
import { gqlClient } from '#/graphql/client';
import { StatusBadge } from '../dashboard';
import type { ApplicationStatus } from '#/graphql/generated/graphql';
import { BriefcaseIcon, StarIcon } from 'lucide-react';
import { z } from 'zod';

const APPLICATION_STATUSES: ApplicationStatus[] = [
  'draft',
  'applied',
  'interviewing',
  'offered',
  'accepted',
  'rejected',
  'withdrawn',
];

const searchSchema = z.object({ status: z.string().optional(), starred: z.boolean().optional() });

const APPLICATIONS_QUERY = `
  query Applications($status: ApplicationStatus) {
    applications(status: $status) {
      id
      company
      role
      status
      location
      appliedAt
      starred
      source
      followUpAt
      createdAt
    }
  }
`;

type Application = {
  id: string;
  company: string;
  role: string;
  status: ApplicationStatus;
  location?: string | null;
  appliedAt?: string | null;
  starred: boolean;
  source?: string | null;
  followUpAt?: string | null;
  createdAt: string;
};

export const Route = createFileRoute('/_authenticated/applications/')({
  validateSearch: searchSchema,
  component: ApplicationsPage,
});

export function ApplicationsPage() {
  const { status, starred } = Route.useSearch();

  const { data, isLoading } = useQuery({
    queryKey: ['applications', status],
    queryFn: () =>
      gqlClient.request<{ applications: Application[] }>(APPLICATIONS_QUERY, {
        status: status ?? null,
      }),
  });

  const allApps = data?.applications ?? [];
  const apps = starred ? allApps.filter((a) => a.starred) : allApps;

  return (
    <div className="p-8 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Applications</h1>
        <Link
          to="/applications/new"
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors"
        >
          + New
        </Link>
      </div>

      <div className="flex gap-2 mb-6 flex-wrap">
        <FilterChip label="All" value={undefined} current={status} />
        {APPLICATION_STATUSES.map((s) => (
          <FilterChip key={s} label={s} value={s} current={status} />
        ))}
        <Link
          to="/applications"
          search={starred ? {} : { starred: true }}
          className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full border capitalize transition-colors ${
            starred
              ? 'bg-yellow-400 text-white border-yellow-400'
              : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 border-gray-200 dark:border-gray-700 hover:border-yellow-400'
          }`}
        >
          <StarIcon size={11} className={starred ? 'fill-white' : ''} />
          Starred
        </Link>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-20 bg-gray-100 dark:bg-gray-800 rounded-lg animate-pulse" />
          ))}
        </div>
      ) : apps.length === 0 ? (
        <div className="text-center py-16 text-gray-500 dark:text-gray-400">
          <BriefcaseIcon size={40} className="mx-auto mb-3 opacity-40" />
          <p>No applications{status ? ` with status "${status}"` : ''} yet.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {apps.map((app) => (
            <Link
              key={app.id}
              to="/applications/$applicationId"
              params={{ applicationId: app.id }}
              className="flex items-center justify-between px-5 py-4 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-600 transition-colors group"
            >
              <div className="min-w-0">
                <p className="font-semibold text-gray-900 dark:text-gray-100 text-sm">
                  {app.company}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                  {app.role}
                  {app.location ? ` · ${app.location}` : ''}
                </p>
              </div>
              <div className="flex items-center gap-3 shrink-0">
                {app.starred && (
                  <StarIcon size={13} className="text-yellow-400 fill-yellow-400 shrink-0" />
                )}
                <p className="text-xs text-gray-400 hidden sm:block">
                  {app.appliedAt
                    ? new Date(app.appliedAt).toLocaleDateString()
                    : new Date(app.createdAt).toLocaleDateString()}
                </p>
                <StatusBadge status={app.status} />
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

function FilterChip({
  label,
  value,
  current,
}: {
  label: string;
  value: string | undefined;
  current: string | undefined;
}) {
  const active = value === current;
  return (
    <Link
      to="/applications"
      search={value ? { status: value } : {}}
      className={`text-xs px-3 py-1.5 rounded-full border capitalize transition-colors ${
        active
          ? 'bg-blue-600 text-white border-blue-600'
          : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 border-gray-200 dark:border-gray-700 hover:border-blue-300'
      }`}
    >
      {label}
    </Link>
  );
}
