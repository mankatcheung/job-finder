import { useState } from 'react';
import {
  infiniteQueryOptions,
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';
import { gqlClient } from '#/graphql/client';
import { useInfiniteScrollSentinel } from '#/lib/useInfiniteScrollSentinel';
import { useHotkeys } from '#/hooks/useHotkeys';
import {
  BellIcon,
  XIcon,
  CalendarIcon,
  ClockIcon,
  ShieldIcon,
  Loader2Icon,
  CheckCheckIcon,
  EyeOffIcon,
} from 'lucide-react';

const PAGE_SIZE = 20;

const UNREAD_COUNT_QUERY = `query UnreadNotificationCount { unreadNotificationCount }`;

const NOTIFICATIONS_PAGE_QUERY = `
  query NotificationsPage($cursor: String, $limit: Int) {
    notificationsPage(cursor: $cursor, limit: $limit) {
      hasNextPage
      nextCursor
      items {
        id
        type
        title
        body
        url
        read
        createdAt
      }
    }
  }
`;

const MARK_NOTIFICATIONS_READ = `
  mutation MarkNotificationsRead($ids: [ID!]!, $isRead: Boolean!) {
    markNotificationsRead(ids: $ids, isRead: $isRead)
  }
`;

type NotificationType = 'interview_reminder' | 'follow_up_reminder' | 'security_alert';

type NotificationItem = {
  id: string;
  type: NotificationType;
  title: string;
  body: string;
  url: string | null;
  read: boolean;
  createdAt: string;
};

type NotificationsPageResult = {
  notificationsPage: {
    items: NotificationItem[];
    hasNextPage: boolean;
    nextCursor: string | null;
  };
};

const NOTIFICATION_ICON: Record<NotificationType, React.ReactNode> = {
  interview_reminder: <CalendarIcon size={16} className="text-blue-500" />,
  follow_up_reminder: <ClockIcon size={16} className="text-amber-500" />,
  security_alert: <ShieldIcon size={16} className="text-red-500" />,
};

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

function timeAgo(iso: string): string {
  const minutes = Math.floor((Date.now() - new Date(iso).getTime()) / 60_000);
  if (minutes < 1) return 'just now';
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

export function NotificationInboxButton({ className = '' }: { className?: string }) {
  const [isOpen, setIsOpen] = useState(false);

  const { data } = useQuery({
    queryKey: ['notifications', 'unreadCount'],
    queryFn: () => gqlClient.request<{ unreadNotificationCount: number }>(UNREAD_COUNT_QUERY),
    refetchInterval: 60_000,
  });
  const unreadCount = data?.unreadNotificationCount ?? 0;

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        aria-label={unreadCount > 0 ? `Notifications, ${unreadCount} unread` : 'Notifications'}
        title="Notifications"
        className={`relative p-2 text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100 rounded-lg transition-colors ${className}`}
      >
        <BellIcon size={18} />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-400 opacity-75" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-red-500" />
          </span>
        )}
      </button>
      {isOpen && <NotificationInboxPanel onClose={() => setIsOpen(false)} />}
    </>
  );
}

function NotificationInboxPanel({ onClose }: { onClose: () => void }) {
  const qc = useQueryClient();
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  useHotkeys({ key: 'Escape' }, onClose);

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
    onClose();
    // Not a router `navigate()` — url is a dynamic string, not a typed route —
    // matching how the push-notification-click handler in __root.tsx does it.
    if (notification.url) {
      window.location.href = notification.url;
    }
  };

  const selectedCount = selectedIds.size;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-16 px-4">
      <div className="fixed inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-md max-h-[80vh] flex flex-col overflow-hidden border border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-gray-700 shrink-0">
          <h2 className="text-sm font-semibold text-gray-900 dark:text-gray-100">Notifications</h2>
          <button
            onClick={onClose}
            className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded"
            aria-label="Close"
          >
            <XIcon size={16} />
          </button>
        </div>

        {items.length > 0 && (
          <div className="flex items-center justify-between px-4 py-2 border-b border-gray-100 dark:border-gray-700 shrink-0">
            <label className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={allSelected}
                onChange={toggleAll}
                className="h-3.5 w-3.5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                aria-label={allSelected ? 'Deselect all' : 'Select all'}
              />
              {selectedCount > 0 ? `${selectedCount} selected` : 'Select all'}
            </label>
            {selectedCount > 0 && (
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => markSelected(true)}
                  aria-label="Mark read"
                  className="flex items-center gap-1 text-xs text-blue-600 hover:underline"
                >
                  <CheckCheckIcon size={14} /> <span className="hidden sm:inline">Mark read</span>
                </button>
                <button
                  type="button"
                  onClick={() => markSelected(false)}
                  aria-label="Mark unread"
                  className="flex items-center gap-1 text-xs text-blue-600 hover:underline"
                >
                  <EyeOffIcon size={14} /> <span className="hidden sm:inline">Mark unread</span>
                </button>
              </div>
            )}
          </div>
        )}

        <div className="flex-1 overflow-y-auto">
          {isLoading && (
            <div className="flex justify-center py-8 text-gray-400">
              <Loader2Icon size={20} className="animate-spin" />
            </div>
          )}
          {isError && (
            <p className="text-sm text-red-600 px-4 py-6 text-center">
              Failed to load notifications.
            </p>
          )}
          {!isLoading && !isError && items.length === 0 && (
            <p className="text-sm text-gray-500 dark:text-gray-400 px-4 py-8 text-center">
              You&apos;re all caught up.
            </p>
          )}
          {items.map((notification) => (
            <div
              key={notification.id}
              className={`flex items-start gap-3 px-4 py-3 border-b border-gray-100 dark:border-gray-700 last:border-0 ${
                notification.read ? '' : 'bg-blue-50/50 dark:bg-blue-900/10'
              }`}
            >
              <input
                type="checkbox"
                checked={selectedIds.has(notification.id)}
                onChange={() => toggleOne(notification.id)}
                className="mt-1 h-3.5 w-3.5 shrink-0 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                aria-label={`Select ${notification.title}`}
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
                    {timeAgo(notification.createdAt)}
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
              <Loader2Icon size={16} className="animate-spin" />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
