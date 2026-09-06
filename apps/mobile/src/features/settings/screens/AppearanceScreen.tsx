import React, { useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../../../theme/ThemeContext';
import type { ThemeColors, ThemeMode } from '../../../theme/colors';

export function AppearanceScreen() {
  const { t } = useTranslation('appearance');
  const { mode, colors, setMode } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  const MODE_OPTIONS: { value: ThemeMode; label: string }[] = [
    { value: 'light', label: t('light') },
    { value: 'dark', label: t('dark') },
    { value: 'system', label: t('system') },
  ];

  return (
    <View style={styles.container}>
      <Text style={styles.label}>{t('themeLabel')}</Text>
      <View style={styles.chipRow}>
        {MODE_OPTIONS.map((option) => (
          <Pressable
            key={option.value}
            style={[styles.chip, mode === option.value && styles.chipActive]}
            onPress={() => setMode(option.value)}
            testID={`appearance-${option.value}`}
          >
            <Text style={[styles.chipText, mode === option.value && styles.chipTextActive]}>
              {option.label}
            </Text>
          </Pressable>
        ))}
      </View>
    </View>
  );
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background, padding: 20, gap: 10 },
    label: { fontSize: 14, fontWeight: '600', color: colors.text },
    chipRow: { flexDirection: 'row', gap: 8 },
    chip: {
      borderRadius: 9999,
      borderWidth: 1,
      borderColor: colors.borderStrong,
      paddingHorizontal: 14,
      paddingVertical: 6,
      backgroundColor: colors.surface,
    },
    chipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
    chipText: { fontSize: 13, color: colors.textMuted, fontWeight: '500' },
    chipTextActive: { color: colors.onPrimary },
  });
}
