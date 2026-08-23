import { useState } from 'react';
import {
  infiniteQueryOptions,
  useInfiniteQuery,
  useMutation,
  useQueryClient,
} from '@tanstack/react-query';
import { gqlClient } from '#/graphql/client';
import { useInfiniteScrollSentinel } from '#/lib/useInfiniteScrollSentinel';
import { useLocale } from '#/lib/i18n';
import { Button, Checkbox, Spinner } from '@trakwyn/ui';
import { CheckCheckIcon, EyeOffIcon } from 'lucide-react';
import {
  NOTIFICATIONS_PAGE_QUERY,
  MARK_NOTIFICATIONS_READ,
  NOTIFICATION_ICON,
  timeAgo,
  type NotificationItem,
  type NotificationsPageResult,
} from '../-notification-inbox';

const PAGE_SIZE = 20;

function notificationsPageQueryOptions() {
  return infiniteQueryOptions({
    queryKey: ['notifications', 'page'],
    queryFn: ({ pageParam }: { pageParam: string | undefined }) =>
      gqlClient.request<NotificationsPageResult>(NOTIFICATIONS_PAGE_QUERY, {
        cursor: pageParam,
        limit: PAGE_SIZE,
      }),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) =>
      lastPage.notificationsPage.hasNextPage ? lastPage.notificationsPage.nextCursor : undefined,
  });
}

/**
 * Full notification history — infinite scroll, multi-select, bulk
 * mark-read/unread. Moved here from the old modal panel (JEF-218): the bell
 * button now only ever shows the 5 most recent, with a link to this page for
 * everything else.
 */
export function NotificationsPage() {
  const { t } = useLocale();
  const qc = useQueryClient();
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const { data, isLoading, isError, fetchNextPage, hasNextPage, isFetchingNextPage } =
    useInfiniteQuery(notificationsPageQueryOptions());

  const items = data?.pages.flatMap((p) => p.notificationsPage.items) ?? [];
  const sentinelRef = useInfiniteScrollSentinel(() => fetchNextPage(), Boolean(hasNextPage));

  const markRead = useMutation({
    mutationFn: ({ ids, isRead }: { ids: string[]; isRead: boolean }) =>
      gqlClient.request(MARK_NOTIFICATIONS_READ, { ids, isRead }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['notifications'] }),
  });

  const toggleOne = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const allSelected = items.length > 0 && items.every((n) => selectedIds.has(n.id));
  const toggleAll = () => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (allSelected) items.forEach((n) => next.delete(n.id));
      else items.forEach((n) => next.add(n.id));
      return next;
    });
  };

  const markSelected = (isRead: boolean) => {
    markRead.mutate({ ids: [...selectedIds], isRead });
    setSelectedIds(new Set());
  };

  const onRowClick = (notification: NotificationItem) => {
    if (!notification.read) {
      markRead.mutate({ ids: [notification.id], isRead: true });
    }
    // Not a router `navigate()` — url is a dynamic string, not a typed route —
    // matching how the push-notification-click handler in __root.tsx does it.
    if (notification.url) {
      window.location.href = notification.url;
    }
  };

  const selectedCount = selectedIds.size;

  return (
    <div className="p-4 sm:p-8 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-6 sm:mb-8">
        {t('notificationInbox.title')}
      </h1>

      <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 overflow-hidden">
        {items.length > 0 && (
          <div className="flex items-center justify-between px-4 py-2 border-b border-gray-100 dark:border-gray-700">
            <label className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400 cursor-pointer select-none">
              <Checkbox
                size="sm"
                checked={allSelected}
                onChange={toggleAll}
                aria-label={
                  allSelected ? t('applications.deselectAll') : t('applications.selectAll')
                }
              />
              {selectedCount > 0
                ? t('applications.selectedCount', { count: selectedCount })
                : t('applications.selectAll')}
            </label>
            {selectedCount > 0 && (
              <div className="flex items-center gap-3">
                <Button
                  variant="link"
                  size="sm"
                  onClick={() => markSelected(true)}
                  aria-label={t('notificationInbox.markRead')}
                >
                  <span className="flex items-center gap-1">
                    <CheckCheckIcon size={14} />{' '}
                    <span className="hidden sm:inline">{t('notificationInbox.markRead')}</span>
                  </span>
                </Button>
                <Button
                  variant="link"
                  size="sm"
                  onClick={() => markSelected(false)}
                  aria-label={t('notificationInbox.markUnread')}
                >
                  <span className="flex items-center gap-1">
                    <EyeOffIcon size={14} />{' '}
                    <span className="hidden sm:inline">{t('notificationInbox.markUnread')}</span>
                  </span>
                </Button>
              </div>
            )}
          </div>
        )}

        {isLoading && (
          <div className="flex justify-center py-8 text-gray-400">
            <Spinner size="md" />
          </div>
        )}
        {isError && (
          <p className="text-sm text-red-600 px-4 py-6 text-center">
            {t('notificationInbox.loadFailed')}
          </p>
        )}
        {!isLoading && !isError && items.length === 0 && (
          <p className="text-sm text-gray-500 dark:text-gray-400 px-4 py-8 text-center">
            {t('notificationInbox.allCaughtUp')}
          </p>
        )}
        {items.map((notification) => (
          <div
            key={notification.id}
            className={`flex items-start gap-3 px-4 py-3 border-b border-gray-100 dark:border-gray-700 last:border-0 ${
              notification.read ? '' : 'bg-blue-50/50 dark:bg-blue-900/10'
            }`}
          >
            <Checkbox
              size="sm"
              className="mt-1 shrink-0"
              checked={selectedIds.has(notification.id)}
              onChange={() => toggleOne(notification.id)}
              aria-label={t('notificationInbox.selectNotificationAria', {
                title: notification.title,
              })}
            />
            <button
              type="button"
              onClick={() => onRowClick(notification)}
              className="flex-1 min-w-0 text-left flex items-start gap-2"
            >
              <span className="mt-0.5 shrink-0">{NOTIFICATION_ICON[notification.type]}</span>
              <span className="min-w-0 flex-1">
                <span
                  className={`block text-sm ${
                    notification.read
                      ? 'text-gray-700 dark:text-gray-300'
                      : 'font-semibold text-gray-900 dark:text-gray-100'
                  }`}
                >
                  {notification.title}
                </span>
                <span className="block text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                  {notification.body}
                </span>
                <span className="block text-[11px] text-gray-400 mt-1">
                  {timeAgo(notification.createdAt, t)}
                </span>
              </span>
              {!notification.read && (
                <span className="mt-1.5 h-2 w-2 rounded-full bg-blue-500 shrink-0" />
              )}
            </button>
          </div>
        ))}
        <div ref={sentinelRef} className="h-1" />
        {isFetchingNextPage && (
          <div className="flex justify-center py-3 text-gray-400">
            <Spinner size="md" />
          </div>
        )}
      </div>
    </div>
  );
}
