import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useAuth } from '../auth/AuthContext';

/** Placeholder landing screen — applications list/detail/CRUD lands in phase 2 (JEF-262). */
export function HomeScreen() {
  const { logout } = useAuth();

  return (
    <View style={styles.container}>
      <Text style={styles.title}>You&apos;re signed in</Text>
      <Text style={styles.subtitle}>Applications, notes, and documents are coming next.</Text>
      <Pressable style={styles.button} onPress={() => void logout()} testID="logout-button">
        <Text style={styles.buttonText}>Sign out</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    gap: 12,
  },
  title: { fontSize: 20, fontWeight: '600', color: '#111827' },
  subtitle: { fontSize: 14, color: '#6b7280', textAlign: 'center' },
  button: {
    minHeight: 44,
    minWidth: 140,
    borderRadius: 8,
    backgroundColor: '#2563eb',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 12,
  },
  buttonText: { color: '#ffffff', fontSize: 16, fontWeight: '600' },
});
