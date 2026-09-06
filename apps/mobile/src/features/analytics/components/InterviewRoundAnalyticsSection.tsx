import React, { useMemo } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { useInterviewRoundAnalytics } from '../hooks/useAnalyticsQueries';
import { AnalyticsCard } from './AnalyticsCard';
import { RatioBar } from './RatioBar';
import { useTheme } from '../../../theme/ThemeContext';
import type { ThemeColors } from '../../../theme/colors';

function formatRounds(n: number | null): string {
  if (n === null) return '—';
  return Number.isInteger(n) ? String(n) : n.toFixed(1);
}

export function InterviewRoundAnalyticsSection() {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const { data, isLoading } = useInterviewRoundAnalytics();

  if (isLoading) return <ActivityIndicator color={colors.primary} />;
  if (!data) return null;

  return (
    <AnalyticsCard
      title="Interview rounds"
      description="Pass rate per round type, and rounds before an outcome."
      testID="interview-round-analytics-section"
    >
      {data.byType.length === 0 ? (
        <Text style={styles.empty}>No interview rounds logged yet.</Text>
      ) : (
        data.byType.map((stat) => {
          const decided = stat.passed + stat.failed;
          const passRate = decided > 0 ? Math.round((stat.passed / decided) * 100) : null;
          return (
            <RatioBar
              key={stat.type}
              label={stat.type}
              meta={`${stat.passed}/${decided}`}
              percent={passRate}
              color="#22c55e"
              sampleSize={decided}
              testID={`interview-round-${stat.type}`}
            />
          );
        })
      )}

      <View style={styles.summaryRow}>
        <View style={styles.summaryCol}>
          <Text style={styles.summaryLabel}>Rounds before offer</Text>
          <Text style={styles.summaryValue}>{formatRounds(data.roundsToOffer.median)} median</Text>
          <Text style={styles.summaryMeta}>
            {data.roundsToOffer.sampleSize > 0
              ? `${data.roundsToOffer.sampleSize} offers`
              : 'No offers yet'}
          </Text>
        </View>
        <View style={styles.summaryCol}>
          <Text style={styles.summaryLabel}>Rounds before rejection</Text>
          <Text style={styles.summaryValue}>
            {formatRounds(data.roundsToRejection.median)} median
          </Text>
          <Text style={styles.summaryMeta}>
            {data.roundsToRejection.sampleSize > 0
              ? `${data.roundsToRejection.sampleSize} rejections`
              : 'No rejections yet'}
          </Text>
        </View>
      </View>
    </AnalyticsCard>
  );
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    empty: { fontSize: 12, color: colors.textFaint },
    summaryRow: {
      flexDirection: 'row',
      gap: 16,
      borderTopWidth: 1,
      borderTopColor: colors.surfaceAlt,
      paddingTop: 10,
      marginTop: 4,
    },
    summaryCol: { flex: 1, gap: 2 },
    summaryLabel: { fontSize: 10, color: colors.textFaint },
    summaryValue: { fontSize: 14, fontWeight: '700', color: colors.text },
    summaryMeta: { fontSize: 10, color: colors.textFaint },
  });
}
