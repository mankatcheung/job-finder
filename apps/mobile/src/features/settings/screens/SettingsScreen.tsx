import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { AppStackParamList } from '../../../navigation/types';
import { useAuth } from '../../../auth/AuthContext';

type Props = NativeStackScreenProps<AppStackParamList, 'Settings'>;

const MENU: Array<{ label: string; screen: keyof AppStackParamList; testID: string }> = [
  { label: 'Profile', screen: 'Profile', testID: 'settings-profile-row' },
  { label: 'Security', screen: 'Security', testID: 'settings-security-row' },
  { label: 'Notifications', screen: 'Notifications', testID: 'settings-notifications-row' },
  { label: 'AI', screen: 'AiSettings', testID: 'settings-ai-row' },
];

export function SettingsScreen({ navigation }: Props) {
  const { logout } = useAuth();

  return (
    <View style={styles.container}>
      {MENU.map((item) => (
        <Pressable
          key={item.screen}
          style={styles.row}
          onPress={() => navigation.navigate(item.screen as never)}
          testID={item.testID}
        >
          <Text style={styles.label}>{item.label}</Text>
          <Text style={styles.chevron}>{'>'}</Text>
        </Pressable>
      ))}

      <Pressable
        style={[styles.row, styles.signOutRow]}
        onPress={() => void logout()}
        testID="settings-signout-button"
      >
        <Text style={styles.signOutLabel}>Sign out</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9fafb', padding: 16, gap: 10 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#ffffff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  label: { fontSize: 15, fontWeight: '500', color: '#111827' },
  chevron: { color: '#9ca3af', fontSize: 16 },
  signOutRow: {
    justifyContent: 'center',
    marginTop: 12,
    borderColor: '#fecaca',
    backgroundColor: '#fef2f2',
  },
  signOutLabel: { fontSize: 15, fontWeight: '600', color: '#b91c1c' },
});
