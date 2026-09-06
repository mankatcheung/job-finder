import React, { useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useRouter, type Href } from 'expo-router';
import { useAuth } from '../../../auth/AuthContext';
import { useTheme } from '../../../theme/ThemeContext';
import type { ThemeColors } from '../../../theme/colors';

const MENU: { label: string; href: Href; testID: string }[] = [
  { label: 'Profile', href: '/settings/profile', testID: 'settings-profile-row' },
  { label: 'Security', href: '/settings/security', testID: 'settings-security-row' },
  {
    label: 'Notifications',
    href: '/settings/notifications',
    testID: 'settings-notifications-row',
  },
  { label: 'Appearance', href: '/settings/appearance', testID: 'settings-appearance-row' },
  { label: 'AI', href: '/settings/ai', testID: 'settings-ai-row' },
  { label: 'Experience', href: '/settings/experience', testID: 'settings-experience-row' },
  { label: 'Integrations', href: '/settings/integrations', testID: 'settings-integrations-row' },
  { label: 'Data', href: '/settings/data', testID: 'settings-data-row' },
];

const DANGER_MENU: { label: string; href: Href; testID: string }[] = [
  { label: 'Danger zone', href: '/settings/danger-zone', testID: 'settings-danger-zone-row' },
];

export function SettingsScreen() {
  const router = useRouter();
  const { logout } = useAuth();
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  return (
    <View style={styles.container}>
      {MENU.map((item) => (
        <Pressable
          key={item.testID}
          style={styles.row}
          onPress={() => router.push(item.href)}
          testID={item.testID}
        >
          <Text style={styles.label}>{item.label}</Text>
          <Text style={styles.chevron}>{'>'}</Text>
        </Pressable>
      ))}

      {DANGER_MENU.map((item) => (
        <Pressable
          key={item.testID}
          style={[styles.row, styles.dangerRow]}
          onPress={() => router.push(item.href)}
          testID={item.testID}
        >
          <Text style={styles.dangerLabel}>{item.label}</Text>
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

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background, padding: 16, gap: 10 },
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      backgroundColor: colors.surface,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: colors.border,
      paddingHorizontal: 16,
      paddingVertical: 16,
    },
    label: { fontSize: 15, fontWeight: '500', color: colors.text },
    chevron: { color: colors.textFaint, fontSize: 16 },
    dangerRow: {
      marginTop: 12,
      borderColor: colors.dangerBorder,
      backgroundColor: colors.dangerSurface,
    },
    dangerLabel: { fontSize: 15, fontWeight: '500', color: colors.danger },
    signOutRow: {
      justifyContent: 'center',
      marginTop: 12,
      borderColor: colors.dangerBorder,
      backgroundColor: colors.dangerSurface,
    },
    signOutLabel: { fontSize: 15, fontWeight: '600', color: colors.danger },
  });
}
