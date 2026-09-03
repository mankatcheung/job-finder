import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { statusLabel } from '../../applications/components/StatusBadge';
import type { FunnelPoint } from '../lib/analyticsSummary';

const STATUS_COLORS: Record<string, string> = {
  draft: '#9ca3af',
  applied: '#3b82f6',
  interviewing: '#a855f7',
  offered: '#f97316',
  accepted: '#22c55e',
  rejected: '#ef4444',
  withdrawn: '#6b7280',
};

export function StageFunnelChart({ data }: { data: FunnelPoint[] }) {
  const max = Math.max(1, ...data.map((d) => d.count));
  return (
    <View style={styles.chart} testID="stage-funnel-chart">
      {data.map((point) => (
        <View key={point.status} style={styles.row}>
          <Text style={styles.label} numberOfLines={1}>
            {statusLabel(point.status)}
          </Text>
          <View style={styles.track}>
            <View
              style={[
                styles.fill,
                {
                  width: `${(point.count / max) * 100}%`,
                  backgroundColor: STATUS_COLORS[point.status] ?? '#3b82f6',
                },
              ]}
            />
          </View>
          <Text style={styles.count}>{point.count}</Text>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  chart: { gap: 6 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  label: { width: 84, fontSize: 11, color: '#374151' },
  track: { flex: 1, height: 14, borderRadius: 4, backgroundColor: '#f3f4f6', overflow: 'hidden' },
  fill: { height: '100%', borderRadius: 4 },
  count: { width: 24, textAlign: 'right', fontSize: 11, fontWeight: '600', color: '#374151' },
});
