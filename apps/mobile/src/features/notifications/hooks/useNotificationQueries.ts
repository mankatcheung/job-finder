import { infiniteQueryOptions, useInfiniteQuery, useQuery } from '@tanstack/react-query';
import { gqlRequest } from '../../../graphql/client';
import { NOTIFICATIONS_PAGE_QUERY, UNREAD_NOTIFICATION_COUNT_QUERY } from '../graphql/operations';
import type { NotificationsPage } from '../types';

const PAGE_SIZE = 20;

export const notificationsPageQueryKey = ['notifications', 'page'] as const;
export const unreadNotificationCountQueryKey = ['notifications', 'unreadCount'] as const;

function notificationsPageQueryOptions() {
  return infiniteQueryOptions({
    queryKey: notificationsPageQueryKey,
    queryFn: ({ pageParam }: { pageParam: string | undefined }) =>
      gqlRequest<{ notificationsPage: NotificationsPage }>(NOTIFICATIONS_PAGE_QUERY, {
        cursor: pageParam,
        limit: PAGE_SIZE,
      }).then((data) => data.notificationsPage),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => (lastPage.hasNextPage ? lastPage.nextCursor : undefined),
  });
}

export function useNotificationsPage() {
  return useInfiniteQuery(notificationsPageQueryOptions());
}

export function useUnreadNotificationCount() {
  return useQuery({
    queryKey: unreadNotificationCountQueryKey,
    queryFn: () =>
      gqlRequest<{ unreadNotificationCount: number }>(UNREAD_NOTIFICATION_COUNT_QUERY).then(
        (data) => data.unreadNotificationCount,
      ),
    refetchInterval: 60_000,
  });
}
