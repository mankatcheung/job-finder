import React, { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import type { ApplicationStatus } from '../types';
import { useTheme } from '../../../theme/ThemeContext';
import type { ThemeColors } from '../../../theme/colors';

const STATUS_LABELS: Record<ApplicationStatus, string> = {
  draft: 'Draft',
  applied: 'Applied',
  interviewing: 'Interviewing',
  offered: 'Offered',
  accepted: 'Accepted',
  rejected: 'Rejected',
  withdrawn: 'Withdrawn',
};

function statusColors(colors: ThemeColors): Record<ApplicationStatus, { bg: string; fg: string }> {
  return {
    draft: { bg: colors.surfaceAlt, fg: colors.textMuted },
    applied: { bg: colors.primarySurface, fg: colors.primary },
    interviewing: { bg: '#fef3c7', fg: '#a16207' },
    offered: { bg: '#dcfce7', fg: '#15803d' },
    accepted: { bg: '#d1fae5', fg: '#047857' },
    rejected: { bg: colors.dangerSurface, fg: colors.danger },
    withdrawn: { bg: colors.border, fg: colors.textSubtle },
  };
}

export function statusLabel(status: ApplicationStatus): string {
  return STATUS_LABELS[status];
}

interface Props {
  status: ApplicationStatus;
}

export function StatusBadge({ status }: Props) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const statusColor = statusColors(colors)[status];
  return (
    <View style={[styles.badge, { backgroundColor: statusColor.bg }]}>
      <Text style={[styles.text, { color: statusColor.fg }]}>{STATUS_LABELS[status]}</Text>
    </View>
  );
}

function createStyles(_colors: ThemeColors) {
  return StyleSheet.create({
    badge: {
      alignSelf: 'flex-start',
      borderRadius: 9999,
      paddingHorizontal: 10,
      paddingVertical: 3,
    },
    text: { fontSize: 12, fontWeight: '600' },
  });
}
