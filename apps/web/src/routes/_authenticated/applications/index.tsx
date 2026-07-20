import { createFileRoute, Link } from '@tanstack/react-router';
import { useQuery } from '@tanstack/react-query';
import { useState, useEffect } from 'react';
import { gqlClient } from '#/graphql/client';
import { StatusBadge } from '../dashboard';
import type { ApplicationStatus } from '#/graphql/generated/graphql';
import { BriefcaseIcon, KanbanIcon, SearchIcon, StarIcon, XIcon } from 'lucide-react';
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
      description
      appliedAt
      starred
      source
      followUpAt
      tags
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
  description?: string | null;
  appliedAt?: string | null;
  starred: boolean;
  source?: string | null;
  followUpAt?: string | null;
  tags: string[];
  createdAt: string;
};

export const Route = createFileRoute('/_authenticated/applications/')({
  validateSearch: searchSchema,
  component: ApplicationsPage,
});

export function ApplicationsPage() {
  const { status, starred } = Route.useSearch();
  const [searchInput, setSearchInput] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const t = setTimeout(() => setSearchTerm(searchInput.trim().toLowerCase()), 200);
    return () => clearTimeout(t);
  }, [searchInput]);

  const { data, isLoading } = useQuery({
    queryKey: ['applications', status],
    queryFn: () =>
      gqlClient.request<{ applications: Application[] }>(APPLICATIONS_QUERY, {
        status: status ?? null,
      }),
  });

  const allApps = data?.applications ?? [];
  let apps = starred ? allApps.filter((a) => a.starred) : allApps;
  if (searchTerm) {
    apps = apps.filter(
      (a) =>
        a.company.toLowerCase().includes(searchTerm) ||
        a.role.toLowerCase().includes(searchTerm) ||
        (a.location ?? '').toLowerCase().includes(searchTerm) ||
        (a.description ?? '').toLowerCase().includes(searchTerm),
    );
  }

  return (
    <div className="p-4 sm:p-8 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Applications</h1>
        <div className="flex items-center gap-2">
          <Link
            to="/applications/board"
            className="flex items-center gap-1.5 px-3 py-2 text-sm text-gray-500 hover:text-gray-800 dark:hover:text-gray-200 border border-gray-200 dark:border-gray-700 rounded-lg transition-colors"
          >
            <KanbanIcon size={15} /> Board
          </Link>
          <Link
            to="/applications/new"
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors"
          >
            + New
          </Link>
        </div>
      </div>

      <div className="relative mb-4">
        <SearchIcon
          size={15}
          className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
        />
        <input
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          placeholder="Search company, role, location…"
          className="w-full pl-9 pr-8 py-2.5 text-sm border border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        {searchInput && (
          <button
            onClick={() => setSearchInput('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
          >
            <XIcon size={14} />
          </button>
        )}
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
          <p>
            No applications
            {searchTerm
              ? ` matching "${searchTerm}"`
              : status
                ? ` with status "${status}"`
                : ''}{' '}
            yet.
          </p>
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
                {app.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-1.5">
                    {app.tags.slice(0, 3).map((tag) => (
                      <span
                        key={tag}
                        className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300"
                      >
                        {tag}
                      </span>
                    ))}
                    {app.tags.length > 3 && (
                      <span className="text-[10px] text-gray-400">+{app.tags.length - 3}</span>
                    )}
                  </div>
                )}
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
