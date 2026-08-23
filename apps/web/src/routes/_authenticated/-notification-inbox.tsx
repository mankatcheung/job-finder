import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Link } from '@tanstack/react-router';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { gqlClient } from '#/graphql/client';
import { useHotkeys } from '#/hooks/useHotkeys';
import { useLocale } from '#/lib/i18n';
import { IconButton, Spinner } from '@trakwyn/ui';
import { BellIcon, CalendarIcon, ClockIcon, ShieldIcon } from 'lucide-react';

const RECENT_LIMIT = 5;

export const UNREAD_COUNT_QUERY = `query UnreadNotificationCount { unreadNotificationCount }`;

export const NOTIFICATIONS_PAGE_QUERY = `
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

export const MARK_NOTIFICATIONS_READ = `
  mutation MarkNotificationsRead($ids: [ID!]!, $isRead: Boolean!) {
    markNotificationsRead(ids: $ids, isRead: $isRead)
  }
`;

export type NotificationType = 'interview_reminder' | 'follow_up_reminder' | 'security_alert';

export type NotificationItem = {
  id: string;
  type: NotificationType;
  title: string;
  body: string;
  url: string | null;
  read: boolean;
  createdAt: string;
};

export type NotificationsPageResult = {
  notificationsPage: {
    items: NotificationItem[];
    hasNextPage: boolean;
    nextCursor: string | null;
  };
};

export const NOTIFICATION_ICON: Record<NotificationType, React.ReactNode> = {
  interview_reminder: <CalendarIcon size={16} className="text-blue-500" />,
  follow_up_reminder: <ClockIcon size={16} className="text-amber-500" />,
  security_alert: <ShieldIcon size={16} className="text-red-500" />,
};

export function timeAgo(
  iso: string,
  t: (key: string, options?: Record<string, number>) => string,
): string {
  const minutes = Math.floor((Date.now() - new Date(iso).getTime()) / 60_000);
  if (minutes < 1) return t('notificationInbox.justNow');
  if (minutes < 60) return t('notificationInbox.minutesAgo', { count: minutes });
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return t('notificationInbox.hoursAgo', { count: hours });
  return t('notificationInbox.daysAgo', { count: Math.floor(hours / 24) });
}

function useUnreadNotificationCount(): number {
  const { data } = useQuery({
    queryKey: ['notifications', 'unreadCount'],
    queryFn: () => gqlClient.request<{ unreadNotificationCount: number }>(UNREAD_COUNT_QUERY),
    refetchInterval: 60_000,
  });
  return data?.unreadNotificationCount ?? 0;
}

function BellIconWithBadge({ unreadCount }: { unreadCount: number }) {
  return (
    <>
      <BellIcon size={18} />
      {unreadCount > 0 && (
        <span className="absolute top-1 right-1 flex h-2 w-2">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-400 opacity-75" />
          <span className="relative inline-flex h-2 w-2 rounded-full bg-red-500" />
        </span>
      )}
    </>
  );
}

/**
 * Mobile bell — a plain link to the full notifications page. No popup: on a
 * small screen there's no good place to anchor a popover, and a full page is
 * the more usable target anyway (JEF-218).
 */
export function NotificationInboxLink({ className = '' }: { className?: string }) {
  const { t } = useLocale();
  const unreadCount = useUnreadNotificationCount();

  return (
    <Link
      to="/notifications"
      aria-label={
        unreadCount > 0
          ? t('notificationInbox.notificationsUnreadAria', { count: unreadCount })
          : t('notificationInbox.title')
      }
      className={`relative inline-flex items-center justify-center rounded-lg p-1.5 text-gray-400 transition-colors hover:text-gray-700 dark:hover:text-gray-200 ${className}`}
    >
      <BellIconWithBadge unreadCount={unreadCount} />
    </Link>
  );
}

/**
 * Desktop bell — opens a small popover anchored to the button (JEF-218),
 * showing the 5 most recent notifications with a link to the full page.
 * Replaces the old centered, backdrop-masked modal.
 */
export function NotificationInboxButton({ className = '' }: { className?: string }) {
  const { t } = useLocale();
  const [isOpen, setIsOpen] = useState(false);
  const anchorRef = useRef<HTMLDivElement>(null);
  const unreadCount = useUnreadNotificationCount();

  return (
    <div className="inline-flex" ref={anchorRef}>
      <IconButton
        label={
          unreadCount > 0
            ? t('notificationInbox.notificationsUnreadAria', { count: unreadCount })
            : t('notificationInbox.title')
        }
        onClick={() => setIsOpen((open) => !open)}
        className={`relative ${className}`}
        icon={<BellIconWithBadge unreadCount={unreadCount} />}
      />
      {isOpen && <NotificationPopover anchorRef={anchorRef} onClose={() => setIsOpen(false)} />}
    </div>
  );
}

/**
 * Portaled to `document.body` with a computed fixed position, rather than a
 * plain `absolute` sibling of the trigger — the sidebar header's entrance
 * animation (`sidebar-entrance-item`, `styles.css`) animates transform, which
 * creates a new stacking context for that header. A same-context `absolute`
 * popover was getting visually trapped under the nav list below it (later in
 * DOM order, same top-level stacking) no matter how high its own z-index
 * was — the same class of problem the old backdrop modal already portaled
 * around.
 */
function NotificationPopover({
  anchorRef,
  onClose,
}: {
  anchorRef: React.RefObject<HTMLElement | null>;
  onClose: () => void;
}) {
  const { t } = useLocale();
  const qc = useQueryClient();
  const panelRef = useRef<HTMLDivElement>(null);
  // Starts off-screen (not `right`-anchored to the trigger) since the bell
  // sits near the *left* edge of the desktop sidebar, not the right edge of
  // a wide container — anchoring by `right` pushed the whole panel off the
  // left of the viewport. Measuring the panel's real rendered width (fixed
  // by its own `w-80`/`sm:w-96` classes regardless of position) lets this
  // clamp to whichever side actually fits, rather than assuming one.
  const [position, setPosition] = useState({ top: -9999, left: -9999 });

  useHotkeys({ key: 'Escape' }, onClose);

  useLayoutEffect(() => {
    const anchorRect = anchorRef.current?.getBoundingClientRect();
    const panelRect = panelRef.current?.getBoundingClientRect();
    if (!anchorRect || !panelRect) return;
    const margin = 8;
    const maxLeft = window.innerWidth - panelRect.width - margin;
    setPosition({
      top: anchorRect.bottom + margin,
      left: Math.max(margin, Math.min(anchorRect.left, maxLeft)),
    });
  }, [anchorRef]);

  useEffect(() => {
    function handlePointerDown(event: MouseEvent) {
      const target = event.target as Node;
      if (anchorRef.current?.contains(target)) return;
      if (panelRef.current?.contains(target)) return;
      onClose();
    }
    document.addEventListener('mousedown', handlePointerDown);
    return () => document.removeEventListener('mousedown', handlePointerDown);
  }, [anchorRef, onClose]);

  const { data, isLoading, isError } = useQuery({
    queryKey: ['notifications', 'recent'],
    queryFn: () =>
      gqlClient.request<NotificationsPageResult>(NOTIFICATIONS_PAGE_QUERY, {
        limit: RECENT_LIMIT,
      }),
  });
  const items = data?.notificationsPage.items ?? [];

  const markRead = useMutation({
    mutationFn: ({ ids, isRead }: { ids: string[]; isRead: boolean }) =>
      gqlClient.request(MARK_NOTIFICATIONS_READ, { ids, isRead }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['notifications'] }),
  });

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

  return createPortal(
    <div
      ref={panelRef}
      role="dialog"
      aria-label={t('notificationInbox.title')}
      style={{ top: position.top, left: position.left }}
      className="fixed z-50 flex max-h-[70vh] w-80 flex-col overflow-hidden rounded-xl border border-gray-200 bg-white shadow-2xl dark:border-gray-700 dark:bg-gray-800 sm:w-96"
    >
      <div className="flex shrink-0 items-center justify-between border-b border-gray-200 px-4 py-3 dark:border-gray-700">
        <h2 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
          {t('notificationInbox.title')}
        </h2>
      </div>

      <div className="flex-1 overflow-y-auto">
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
          <button
            key={notification.id}
            type="button"
            onClick={() => onRowClick(notification)}
            className={`flex w-full items-start gap-2 border-b border-gray-100 px-4 py-3 text-left last:border-0 hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-700/50 ${
              notification.read ? '' : 'bg-blue-50/50 dark:bg-blue-900/10'
            }`}
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
        ))}
      </div>

      <Link
        to="/notifications"
        onClick={onClose}
        className="shrink-0 border-t border-gray-200 px-4 py-2.5 text-center text-sm font-medium text-blue-600 hover:bg-gray-50 dark:border-gray-700 dark:text-blue-400 dark:hover:bg-gray-700/50"
      >
        {t('notificationInbox.viewAll')}
      </Link>
    </div>,
    document.body,
  );
}
