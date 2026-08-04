import { createFileRoute, Link } from '@tanstack/react-router';
import { infiniteQueryOptions, useInfiniteQuery, useQueryClient } from '@tanstack/react-query';
import { useState, useEffect, useMemo } from 'react';
import { gqlClient } from '#/graphql/client';
import { showUndoToast } from '#/lib/undoToast';
import { ErrorState } from '#/components/ErrorState';
import { StatusBadge } from '../dashboard';
import type { ApplicationStatus } from '#/graphql/generated/graphql';
import { useBulkActions } from './-useBulkActions';
import { useInfiniteScrollSentinel } from '#/lib/useInfiniteScrollSentinel';
import {
  BriefcaseIcon,
  KanbanIcon,
  Loader2Icon,
  SearchIcon,
  StarIcon,
  StarOffIcon,
  TagIcon,
  Trash2Icon,
  XIcon,
} from 'lucide-react';
import { z } from 'zod';
import { toast } from 'sonner';

const PAGE_SIZE = 20;

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

const APPLICATIONS_PAGE_QUERY = `
  query ApplicationsPage(
    $status: ApplicationStatus
    $starred: Boolean
    $search: String
    $cursor: String
    $limit: Int
  ) {
    applicationsPage(
      status: $status
      starred: $starred
      search: $search
      cursor: $cursor
      limit: $limit
    ) {
      hasNextPage
      nextCursor
      items {
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

type ApplicationsPageResult = {
  applicationsPage: {
    items: Application[];
    hasNextPage: boolean;
    nextCursor: string | null;
  };
};

function applicationsPageQueryOptions(
  status: string | undefined,
  starred: boolean | undefined,
  searchTerm: string,
) {
  return infiniteQueryOptions({
    queryKey: ['applications', 'page', status ?? null, starred ?? false, searchTerm],
    queryFn: ({ pageParam }) =>
      gqlClient.request<ApplicationsPageResult>(APPLICATIONS_PAGE_QUERY, {
        status: status ?? null,
        starred: starred ?? null,
        search: searchTerm || null,
        cursor: pageParam,
        limit: PAGE_SIZE,
      }),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) =>
      lastPage.applicationsPage.hasNextPage ? lastPage.applicationsPage.nextCursor : undefined,
  });
}

export const Route = createFileRoute('/_authenticated/applications/')({
  validateSearch: searchSchema,
  // searchTerm is local-only component state (always '' on a fresh navigation),
  // so only status/starred — the URL-driven filters — need to be loader deps.
  loaderDeps: ({ search }) => ({ status: search.status, starred: search.starred }),
  loader: ({ context: { queryClient }, deps }) =>
    queryClient.ensureInfiniteQueryData(
      applicationsPageQueryOptions(deps.status, deps.starred, ''),
    ),
  component: ApplicationsPage,
});

export function ApplicationsPage() {
  const { status, starred } = Route.useSearch();
  const [searchInput, setSearchInput] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const bulk = useBulkActions();

  useEffect(() => {
    const t = setTimeout(() => setSearchTerm(searchInput.trim().toLowerCase()), 200);
    return () => clearTimeout(t);
  }, [searchInput]);

  const {
    data,
    isLoading,
    isError,
    error,
    refetch,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useInfiniteQuery(applicationsPageQueryOptions(status, starred, searchTerm));

  const apps = useMemo(
    () => data?.pages.flatMap((page) => page.applicationsPage.items) ?? [],
    [data],
  );

  const sentinelRef = useInfiniteScrollSentinel(() => fetchNextPage(), Boolean(hasNextPage));

  const allSelected = apps.length > 0 && apps.every((a) => selectedIds.has(a.id));

  const toggleOne = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleAll = () => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (allSelected) apps.forEach((a) => next.delete(a.id));
      else apps.forEach((a) => next.add(a.id));
      return next;
    });
  };

  const clearSelection = () => setSelectedIds(new Set());
  const selectedCount = selectedIds.size;

  return (
    <div className="p-4 sm:p-8 max-w-5xl mx-auto pb-24">
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
      ) : isError ? (
        <ErrorState error={error} onRetry={() => refetch()} />
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
          <label className="flex items-center gap-2 px-1 text-xs text-gray-500 dark:text-gray-400 select-none cursor-pointer">
            <input
              type="checkbox"
              checked={allSelected}
              onChange={toggleAll}
              className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              aria-label={allSelected ? 'Deselect all' : 'Select all'}
            />
            {selectedCount > 0 ? `${selectedCount} of ${apps.length} selected` : 'Select all'}
          </label>

          {apps.map((app) => (
            <div
              key={app.id}
              className="flex items-center gap-3 px-5 py-4 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-600 transition-colors"
            >
              <input
                type="checkbox"
                checked={selectedIds.has(app.id)}
                onChange={() => toggleOne(app.id)}
                className="h-4 w-4 shrink-0 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                aria-label={`Select ${app.company}`}
              />
              <Link
                to="/applications/$applicationId"
                params={{ applicationId: app.id }}
                className="flex-1 flex items-center justify-between min-w-0 group"
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
            </div>
          ))}

          <div ref={sentinelRef} className="h-1" />
          {isFetchingNextPage && (
            <div className="flex justify-center py-4 text-gray-400">
              <Loader2Icon size={18} className="animate-spin" />
            </div>
          )}
        </div>
      )}

      {selectedCount > 0 && (
        <BulkActionBar selectedIds={selectedIds} apps={apps} onClear={clearSelection} bulk={bulk} />
      )}
    </div>
  );
}

function BulkActionBar({
  selectedIds,
  apps,
  onClear,
  bulk,
}: {
  selectedIds: Set<string>;
  apps: Application[];
  onClear: () => void;
  bulk: ReturnType<typeof useBulkActions>;
}) {
  const qc = useQueryClient();
  const [tagInput, setTagInput] = useState('');
  const ids = [...selectedIds];

  const onAddTag = () => {
    const tag = tagInput.trim();
    if (!tag) return;
    bulk.bulkAddTag(ids, tag, apps);
    setTagInput('');
  };

  const onDelete = () => {
    // Snapshot all pages of the infinite query
    const snapshot = qc.getQueryData(['applications', 'page']);
    // Optimistically remove selected apps from all pages
    qc.setQueryData(['applications', 'page'], (prev: any) => {
      if (!prev) return prev;
      return {
        ...prev,
        pages: prev.pages.map((page: any) => ({
          ...page,
          applicationsPage: {
            ...page.applicationsPage,
            items: page.applicationsPage.items.filter((a: any) => !ids.includes(a.id)),
          },
        })),
      };
    });
    showUndoToast({
      message: `${ids.length} application${ids.length === 1 ? '' : 's'} deleted`,
      onExecute: () => {
        bulk.bulkDelete(ids);
        onClear();
      },
      onUndo: () => {
        qc.setQueryData(['applications', 'page'], snapshot);
        toast.dismiss();
      },
    });
  };

  return (
    <div className="fixed bottom-16 lg:bottom-4 inset-x-0 z-40 flex justify-center px-4">
      <div className="flex flex-wrap items-center gap-2 px-4 py-3 bg-gray-900 dark:bg-gray-700 text-white rounded-xl shadow-lg max-w-full">
        <span className="text-sm font-medium pr-1">{ids.length} selected</span>

        <select
          value=""
          disabled={bulk.isPending}
          onChange={(e) => {
            if (e.target.value) bulk.bulkUpdateStatus(ids, e.target.value as ApplicationStatus);
          }}
          className="text-sm bg-gray-800 dark:bg-gray-600 border border-gray-700 dark:border-gray-500 rounded-lg px-2 py-1.5 disabled:opacity-60"
        >
          <option value="">Change status…</option>
          {APPLICATION_STATUSES.map((s) => (
            <option key={s} value={s}>
              {s.charAt(0).toUpperCase() + s.slice(1)}
            </option>
          ))}
        </select>

        <div className="flex items-center gap-1">
          <input
            value={tagInput}
            onChange={(e) => setTagInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                onAddTag();
              }
            }}
            placeholder="Add tag…"
            disabled={bulk.isPending}
            className="w-24 text-sm bg-gray-800 dark:bg-gray-600 border border-gray-700 dark:border-gray-500 rounded-lg px-2 py-1.5 placeholder-gray-400 disabled:opacity-60"
          />
          <button
            type="button"
            onClick={onAddTag}
            disabled={bulk.isPending || !tagInput.trim()}
            aria-label="Add tag to selected"
            className="p-1.5 hover:bg-gray-800 dark:hover:bg-gray-600 rounded-lg transition-colors disabled:opacity-60"
          >
            <TagIcon size={16} />
          </button>
        </div>

        <button
          type="button"
          onClick={() => bulk.bulkSetStarred(ids, true)}
          disabled={bulk.isPending}
          aria-label="Star selected"
          className="flex items-center gap-1 px-2 py-1.5 text-sm hover:bg-gray-800 dark:hover:bg-gray-600 rounded-lg transition-colors disabled:opacity-60"
        >
          <StarIcon size={14} /> <span className="hidden sm:inline">Star</span>
        </button>
        <button
          type="button"
          onClick={() => bulk.bulkSetStarred(ids, false)}
          disabled={bulk.isPending}
          aria-label="Unstar selected"
          className="flex items-center gap-1 px-2 py-1.5 text-sm hover:bg-gray-800 dark:hover:bg-gray-600 rounded-lg transition-colors disabled:opacity-60"
        >
          <StarOffIcon size={14} /> <span className="hidden sm:inline">Unstar</span>
        </button>
        <button
          type="button"
          onClick={onDelete}
          disabled={bulk.isPending}
          aria-label="Delete selected"
          className="flex items-center gap-1 px-2 py-1.5 text-sm text-red-300 hover:bg-red-900/40 rounded-lg transition-colors disabled:opacity-60"
        >
          <Trash2Icon size={14} /> <span className="hidden sm:inline">Delete</span>
        </button>

        <button
          type="button"
          onClick={onClear}
          aria-label="Clear selection"
          className="p-1.5 hover:bg-gray-800 dark:hover:bg-gray-600 rounded-lg transition-colors ml-1"
        >
          <XIcon size={16} />
        </button>
      </div>
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
