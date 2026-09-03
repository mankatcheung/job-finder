import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';

export function ApplicationsListHeaderActions() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <Pressable onPress={() => router.push('/dashboard')} testID="header-dashboard-button">
        <Text style={styles.action}>Dashboard</Text>
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
