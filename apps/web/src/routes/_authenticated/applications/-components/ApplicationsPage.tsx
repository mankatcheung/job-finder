import { Link } from '@tanstack/react-router';
import { useInfiniteQuery, useQueryClient, type InfiniteData } from '@tanstack/react-query';
import { useState, useEffect, useMemo } from 'react';
import { deleteApplicationsWithUndo } from '../-deleteWithUndo';
import { ErrorState } from '#/components/ErrorState';
import { useLocale } from '#/lib/i18n';
import { Card, Checkbox, EmptyState, Skeleton, Spinner } from '@trakwyn/ui';
import { StatusBadge } from '../../-components/StatusBadge';
import type { ApplicationStatus } from '#/graphql/generated/graphql';
import { useBulkActions } from '../-useBulkActions';
import { useInfiniteScrollSentinel } from '#/lib/useInfiniteScrollSentinel';
import {
  BriefcaseIcon,
  KanbanIcon,
  PlusIcon,
  SearchIcon,
  StarIcon,
  StarOffIcon,
  TagIcon,
  Trash2Icon,
  TrashIcon,
  XIcon,
} from 'lucide-react';
import { toast } from 'sonner';
import { Route } from '../index';
import {
  applicationsPageQueryKey,
  applicationsPageQueryOptions,
  APPLICATION_STATUSES,
  type Application,
  type ApplicationsPageResult,
} from '../index';

function ApplicationsPage() {
  const { t } = useLocale();
  const { status, starred, likelyGhosted } = Route.useSearch();
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
  } = useInfiniteQuery(applicationsPageQueryOptions(status, starred, searchTerm, likelyGhosted));

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
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
          {t('applications.title')}
        </h1>
        <div className="flex items-center gap-2">
          <Link
            to="/applications/trash"
            aria-label={t('trash.title')}
            className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-gray-500 hover:text-gray-800 dark:hover:text-gray-200 border border-gray-200 dark:border-gray-700 rounded-lg transition-colors"
          >
            <TrashIcon size={15} />
            <span className="hidden sm:inline">{t('trash.title')}</span>
          </Link>
          <Link
            to="/applications/board"
            aria-label={t('applications.switchToBoardView')}
            className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-gray-500 hover:text-gray-800 dark:hover:text-gray-200 border border-gray-200 dark:border-gray-700 rounded-lg transition-colors"
          >
            <KanbanIcon size={15} />
            <span className="hidden sm:inline">{t('applications.board')}</span>
          </Link>
          <Link
            to="/applications/new"
            aria-label={t('applications.newApplicationAria')}
            className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors"
          >
            <PlusIcon size={15} />
            <span className="hidden sm:inline">{t('applications.new')}</span>
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
          placeholder={t('applications.searchPlaceholder')}
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

      <div className="flex items-center gap-3 mb-6">
        <select
          value={status ?? ''}
          onChange={(e) => {
            const params = new URLSearchParams(window.location.search);
            if (e.target.value) params.set('status', e.target.value);
            else params.delete('status');
            window.location.search = params.toString();
          }}
          aria-label={t('applications.filterByStatus')}
          className="text-sm px-3 py-1.5 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 capitalize"
        >
          <option value="">{t('applications.allStatuses')}</option>
          {APPLICATION_STATUSES.map((s) => (
            <option key={s} value={s}>
              {t(`status.${s}`)}
            </option>
          ))}
        </select>
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
          {t('applications.starred')}
        </Link>
        <Link
          to="/applications"
          search={likelyGhosted ? {} : { likelyGhosted: true }}
          className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${likelyGhosted ? 'bg-amber-500 text-white border-amber-500' : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 border-gray-200 dark:border-gray-700 hover:border-amber-400'}`}
        >
          {t('applications.likelyGhosted')}
        </Link>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-20 rounded-lg" />
          ))}
        </div>
      ) : isError ? (
        <ErrorState error={error} onRetry={() => refetch()} />
      ) : apps.length === 0 ? (
        <EmptyState
          className="py-16"
          icon={<BriefcaseIcon size={40} />}
          message={
            searchTerm
              ? t('applications.noApplicationsMatching', { term: searchTerm })
              : status
                ? t('applications.noApplicationsWithStatus', { status: t(`status.${status}`) })
                : likelyGhosted
                  ? t('applications.noApplicationsGhosted')
                  : t('applications.noApplicationsYet')
          }
        />
      ) : (
        <div className="space-y-2">
          <label className="flex items-center gap-2 px-1 text-xs text-gray-500 dark:text-gray-400 select-none cursor-pointer">
            <Checkbox
              checked={allSelected}
              onChange={toggleAll}
              aria-label={t(allSelected ? 'applications.deselectAll' : 'applications.selectAll')}
            />
            {selectedCount > 0
              ? t('applications.selectedOfTotal', { count: selectedCount, total: apps.length })
              : t('applications.selectAll')}
          </label>

          {apps.map((app) => (
            <Card
              key={app.id}
              className="flex items-center gap-3 px-5 py-4 hover:border-blue-300 dark:hover:border-blue-600 transition-colors"
            >
              <Checkbox
                className="shrink-0"
                checked={selectedIds.has(app.id)}
                onChange={() => toggleOne(app.id)}
                aria-label={t('applications.selectCompany', { company: app.company })}
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
                  {app.likelyGhosted && (
                    <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-medium text-amber-700 dark:bg-amber-900/40 dark:text-amber-300">
                      {t('applications.likelyGhosted')}
                    </span>
                  )}
                </div>
              </Link>
            </Card>
          ))}

          <div ref={sentinelRef} className="h-1" />
          {isFetchingNextPage && (
            <div className="flex justify-center py-4 text-gray-400">
              <Spinner size="md" />
            </div>
          )}
        </div>
      )}

      {selectedCount > 0 && (
        <BulkActionBar
          selectedIds={selectedIds}
          apps={apps}
          onClear={clearSelection}
          bulk={bulk}
          status={status}
          starred={starred}
          likelyGhosted={likelyGhosted}
          searchTerm={searchTerm}
        />
      )}
    </div>
  );
}

function BulkActionBar({
  selectedIds,
  apps,
  onClear,
  bulk,
  status,
  starred,
  likelyGhosted,
  searchTerm,
}: {
  selectedIds: Set<string>;
  apps: Application[];
  onClear: () => void;
  bulk: ReturnType<typeof useBulkActions>;
  status: string | undefined;
  starred: boolean | undefined;
  likelyGhosted: boolean | undefined;
  searchTerm: string;
}) {
  const { t } = useLocale();
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
    // Must match the exact key applicationsPageQueryOptions registers this
    // query under (including the active filters) — getQueryData/setQueryData
    // require an exact key match, unlike invalidateQueries' prefix matching.
    const queryKey = applicationsPageQueryKey(status, starred, searchTerm, likelyGhosted);
    // Snapshot all pages of the infinite query
    const snapshot = qc.getQueryData<InfiniteData<ApplicationsPageResult>>(queryKey);
    // Optimistically remove selected apps from all pages
    qc.setQueryData<InfiniteData<ApplicationsPageResult>>(queryKey, (prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        pages: prev.pages.map((page) => ({
          ...page,
          applicationsPage: {
            ...page.applicationsPage,
            items: page.applicationsPage.items.filter((a) => !ids.includes(a.id)),
          },
        })),
      };
    });
    // The rows are already gone from the cache above; the delete goes out now
    // rather than on a timer, and Undo restores them server-side.
    onClear();
    deleteApplicationsWithUndo(qc, ids, t('applications.deleted', { count: ids.length }), () => {
      qc.setQueryData(queryKey, snapshot);
      toast.dismiss();
    });
  };

  return (
    <div className="fixed bottom-16 lg:bottom-4 inset-x-0 z-40 flex justify-center px-4">
      <div className="flex flex-wrap items-center gap-2 px-4 py-3 bg-gray-900 dark:bg-gray-700 text-white rounded-xl shadow-lg max-w-full">
        <span className="text-sm font-medium pr-1">
          {t('applications.selectedCount', { count: ids.length })}
        </span>

        <select
          value=""
          disabled={bulk.isPending}
          onChange={(e) => {
            if (e.target.value) bulk.bulkUpdateStatus(ids, e.target.value as ApplicationStatus);
          }}
          className="text-sm bg-gray-800 dark:bg-gray-600 border border-gray-700 dark:border-gray-500 rounded-lg px-2 py-1.5 disabled:opacity-60"
        >
          <option value="">{t('applications.changeStatusPlaceholder')}</option>
          {APPLICATION_STATUSES.map((s) => (
            <option key={s} value={s}>
              {t(`status.${s}`)}
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
            placeholder={t('applications.addTagPlaceholder')}
            disabled={bulk.isPending}
            className="w-24 text-sm bg-gray-800 dark:bg-gray-600 border border-gray-700 dark:border-gray-500 rounded-lg px-2 py-1.5 placeholder-gray-400 disabled:opacity-60"
          />
          <button
            type="button"
            onClick={onAddTag}
            disabled={bulk.isPending || !tagInput.trim()}
            aria-label={t('applications.addTagToSelected')}
            className="p-1.5 hover:bg-gray-800 dark:hover:bg-gray-600 rounded-lg transition-colors disabled:opacity-60"
          >
            <TagIcon size={16} />
          </button>
        </div>

        <button
          type="button"
          onClick={() => bulk.bulkSetStarred(ids, true)}
          disabled={bulk.isPending}
          aria-label={t('applications.starSelected')}
          className="flex items-center gap-1 px-2 py-1.5 text-sm hover:bg-gray-800 dark:hover:bg-gray-600 rounded-lg transition-colors disabled:opacity-60"
        >
          <StarIcon size={14} /> <span className="hidden sm:inline">{t('applications.star')}</span>
        </button>
        <button
          type="button"
          onClick={() => bulk.bulkSetStarred(ids, false)}
          disabled={bulk.isPending}
          aria-label={t('applications.unstarSelected')}
          className="flex items-center gap-1 px-2 py-1.5 text-sm hover:bg-gray-800 dark:hover:bg-gray-600 rounded-lg transition-colors disabled:opacity-60"
        >
          <StarOffIcon size={14} />{' '}
          <span className="hidden sm:inline">{t('applications.unstar')}</span>
        </button>
        <button
          type="button"
          onClick={onDelete}
          disabled={bulk.isPending}
          aria-label={t('applications.deleteSelected')}
          className="flex items-center gap-1 px-2 py-1.5 text-sm text-red-300 hover:bg-red-900/40 rounded-lg transition-colors disabled:opacity-60"
        >
          <Trash2Icon size={14} /> <span className="hidden sm:inline">{t('common.delete')}</span>
        </button>

        <button
          type="button"
          onClick={onClear}
          aria-label={t('applications.clearSelection')}
          className="p-1.5 hover:bg-gray-800 dark:hover:bg-gray-600 rounded-lg transition-colors ml-1"
        >
          <XIcon size={16} />
        </button>
      </div>
    </div>
  );
}

export { ApplicationsPage };
