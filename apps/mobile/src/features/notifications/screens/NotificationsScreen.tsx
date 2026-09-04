import React from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useNotificationsPage } from '../hooks/useNotificationQueries';
import { useMarkNotificationsRead } from '../hooks/useNotificationMutations';
import { NotificationListItem } from '../components/NotificationListItem';
import { resolveNotificationRoute } from '../lib/resolveNotificationRoute';
import { getErrorMessage } from '../../../lib/errors';
import type { NotificationItem } from '../types';

export function NotificationsScreen() {
  const router = useRouter();
  const {
    data,
    isLoading,
    isError,
    error,
    refetch,
    isRefetching,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useNotificationsPage();
  const markRead = useMarkNotificationsRead();

  const items = data?.pages.flatMap((page) => page.items) ?? [];
  const unreadIds = items.filter((n) => !n.read).map((n) => n.id);

  const onRowPress = (notification: NotificationItem) => {
    if (!notification.read) {
      markRead.mutate({ ids: [notification.id], isRead: true });
    }
    const route = resolveNotificationRoute(notification.url);
    if (route) router.push(route);
  };

  return (
    <View style={styles.container}>
      {unreadIds.length > 0 && (
        <View style={styles.headerBar}>
          <Pressable
            onPress={() => markRead.mutate({ ids: unreadIds, isRead: true })}
            testID="mark-all-read-button"
          >
            <Text style={styles.headerAction}>Mark all as read</Text>
          </Pressable>
        </View>
      )}

      {isLoading ? (
        <ActivityIndicator style={styles.loading} size="large" color="#2563eb" />
      ) : isError ? (
        <View style={styles.centered}>
          <Text style={styles.error}>{getErrorMessage(error)}</Text>
        </View>
      ) : items.length === 0 ? (
        <View style={styles.centered}>
          <Text style={styles.emptyText}>You&apos;re all caught up.</Text>
        </View>
      ) : (
        <FlatList
          data={items}
          keyExtractor={(item) => item.id}
          refreshControl={
            <RefreshControl refreshing={isRefetching} onRefresh={() => void refetch()} />
          }
          renderItem={({ item }) => (
            <NotificationListItem notification={item} onPress={() => onRowPress(item)} />
          )}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
          onEndReached={() => {
            if (hasNextPage) void fetchNextPage();
          }}
          onEndReachedThreshold={0.4}
          ListFooterComponent={
            isFetchingNextPage ? (
              <ActivityIndicator style={styles.footerLoading} color="#2563eb" />
            ) : null
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9fafb' },
  headerBar: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  headerAction: { color: '#2563eb', fontSize: 13, fontWeight: '600' },
  loading: { marginTop: 40 },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  emptyText: { fontSize: 14, color: '#6b7280' },
  error: { fontSize: 14, color: '#b91c1c', textAlign: 'center' },
  separator: { height: 1, backgroundColor: '#e5e7eb', marginLeft: 42 },
  footerLoading: { paddingVertical: 16 },
});
