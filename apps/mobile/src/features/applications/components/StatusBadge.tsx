import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import type { ApplicationStatus } from '../types';

const STATUS_LABELS: Record<ApplicationStatus, string> = {
  draft: 'Draft',
  applied: 'Applied',
  interviewing: 'Interviewing',
  offered: 'Offered',
  accepted: 'Accepted',
  rejected: 'Rejected',
  withdrawn: 'Withdrawn',
};

const STATUS_COLORS: Record<ApplicationStatus, { bg: string; fg: string }> = {
  draft: { bg: '#f3f4f6', fg: '#374151' },
  applied: { bg: '#dbeafe', fg: '#1d4ed8' },
  interviewing: { bg: '#fef3c7', fg: '#a16207' },
  offered: { bg: '#dcfce7', fg: '#15803d' },
  accepted: { bg: '#d1fae5', fg: '#047857' },
  rejected: { bg: '#fee2e2', fg: '#b91c1c' },
  withdrawn: { bg: '#e5e7eb', fg: '#4b5563' },
};

export function statusLabel(status: ApplicationStatus): string {
  return STATUS_LABELS[status];
}

interface Props {
  status: ApplicationStatus;
}

export function StatusBadge({ status }: Props) {
  const colors = STATUS_COLORS[status];
  return (
    <View style={[styles.badge, { backgroundColor: colors.bg }]}>
      <Text style={[styles.text, { color: colors.fg }]}>{STATUS_LABELS[status]}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    alignSelf: 'flex-start',
    borderRadius: 9999,
    paddingHorizontal: 10,
    paddingVertical: 3,
  },
  text: { fontSize: 12, fontWeight: '600' },
});
