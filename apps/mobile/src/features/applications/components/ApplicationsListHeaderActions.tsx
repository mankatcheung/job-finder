import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useUnreadNotificationCount } from '../../notifications/hooks/useNotificationQueries';

export function ApplicationsListHeaderActions() {
  const router = useRouter();
  const { data: unreadCount = 0 } = useUnreadNotificationCount();

  return (
    <View style={styles.container}>
      <Pressable onPress={() => router.push('/analytics')} testID="header-analytics-button">
        <Text style={styles.action}>Analytics</Text>
      </Pressable>
      <Pressable onPress={() => router.push('/applications/board')} testID="header-board-button">
        <Text style={styles.action}>Board</Text>
      </Pressable>
      <Pressable onPress={() => router.push('/calendar')} testID="header-calendar-button">
        <Text style={styles.action}>Calendar</Text>
      </Pressable>
      <Pressable onPress={() => router.push('/dashboard')} testID="header-dashboard-button">
        <Text style={styles.action}>Dashboard</Text>
      </Pressable>
      <Pressable onPress={() => router.push('/notifications')} testID="header-notifications-button">
        <Text style={styles.action}>Alerts{unreadCount > 0 ? ` (${unreadCount})` : ''}</Text>
      </Pressable>
      <Pressable onPress={() => router.push('/applications/trash')} testID="header-trash-button">
        <Text style={styles.action}>Trash</Text>
      </Pressable>
      <Pressable onPress={() => router.push('/conversations')} testID="header-assistant-button">
        <Text style={styles.action}>Assistant</Text>
      </Pressable>
      <Pressable onPress={() => router.push('/settings')} testID="header-settings-button">
        <Text style={styles.action}>Settings</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flexDirection: 'row', gap: 14 },
  action: { color: '#2563eb', fontSize: 13, fontWeight: '600' },
});
