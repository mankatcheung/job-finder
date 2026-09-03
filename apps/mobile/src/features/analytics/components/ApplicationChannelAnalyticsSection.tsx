import React from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { useApplicationChannelAnalytics } from '../hooks/useAnalyticsQueries';
import { AnalyticsCard } from './AnalyticsCard';
import { RatioBar } from './RatioBar';
import type { ApplicationGroupStat } from '../types';

function GroupRow({ stat }: { stat: ApplicationGroupStat }) {
  return (
    <View style={styles.groupRow} testID={`channel-group-${stat.label}`}>
      <Text style={styles.groupLabel} numberOfLines={1}>
        {stat.label}
      </Text>
      <Text style={styles.groupCount}>{stat.applicationCount}</Text>
      <RatioBar
        label="Response"
        percent={stat.responseRate}
        color="#a855f7"
        sampleSize={stat.applicationCount}
      />
      <RatioBar
        label="Offer"
        percent={stat.offerRate}
        color="#22c55e"
        sampleSize={stat.applicationCount}
      />
    </View>
  );
}

export function ApplicationChannelAnalyticsSection() {
  const { data, isLoading } = useApplicationChannelAnalytics();

  if (isLoading) return <ActivityIndicator color="#2563eb" />;
  if (!data) return null;

  return (
    <AnalyticsCard
      title="Channels & tags"
      description="Which source or tag is actually working."
      testID="application-channel-analytics-section"
    >
      <Text style={styles.subheading}>By source</Text>
      {data.bySource.length === 0 ? (
        <Text style={styles.empty}>No sources tracked yet.</Text>
      ) : (
        data.bySource.map((stat) => <GroupRow key={stat.label} stat={stat} />)
      )}

      <Text style={styles.subheading}>By tag</Text>
      {data.byTag.length === 0 ? (
        <Text style={styles.empty}>No tags used yet.</Text>
      ) : (
        data.byTag.map((stat) => <GroupRow key={stat.label} stat={stat} />)
      )}
    </AnalyticsCard>
  );
}

const styles = StyleSheet.create({
  subheading: { fontSize: 11, fontWeight: '600', color: '#6b7280', marginTop: 8 },
  empty: { fontSize: 12, color: '#9ca3af' },
  groupRow: {
    gap: 2,
    borderTopWidth: 1,
    borderTopColor: '#f3f4f6',
    paddingTop: 6,
    marginTop: 4,
  },
  groupLabel: { fontSize: 13, fontWeight: '600', color: '#111827' },
  groupCount: { fontSize: 10, color: '#9ca3af' },
});
