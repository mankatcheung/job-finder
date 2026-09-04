import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import type { WeeklyPoint } from '../lib/analyticsSummary';

const CHART_HEIGHT = 100;

export function WeeklyBarChart({ data }: { data: WeeklyPoint[] }) {
  const max = Math.max(1, ...data.map((d) => d.count));
  return (
    <View style={styles.chart} testID="weekly-bar-chart">
      {data.map((point) => (
        <View key={point.week} style={styles.barColumn}>
          <Text style={styles.barCount}>{point.count}</Text>
          <View style={[styles.bar, { height: Math.max(2, (point.count / max) * CHART_HEIGHT) }]} />
          <Text style={styles.barLabel} numberOfLines={1}>
            {point.week}
          </Text>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  chart: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 6,
    height: CHART_HEIGHT + 36,
  },
  barColumn: { alignItems: 'center', width: 24, justifyContent: 'flex-end', flex: 1 },
  barCount: { fontSize: 9, color: '#6b7280', marginBottom: 2 },
  bar: { width: 14, borderRadius: 3, backgroundColor: '#3b82f6' },
  barLabel: { fontSize: 9, color: '#9ca3af', marginTop: 4 },
});
